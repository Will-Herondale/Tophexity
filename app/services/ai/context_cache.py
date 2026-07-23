from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from app.core.logging import logger


@dataclass
class _CacheEntry:
    data: Any
    loaded_at: float
    version: int = 1


class ContextCache:
    """TTL-based cache for user context (profile, portfolio, etc.).

    Keyed by (user_id, context_type). Avoids redundant DB queries
    for the same user within the TTL window.
    """

    def __init__(self, ttl_seconds: float = 60.0, max_entries: int = 500):
        self._cache: dict[str, _CacheEntry] = {}
        self._ttl = ttl_seconds
        self._max_entries = max_entries
        self._hits = 0
        self._misses = 0

    def _key(self, user_id: UUID | str, context_type: str) -> str:
        return f"{user_id}:{context_type}"

    def get(self, user_id: UUID | str, context_type: str) -> Any | None:
        key = self._key(user_id, context_type)
        entry = self._cache.get(key)
        if entry is None:
            self._misses += 1
            return None
        if (time.monotonic() - entry.loaded_at) > self._ttl:
            del self._cache[key]
            self._misses += 1
            return None
        self._hits += 1
        return entry.data

    def set(self, user_id: UUID | str, context_type: str, data: Any) -> None:
        key = self._key(user_id, context_type)
        if key not in self._cache and len(self._cache) >= self._max_entries:
            self._evict_oldest()
        self._cache[key] = _CacheEntry(data=data, loaded_at=time.monotonic())

    def invalidate(self, user_id: UUID | str, context_type: str | None = None) -> int:
        if context_type is not None:
            key = self._key(user_id, context_type)
            if key in self._cache:
                del self._cache[key]
                return 1
            return 0
        prefix = f"{user_id}:"
        keys = [k for k in self._cache if k.startswith(prefix)]
        count = len(keys)
        for k in keys:
            del self._cache[k]
        return count

    def clear(self) -> int:
        count = len(self._cache)
        self._cache.clear()
        return count

    def get_stats(self) -> dict:
        total = self._hits + self._misses
        return {
            "entries": len(self._cache),
            "max_entries": self._max_entries,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total, 4) if total else 0.0,
            "ttl_seconds": self._ttl,
        }

    def _evict_oldest(self) -> None:
        if not self._cache:
            return
        oldest_key = min(self._cache, key=lambda k: self._cache[k].loaded_at)
        del self._cache[oldest_key]


context_cache = ContextCache(ttl_seconds=60.0)
