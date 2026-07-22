from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest


@pytest.mark.anyio
async def test_create_roadmap(auth_client):
    with patch("app.api.v1.roadmaps.roadmap_service.create_roadmap", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(), "career_id": uuid4(),
            "title": "My Roadmap", "description": None,
            "status": "active", "estimated_duration_months": 12,
            "steps": [],
            "created_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.post("/v1/roadmaps", json={
            "career_id": str(uuid4()),
            "title": "My Roadmap",
            "steps": [{
                "title": "Step 1",
                "step_order": 1,
            }],
        })
        assert response.status_code == 201


@pytest.mark.anyio
async def test_get_roadmap(auth_client):
    with patch("app.api.v1.roadmaps.roadmap_service.get_roadmap", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(), "career_id": uuid4(),
            "title": "Test", "description": None,
            "status": "active", "estimated_duration_months": None,
            "steps": [],
            "created_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.get(f"/v1/roadmaps/{uuid4()}")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_roadmap_not_found(auth_client):
    from app.utils.exceptions import NotFoundException
    with patch("app.api.v1.roadmaps.roadmap_service.get_roadmap", new_callable=AsyncMock) as mock_svc:
        mock_svc.side_effect = NotFoundException(detail="Roadmap not found")
        response = await auth_client.get(f"/v1/roadmaps/{uuid4()}")
        assert response.status_code == 404


@pytest.mark.anyio
async def test_list_roadmaps(auth_client):
    with patch("app.api.v1.roadmaps.roadmap_service.list_roadmaps", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 1,
        })()
        response = await auth_client.get("/v1/roadmaps/history")
        assert response.status_code == 200
