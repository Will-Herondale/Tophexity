"""Embedding generation and storage service.

Uses Azure OpenAI text-embedding-3-small (1536 dimensions).
Supports batch generation, incremental updates, and versioning.
"""
import asyncio
import hashlib
import json
import time
from uuid import UUID, uuid4

from sqlalchemy import delete, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import async_session_factory
from app.core.logging import logger
from app.models.career import (
    Career, CareerCollege, CareerDegree, CareerEntranceExam,
    CareerScholarship, CareerSkill,
    College, Degree, EntranceExam, Scholarship, Skill,
)
from app.models.embedding import DocumentEmbedding, EmbeddingJob
from app.schemas.knowledge_base import (
    KBCollegeResponse, KBDegreeResponse, KBExamResponse,
    KBScholarshipResponse, KBSkillResponse,
)
from app.services.chunking import (
    Chunk, chunk_career, chunk_college, chunk_degree,
    chunk_exam, chunk_scholarship, chunk_skill,
)

settings = get_settings()

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
BATCH_SIZE = 100
EMBEDDING_REQUEST_BATCH_SIZE = 8
EMBEDDING_REQUEST_DELAY_SECONDS = 2.5
REBUILD_STORE_CHUNK_BATCH_SIZE = 128


def _get_openai_client():
    """Return None - we use httpx directly for embeddings due to Azure SDK URL issues."""
    return None


async def _embed_via_http(texts: list[str]) -> list[list[float]]:
    """Call Azure OpenAI embeddings API directly via httpx."""
    import httpx
    api_key = settings.AI_API_KEY
    url = "https://tophex.openai.azure.com/openai/deployments/text-embedding-3-small/embeddings?api-version=2024-12-01-preview"
    headers = {"api-key": api_key, "Content-Type": "application/json"}

    all_embeddings = []
    async with httpx.AsyncClient(timeout=60.0) as client:
        batch_size = EMBEDDING_REQUEST_BATCH_SIZE
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            retries = 5
            for attempt in range(retries):
                try:
                    response = await client.post(url, json={"input": batch}, headers=headers)
                    if response.status_code == 429:
                        retry_after_ms = response.headers.get("retry-after-ms")
                        if retry_after_ms and retry_after_ms.isdigit():
                            wait = max(2.0, int(retry_after_ms) / 1000)
                        else:
                            wait = min(30, 10 * (attempt + 1))
                        logger.warning("429 rate limit, waiting %ds (attempt %d/%d)", wait, attempt + 1, retries)
                        await asyncio.sleep(wait)
                        continue
                    response.raise_for_status()
                    data = response.json()
                    batch_embeddings = [item["embedding"] for item in data["data"]]
                    all_embeddings.extend(batch_embeddings)
                    break
                except Exception as e:
                    if attempt < retries - 1:
                        wait = min(30, 5 * (attempt + 1))
                        logger.warning("Embedding batch %d attempt %d failed: %s, retrying in %ds",
                                       i // batch_size, attempt + 1, str(e)[:100], wait)
                        await asyncio.sleep(wait)
                    else:
                        logger.error("Embedding batch %d failed after %d attempts: %s", i // batch_size, retries, str(e)[:200])
                        raise

            if i + batch_size < len(texts):
                await asyncio.sleep(EMBEDDING_REQUEST_DELAY_SECONDS)

    return all_embeddings


async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts using Azure OpenAI."""
    if not texts:
        return []

    all_embeddings = await _embed_via_http(texts)

    return all_embeddings


async def _get_current_version(db: AsyncSession, source_type: str) -> int:
    result = await db.execute(
        select(func.max(DocumentEmbedding.version))
        .where(DocumentEmbedding.source_type == source_type)
    )
    max_ver = result.scalar()
    return (max_ver or 0) + 1


async def store_embeddings(
    db: AsyncSession,
    chunks: list[Chunk],
    embeddings: list[list[float]],
    source_type: str,
    version: int | None = None,
) -> int:
    """Store embeddings in the database. Returns count stored."""
    if not chunks or not embeddings:
        return 0

    if version is None:
        version = await _get_current_version(db, source_type)

    rows = []
    for chunk, embedding in zip(chunks, embeddings):
        emb_str = "[" + ",".join(str(x) for x in embedding) + "]"
        rows.append({
            "id": uuid4(),
            "source_id": UUID(chunk.source_id) if isinstance(chunk.source_id, str) else chunk.source_id,
            "source_type": chunk.source_type,
            "chunk_index": chunk.chunk_index,
            "chunk_text": chunk.text,
            "embedding": emb_str,
            "metadata": json.dumps(chunk.metadata or {}),
            "version": version,
            "content_hash": chunk.content_hash,
        })

    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        await db.execute(
            text("""
                INSERT INTO document_embeddings (id, source_id, source_type, chunk_index, chunk_text, embedding, metadata, version, content_hash, created_at, updated_at)
                VALUES (:id, :source_id, :source_type, :chunk_index, :chunk_text, CAST(:embedding AS vector), CAST(:metadata AS jsonb), :version, :content_hash, NOW(), NOW())
            """),
            batch,
        )

    await db.commit()
    return len(rows)


async def delete_embeddings_for_source(
    db: AsyncSession, source_type: str, source_id: UUID | None = None
) -> int:
    """Delete embeddings for a source type (and optionally a specific source_id)."""
    stmt = delete(DocumentEmbedding).where(DocumentEmbedding.source_type == source_type)
    if source_id:
        stmt = stmt.where(DocumentEmbedding.source_id == source_id)
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount


async def get_embedding_status(db: AsyncSession) -> dict:
    """Get current embedding status across all source types."""
    total = await db.execute(select(func.count(DocumentEmbedding.id)))
    total_count = total.scalar() or 0

    type_counts = await db.execute(
        select(DocumentEmbedding.source_type, func.count(DocumentEmbedding.id))
        .group_by(DocumentEmbedding.source_type)
    )
    by_source = {row[0]: row[1] for row in type_counts.all()}

    latest_ver = await db.execute(select(func.max(DocumentEmbedding.version)))
    latest_version = latest_ver.scalar() or 0

    latest_update = await db.execute(select(func.max(DocumentEmbedding.updated_at)))
    last_updated = latest_update.scalar()

    return {
        "total_embeddings": total_count,
        "embeddings_by_source": by_source,
        "latest_version": latest_version,
        "last_updated": last_updated,
        "embedding_model": EMBEDDING_MODEL,
        "dimensions": EMBEDDING_DIMENSIONS,
    }


async def rebuild_embeddings(source_type: str | None = None) -> dict:
    """Rebuild embeddings for all or a specific source type. Returns job info."""
    job = EmbeddingJob(
        status="pending",
        source_type=source_type,
    )

    async with async_session_factory() as db:
        db.add(job)
        await db.commit()
        await db.refresh(job)
        job_id = job.id

    asyncio.create_task(_execute_rebuild(job_id, source_type))

    return {"job_id": job_id, "status": "pending", "message": f"Rebuild started for {source_type or 'all sources'}"}


async def _execute_rebuild(job_id: UUID, source_type: str | None) -> None:
    """Background task to rebuild embeddings."""
    async with async_session_factory() as db:
        job = await db.get(EmbeddingJob, job_id)
        if not job:
            return
        job.status = "running"
        job.started_at = func.now()
        await db.commit()

        try:
            total_processed = 0
            total_failed = 0

            types_to_process = [source_type] if source_type else [
                "career", "skill", "degree", "college", "scholarship", "exam",
            ]

            for stype in types_to_process:
                try:
                    count = await _rebuild_source_type(db, stype)
                    total_processed += count
                except Exception as e:
                    logger.error("Failed to rebuild %s: %s", stype, str(e)[:200])
                    total_failed += 1

            job.status = "completed"
            job.processed_items = total_processed
            job.failed_items = total_failed
            job.completed_at = func.now()
            await db.commit()
            logger.info("Embedding rebuild completed: %d processed, %d failed", total_processed, total_failed)

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)[:1000]
            job.completed_at = func.now()
            await db.commit()
            logger.error("Embedding rebuild failed: %s", str(e)[:200])


async def _rebuild_source_type(
    db: AsyncSession,
    source_type: str,
    delete_existing: bool = True,
) -> int:
    """Rebuild embeddings for a single source type."""
    from sqlalchemy.orm import selectinload

    if delete_existing:
        await delete_embeddings_for_source(db, source_type)
        version = await _get_current_version(db, source_type)
    else:
        existing_count = (
            await db.execute(
                select(func.count(DocumentEmbedding.id)).where(
                    DocumentEmbedding.source_type == source_type,
                )
            )
        ).scalar() or 0
        if existing_count > 0:
            version = (
                await db.execute(
                    select(func.max(DocumentEmbedding.version)).where(
                        DocumentEmbedding.source_type == source_type,
                    )
                )
            ).scalar() or 1
            logger.info(
                "Resuming %s embeddings from existing version v%d (%d rows)",
                source_type,
                version,
                existing_count,
            )
        else:
            version = await _get_current_version(db, source_type)

    all_chunks: list[Chunk] = []

    if source_type == "career":
        result = await db.execute(
            select(Career)
            .options(
                selectinload(Career.career_skills).selectinload(CareerSkill.skill),
                selectinload(Career.career_degrees).selectinload(CareerDegree.degree),
                selectinload(Career.career_colleges).selectinload(CareerCollege.college),
                selectinload(Career.career_exams).selectinload(CareerEntranceExam.exam),
                selectinload(Career.career_scholarships).selectinload(CareerScholarship.scholarship),
            )
        )
        careers = result.unique().scalars().all()
        for career in careers:
            career_dict = {
                "id": career.id,
                "title": career.title,
                "description": career.description,
                "category": career.category,
                "industry": career.industry,
                "work_environment": career.work_environment,
                "weekly_hours": career.weekly_hours,
                "stress_level": career.stress_level,
                "work_life_balance": career.work_life_balance,
                "automation_risk": career.automation_risk,
                "travel_requirement": career.travel_requirement,
                "salary_currency": career.salary_currency,
                "entry_level_salary": career.entry_level_salary,
                "mid_level_salary": career.mid_level_salary,
                "senior_level_salary": career.senior_level_salary,
                "skills": [{"name": cs.skill.name, "category": cs.skill.category} for cs in career.career_skills],
                "degrees": [{"name": cd.degree.name, "level": cd.degree.level} for cd in career.career_degrees],
                "colleges": [{"name": cc.college.name} for cc in career.career_colleges],
                "exams": [{"name": ce.exam.name} for ce in career.career_exams],
                "scholarships": [{"name": cs.scholarship.name} for cs in career.career_scholarships],
            }
            all_chunks.extend(chunk_career(career_dict))

    elif source_type == "skill":
        result = await db.execute(select(Skill))
        skills = result.scalars().all()
        for skill in skills:
            all_chunks.append(Chunk(
                text=f"Skill: {skill.name}" + (f" (category: {skill.category})" if skill.category else ""),
                source_id=str(skill.id),
                source_type="skill",
                chunk_index=0,
                metadata={"name": skill.name, "category": skill.category or ""},
            ))

    elif source_type == "degree":
        result = await db.execute(select(Degree))
        degrees = result.scalars().all()
        for degree in degrees:
            text = f"Degree: {degree.name}, level: {degree.level}"
            if degree.field:
                text += f", field: {degree.field}"
            all_chunks.append(Chunk(
                text=text, source_id=str(degree.id), source_type="degree",
                chunk_index=0, metadata={"name": degree.name, "level": degree.level},
            ))

    elif source_type == "college":
        result = await db.execute(select(College))
        colleges = result.scalars().all()
        for college in colleges:
            text = f"College: {college.name}"
            if college.location:
                text += f", located in {college.location}"
            all_chunks.append(Chunk(
                text=text, source_id=str(college.id), source_type="college",
                chunk_index=0, metadata={"name": college.name, "location": college.location or ""},
            ))

    elif source_type == "scholarship":
        result = await db.execute(select(Scholarship))
        scholarships = result.scalars().all()
        for sch in scholarships:
            text = f"Scholarship: {sch.name}"
            if sch.amount:
                text += f", amount: {sch.amount}"
            if sch.description:
                text += f". {sch.description[:300]}"
            all_chunks.append(Chunk(
                text=text, source_id=str(sch.id), source_type="scholarship",
                chunk_index=0, metadata={"name": sch.name},
            ))

    elif source_type == "exam":
        result = await db.execute(select(EntranceExam))
        exams = result.scalars().all()
        for exam in exams:
            text = f"Entrance Exam: {exam.name}"
            if exam.description:
                text += f". {exam.description[:300]}"
            all_chunks.append(Chunk(
                text=text, source_id=str(exam.id), source_type="exam",
                chunk_index=0, metadata={"name": exam.name},
            ))

    if not all_chunks:
        return 0

    if not delete_existing:
        existing_rows = (
            await db.execute(
                select(DocumentEmbedding.source_id, DocumentEmbedding.chunk_index)
                .where(
                    DocumentEmbedding.source_type == source_type,
                    DocumentEmbedding.version == version,
                )
            )
        ).all()
        existing_keys = {(str(row.source_id), row.chunk_index) for row in existing_rows}
        all_chunks = [
            c for c in all_chunks
            if (str(c.source_id), c.chunk_index) not in existing_keys
        ]
        if not all_chunks:
            logger.info("No pending chunks for %s (v%d)", source_type, version)
            return 0

    total_stored = 0
    total_chunks = len(all_chunks)
    for i in range(0, total_chunks, REBUILD_STORE_CHUNK_BATCH_SIZE):
        chunk_batch = all_chunks[i:i + REBUILD_STORE_CHUNK_BATCH_SIZE]
        texts = [c.text for c in chunk_batch]
        embeddings = await generate_embeddings(texts)
        stored = await store_embeddings(db, chunk_batch, embeddings, source_type, version)
        total_stored += stored

        logger.info(
            "Rebuild progress for %s: %d/%d stored",
            source_type,
            total_stored,
            total_chunks,
        )

    logger.info("Rebuilt %d embeddings for %s (v%d)", total_stored, source_type, version)
    return total_stored
