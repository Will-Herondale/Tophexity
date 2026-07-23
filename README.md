# Tophexity — AI Career Path Creator

Production-quality proof of concept for AI-driven career guidance.

## Tech Stack

- **Python 3.14** (local) / **3.11** (Azure Functions)
- **FastAPI** / **Azure Functions** (hybrid hosting)
- **Pydantic v2** / **SQLAlchemy 2.x** (async)
- **PostgreSQL 16** (Azure Database for PostgreSQL Flexible Server)
- **Alembic** for migrations
- **JWT Authentication** (access + refresh tokens)
- **Azure Functions** for deployment
- **Azure OpenAI (GPT-5)** for AI capabilities
- **OpenAI Python SDK** (`AsyncAzureOpenAI`)

## Project Structure

```
app/
├── main.py                    # FastAPI application factory with lifespan
├── core/
│   ├── config.py              # Pydantic Settings (all env vars)
│   ├── database.py            # Async SQLAlchemy engine, session factory
│   ├── logging.py             # Structured logging setup
│   ├── security.py            # Password hashing, JWT helpers
│   ├── startup_validation.py  # Fail-fast config validation at boot
│   └── structured_logging.py  # JSON/text structured logging with request context
├── api/
│   ├── deps.py                # Dependency injection (DB session, auth)
│   └── v1/
│       ├── router.py          # v1 API router aggregator
│       ├── auth.py            # Register, login, refresh, profile
│       ├── users.py           # User profile CRUD
│       ├── careers.py         # Career knowledge base
│       ├── recommendations.py # AI career recommendations
│       ├── roadmaps.py        # Personalized career roadmaps
│       ├── backups.py         # Backup career plans
│       ├── portfolio.py       # Portfolio tracking
│       ├── chat.py            # AI career assistant chat
│       ├── ai.py              # AI prompt management & testing
│       └── admin.py           # Admin metrics, diagnostics, cache mgmt
├── models/
│   ├── base.py                # SQLAlchemy declarative base
│   ├── mixins.py              # UUID PK, timestamps, soft-delete mixins
│   ├── enums.py               # All enum types
│   ├── user.py                # User model
│   ├── profile.py             # Profile, ProfileVersion
│   ├── portfolio.py           # PortfolioItem
│   ├── career.py              # Career, Skill, Degree, College, Exam, Scholarship, Resource + junctions
│   ├── recommendation.py      # Recommendation, RecommendationItem
│   ├── roadmap.py             # Roadmap, RoadmapStep
│   ├── backup.py              # BackupPlan, BackupScenario
│   ├── chat.py                # ChatSession, ChatMessage
│   └── ai_analytics.py        # AIUsageLog, AIHealthSnapshot
├── schemas/                   # Pydantic request/response models
│   ├── auth.py, ai.py, chat.py, profile.py, portfolio.py,
│   ├── career.py, recommendation.py, roadmap.py, backup.py, common.py
├── services/
│   ├── auth_service.py        # Auth business logic
│   ├── chat_service.py        # Chat session management
│   ├── profile_service.py     # Profile CRUD
│   ├── portfolio_service.py   # Portfolio CRUD
│   ├── career_service.py      # Career knowledge queries
│   ├── recommendation_service.py  # AI recommendation generation
│   ├── roadmap_service.py     # AI roadmap generation
│   ├── backup_service.py      # AI backup plan generation
│   ├── recommendation_client.py   # External recommendation engine client
│   ├── ai_client.py           # Legacy AI client (kept for compat)
│   └── ai/                    # AI platform services
│       ├── client.py          # Main AIClient with circuit breaker
│       ├── azure_foundry.py   # Azure OpenAI SDK wrapper (gpt-5)
│       ├── circuit_breaker.py # Circuit breaker (closed/open/half-open)
│       ├── security.py        # Prompt injection & jailbreak detection
│       ├── rate_limiter.py    # Rate limiting v2 (burst/sustained/daily)
│       ├── analytics.py       # DB-backed usage tracking & aggregation
│       ├── monitoring.py      # Deep health diagnostics
│       ├── context_builder.py # Builds AI context from user data
│       ├── context_cache.py   # TTL cache for user context
│       ├── prompt_loader.py   # Load prompts from disk (flat + versioned)
│       ├── prompt_versioning.py   # Prompt version management
│       ├── prompt_cache.py    # In-memory prompt cache with TTL
│       ├── conversation_manager.py # Conversation memory management
│       ├── memory.py          # Long-term memory storage
│       ├── fact_extractor.py  # Fact extraction from conversations
│       ├── summarizer.py      # Conversation summarization
│       ├── response_parser.py # AI response parsing
│       ├── json_validator.py  # JSON validation for AI output
│       ├── models.py          # AI data models
│       ├── provider.py        # AI provider abstraction
│       ├── retry.py           # Retry with backoff
│       ├── token_usage.py     # Token usage tracking
│       └── exceptions.py      # AI-specific exceptions
├── prompts/                   # Prompt templates
│   ├── system.md, chat.md, recommendation.md, roadmap.md, backup.md
│   ├── fact_extraction.md, summarization.md, title_generation.md
│   └── {name}/v1.md + metadata.json  # Versioned prompts
├── middleware/
│   └── timing.py              # Request timing middleware
└── utils/
    └── exceptions.py          # Custom HTTP exceptions

alembic/                       # Database migrations (28 FKs, 77 indexes)
tests/                         # 224 tests (148 original + 76 platform engineering)
docs/                          # 21 documentation files
```

## Database

### Tables (27)

**Authentication**: `users`

**Profiles**: `profiles`, `profile_versions`

**Portfolio**: `portfolio_items`

**Career Knowledge**: `careers`, `skills`, `career_skills`, `degrees`, `career_degrees`, `colleges`, `career_colleges`, `entrance_exams`, `career_entrance_exams`, `scholarships`, `career_scholarships`, `resources`, `career_resources`, `career_relations`

**AI Generated**: `recommendations`, `recommendation_items`, `roadmaps`, `roadmap_steps`, `backup_plans`, `backup_scenarios`

**Chat**: `chat_sessions`, `chat_messages`

**Analytics**: `ai_usage_logs`, `ai_health_snapshots`

### Features

- UUID primary keys on all tables
- `created_at` / `updated_at` timestamps with `server_default=now()`
- Soft-delete on `users` and `portfolio_items` (`deleted_at`)
- 19 CASCADE + 9 RESTRICT foreign keys
- Composite unique constraints on junction tables
- Enum types for role, skill level, relation type, statuses, chat message role

## API Endpoints

### Auth (`/v1/auth`)
- `POST /register` — Create account
- `POST /login` — Get access + refresh tokens
- `POST /refresh` — Refresh access token
- `GET /me` — Get current user profile

### Chat (`/v1/chat`)
- `POST /sessions` — Create chat session
- `GET /sessions` — List sessions
- `POST /sessions/{id}/messages` — Send message, get AI response
- `GET /sessions/{id}/messages` — Get message history

### AI (`/v1/ai`)
- `GET /prompts` — List all prompts with metadata
- `POST /prompts/{name}/test` — Test-render a prompt

### Admin (`/v1/admin`)
- `GET /metrics` — System metrics (users, sessions, AI calls)
- `GET /prompts` — Prompt details with version info
- `GET /prompts/{name}` — Single prompt details
- `GET /diagnostics` — Deep system diagnostics
- `GET /cache/stats` — Cache hit rates and memory usage
- `POST /cache/clear` — Clear prompt cache
- `GET /conversations` — Conversation analytics
- `GET /rate-limits` — Rate limit status
- `POST /rebuild-summaries` — Rebuild conversation summaries

### Health
- `GET /health` — Basic health check
- `GET /health/ai` — AI provider health with latency

## Platform Features (Phase 3.2B)

- **Circuit Breaker**: Automatic failure detection with closed/open/half-open states
- **Rate Limiting v2**: Burst (1min), sustained (1hr), daily (24hr) tiers per user + endpoint
- **Security**: Prompt injection detection (15 patterns), jailbreak detection (8 patterns), HTML/markdown sanitization
- **Prompt Versioning**: Directory-based version storage with metadata.json
- **Analytics**: DB-backed usage tracking with aggregation queries
- **Monitoring**: Deep health diagnostics with system info and config validation
- **Context Cache**: TTL-based cache for user context to reduce DB load
- **Structured Logging**: JSON/text logging with request context

## Setup

```bash
cp .env.example .env     # Configure environment variables
pip install -r requirements.txt
alembic upgrade head      # Apply database migrations
uvicorn app.main:app --reload
```

## Running Tests

```bash
pytest                     # Run all 224 tests
pytest tests/test_ai.py    # AI-specific tests
pytest tests/test_platform_engineering.py  # Platform engineering tests
pytest tests/test_admin_api.py  # Admin API tests
```

## Deployment

```bash
func azure functionapp publish tophexity-func --python
```

## Documentation

| Document | Description |
|----------|-------------|
| `AI_ARCHITECTURE.md` | System architecture and data flow |
| `SECURITY_GUIDE.md` | Security features and configuration |
| `OPERATIONS_GUIDE.md` | Deployment, config, troubleshooting |
| `PROMPT_FRAMEWORK.md` | Prompt versioning and management |
| `ADMIN_API_REFERENCE.md` | Admin API endpoint reference |
| `MONITORING_GUIDE.md` | Health checks and diagnostics |
| `API_REFERENCE.md` | Full API reference with auth examples |
| `TESTING_GUIDE.md` | Test suite guide |

## Team

| Developer | Responsibility |
|-----------|---------------|
| 7_39am | Backend, APIs, Auth, Azure, AI Platform |
| HalfPanda | Frontend, UI |
| Razer | Recommendation Engine, Career Data |
