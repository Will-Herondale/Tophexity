"""Tests for Phase 4.2 Intelligence Layer components.

Covers: chunking, embedding_service, retrieval_engine,
recommendation_engine, roadmap_engine, backup_engine, intelligence API.
"""

import json
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest


# ─── Chunking Tests ───


class TestChunking:
    def test_chunk_career_basic(self):
        from app.services.chunking import chunk_career

        career = {
            "id": str(uuid4()),
            "title": "Software Engineer",
            "description": "Builds software applications.",
            "category": "Technology",
            "industry": "Software",
        }
        chunks = chunk_career(career)
        assert len(chunks) >= 1
        assert chunks[0].source_type == "career"
        assert chunks[0].source_id == career["id"]
        assert chunks[0].source_type == "career"

    def test_chunk_career_full(self):
        from app.services.chunking import chunk_career

        career = {
            "id": str(uuid4()),
            "title": "Data Scientist",
            "description": "Analyzes complex data to help organizations make better decisions.",
            "category": "Technology",
            "industry": "Data",
            "work_environment": "Office",
            "weekly_hours": "40",
            "stress_level": "Medium",
            "work_life_balance": "Good",
            "automation_risk": "Low",
            "travel_requirement": "Minimal",
            "salary_currency": "USD",
            "entry_level_salary": "75000",
            "mid_level_salary": "110000",
            "senior_level_salary": "150000",
            "skills": [{"name": "Python"}, {"name": "Machine Learning"}],
            "degrees": [{"name": "BSc Computer Science", "level": "Bachelor"}],
            "colleges": [{"name": "MIT"}],
            "exams": [{"name": "GRE"}],
            "scholarships": [{"name": "Data Science Scholarship"}],
        }
        chunks = chunk_career(career)
        assert len(chunks) >= 4
        roles = [c.metadata.get("chunk_role") for c in chunks]
        assert "salary" in roles
        assert "skills" in roles
        assert "degrees" in roles

    def test_chunk_skill(self):
        from app.services.chunking import chunk_skill

        skill = {"id": str(uuid4()), "name": "Python", "category": "Programming", "career_count": 50}
        chunks = chunk_skill(skill)
        assert len(chunks) == 1
        assert "Python" in chunks[0].text
        assert "50 careers" in chunks[0].text

    def test_chunk_degree(self):
        from app.services.chunking import chunk_degree

        degree = {"id": str(uuid4()), "name": "BSc CS", "level": "Bachelor", "field": "Computer Science"}
        chunks = chunk_degree(degree)
        assert len(chunks) == 1
        assert "BSc CS" in chunks[0].text
        assert "Computer Science" in chunks[0].text

    def test_chunk_college(self):
        from app.services.chunking import chunk_college

        college = {"id": str(uuid4()), "name": "MIT", "location": "Cambridge, MA", "ranking": 1}
        chunks = chunk_college(college)
        assert len(chunks) == 1
        assert "MIT" in chunks[0].text
        assert "Cambridge" in chunks[0].text

    def test_chunk_scholarship(self):
        from app.services.chunking import chunk_scholarship

        sch = {"id": str(uuid4()), "name": "Merit Award", "amount": "$5000", "description": "For top students"}
        chunks = chunk_scholarship(sch)
        assert len(chunks) == 1
        assert "Merit Award" in chunks[0].text
        assert "$5000" in chunks[0].text

    def test_chunk_exam(self):
        from app.services.chunking import chunk_exam

        exam = {"id": str(uuid4()), "name": "JEE Main", "description": "Engineering entrance exam"}
        chunks = chunk_exam(exam)
        assert len(chunks) == 1
        assert "JEE Main" in chunks[0].text

    def test_content_hash(self):
        from app.services.chunking import Chunk

        c = Chunk(text="hello", source_id="1", source_type="test", chunk_index=0)
        h1 = c.content_hash
        h2 = c.content_hash
        assert h1 == h2
        assert len(h1) == 64

    def test_smart_split_short(self):
        from app.services.chunking import _smart_split

        result = _smart_split("Short text", 512)
        assert len(result) == 1
        assert result[0] == "Short text"

    def test_smart_split_long(self):
        from app.services.chunking import _smart_split

        long_text = " ".join(["Sentence number " + str(i) + "." for i in range(100)])
        result = _smart_split(long_text, 100)
        assert len(result) > 1
        for chunk in result:
            assert len(chunk) <= 150

    def test_clean_text(self):
        from app.services.chunking import _clean

        assert _clean(None) == ""
        assert _clean("") == ""
        assert _clean("  hello  ") == "hello"
        assert _clean("hello  world") == "hello world"


# ─── Embedding Service Tests ───


class TestEmbeddingService:
    @pytest.mark.asyncio
    async def test_generate_embeddings_empty(self):
        from app.services.embedding_service import generate_embeddings

        result = await generate_embeddings([])
        assert result == []

    @pytest.mark.asyncio
    async def test_embed_via_http(self):
        from app.services.embedding_service import _embed_via_http

        with patch("httpx.AsyncClient") as mock_async_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "data": [{"embedding": [0.1] * 1536}]
            }
            mock_response.raise_for_status = MagicMock()

            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_async_client.return_value = mock_client

            result = await _embed_via_http(["test text"])
            assert len(result) == 1
            assert len(result[0]) == 1536

    @pytest.mark.asyncio
    async def test_get_embedding_status(self):
        from app.services.embedding_service import get_embedding_status

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar.return_value = 100
        mock_db.execute.return_value = mock_result

        status = await get_embedding_status(mock_db)
        assert "total_embeddings" in status
        assert "embedding_model" in status

    @pytest.mark.asyncio
    async def test_delete_embeddings_for_source(self):
        from app.services.embedding_service import delete_embeddings_for_source

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.rowcount = 5
        mock_db.execute.return_value = mock_result

        count = await delete_embeddings_for_source(mock_db, "career")
        assert count == 5

    @pytest.mark.asyncio
    async def test_store_embeddings_empty(self):
        from app.services.embedding_service import store_embeddings

        mock_db = AsyncMock()
        result = await store_embeddings(mock_db, [], [], "career")
        assert result == 0

    @pytest.mark.asyncio
    async def test_rebuild_embeddings_returns_job_info(self):
        from app.services.embedding_service import rebuild_embeddings

        with patch("app.services.embedding_service.async_session_factory") as mock_factory:
            mock_db = AsyncMock()
            mock_db.add = MagicMock()
            mock_factory.return_value.__aenter__ = AsyncMock(return_value=mock_db)
            mock_factory.return_value.__aexit__ = AsyncMock(return_value=False)

            with patch(
                "app.services.embedding_service.asyncio.create_task",
                side_effect=lambda coro: coro.close(),
            ):
                result = await rebuild_embeddings(source_type="career")
                assert "job_id" in result
                assert result["status"] == "pending"


# ─── Retrieval Engine Tests ───


class TestRetrievalEngine:
    def test_compress_context(self):
        from app.services.retrieval_engine import compress_context

        results = [
            {"chunk_text": "Short text", "score": 0.9},
            {"chunk_text": "Another text", "score": 0.8},
        ]
        context = compress_context(results, max_tokens=100)
        assert "Short text" in context
        assert "Another text" in context

    def test_compress_context_token_limit(self):
        from app.services.retrieval_engine import compress_context

        results = [
            {"chunk_text": "x" * 3000, "score": 0.9},
            {"chunk_text": "y" * 3000, "score": 0.8},
        ]
        context = compress_context(results, max_tokens=100)
        assert len(context) < 6000

    def test_deduplicate_results(self):
        from app.services.retrieval_engine import deduplicate_results

        results = [
            {"source_id": "1", "source_type": "career", "score": 0.9, "chunk_text": "a"},
            {"source_id": "1", "source_type": "career", "score": 0.7, "chunk_text": "b"},
            {"source_id": "2", "source_type": "career", "score": 0.8, "chunk_text": "c"},
        ]
        deduped = deduplicate_results(results)
        assert len(deduped) == 2

    @pytest.mark.asyncio
    async def test_semantic_search_empty_embedding(self):
        from app.services.retrieval_engine import semantic_search

        mock_db = AsyncMock()
        with patch("app.services.retrieval_engine.generate_embeddings", new_callable=AsyncMock, return_value=[]):
            results = await semantic_search(mock_db, "test query")
            assert results == []

    @pytest.mark.asyncio
    async def test_get_relevant_knowledge_empty(self):
        from app.services.retrieval_engine import get_relevant_knowledge

        mock_db = AsyncMock()
        with patch("app.services.retrieval_engine.semantic_search", new_callable=AsyncMock, return_value=[]):
            result = await get_relevant_knowledge(mock_db, "test query")
            assert result == ""


# ─── Intelligence API Tests ───


class TestIntelligenceAPI:
    @pytest.mark.anyio
    async def test_embedding_status_endpoint(self, auth_client):
        with patch("app.api.v1.intelligence.embedding_service") as mock_svc:
            mock_svc.get_embedding_status = AsyncMock(return_value={
                "total_embeddings": 100,
                "embeddings_by_source": {"career": 50},
                "latest_version": 1,
                "last_updated": None,
                "embedding_model": "text-embedding-3-small",
                "dimensions": 1536,
            })
            resp = await auth_client.get("/v1/intelligence/embeddings/status")
            assert resp.status_code == 200

    @pytest.mark.anyio
    async def test_rebuild_embeddings_endpoint(self, auth_client):
        with patch("app.api.v1.intelligence.embedding_service") as mock_svc:
            mock_svc.rebuild_embeddings = AsyncMock(return_value={
                "job_id": str(uuid4()),
                "status": "pending",
                "message": "Rebuild started",
            })
            resp = await auth_client.post(
                "/v1/intelligence/embeddings/rebuild",
                json={"source_type": "career"},
            )
            assert resp.status_code == 200

    @pytest.mark.anyio
    async def test_semantic_search_endpoint(self, auth_client):
        with patch("app.api.v1.intelligence.retrieval_engine") as mock_eng:
            mock_eng.semantic_search = AsyncMock(return_value=[])
            resp = await auth_client.post(
                "/v1/intelligence/search/semantic",
                json={"query": "data science careers", "top_k": 5},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["search_type"] == "semantic"

    @pytest.mark.anyio
    async def test_hybrid_search_endpoint(self, auth_client):
        with patch("app.api.v1.intelligence.retrieval_engine") as mock_eng:
            mock_eng.hybrid_search = AsyncMock(return_value=[])
            resp = await auth_client.post(
                "/v1/intelligence/search/hybrid",
                json={"query": "python developer", "top_k": 5},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["search_type"] == "hybrid"


# ─── Schema Validation Tests ───


class TestIntelligenceSchemas:
    def test_semantic_search_request(self):
        from app.schemas.intelligence import SemanticSearchRequest

        req = SemanticSearchRequest(query="test query")
        assert req.query == "test query"
        assert req.top_k == 10
        assert req.score_threshold == 0.0

    def test_generate_recommendation_request(self):
        from app.schemas.intelligence import GenerateRecommendationRequest

        req = GenerateRecommendationRequest()
        assert req.include_profile is True
        assert req.max_results == 10

    def test_generate_roadmap_request(self):
        from app.schemas.intelligence import GenerateRoadmapRequest

        req = GenerateRoadmapRequest(career_id=uuid4(), roadmap_type="career")
        assert req.roadmap_type == "career"
        assert req.custom_duration_months is None

    def test_generate_backup_request(self):
        from app.schemas.intelligence import GenerateBackupRequest

        req = GenerateBackupRequest(career_id=uuid4())
        assert req.max_scenarios == 5

    def test_rebuild_embeddings_request(self):
        from app.schemas.intelligence import RebuildEmbeddingsRequest

        req = RebuildEmbeddingsRequest(source_type="career")
        assert req.source_type == "career"

        req_all = RebuildEmbeddingsRequest()
        assert req_all.source_type is None

    def test_retrieval_result(self):
        from app.schemas.intelligence import RetrievalResult

        r = RetrievalResult(
            source_id=uuid4(),
            source_type="career",
            chunk_text="test",
            score=0.85,
        )
        assert r.score == 0.85
