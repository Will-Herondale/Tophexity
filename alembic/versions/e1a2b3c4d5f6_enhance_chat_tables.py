"""enhance_chat_tables

Revision ID: e1a2b3c4d5f6
Revises: 7dd0e554f9fc
Create Date: 2026-07-22 10:00:00.000000

Add 13 columns and 4 indexes to chat_sessions and chat_messages tables
to support the AI Conversation Platform (Phase 3.2A).

chat_sessions: +8 columns (is_archived, archived_at, is_pinned, pinned_at,
    summary, summary_updated_at, summary_message_count, session_data)
chat_messages: +5 columns (token_count, model_used, latency_ms, request_id,
    message_data)

All new columns are nullable or have defaults — zero data loss.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "e1a2b3c4d5f6"
down_revision: Union[str, None] = "7dd0e554f9fc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- chat_sessions ---
    op.add_column("chat_sessions", sa.Column("is_archived", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("chat_sessions", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("chat_sessions", sa.Column("is_pinned", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("chat_sessions", sa.Column("pinned_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("chat_sessions", sa.Column("summary", sa.Text(), nullable=True))
    op.add_column("chat_sessions", sa.Column("summary_updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("chat_sessions", sa.Column("summary_message_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("chat_sessions", sa.Column("session_data", postgresql.JSONB(), server_default="{}", nullable=False))

    # --- chat_messages ---
    op.add_column("chat_messages", sa.Column("token_count", sa.Integer(), nullable=True))
    op.add_column("chat_messages", sa.Column("model_used", sa.String(100), nullable=True))
    op.add_column("chat_messages", sa.Column("latency_ms", sa.Float(), nullable=True))
    op.add_column("chat_messages", sa.Column("request_id", sa.String(100), nullable=True))
    op.add_column("chat_messages", sa.Column("message_data", postgresql.JSONB(), server_default="{}", nullable=False))

    # --- Indexes ---
    op.create_index(
        "idx_chat_sessions_user_archived",
        "chat_sessions",
        ["user_id", "is_archived"],
    )
    op.create_index(
        "idx_chat_sessions_user_pinned",
        "chat_sessions",
        ["user_id", "is_pinned"],
    )
    op.create_index(
        "idx_chat_messages_session_created",
        "chat_messages",
        ["session_id", "created_at"],
    )
    op.create_index(
        "idx_chat_messages_request_id",
        "chat_messages",
        ["request_id"],
    )


def downgrade() -> None:
    # Drop indexes first
    op.drop_index("idx_chat_messages_request_id", table_name="chat_messages")
    op.drop_index("idx_chat_messages_session_created", table_name="chat_messages")
    op.drop_index("idx_chat_sessions_user_pinned", table_name="chat_sessions")
    op.drop_index("idx_chat_sessions_user_archived", table_name="chat_sessions")

    # Drop chat_messages columns
    op.drop_column("chat_messages", "message_data")
    op.drop_column("chat_messages", "request_id")
    op.drop_column("chat_messages", "latency_ms")
    op.drop_column("chat_messages", "model_used")
    op.drop_column("chat_messages", "token_count")

    # Drop chat_sessions columns
    op.drop_column("chat_sessions", "session_data")
    op.drop_column("chat_sessions", "summary_message_count")
    op.drop_column("chat_sessions", "summary_updated_at")
    op.drop_column("chat_sessions", "summary")
    op.drop_column("chat_sessions", "pinned_at")
    op.drop_column("chat_sessions", "is_pinned")
    op.drop_column("chat_sessions", "archived_at")
    op.drop_column("chat_sessions", "is_archived")
