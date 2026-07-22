from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest


@pytest.mark.anyio
async def test_create_profile(auth_client):
    with patch("app.api.v1.users.profile_service.create_profile", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(),
            "full_name": "Test User", "headline": None, "bio": None,
            "location": None, "avatar_url": None, "education_level": None,
            "years_experience": None, "current_field": None,
            "target_fields": None, "skills": None, "interests": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.post("/v1/users/profile", json={
            "full_name": "Test User",
            "headline": "Developer",
        })
        assert response.status_code == 201


@pytest.mark.anyio
async def test_get_profile(auth_client):
    with patch("app.api.v1.users.profile_service.get_profile", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(),
            "full_name": "Test User", "headline": None, "bio": None,
            "location": None, "avatar_url": None, "education_level": None,
            "years_experience": None, "current_field": None,
            "target_fields": None, "skills": None, "interests": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.get("/v1/users/profile")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_profile_not_found(auth_client):
    from app.utils.exceptions import NotFoundException
    with patch("app.api.v1.users.profile_service.get_profile", new_callable=AsyncMock) as mock_svc:
        mock_svc.side_effect = NotFoundException(detail="Profile not found")
        response = await auth_client.get("/v1/users/profile")
        assert response.status_code == 404


@pytest.mark.anyio
async def test_update_profile(auth_client):
    with patch("app.api.v1.users.profile_service.update_profile", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(),
            "full_name": "Updated Name", "headline": None, "bio": None,
            "location": None, "avatar_url": None, "education_level": None,
            "years_experience": None, "current_field": None,
            "target_fields": None, "skills": None, "interests": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.put("/v1/users/profile", json={
            "full_name": "Updated Name",
        })
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_profile_versions(auth_client):
    with patch("app.api.v1.users.profile_service.get_profile_versions", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = []
        response = await auth_client.get("/v1/users/profile/versions")
        assert response.status_code == 200
