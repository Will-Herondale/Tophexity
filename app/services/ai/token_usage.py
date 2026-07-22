"""Token usage tracking and cost estimation."""

import uuid
from datetime import datetime, timezone

from app.core.logging import logger
from app.services.ai.models import TokenUsage, TokenUsageLog

# Approximate pricing per 1K tokens (USD) - GPT-5 estimates
_PRICING = {
    "gpt-5": {"input": 0.015, "output": 0.060},
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
}

_history: list[TokenUsageLog] = []


def estimate_cost(
    prompt_tokens: int,
    completion_tokens: int,
    model: str = "gpt-5",
) -> float:
    """Estimate cost in USD for the given token counts."""
    pricing = _PRICING.get(model, _PRICING["gpt-5"])
    input_cost = (prompt_tokens / 1000.0) * pricing["input"]
    output_cost = (completion_tokens / 1000.0) * pricing["output"]
    return round(input_cost + output_cost, 6)


def track_usage(
    prompt_tokens: int,
    completion_tokens: int,
    model: str = "gpt-5",
    latency_ms: float = 0.0,
    user_id: object = None,
    conversation_id: object = None,
    request_id: str | None = None,
    status: str = "success",
    retry_count: int = 0,
) -> TokenUsageLog:
    """Log token usage metrics."""
    total = prompt_tokens + completion_tokens
    cost = estimate_cost(prompt_tokens, completion_tokens, model)
    entry = TokenUsageLog(
        request_id=request_id or str(uuid.uuid4()),
        user_id=user_id,
        conversation_id=conversation_id,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total,
        estimated_cost_usd=cost,
        model=model,
        latency_ms=latency_ms,
            timestamp=datetime.now(timezone.utc),
        status=status,
        retry_count=retry_count,
    )
    _history.append(entry)
    logger.info(
        "Token usage: model=%s prompt=%d completion=%d total=%d cost=$%.4f latency=%.0fms status=%s",
        model, prompt_tokens, completion_tokens, total, cost, latency_ms, status,
    )
    return entry


def build_usage(
    prompt_tokens: int,
    completion_tokens: int,
    model: str = "gpt-5",
) -> TokenUsage:
    """Build a TokenUsage model instance."""
    total = prompt_tokens + completion_tokens
    cost = estimate_cost(prompt_tokens, completion_tokens, model)
    return TokenUsage(
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total,
        estimated_cost_usd=cost,
    )


def get_usage_history(limit: int = 100) -> list[TokenUsageLog]:
    """Return recent token usage logs."""
    return _history[-limit:]
