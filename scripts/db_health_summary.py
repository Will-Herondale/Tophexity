"""Database health summary for RC review."""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import async_session_factory


async def main() -> None:
    async with async_session_factory() as db:
        checks = {
            "db_name": "select current_database()",
            "db_user": "select current_user",
            "server_version": "show server_version",
            "alembic_version": "select version_num from alembic_version limit 1",
            "has_vector_extension": "select exists(select 1 from pg_extension where extname = 'vector')",
            "table_count": "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE'",
            "index_count": "select count(*) from pg_indexes where schemaname='public'",
            "fk_count": "select count(*) from information_schema.table_constraints where constraint_schema='public' and constraint_type='FOREIGN KEY'",
            "constraint_count": "select count(*) from information_schema.table_constraints where constraint_schema='public'",
            "users_count": "select count(*) from users",
            "careers_count": "select count(*) from careers",
            "skills_count": "select count(*) from skills",
            "degrees_count": "select count(*) from degrees",
            "colleges_count": "select count(*) from colleges",
            "scholarships_count": "select count(*) from scholarships",
            "exams_count": "select count(*) from entrance_exams",
            "document_embeddings_count": "select count(*) from document_embeddings",
            "embedding_jobs_count": "select count(*) from embedding_jobs",
        }

        print("DB_HEALTH_SUMMARY")
        for key, sql in checks.items():
            value = (await db.execute(text(sql))).scalar()
            print(f"{key}={value}")

        idx_rows = (
            await db.execute(
                text(
                    """
                    select indexname, indexdef
                    from pg_indexes
                    where schemaname='public' and tablename='document_embeddings'
                    order by indexname
                    """
                )
            )
        ).all()
        for indexname, indexdef in idx_rows:
            print(f"doc_emb_index[{indexname}]={indexdef}")


if __name__ == "__main__":
    asyncio.run(main())
