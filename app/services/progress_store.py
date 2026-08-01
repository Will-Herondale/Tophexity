"""In-memory progress store for long-running AI operations.

Progress is reported by the engine during generation and polled by the
frontend via GET /intelligence/progress/{token}. Records expire after TTL.
"""

import threading
import time
from typing import TypedDict


class ProgressRecord(TypedDict):
    user_id: str
    percent: int
    phase: str
    message: str
    status: str
    updated_at: float


class ProgressStore:
    def __init__(self, ttl: float = 900.0, max_records: int = 256) -> None:
        self._records: dict[str, ProgressRecord] = {}
        self._lock = threading.Lock()
        self._ttl = ttl
        self._max_records = max_records

    def _prune(self) -> None:
        now = time.monotonic()
        expired = [
            token for token, rec in self._records.items()
            if now - rec["updated_at"] > self._ttl
        ]
        for token in expired:
            self._records.pop(token, None)

    def update(
        self,
        token: str,
        *,
        user_id: str,
        percent: int,
        phase: str,
        message: str,
        status: str = "running",
    ) -> None:
        with self._lock:
            self._records[token] = {
                "user_id": user_id,
                "percent": max(0, min(100, int(percent))),
                "phase": phase,
                "message": message,
                "status": status,
                "updated_at": time.monotonic(),
            }
            if len(self._records) > self._max_records:
                self._prune()
                oldest = sorted(self._records.items(), key=lambda kv: kv[1]["updated_at"])
                for token, _ in oldest[: len(self._records) - self._max_records]:
                    self._records.pop(token, None)

    def get(self, token: str) -> ProgressRecord | None:
        with self._lock:
            self._prune()
            rec = self._records.get(token)
            if rec is None:
                return None
            if time.monotonic() - rec["updated_at"] > self._ttl:
                self._records.pop(token, None)
                return None
            return rec

    def clear(self, token: str) -> None:
        with self._lock:
            self._records.pop(token, None)


progress_store = ProgressStore()


class ProgressReporter:
    """Helper bound to a progress token that writes status updates."""

    def __init__(self, token: str | None, user_id: str) -> None:
        self.token = token
        self.user_id = user_id

    def report(
        self,
        percent: int,
        phase: str,
        message: str,
        status: str = "running",
    ) -> None:
        if not self.token:
            return
        progress_store.update(
            self.token,
            user_id=self.user_id,
            percent=percent,
            phase=phase,
            message=message,
            status=status,
        )
