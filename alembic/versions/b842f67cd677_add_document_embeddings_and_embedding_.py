"""add document embeddings and embedding jobs tables

Revision ID: b842f67cd677
Revises: 3a589c75e389
Create Date: 2026-07-24 18:06:34.293600
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b842f67cd677'
down_revision: Union[str, None] = '3a589c75e389'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.execute("""
        CREATE TABLE document_embeddings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            source_id UUID NOT NULL,
            source_type VARCHAR(50) NOT NULL,
            chunk_index INTEGER NOT NULL DEFAULT 0,
            chunk_text TEXT NOT NULL,
            embedding vector(1536) NOT NULL,
            metadata JSONB,
            version INTEGER NOT NULL DEFAULT 1,
            content_hash VARCHAR(64),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    op.create_index('ix_document_embeddings_id', 'document_embeddings', ['id'], unique=False)
    op.create_index('ix_document_embeddings_source_id', 'document_embeddings', ['source_id'], unique=False)
    op.create_index('ix_document_embeddings_source_type', 'document_embeddings', ['source_type'], unique=False)
    op.create_index('ix_doc_emb_source', 'document_embeddings', ['source_type', 'source_id'], unique=False)
    op.create_index('ix_doc_emb_version', 'document_embeddings', ['source_type', 'source_id', 'version'], unique=False)
    op.create_index('ix_doc_emb_content_hash', 'document_embeddings', ['content_hash'], unique=False)

    op.execute("""
        CREATE INDEX ix_doc_emb_embedding
        ON document_embeddings
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 50)
    """)

    op.create_table(
        'embedding_jobs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('source_type', sa.String(length=50), nullable=True),
        sa.Column('total_items', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('processed_items', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_items', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_index('ix_embedding_jobs_id', 'embedding_jobs', ['id'], unique=False)
    op.create_index('ix_embedding_jobs_status', 'embedding_jobs', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_embedding_jobs_status', table_name='embedding_jobs')
    op.drop_index('ix_embedding_jobs_id', table_name='embedding_jobs')
    op.drop_table('embedding_jobs')

    op.execute("DROP INDEX IF EXISTS ix_doc_emb_embedding")
    op.drop_index('ix_doc_emb_content_hash', table_name='document_embeddings')
    op.drop_index('ix_doc_emb_version', table_name='document_embeddings')
    op.drop_index('ix_doc_emb_source', table_name='document_embeddings')
    op.drop_index('ix_document_embeddings_source_type', table_name='document_embeddings')
    op.drop_index('ix_document_embeddings_source_id', table_name='document_embeddings')
    op.drop_index('ix_document_embeddings_id', table_name='document_embeddings')
    op.drop_table('document_embeddings')
