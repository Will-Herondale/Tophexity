"""Retry logic with exponential backoff for AI requests."""

import asyncio
import random

from app.core.config import get_settings
from app.core.logging import logger
from app.services.ai.exceptions import (
    AIRetryExhaustedError,
    AIServiceError,
    AITimeoutError,
)

settings = get_settings()


def is_retryable_error(exc: Exception) -> bool:
    """Check if an exception is retryable."""
    if isinstance(exc, (AITimeoutError, ConnectionError, TimeoutError)):
        return True
    if isinstance(exc, AIServiceError):
        return exc.status_code in (429, 500, 502, 503, 504)
    if isinstance(exc, Exception):
        msg = str(exc).lower()
        retryable_keywords = [
            "timeout", "connection", "reset", "refused",
            "500", "502", "503", "504", "429",
            "rate limit", "overloaded", "throttl",
        ]
        return any(kw in msg for kw in retryable_keywords)
    return False


def calculate_delay(attempt: int) -> float:
    """Calculate exponential backoff delay with jitter."""
    base = settings.AI_RETRY_BASE_DELAY
    max_delay = settings.AI_RETRY_MAX_DELAY
    delay = min(base * (2 ** attempt), max_delay)
    jitter = random.uniform(0, delay * 0.25)
    return delay + jitter


async def retry_with_backoff(
    func,
    *args,
    max_retries: int | None = None,
    **kwargs,
) -> object:
    """Execute an async function with retry logic and exponential backoff."""
    retries = max_retries if max_retries is not None else settings.AI_MAX_RETRIES
    last_exception: Exception | None = None
    attempt = 0

    while attempt <= retries:
        try:
            return await func(*args, **kwargs)
        except Exception as exc:
            last_exception = exc
            if not is_retryable_error(exc) or attempt >= retries:
                break
            delay = calculate_delay(attempt)
            logger.warning(
                "AI request attempt %d/%d failed: %s. Retrying in %.1fs",
                attempt + 1, retries + 1, str(exc)[:200], delay,
            )
            await asyncio.sleep(delay)
            attempt += 1

    if last_exception:
        raise AIRetryExhaustedError(
            message=str(last_exception), attempts=retries + 1
        )
    raise AIServiceError("Unexpected retry error")
