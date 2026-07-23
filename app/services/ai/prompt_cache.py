"""In-memory prompt cache with TTL-based expiry and version tracking."""

import time
from dataclasses import dataclass, field

from app.core.config import get_settings
from app.core.logging import logger
from app.services.ai.prompt_loader import load_prompt


@dataclass
class _CacheEntry:
    content: str
    loaded_at: float = field(default_factory=time.time)
    version: int = 1


@dataclass
class _CacheStats:
    hits: int = 0
    misses: int = 0
    evictions: int = 0
    total_loaded: int = 0

    def to_dict(self) -> dict:
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0.0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "total_loaded": self.total_loaded,
            "total_requests": total,
            "hit_rate_pct": round(hit_rate, 2),
        }


class PromptCache:
    def __init__(self, ttl_seconds: float | None = None) -> None:
        self._cache: dict[str, _CacheEntry] = {}
        if ttl_seconds is not None:
            self._ttl = ttl_seconds
        else:
            settings = get_settings()
            self._ttl = settings.AI_PROMPT_CACHE_TTL
        self._stats = _CacheStats()

    def get(self, name: str) -> str:
        entry = self._cache.get(name)
        if entry and (time.time() - entry.loaded_at) < self._ttl:
            self._stats.hits += 1
            return entry.content

        self._stats.misses += 1
        content = load_prompt(name)

        # Eviction tracking: if replacing an existing expired entry
        if entry is not None:
            self._stats.evictions += 1

        self._cache[name] = _CacheEntry(content=content)
        self._stats.total_loaded += 1
        return content

    def invalidate(self, name: str) -> None:
        self._cache.pop(name, None)
        logger.debug("Cache invalidated for prompt: %s", name)

    def clear(self) -> None:
        self._cache.clear()
        logger.debug("Prompt cache cleared")

    def get_version(self, name: str) -> int:
        entry = self._cache.get(name)
        return entry.version if entry else 0

    def get_stats(self) -> dict:
        """Return cache performance metrics."""
        return {
            **self._stats.to_dict(),
            "ttl_seconds": self._ttl,
            "active_entries": len(self._cache),
        }


prompt_cache = PromptCache()
