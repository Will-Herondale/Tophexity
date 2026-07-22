"""Backend-side rate limiting for AI endpoints."""

import time
from collections import defaultdict
from dataclasses import dataclass, field

from app.core.config import get_settings
from app.core.logging import logger
from app.services.ai.exceptions import AIRateLimitError

settings = get_settings()


@dataclass
class _RateLimitBucket:
    timestamps: list[float] = field(default_factory=list)

    def add(self, now: float) -> None:
        self.timestamps.append(now)

    def prune(self, window_seconds: float) -> None:
        cutoff = time.time() - window_seconds
        self.timestamps = [t for t in self.timestamps if t > cutoff]

    def count(self, window_seconds: float) -> int:
        self.prune(window_seconds)
        return len(self.timestamps)


class RateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, _RateLimitBucket] = defaultdict(_RateLimitBucket)

    def _key(self, scope: str, identifier: str) -> str:
        return f"{scope}:{identifier}"

    def check_and_consume(
        self,
        scope: str,
        identifier: str,
        limit: int,
        window_seconds: float,
    ) -> None:
        """Check rate limit and consume a token. Raises AIRateLimitError if exceeded."""
        key = self._key(scope, identifier)
        bucket = self._buckets[key]
        bucket.prune(window_seconds)
        if len(bucket.timestamps) >= limit:
            oldest = bucket.timestamps[0]
            retry_after = window_seconds - (time.time() - oldest)
            logger.warning(
                "Rate limit exceeded: scope=%s id=%s limit=%d/%.0fs retry_after=%.1fs",
                scope, identifier, limit, window_seconds, retry_after,
            )
            raise AIRateLimitError(retry_after=max(retry_after, 1.0))
        bucket.add(time.time())

    def check_user_rate_limit(self, user_id: str) -> None:
        limit = settings.AI_RATE_LIMIT_PER_USER_PER_MINUTE
        self.check_and_consume("user_minute", user_id, limit, 60.0)

    def check_ip_rate_limit(self, ip: str) -> None:
        limit = settings.AI_RATE_LIMIT_PER_IP_PER_MINUTE
        self.check_and_consume("ip_minute", ip, limit, 60.0)

    def check_conversation_rate_limit(self, conversation_id: str) -> None:
        limit = settings.AI_RATE_LIMIT_PER_CONVERSATION_PER_MINUTE
        self.check_and_consume("conv_minute", conversation_id, limit, 60.0)

    def check_hourly_rate_limit(self, user_id: str) -> None:
        limit = settings.AI_RATE_LIMIT_PER_HOUR
        self.check_and_consume("user_hour", user_id, limit, 3600.0)

    def enforce(
        self,
        user_id: str | None = None,
        ip: str | None = None,
        conversation_id: str | None = None,
    ) -> None:
        """Enforce all applicable rate limits before an AI request."""
        if user_id:
            self.check_user_rate_limit(user_id)
            self.check_hourly_rate_limit(user_id)
        if ip:
            self.check_ip_rate_limit(ip)
        if conversation_id:
            self.check_conversation_rate_limit(conversation_id)

    def get_usage(self, scope: str, identifier: str, window_seconds: float) -> int:
        key = self._key(scope, identifier)
        bucket = self._buckets[key]
        return bucket.count(window_seconds)


rate_limiter = RateLimiter()
