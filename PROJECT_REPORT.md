# Tophexity — Project Report

## Why This Project Exists

**Tophexity — AI Career Path Creator** is a full-stack platform that helps students and early-career professionals navigate career decisions using AI. It combines a structured career knowledge base (degrees, colleges, exams, scholarships, skills) with Azure OpenAI GPT-5 and a RAG (Retrieval-Augmented Generation) pipeline to deliver:

- **Personalized career recommendations** ranked by match score
- **Step-by-step learning roadmaps** for any career
- **Backup career plans** with transition scenarios
- **An AI career chat assistant** that knows your profile and career context
- **A searchable knowledge base** of careers, skills, degrees, colleges, exams, and scholarships

The knowledge base leans toward the Indian education context (IITs, JEE, GATE, INSPIRE scholarships, etc.).

---

## Team
| Member | Role |
|---|---|
| **7_39am** | Backend, APIs, Auth, Azure, AI Platform |
| **HalfPanda** | Frontend, UI |
| **Razer** | Recommendation Engine, Career Data |

---

## Tech Stack

### Backend
- **Framework:** FastAPI (async, uvicorn)
- **Language:** Python 3.11 (Azure) / 3.14 (local)
- **Database:** PostgreSQL 16 + pgvector (Azure Flexible Server)
- **ORM:** SQLAlchemy 2.0 async + asyncpg
- **Migrations:** Alembic (6 migrations)
- **AI:** Azure OpenAI GPT-5 (`AsyncAzureOpenAI` SDK), text-embedding-3-small (1536 dims, httpx)
- **Auth:** JWT (python-jose), passlib+bcrypt
- **Hosting:** Azure Functions (Linux Consumption, Python 3.11)
- **Other:** httpx, pydantic v2, python-multipart, azure-functions

### Frontend
- **Framework:** Next.js 16.2.11 (App Router, Turbopack)
- **Language:** TypeScript 5
- **UI:** React 19.2.4, Tailwind CSS 4, framer-motion 12, lucide-react
- **HTTP:** axios 1.18.1
- **Hosting:** Azure App Service (Linux, Node 22 LTS, B1 plan)
- **API Proxy:** Next.js rewrites `/v1/*` → `https://tophexity-func.azurewebsites.net/v1/*`

---

## Azure Infrastructure

| Resource | Name | Group | Region |
|---|---|---|---|
| Function App (backend) | `tophexity-func` | tophexity-rg | centralindia |
| PostgreSQL Flexible Server | `tophexity-pg` | tophexity-rg | centralindia |
| Storage Account | `tophexitysa` | tophexity-rg | centralindia |
| App Service Plan (B1) | `tophexity-frontend-plan` | tophexity-rg | centralindia |
| Web App (frontend) | `tophexity-frontend` | tophexity-rg | centralindia |
| Azure OpenAI | `tophex.cognitiveservices.azure.com` | — | — |
| AI Foundry Project | `tophex.services.ai.azure.com/api/projects/proj-tophex` | — | — |

**Live URLs:**
- Frontend: `https://tophexity-frontend.azurewebsites.net`
- Backend: `https://tophexity-func.azurewebsites.net`
- Swagger docs: `https://tophexity-func.azurewebsites.net/docs`
- Backend health: `https://tophexity-func.azurewebsites.net/health`
- AI health: `https://tophexity-func.azurewebsites.net/health/ai`

---

## Database Schema (29 tables)

### Core Tables
| Table | Purpose |
|---|---|
| `users` | Email, password hash, role (user/admin), soft-delete |
| `profiles` | One-to-one with user: name, headline, bio, skills (JSON), interests (JSON), target_fields (JSON) |
| `profile_versions` | Snapshot history of profile changes |
| `portfolio_items` | User achievements (projects, hackathons, certs, etc.), soft-delete |
| `careers` | Title, description, salary, growth, demand, education reqs, skills; KB extension columns (category, industry, work_env, stress, automation_risk, salary tiers, metadata JSONB) |
| `skills` | Name, category |
| `degrees` | Name, level, field |
| `colleges` | Name, location, website, ranking |
| `entrance_exams` | Name, description, website |
| `scholarships` | Name, amount, eligibility, deadline |
| `resources` | Title, description, url, type |

### Junction Tables (composite unique constraints)
`career_skills` (with SkillLevel + is_required), `career_degrees`, `career_colleges`, `career_entrance_exams`, `career_scholarships`, `career_resources`, `career_relations` (self-referential: related/alternative/prerequisite/supplementary)

### AI Tables
| Table | Purpose |
|---|---|
| `recommendations` | AI-generated career recommendations (user, title, summary, status) |
| `recommendation_items` | Individual career matches (match_score, reasoning, rank) |
| `roadmaps` | AI-generated learning plans (career, duration, status) |
| `roadmap_steps` | Ordered steps (title, description, duration, resources) |
| `backup_plans` | AI-generated backup career plans |
| `backup_scenarios` | Alternative career scenarios (transition difficulty, reasoning) |
| `chat_sessions` | Chat sessions with AI memory (summary, summary_message_count, session_data JSONB for facts/tokens/metadata) |
| `chat_messages` | Messages with AI metadata (token_count, model_used, latency_ms, request_id, message_data JSONB) |
| `ai_usage_logs` | Token usage, cost estimates, latency, security flags |
| `ai_health_snapshots` | AI service health history |

### Embedding Tables (pgvector)
| Table | Purpose |
|---|---|
| `document_embeddings` | source_id, source_type, chunk_text, embedding Vector(1536), metadata JSONB, version, content_hash |
| `embedding_jobs` | Rebuild job tracking (status, progress, errors) |

**Stats:** 13,354 total embeddings (career 4163, skill 4782, degree 1822, college 1001, scholarship 1135, exam 451)

---

## API Endpoints (70+)

### Auth (`/v1/auth`)
- `POST /register` — Create account (email + password 8-128 chars)
- `POST /login` — Get JWT access + refresh tokens
- `POST /refresh` — Exchange refresh token for new pair
- `POST /logout` — Client discards tokens
- `GET /me` — Current user info
- `POST /forgot-password` — Request reset token
- `POST /reset-password` — Reset with token (15 min expiry)

### Profile (`/v1/users`)
- `POST /profile` — Create profile
- `GET /profile` — Get profile
- `PUT /profile` — Update (auto-creates version snapshot)
- `DELETE /profile` — Delete profile + versions
- `GET /profile/versions` — Version history

### Portfolio (`/v1/portfolio`)
- CRUD for portfolio items (project, hackathon, competition, certificate, research, internship, etc.)

### Careers (`/v1/careers`)
- `POST /import` — Bulk import (dedup by title) [auth required]
- `GET /` — Search/filter careers [public]
- `GET /{id}` — Career detail [public]
- `PUT /{id}` — Update [auth required]
- `DELETE /{id}` — Delete [auth required]

### Knowledge Base (`/v1/knowledge-base`) [public]
- `GET /stats` — KB statistics
- `GET /careers` — Filter by category, industry, skill, degree, demand, salary, work_env
- `GET /careers/{id}` — Career detail
- `GET /skills`, `/degrees`, `/colleges`, `/entrance-exams`, `/scholarships` — Paginated, filterable

### Chat (`/v1/chat`)
- `POST /sessions` — Create chat session
- `GET /sessions` — List (search, archive filter, pagination)
- `GET /sessions/{id}` — Session with messages
- `POST /sessions/{id}/messages` — **Send message, get AI response** (main chat pipeline)
- `PATCH /sessions/{id}/messages/{message_id}` — Edit message
- `DELETE /sessions/{id}/messages/{message_id}` — Delete message
- `PATCH /sessions/{id}` — Update title/pin/archive
- `DELETE /sessions/{id}` — Delete session
- `POST /sessions/{id}/rebuild-memory` — Regenerate summary + facts
- `GET /sessions/{id}/export` — Export (json/markdown/text)
- `GET /stats` — Chat statistics

### AI (`/v1/ai`)
- `POST /test` — Test AI integration [auth required]
- `GET /health` — AI connectivity diagnostics
- `GET /prompts` — List all prompt templates
- `POST /prompts/{name}/test` — Render prompt with variables

### Intelligence (`/v1/intelligence`) — Phase 4.2 RAG
- `POST /recommendations/generate` — AI career recommendations
- `POST /recommendations/{id}/regenerate`
- `POST /compare` — AI career comparison
- `POST /roadmaps/generate` — AI learning roadmap (needs career_id)
- `POST /backups/generate` — AI backup career plan (needs career_id)
- `POST /search/semantic` — Vector cosine search
- `POST /search/hybrid` — Semantic + keyword (0.7/0.3 weighting)
- `POST /search/debug` — Retrieval diagnostics
- `GET /embeddings/status` — Embedding counts
- `POST /embeddings/rebuild` — Trigger background rebuild
- `GET /embeddings/jobs/{job_id}` — Rebuild job status

### Admin (`/v1/admin`) [requires ADMIN role]
- `GET /metrics` — System metrics (users, tokens, costs, latency percentiles, security, cache stats)
- `GET /prompts` / `GET /prompts/{name}` — Prompt inspection
- `POST /prompts/{name}/invalidate` — Clear prompt cache
- `POST /cache/clear` — Clear all caches
- `GET /diagnostics` — Deep health check
- `GET /conversations` — Browse all conversations
- `POST /rebuild-summaries` — Rebuild all summaries
- `GET /rate-limits` — Rate limit status

---

## AI Pipeline (How Chat Works)

1. **User sends message** → `POST /v1/chat/sessions/{id}/messages`
2. **Store message** in `chat_messages` table
3. **Load context** (`ContextBuilder.load_all`) — sequentially loads:
   - User profile (name, skills, interests, target fields)
   - Portfolio items (projects, certifications)
   - Latest recommendation, roadmap, backup plan
   - **RAG context** — semantic search over 13,354 embeddings (top 10, score ≥ 0.25), compressed to ~2000 tokens
4. **Build system prompt** = `chat.md` template + "## User Context" section
5. **Load memory** — recent messages + conversation summary (if >30 messages, auto-summarize; extract facts every 5 messages)
6. **Rate limiting** — burst (25/min/user), sustained (500/hour), daily (5000/day), conversation (30/min), IP (60/min)
7. **Circuit breaker** — opens after 10 failures, blocks for 90s, half-open test
8. **Retry with backoff** — exponential backoff (1s → 30s max) with 25% jitter, up to 3 retries on 429/500/502/503/504
9. **Azure OpenAI call** — GPT-5 via `AsyncAzureOpenAI`, 300s timeout, max 16384 completion tokens
10. **Store AI response** with metadata (tokens, model, latency, request_id)
11. **Background tasks** — auto-generate title, summarize if needed, extract user facts

### RAG Pipeline
- **Chunking** — careers/skills/degrees/colleges/scholarships/exams are split into text chunks
- **Embedding** — `text-embedding-3-small` (1536 dims) via httpx to Azure, batches of 8, 2.5s delay, 429 retry
- **Storage** — pgvector `document_embeddings` table with versioning
- **Retrieval** — cosine similarity search (semantic) or semantic+keyword hybrid (0.7/0.3)
- **Injection** — relevant knowledge compressed to token budget and appended to system prompt

---

## Frontend Pages (16 routes)

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Login form |
| `/register` | Registration form |
| `/dashboard` | Overview dashboard |
| `/profile` | Profile view/edit + version history |
| `/portfolio` | Portfolio items CRUD |
| `/chat` | AI career chat (with ?recommend=true deep link) |
| `/careers` | Career search + filters + admin import |
| `/careers/admin` | Career data management |
| `/recommendations` | AI recommendations list |
| `/recommendations/[id]` | Recommendation detail |
| `/roadmaps` | AI roadmaps list |
| `/roadmaps/[id]` | Roadmap timeline |
| `/backups` | AI backup plans |
| `/backups/[id]` | Backup plan detail |
| `/settings` | Settings + nav customization |

### Frontend Architecture
- **API client** (`src/lib/api.ts`): axios with 5-min timeout, JWT auto-refresh on 401 (mutex-protected), localStorage token management
- **Proxy**: Next.js rewrites `/v1/*` → backend (avoids CORS), `proxyTimeout: 300000` (5 min)
- **State**: React hooks + context; no external state library
- **Components**: 30+ reusable components organized by feature (auth, profile, portfolio, careers, chat, roadmaps, backups, settings, UI primitives)

---

## Testing

**17 test files, 266 tests passing:**
- `test_auth.py` — register, login, refresh, logout, me
- `test_profile.py` — profile CRUD + versions
- `test_portfolio.py` — portfolio CRUD + filtering
- `test_career.py` — career import, search, detail, update, delete
- `test_recommendation.py` — recommendation CRUD
- `test_roadmap.py` — roadmap CRUD
- `test_backup.py` — backup plan CRUD
- `test_chat.py` — chat session CRUD + messaging
- `test_ai.py` — AI client, retry, rate limiting, circuit breaker, prompts, response parser, memory, token usage
- `test_conversation_platform.py` — conversation lifecycle, memory, summarization, facts
- `test_intelligence.py` — semantic search, hybrid search, embeddings rebuild, AI generation
- `test_platform_engineering.py` — config validation, security, caching, health checks
- `test_admin_api.py` — admin endpoints
- `test_memory.py` — conversation memory
- `test_health.py` — health endpoints

---

## Recent Fixes Applied (RC1)

### Chat 503 Bug (FIXED)
**Root cause:** `ContextBuilder.load_all()` used `asyncio.gather` to run DB queries concurrently on a single asyncpg connection → `InterfaceError`. Also, `session.messages` was lazy-loaded in a sync context after DB queries expired the relationship cache → `greenlet_spawn` error.

**Fix:**
1. `context_builder.py` — `load_all()` runs loaders sequentially (asyncpg can't do concurrent queries on one connection)
2. `conversation_manager.py` — `get_session()` and `rebuild_memory()` use `db.run_sync()` to set `session.messages` safely
3. `chat.py` — replaced `len(session_obj.messages)` with a DB `COUNT()` query
4. `conversation_manager.py` — `build_ai_messages()` snapshots messages before `load_all()` runs

### AI Configuration (FIXED)
- `config.py` — env alias mapping (`OPENAI_*` → `AI_*`) for Azure portal compatibility
- `azure_foundry.py` — normalizes endpoint URL (strips `/openai/v1` suffix)
- `client.py` — circuit breaker only records failures on retryable status codes (429/500/502/503/504)
- `config.py` — request timeout increased to 300s

### Security (FIXED)
- `scripts/rebuild_embeddings.py` — removed hardcoded database credentials

### Frontend Timeout (FIXED)
- `next.config.ts` — `experimental.proxyTimeout: 300000` (was defaulting to 30s)
- `src/lib/api.ts` — global axios timeout set to 300000ms

---

## Known Limitations & Gaps

1. **Security middleware not wired into chat** — `security.py` defines injection/jailbreak detection but `chat.py` doesn't call it; `ai_usage_logs` security columns are never populated through the chat flow
2. **Token analytics disconnected** — `AIClient.chat()` uses in-memory `track_usage()` while admin `/metrics` queries the DB via `analytics_service`; they're not connected
3. **Redis cache not implemented** — architecture docs describe Redis-backed caching but only in-memory caches exist
4. **Frontend PATCH endpoints missing** — `updateRoadmap` and `updateBackupPlan` are called by the frontend but don't exist on the backend (would 404)
5. **Recommendation career matching is lossy** — AI-returned career titles are matched by `ilike` then first-word fallback; unmatched items are silently skipped
6. **Config/env drift** — `.env.example`, `config.py`, and docs disagree on defaults (token limits, rate limits, timeouts)
7. **Cold start delays** — 10-30s on Azure Functions Consumption plan; B1 App Service plan is slow for frontend deploys
8. **Scratch scripts in repo root** — `batch1.py`…`batch10.py`, `writer.py`, `w.py`, `generate_careers.py`, etc. are one-off data scripts left in the repo root
9. **Docs drift** — OPERATIONS_GUIDE uses `/api/admin/*` paths and `OPENAI_*` env names that don't match actual `/v1/admin/*` API and `AI_*` config
10. **Two Azure OpenAI endpoints** — chat uses `tophex.cognitiveservices.azure.com` (SDK), embeddings use `tophex.openai.azure.com` (httpx) due to SDK URL issues