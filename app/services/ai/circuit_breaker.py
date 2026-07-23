from __future__ import annotations

import time
from enum import Enum
from dataclasses import dataclass, field

from app.core.config import get_settings
from app.core.logging import logger


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreaker:
    """
    Circuit breaker for AI service calls.

    States:
    - CLOSED: Normal operation. Requests pass through. Failures counted.
    - OPEN: Too many failures. All requests rejected immediately.
    - HALF_OPEN: After timeout, one test request is allowed through.
      - If it succeeds -> CLOSED
      - If it fails   -> OPEN (reset timer)
    """

    failure_threshold: int = 5
    recovery_timeout: float = 60.0
    half_open_max_calls: int = 1

    _state: CircuitState = field(default=CircuitState.CLOSED, init=False)
    _failure_count: int = field(default=0, init=False)
    _success_count: int = field(default=0, init=False)
    _last_failure_time: float = field(default=0.0, init=False)
    _half_open_calls: int = field(default=0, init=False)
    _total_requests: int = field(default=0, init=False)
    _total_failures: int = field(default=0, init=False)
    _total_rejections: int = field(default=0, init=False)

    @property
    def state(self) -> CircuitState:
        if self._state == CircuitState.OPEN:
            elapsed = time.monotonic() - self._last_failure_time
            if elapsed >= self.recovery_timeout:
                self._state = CircuitState.HALF_OPEN
                self._half_open_calls = 0
                logger.info(
                    "Circuit breaker: OPEN -> HALF_OPEN after %.1fs", elapsed,
                )
        return self._state

    def record_success(self) -> None:
        current = self.state
        self._success_count += 1

        if current == CircuitState.HALF_OPEN:
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            self._half_open_calls = 0
            logger.info("Circuit breaker: HALF_OPEN -> CLOSED (success)")
        elif current == CircuitState.CLOSED:
            self._failure_count = 0

    def record_failure(self) -> None:
        current = self.state
        self._failure_count += 1
        self._total_failures += 1
        self._last_failure_time = time.monotonic()

        if current == CircuitState.HALF_OPEN:
            self._state = CircuitState.OPEN
            self._half_open_calls = 0
            logger.warning(
                "Circuit breaker: HALF_OPEN -> OPEN (test call failed)",
            )
        elif current == CircuitState.CLOSED:
            if self._failure_count >= self.failure_threshold:
                self._state = CircuitState.OPEN
                logger.warning(
                    "Circuit breaker: CLOSED -> OPEN (failures=%d, threshold=%d)",
                    self._failure_count,
                    self.failure_threshold,
                )

    def allow_request(self) -> bool:
        self._total_requests += 1
        current = self.state

        if current == CircuitState.CLOSED:
            return True

        if current == CircuitState.HALF_OPEN:
            if self._half_open_calls < self.half_open_max_calls:
                self._half_open_calls += 1
                return True
            self._total_rejections += 1
            return False

        self._total_rejections += 1
        elapsed = time.monotonic() - self._last_failure_time
        remaining = max(0.0, self.recovery_timeout - elapsed)
        logger.info(
            "Circuit breaker OPEN: rejecting request (retry in %.0fs)", remaining,
        )
        return False

    def reset(self) -> None:
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        logger.info("Circuit breaker: manually reset to CLOSED")

    def get_stats(self) -> dict:
        return {
            "state": self.state.value,
            "failure_count": self._failure_count,
            "success_count": self._success_count,
            "last_failure_time": self._last_failure_time,
            "total_requests": self._total_requests,
            "total_failures": self._total_failures,
            "total_rejections": self._total_rejections,
            "failure_threshold": self.failure_threshold,
            "recovery_timeout": self.recovery_timeout,
        }


class CircuitOpenError(Exception):
    """Raised when circuit breaker is open."""

    def __init__(self, retry_after: float):
        self.retry_after = retry_after
        super().__init__(
            f"Circuit breaker is open. Retry after {retry_after:.0f}s"
        )


def _create_circuit_breaker() -> CircuitBreaker:
    settings = get_settings()
    return CircuitBreaker(
        failure_threshold=settings.AI_CIRCUIT_BREAKER_THRESHOLD,
        recovery_timeout=settings.AI_CIRCUIT_BREAKER_TIMEOUT,
    )


circuit_breaker = _create_circuit_breaker()
