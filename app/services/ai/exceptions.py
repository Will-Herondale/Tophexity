"""AI-specific exceptions."""

from fastapi import HTTPException, status


class AIError(Exception):
    def __init__(self, message: str = "AI service error") -> None:
        self.message = message
        super().__init__(self.message)


class AIServiceError(AIError):
    def __init__(self, message: str = "AI service unavailable", status_code: int = 503) -> None:
        self.status_code = status_code
        super().__init__(message)


class AITimeoutError(AIError):
    def __init__(self, message: str = "AI request timed out") -> None:
        super().__init__(message)


class AIRateLimitError(HTTPException):
    def __init__(self, retry_after: float = 60.0) -> None:
        self.retry_after = retry_after
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"AI rate limit exceeded. Retry after {retry_after:.0f} seconds.",
            headers={"Retry-After": str(int(retry_after))},
        )


class AIValidationError(AIError):
    def __init__(self, message: str = "AI response validation failed") -> None:
        super().__init__(message)


class AIRetryExhaustedError(AIError):
    def __init__(self, message: str = "AI retry attempts exhausted", attempts: int = 0) -> None:
        self.attempts = attempts
        super().__init__(f"{message} after {attempts} attempts")
