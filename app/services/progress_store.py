"""Shared (database-backed) progress store for long-running AI operations.

Progress is reported by the engines during generation and polled by the
frontend via GET /intelligence/progress/{token}.

Progress is persisted in PostgreSQL because the backend runs on an Azure
Functions Consumption plan that auto-scales across multiple instances; a
per-process in-memory store would only be visible to the single instance that
ran the generation, so polls would 404 on other instances and the progress bar
would freeze. Records expire after TTL.
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, text

from app.core.database import async_session_factory
from app.models.generation_progress import GenerationProgress

logger = logging.getLogger(__name__)

TTL_SECONDS = 900.0
_PRUNE_EVERY = 50

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS generation_progress (
    token VARCHAR(128) NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    percent INTEGER NOT NULL DEFAULT 0,
    phase VARCHAR(200) NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


class ProgressStore:
    def __init__(self, ttl: float = TTL_SECONDS) -> None:
        self._ttl = ttl
        self._updates = 0

    async def update(
        self,
        token: str,
        *,
        user_id: str,
        percent: int,
        phase: str,
        message: str,
        status: str = "running",
    ) -> None:
        percent = max(0, min(100, int(percent)))
        try:
            await self._write(
                token,
                user_id=user_id,
                percent=percent,
                phase=phase,
                message=message,
                status=status,
            )
        except Exception:
            # On a fresh deploy the table may not exist yet; create it and retry once.
            await self._ensure_table()
            await self._write(
                token,
                user_id=user_id,
                percent=percent,
                phase=phase,
                message=message,
                status=status,
            )
        self._updates += 1
        if self._updates % _PRUNE_EVERY == 0:
            await self._prune()

    async def _ensure_table(self) -> None:
        try:
            async with async_session_factory() as session:
                async with session.begin():
                    await session.execute(text(_CREATE_TABLE_SQL))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to ensure generation_progress table: %s", str(exc)[:200])

    async def _write(
        self,
        token: str,
        *,
        user_id: str,
        percent: int,
        phase: str,
        message: str,
        status: str,
    ) -> None:
        async with async_session_factory() as session:
            async with session.begin():
                row = await session.get(GenerationProgress, token)
                if row is None:
                    session.add(
                        GenerationProgress(
                            token=token,
                            user_id=user_id,
                            percent=percent,
                            phase=phase,
                            message=message,
                            status=status,
                        )
                    )
                else:
                    row.user_id = user_id
                    row.percent = percent
                    row.phase = phase
                    row.message = message
                    row.status = status

    async def _prune(self) -> None:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=self._ttl)
        try:
            async with async_session_factory() as session:
                async with session.begin():
                    await session.execute(
                        delete(GenerationProgress).where(
                            GenerationProgress.updated_at < cutoff
                        )
                    )
        except Exception as exc:  # pragma: no cover - cleanup must never break writes
            logger.warning("Progress cleanup failed: %s", str(exc)[:200])

    async def get(self, token: str, user_id: str) -> dict | None:
        try:
            async with async_session_factory() as session:
                row = await session.get(GenerationProgress, token)
                if row is None or str(row.user_id) != str(user_id):
                    return None
                updated_at = row.updated_at
                if updated_at is not None:
                    if updated_at.tzinfo is None:
                        updated_at = updated_at.replace(tzinfo=timezone.utc)
                    if datetime.now(timezone.utc) - updated_at > timedelta(seconds=self._ttl):
                        await session.delete(row)
                        await session.commit()
                        return None
                return {
                    "token": row.token,
                    "user_id": str(row.user_id),
                    "percent": row.percent,
                    "phase": row.phase,
                    "message": row.message,
                    "status": row.status,
                }
        except Exception as exc:
            logger.warning("Failed to read progress for token %s: %s", token, str(exc)[:200])
            return None

    async def clear(self, token: str) -> None:
        async with async_session_factory() as session:
            async with session.begin():
                row = await session.get(GenerationProgress, token)
                if row is not None:
                    await session.delete(row)


progress_store = ProgressStore()


class ProgressReporter:
    """Helper bound to a progress token that writes status updates."""

    def __init__(self, token: str | None, user_id: str) -> None:
        self.token = token
        self.user_id = user_id

    async def report(
        self,
        percent: int,
        phase: str,
        message: str,
        status: str = "running",
    ) -> None:
        if not self.token:
            return
        try:
            await progress_store.update(
                self.token,
                user_id=self.user_id,
                percent=percent,
                phase=phase,
                message=message,
                status=status,
            )
        except Exception as exc:  # progress must never break generation
            logger.warning("Failed to record progress for token %s: %s", self.token, str(exc)[:200])
