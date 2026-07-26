from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest


@pytest.mark.anyio
async def test_create_session(auth_client):
    with patch("app.api.v1.chat.chat_service.create_chat_session", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(),
            "title": "Career Discussion",
            "is_archived": False, "is_pinned": False,
            "session_data": {},
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.post("/v1/chat/sessions", json={
            "title": "Career Discussion",
        })
        assert response.status_code == 201


@pytest.mark.anyio
async def test_list_sessions(auth_client):
    with patch("app.api.v1.chat.chat_service.list_chat_sessions", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 1,
            "is_archived": False, "is_pinned": False,
            "session_data": {},
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.get("/v1/chat/sessions")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_session_messages(auth_client):
    with patch("app.api.v1.chat.chat_service.get_session_messages", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(),
            "title": "Test", "messages": [],
            "is_archived": False, "is_pinned": False,
            "summary": None, "session_data": {},
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.get(f"/v1/chat/sessions/{uuid4()}")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_add_messages(auth_client):
    session_id = uuid4()
    with patch("app.api.v1.chat.chat_service.add_messages", new_callable=AsyncMock) as mock_svc, \
         patch("app.api.v1.chat.get_ai_client") as mock_get_client:
        mock_svc.return_value = [
            type("R", (), {
                "model_dump": lambda self: {}, "json": lambda self: "{}",
                "id": uuid4(), "session_id": session_id,
                "role": "user", "content": "Hello",
                "token_count": None, "model_used": None,
                "latency_ms": None, "request_id": None,
                "message_data": {},
                "created_at": datetime.now(timezone.utc),
            })()
        ]
        mock_client = mock_get_client.return_value
        mock_client.is_configured = False
        response = await auth_client.post(f"/v1/chat/sessions/{session_id}/messages", json=[
            {"role": "user", "content": "Hello"},
        ])
        assert response.status_code == 201


@pytest.mark.anyio
async def test_delete_session(auth_client):
    with patch("app.api.v1.chat.chat_service.delete_chat_session", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = None
        response = await auth_client.delete(f"/v1/chat/sessions/{uuid4()}")
        assert response.status_code == 200
        assert response.json()["message"] == "Chat session deleted"


@pytest.mark.anyio
async def test_get_session_not_found(auth_client):
    from app.utils.exceptions import NotFoundException
    with patch("app.api.v1.chat.chat_service.get_session_messages", new_callable=AsyncMock) as mock_svc:
        mock_svc.side_effect = NotFoundException(detail="Chat session not found")
        response = await auth_client.get(f"/v1/chat/sessions/{uuid4()}")
        assert response.status_code == 404


@pytest.mark.anyio
async def test_add_messages_invalid_role(auth_client):
    response = await auth_client.post(f"/v1/chat/sessions/{uuid4()}/messages", json=[
        {"role": "invalid_role", "content": "Hello"},
    ])
    assert response.status_code == 422


@pytest.mark.anyio
async def test_get_chat_history(auth_client):
    session_id = uuid4()
    with patch("app.api.v1.chat.chat_service.get_chat_history", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "items": [], "total": 0, "page": 1, "page_size": 50, "total_pages": 1,
        })()
        response = await auth_client.get(f"/v1/chat/sessions/{session_id}/messages")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_update_message(auth_client):
    session_id = uuid4()
    message_id = uuid4()
    with patch("app.api.v1.chat.chat_service.update_chat_message", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": message_id, "session_id": session_id,
            "role": "user", "content": "Updated content",
            "token_count": None, "model_used": None,
            "latency_ms": None, "request_id": None,
            "message_data": {},
            "created_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.patch(
            f"/v1/chat/sessions/{session_id}/messages/{message_id}",
            json={"content": "Updated content"},
        )
        assert response.status_code == 200


@pytest.mark.anyio
async def test_delete_message(auth_client):
    session_id = uuid4()
    message_id = uuid4()
    with patch("app.api.v1.chat.chat_service.delete_chat_message", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = None
        response = await auth_client.delete(
            f"/v1/chat/sessions/{session_id}/messages/{message_id}",
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Chat message deleted"


@pytest.mark.anyio
async def test_update_message_not_found(auth_client):
    from app.utils.exceptions import NotFoundException
    session_id = uuid4()
    message_id = uuid4()
    with patch("app.api.v1.chat.chat_service.update_chat_message", new_callable=AsyncMock) as mock_svc:
        mock_svc.side_effect = NotFoundException(detail="Chat message not found")
        response = await auth_client.patch(
            f"/v1/chat/sessions/{session_id}/messages/{message_id}",
            json={"content": "Updated"},
        )
        assert response.status_code == 404


@pytest.mark.anyio
async def test_delete_message_not_found(auth_client):
    from app.utils.exceptions import NotFoundException
    session_id = uuid4()
    message_id = uuid4()
    with patch("app.api.v1.chat.chat_service.delete_chat_message", new_callable=AsyncMock) as mock_svc:
        mock_svc.side_effect = NotFoundException(detail="Chat message not found")
        response = await auth_client.delete(
            f"/v1/chat/sessions/{session_id}/messages/{message_id}",
        )
        assert response.status_code == 404


@pytest.mark.anyio
async def test_update_message_empty_content(auth_client):
    session_id = uuid4()
    message_id = uuid4()
    response = await auth_client.patch(
        f"/v1/chat/sessions/{session_id}/messages/{message_id}",
        json={"content": ""},
    )
    assert response.status_code == 422
