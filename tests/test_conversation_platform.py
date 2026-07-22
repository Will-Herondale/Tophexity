"""Integration tests for the AI Conversation Platform — new endpoints."""

from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest


@pytest.fixture
def mock_session():
    """Create a mock ChatSession with all new fields."""
    return type("MockSession", (), {
        "id": uuid4(),
        "user_id": uuid4(),
        "title": "Career Discussion",
        "is_archived": False,
        "is_pinned": False,
        "archived_at": None,
        "pinned_at": None,
        "summary": None,
        "summary_updated_at": None,
        "summary_message_count": 0,
        "session_data": {},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "messages": [],
    })()


class TestPatchSession:
    """Tests for PATCH /v1/chat/sessions/{id}."""

    @pytest.mark.anyio
    async def test_patch_title(self, auth_client):
        with patch("app.api.v1.chat.chat_service.update_chat_session", new_callable=AsyncMock) as mock_svc:
            mock_svc.return_value = type("R", (), {
                "id": uuid4(), "user_id": uuid4(),
                "title": "New Title",
                "is_archived": False, "is_pinned": False,
                "session_data": {},
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })()
            response = await auth_client.patch(
                f"/v1/chat/sessions/{uuid4()}",
                json={"title": "New Title"},
            )
            assert response.status_code == 200

    @pytest.mark.anyio
    async def test_patch_pin(self, auth_client):
        with patch("app.api.v1.chat.chat_service.update_chat_session", new_callable=AsyncMock) as mock_svc:
            mock_svc.return_value = type("R", (), {
                "id": uuid4(), "user_id": uuid4(),
                "title": "Test",
                "is_archived": False, "is_pinned": True,
                "session_data": {},
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })()
            response = await auth_client.patch(
                f"/v1/chat/sessions/{uuid4()}",
                json={"is_pinned": True},
            )
            assert response.status_code == 200


class TestChatStats:
    """Tests for GET /v1/chat/stats."""

    @pytest.mark.anyio
    async def test_stats(self, auth_client):
        with patch("app.api.v1.chat.chat_service.get_chat_stats", new_callable=AsyncMock) as mock_svc:
            mock_svc.return_value = {
                "total_sessions": 5,
                "active_sessions": 4,
                "archived_sessions": 1,
                "total_messages": 50,
                "total_tokens_used": 10000,
                "estimated_total_cost_usd": 0.3,
                "average_messages_per_session": 10.0,
                "first_conversation_at": "2026-07-01T10:00:00Z",
                "last_conversation_at": "2026-07-22T14:30:00Z",
            }
            response = await auth_client.get("/v1/chat/stats")
            assert response.status_code == 200
            data = response.json()
            assert data["total_sessions"] == 5
            assert data["total_messages"] == 50


class TestExportSession:
    """Tests for GET /v1/chat/sessions/{id}/export."""

    @pytest.mark.anyio
    async def test_export_json(self, auth_client):
        with patch("app.api.v1.chat.chat_service.export_chat_session", new_callable=AsyncMock) as mock_svc:
            mock_svc.return_value = {
                "session": {"id": str(uuid4()), "title": "Test", "created_at": None, "message_count": 2},
                "summary": None,
                "messages": [
                    {"role": "user", "content": "Hello", "timestamp": None},
                    {"role": "assistant", "content": "Hi!", "timestamp": None},
                ],
            }
            response = await auth_client.get(
                f"/v1/chat/sessions/{uuid4()}/export",
                params={"format": "json"},
            )
            assert response.status_code == 200
            data = response.json()
            assert len(data["messages"]) == 2


class TestRebuildMemory:
    """Tests for POST /v1/chat/sessions/{id}/rebuild-memory."""

    @pytest.mark.anyio
    async def test_rebuild_memory(self, auth_client):
        with patch("app.api.v1.chat.ConversationManager") as MockCM:
            mock_instance = AsyncMock()
            mock_instance.get_session.return_value = type("S", (), {"id": uuid4()})()
            mock_instance.rebuild_memory.return_value = {
                "summary": "New summary",
                "summary_message_count": 10,
                "facts_count": 3,
            }
            MockCM.return_value = mock_instance
            response = await auth_client.post(f"/v1/chat/sessions/{uuid4()}/rebuild-memory")
            assert response.status_code == 200
            data = response.json()
            assert data["summary"] == "New summary"
            assert data["facts_count"] == 3


class TestListSessionsEnhanced:
    """Tests for enhanced GET /v1/chat/sessions with search/filter."""

    @pytest.mark.anyio
    async def test_list_with_search(self, auth_client):
        with patch("app.api.v1.chat.chat_service.list_chat_sessions", new_callable=AsyncMock) as mock_svc:
            mock_svc.return_value = type("R", (), {
                "items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 1,
            })()
            response = await auth_client.get(
                "/v1/chat/sessions",
                params={"search": "career", "is_archived": True},
            )
            assert response.status_code == 200
            # Verify the service was called with search/filter params
            call_kwargs = mock_svc.call_args
            assert call_kwargs[1]["search"] == "career"
            assert call_kwargs[1]["is_archived"] is True
