"""Admin API router — system metrics, prompt management, and diagnostics."""

from __future__ import annotations

import time
import uuid as _uuid
from datetime import datetime, timezone, timedelta
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db_session
from app.core.config import get_settings
from app.core.logging import logger
from app.models.chat import ChatMessage, ChatSession
from app.models.enums import UserRole
from app.models.user import User
from app.services.ai.analytics import analytics_service
from app.services.ai.circuit_breaker import circuit_breaker
from app.services.ai.monitoring import health_monitor
from app.services.ai.prompt_cache import prompt_cache
from app.services.ai.prompt_loader import (
    get_prompt_metadata,
    list_prompts,
    prompt_exists,
)
from app.services.ai.rate_limiter import rate_limiter
from app.utils.exceptions import BadRequestException, ForbiddenException, NotFoundException

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenException(detail="Admin access required")
    return current_user


@router.get("/metrics", summary="System metrics")
async def get_metrics(
    db: AsyncSession = Depends(get_db_session),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    cutoff_24h = now - timedelta(hours=24)

    settings = get_settings()

    # Total users & active (logged in within 24h)
    user_stats = (await db.execute(
        select(
            func.count(User.id).label("total"),
            func.count(
                case((User.updated_at >= cutoff_24h, 1))
            ).label("active_24h"),
        )
    )).one()

    # Total chat sessions & active (had a message in 24h)
    session_stats = (await db.execute(
        select(
            func.count(ChatSession.id).label("total"),
            func.count(
                case((ChatSession.updated_at >= cutoff_24h, 1))
            ).label("active_24h"),
        )
    )).one()

    # AI request stats from analytics
    ai_summary = await analytics_service.get_summary(db, hours=24)

    # Rate limiter — collect active buckets with recent violations
    rl_stats = _get_rate_limiter_stats()

    # Circuit breaker state
    cb_stats = circuit_breaker.get_stats()

    # Prompt cache stats
    pc_stats = prompt_cache.get_stats()

    return {
        "users": {
            "total": user_stats.total,
            "active_24h": user_stats.active_24h,
        },
        "chat_sessions": {
            "total": session_stats.total,
            "active_24h": session_stats.active_24h,
        },
        "ai_requests_24h": {
            "total": ai_summary["total_requests"],
            "success": ai_summary["successful"],
            "failed": ai_summary["failed"],
            "success_rate_pct": (
                round(ai_summary["successful"] / ai_summary["total_requests"] * 100, 2)
                if ai_summary["total_requests"]
                else 0.0
            ),
            "unique_users": ai_summary["unique_users"],
            "unique_conversations": ai_summary["unique_conversations"],
        },
        "tokens_24h": {
            "total": ai_summary["total_tokens"],
            "estimated_cost_usd": round(ai_summary["total_cost"], 6),
        },
        "latency_24h": {
            "avg_ms": round(ai_summary["avg_latency"], 2),
            "p50_ms": round(ai_summary["p50_latency"], 2),
            "p95_ms": round(ai_summary["p95_latency"], 2),
            "p99_ms": round(ai_summary["p99_latency"], 2),
        },
        "security_24h": {
            "injection_attempts": ai_summary["injection_attempts"],
            "jailbreak_attempts": ai_summary["jailbreak_attempts"],
        },
        "rate_limiter": rl_stats,
        "circuit_breaker": cb_stats,
        "prompt_cache": pc_stats,
    }


@router.get("/prompts", summary="Prompt management")
async def list_all_prompts(
    admin: User = Depends(require_admin),
) -> list[dict[str, Any]]:
    names = list_prompts()
    results: list[dict[str, Any]] = []
    for name in names:
        try:
            meta = get_prompt_metadata(name)
            cache_version = prompt_cache.get_version(name)
            results.append({
                "name": name,
                "version": meta.get("version", 1),
                "description": meta.get("description", ""),
                "char_count": meta.get("char_count", 0),
                "estimated_tokens": meta.get("estimated_tokens", 0),
                "variables": meta.get("variables", []),
                "cache_status": "hit" if cache_version > 0 else "miss",
                "cache_version": cache_version,
                "last_loaded": meta.get("last_loaded_at"),
            })
        except Exception as e:
            logger.warning("Failed to get metadata for prompt '%s': %s", name, str(e)[:200])
            results.append({"name": name, "error": str(e)[:200]})
    return results


@router.get("/prompts/{name}", summary="Prompt details")
async def get_prompt_detail(
    name: str,
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    if not prompt_exists(name):
        raise NotFoundException(detail=f"Prompt '{name}' not found")

    meta = get_prompt_metadata(name)
    cache_version = prompt_cache.get_version(name)

    # Try loading the full content
    full_content = None
    try:
        from app.services.ai.prompt_loader import load_prompt
        full_content = load_prompt(name)
    except Exception as e:
        logger.warning("Failed to load prompt '%s': %s", name, str(e)[:200])
        full_content = f"Error loading prompt: {str(e)[:200]}"

    return {
        "name": name,
        "metadata": meta,
        "content": full_content,
        "cache_status": "active" if cache_version > 0 else "not_cached",
        "cache_version": cache_version,
        "cache_stats": prompt_cache.get_stats(),
    }


@router.post("/prompts/{name}/invalidate", summary="Invalidate prompt cache")
async def invalidate_prompt_cache(
    name: str,
    admin: User = Depends(require_admin),
) -> dict[str, str]:
    if not prompt_exists(name):
        raise NotFoundException(detail=f"Prompt '{name}' not found")
    prompt_cache.invalidate(name)
    logger.info("Admin '%s' invalidated cache for prompt '%s'", admin.email, name)
    return {"status": "ok", "message": f"Cache invalidated for prompt '{name}'"}


@router.post("/cache/clear", summary="Clear all caches")
async def clear_all_caches(
    admin: User = Depends(require_admin),
) -> dict[str, str]:
    prompt_cache.clear()
    logger.info("Admin '%s' cleared all caches", admin.email)
    return {"status": "ok", "message": "All caches cleared"}


@router.get("/diagnostics", summary="System diagnostics")
async def get_diagnostics(
    db: AsyncSession = Depends(get_db_session),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    return await health_monitor.deep_health_check(db)


@router.get("/conversations", summary="Conversation management")
async def list_all_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: str | None = None,
    db: AsyncSession = Depends(get_db_session),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    parsed_user_id: _uuid.UUID | None = None
    if user_id:
        try:
            parsed_user_id = _uuid.UUID(user_id)
        except ValueError:
            raise BadRequestException(detail="Invalid user_id format")

    offset = (page - 1) * page_size

    # Build count query
    count_q = select(func.count(ChatSession.id))
    data_q = (
        select(ChatSession)
        .order_by(ChatSession.updated_at.desc())
        .offset(offset)
        .limit(page_size)
    )

    if parsed_user_id:
        count_q = count_q.where(ChatSession.user_id == parsed_user_id)
        data_q = data_q.where(ChatSession.user_id == parsed_user_id)

    total = (await db.execute(count_q)).scalar_one()
    result = await db.execute(data_q)
    sessions = result.scalars().all()

    items: list[dict[str, Any]] = []
    for s in sessions:
        data = s.session_data or {}
        items.append({
            "id": str(s.id),
            "user_id": str(s.user_id),
            "title": s.title,
            "is_archived": s.is_archived,
            "message_count": data.get("message_count", 0),
            "total_tokens_used": data.get("total_tokens_used", 0),
            "last_model": data.get("last_model"),
            "has_summary": s.summary is not None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        })

    return {
        "conversations": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size if total else 0,
        },
    }


@router.post("/rebuild-summaries", summary="Rebuild conversation summaries")
async def rebuild_all_summaries(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    from app.services.ai.conversation_manager import ConversationManager

    # Find sessions without summaries or with stale summaries
    q = (
        select(ChatSession)
        .where(ChatSession.is_archived == False)  # noqa: E712
        .order_by(ChatSession.updated_at.desc())
        .limit(limit)
    )
    result = await db.execute(q)
    sessions = result.scalars().all()

    rebuilt = 0
    failed = 0
    skipped = 0

    for session in sessions:
        # Load the first user for the session (admin context)
        user_result = await db.execute(select(User).where(User.id == session.user_id))
        owner = user_result.scalar_one_or_none()
        if not owner:
            skipped += 1
            continue

        # Count messages
        msg_count_result = await db.execute(
            select(func.count(ChatMessage.id)).where(ChatMessage.session_id == session.id)
        )
        msg_count = msg_count_result.scalar_one()

        if msg_count < 5:
            skipped += 1
            continue

        try:
            manager = ConversationManager(db, owner)
            await manager.rebuild_memory(session)
            rebuilt += 1
            logger.info("Rebuilt summary for session %s (%d messages)", session.id, msg_count)
        except Exception as e:
            failed += 1
            logger.warning("Failed to rebuild session %s: %s", session.id, str(e)[:200])

    await db.commit()

    return {
        "status": "completed" if failed == 0 else "completed_with_errors",
        "rebuilt": rebuilt,
        "failed": failed,
        "skipped": skipped,
        "total_processed": len(sessions),
    }


@router.get("/rate-limits", summary="Rate limit status")
async def get_rate_limit_status(
    admin: User = Depends(require_admin),
) -> dict[str, Any]:
    return {
        "config": {
            "user_per_minute": get_settings().AI_RATE_LIMIT_PER_USER_PER_MINUTE,
            "user_per_hour": get_settings().AI_RATE_LIMIT_PER_HOUR,
            "user_per_day": get_settings().AI_RATE_LIMIT_PER_USER_PER_DAY,
            "ip_per_minute": get_settings().AI_RATE_LIMIT_PER_IP_PER_MINUTE,
            "conversation_per_minute": get_settings().AI_RATE_LIMIT_PER_CONVERSATION_PER_MINUTE,
        },
        "buckets": _get_rate_limiter_stats(),
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_rate_limiter_stats() -> dict[str, Any]:
    """Snapshot of the rate limiter's in-memory buckets."""
    buckets: dict[str, Any] = {}
    now = time.time()
    for key, bucket in rate_limiter._buckets.items():  # type: ignore[attr-defined]
        # Prune stale timestamps before reading
        # Derive window from key suffix
        window = 60.0
        if "_hour" in key:
            window = 3600.0
        elif "_day" in key:
            window = 86400.0
        bucket.prune(window)
        count = len(bucket.timestamps)
        if count > 0:
            buckets[key] = {
                "count": count,
                "oldest": bucket.timestamps[0] if bucket.timestamps else None,
                "newest": bucket.timestamps[-1] if bucket.timestamps else None,
            }
    return {
        "active_buckets": len(buckets),
        "buckets": buckets,
    }
