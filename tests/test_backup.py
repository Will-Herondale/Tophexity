from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest


@pytest.mark.anyio
async def test_create_backup_plan(auth_client):
    with patch("app.api.v1.backups.backup_service.create_backup_plan", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(),
            "title": "My Backup Plan", "description": None,
            "status": "active", "scenarios": [],
            "created_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.post("/v1/backups", json={
            "title": "My Backup Plan",
            "scenarios": [{
                "career_id": str(uuid4()),
                "scenario_name": "Switch to Data Science",
                "description": "Alternative path",
            }],
        })
        assert response.status_code == 201


@pytest.mark.anyio
async def test_get_backup_plan(auth_client):
    with patch("app.api.v1.backups.backup_service.get_backup_plan", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(),
            "title": "Test", "description": None,
            "status": "active", "scenarios": [],
            "created_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.get(f"/v1/backups/{uuid4()}")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_backup_plan_not_found(auth_client):
    from app.utils.exceptions import NotFoundException
    with patch("app.api.v1.backups.backup_service.get_backup_plan", new_callable=AsyncMock) as mock_svc:
        mock_svc.side_effect = NotFoundException(detail="Backup plan not found")
        response = await auth_client.get(f"/v1/backups/{uuid4()}")
        assert response.status_code == 404


@pytest.mark.anyio
async def test_list_backup_plans(auth_client):
    with patch("app.api.v1.backups.backup_service.list_backup_plans", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 1,
        })()
        response = await auth_client.get("/v1/backups/history")
        assert response.status_code == 200
