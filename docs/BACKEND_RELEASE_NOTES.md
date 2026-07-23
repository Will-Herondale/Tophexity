# Backend Release Notes

## v0.1.0-rc1 — Backend Polish Release (2026-07-23)

**Status:** Release Candidate — deployed to Azure, all 224 tests passing

### Base URL

- **Production:** `https://tophexity-func.azurewebsites.net`
- **Swagger UI:** `https://tophexity-func.azurewebsites.net/docs`
- **ReDoc:** `https://tophexity-func.azurewebsites.net/redoc`

---

## What's Included

### Authentication (7 endpoints)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/auth/register` | POST | Create new account |
| `/v1/auth/login` | POST | Get JWT tokens |
| `/v1/auth/refresh` | POST | Refresh access token |
| `/v1/auth/logout` | POST | Logout |
| `/v1/auth/me` | GET | Get current user |
| `/v1/auth/forgot-password` | POST | Request password reset |
| `/v1/auth/reset-password` | POST | Reset password with token |

### Users / Profile (7 endpoints)
- CRUD for user profiles with version history
- Profile versioning (every update creates a version snapshot)

### Portfolio (5 endpoints)
- CRUD for portfolio items (skills, projects, experience)
- Per-user portfolio management

### Careers (4 endpoints)
- Career search with filtering, sorting, pagination
- Career detail with related skills/degrees/colleges
- Bulk career import
- Career update/delete

### Recommendations (4 endpoints)
- AI-powered career recommendations
- Recommendation history and detail

### Roadmaps (4 endpoints)
- AI-powered learning roadmaps
- Roadmap history and detail

### Backup Plans (4 endpoints)
- AI-powered backup career plans
- Backup plan history and detail

### Chat (9 endpoints)
- Session CRUD with AI title generation
- Message exchange with AI responses
- Conversation memory (summary + facts)
- Session export (JSON, Markdown, text)
- Chat statistics

### AI (2 endpoints)
- Generate recommendations, roadmaps, backup plans
- AI health check

### Admin (10 endpoints)
- System metrics, user stats, session stats
- Prompt management (list, reload, warm cache)
- AI analytics (usage logs, health snapshots)
- Circuit breaker status, rate limiter status

### Health (2 endpoints)
- Service health check
- AI connectivity health check

---

## Security Fixes Applied

1. **JWT Secret Key** — Default changed from hardcoded `"CHANGE_ME_IN_PRODUCTION"` to `secrets.token_urlsafe(64)` (random at startup). Production `.env` must set a stable secret.
2. **Error Detail Leak** — `function_app.py` no longer leaks exception details in 500 responses.
3. **Redundant Auth Check** — Removed duplicate `is_active` check in `get_current_active_user` (already checked in `get_current_user`).
4. **.gitignore** — Added `*.bak`, `deploy*.zip`, `db_dump.*`, `to_fix/`, `-w`, `.deployment_zip/`, `local.settings.json`.

---

## Code Cleanup Applied

- Deleted 10 obsolete files from root directory (`.bak`, `.zip`, `db_dump.*`, `-w`, `to_fix/`, `local.settings.json`)
- Removed unused `get_user_by_id` function from auth_service.py
- Removed unused `get_user_response` function from auth_service.py
- Fixed empty `responses={}` in careers search endpoint (now returns 422 docs)
- Fixed test assertion for prompt version type (string "1" vs int 1)

---

## Database

- **Engine:** PostgreSQL 16 (Azure Database for PostgreSQL)
- **Connection:** `postgresql+asyncpg://tophexityadmin:***@tophexity-pg.postgres.database.azure.com:5432/career_path?ssl=require`
- **Tables:** 27 core tables + 2 analytics tables = 29 total
- **Indexes:** 77
- **Foreign Keys:** 28 (19 CASCADE, 9 RESTRICT)
- **Migrations:** 4 applied (`21039be197ec` → `7dd0e554f9fc` → `e1a2b3c4d5f6` → `f4a1b2c3d4e5`)

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | >=0.115,<1.0 | Web framework |
| uvicorn | >=0.30,<1.0 | ASGI server |
| pydantic | >=2.0,<3.0 | Data validation |
| pydantic-settings | >=2.0,<3.0 | Settings management |
| sqlalchemy[asyncio] | >=2.0,<3.0 | ORM |
| asyncpg | >=0.30,<1.0 | PostgreSQL async driver |
| alembic | >=1.14,<2.0 | Database migrations |
| python-jose[cryptography] | >=3.3,<4.0 | JWT tokens |
| passlib[bcrypt] | >=1.7,<2.0 | Password hashing |
| bcrypt | >=4.0,<5.0 | Password hashing (pinned <5.0 for passlib) |
| httpx | >=0.27,<1.0 | HTTP client (used by function_app.py bridge) |
| openai | >=1.50,<2.0 | Azure AI SDK |
| python-multipart | >=0.0.9 | Form data parsing |
| azure-functions | >=1.18,<2.0 | Azure Functions SDK |

---

## Test Suite

- **Total:** 224 tests passing
- **Framework:** pytest
- **Coverage:** Auth, Chat, AI, Admin, Profile, Careers, Recommendations, Roadmaps, Backups, Platform Engineering
- **Run command:** `python -m pytest tests/ -q`

---

## Known Limitations

1. **AI Recommendations/Roadmaps/Backups** — AI generation is wired but depends on Azure OpenAI (GPT-5). Rate limits apply.
2. **Recommendation Client** — Stub implementation (`NotImplementedError`). Will be integrated with Razer module.
3. **Email Service** — Password reset tokens are generated but not sent via email (no email service configured yet).
4. **File Upload** — Portfolio items support metadata but file upload to Azure Blob Storage is not yet implemented.

---

## Integration Points

### For HalfPanda (Frontend)
See [FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md) for complete API integration guide with code examples.

### For Razer (Career Intelligence)
See [RAZER_MODULE_SPECIFICATION.md](./RAZER_MODULE_SPECIFICATION.md) for module specification.
See [RAZER_DATA_COLLECTION_SPECIFICATION.md](./RAZER_DATA_COLLECTION_SPECIFICATION.md) for data collection spec (32 datasets).
