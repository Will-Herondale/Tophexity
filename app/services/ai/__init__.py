"""AI module - unified AI platform for Tophexity backend."""

from app.services.ai.client import AIClient, get_ai_client
from app.services.ai.exceptions import (
    AIError,
    AIRateLimitError,
    AIRetryExhaustedError,
    AIServiceError,
    AIValidationError,
    AITimeoutError,
)
from app.services.ai.health import check_ai_health
from app.services.ai.models import AIRequest, AIResponse, TokenUsage
from app.services.ai.security import (
    InputSanitizer,
    JailbreakDetector,
    PromptInjectionDetector,
    SecretProtector,
    SecurityCheckResult,
    SecurityMiddleware,
)

__all__ = [
    "AIClient",
    "get_ai_client",
    "AIRequest",
    "AIResponse",
    "TokenUsage",
    "AIError",
    "AIServiceError",
    "AITimeoutError",
    "AIRateLimitError",
    "AIValidationError",
    "AIRetryExhaustedError",
    "check_ai_health",
    "InputSanitizer",
    "JailbreakDetector",
    "PromptInjectionDetector",
    "SecretProtector",
    "SecurityCheckResult",
    "SecurityMiddleware",
]
