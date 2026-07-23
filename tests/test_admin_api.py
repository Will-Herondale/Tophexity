from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest

from app.models.enums import UserRole


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def admin_user():
    return type("User", (), {
        "id": uuid4(),
        "email": "admin@example.com",
        "hashed_password": "hashed",
        "is_active": True,
        "is_verified": True,
        "role": UserRole.ADMIN,
        "created_at": datetime.now(timezone.utc),
    })()


@pytest.fixture
def regular_user():
    return type("User", (), {
        "id": uuid4(),
        "email": "user@example.com",
        "hashed_password": "hashed",
        "is_active": True,
        "is_verified": True,
        "role": UserRole.USER,
        "created_at": datetime.now(timezone.utc),
    })()


@pytest.fixture
def admin_client(client, admin_user):
    from app.main import app
    from app.api.deps import get_current_active_user
    app.dependency_overrides[get_current_active_user] = lambda: admin_user
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def user_client(client, regular_user):
    from app.main import app
    from app.api.deps import get_current_active_user
    app.dependency_overrides[get_current_active_user] = lambda: regular_user
    yield client
    app.dependency_overrides.clear()


MOCK_DB_SESSION = AsyncMock()


def _patch_db():
    from app.main import app
    from app.api.deps import get_db_session
    mock = AsyncMock()
    app.dependency_overrides[get_db_session] = lambda: mock
    return mock


# ---------------------------------------------------------------------------
# TestAdminEndpoints
# ---------------------------------------------------------------------------
class TestAdminEndpoints:
    @pytest.mark.anyio
    async def test_metrics_requires_admin(self, user_client):
        resp = await user_client.get("/v1/admin/metrics")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_prompts_requires_admin(self, user_client):
        resp = await user_client.get("/v1/admin/prompts")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_diagnostics_requires_admin(self, user_client):
        resp = await user_client.get("/v1/admin/diagnostics")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_cache_clear_requires_admin(self, user_client):
        resp = await user_client.post("/v1/admin/cache/clear")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_rate_limits_requires_admin(self, user_client):
        resp = await user_client.get("/v1/admin/rate-limits")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_prompts_list(self, admin_client):
        resp = await admin_client.get("/v1/admin/prompts")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "name" in data[0]

    @pytest.mark.anyio
    async def test_prompt_detail(self, admin_client):
        resp = await admin_client.get("/v1/admin/prompts/chat")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "chat"
        assert "metadata" in data
        assert "content" in data
        assert "cache_status" in data

    @pytest.mark.anyio
    async def test_invalidate_prompt_cache(self, admin_client):
        resp = await admin_client.post("/v1/admin/prompts/chat/invalidate")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "chat" in data["message"]

    @pytest.mark.anyio
    async def test_clear_caches(self, admin_client):
        resp = await admin_client.post("/v1/admin/cache/clear")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"

    @pytest.mark.anyio
    async def test_metrics_response_shape(self, admin_client):
        mock_db = _patch_db()
        mock_db.execute = AsyncMock(return_value=MagicMock(
            one=MagicMock(return_value=MagicMock(total=0, active_24h=0))
        ))
        resp = await admin_client.get("/v1/admin/metrics")
        assert resp.status_code == 200
        data = resp.json()
        assert "users" in data
        assert "chat_sessions" in data
        assert "ai_requests_24h" in data
        assert "tokens_24h" in data
        assert "latency_24h" in data
        assert "security_24h" in data
        assert "circuit_breaker" in data
        assert "prompt_cache" in data

    @pytest.mark.anyio
    async def test_diagnostics_response_shape(self, admin_client):
        mock_db = _patch_db()
        mock_db.execute = AsyncMock(return_value=MagicMock())
        resp = await admin_client.get("/v1/admin/diagnostics")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "db_status" in data
        assert "prompt_cache" in data
        assert "circuit_breaker" in data
