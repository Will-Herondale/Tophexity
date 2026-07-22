"""In-memory prompt cache with TTL-based expiry."""

import time
from dataclasses import dataclass, field

from app.core.logging import logger
from app.services.ai.prompt_loader import load_prompt


@dataclass
class _CacheEntry:
    content: str
    loaded_at: float = field(default_factory=time.time)
    version: int = 1


class PromptCache:
    def __init__(self, ttl_seconds: float = 300.0) -> None:
        self._cache: dict[str, _CacheEntry] = {}
        self._ttl = ttl_seconds

    def get(self, name: str) -> str:
        entry = self._cache.get(name)
        if entry and (time.time() - entry.loaded_at) < self._ttl:
            return entry.content
        content = load_prompt(name)
        self._cache[name] = _CacheEntry(content=content)
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


prompt_cache = PromptCache()
