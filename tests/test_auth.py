from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest


@pytest.mark.anyio
async def test_register_success(client):
    with patch("app.api.v1.auth.auth_service.register_user", new_callable=AsyncMock) as mock:
        from app.schemas.auth import UserResponse
        mock.return_value = UserResponse(
            id=uuid4(), email="new@example.com", is_active=True,
            is_verified=False, role="user",
            created_at=datetime.now(timezone.utc),
        )
        response = await client.post("/v1/auth/register", json={
            "email": "new@example.com",
            "password": "securepassword123",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "new@example.com"


@pytest.mark.anyio
async def test_register_invalid_email(client):
    response = await client.post("/v1/auth/register", json={
        "email": "not-an-email",
        "password": "securepassword123",
    })
    assert response.status_code == 422


@pytest.mark.anyio
async def test_register_short_password(client):
    response = await client.post("/v1/auth/register", json={
        "email": "test@example.com",
        "password": "short",
    })
    assert response.status_code == 422


@pytest.mark.anyio
async def test_register_missing_fields(client):
    response = await client.post("/v1/auth/register", json={})
    assert response.status_code == 422


@pytest.mark.anyio
async def test_login_success(client):
    from app.schemas.auth import TokenResponse
    with patch("app.api.v1.auth.auth_service.authenticate_user", new_callable=AsyncMock) as mock:
        mock.return_value = TokenResponse(
            access_token="access123",
            refresh_token="refresh123",
            user_id=uuid4(),
            email="test@example.com",
        )
        response = await client.post("/v1/auth/login", json={
            "email": "test@example.com",
            "password": "password123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data


@pytest.mark.anyio
async def test_login_invalid_credentials(client):
    from app.utils.exceptions import UnauthorizedException
    with patch("app.api.v1.auth.auth_service.authenticate_user", new_callable=AsyncMock) as mock:
        mock.side_effect = UnauthorizedException(detail="Invalid email or password")
        response = await client.post("/v1/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401


@pytest.mark.anyio
async def test_refresh_token_success(client):
    from app.schemas.auth import TokenResponse
    with patch("app.api.v1.auth.auth_service.refresh_tokens", new_callable=AsyncMock) as mock:
        mock.return_value = TokenResponse(
            access_token="new_access",
            refresh_token="new_refresh",
            user_id=uuid4(),
            email="test@example.com",
        )
        response = await client.post("/v1/auth/refresh", json={
            "refresh_token": "old_refresh_token",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data


@pytest.mark.anyio
async def test_refresh_invalid_token(client):
    from app.utils.exceptions import UnauthorizedException
    with patch("app.api.v1.auth.auth_service.refresh_tokens", new_callable=AsyncMock) as mock:
        mock.side_effect = UnauthorizedException(detail="Invalid or expired refresh token")
        response = await client.post("/v1/auth/refresh", json={
            "refresh_token": "invalid_token",
        })
        assert response.status_code == 401


@pytest.mark.anyio
async def test_get_current_user(auth_client):
    response = await auth_client.get("/v1/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "id" in data


@pytest.mark.anyio
async def test_logout(auth_client):
    response = await auth_client.post("/v1/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"


@pytest.mark.anyio
async def test_protected_endpoint_no_auth(client):
    response = await client.get("/v1/auth/me")
    assert response.status_code == 422


@pytest.mark.anyio
async def test_protected_endpoint_invalid_auth(client):
    response = await client.get(
        "/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
