"""Azure AI Foundry / Azure OpenAI provider implementation.

Uses the official `openai` Python SDK with AsyncAzureOpenAI client.
"""

import time
import uuid

import openai
from openai import AsyncAzureOpenAI

from app.core.config import get_settings
from app.core.logging import logger
from app.services.ai.exceptions import AIServiceError, AITimeoutError
from app.services.ai.models import AIRequest, AIResponse, TokenUsage
from app.services.ai.provider import AIProvider
from app.services.ai.token_usage import build_usage

settings = get_settings()


def _normalize_azure_endpoint(endpoint: str) -> str:
    cleaned = endpoint.strip().rstrip("/")
    marker = "/openai/v1"
    marker_index = cleaned.lower().find(marker)
    if marker_index != -1:
        cleaned = cleaned[:marker_index]
    return cleaned.rstrip("/")


class AzureFoundryProvider(AIProvider):
    def __init__(self) -> None:
        raw_endpoint = settings.AI_ENDPOINT
        self.endpoint = _normalize_azure_endpoint(raw_endpoint)
        self.api_key = settings.AI_API_KEY
        self.deployment = settings.AI_DEPLOYMENT_NAME
        self.api_version = settings.AI_API_VERSION
        self.timeout = settings.AI_REQUEST_TIMEOUT
        self._client: AsyncAzureOpenAI | None = None

        if self.endpoint != raw_endpoint.strip().rstrip("/"):
            logger.info(
                "Normalized AI endpoint for Azure SDK: %s -> %s",
                raw_endpoint,
                self.endpoint,
            )

    @property
    def client(self) -> AsyncAzureOpenAI:
        if self._client is None:
            self._client = AsyncAzureOpenAI(
                azure_endpoint=self.endpoint,
                api_key=self.api_key,
                api_version=self.api_version,
                timeout=self.timeout,
            )
        return self._client

    async def complete(self, request: AIRequest) -> AIResponse:
        request_id = str(uuid.uuid4())
        start = time.perf_counter()

        kwargs: dict = {
            "model": self.deployment,
            "messages": request.messages,
            "max_completion_tokens": request.max_tokens or settings.AI_MAX_TOKENS,
        }
        if request.response_format:
            kwargs["response_format"] = {"type": request.response_format}

        try:
            response = await self.client.chat.completions.create(**kwargs)
        except openai.APITimeoutError as e:
            latency = (time.perf_counter() - start) * 1000
            logger.error("Azure AI timeout after %.0fms: %s", latency, str(e)[:200])
            raise AITimeoutError(f"Azure AI request timed out after {latency:.0f}ms") from e
        except openai.APIStatusError as e:
            latency = (time.perf_counter() - start) * 1000
            status_code = e.status_code
            logger.error("Azure AI HTTP %d after %.0fms: %s", status_code, latency, str(e)[:200])
            raise AIServiceError(
                f"Azure AI returned status {status_code}",
                status_code=status_code,
            ) from e
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000
            logger.error("Azure AI error after %.0fms: %s", latency, str(e)[:200])
            raise AIServiceError(f"Azure AI connection error: {e}") from e

        latency = (time.perf_counter() - start) * 1000

        choice = response.choices[0] if response.choices else None
        content = choice.message.content if choice and choice.message else ""
        finish_reason = str(choice.finish_reason) if choice and choice.finish_reason else "stop"

        usage_data = response.usage
        token_usage = build_usage(
            prompt_tokens=usage_data.prompt_tokens if usage_data else 0,
            completion_tokens=usage_data.completion_tokens if usage_data else 0,
            model=response.model or self.deployment,
        )

        logger.info(
            "Azure AI response: request_id=%s model=%s tokens=%d latency=%.0fms",
            request_id, response.model or self.deployment,
            token_usage.total_tokens, latency,
        )

        return AIResponse(
            content=content or "",
            finish_reason=finish_reason,
            token_usage=token_usage,
            model=response.model or self.deployment,
            latency_ms=latency,
            request_id=request_id,
        )

    async def health_check(self) -> dict:
        start = time.perf_counter()
        try:
            test_request = AIRequest(
                messages=[{"role": "user", "content": "Reply with only the word 'ok'."}],
                max_tokens=5,
                temperature=0.0,
            )
            response = await self.complete(test_request)
            latency = (time.perf_counter() - start) * 1000
            return {
                "status": "healthy",
                "azure_connected": True,
                "deployment_available": True,
                "authentication_valid": True,
                "latency_ms": round(latency, 1),
                "model": response.model,
                "endpoint": self.endpoint,
                "error": None,
            }
        except Exception as e:
            latency = (time.perf_counter() - start) * 1000
            logger.error("Azure AI health check failed: %s", str(e)[:200])
            return {
                "status": "unhealthy",
                "azure_connected": False,
                "deployment_available": False,
                "authentication_valid": False,
                "latency_ms": round(latency, 1),
                "model": self.deployment,
                "endpoint": self.endpoint,
                "error": str(e)[:500],
            }
