"""AI-specific exceptions."""

from fastapi import HTTPException, status


class AIError(HTTPException):
    """Base AI error — maps to HTTP 500 by default."""
    def __init__(self, message: str = "AI service error", status_code: int = 500) -> None:
        self.ai_message = message
        super().__init__(status_code=status_code, detail=message)


class AIServiceError(AIError):
    """AI service unavailable or returned an error — maps to 503 by default."""
    def __init__(self, message: str = "AI service unavailable", status_code: int = 503) -> None:
        super().__init__(message=message, status_code=status_code)


class AITimeoutError(AIError):
    """AI request timed out — maps to 504."""
    def __init__(self, message: str = "AI request timed out") -> None:
        super().__init__(message=message, status_code=504)


class AIRateLimitError(HTTPException):
    """AI rate limit exceeded — maps to 429 with Retry-After header."""
    def __init__(self, retry_after: float = 60.0) -> None:
        self.retry_after = retry_after
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"AI rate limit exceeded. Retry after {retry_after:.0f} seconds.",
            headers={"Retry-After": str(int(retry_after))},
        )


class AIValidationError(AIError):
    """AI response failed validation — maps to 502."""
    def __init__(self, message: str = "AI response validation failed") -> None:
        super().__init__(message=message, status_code=502)


class AIRetryExhaustedError(AIError):
    """All retry attempts failed — preserves original status code."""
    def __init__(self, message: str = "AI retry attempts exhausted", attempts: int = 0, original_status_code: int = 503) -> None:
        self.attempts = attempts
        super().__init__(
            message=f"{message} after {attempts} attempts",
            status_code=original_status_code,
        )
