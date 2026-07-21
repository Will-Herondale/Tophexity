# Tophexity — AI Career Path Creator

Production-quality proof of concept for AI-driven career guidance.

## Tech Stack

- **Python 3.13** / **FastAPI**
- **Pydantic v2** / **SQLAlchemy 2.x** (async)
- **PostgreSQL** (Azure Database for PostgreSQL Flexible Server)
- **Alembic** for migrations
- **JWT Authentication**
- **Azure App Service** for deployment
- **Azure AI Foundry** or **NVIDIA NIM** for AI capabilities

## Project Structure

```
app/
├── main.py              # FastAPI application factory and entrypoint
├── core/
│   ├── config.py        # Pydantic Settings configuration
│   ├── database.py      # Async SQLAlchemy engine, session factory, Base
│   └── logging.py       # Structured logging setup
├── api/
│   ├── deps.py          # Dependency injection (DB session, auth, etc.)
│   └── v1/
│       ├── router.py    # v1 API router aggregator
│       ├── auth.py       # Authentication endpoints
│       ├── users.py      # User profile endpoints
│       ├── recommendations.py  # AI career recommendations
│       ├── roadmaps.py   # Personalized career roadmaps
│       ├── portfolio.py  # Portfolio tracking
│       └── chat.py       # AI career assistant chat
├── models/
│   └── base.py          # SQLAlchemy declarative base
├── schemas/
│   └── common.py        # Shared Pydantic response schemas
├── services/
│   ├── ai_client.py             # Azure AI Foundry / NIM client
│   └── recommendation_client.py # Razer's recommendation engine client
├── middleware/
│   └── timing.py        # Request timing middleware
└── utils/
    └── exceptions.py    # Custom HTTP exceptions
alembic/                 # Database migration config
tests/                   # Pytest test suite
```

## Setup

```bash
cp .env.example .env     # Configure environment variables
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Running Tests

```bash
pytest
```

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Team

| Developer | Responsibility |
|-----------|---------------|
| 7_39am | Backend, APIs, Auth, Azure, Infra |
| HalfPanda | Frontend, UI |
| Razer | Recommendation Engine, Career Data |
