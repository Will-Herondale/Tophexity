"""Comprehensive tests for the AI platform."""

import json
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.api.deps import get_current_active_user
from app.models.enums import UserRole
from app.services.ai.exceptions import (
    AIError,
    AIRateLimitError,
    AIRetryExhaustedError,
    AIServiceError,
    AIValidationError,
    AITimeoutError,
)
from app.services.ai.json_validator import (
    make_json_serializable,
    validate_json_raw,
    validate_json_response,
)
from app.services.ai.memory import ConversationMemory
from app.services.ai.models import AIHealthStatus, AIResponse, TokenUsage
from app.services.ai.prompt_cache import PromptCache
from app.services.ai.prompt_loader import list_prompts, prompt_exists
from app.services.ai.rate_limiter import RateLimiter
from app.services.ai.response_parser import (
    clean_response_content,
    extract_json_from_response,
    validate_response_structure,
)
from app.services.ai.retry import calculate_delay, is_retryable_error
from app.services.ai.token_usage import build_usage, estimate_cost, track_usage
from pydantic import BaseModel


# ─── Fixtures ───


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_user():
    return type("User", (), {
        "id": uuid4(),
        "email": "test@example.com",
        "hashed_password": "hashed",
        "is_active": True,
        "is_verified": True,
        "role": UserRole.USER,
        "created_at": "2025-01-01T00:00:00Z",
    })()


@pytest.fixture
def auth_client(client, mock_user):
    app.dependency_overrides[get_current_active_user] = lambda: mock_user
    yield client
    app.dependency_overrides.clear()


# ─── Prompt Loading Tests ───


class TestPromptLoader:
    def test_list_prompts(self):
        prompts = list_prompts()
        assert "system" in prompts
        assert "chat" in prompts
        assert "recommendation" in prompts
        assert "roadmap" in prompts
        assert "backup" in prompts

    def test_prompt_exists(self):
        assert prompt_exists("system") is True
        assert prompt_exists("nonexistent") is False

    def test_prompt_cache(self):
        cache = PromptCache(ttl_seconds=300)
        content = cache.get("system")
        assert len(content) > 0
        assert "Tophexity" in content

    def test_prompt_cache_invalidation(self):
        cache = PromptCache(ttl_seconds=300)
        cache.get("system")
        cache.invalidate("system")
        assert "system" not in cache._cache

    def test_prompt_cache_clear(self):
        cache = PromptCache(ttl_seconds=300)
        cache.get("system")
        cache.clear()
        assert len(cache._cache) == 0


# ─── Response Parser Tests ───


class TestResponseParser:
    def test_extract_json_direct(self):
        data = extract_json_from_response('{"key": "value"}')
        assert data == {"key": "value"}

    def test_extract_json_code_block(self):
        content = '```json\n{"key": "value"}\n```'
        data = extract_json_from_response(content)
        assert data == {"key": "value"}

    def test_extract_json_plain_block(self):
        content = '```\n{"key": "value"}\n```'
        data = extract_json_from_response(content)
        assert data == {"key": "value"}

    def test_extract_json_with_text(self):
        content = 'Here is the result:\n{"key": "value"}\nDone.'
        data = extract_json_from_response(content)
        assert data == {"key": "value"}

    def test_extract_json_list(self):
        data = extract_json_from_response('[{"id": 1}, {"id": 2}]')
        assert isinstance(data, list)
        assert len(data) == 2

    def test_extract_json_no_json(self):
        with pytest.raises(AIValidationError):
            extract_json_from_response("no json here at all")

    def test_clean_response_content(self):
        assert clean_response_content("```json\nhello\n```") == "hello"
        assert clean_response_content("hello") == "hello"

    def test_validate_response_structure(self):
        validate_response_structure({"a": 1, "b": 2}, ["a", "b"])
        with pytest.raises(AIValidationError):
            validate_response_structure({"a": 1}, ["a", "b"])


# ─── JSON Validator Tests ───


class TestJSONValidator:
    def test_validate_json_response(self):
        class TestModel(BaseModel):
            name: str
            value: int

        result = validate_json_response('{"name": "test", "value": 42}', TestModel)
        assert result.name == "test"
        assert result.value == 42

    def test_validate_json_raw(self):
        result = validate_json_raw('{"key": "value"}')
        assert result == {"key": "value"}

    def test_make_json_serializable(self):
        from uuid import UUID
        uid = uuid4()
        assert make_json_serializable(uid) == str(uid)
        assert make_json_serializable({"id": uid}) == {"id": str(uid)}
        assert make_json_serializable([uid]) == [str(uid)]


# ─── Retry Tests ───


class TestRetry:
    def test_is_retryable_timeout(self):
        assert is_retryable_error(AITimeoutError()) is True

    def test_is_retryable_service_500(self):
        assert is_retryable_error(AIServiceError(status_code=500)) is True

    def test_is_retryable_service_400(self):
        assert is_retryable_error(AIServiceError("bad", status_code=400)) is False

    def test_is_retryable_connection_error(self):
        assert is_retryable_error(ConnectionError()) is True

    def test_is_retryable_string(self):
        assert is_retryable_error(Exception("timeout occurred")) is True
        assert is_retryable_error(Exception("bad request")) is False

    def test_calculate_delay(self):
        d0 = calculate_delay(0)
        d1 = calculate_delay(1)
        d2 = calculate_delay(2)
        assert d0 < d1 < d2 + 10  # Allow for jitter

    def test_calculate_delay_capped(self):
        d = calculate_delay(100)
        assert d <= 30 * 1.25  # max_delay + jitter


# ─── Rate Limiter Tests ───


class TestRateLimiter:
    def test_allows_within_limit(self):
        limiter = RateLimiter()
        limiter.check_and_consume("test", "user1", 5, 60.0)
        limiter.check_and_consume("test", "user1", 5, 60.0)

    def test_blocks_over_limit(self):
        limiter = RateLimiter()
        for _ in range(3):
            limiter.check_and_consume("test", "user1", 3, 60.0)
        with pytest.raises(AIRateLimitError):
            limiter.check_and_consume("test", "user1", 3, 60.0)

    def test_different_identifiers(self):
        limiter = RateLimiter()
        limiter.check_and_consume("test", "user1", 1, 60.0)
        limiter.check_and_consume("test", "user2", 1, 60.0)  # Different user

    def test_get_usage(self):
        limiter = RateLimiter()
        limiter.check_and_consume("test", "user1", 10, 60.0)
        assert limiter.get_usage("test", "user1", 60.0) == 1


# ─── Token Usage Tests ───


class TestTokenUsage:
    def test_estimate_cost(self):
        cost = estimate_cost(1000, 500, "gpt-5")
        assert cost > 0

    def test_build_usage(self):
        usage = build_usage(100, 200, "gpt-5")
        assert usage.prompt_tokens == 100
        assert usage.completion_tokens == 200
        assert usage.total_tokens == 300
        assert usage.estimated_cost_usd > 0

    def test_track_usage(self):
        entry = track_usage(100, 200, "gpt-5", latency_ms=150.0)
        assert entry.prompt_tokens == 100
        assert entry.status == "success"

    def test_get_usage_history(self):
        from app.services.ai.token_usage import _history
        initial_len = len(_history)
        track_usage(10, 20, "gpt-5")
        assert len(_history) == initial_len + 1


# ─── Conversation Memory Tests ───


class TestConversationMemory:
    def test_add_message(self):
        mem = ConversationMemory()
        mem.add_message("user", "hello")
        assert mem.get_message_count() == 1

    def test_needs_summarization(self):
        mem = ConversationMemory(max_recent=50)
        for i in range(10):
            mem.add_message("user", f"msg {i}")
        assert mem.needs_summarization(threshold=5) is True

    def test_trim(self):
        mem = ConversationMemory(max_recent=3)
        for i in range(5):
            mem.recent_messages.append({
                "role": "user",
                "content": f"msg {i}",
                "timestamp": "2025-01-01T00:00:00Z",
            })
        trimmed = mem.trim()
        assert len(trimmed) == 2
        assert mem.get_message_count() == 3

    def test_build_messages_for_ai(self):
        mem = ConversationMemory()
        mem.add_message("user", "hello")
        msgs = mem.build_messages_for_ai("You are helpful.")
        assert msgs[0]["role"] == "system"
        assert msgs[1]["role"] == "user"
        assert msgs[1]["content"] == "hello"

    def test_build_messages_with_summary(self):
        mem = ConversationMemory(summary="Earlier discussion about careers.")
        mem.add_message("user", "tell me more")
        msgs = mem.build_messages_for_ai("System prompt")
        assert len(msgs) == 3
        assert "Summary" in msgs[1]["content"]

    def test_clear(self):
        mem = ConversationMemory()
        mem.add_message("user", "hello")
        mem.summary = "test"
        mem.clear()
        assert mem.get_message_count() == 0
        assert mem.summary is None


# ─── Model Tests ───


class TestModels:
    def test_ai_response(self):
        usage = TokenUsage(prompt_tokens=10, completion_tokens=20, total_tokens=30, estimated_cost_usd=0.01)
        resp = AIResponse(
            content="test", finish_reason="stop",
            token_usage=usage, model="gpt-5",
            latency_ms=100.0, request_id="req-1",
        )
        assert resp.content == "test"
        assert resp.token_usage.total_tokens == 30

    def test_ai_health_status(self):
        status = AIHealthStatus(
            status="healthy", azure_connected=True,
            deployment_available=True, authentication_valid=True,
            latency_ms=200.0, model="gpt-5",
            endpoint="https://test.com", error=None,
        )
        assert status.status == "healthy"


# ─── Exception Tests ───


class TestExceptions:
    def test_ai_error(self):
        exc = AIError("test")
        assert str(exc) == "test"

    def test_ai_service_error(self):
        exc = AIServiceError("unavailable", status_code=503)
        assert exc.status_code == 503

    def test_ai_timeout_error(self):
        exc = AITimeoutError()
        assert "timed out" in str(exc)

    def test_ai_rate_limit_error(self):
        exc = AIRateLimitError(retry_after=30.0)
        assert exc.status_code == 429
        assert exc.retry_after == 30.0

    def test_ai_validation_error(self):
        exc = AIValidationError("bad json")
        assert "bad json" in str(exc)

    def test_ai_retry_exhausted_error(self):
        exc = AIRetryExhaustedError(attempts=3)
        assert "3 attempts" in str(exc)


# ─── Health Endpoint Tests ───


class TestAIHealthEndpoint:
    @pytest.mark.anyio
    async def test_ai_health_unconfigured(self, client):
        resp = await client.get("/health/ai")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data


# ─── Chat Integration Tests ───


class TestChatIntegration:
    @pytest.mark.anyio
    async def test_chat_health(self, auth_client):
        resp = await auth_client.get("/v1/chat/health")
        assert resp.status_code == 200

    @pytest.mark.anyio
    async def test_ai_health_endpoint(self, auth_client):
        resp = await auth_client.get("/v1/ai/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "azure_connected" in data

    @pytest.mark.anyio
    async def test_ai_test_requires_auth(self, client):
        resp = await client.post("/v1/ai/test", json={"message": "test"},
                                 headers={"Authorization": "Bearer invalid"})
        assert resp.status_code == 401

    @pytest.mark.anyio
    async def test_main_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    @pytest.mark.anyio
    async def test_main_ai_health(self, client):
        resp = await client.get("/health/ai")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data


# ─── Prompt Content Tests ───


class TestPromptContent:
    def test_system_prompt_content(self):
        from app.services.ai.prompt_loader import load_prompt
        content = load_prompt("system")
        assert "Tophexity" in content
        assert "career" in content.lower()

    def test_chat_prompt_content(self):
        from app.services.ai.prompt_loader import load_prompt
        content = load_prompt("chat")
        assert "conversation" in content.lower()

    def test_recommendation_prompt_content(self):
        from app.services.ai.prompt_loader import load_prompt
        content = load_prompt("recommendation")
        assert "json" in content.lower()
        assert "match_score" in content

    def test_roadmap_prompt_content(self):
        from app.services.ai.prompt_loader import load_prompt
        content = load_prompt("roadmap")
        assert "steps" in content.lower()

    def test_backup_prompt_content(self):
        from app.services.ai.prompt_loader import load_prompt
        content = load_prompt("backup")
        assert "scenarios" in content.lower()
