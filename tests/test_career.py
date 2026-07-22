from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest


@pytest.mark.anyio
async def test_import_careers(auth_client):
    with patch("app.api.v1.careers.career_service.import_careers", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "imported": 1, "skipped": 0, "careers": [],
        })()
        response = await auth_client.post("/v1/careers/import", json={
            "careers": [{
                "title": "Software Engineer",
                "description": "Build software",
                "average_salary": 95000,
            }]
        })
        assert response.status_code == 201


@pytest.mark.anyio
async def test_import_careers_empty(auth_client):
    with patch("app.api.v1.careers.career_service.import_careers", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "imported": 0, "skipped": 0, "careers": [],
        })()
        response = await auth_client.post("/v1/careers/import", json={"careers": []})
        assert response.status_code == 201


@pytest.mark.anyio
async def test_search_careers(client):
    with patch("app.api.v1.careers.career_service.search_careers", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 1,
        })()
        response = await client.get("/v1/careers")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_search_careers_with_filters(client):
    with patch("app.api.v1.careers.career_service.search_careers", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 1,
        })()
        response = await client.get("/v1/careers?search=python&skill=Python&page=1&page_size=10")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_career_detail(client):
    career_id = uuid4()
    with patch("app.api.v1.careers.career_service.get_career_detail", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": career_id, "title": "Software Engineer",
            "description": "Build software", "average_salary": 95000,
            "growth_outlook": "above_average", "demand_level": "high",
            "required_education": None, "typical_skills": None,
            "skills": [], "degrees": [], "colleges": [],
            "exams": [], "scholarships": [], "resources": [],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await client.get(f"/v1/careers/{career_id}")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_career_not_found(client):
    with patch("app.api.v1.careers.career_service.get_career_detail", new_callable=AsyncMock) as mock_svc:
        from app.utils.exceptions import NotFoundException
        mock_svc.side_effect = NotFoundException(detail="Career not found")
        response = await client.get(f"/v1/careers/{uuid4()}")
        assert response.status_code == 404


@pytest.mark.anyio
async def test_update_career(auth_client):
    career_id = uuid4()
    with patch("app.api.v1.careers.career_service.update_career", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": career_id, "title": "Updated Title",
            "description": "Updated", "average_salary": 100000,
            "growth_outlook": None, "demand_level": None,
            "required_education": None, "typical_skills": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.put(f"/v1/careers/{career_id}", json={
            "title": "Updated Title",
        })
        assert response.status_code == 200


@pytest.mark.anyio
async def test_delete_career(auth_client):
    with patch("app.api.v1.careers.career_service.delete_career", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = None
        response = await auth_client.delete(f"/v1/careers/{uuid4()}")
        assert response.status_code == 200
        assert response.json()["message"] == "Career deleted successfully"
