from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.api.deps import get_current_active_user
from app.models.enums import UserRole


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
        "created_at": datetime.now(timezone.utc),
    })()


@pytest.fixture
def auth_client(client, mock_user):
    app.dependency_overrides[get_current_active_user] = lambda: mock_user
    yield client
    app.dependency_overrides.clear()
