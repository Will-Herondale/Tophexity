# Tophexity — Engineering Report

## Overview

Tophexity is an AI-powered career path guidance platform. Users explore careers, receive personalized AI recommendations, generate learning roadmaps, create backup plans, chat with an AI career assistant, and build portfolios. Built for the hack4hyd hackathon.

**Live URLs:**
- Backend API: https://tophexity-func.azurewebsites.net
- Swagger Docs: https://tophexity-func.azurewebsites.net/docs
- Frontend: https://tophexity-frontend.azurewebsites.net

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js 16)              │
│            Azure Web App (B1, Central India)         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│           Azure Functions (Python 3.11, v4)          │
│     FastAPI wrapped in ASGI transport layer          │
│        Consumption Plan, Central India               │
├──────────────────────────────────────────────────────┤
│  Auth     │  AI Pipeline  │  CRUD  │  Admin          │
│  JWT+OAuth│  GPT-5 / 4o  │  APIs  │  Monitoring      │
├───────────┴──────────────┴────────┴──────────────────┤
│          PostgreSQL Flexible Server                   │
│    (pgvector for embeddings, asyncpg driver)          │
└──────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Serverless (Azure Functions + Consumption)** | Zero cost when idle; pay-per-execution ideal for a hackathon |
| **FastAPI inside Functions** | Leverage FastAPI's auto-docs, validation, and middleware ecosystem while running on Azure Functions' managed infrastructure |
| **ASGI bridge via httpx** | FastAPI's ASGI app is mounted inside the Azure Function trigger using the standard ASGI transport pattern |
| **PostgreSQL + pgvector** | Single database for relational data + vector embeddings (avoid separate vector DB) |
| **Azure OpenAI (GPT-5)** | Latest model for high-quality career recommendations, roadmaps, and chat |
| **JWT with refresh tokens** | Stateless auth; access token (30min) + refresh token (7d) |
| **Circuit breaker pattern** | Prevents cascading failures when AI service degrades |
| **Rate limiting (per-user, per-IP, per-conversation)** | Multi-layered to prevent abuse |
| **Prompt injection / jailbreak detection** | Security layer for user-facing AI chat |

---

## AI Pipeline

```
User Message
     │
     ▼
┌─────────────────────┐
│  Content Moderation  │  ← Prompt injection + jailbreak detection
│  (input validation)  │
└─────────┬───────────┘
          │ pass
          ▼
┌─────────────────────┐
│  Rate Limiting       │  ← Per-user, per-IP, per-conversation, per-minute
└─────────┬───────────┘
          │ pass
          ▼
┌─────────────────────┐
│  Context Assembly    │  ← System prompt + conversation history
│  Budget Allocation   │     + facts + summary (budget: 15% system,
└─────────┬───────────┘     10% summary, 5% facts, 50% messages, 20% response)
          │
          ▼
┌─────────────────────┐
│  Prompt Cache        │  ← LRU cache with TTL (5 min default)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Azure OpenAI (GPT)  │  ← Retry (3x, exponential backoff), timeout (300s)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Response            │  ← Structured JSON for recommendations,
│  Formatting          │     roadmaps, backup plans
└─────────────────────┘
```

### AI Services

| Service | Purpose | Model |
|---------|---------|-------|
| **Chat Engine** | Conversational AI career assistant with context management | GPT-5 |
| **Recommendation Engine** | Generates personalized career recommendations from user profile | GPT-5 |
| **Roadmap Engine** | Creates step-by-step learning roadmaps for target careers | GPT-5 |
| **Backup Engine** | Generates alternative career paths based on transferable skills | GPT-5 |
| **Fact Extraction** | Extracts structured facts from chat history at intervals | GPT-5 |
| **Title Generation** | Auto-generates conversation titles from first user message | GPT-5 |
| **Embeddings** | Knowledge base search via pgvector similarity | text-embedding-ada-002 |
| **Summary Engine** | Summarizes long conversations to stay within context budget | GPT-5 |

### Prompt System

- 5 prompt templates in `app/prompts/` (chat, recommendation, roadmap, backup, system)
- Template loader with variable interpolation (handles up to 6k-token role, 8k-token user)
- LRU prompt cache with configurable TTL
- Debug mode logs full prompt/response pairs

---

## API Surface

**Prefix:** `/v1`

| Module | Prefix | Key Endpoints |
|--------|--------|---------------|
| Auth | `/auth` | register, login, refresh, logout |
| Users | `/users` | CRUD, profile, avatar |
| Careers | `/careers` | list, search, detail, admin import |
| Recommendations | `/recommendations` | generate, history |
| Roadmaps | `/roadmaps` | generate, list, detail |
| Backup Plans | `/backups` | generate, list, detail |
| Portfolio | `/portfolio` | CRUD items with versioning |
| Chat | `/chat` | sessions, messages, summarization |
| AI | `/ai` | test endpoint |
| Knowledge Base | `/knowledge-base` | documents, search, embeddings |
| Intelligence | `/intelligence` | aggregated AI dashboard data |
| Admin | `/admin` | status, metrics, circuit breaker, rate limits |
| Health | `/health`, `/health/ai` | basic and AI-specific health checks |

---

## Database Schema (PostgreSQL + pgvector)

**15 tables** across 6 alembic migrations:

| Table | Purpose |
|-------|---------|
| `users` | Core user data, preferences |
| `profiles` | Extended profile, education, skills |
| `profile_versions` | Change tracking with JSON snapshots |
| `careers` | Career catalog (250+ entries) with knowledge_base columns |
| `recommendations` | AI-generated career recommendations |
| `roadmaps` | Learning roadmaps |
| `backup_plans` | Alternative career paths |
| `portfolio_items` | User portfolio entries with versioning |
| `chat_sessions` | Conversation metadata |
| `chat_messages` | Individual messages (bulk-deleted on session delete) |
| `conversation_facts` | Extracted structured facts |
| `conversation_summaries` | Compressed conversation summaries |
| `token_usage` | AI token consumption tracking |
| `document_embeddings` | pgvector embeddings for RAG |
| `career_embeddings` | pgvector embeddings for career matching |

---

## Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | JWT access + refresh tokens (python-jose, HS256) |
| **Password hashing** | bcrypt via passlib |
| **CORS** | Whitelist: localhost:3000 + production frontend URL |
| **Rate limiting** | Per-user/min/hr/day, per-IP, per-conversation (in-memory sliding window) |
| **Prompt injection** | Regex-based detection at message entry |
| **Jailbreak detection** | Pattern matching on user prompts |
| **Admin API** | Protected by admin API key |
| **Secrets** | Azure app settings (not in repo); local fallback via `.env` / `api_key.txt` |
| **HTTPS** | Enforced; FTPs only for deployment |

---

## Testing

**262 tests**, all passing (11.88s runtime):

| Module | Tests | Focus |
|--------|-------|-------|
| Auth | 45 | Registration, login, refresh, token validation, edge cases |
| Profiles | 31 | CRUD, validation, versioning |
| Careers | 28 | CRUD, search, admin import |
| Chat | 42 | Sessions, messages, AI chat, context management, summaries |
| Recommendations | 22 | Generation, history, error cases |
| Roadmaps | 18 | Generation, listing, detail |
| Backup Plans | 16 | Generation, listing, edge cases |
| Portfolio | 20 | CRUD, versioning |
| AI | 12 | Client health, retry, circuit breaker |
| Health | 6 | Endpoint responses |
| Intelligence | 4 | Aggregated data |
| Memory | 4 | Conversation facts |
| Admin | 8 | Status, metrics, management |
| Platform Engineering | 6 | Config loading, CORS, startup |

---

## DevOps

| Aspect | Detail |
|--------|--------|
| **Hosting** | Azure Functions (Consumption Plan) + Azure Web App (B1) |
| **Database** | PostgreSQL Flexible Server (pgvector extension) |
| **AI Provider** | Azure OpenAI (GPT-5, text-embedding-ada-002) |
| **CI/CD** | Manual `func azurefunctionapp publish` |
| **Branching** | `7_39am` (backend), `halfpanda` (frontend) |
| **Deployment slots** | Staging → production swap supported |
| **Logging** | Application Insights + structured JSON logs |
| **Health checks** | `/health` (basic), `/health/ai` (AI connectivity + latency) |
| **Monitoring** | Azure Monitor + `func log tail` |

### Deployment Commands

```bash
# Backend
func azure functionapp publish tophexity-func --python

# Frontend (npm build + zip deploy)
npm run build && zip -r deploy.zip .next public package.json && az webapp deploy ...
```

### Environment Variables (Azure App Settings)

`AI_ENDPOINT`, `AI_API_KEY`, `AI_DEPLOYMENT_NAME`, `AI_API_VERSION`, `DATABASE_URL`, `JWT_SECRET_KEY`, `CORS_ORIGINS`, `ENVIRONMENT`, `LOG_LEVEL`, `ADMIN_API_KEY`

---

## Project Stats

| Metric | Value |
|--------|-------|
| Git commits | 20 |
| Contributors | Will-Herondale, MediBot Deployer |
| Python files | ~97 |
| Frontend pages | 12 (backups, careers, chat, dashboard, portfolio, profile, recommendations, roadmaps, settings, login, register, admin) |
| Frontend deps | 7 (Next.js 16, React 19, axios, framer-motion, lucide-react, clsx) |
| Alembic migrations | 6 |
| Database tables | 15 |
| Total LOC (tracked) | ~32,610 |
| Tests | 262 (all passing) |
| Backend runtime | Python 3.11 on Azure Functions v4 |
| Frontend runtime | Node.js, Next.js 16 on Azure Web App (B1) |
| AI model | Azure OpenAI GPT-5 |
| Vector DB | pgvector on PostgreSQL |

---

## Releases

| Tag | Description |
|-----|-------------|
| `v0.2.0` | RC2 — Code quality polish, dead code removal, CORS fix, documentation |
| (prior) | RC1 — Initial production deployment with chat, intelligence, embeddings |

---

## Known Limitations

See `KNOWN_LIMITATIONS.md` for details. Key items:

1. **Cold starts** — Consumption plan leads to 10-30s latency on idle → warmup
2. **Memory rate limiting** — In-memory counters reset on function restart
3. **No CDN** — Static assets served direct from Azure Web App
4. **No disaster recovery** — Manual restore from PostgreSQL backups
5. **Consumption plan deprecation** — Azure recommends Flex Consumption by 2028
