from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

import pytest


@pytest.mark.anyio
async def test_create_recommendation(auth_client):
    with patch("app.api.v1.recommendations.recommendation_service.create_recommendation", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(),
            "title": "Career Recommendations",
            "summary": "Based on your profile",
            "status": "completed",
            "items": [],
            "created_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.post("/v1/recommendations", json={
            "title": "Career Recommendations",
            "summary": "Based on your profile",
            "items": [{
                "career_id": str(uuid4()),
                "match_score": 85.5,
                "reasoning": "Good match",
                "rank": 1,
            }],
        })
        assert response.status_code == 201


@pytest.mark.anyio
async def test_get_recommendation(auth_client):
    with patch("app.api.v1.recommendations.recommendation_service.get_recommendation", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "id": uuid4(), "user_id": uuid4(),
            "title": "Test", "summary": None,
            "status": "completed", "items": [],
            "created_at": datetime.now(timezone.utc),
        })()
        response = await auth_client.get(f"/v1/recommendations/{uuid4()}")
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_recommendation_not_found(auth_client):
    from app.utils.exceptions import NotFoundException
    with patch("app.api.v1.recommendations.recommendation_service.get_recommendation", new_callable=AsyncMock) as mock_svc:
        mock_svc.side_effect = NotFoundException(detail="Recommendation not found")
        response = await auth_client.get(f"/v1/recommendations/{uuid4()}")
        assert response.status_code == 404


@pytest.mark.anyio
async def test_list_recommendations(auth_client):
    with patch("app.api.v1.recommendations.recommendation_service.list_recommendations", new_callable=AsyncMock) as mock_svc:
        mock_svc.return_value = type("R", (), {
            "model_dump": lambda self: {}, "json": lambda self: "{}",
            "items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 1,
        })()
        response = await auth_client.get("/v1/recommendations/history")
        assert response.status_code == 200
