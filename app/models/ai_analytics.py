"""AI analytics — database model for persistent usage tracking."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Float, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import TimestampMixin


class AIUsageLog(Base, TimestampMixin):
    """Persistent record of every AI API call."""

    __tablename__ = "ai_usage_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    request_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), index=True, nullable=True
    )
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Model info
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    deployment: Mapped[str] = mapped_column(String(100), nullable=False, default="")

    # Token counts
    prompt_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_cost_usd: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Performance
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Request context
    endpoint: Mapped[str] = mapped_column(String(200), nullable=True)
    prompt_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    prompt_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Outcome
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="success")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Security
    injection_detected: Mapped[bool] = mapped_column(Integer, nullable=False, default=0)
    jailbreak_detected: Mapped[bool] = mapped_column(Integer, nullable=False, default=0)

    # Additional metadata
    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    __table_args__ = (
        Index("idx_ai_usage_user_created", "user_id", "created_at"),
        Index("idx_ai_usage_status", "status"),
        Index("idx_ai_usage_model", "model"),
    )

    def __repr__(self) -> str:
        return (
            f"<AIUsageLog request_id={self.request_id} model={self.model} "
            f"status={self.status} tokens={self.total_tokens}>"
        )


class AIHealthSnapshot(Base, TimestampMixin):
    """Periodic health check snapshots for uptime tracking."""

    __tablename__ = "ai_health_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    azure_connected: Mapped[bool] = mapped_column(Integer, nullable=False, default=0)
    deployment_available: Mapped[bool] = mapped_column(Integer, nullable=False, default=0)
    authentication_valid: Mapped[bool] = mapped_column(Integer, nullable=False, default=0)
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    endpoint: Mapped[str] = mapped_column(String(300), nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("idx_ai_health_status_created", "status", "created_at"),
    )
