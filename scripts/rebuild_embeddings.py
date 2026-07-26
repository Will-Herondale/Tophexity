"""Standalone script to rebuild embeddings against Azure PostgreSQL.

Run: python scripts/rebuild_embeddings.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("API_V1_PREFIX", "/v1")
os.environ.setdefault("API_VERSION", "1.0.0")
os.environ.setdefault("APP_NAME", "CareerPathCreator")


async def main():
    from app.core.database import async_session_factory
    from app.models.embedding import EmbeddingJob
    from app.services.embedding_service import (
        _execute_rebuild, _rebuild_source_type, delete_embeddings_for_source,
        _get_current_version, generate_embeddings, store_embeddings,
        EMBEDDING_MODEL, EMBEDDING_DIMENSIONS,
    )
    from app.models.career import (
        Career, CareerCollege, CareerDegree, CareerEntranceExam,
        CareerScholarship, CareerSkill,
        College, Degree, EntranceExam, Scholarship, Skill,
    )
    from app.services.chunking import (
        Chunk, chunk_career, chunk_college, chunk_degree,
        chunk_exam, chunk_scholarship, chunk_skill,
    )
    from sqlalchemy import select, func
    from sqlalchemy.orm import selectinload

    print(f"Embedding model: {EMBEDDING_MODEL} ({EMBEDDING_DIMENSIONS} dims)")

    async with async_session_factory() as db:
        total = await db.execute(select(func.count()))
        result = await db.execute(select(func.count(DocumentEmbedding.id)))
        current = result.scalar() or 0
        print(f"Current embeddings: {current}")

    source_types = ["career", "skill", "degree", "college", "scholarship", "exam"]

    for stype in source_types:
        print(f"\n{'='*60}")
        print(f"Rebuilding: {stype}")
        print(f"{'='*60}")

        async with async_session_factory() as db:
            count = await _rebuild_source_type(db, stype)
            print(f"  Done: {count} embeddings for {stype}")

    async with async_session_factory() as db:
        result = await db.execute(select(func.count(DocumentEmbedding.id)))
        final = result.scalar() or 0
        print(f"\n{'='*60}")
        print(f"Total embeddings after rebuild: {final}")
        print(f"{'='*60}")


if __name__ == "__main__":
    from app.models.embedding import DocumentEmbedding
    asyncio.run(main())
