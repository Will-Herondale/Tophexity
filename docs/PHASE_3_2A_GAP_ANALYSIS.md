# Phase 3.2A: Gap Analysis & Implementation Plan

**Date:** 2026-07-22  
**Design Spec:** `docs/PHASE_3_2A_DESIGN.md`  
**Status:** Pre-implementation analysis

---

## Table of Contents

1. [Gap Analysis by Component](#1-gap-analysis-by-component)
2. [Implementation Milestones](#2-implementation-milestones)
3. [Risk Register & Design Recommendations](#3-risk-register--design-recommendations)
4. [Implementation Checklist](#4-implementation-checklist)

---

## 1. Gap Analysis by Component

### 1.1 Database Schema

| Column | Table | Design Spec | Current Codebase | Status |
|--------|-------|-------------|------------------|--------|
| `id` | chat_sessions | UUID PK | EXISTS | — |
| `user_id` | chat_sessions | UUID FK, CASCADE | EXISTS | — |
| `title` | chat_sessions | VARCHAR(500), nullable | EXISTS | — |
| `created_at` | chat_sessions | TIMESTAMPTZ | EXISTS | — |
| `updated_at` | chat_sessions | TIMESTAMPTZ | EXISTS | — |
| `is_archived` | chat_sessions | BOOLEAN, default false | MISSING | Must add |
| `archived_at` | chat_sessions | TIMESTAMPTZ, nullable | MISSING | Must add |
| `is_pinned` | chat_sessions | BOOLEAN, default false | MISSING | Must add |
| `pinned_at` | chat_sessions | TIMESTAMPTZ, nullable | MISSING | Must add |
| `summary` | chat_sessions | TEXT, nullable | MISSING | Must add |
| `summary_updated_at` | chat_sessions | TIMESTAMPTZ, nullable | MISSING | Must add |
| `summary_message_count` | chat_sessions | INTEGER, default 0 | MISSING | Must add |
| `session_data` | chat_sessions | JSONB, default '{}' | MISSING | Must add |
| `id` | chat_messages | UUID PK | EXISTS | — |
| `session_id` | chat_messages | UUID FK, CASCADE | EXISTS | — |
| `role` | chat_messages | ENUM | EXISTS | — |
| `content` | chat_messages | TEXT | EXISTS | — |
| `created_at` | chat_messages | TIMESTAMPTZ | EXISTS | — |
| `updated_at` | chat_messages | TIMESTAMPTZ | EXISTS | — |
| `token_count` | chat_messages | INTEGER, nullable | MISSING | Must add |
| `model_used` | chat_messages | VARCHAR(100), nullable | MISSING | Must add |
| `latency_ms` | chat_messages | FLOAT, nullable | MISSING | Must add |
| `request_id` | chat_messages | VARCHAR(100), nullable | MISSING | Must add |
| `message_data` | chat_messages | JSONB, default '{}' | MISSING | Must add |

**Schema Summary:** 13 existing columns, **13 new columns** (8 on session, 5 on message), **4 new indexes**.

---

### 1.2 Database Models (ORM)

| Model | Current Fields | Design Fields | Gap |
|-------|---------------|---------------|-----|
| `ChatSession` | id, user_id, title, created_at, updated_at, user (rel), messages (rel) | + is_archived, archived_at, is_pinned, pinned_at, summary, summary_updated_at, summary_message_count, session_data | 8 fields missing |
| `ChatMessage` | id, session_id, role, content, created_at, updated_at, session (rel) | + token_count, model_used, latency_ms, request_id, message_data | 5 fields missing |

---

### 1.3 API Endpoints

| Endpoint | Method | Design Spec | Current Codebase | Status |
|----------|--------|-------------|------------------|--------|
| `/v1/chat/health` | GET | Health check | EXISTS (basic) | No changes needed |
| `/v1/chat/sessions` | POST | Create session | EXISTS (basic) | No schema changes needed |
| `/v1/chat/sessions` | GET | List with search, archive filter, sort | EXISTS (basic list only) | **PARTIAL** — needs search, archive filter, sort params |
| `/v1/chat/sessions/{id}` | GET | Get session with metadata | EXISTS (basic) | **PARTIAL** — response needs new fields |
| `/v1/chat/sessions/{id}` | PATCH | Update title, pin, archive | MISSING | **NEW** endpoint |
| `/v1/chat/sessions/{id}` | DELETE | Delete session | EXISTS | No changes needed |
| `/v1/chat/sessions/{id}/messages` | POST | Send with auto-title, summarize, facts, metadata | EXISTS (basic) | **PARTIAL** — needs major enhancement |
| `/v1/chat/sessions/{id}/messages/{mid}/regenerate` | POST | Regenerate assistant response | MISSING | **NEW** endpoint |
| `/v1/chat/sessions/{id}/export` | POST | Export in JSON/MD/text | MISSING | **NEW** endpoint |
| `/v1/chat/sessions/{id}/rebuild-memory` | POST | Rebuild summary + facts | MISSING | **NEW** endpoint |
| `/v1/chat/stats` | GET | User conversation statistics | MISSING | **NEW** endpoint |

**API Summary:** 5 existing endpoints (3 need enhancement), **5 new endpoints**.

---

### 1.4 Schemas (Pydantic)

| Schema | Current | Design | Gap |
|--------|---------|--------|-----|
| `ChatSessionCreate` | title (optional) | title (optional) | No change |
| `ChatMessageCreate` | role (regex), content (min 1) | role (regex), content (min 1) | No change |
| `ChatSessionResponse` | id, user_id, title, created_at | + is_archived, is_pinned, session_data (message_count) | 2-3 fields missing |
| `ChatMessageResponse` | id, session_id, role, content, created_at | + token_count, model_used, latency_ms, request_id, message_data | 5 fields missing |
| `ChatSessionDetailResponse` | id, user_id, title, created_at, messages | + summary, session_data | 2 fields missing |
| `ChatSessionListResponse` | items, total, page, page_size, total_pages | Same structure, items get new fields | Items need new fields |
| `ChatSessionUpdate` (NEW) | — | title, is_archived, is_pinned (all optional) | **Entire schema missing** |
| `ChatRegenerateResponse` (NEW) | — | original_message_id, new_message | **Entire schema missing** |
| `ChatStatsResponse` (NEW) | — | 14 fields | **Entire schema missing** |
| `ChatExportFormat` (NEW) | — | Enum: json, markdown, text | **Entire schema missing** |

---

### 1.5 Services

| Service | Current State | Design Requires | Gap |
|---------|--------------|-----------------|-----|
| `chat_service.py` | Basic CRUD (create, add_messages, get_session_messages, list, delete) | Enhanced CRUD + search + metadata update + export + stats + regenerate | **Major rewrite** — needs ~6 new functions |
| `ConversationManager` | get_session, load_memory, build_ai_messages, store_exchange | + title generation, + incremental summarization, + fact extraction, + persistent summary | **Major rewrite** — 3 new methods, rewrite load_memory |
| `ContextBuilder` | load_all, build_context_string, build_system_prompt | + build_context(session), + token budgeting, + trimming, + fact injection, + priority assembly | **Major rewrite** — new core method |
| `ConversationMemory` | add_message, trim, needs_summarization, build_messages_for_ai, clear, get_message_count | Same interface, but used differently (loaded from DB) | **Minor changes** — interface stays, usage changes |
| `summarizer.py` | summarize_messages (basic) | + incremental summarization, + summary validation, + delta merge | **Enhance** — add delta/merge logic |
| `prompt_loader.py` | load_prompt, list_prompts, prompt_exists | + render (variables), + frontmatter parsing | **Enhance** — add 2 new methods |
| `prompt_cache.py` | get, invalidate, clear, get_version | + rendered cache, + get_metadata | **Enhance** — add 2 new methods |
| `fact_extractor.py` | DOES NOT EXIST | extract_facts, dedup, categorize | **Entirely new file** |

---

### 1.6 Prompts

| Prompt File | Status | Notes |
|-------------|--------|-------|
| `system.md` | EXISTS | No changes needed |
| `chat.md` | EXISTS | May need minor enhancement |
| `recommendation.md` | EXISTS | No changes (future use) |
| `roadmap.md` | EXISTS | No changes (future use) |
| `backup.md` | EXISTS | No changes (future use) |
| `title_generation.md` | MISSING | **Must create** |
| `summarization.md` | MISSING | **Must create** (currently hardcoded in summarizer.py) |
| `fact_extraction.md` | MISSING | **Must create** |
| `context_compression.md` | MISSING | **Must create** (or defer — trimming is code-based) |
| `metadata.yaml` | MISSING | **Must create** (prompt registry) |

---

### 1.7 Configuration (Settings)

| Setting | Design Spec | Current | Gap |
|---------|-------------|---------|-----|
| `AI_CONVERSATION_RETENTION_DAYS` | 90 | MISSING | Add |
| `AI_CONVERSATION_ARCHIVE_AFTER_DAYS` | 30 | MISSING | Add |
| `AI_MAX_CONVERSATIONS_PER_USER` | 100 | MISSING | Add |
| `AI_TITLE_GENERATION_ENABLED` | True | MISSING | Add |
| `AI_TITLE_GENERATION_TIMEOUT` | 3.0 | MISSING | Add |
| `AI_TITLE_MAX_LENGTH` | 80 | MISSING | Add |
| `AI_MAX_SUMMARY_LENGTH` | 2000 | MISSING | Add |
| `AI_FACT_EXTRACTION_INTERVAL` | 5 | MISSING | Add |
| `AI_CONTEXT_BUDGET_SYSTEM_PCT` | 0.15 | MISSING | Add |
| `AI_CONTEXT_BUDGET_SUMMARY_PCT` | 0.10 | MISSING | Add |
| `AI_CONTEXT_BUDGET_FACTS_PCT` | 0.05 | MISSING | Add |
| `AI_CONTEXT_BUDGET_MESSAGES_PCT` | 0.50 | MISSING | Add |
| `AI_CONTEXT_BUDGET_RESPONSE_PCT` | 0.20 | MISSING | Add |
| `AI_MIN_RECENT_MESSAGES` | 4 | MISSING | Add |
| `AI_PROMPT_CACHE_TTL` | 300.0 | MISSING (hardcoded) | Add (extract from PromptCache) |
| `AI_PROMPT_DEBUG_ENABLED` | True | MISSING | Add |

**Config Summary:** 16 new settings.

---

### 1.8 Tests

| Test File | Current | Design Requires | Gap |
|-----------|---------|-----------------|-----|
| `tests/test_chat.py` | 7 tests (session CRUD + messages) | Enhanced tests for all new endpoints + behaviors | **Must rewrite/expand** |
| `tests/test_ai.py` | 56 tests | No changes (AI infra tests remain) | No gap |
| `tests/test_conversation_platform.py` | DOES NOT EXIST | Integration tests for full flow | **New file** |
| `tests/test_context_builder.py` | DOES NOT EXIST | Unit tests for context assembly | **New file** |
| `tests/test_memory.py` | DOES NOT EXIST | Unit tests for memory system | **New file** |
| Other existing test files | 53 tests total | No changes needed | No gap |

---

### 1.9 Documentation

| Document | Current | Design Requires | Gap |
|----------|---------|-----------------|-----|
| `docs/API_REFERENCE.md` | EXISTS (complete for current API) | Update with new/modified endpoints | **Must update** |
| `docs/CONVERSATION_PLATFORM.md` | DOES NOT EXIST | Architecture overview | **New file** |
| `docs/CHAT_API_GUIDE.md` | DOES NOT EXIST | Frontend integration guide | **New file** |
| `docs/PROMPT_AUTHORING_GUIDE.md` | DOES NOT EXIST | Prompt template guide | **New file** |
| `docs/DATABASE_SCHEMA.md` | DOES NOT EXIST | Schema reference | **New file** |

---

### 1.10 Gap Summary

| Category | Exists | Partial | Missing | Total Required |
|----------|--------|---------|---------|---------------|
| DB columns | 13 | 0 | 13 | 26 |
| DB indexes | 2 | 0 | 4 | 6 |
| API endpoints | 6 | 3 | 5 | 11 |
| Pydantic schemas | 6 | 3 | 4 | 13 |
| Service files | 5 | 5 | 1 | 11 |
| Prompt files | 5 | 0 | 4 | 9 |
| Config settings | 0 | 0 | 16 | 16 |
| Test files | 1 (needs expansion) | 0 | 3 | 4 |
| Doc files | 1 (needs update) | 0 | 4 | 5 |

---

## 2. Implementation Milestones

### Milestone 1: Database Schema Enhancement

**Objectives:** Add 13 new columns and 4 indexes to chat tables via a single Alembic migration. Update ORM models to reflect new columns.

**Files to modify:**
- `app/models/chat.py` — add 8 fields to ChatSession, 5 fields to ChatMessage
- `alembic/versions/<hash>_enhance_chat.py` — **create** migration

**Database migrations:**
- Single migration: `enhance_chat_tables`
- Add columns to `chat_sessions`: is_archived, archived_at, is_pinned, pinned_at, summary, summary_updated_at, summary_message_count, session_data
- Add columns to `chat_messages`: token_count, model_used, latency_ms, request_id, message_data
- Add indexes: idx_chat_sessions_user_archived, idx_chat_sessions_user_pinned, idx_chat_messages_session_created, idx_chat_messages_request_id
- All new columns have defaults or are nullable — zero data loss, zero downtime

**APIs affected:** None (additive schema changes only)

**Tests required:**
- Migration runs forward cleanly
- Migration rolls back cleanly
- ChatSession model has all new fields accessible
- ChatMessage model has all new fields accessible
- All 116 existing tests pass

**Documentation updates:** None yet

**Deployment impact:** Low — additive columns only, no breaking changes, no data migration needed

**Acceptance criteria:**
- [ ] `alembic upgrade head` runs without error
- [ ] `alembic downgrade -1` runs without error
- [ ] `python -c "from app.models.chat import ChatSession; ..."` shows all 13 columns
- [ ] `alembic current` shows correct revision
- [ ] All 116 existing tests pass

---

### Milestone 2: Configuration & Prompt System Enhancement

**Objectives:** Add 16 new config settings. Enhance prompt loader with variable rendering and frontmatter parsing. Create 3 new prompt files. Add prompt debugging endpoints.

**Files to modify:**
- `app/core/config.py` — add 16 new settings
- `app/services/ai/prompt_loader.py` — add `render()`, `get_metadata()`, frontmatter parsing
- `app/services/ai/prompt_cache.py` — add `get_metadata()`, rendered prompt cache
- `app/prompts/summarization.md` — **create** (extract hardcoded prompt from summarizer.py)
- `app/prompts/title_generation.md` — **create**
- `app/prompts/fact_extraction.md` — **create**
- `app/api/v1/ai.py` — add prompt listing and testing endpoints
- `app/schemas/ai.py` — **create** (prompt metadata/response schemas)

**Database migrations:** None

**APIs affected:**
- `GET /v1/ai/prompts` — **new** (list all prompts with metadata)
- `POST /v1/ai/prompts/{name}/test` — **new** (render prompt with variables)

**Tests required:**
- Unit: `render("chat", {"user_name": "Jane"})` produces correct output
- Unit: Unknown variables don't crash
- Unit: Missing prompt file raises FileNotFoundError
- Unit: Frontmatter parsed correctly
- Unit: Cache TTL and invalidation work
- Integration: Prompt metadata endpoint returns all prompts
- Integration: Prompt test endpoint renders and returns output
- All 116 existing tests pass

**Documentation updates:** None yet

**Deployment impact:** Low — additive config, additive endpoints, no breaking changes

**Acceptance criteria:**
- [ ] `get_settings()` has all 16 new attributes with correct defaults
- [ ] `prompt_loader.render("chat", {"user_name": "Test"})` returns rendered string
- [ ] `prompt_loader.get_metadata("system")` returns dict with name, version, description, char_count
- [ ] 3 new prompt files exist and load correctly
- [ ] `GET /v1/ai/prompts` returns list of all prompts
- [ ] `POST /v1/ai/prompts/chat/test?user_name=Jane` returns rendered prompt
- [ ] All 116 existing tests pass

---

### Milestone 3: Session Management Enhancement

**Objectives:** Add PATCH endpoint for session updates. Add search, archive filter, and pin-aware sort to session list. Update response schemas with new fields.

**Files to modify:**
- `app/api/v1/chat.py` — add PATCH endpoint, enhance GET list with query params
- `app/schemas/chat.py` — add `ChatSessionUpdate`, `ChatStatsQuery`, update `ChatSessionResponse` and `ChatSessionDetailResponse` with new fields
- `app/services/chat_service.py` — add `update_session()`, enhance `list_chat_sessions()` with search/filter/sort

**Database migrations:** None (schema done in Milestone 1)

**APIs affected:**
- `PATCH /v1/chat/sessions/{id}` — **new** (update title, pin, archive)
- `GET /v1/chat/sessions` — **enhanced** (add search, is_archived, sort query params)

**Tests required:**
- Unit: update_session sets title, is_pinned, is_archived correctly
- Unit: cannot pin an archived session (422)
- Unit: cannot archive a pinned session (422)
- Integration: search returns matching sessions
- Integration: is_archived=false excludes archived sessions
- Integration: is_archived=true returns only archived
- Integration: pinned sessions sort first
- API: PATCH returns 200 with updated session
- API: PATCH returns 401 without auth
- API: PATCH returns 404 for nonexistent session
- All 116 existing tests pass

**Documentation updates:**
- Update `docs/API_REFERENCE.md` with PATCH endpoint and enhanced GET params

**Deployment impact:** Low — additive endpoint and params, no breaking changes

**Acceptance criteria:**
- [ ] `PATCH /v1/chat/sessions/{id}` with `{title: "New Title"}` returns 200
- [ ] `PATCH /v1/chat/sessions/{id}` with `{is_pinned: true}` works
- [ ] `PATCH /v1/chat/sessions/{id}` with `{is_archived: true}` works
- [ ] `PATCH` on pinned session with `{is_archived: true}` returns 422
- [ ] `GET /v1/chat/sessions?search=career` returns matching sessions
- [ ] `GET /v1/chat/sessions?is_archived=true` returns archived only
- [ ] Pinned sessions appear first in list
- [ ] All 116 existing tests pass

---

### Milestone 4: Conversation Memory System

**Objects:** Implement persistent summary storage. Implement incremental summarization. Implement fact extraction. Rewrite ConversationManager. Add rebuild-memory endpoint.

**Files to modify:**
- `app/services/ai/conversation_manager.py` — **major rewrite**: persistent summary loading/saving, incremental summarization trigger, fact extraction trigger, metadata update
- `app/services/ai/memory.py` — minor: add `from_persistent()` class method
- `app/services/ai/summarizer.py` — enhance: add `summarize_delta()`, `merge_summaries()`, `validate_summary()`, use external prompt file
- `app/services/ai/fact_extractor.py` — **create**: `extract_facts()`, `dedup_facts()`, `categorize_facts()`
- `app/api/v1/chat.py` — add POST `/v1/chat/sessions/{id}/rebuild-memory`
- `app/schemas/chat.py` — add `MemoryRebuildResponse`

**Database migrations:** None

**APIs affected:**
- `POST /v1/chat/sessions/{id}/rebuild-memory` — **new**

**Tests required:**
- Unit: summarize_delta produces correct delta summary
- Unit: merge_summaries combines old + delta correctly
- Unit: validate_summary rejects empty, too long, duplicate
- Unit: extract_facts identifies career goals, skills, preferences
- Unit: dedup_facts removes duplicates
- Unit: ConversationManager.load_memory uses stored summary when available
- Unit: ConversationManager.load_memory triggers summarization at threshold
- Unit: ConversationManager triggers fact extraction at interval
- Unit: rebuild-memory clears and regenerates
- Integration: Full flow — 25 messages → summary stored → subsequent messages use stored summary
- Integration: Facts appear in session_data after extraction
- All 116 existing tests pass

**Documentation updates:** None yet

**Deployment impact:** Medium — existing sessions with >20 messages will trigger summarization on first access. This is expected behavior, not a migration issue.

**Acceptance criteria:**
- [ ] After 25 messages, `session.summary` is non-null in DB
- [ ] After 25 messages, `session.summary_message_count` > 0
- [ ] Subsequent messages use stored summary (not recompute from scratch)
- [ ] After 5 messages with factual content, `session_data.facts` is populated
- [ ] `POST /v1/chat/sessions/{id}/rebuild-memory` regenerates summary
- [ ] Rebuild works on session with 0 messages (returns empty summary)
- [ ] All 116 existing tests pass

---

### Milestone 5: Context Builder Rewrite

**Objectives:** Rewrite ContextBuilder with priority-based assembly, token budgeting, trimming, and fact injection. Integrate with ConversationManager.

**Files to modify:**
- `app/services/ai/context_builder.py` — **major rewrite**: new `build_context(session)` method, token estimation, priority assembly, budget trimming
- `app/services/ai/conversation_manager.py` — update `build_ai_messages()` to use new ContextBuilder

**Database migrations:** None

**APIs affected:** None (internal service changes)

**Tests required:**
- Unit: system prompt always included
- Unit: profile always included when exists
- Unit: facts injected when present
- Unit: summary injected when present
- Unit: recent messages included within budget
- Unit: lower-priority items trimmed when budget exceeded
- Unit: minimum 4 recent messages always kept
- Unit: token estimation within 20% of actual
- Unit: empty profile handled gracefully
- Unit: no user data returns system prompt only
- Integration: full context assembly with all data types
- Integration: context respects 4096 token budget
- All 116 existing tests pass

**Documentation updates:** None yet

**Deployment impact:** None — internal service, no API changes

**Acceptance criteria:**
- [ ] `build_context(session)` returns list of message dicts
- [ ] First message is always system role with system prompt
- [ ] Token total stays within AI_MAX_TOKENS minus response reserve
- [ ] With full data, portfolio/recommendation/roadmap/backup are included if budget allows
- [ ] With tight budget, lower-priority items are excluded
- [ ] Minimum 4 recent messages always present
- [ ] All 116 existing tests pass

---

### Milestone 6: Title Generation & Enhanced Message Flow

**Objectives:** Implement auto-title generation on first message. Enhance POST /messages with full flow (title gen, summarization, facts, metadata). Implement message regeneration. Store AI metadata on assistant messages.

**Files to modify:**
- `app/api/v1/chat.py` — enhance POST messages, add POST regenerate
- `app/services/chat_service.py` — add `regenerate_message()`, enhance `add_messages()` with metadata
- `app/services/ai/conversation_manager.py` — add `generate_title()`, update `build_ai_messages()` integration
- `app/schemas/chat.py` — add `ChatRegenerateResponse`, update `ChatMessageResponse` with metadata fields
- `app/prompts/title_generation.md` — create (if not done in Milestone 2)

**Database migrations:** None

**APIs affected:**
- `POST /v1/chat/sessions/{id}/messages` — **enhanced** (auto-title, metadata in response)
- `POST /v1/chat/sessions/{id}/messages/{mid}/regenerate` — **new**

**Tests required:**
- Unit: generate_title produces valid title from message
- Unit: generate_title fallback on AI failure produces truncated message title
- Unit: first message to titleless session triggers title generation
- Unit: subsequent messages don't re-trigger title generation
- Unit: regenerate_message deletes old assistant message
- Unit: regenerate_message stores new assistant message with metadata
- Unit: metadata (token_count, model_used, latency_ms) stored on assistant messages
- Unit: session_data incremented after message exchange
- Integration: create session → send message → title auto-generated
- Integration: send message → assistant message has metadata fields
- Integration: regenerate → old message gone, new message present
- API: POST messages returns 201 with both messages including metadata
- API: POST regenerate returns 200 with new message
- API: POST regenerate on user message returns 422
- All 116 existing tests pass

**Documentation updates:**
- Update `docs/API_REFERENCE.md` with enhanced POST messages response and new regenerate endpoint

**Deployment impact:** Low — existing sessions get title generation on next first-message if they have null title. Metadata fields are nullable, so existing messages unaffected.

**Acceptance criteria:**
- [ ] Create session → send first message → `GET /v1/chat/sessions/{id}` shows non-null title
- [ ] Title ≤ 80 characters
- [ ] Title fallback works when AI is down
- [ ] Assistant messages in DB have token_count, model_used, latency_ms, request_id
- [ ] session_data.message_count increments correctly
- [ ] session_data.total_tokens_used increments correctly
- [ ] POST regenerate replaces assistant message
- [ ] All 116 existing tests pass

---

### Milestone 7: Export & Statistics

**Objectives:** Implement conversation export in 3 formats. Implement statistics endpoint.

**Files to modify:**
- `app/api/v1/chat.py` — add POST export, add GET stats
- `app/services/chat_service.py` — add `export_session()`, `get_stats()`
- `app/schemas/chat.py` — add `ChatExportResponse`, `ChatStatsResponse`

**Database migrations:** None

**APIs affected:**
- `POST /v1/chat/sessions/{id}/export` — **new**
- `GET /v1/chat/stats` — **new**

**Tests required:**
- Unit: export_json returns valid JSON with session + messages
- Unit: export_markdown returns human-readable format
- Unit: export_text returns plain text
- Unit: export handles empty session (no messages)
- Unit: stats aggregation correct for single user
- Unit: stats handles user with 0 sessions
- Integration: create session with messages → export → verify structure
- Integration: stats return correct totals
- API: export returns correct Content-Type per format
- API: stats returns 401 without auth
- All 116 existing tests pass

**Documentation updates:**
- Update `docs/API_REFERENCE.md` with export and stats endpoints

**Deployment impact:** None — purely additive endpoints

**Acceptance criteria:**
- [ ] `POST /v1/chat/sessions/{id}/export?format=json` returns JSON with session + messages
- [ ] `POST .../export?format=markdown` returns text/markdown
- [ ] `POST .../export?format=text` returns text/plain
- [ ] `GET /v1/chat/stats` returns all 14 stat fields
- [ ] Stats aggregate correctly across sessions/messages
- [ ] All 116 existing tests pass

---

### Milestone 8: Tests, Documentation & Final Integration

**Objectives:** Write comprehensive tests. Create all documentation. Final integration testing. Performance verification.

**Files to modify:**
- `tests/test_chat.py` — rewrite/expand with all new endpoint tests
- `tests/test_conversation_platform.py` — **create** integration tests
- `tests/test_context_builder.py` — **create** unit tests
- `tests/test_memory.py` — **create** unit tests
- `docs/API_REFERENCE.md` — update with all new/modified endpoints
- `docs/CONVERSATION_PLATFORM.md` — **create** architecture overview
- `docs/CHAT_API_GUIDE.md` — **create** frontend integration guide
- `docs/PROMPT_AUTHORING_GUIDE.md` — **create** prompt template guide
- `docs/DATABASE_SCHEMA.md` — **create** schema reference

**Database migrations:** None

**APIs affected:** None (testing and docs only)

**Tests required:**
- All unit tests from Milestones 1-7 written and passing
- All integration tests written and passing
- Full regression suite: all existing + new tests pass
- Performance: ContextBuilder < 100ms for full assembly
- Performance: Session list < 200ms for 100 sessions

**Documentation updates:** All 5 documents created/updated

**Deployment impact:** None

**Acceptance criteria:**
- [ ] Total test count ≥ 180 (116 existing + ~64 new)
- [ ] All tests pass
- [ ] `docs/CONVERSATION_PLATFORM.md` exists and is complete
- [ ] `docs/CHAT_API_GUIDE.md` exists and is complete
- [ ] `docs/PROMPT_AUTHORING_GUIDE.md` exists and is complete
- [ ] `docs/DATABASE_SCHEMA.md` exists and is complete
- [ ] `docs/API_REFERENCE.md` updated with all new endpoints
- [ ] No TODO/FIXME left in production code
- [ ] Code follows existing style conventions

---

### Milestone Dependency Graph

```
M1 (Schema) ─────┬──────────────────────────────────────┐
                  │                                      │
M2 (Config/Prompts) ──────┐                             │
                           │                             │
M3 (Session Mgmt) ────────┤                             │
                           │                             │
M4 (Memory System) ───────┤                             │
                           │                             │
M5 (Context Builder) ─────┤                             │
                           │                             │
M6 (Title + Messages) ────┤                             │
                           │                             │
M7 (Export + Stats) ──────┘                             │
                           │                             │
M8 (Tests + Docs) ────────┘                             │
```

**Critical path:** M1 → M4 → M5 → M6 → M8

**Parallelizable:**
- M2 can run after M1 (independent of M3-M7)
- M3 can run after M1 (independent of M4-M7)
- M7 can run after M1 + M3 (independent of M4-M6)

**Recommended execution order:** M1 → M2 → M3 → M7 → M4 → M5 → M6 → M8

This order ensures each milestone is independently testable and deployable, with the backend remaining functional after each.

---

## 3. Risk Register & Design Recommendations

### 3.1 Risks

| # | Risk | Severity | Likelihood | Impact | Mitigation |
|---|------|----------|------------|--------|------------|
| R1 | `session_data` JSONB column named `metadata` conflicts with SQLAlchemy internals | Medium | High | ORM mapping errors | Use `session_data` as column name (design already recommends this) |
| R2 | Incremental summarization merges poorly over many cycles | Medium | Medium | Degraded summary quality | Cap summary at `AI_MAX_SUMMARY_LENGTH`, rebuild if corrupted |
| R3 | Fact extraction produces duplicate/contradictory facts | Low | High | Noisy context | Dedup by fuzzy text matching, cap at 20 facts per session |
| R4 | Token estimation (chars/3.5) inaccurate, causing budget overflow | Medium | Medium | AI truncation or error | Use conservative estimate (chars/3), add safety margin |
| R5 | Auto-title generation adds latency to first message | Low | High | Slower first response | 3s timeout with fallback; consider async in future |
| R6 | Summarization on every 20th message adds latency | Medium | Medium | Slower responses at threshold | Run summarization synchronously but with 10s timeout; cache result |
| R7 | Session search with ILIKE on large datasets slow | Low | Low | Slow list loading | GIN index on title, limit search to title only (not message content initially) |
| R8 | `SoftDeleteMixin` not used on ChatSession — hard delete via CASCADE may cause data loss | High | Low | Lost conversations | Ensure retention policy is well-tested; add confirmation step in frontend |
| R9 | Concurrent requests to same session cause race conditions on metadata updates | Medium | Low | Incorrect message_count or token totals | Use DB-level atomic increments (`session_data = jsonb_set(...)`) |
| R10 | Large conversations (500+ messages) cause slow memory loading | Medium | Low | Slow responses | Lazy load messages: only load last N for display, load all only for export/rebuild |

### 3.2 Design Inconsistencies & Recommendations

| # | Issue | Current Design | Recommendation | Reason |
|---|-------|----------------|----------------|--------|
| D1 | `ChatSession` doesn't use `SoftDeleteMixin` | Design uses `deleted_at` via migration | Add `SoftDeleteMixin` to ChatSession model instead of manual column | Consistency with User model, existing pattern |
| D2 | Message regeneration deletes old message | Design says "hard-delete the old assistant message" | Use soft delete (`deleted_at`) instead of hard delete | Preserves audit trail, allows undo, matches existing pattern |
| D3 | Session metadata updates happen synchronously in request path | Design describes async updates | Keep synchronous in 3.2A, design async for 3.3+ | Azure Functions consumption plan doesn't support background tasks easily; synchronous is simpler and sufficient for expected load |
| D4 | Export endpoint is POST (design says `POST /export`) | POST for read operations | Change to `GET /v1/chat/sessions/{id}/export?format=json` | GET is semantically correct for read operations; no mutation occurs |
| D5 | Prompt `context_compression.md` may be unnecessary | Design lists it | Defer — trimming is code-based, not prompt-based | The trimming logic in ContextBuilder doesn't need an AI prompt |
| D6 | `metadata.yaml` prompt registry file | Design proposes YAML file for metadata | Use Python dict in `prompt_loader.py` instead | Avoids YAML dependency and parsing complexity; metadata is small and static |
| D7 | Token budget percentages hardcoded in design | Fixed 15/10/5/50/20 | Make configurable via Settings (already in design) | Allow tuning without code changes |
| D8 | `ConversationMemory.add_message()` stores timestamp | Current implementation adds timestamp | Remove timestamp from message dict | AI doesn't use timestamps; wastes tokens. Store in DB only. |
| D9 | Design doesn't specify error handling for concurrent regeneration | Two regenerations on same assistant message simultaneously | Lock session for regeneration (optimistic: check message still exists before delete) | Simple optimistic check sufficient for expected concurrency |
| D10 | Retention policy design assumes a timer trigger | Azure Functions timer trigger needed | Design but defer implementation to Phase 3.3 | Timer trigger is separate infrastructure; not needed for core chat platform |

---

## 4. Implementation Checklist

### Pre-Implementation (Before Starting)

- [ ] Review and approve this gap analysis
- [ ] Resolve design recommendations D1-D10
- [ ] Ensure `7dd0e554f9fc` migration is current on all environments
- [ ] Verify local test suite passes: `python -m pytest tests/ -v`
- [ ] Verify Azure deployment is healthy

---

### Milestone 1: Database Schema Enhancement

- [ ] Add 8 fields to `ChatSession` in `app/models/chat.py`
- [ ] Add 5 fields to `ChatMessage` in `app/models/chat.py`
- [ ] Create migration `alembic/versions/<hash>_enhance_chat.py`
- [ ] Add 4 indexes in migration
- [ ] Run `alembic upgrade head` locally
- [ ] Run `alembic downgrade -1` and re-upgrade to verify rollback
- [ ] Verify all 116 tests pass
- [ ] Commit: `feat(db): enhance ChatSession and ChatMessage schemas`
- [ ] Deploy migration to Azure (manual or CI)

---

### Milestone 2: Configuration & Prompt System Enhancement

- [ ] Add 16 settings to `app/core/config.py`
- [ ] Update `app/core/config.py` with defaults
- [ ] Add `render()` to `app/services/ai/prompt_loader.py`
- [ ] Add `get_metadata()` to `app/services/ai/prompt_loader.py`
- [ ] Add frontmatter parsing to prompt_loader
- [ ] Add rendered cache to `app/services/ai/prompt_cache.py`
- [ ] Create `app/prompts/summarization.md`
- [ ] Create `app/prompts/title_generation.md`
- [ ] Create `app/prompts/fact_extraction.md`
- [ ] Create `app/schemas/ai.py` with prompt metadata schemas
- [ ] Add `GET /v1/ai/prompts` endpoint to `app/api/v1/ai.py`
- [ ] Add `POST /v1/ai/prompts/{name}/test` endpoint
- [ ] Write unit tests for render, frontmatter, metadata
- [ ] Write integration tests for prompt endpoints
- [ ] Verify all 116 existing tests pass
- [ ] Commit: `feat(prompts): add variable rendering, frontmatter, and debugging`

---

### Milestone 3: Session Management Enhancement

- [ ] Add `ChatSessionUpdate` schema to `app/schemas/chat.py`
- [ ] Update `ChatSessionResponse` with is_pinned, is_archived, session_data fields
- [ ] Update `ChatSessionDetailResponse` with summary, session_data fields
- [ ] Add `update_session()` to `app/services/chat_service.py`
- [ ] Enhance `list_chat_sessions()` with search, is_archived, sort params
- [ ] Add `PATCH /v1/chat/sessions/{id}` to `app/api/v1/chat.py`
- [ ] Add validation: can't pin archived, can't archive pinned
- [ ] Enhance `GET /v1/chat/sessions` query params
- [ ] Write unit tests for update logic
- [ ] Write integration tests for search, filter, sort
- [ ] Write API tests for PATCH (200, 401, 404, 422)
- [ ] Verify all 116 existing tests pass
- [ ] Update `docs/API_REFERENCE.md`
- [ ] Commit: `feat(chat): enhance session management with search, pin, archive`

---

### Milestone 4: Conversation Memory System

- [ ] Enhance `app/services/ai/summarizer.py` with delta summarization
- [ ] Add `merge_summaries()` to summarizer
- [ ] Add `validate_summary()` to summarizer
- [ ] Create `app/services/ai/fact_extractor.py`
- [ ] Rewrite `app/services/ai/conversation_manager.py` memory logic
- [ ] Add persistent summary loading/saving in ConversationManager
- [ ] Add summarization trigger in ConversationManager
- [ ] Add fact extraction trigger in ConversationManager
- [ ] Add `POST /v1/chat/sessions/{id}/rebuild-memory` endpoint
- [ ] Add `MemoryRebuildResponse` schema
- [ ] Write unit tests for summarizer delta/merge/validate
- [ ] Write unit tests for fact_extractor
- [ ] Write integration tests for summarization flow
- [ ] Write integration tests for fact extraction
- [ ] Verify all 116 existing tests pass
- [ ] Commit: `feat(memory): persistent summarization and fact extraction`

---

### Milestone 5: Context Builder Rewrite

- [ ] Rewrite `build_context(session)` in `app/services/ai/context_builder.py`
- [ ] Implement `_estimate_tokens()` method
- [ ] Implement priority-based assembly
- [ ] Implement budget-based trimming
- [ ] Implement fact injection
- [ ] Implement minimum recent messages guarantee
- [ ] Update `ConversationManager.build_ai_messages()` to use new ContextBuilder
- [ ] Write unit tests for each priority level
- [ ] Write unit tests for token estimation
- [ ] Write unit tests for trimming behavior
- [ ] Write integration tests for full context assembly
- [ ] Verify all 116 existing tests pass
- [ ] Commit: `feat(context): priority-based context assembly with token budgeting`

---

### Milestone 6: Title Generation & Enhanced Message Flow

- [ ] Add `generate_title()` to ConversationManager
- [ ] Enhance POST messages flow in `app/api/v1/chat.py`
- [ ] Add title generation trigger (first message, null title)
- [ ] Add title fallback on AI failure
- [ ] Add AI metadata storage on assistant messages
- [ ] Add session_data update after message exchange
- [ ] Add `POST /v1/chat/sessions/{id}/messages/{mid}/regenerate` endpoint
- [ ] Add `ChatRegenerateResponse` schema
- [ ] Update `ChatMessageResponse` with metadata fields
- [ ] Write unit tests for title generation
- [ ] Write unit tests for metadata storage
- [ ] Write unit tests for regeneration flow
- [ ] Write integration tests for full message flow
- [ ] Write API tests for all enhanced/new endpoints
- [ ] Verify all 116 existing tests pass
- [ ] Update `docs/API_REFERENCE.md`
- [ ] Commit: `feat(chat): title generation, message regeneration, AI metadata`

---

### Milestone 7: Export & Statistics

- [ ] Add `export_session()` to `app/services/chat_service.py`
- [ ] Add JSON export formatter
- [ ] Add Markdown export formatter
- [ ] Add Text export formatter
- [ ] Add `get_stats()` to chat_service
- [ ] Add `POST /v1/chat/sessions/{id}/export` endpoint (changed from POST to per rec D4)
- [ ] Add `GET /v1/chat/stats` endpoint
- [ ] Add `ChatStatsResponse` schema
- [ ] Write unit tests for all 3 export formats
- [ ] Write unit tests for stats aggregation
- [ ] Write integration tests for export
- [ ] Write integration tests for stats
- [ ] Verify all 116 existing tests pass
- [ ] Update `docs/API_REFERENCE.md`
- [ ] Commit: `feat(chat): conversation export and statistics`

---

### Milestone 8: Tests, Documentation & Final Integration

- [ ] Rewrite/expand `tests/test_chat.py` for all endpoints
- [ ] Create `tests/test_conversation_platform.py` (integration)
- [ ] Create `tests/test_context_builder.py` (unit)
- [ ] Create `tests/test_memory.py` (unit)
- [ ] Create `docs/CONVERSATION_PLATFORM.md`
- [ ] Create `docs/CHAT_API_GUIDE.md`
- [ ] Create `docs/PROMPT_AUTHORING_GUIDE.md`
- [ ] Create `docs/DATABASE_SCHEMA.md`
- [ ] Update `docs/API_REFERENCE.md` (complete)
- [ ] Verify total test count ≥ 180
- [ ] Run full test suite: `python -m pytest tests/ -v`
- [ ] Run performance check: ContextBuilder < 100ms
- [ ] No TODO/FIXME in production code
- [ ] All code follows existing style
- [ ] Commit: `docs: Phase 3.2A complete - tests and documentation`

---

### Post-Milestone 8

- [ ] Final `python -m pytest tests/ -v` — all tests pass
- [ ] `func azure functionapp publish tophexity-func --python --build remote`
- [ ] Verify all endpoints on Azure: `/health`, `/health/ai`, `/docs`, `/v1/chat/*`
- [ ] Commit locally (do NOT push per project convention)

---

*End of Gap Analysis & Implementation Plan*
