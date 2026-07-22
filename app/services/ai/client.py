"""Main AI Client - single interface for all AI operations.

Only AIClient communicates with Azure AI.
Nothing else should directly call Azure.
"""

import uuid
from functools import lru_cache

from app.core.config import get_settings
from app.core.logging import logger
from app.services.ai.azure_foundry import AzureFoundryProvider
from app.services.ai.exceptions import AIError, AIRateLimitError, AIServiceError
from app.services.ai.models import AIRequest, AIResponse
from app.services.ai.prompt_cache import prompt_cache
from app.services.ai.rate_limiter import rate_limiter
from app.services.ai.retry import retry_with_backoff
from app.services.ai.token_usage import track_usage

settings = get_settings()


class AIClient:
    """Unified AI client with retry, rate limiting, and token tracking."""

    def __init__(self) -> None:
        self._provider: AzureFoundryProvider | None = None

    @property
    def provider(self) -> AzureFoundryProvider:
        if self._provider is None:
            self._provider = AzureFoundryProvider()
        return self._provider

    @property
    def is_configured(self) -> bool:
        return bool(settings.AI_API_KEY and settings.AI_ENDPOINT)

    async def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float | None = None,
        max_tokens: int | None = None,
        user_id: str | None = None,
        conversation_id: str | None = None,
        ip: str | None = None,
    ) -> AIResponse:
        if not self.is_configured:
            raise AIServiceError("AI service not configured", status_code=503)

        rate_limiter.enforce(
            user_id=user_id, ip=ip, conversation_id=conversation_id,
        )

        request = AIRequest(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        request_id = str(uuid.uuid4())
        logger.info("AI chat request: request_id=%s user=%s conv=%s messages=%d",
                     request_id, user_id, conversation_id, len(messages))

        try:
            response = await retry_with_backoff(self.provider.complete, request)
            track_usage(
                prompt_tokens=response.token_usage.prompt_tokens,
                completion_tokens=response.token_usage.completion_tokens,
                model=response.model,
                latency_ms=response.latency_ms,
                user_id=user_id,
                conversation_id=conversation_id,
                request_id=request_id,
                status="success",
            )
            return response
        except AIRateLimitError:
            raise
        except AIError as e:
            track_usage(
                prompt_tokens=0, completion_tokens=0,
                model=settings.AI_DEPLOYMENT_NAME,
                latency_ms=0, user_id=user_id,
                conversation_id=conversation_id,
                request_id=request_id,
                status="error",
            )
            raise

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        user_id: str | None = None,
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.chat(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            user_id=user_id,
        )
        return response.content

    async def generate_json(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
        user_id: str | None = None,
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = await self.chat(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            user_id=user_id,
        )
        return response.content

    async def health(self) -> dict:
        if not self.is_configured:
            return {
                "status": "unconfigured",
                "azure_connected": False,
                "deployment_available": False,
                "authentication_valid": False,
                "latency_ms": None,
                "model": settings.AI_DEPLOYMENT_NAME,
                "endpoint": settings.AI_ENDPOINT,
                "error": "AI_API_KEY or AI_ENDPOINT not configured",
            }
        return await self.provider.health_check()


_ai_client: AIClient | None = None


def get_ai_client() -> AIClient:
    global _ai_client
    if _ai_client is None:
        _ai_client = AIClient()
    return _ai_client
