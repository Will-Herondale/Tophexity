"""Azure AI Foundry / Azure OpenAI provider implementation."""

import time
import uuid
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.logging import logger
from app.services.ai.exceptions import AIServiceError, AITimeoutError
from app.services.ai.models import AIRequest, AIResponse, TokenUsage
from app.services.ai.provider import AIProvider
from app.services.ai.token_usage import build_usage

settings = get_settings()


class AzureFoundryProvider(AIProvider):
    def __init__(self) -> None:
        self.endpoint = settings.AI_ENDPOINT.rstrip("/")
        self.api_key = settings.AI_API_KEY
        self.deployment = settings.AI_DEPLOYMENT_NAME
        self.api_version = settings.AI_API_VERSION
        self.timeout = settings.AI_REQUEST_TIMEOUT

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "api-key": self.api_key,
        }

    def _build_url(self) -> str:
        return (
            f"{self.endpoint}/deployments/{self.deployment}/chat/completions"
            f"?api-version={self.api_version}"
        )

    async def complete(self, request: AIRequest) -> AIResponse:
        url = self._build_url()
        payload: dict[str, Any] = {
            "messages": request.messages,
            "temperature": request.temperature or settings.AI_TEMPERATURE,
            "max_tokens": request.max_tokens or settings.AI_MAX_TOKENS,
        }
        if request.response_format:
            payload["response_format"] = {"type": request.response_format}

        request_id = str(uuid.uuid4())
        start = time.perf_counter()

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=self._headers(), json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.TimeoutException as e:
            latency = (time.perf_counter() - start) * 1000
            logger.error("Azure AI timeout after %.0fms: %s", latency, str(e)[:200])
            raise AITimeoutError(f"Azure AI request timed out after {latency:.0f}ms") from e
        except httpx.HTTPStatusError as e:
            latency = (time.perf_counter() - start) * 1000
            status_code = e.response.status_code
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

        choice = data.get("choices", [{}])[0]
        message = choice.get("message", {})
        content = message.get("content", "")
        finish_reason = choice.get("finish_reason", "stop")

        usage_data = data.get("usage", {})
        token_usage = build_usage(
            prompt_tokens=usage_data.get("prompt_tokens", 0),
            completion_tokens=usage_data.get("completion_tokens", 0),
            model=data.get("model", self.deployment),
        )

        logger.info(
            "Azure AI response: request_id=%s model=%s tokens=%d latency=%.0fms",
            request_id, data.get("model", self.deployment),
            token_usage.total_tokens, latency,
        )

        return AIResponse(
            content=content,
            finish_reason=finish_reason,
            token_usage=token_usage,
            model=data.get("model", self.deployment),
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
