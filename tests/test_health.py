import pytest


@pytest.mark.anyio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.anyio
async def test_v1_auth_health(client):
    response = await client.get("/api/v1/auth/health")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_v1_users_health(client):
    response = await client.get("/api/v1/users/health")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_v1_recommendations_health(client):
    response = await client.get("/api/v1/recommendations/health")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_v1_roadmaps_health(client):
    response = await client.get("/api/v1/roadmaps/health")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_v1_portfolio_health(client):
    response = await client.get("/api/v1/portfolio/health")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_v1_chat_health(client):
    response = await client.get("/api/v1/chat/health")
    assert response.status_code == 200
