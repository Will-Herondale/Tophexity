"""AI-related data models."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AIRequest(BaseModel):
    messages: list[dict[str, str]]
    temperature: float | None = None
    max_tokens: int | None = None
    response_format: str | None = None
    user_id: UUID | None = None
    conversation_id: UUID | None = None


class AIResponse(BaseModel):
    content: str
    finish_reason: str | None = None
    token_usage: "TokenUsage"
    model: str
    latency_ms: float
    request_id: str | None = None


class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost_usd: float = 0.0


class TokenUsageLog(BaseModel):
    request_id: str
    user_id: UUID | None = None
    conversation_id: UUID | None = None
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    model: str
    latency_ms: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    status: str = "success"
    retry_count: int = 0


class AIHealthStatus(BaseModel):
    status: str
    azure_connected: bool
    deployment_available: bool
    authentication_valid: bool
    latency_ms: float | None = None
    model: str
    endpoint: str
    error: str | None = None
