"""add_generation_progress_table

Revision ID: b5c6d7e8f9a1
Revises: f4a1b2c3d4e5
Create Date: 2026-08-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "b5c6d7e8f9a1"
down_revision = "b842f67cd677"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "generation_progress",
        sa.Column("token", sa.String(128), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("percent", sa.Integer, nullable=False, server_default="0"),
        sa.Column("phase", sa.String(200), nullable=False, server_default=""),
        sa.Column("message", sa.Text, nullable=False, server_default=""),
        sa.Column("status", sa.String(20), nullable=False, server_default="running"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("generation_progress")
