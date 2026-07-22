# Tophexity — AI Career Path Creator

Production-quality proof of concept for AI-driven career guidance.

## Tech Stack

- **Python 3.13** / **FastAPI**
- **Pydantic v2** / **SQLAlchemy 2.x** (async)
- **PostgreSQL 16** (Azure Database for PostgreSQL Flexible Server)
- **Alembic** for migrations
- **JWT Authentication**
- **Azure App Service** for deployment
- **Azure AI Foundry** or **NVIDIA NIM** for AI capabilities

## Project Structure

```
app/
├── main.py                # FastAPI application factory and entrypoint
├── core/
│   ├── config.py          # Pydantic Settings configuration
│   ├── database.py        # Async SQLAlchemy engine, session factory, Base
│   └── logging.py         # Structured logging setup
├── api/
│   ├── deps.py            # Dependency injection (DB session, auth, etc.)
│   └── v1/
│       ├── router.py      # v1 API router aggregator
│       ├── auth.py        # Authentication endpoints
│       ├── users.py       # User profile endpoints
│       ├── recommendations.py  # AI career recommendations
│       ├── roadmaps.py    # Personalized career roadmaps
│       ├── portfolio.py   # Portfolio tracking
│       └── chat.py        # AI career assistant chat
├── models/
│   ├── base.py            # SQLAlchemy declarative base
│   ├── mixins.py          # UUID PK, timestamps, soft-delete mixins
│   ├── enums.py           # All enum types
│   ├── user.py            # User model
│   ├── profile.py         # Profile, ProfileVersion
│   ├── portfolio.py       # PortfolioItem
│   ├── career.py          # Career, Skill, Degree, College, Exam, Scholarship, Resource + junction tables
│   ├── recommendation.py  # Recommendation, RecommendationItem
│   ├── roadmap.py         # Roadmap, RoadmapStep
│   ├── backup.py          # BackupPlan, BackupScenario
│   └── chat.py            # ChatSession, ChatMessage
├── schemas/
│   └── common.py          # Shared Pydantic response schemas
├── services/
│   ├── ai_client.py       # Azure AI Foundry / NIM client
│   └── recommendation_client.py  # Razer's recommendation engine client
├── middleware/
│   └── timing.py          # Request timing middleware
└── utils/
    └── exceptions.py      # Custom HTTP exceptions
alembic/                   # Database migration config
tests/                     # Pytest test suite
```

## Database

### Tables (26)

**Authentication**: `users`

**Profiles**: `profiles`, `profile_versions`

**Portfolio**: `portfolio_items`

**Career Knowledge**: `careers`, `skills`, `career_skills`, `degrees`, `career_degrees`, `colleges`, `career_colleges`, `entrance_exams`, `career_entrance_exams`, `scholarships`, `career_scholarships`, `resources`, `career_resources`, `career_relations`

**AI Generated**: `recommendations`, `recommendation_items`, `roadmaps`, `roadmap_steps`, `backup_plans`, `backup_scenarios`

**Chat**: `chat_sessions`, `chat_messages`

### Features

- UUID primary keys on all tables
- `created_at` / `updated_at` timestamps with `server_default=now()`
- Soft-delete on `users` and `portfolio_items` (`deleted_at`)
- Cascade deletes on all foreign keys
- Composite unique constraints on junction tables
- Enum types for role, skill level, relation type, statuses, chat message role

## Setup

```bash
cp .env.example .env     # Configure environment variables
pip install -r requirements.txt
alembic upgrade head      # Apply database migrations
uvicorn app.main:app --reload
```

## Running Tests

```bash
pytest
```

## Team

| Developer | Responsibility |
|-----------|---------------|
| 7_39am | Backend, APIs, Auth, Azure, Infra |
| HalfPanda | Frontend, UI |
| Razer | Recommendation Engine, Career Data |
