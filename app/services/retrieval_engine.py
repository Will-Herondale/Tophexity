"""Retrieval engine for semantic and hybrid search over embeddings.

Supports semantic search, metadata filtering, top-k retrieval,
score thresholds, reranking, deduplication, and context compression.
"""
import time
from uuid import UUID

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.embedding import DocumentEmbedding
from app.services.embedding_service import generate_embeddings, EMBEDDING_DIMENSIONS


async def semantic_search(
    db: AsyncSession,
    query: str,
    source_types: list[str] | None = None,
    top_k: int = 10,
    score_threshold: float = 0.0,
    metadata_filters: dict | None = None,
) -> list[dict]:
    """Semantic search using cosine similarity with pgvector."""
    start = time.monotonic()

    query_embedding = await generate_embeddings([query])
    if not query_embedding:
        return []

    embedding = query_embedding[0]
    embed_time = (time.monotonic() - start) * 1000

    search_start = time.monotonic()

    cosine_dist = DocumentEmbedding.embedding.cosine_distance(embedding)

    stmt = (
        select(
            DocumentEmbedding.source_id,
            DocumentEmbedding.source_type,
            DocumentEmbedding.chunk_text,
            DocumentEmbedding.metadata_,
            (1 - cosine_dist).label("score"),
        )
        .where(cosine_dist <= (1 - score_threshold))
    )

    if source_types:
        stmt = stmt.where(DocumentEmbedding.source_type.in_(source_types))

    if metadata_filters:
        for key, value in metadata_filters.items():
            stmt = stmt.where(DocumentEmbedding.metadata_[key].astext == str(value))

    stmt = stmt.order_by(cosine_dist).limit(top_k)

    result = await db.execute(stmt)
    rows = result.all()

    search_time = (time.monotonic() - search_start) * 1000

    results = []
    for row in rows:
        results.append({
            "source_id": row.source_id,
            "source_type": row.source_type,
            "chunk_text": row.chunk_text,
            "score": float(row.score),
            "metadata": row.metadata_ or {},
        })

    logger.info("Semantic search: query='%s' results=%d embed=%.0fms search=%.0fms",
                query[:50], len(results), embed_time, search_time)

    return results


async def hybrid_search(
    db: AsyncSession,
    query: str,
    source_types: list[str] | None = None,
    top_k: int = 10,
    score_threshold: float = 0.0,
    semantic_weight: float = 0.7,
    keyword_weight: float = 0.3,
) -> list[dict]:
    """Combine semantic search with keyword matching."""
    semantic_results = await semantic_search(
        db, query, source_types, top_k=top_k * 2, score_threshold=score_threshold
    )

    keyword_filter = f"%{query}%"
    kw_stmt = (
        select(
            DocumentEmbedding.source_id,
            DocumentEmbedding.source_type,
            DocumentEmbedding.chunk_text,
            DocumentEmbedding.metadata_,
        )
        .where(DocumentEmbedding.chunk_text.ilike(keyword_filter))
    )
    if source_types:
        kw_stmt = kw_stmt.where(DocumentEmbedding.source_type.in_(source_types))
    kw_stmt = kw_stmt.limit(top_k * 2)

    kw_result = await db.execute(kw_stmt)
    kw_rows = kw_result.all()

    scored = {}
    for row in semantic_results:
        key = (str(row["source_id"]), row["source_type"])
        scored[key] = {
            **row,
            "final_score": row["score"] * semantic_weight,
        }

    for row in kw_rows:
        key = (str(row.source_id), row.source_type)
        if key in scored:
            scored[key]["final_score"] += keyword_weight * 0.5
        else:
            scored[key] = {
                "source_id": row.source_id,
                "source_type": row.source_type,
                "chunk_text": row.chunk_text,
                "score": 0.0,
                "metadata": row.metadata_ or {},
                "final_score": keyword_weight * 0.5,
            }

    sorted_results = sorted(scored.values(), key=lambda x: x["final_score"], reverse=True)

    deduplicated = deduplicate_results(sorted_results)

    return [
        {**r, "score": r["final_score"]}
        for r in deduplicated[:top_k]
        if r["final_score"] >= score_threshold
    ]


def deduplicate_results(results: list[dict]) -> list[dict]:
    """Remove duplicate source_ids, keeping highest scoring chunk."""
    seen = {}
    for r in results:
        key = (str(r["source_id"]), r["source_type"])
        if key not in seen:
            seen[key] = r
    return list(seen.values())


def compress_context(results: list[dict], max_tokens: int = 4000) -> str:
    """Compress retrieval results into a concise context string."""
    parts = []
    used_tokens = 0
    token_estimate = lambda t: len(t) // 3

    for r in results:
        text = r["chunk_text"]
        est = token_estimate(text)
        if used_tokens + est > max_tokens:
            remaining = max_tokens - used_tokens
            text = text[:remaining * 3]
            parts.append(text)
            break
        parts.append(text)
        used_tokens += est

    return "\n\n".join(parts)


async def debug_retrieval(
    db: AsyncSession,
    query: str,
    source_type: str | None = None,
    top_k: int = 20,
) -> dict:
    """Debug endpoint for retrieval analysis."""
    start = time.monotonic()

    query_embedding = await generate_embeddings([query])
    embed_time = (time.monotonic() - start) * 1000

    if not query_embedding:
        return {
            "query": query,
            "embedding_time_ms": embed_time,
            "search_time_ms": 0,
            "total_results": 0,
            "results": [],
            "filters_applied": {"source_type": source_type},
        }

    embedding = query_embedding[0]
    cosine_dist = DocumentEmbedding.embedding.cosine_distance(embedding)

    search_start = time.monotonic()

    stmt = (
        select(
            DocumentEmbedding.source_id,
            DocumentEmbedding.source_type,
            DocumentEmbedding.chunk_text,
            DocumentEmbedding.metadata_,
            DocumentEmbedding.version,
            (1 - cosine_dist).label("score"),
        )
        .order_by(cosine_dist)
        .limit(top_k)
    )

    if source_type:
        stmt = stmt.where(DocumentEmbedding.source_type == source_type)

    result = await db.execute(stmt)
    rows = result.all()

    search_time = (time.monotonic() - search_start) * 1000

    results = []
    for row in rows:
        results.append({
            "source_id": str(row.source_id),
            "source_type": row.source_type,
            "chunk_text": row.chunk_text[:200],
            "score": round(float(row.score), 4),
            "version": row.version,
            "metadata": row.metadata_ or {},
        })

    return {
        "query": query,
        "embedding_time_ms": round(embed_time, 1),
        "search_time_ms": round(search_time, 1),
        "total_results": len(results),
        "results": results,
        "filters_applied": {"source_type": source_type},
    }


async def get_career_context_for_ai(
    db: AsyncSession, query: str, max_tokens: int = 3000
) -> str:
    """Get compressed career context for AI prompts."""
    results = await semantic_search(
        db, query, source_types=["career"], top_k=5, score_threshold=0.3
    )
    if not results:
        return ""
    return compress_context(results, max_tokens=max_tokens)


async def get_relevant_knowledge(
    db: AsyncSession,
    query: str,
    source_types: list[str] | None = None,
    max_tokens: int = 2000,
) -> str:
    """Get relevant knowledge base context for AI prompts."""
    results = await semantic_search(
        db, query, source_types=source_types, top_k=10, score_threshold=0.25
    )
    if not results:
        return ""
    return compress_context(results, max_tokens=max_tokens)
