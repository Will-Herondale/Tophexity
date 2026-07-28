# Release Notes — v1.0.0-rc2

## Overview

Production-ready release of the Tophexity AI Career Path Creator. All core features implemented, deployed to Azure, and verified.

## New in RC2

### Backend
- CORS configured for production Azure frontend domain
- Removed dead configuration (`RECOMMENDATION_SERVICE_URL`, `jwt_secret_is_default`)
- Removed duplicate `generate_json` method (replaced by `generate`)
- Centralized career fuzzy-matching into `find_career_by_title` utility
- Bulk-delete messages in chat session deletion (performance)
- Removed redundant list/detail endpoints from intelligence router (duplicated CRUD routers)
- Cleaned unused imports across all modules
- 262/262 tests passing

### Frontend
- Removed unused `createRecommendation` and `testAi` API functions
- All pages integrate correctly with backend via `/intelligence/*/generate` endpoints
- Production build verified on Azure App Service (standalone mode)

### Infrastructure
- Azure Function App: `https://tophexity-func.azurewebsites.net`
- Azure App Service: `https://tophexity-frontend.azurewebsites.net`
- Swagger UI at `/docs`
- Health endpoints at `/health` and `/health/ai`

## Features

### Core
- User registration, login, JWT authentication (access + refresh tokens)
- Profile management with version history
- Portfolio tracking (projects, hackathons, certifications, etc.)
- Career knowledge base with 150+ careers

### AI Platform
- GPT-5 integration via Azure OpenAI
- Circuit breaker (closed/open/half-open) with automatic recovery
- Rate limiting (burst/sustained/daily tiers)
- Prompt injection and jailbreak detection
- Input sanitization (HTML, markdown, token limits)
- Secret masking in logs
- Prompt versioning with directory-based storage
- Conversation memory management with summarization
- Fact extraction from conversations
- Token usage tracking and cost estimation

### AI-Powered Features
- Career recommendations with match scores and detailed reasoning
- Personalized learning roadmaps with milestones and resources
- Backup career plans with transition difficulty assessment
- Career comparison with multi-dimensional analysis
- RAG-enhanced context via vector embeddings (pgvector)
- Semantic and hybrid search over knowledge base

### Chat
- Session management (create, list, archive, pin)
- AI career assistant with conversation memory
- Message history with pagination
- Session export (JSON/markdown/text)
- Title auto-generation
- Background summarization and fact extraction

### Admin
- System metrics dashboard (users, sessions, AI calls, tokens, costs)
- Prompt management (list, view, test-render, cache invalidation)
- Rate limit monitoring
- Conversation analytics
- Deep system diagnostics

### Security
- JWT access/refresh token rotation
- Prompt injection detection (15 regex patterns)
- Jailbreak detection (8 regex patterns)
- HTML/markdown sanitization
- Input token limits
- Secret masking in logs
- Environment variable aliasing

## Known Limitations

See `KNOWN_LIMITATIONS.md` for details.
