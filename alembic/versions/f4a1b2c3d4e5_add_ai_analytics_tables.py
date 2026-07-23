"""add_ai_analytics_tables

Revision ID: f4a1b2c3d4e5
Revises: e1a2b3c4d5f6
Create Date: 2026-07-22
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "f4a1b2c3d4e5"
down_revision = "e1a2b3c4d5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_usage_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("request_id", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("conversation_id", UUID(as_uuid=True), nullable=True),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("deployment", sa.String(100), nullable=False, server_default=""),
        sa.Column("prompt_tokens", sa.Integer, nullable=False, server_default="0"),
        sa.Column("completion_tokens", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_tokens", sa.Integer, nullable=False, server_default="0"),
        sa.Column("estimated_cost_usd", sa.Float, nullable=False, server_default="0"),
        sa.Column("latency_ms", sa.Float, nullable=False, server_default="0"),
        sa.Column("endpoint", sa.String(200), nullable=True),
        sa.Column("prompt_version", sa.String(50), nullable=True),
        sa.Column("prompt_name", sa.String(100), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="success"),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("retry_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("injection_detected", sa.Integer, nullable=False, server_default="0"),
        sa.Column("jailbreak_detected", sa.Integer, nullable=False, server_default="0"),
        sa.Column("meta", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_ai_usage_user_created", "ai_usage_logs", ["user_id", "created_at"])
    op.create_index("idx_ai_usage_status", "ai_usage_logs", ["status"])
    op.create_index("idx_ai_usage_model", "ai_usage_logs", ["model"])

    op.create_table(
        "ai_health_snapshots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("azure_connected", sa.Integer, nullable=False, server_default="0"),
        sa.Column("deployment_available", sa.Integer, nullable=False, server_default="0"),
        sa.Column("authentication_valid", sa.Integer, nullable=False, server_default="0"),
        sa.Column("latency_ms", sa.Float, nullable=True),
        sa.Column("model", sa.String(100), nullable=False),
        sa.Column("endpoint", sa.String(300), nullable=False),
        sa.Column("error", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("idx_ai_health_status_created", "ai_health_snapshots", ["status", "created_at"])


def downgrade() -> None:
    op.drop_table("ai_health_snapshots")
    op.drop_table("ai_usage_logs")
