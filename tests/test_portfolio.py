from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest


@pytest.mark.anyio
async def test_create_portfolio_item(auth_client):
    with patch("app.api.v1.portfolio.portfolio_service.create_portfolio_item", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(), "title": "My Project",
            "description": None, "url": None, "item_type": "project",
            "skills_used": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.post("/v1/portfolio/items", json={
            "title": "My Project",
            "item_type": "project",
            "description": "A test project",
        })
        assert response.status_code == 201


@pytest.mark.anyio
async def test_list_portfolio_items(auth_client):
    with patch("app.api.v1.portfolio.portfolio_service.list_portfolio_items", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 1,
        })()
        response = await auth_client.get("/v1/portfolio/items")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_portfolio_item(auth_client):
    item_id = uuid4()
    with patch("app.api.v1.portfolio.portfolio_service.get_portfolio_item", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": item_id, "user_id": uuid4(), "title": "My Project",
            "description": None, "url": None, "item_type": "project",
            "skills_used": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.get(f"/v1/portfolio/items/{item_id}")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_portfolio_item_not_found(auth_client):
    from app.utils.exceptions import NotFoundException
    with patch("app.api.v1.portfolio.portfolio_service.get_portfolio_item", new_callable=AsyncMock) as mock_svc:
        mock_svc.side_effect = NotFoundException(detail="Portfolio item not found")
        response = await auth_client.get(f"/v1/portfolio/items/{uuid4()}")
        assert response.status_code == 404


@pytest.mark.anyio
async def test_update_portfolio_item(auth_client):
    item_id = uuid4()
    with patch("app.api.v1.portfolio.portfolio_service.update_portfolio_item", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": item_id, "user_id": uuid4(), "title": "Updated Project",
            "description": None, "url": None, "item_type": "project",
            "skills_used": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.put(f"/v1/portfolio/items/{item_id}", json={
            "title": "Updated Project",
        })
        assert response.status_code == 200


@pytest.mark.anyio
async def test_delete_portfolio_item(auth_client):
    with patch("app.api.v1.portfolio.portfolio_service.delete_portfolio_item", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = None
        response = await auth_client.delete(f"/v1/portfolio/items/{uuid4()}")
        assert response.status_code == 200
        assert response.json()["message"] == "Portfolio item deleted"


@pytest.mark.anyio
async def test_create_portfolio_item_invalid_type(auth_client):
    response = await auth_client.post("/v1/portfolio/items", json={
        "title": "Test",
        "item_type": "invalid_type",
    })
    assert response.status_code == 422
