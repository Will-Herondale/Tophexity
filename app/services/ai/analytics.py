"""Analytics tracking service that persists to database."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Any

from sqlalchemy import select, func, text, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.ai_analytics import AIUsageLog, AIHealthSnapshot
from app.utils.exceptions import safe_flush


class AnalyticsService:
    """Track and query AI usage analytics."""

    async def log_request(
        self,
        db: AsyncSession,
        *,
        request_id: str,
        user_id: uuid.UUID | None = None,
        conversation_id: uuid.UUID | None = None,
        model: str,
        deployment: str = "",
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        total_tokens: int = 0,
        estimated_cost_usd: float = 0.0,
        latency_ms: float = 0.0,
        endpoint: str | None = None,
        prompt_version: str | None = None,
        prompt_name: str | None = None,
        status: str = "success",
        error_message: str | None = None,
        retry_count: int = 0,
        injection_detected: bool = False,
        jailbreak_detected: bool = False,
        meta: dict | None = None,
    ) -> None:
        """Persist a single AI usage record."""
        log_entry = AIUsageLog(
            request_id=request_id,
            user_id=user_id,
            conversation_id=conversation_id,
            model=model,
            deployment=deployment,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=estimated_cost_usd,
            latency_ms=latency_ms,
            endpoint=endpoint,
            prompt_version=prompt_version,
            prompt_name=prompt_name,
            status=status,
            error_message=error_message,
            retry_count=retry_count,
            injection_detected=injection_detected,
            jailbreak_detected=jailbreak_detected,
            meta=meta,
        )
        db.add(log_entry)
        await safe_flush(db)
        logger.debug(
            "Logged AI request %s: model=%s tokens=%d cost=%.6f latency=%.1fms",
            request_id, model, total_tokens, estimated_cost_usd, latency_ms,
        )

    async def log_health_snapshot(
        self,
        db: AsyncSession,
        *,
        status: str,
        azure_connected: bool,
        deployment_available: bool,
        authentication_valid: bool,
        latency_ms: float | None,
        model: str,
        endpoint: str,
        error: str | None,
    ) -> None:
        """Record a health check snapshot."""
        snapshot = AIHealthSnapshot(
            status=status,
            azure_connected=azure_connected,
            deployment_available=deployment_available,
            authentication_valid=authentication_valid,
            latency_ms=latency_ms,
            model=model,
            endpoint=endpoint,
            error=error,
        )
        db.add(snapshot)
        await safe_flush(db)
        logger.debug("Recorded health snapshot: status=%s", status)

    async def get_summary(
        self, db: AsyncSession, *, hours: int = 24
    ) -> dict[str, Any]:
        """Get aggregated analytics for the given time window."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

        # Base counts
        stats_q = select(
            func.count(AIUsageLog.id).label("total_requests"),
            func.count(
                case((AIUsageLog.status == "success", 1))
            ).label("successful"),
            func.count(
                case((AIUsageLog.status != "success", 1))
            ).label("failed"),
            func.coalesce(func.sum(AIUsageLog.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(AIUsageLog.estimated_cost_usd), 0.0).label("total_cost"),
            func.coalesce(func.avg(AIUsageLog.latency_ms), 0.0).label("avg_latency"),
            func.count(func.distinct(AIUsageLog.user_id)).label("unique_users"),
            func.count(func.distinct(AIUsageLog.conversation_id)).label("unique_conversations"),
            func.count(
                case((AIUsageLog.injection_detected == True, 1))  # noqa: E712
            ).label("injection_attempts"),
            func.count(
                case((AIUsageLog.jailbreak_detected == True, 1))  # noqa: E712
            ).label("jailbreak_attempts"),
        ).where(AIUsageLog.created_at >= cutoff)

        row = (await db.execute(stats_q)).one()

        # Percentiles via ordered subqueries
        p50 = await self._percentile(db, cutoff, 0.50)
        p95 = await self._percentile(db, cutoff, 0.95)
        p99 = await self._percentile(db, cutoff, 0.99)

        # Model breakdown
        model_q = (
            select(
                AIUsageLog.model,
                func.count(AIUsageLog.id).label("count"),
                func.coalesce(func.sum(AIUsageLog.total_tokens), 0).label("tokens"),
                func.coalesce(func.sum(AIUsageLog.estimated_cost_usd), 0.0).label("cost"),
            )
            .where(AIUsageLog.created_at >= cutoff)
            .group_by(AIUsageLog.model)
        )
        model_rows = (await db.execute(model_q)).all()
        model_breakdown = {
            r.model: {"count": r.count, "tokens": int(r.tokens), "cost": float(r.cost)}
            for r in model_rows
        }

        # Hourly breakdown
        hourly_q = (
            select(
                func.date_trunc("hour", AIUsageLog.created_at).label("hour"),
                func.count(AIUsageLog.id).label("requests"),
                func.coalesce(func.sum(AIUsageLog.total_tokens), 0).label("tokens"),
                func.coalesce(func.sum(AIUsageLog.estimated_cost_usd), 0.0).label("cost"),
            )
            .where(AIUsageLog.created_at >= cutoff)
            .group_by(text("hour"))
            .order_by(text("hour"))
        )
        hourly_rows = (await db.execute(hourly_q)).all()
        hourly_breakdown = [
            {
                "hour": r.hour.isoformat() if r.hour else None,
                "requests": r.requests,
                "tokens": int(r.tokens),
                "cost": float(r.cost),
            }
            for r in hourly_rows
        ]

        return {
            "total_requests": row.total_requests,
            "successful": row.successful,
            "failed": row.failed,
            "total_tokens": int(row.total_tokens),
            "total_cost": float(row.total_cost),
            "avg_latency": float(row.avg_latency),
            "p50_latency": p50,
            "p95_latency": p95,
            "p99_latency": p99,
            "unique_users": row.unique_users,
            "unique_conversations": row.unique_conversations,
            "injection_attempts": row.injection_attempts,
            "jailbreak_attempts": row.jailbreak_attempts,
            "model_breakdown": model_breakdown,
            "hourly_breakdown": hourly_breakdown,
        }

    async def get_user_usage(
        self, db: AsyncSession, user_id: uuid.UUID, *, hours: int = 24
    ) -> dict[str, Any]:
        """Get usage stats for a specific user."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)

        q = select(
            func.count(AIUsageLog.id).label("total_requests"),
            func.count(
                case((AIUsageLog.status == "success", 1))
            ).label("successful"),
            func.count(
                case((AIUsageLog.status != "success", 1))
            ).label("failed"),
            func.coalesce(func.sum(AIUsageLog.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(AIUsageLog.estimated_cost_usd), 0.0).label("total_cost"),
            func.coalesce(func.avg(AIUsageLog.latency_ms), 0.0).label("avg_latency"),
            func.count(func.distinct(AIUsageLog.conversation_id)).label("conversations"),
            func.count(
                case((AIUsageLog.injection_detected == True, 1))  # noqa: E712
            ).label("injection_attempts"),
        ).where(
            AIUsageLog.user_id == user_id,
            AIUsageLog.created_at >= cutoff,
        )

        row = (await db.execute(q)).one()

        # Model breakdown for this user
        model_q = (
            select(
                AIUsageLog.model,
                func.count(AIUsageLog.id).label("count"),
                func.coalesce(func.sum(AIUsageLog.total_tokens), 0).label("tokens"),
                func.coalesce(func.sum(AIUsageLog.estimated_cost_usd), 0.0).label("cost"),
            )
            .where(AIUsageLog.user_id == user_id, AIUsageLog.created_at >= cutoff)
            .group_by(AIUsageLog.model)
        )
        model_rows = (await db.execute(model_q)).all()
        model_breakdown = {
            r.model: {"count": r.count, "tokens": int(r.tokens), "cost": float(r.cost)}
            for r in model_rows
        }

        return {
            "total_requests": row.total_requests,
            "successful": row.successful,
            "failed": row.failed,
            "total_tokens": int(row.total_tokens),
            "total_cost": float(row.total_cost),
            "avg_latency": float(row.avg_latency),
            "conversations": row.conversations,
            "injection_attempts": row.injection_attempts,
            "model_breakdown": model_breakdown,
        }

    async def get_recent_logs(
        self,
        db: AsyncSession,
        *,
        limit: int = 50,
        offset: int = 0,
        status: str | None = None,
        user_id: uuid.UUID | None = None,
    ) -> list[AIUsageLog]:
        """Get recent usage logs with optional filters."""
        q = select(AIUsageLog).order_by(AIUsageLog.created_at.desc())
        if status is not None:
            q = q.where(AIUsageLog.status == status)
        if user_id is not None:
            q = q.where(AIUsageLog.user_id == user_id)
        q = q.offset(offset).limit(limit)
        result = await db.execute(q)
        return list(result.scalars().all())

    async def cleanup_old_logs(self, db: AsyncSession, *, days: int = 90) -> int:
        """Delete logs older than N days. Returns count deleted."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        q = select(AIUsageLog).where(AIUsageLog.created_at < cutoff)
        result = await db.execute(q)
        old_logs = result.scalars().all()
        count = len(old_logs)
        for log_entry in old_logs:
            await db.delete(log_entry)
        await safe_flush(db)
        logger.info("Cleaned up %d AI usage logs older than %d days", count, days)
        return count

    async def _percentile(
        self, db: AsyncSession, cutoff: datetime, percentile: float
    ) -> float:
        """Compute a latency percentile using ordered-position approximation."""
        subq = (
            select(
                AIUsageLog.latency_ms,
                func.row_number().over(order_by=AIUsageLog.latency_ms).label("rn"),
                func.count(AIUsageLog.id).over().label("total"),
            )
            .where(
                AIUsageLog.created_at >= cutoff,
                AIUsageLog.latency_ms > 0,
            )
            .subquery()
        )
        target_row = int(round(percentile * 100))
        q = select(subq.c.latency_ms).where(
            (subq.c.rn * 100) >= (target_row * subq.c.total)
        ).limit(1)
        result = await db.execute(q)
        val = result.scalar_one_or_none()
        return float(val) if val is not None else 0.0


analytics_service = AnalyticsService()
