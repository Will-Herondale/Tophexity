# Phase 3.2A: AI Conversation Platform — Design Specification

**Version:** 1.0  
**Date:** 2026-07-22  
**Status:** Design Complete  
**Scope:** Conversation lifecycle, memory system, context builder, prompts, chat experience, database, API, frontend integration, testing, documentation, implementation plan

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Conversation Lifecycle](#3-conversation-lifecycle)
4. [Memory System](#4-memory-system)
5. [Context Builder](#5-context-builder)
6. [Prompt System](#6-prompt-system)
7. [Chat Experience](#7-chat-experience)
8. [Streaming](#8-streaming)
9. [Database Design](#9-database-design)
10. [API Design](#10-api-design)
11. [Frontend Integration](#11-frontend-integration)
12. [Architecture Diagrams](#12-architecture-diagrams)
13. [Testing Strategy](#13-testing-strategy)
14. [Documentation Plan](#14-documentation-plan)
15. [Implementation Roadmap](#15-implementation-roadmap)

---

## 1. Executive Summary

Phase 3.2A transforms the existing skeleton chat system into a production-grade AI Conversation Platform. The current system has basic session/message CRUD and a raw pass-through to Azure OpenAI. Phase 3.2A adds:

- **Persistent conversation memory** with AI-powered summarization stored in the database
- **Intelligent context assembly** with token budgeting and priority-based trimming
- **Conversation lifecycle management** including pinning, archiving, renaming, search, and retention
- **Enhanced prompt system** with variables, versioning, and debugging
- **Rich chat experience** with regeneration, metadata, and structured responses
- **Production-ready database schema** with proper indexes, JSONB metadata, and summary storage

**Out of scope for 3.2A:** Streaming (designed as future upgrade), voice input, multi-modal input, tool/function calling.

---

## 2. Current State Analysis

### 2.1 What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| `ChatSession` model | Basic | id, user_id, title, created_at, updated_at |
| `ChatMessage` model | Basic | id, session_id, role (enum), content (Text), created_at, updated_at |
| `chat_service.py` | Basic CRUD | create, list, get, delete sessions; add messages |
| `chat.py` endpoints | Basic | 5 endpoints (CRUD + send message) |
| `ConversationManager` | Functional | loads memory, builds AI messages, stores exchange |
| `ConversationMemory` | In-memory only | recent_messages + summary, trim, build_for_ai |
| `ContextBuilder` | Functional | loads profile, portfolio, latest rec/roadmap/backup |
| `summarizer.py` | Functional | calls AI to summarize, has fallback |
| `prompt_loader.py` | Basic | reads .md files from disk |
| `prompt_cache.py` | Functional | TTL-based cache |
| `AIClient` | Complete | chat, generate, retry, rate limit, token tracking |

### 2.2 Key Gaps

| Gap | Impact |
|-----|--------|
| No persistent summary storage | Summaries are recomputed every time; wasteful |
| No conversation metadata | Can't track message count, token usage per session, model used |
| No pinning/archiving | Users can't organize conversations |
| No search | Can't find old conversations |
| No title auto-generation | Sessions have null titles until manually set |
| No message regeneration | Users can't retry a bad AI response |
| No token budgeting in context | Context can exceed model limits |
| No prompt variables | Can't inject dynamic data into prompts |
| No conversation statistics | No analytics for users or admin |
| No retention policy | Conversations accumulate forever |
| No export | Users can't save their conversation history |

---

## 3. Conversation Lifecycle

### 3.1 Conversation States

A conversation moves through these states:

```
ACTIVE  ──archive──>  ARCHIVED  ──restore──>  ACTIVE
ACTIVE  ──delete──>  DELETED (hard delete after retention period)
```

**State definitions:**

| State | Description | Visible in List | Accepts Messages | AI Responds |
|-------|-------------|-----------------|------------------|-------------|
| `active` | Normal working conversation | Yes (default) | Yes | Yes |
| `archived` | User hidden from main list | Yes (with filter) | No | No |
| `deleted` | Soft-deleted, pending retention cleanup | No | No | No |

### 3.2 Conversation Storage Architecture

```
ChatSession (enhanced)
├── Core fields: id, user_id, title, created_at, updated_at
├── Lifecycle fields: is_archived, archived_at, deleted_at
├── AI fields: summary, summary_updated_at, summary_message_count
├── Metadata: metadata (JSONB) — message_count, total_tokens, last_model, last_message_at
├── Organization: is_pinned, pinned_at, tags (JSONB array)
└── Messages: ChatMessage[] (relationship)
    ├── Core: id, session_id, role, content, created_at, updated_at
    ├── AI metadata: token_count, model_used, latency_ms, request_id
    └── Extended: metadata (JSONB) — finish_reason, temperature, prompt_tokens, completion_tokens
```

### 3.3 Conversation Metadata

Stored as JSONB in `chat_sessions.metadata`:

```json
{
  "message_count": 12,
  "user_message_count": 6,
  "assistant_message_count": 6,
  "total_tokens_used": 4520,
  "total_prompt_tokens": 3100,
  "total_completion_tokens": 1420,
  "estimated_cost_usd": 0.133,
  "last_message_at": "2026-07-22T14:30:00Z",
  "last_model": "gpt-5",
  "first_message_at": "2026-07-22T10:00:00Z",
  "average_response_latency_ms": 2340.5
}
```

Metadata is updated **asynchronously after each message exchange** — not blocking the response. A background task increments counters and appends costs.

### 3.4 Conversation Title Generation

**Trigger:** When a session is created with `title: null` and the first user message is sent.

**Mechanism:**
1. User sends first message to a titleless session
2. Backend sends the user's first message to AI with a dedicated title-generation prompt
3. AI returns a short title (max 80 characters)
4. Title is stored in `chat_sessions.title`
5. `title_auto_generated` flag set to `true` in metadata

**Title generation prompt:**

```
Generate a concise title (max 80 characters) for this conversation.
The title should capture the main topic. Do not use quotes.
User's first message: {first_message}
```

**Fallback:** If AI fails, title is set to `"Chat - {first 50 chars of message}..."`.

**Config:** `AI_TITLE_GENERATION_ENABLED: bool = True` in settings.

### 3.5 Conversation Renaming

**Endpoint:** `PATCH /v1/chat/sessions/{session_id}`

- User can set any title (max 500 chars, same as existing constraint)
- Sets `title_auto_generated = false` in metadata
- Validates: non-empty string, max 500 chars

### 3.6 Conversation Deletion

**Strategy:** Soft delete by default, hard delete by retention policy.

1. User calls `DELETE /v1/chat/sessions/{session_id}`
2. Session is soft-deleted: `deleted_at = now()`, cascading via existing `ondelete="CASCADE"` on messages
3. Session disappears from all queries (filtered by `deleted_at IS NULL`)
4. Retention policy (see 3.12) hard-deletes after configurable period

**Note:** The existing `ondelete="CASCADE"` on `ChatMessage.session_id` FK means messages are DB-deleted when the session row is deleted. For soft delete, we filter at the query level. For hard delete (retention), the CASCADE handles cleanup.

### 3.7 Conversation Archival

**Endpoint:** `POST /v1/chat/sessions/{session_id}/archive`

1. Sets `is_archived = true`, `archived_at = now()`
2. Session excluded from default list queries
3. Session accessible by direct ID lookup
4. Messages remain fully accessible

### 3.8 Conversation Restoration

**Endpoint:** `POST /v1/chat/sessions/{session_id}/restore`

1. Sets `is_archived = false`, `archived_at = null`
2. Session reappears in default list

### 3.9 Pinned Conversations

**Endpoint:** `POST /v1/chat/sessions/{session_id}/pin` / `POST /v1/chat/sessions/{session_id}/unpin`

- `is_pinned: bool`, `pinned_at: datetime | null`
- Pinned sessions always sort first in list queries
- Sort order: `is_pinned DESC, updated_at DESC`

### 3.10 Conversation Search

**Endpoint:** `GET /v1/chat/sessions?search=...`

- Full-text search on `chat_sessions.title` using PostgreSQL `ILIKE`
- Also searches first user message content via a subquery join
- Combined with existing filters (page, page_size, archived)

**SQL approach:**

```sql
SELECT DISTINCT cs.*
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cm.session_id = cs.id
  AND cm.role = 'user'
  AND cm.created_at = (
    SELECT MIN(cm2.created_at) FROM chat_messages cm2
    WHERE cm2.session_id = cs.id AND cm2.role = 'user'
  )
WHERE cs.user_id = :user_id
  AND cs.deleted_at IS NULL
  AND (cs.title ILIKE :search OR cm.content ILIKE :search)
ORDER BY cs.is_pinned DESC, cs.updated_at DESC
```

### 3.11 Conversation Pagination

Existing pagination pattern (page, page_size, total, total_pages) is retained. Add:

- Default sort: `is_pinned DESC, updated_at DESC`
- Filter by `is_archived` (default: false)
- Search is additive to filters

### 3.12 Conversation Statistics

**Endpoint:** `GET /v1/chat/stats`

Returns aggregate stats for the user:

```json
{
  "total_sessions": 15,
  "active_sessions": 12,
  "archived_sessions": 3,
  "total_messages": 156,
  "total_tokens_used": 45200,
  "estimated_total_cost_usd": 1.33,
  "average_messages_per_session": 10.4,
  "first_conversation_at": "2026-07-01T10:00:00Z",
  "last_conversation_at": "2026-07-22T14:30:00Z"
}
```

Computed via SQL aggregation queries on `chat_sessions` and `chat_messages`.

### 3.13 Conversation Export

**Endpoint:** `GET /v1/chat/sessions/{session_id}/export?format=json`

Formats:

- `json` (default): Full structured export with metadata
- `markdown`: Human-readable Markdown format
- `text`: Plain text, one message per block

**JSON export structure:**

```json
{
  "session": {
    "id": "uuid",
    "title": "Career Discussion",
    "created_at": "2026-07-22T10:00:00Z",
    "message_count": 12
  },
  "summary": "User discussed transitioning from web dev to ML...",
  "messages": [
    {
      "role": "user",
      "content": "I want to transition to ML...",
      "timestamp": "2026-07-22T10:00:05Z"
    },
    {
      "role": "assistant",
      "content": "Great choice! Based on your profile...",
      "timestamp": "2026-07-22T10:00:12Z",
      "model": "gpt-5",
      "tokens": 450
    }
  ]
}
```

### 3.14 Conversation Retention Policy

**Configuration (in Settings):**

```python
AI_CONVERSATION_RETENTION_DAYS: int = 90  # Hard delete after 90 days of inactivity
AI_CONVERSATION_ARCHIVE_AFTER_DAYS: int = 30  # Auto-archive after 30 days inactive
AI_MAX_CONVERSATIONS_PER_USER: int = 100
```

**Mechanism:** A scheduled Azure Function (timer trigger) runs daily:
1. Find sessions where `updated_at < now() - ARCHIVE_AFTER_DAYS` and `is_archived = false` and `deleted_at IS NULL` → auto-archive
2. Find sessions where `deleted_at < now() - RETENTION_DAYS` → hard delete (messages cascade)
3. If user exceeds `MAX_CONVERSATIONS_PER_USER`, soft-delete oldest non-pinned sessions

### 3.15 Conversation Import (Optional / Future)

Not designed in 3.2A. The export format (JSON) is designed to be import-compatible in a future phase. Import would:
1. Parse the JSON export
2. Create a new session with the original title/metadata
3. Replay messages with original timestamps
4. Skip AI metadata (token counts, model, etc.)

---

## 4. Memory System

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   ChatSession                        │
│  summary: str (persistent, in DB)                   │
│  summary_updated_at: datetime                       │
│  summary_message_count: int                         │
├─────────────────────────────────────────────────────┤
│  ChatMessage[] (recent messages, in DB)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ msg 1    │ │ msg 2    │ │ msg N    │            │
│  │ (oldest) │ │          │ │ (newest) │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘

At runtime, ConversationMemory assembles:
┌─────────────────────────────────────────────────────┐
│  [system_prompt]                                     │
│  [conversation_summary]  ← from DB (persistent)     │
│  [extracted_facts]       ← from DB (persistent)     │
│  [recent_messages]       ← from DB (last N)         │
│  [user_message]          ← just sent                │
└─────────────────────────────────────────────────────┘
```

### 4.2 How Summaries Work

**Current behavior (broken):** Summarizer recomputes from scratch every time messages exceed threshold. Wasteful and inconsistent.

**New behavior:** Summaries are computed incrementally and stored persistently.

**Summary lifecycle:**

1. **Session created** → `summary = null`, `summary_message_count = 0`
2. **Messages accumulate** → No summary updates until threshold
3. **Messages exceed threshold (default 20)** → Summarize messages[0..N-keep_recent], store in `chat_sessions.summary`, update `summary_message_count`
4. **More messages accumulate** → Only summarize the *delta* since last summary
5. **Summary stored** → Next AI request uses stored summary instead of recomputing

**Incremental summarization:**

```
When summary_message_count = 0 and total_messages > threshold:
  summarize messages[0 .. total - keep_recent] → full_summary
  store full_summary

When summary_message_count > 0 and total_messages > summary_message_count + threshold:
  recent_unsummarized = messages[summary_message_count .. total - keep_recent]
  delta_summary = summarize(recent_unsummarized)
  combined_summary = merge(existing_summary, delta_summary)
  store combined_summary
  update summary_message_count
```

### 4.3 Summary Validation

Before storing a summary:
1. Must be non-empty string
2. Must be under 2000 characters (configurable: `AI_MAX_SUMMARY_LENGTH`)
3. Must not be identical to existing summary (dedup check)
4. If validation fails, keep existing summary and log warning

### 4.4 Long-Term Memory / Important Fact Extraction

**Concept:** Beyond conversation summaries, extract discrete facts that persist across conversations.

**Storage:** New `chat_facts` table (or JSONB in session metadata — design decision: **use session metadata JSONB** to avoid table proliferation).

**Fact structure in `chat_sessions.metadata.facts`:**

```json
[
  {
    "fact": "User wants to transition from web development to machine learning",
    "category": "career_goal",
    "confidence": 0.95,
    "extracted_at": "2026-07-22T10:05:00Z",
    "source_messages": ["msg-uuid-1", "msg-uuid-2"]
  },
  {
    "fact": "User has 3 years of Python experience",
    "category": "skill_level",
    "confidence": 0.9,
    "extracted_at": "2026-07-22T10:10:00Z",
    "source_messages": ["msg-uuid-3"]
  }
]
```

**Categories:** `career_goal`, `skill_level`, `preference`, `constraint`, `interest`, `experience`, `education`

**Extraction trigger:** After every 5th user message (configurable: `AI_FACT_EXTRACTION_INTERVAL`), AI extracts facts from the latest exchange and appends to the facts list. Deduplication by semantic similarity (fuzzy match on fact text).

**Fact usage:** Injected into context builder as "User Facts" section.

### 4.5 Context Compression

When the context window approaches model limits:

1. **Level 1 (80% budget):** Trim oldest recent messages, keeping only role + first 200 chars
2. **Level 2 (90% budget):** Remove entire oldest messages, keep only count + summary reference
3. **Level 3 (95% budget):** Aggressively summarize recent messages into a second compressed block

**Token budget estimation:** 1 token ≈ 4 characters (conservative). Budget calculated from `AI_MAX_CONTEXT_MESSAGES * avg_message_length * 0.25`.

### 4.6 Memory Pruning

After summarization:
1. Messages that have been summarized are NOT deleted from DB (they remain for export, audit)
2. `ConversationMemory.recent_messages` only holds the last `keep_recent` messages
3. Memory is rebuilt from DB on each request (no in-memory persistence across requests)

### 4.7 Memory Rebuilding

If a session's summary is corrupted or stale:
1. Set `summary = null`, `summary_message_count = 0`
2. Reload all messages from DB
3. Re-run full summarization
4. Trigger: manual endpoint `POST /v1/chat/sessions/{session_id}/rebuild-memory`

### 4.8 Maximum History Strategy

- All messages stored permanently in DB (until retention policy hard-deletes)
- `ConversationMemory` window: configurable `AI_MAX_CONTEXT_MESSAGES` (default 50)
- Summary provides compressed history beyond the window
- Facts provide cross-conversation persistent knowledge

### 4.9 Token Budgeting

**Per-request token budget allocation (out of AI_MAX_TOKENS=4096):**

| Component | Allocation | Max Tokens |
|-----------|-----------|------------|
| System prompt + user context | 15% | ~600 |
| Conversation summary | 10% | ~400 |
| User facts | 5% | ~200 |
| Recent messages | 50% | ~2000 |
| AI response reserve | 20% | ~800 |
| Safety margin | — | ~64 (16 remaining from other allocations) |

**Config:**

```python
AI_CONTEXT_BUDGET_SYSTEM_PCT: float = 0.15
AI_CONTEXT_BUDGET_SUMMARY_PCT: float = 0.10
AI_CONTEXT_BUDGET_FACTS_PCT: float = 0.05
AI_CONTEXT_BUDGET_MESSAGES_PCT: float = 0.50
AI_CONTEXT_BUDGET_RESPONSE_PCT: float = 0.20
```

---

## 5. Context Builder

### 5.1 Current State

`ContextBuilder.build_system_prompt()` concatenates the system prompt file with a raw string of all user data. No prioritization, no token awareness, no structured assembly.

### 5.2 New Context Assembly Priority Order

```
1. System prompt (from prompt file — always included, highest priority)
2. User profile (always included if exists — foundational context)
3. User facts (high priority — persistent cross-conversation knowledge)
4. Conversation summary (high priority — compressed history)
5. Recent messages (medium priority — sliding window)
6. Portfolio items (medium priority — relevant if career discussion)
7. Latest recommendation (low priority — include if exists, summarize if token-tight)
8. Latest roadmap (low priority)
9. Latest backup plan (low priority)
10. User preferences (low priority — inferred preferences from metadata)
```

### 5.3 Context Builder Assembly Algorithm

```python
async def build_context(self, session: ChatSession) -> list[dict[str, str]]:
    messages = []
    token_budget = self._calculate_budget()

    # 1. System prompt (always, never trimmed)
    system_prompt = self._load_system_prompt()
    messages.append({"role": "system", "content": system_prompt})
    token_budget -= self._estimate_tokens(system_prompt)

    # 2. User profile (always if exists)
    profile_section = self._format_profile()
    if profile_section:
        messages.append({"role": "system", "content": profile_section})
        token_budget -= self._estimate_tokens(profile_section)

    # 3. User facts (high priority)
    facts_section = self._format_facts(session)
    if facts_section:
        messages.append({"role": "system", "content": facts_section})
        token_budget -= self._estimate_tokens(facts_section)

    # 4. Conversation summary
    if session.summary:
        summary_section = f"## Conversation Summary\n{session.summary}"
        messages.append({"role": "system", "content": summary_section})
        token_budget -= self._estimate_tokens(summary_section)

    # 5-9. Lower priority sections (included if budget allows)
    remaining_sections = [
        self._format_portfolio(),
        self._format_recommendation(),
        self._format_roadmap(),
        self._format_backup(),
    ]
    for section in remaining_sections:
        if section and token_budget > self._reserve_for_messages():
            messages.append({"role": "system", "content": section})
            token_budget -= self._estimate_tokens(section)

    return messages
```

### 5.4 Context Trimming Strategy

When total context exceeds budget:

1. **Never trim:** System prompt, user profile
2. **Trim first:** Portfolio items (oldest/least relevant), backup plans
3. **Trim second:** Recommendation details (keep summary only)
4. **Trim third:** Recent messages (keep most recent, drop oldest)
5. **Never trim below:** 4 recent messages minimum (to maintain conversation coherence)

### 5.5 Token Budgeting Algorithm

```python
def _calculate_budget(self) -> int:
    total = settings.AI_MAX_TOKENS  # 4096
    response_reserve = int(total * 0.20)  # 819
    return total - response_reserve

def _estimate_tokens(self, text: str) -> int:
    """Conservative estimate: 1 token ≈ 3.5 characters."""
    return max(1, len(text) // 3)

def _reserve_for_messages(self) -> int:
    """Minimum tokens to reserve for recent messages."""
    return int(self._calculate_budget() * 0.30)
```

### 5.6 New ContextBuilder Interface

```python
class ContextBuilder:
    def __init__(self, db: AsyncSession, user: User) -> None: ...

    # Existing (enhanced)
    async def load_all(self) -> dict: ...
    def build_system_prompt(self, prompt_name: str) -> str: ...

    # New
    async def build_context(self, session: ChatSession) -> list[dict[str, str]]: ...
    async def build_context_for_summary(self, messages: list[dict]) -> str: ...
    def estimate_tokens(self, text: str) -> int: ...
    async def extract_facts(self, messages: list[dict]) -> list[dict]: ...
    def get_token_usage_report(self) -> dict: ...
```

---

## 6. Prompt System

### 6.1 Prompt Folder Structure

```
app/prompts/
├── system.md              # Base system prompt (always loaded)
├── chat.md                # Chat conversation behavior
├── recommendation.md      # Career recommendation generation
├── roadmap.md             # Learning roadmap generation
├── backup.md              # Backup plan generation
├── title_generation.md    # NEW: Conversation title generation
├── summarization.md       # NEW: Conversation summarization
├── fact_extraction.md     # NEW: Fact extraction from messages
├── context_compression.md # NEW: Context compression/trimming
└── metadata.yaml          # NEW: Prompt metadata registry
```

### 6.2 Prompt File Organization

Each `.md` file follows this structure:

```markdown
---
name: chat
version: 1
description: Chat conversation behavior prompt
variables:
  - user_name
  - conversation_topic
  - user_facts
temperature: 0.7
max_tokens: 2048
---

# Actual prompt content here

You are Tophexity AI having a career guidance conversation...

## User Info
Name: {{user_name}}
Topic: {{conversation_topic}}
```

**Frontmatter (YAML):** Metadata for the prompt registry. Not parsed by the prompt itself but used by the prompt management system.

**Body:** The actual prompt template with `{{variable}}` placeholders.

### 6.3 Prompt Versioning

**Strategy:** File-based versioning with metadata tracking.

- Each prompt has a `version: N` in its frontmatter
- `PromptCache` tracks the current version number
- When a prompt file is modified (detected by file mtime), version increments
- API responses include `X-Prompt-Version` header for debugging
- No database-based versioning in 3.2A (overkill for this scale)

### 6.4 Prompt Variables

**Implementation:** Simple string replacement in `PromptLoader.render()`.

```python
def render(self, name: str, variables: dict[str, str] = None) -> str:
    content = prompt_cache.get(name)
    if variables:
        for key, value in variables.items():
            content = content.replace(f"{{{{{key}}}}}", str(value))
    return content
```

**Reserved variables (auto-populated):**

| Variable | Source | Description |
|----------|--------|-------------|
| `{{user_name}}` | Profile.full_name | User's name |
| `{{user_headline}}` | Profile.headline | Professional headline |
| `{{user_skills}}` | Profile.skills | Skills as formatted string |
| `{{user_interests}}` | Profile.interests | Interests as formatted string |
| `{{conversation_summary}}` | Session.summary | Current summary |
| `{{user_facts}}` | Session.metadata.facts | Extracted facts |
| `{{current_date}}` | datetime.now() | Current date |
| `{{career_count}}` | Career DB count | Total careers in database |

### 6.5 Prompt Validation

At startup (or on prompt reload):
1. Check all required prompt files exist
2. Parse frontmatter, validate YAML structure
3. Check required variables are provided at render time
4. Warn on unknown variables (don't fail)
5. Check prompt length doesn't exceed 50% of token budget

### 6.6 Prompt Caching Enhancement

Current `PromptCache` uses TTL-based expiry. Enhancements:
- Add `render()` method to `PromptCache` that combines loading + variable substitution
- Cache rendered prompts with variable hash as key (for same-variable re-renders)
- Add `get_metadata(name)` to retrieve frontmatter without loading full content

### 6.7 Prompt Debugging

**Endpoint:** `GET /v1/ai/prompts` (admin only in future, currently open)

Returns list of all prompts with metadata:
```json
{
  "prompts": [
    {
      "name": "system",
      "version": 1,
      "description": "Base system prompt",
      "char_count": 856,
      "estimated_tokens": 245,
      "variables": [],
      "last_loaded_at": "2026-07-22T10:00:00Z"
    }
  ]
}
```

### 6.8 Prompt Testing

**Endpoint:** `POST /v1/ai/prompts/{name}/test`

Takes a set of variables, renders the prompt, returns the rendered output without sending to AI. For debugging prompt templates.

---

## 7. Chat Experience

### 7.1 Message Flow (Enhanced)

```
User sends message
       │
       ▼
[1] Validate input (role, content, session ownership)
       │
       ▼
[2] Store user message in DB
       │
       ▼
[3] Update session metadata (message_count++, last_message_at)
       │
       ▼
[4] Check if title needs generation (first message + null title)
       │
       ├──YES──> Generate title via AI (async, non-blocking)
       │
       ▼
[5] Load conversation memory from DB (summary + recent messages)
       │
       ▼
[6] Check if summarization needed (message count > threshold)
       │
       ├──YES──> Summarize delta messages, update session summary
       │
       ▼
[7] Check if fact extraction needed (every N messages)
       │
       ├──YES──> Extract facts, update session metadata
       │
       ▼
[8] Build context (system prompt + profile + facts + summary + recent + user message)
       │
       ▼
[9] Send to AI via AIClient (with retry, rate limiting, token tracking)
       │
       ▼
[10] Parse AI response
       │
       ▼
[11] Store assistant message in DB (with token count, model, latency)
       │
       ▼
[12] Update session metadata (total_tokens++, cost++)
       │
       ▼
[13] Return both messages to frontend
```

### 7.2 Response Regeneration

**Endpoint:** `POST /v1/chat/sessions/{session_id}/messages/{message_id}/regenerate`

**Behavior:**
1. Find the assistant message at `message_id`
2. Find the immediately preceding user message
3. Delete the assistant message from DB
4. Re-run the full chat flow (steps 5-13) with the same user message
5. Return the new assistant message

**Constraints:**
- Only the last assistant message can be regenerated (or any, by design choice — allow any)
- The user message is never deleted
- Token usage for the deleted message is NOT subtracted from session stats (historical accuracy)

### 7.3 Message Metadata

Each stored assistant message includes:

```json
{
  "id": "uuid",
  "session_id": "uuid",
  "role": "assistant",
  "content": "Based on your profile...",
  "created_at": "2026-07-22T10:00:12Z",
  "metadata": {
    "model": "gpt-5",
    "prompt_tokens": 850,
    "completion_tokens": 320,
    "total_tokens": 1170,
    "latency_ms": 2340.5,
    "finish_reason": "stop",
    "temperature": 0.7,
    "request_id": "uuid"
  }
}
```

### 7.4 Markdown Support

AI responses support Markdown natively. The backend does NOT transform the content — it stores raw Markdown as the AI returns it.

**Frontend responsibility:**
- Render Markdown with a library (e.g., `react-markdown`)
- Render code blocks with syntax highlighting
- Render tables using a Markdown table renderer
- Strip/escape any XSS vectors (use a sanitization library)

**Backend responsibility:**
- Store content as-is
- Return `content_type: "markdown"` in metadata for frontend hint
- Optional: `POST /v1/chat/render-markdown` endpoint for server-side rendering (NOT in 3.2A)

### 7.5 Tables, Code Blocks, Formatting

These are all Markdown features handled by the frontend renderer. The backend:
- Stores raw Markdown content
- Does not truncate code blocks or tables
- Validates message content is non-empty (min 1 char)

---

## 8. Streaming

### 8.1 Decision: Do NOT Implement Streaming in 3.2A

### 8.2 Rationale

| Factor | Assessment |
|--------|-----------|
| **Architecture complexity** | Azure Functions consumption plan does not support SSE/WebSocket natively. Streaming requires Durable Functions or SignalR, adding significant infrastructure. |
| **Azure Functions limitation** | The current `httpx.ASGITransport` bridge wraps FastAPI. SSE streaming through this bridge adds a layer of complexity that may introduce bugs. |
| **Development time** | Streaming is ~40% of remaining dev effort. Better spent on core conversation platform features. |
| **User impact** | With gpt-5, responses are fast enough that streaming provides marginal UX improvement for career guidance (not code generation or long-form writing). |
| **Frontend complexity** | HalfPanda would need SSE client, chunked rendering, partial Markdown parsing — significant frontend work. |

### 8.3 Future Upgrade Path (Phase 3.3+)

When streaming is needed:

1. **Infrastructure change:** Switch from Azure Functions Consumption to Azure Functions Premium (supports long-running) OR deploy FastAPI directly on Azure App Service / Container Apps
2. **Protocol:** Server-Sent Events (SSE) over HTTP — simpler than WebSocket
3. **Implementation path:**
   - Add `stream=True` parameter to `AzureFoundryProvider.complete()`
   - Use `httpx.AsyncClient.stream()` for chunked response
   - Yield `AIStreamChunk` objects
   - New endpoint: `POST /v1/chat/sessions/{id}/messages/stream` with `text/event-stream` response
   - Frontend: `EventSource` or `fetch` with `ReadableStream`
4. **Database impact:** None — streaming doesn't change storage, only transport
5. **Backward compatibility:** Non-streaming endpoint remains, streaming is additive

### 8.4 Interim UX for Long Responses

Without streaming, long responses appear after a delay. Mitigations:
- Return a `processing: true` response immediately with a `request_id`
- Frontend shows a loading indicator with elapsed time
- Poll `GET /v1/chat/sessions/{id}/messages/{request_id}/status` until ready
- OR: simply block until response is ready (acceptable for <5s responses)

**Design choice for 3.2A:** Block until response. The `POST /v1/chat/sessions/{id}/messages` endpoint returns only after AI responds. Timeout at 60 seconds. Frontend shows a spinner.

---

## 9. Database Design

### 9.1 ChatSession — Enhanced

**Table:** `chat_sessions`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID PK | No | uuid4 | Existing |
| `user_id` | UUID FK→users | No | — | Existing, CASCADE on delete |
| `title` | VARCHAR(500) | Yes | null | Existing |
| `created_at` | TIMESTAMPTZ | No | now() | Existing |
| `updated_at` | TIMESTAMPTZ | No | now() | Existing |
| **`is_archived`** | BOOLEAN | No | false | **NEW** |
| **`archived_at`** | TIMESTAMPTZ | Yes | null | **NEW** |
| **`is_pinned`** | BOOLEAN | No | false | **NEW** |
| **`pinned_at`** | TIMESTAMPTZ | Yes | null | **NEW** |
| **`summary`** | TEXT | Yes | null | **NEW** — persistent conversation summary |
| **`summary_updated_at`** | TIMESTAMPTZ | Yes | null | **NEW** — when summary was last updated |
| **`summary_message_count`** | INTEGER | No | 0 | **NEW** — how many messages the summary covers |
| **`metadata_`** | JSONB | Yes | '{}' | **NEW** — session metadata (message counts, costs, facts) |

**Note on `metadata_`:** PostgreSQL allows `metadata` as a column name but some ORMs have issues. Using `metadata_` with `mapped_column(name="metadata")` in SQLAlchemy to map to a clean DB column name. Alternatively, use `extra_data` as the Python attribute name. Final decision: use `metadata_` as the Python attribute name, mapped to `"metadata"` column in DB via `mapped_column(JSONB, name="metadata")`.

Wait — actually, SQLAlchemy doesn't allow `name=` on mapped_column for renaming. Better approach: use `session_data` as both Python attribute and DB column name to avoid any ambiguity.

**Revised:** Column name = `session_data` (Python) = `session_data` (DB), type JSONB.

### 9.2 ChatMessage — Enhanced

**Table:** `chat_messages`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID PK | No | uuid4 | Existing |
| `session_id` | UUID FK→chat_sessions | No | — | Existing, CASCADE on delete |
| `role` | ENUM | No | — | Existing (user/assistant/system) |
| `content` | TEXT | No | — | Existing |
| `created_at` | TIMESTAMPTZ | No | now() | Existing |
| `updated_at` | TIMESTAMPTZ | No | now() | Existing |
| **`token_count`** | INTEGER | Yes | null | **NEW** — total tokens for this message (assistant only) |
| **`model_used`** | VARCHAR(100) | Yes | null | **NEW** — model that generated this message (assistant only) |
| **`latency_ms`** | FLOAT | Yes | null | **NEW** — response latency (assistant only) |
| **`request_id`** | VARCHAR(100) | Yes | null | **NEW** — AI request ID for tracing |
| **`message_data`** | JSONB | Yes | '{}' | **NEW** — additional metadata (finish_reason, temperature, etc.) |

### 9.3 New Indexes

```sql
-- ChatSession indexes (new)
CREATE INDEX idx_chat_sessions_user_archived ON chat_sessions (user_id, is_archived, deleted_at);
CREATE INDEX idx_chat_sessions_user_pinned ON chat_sessions (user_id, is_pinned DESC, updated_at DESC);
CREATE INDEX idx_chat_sessions_title_search ON chat_sessions USING gin (to_tsvector('english', title));

-- ChatMessage indexes (new)
CREATE INDEX idx_chat_messages_session_created ON chat_messages (session_id, created_at);
CREATE INDEX idx_chat_messages_request_id ON chat_messages (request_id) WHERE request_id IS NOT NULL;
```

**Full-text search index:** Using PostgreSQL GIN index on `to_tsvector('english', title)` for efficient title search. For content search, join to first user message and use `ILIKE` (GIN on message content would be too large).

### 9.4 Relationships (Unchanged)

```
User 1──N ChatSession 1──N ChatMessage
```

- `ChatSession.user_id FK → users.id` (CASCADE)
- `ChatMessage.session_id FK → chat_sessions.id` (CASCADE)
- Cascade means: deleting a user deletes their sessions; deleting a session deletes its messages

### 9.5 Migration Strategy

**Single migration file:** `alembic/versions/<hash>_enhance_chat_tables.py`

```python
def upgrade():
    # ChatSession enhancements
    op.add_column('chat_sessions', sa.Column('is_archived', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('chat_sessions', sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('chat_sessions', sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('chat_sessions', sa.Column('pinned_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('chat_sessions', sa.Column('summary', sa.Text(), nullable=True))
    op.add_column('chat_sessions', sa.Column('summary_updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('chat_sessions', sa.Column('summary_message_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('chat_sessions', sa.Column('session_data', postgresql.JSONB(), nullable=True, server_default='{}'))

    # ChatMessage enhancements
    op.add_column('chat_messages', sa.Column('token_count', sa.Integer(), nullable=True))
    op.add_column('chat_messages', sa.Column('model_used', sa.String(100), nullable=True))
    op.add_column('chat_messages', sa.Column('latency_ms', sa.Float(), nullable=True))
    op.add_column('chat_messages', sa.Column('request_id', sa.String(100), nullable=True))
    op.add_column('chat_messages', sa.Column('message_data', postgresql.JSONB(), nullable=True, server_default='{}'))

    # New indexes
    op.create_index('idx_chat_sessions_user_archived', 'chat_sessions', ['user_id', 'is_archived', 'deleted_at'])
    op.create_index('idx_chat_sessions_user_pinned', 'chat_sessions', ['user_id', sa.text('is_pinned DESC'), sa.text('updated_at DESC')])
    op.create_index('idx_chat_messages_session_created', 'chat_messages', ['session_id', 'created_at'])
    op.create_index('idx_chat_messages_request_id', 'chat_messages', ['request_id'], postgresql_where=sa.text('request_id IS NOT NULL'))


def downgrade():
    op.drop_index('idx_chat_messages_request_id')
    op.drop_index('idx_chat_messages_session_created')
    op.drop_index('idx_chat_sessions_user_pinned')
    op.drop_index('idx_chat_sessions_user_archived')
    op.drop_column('chat_messages', 'message_data')
    op.drop_column('chat_messages', 'request_id')
    op.drop_column('chat_messages', 'latency_ms')
    op.drop_column('chat_messages', 'model_used')
    op.drop_column('chat_messages', 'token_count')
    op.drop_column('chat_sessions', 'session_data')
    op.drop_column('chat_sessions', 'summary_message_count')
    op.drop_column('chat_sessions', 'summary_updated_at')
    op.drop_column('chat_sessions', 'summary')
    op.drop_column('chat_sessions', 'pinned_at')
    op.drop_column('chat_sessions', 'is_pinned')
    op.drop_column('chat_sessions', 'archived_at')
    op.drop_column('chat_sessions', 'is_archived')
```

---

## 10. API Design

### 10.1 Modified Endpoints

#### `POST /v1/chat/sessions/{session_id}/messages` (ENHANCED)

**Changes from current:**
- Auto-generates title on first message
- Triggers summarization when threshold exceeded
- Extracts facts periodically
- Stores AI metadata on assistant message
- Updates session metadata (counts, costs)
- Returns full message objects with metadata

**Request body:** Unchanged `[{role, content}]`

**Response 201:** Enhanced with metadata on assistant messages:

```json
[
  {
    "id": "uuid",
    "session_id": "uuid",
    "role": "user",
    "content": "I want to transition to ML",
    "created_at": "2026-07-22T10:00:05Z"
  },
  {
    "id": "uuid",
    "session_id": "uuid",
    "role": "assistant",
    "content": "Based on your profile...",
    "created_at": "2026-07-22T10:00:12Z",
    "token_count": 1170,
    "model_used": "gpt-5",
    "latency_ms": 2340.5,
    "request_id": "uuid",
    "message_data": {
      "finish_reason": "stop",
      "temperature": 0.7,
      "prompt_tokens": 850,
      "completion_tokens": 320
    }
  }
]
```

**New behavior:**
- `message_count` in session incremented atomically
- If first message and title is null → title generation runs (result applied asynchronously or synchronously — design choice: **synchronously with a 3s timeout**, fallback to truncated message if timeout)
- If `message_count > summary_threshold` and summary is stale → summarization runs synchronously before AI response (to include summary in context)
- If `message_count % fact_extraction_interval == 0` → fact extraction runs after AI response (non-blocking)

---

#### `GET /v1/chat/sessions` (ENHANCED)

**New query parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | null | Full-text search on title + first user message |
| `is_archived` | bool | No | `false` | Filter archived sessions |
| `sort` | string | No | `"updated"` | Sort: `"updated"`, `"created"`, `"title"` |
| `page` | int | No | `1` | Page number |
| `page_size` | int | No | `20` | Items per page |

**Response:** Same structure, but sessions include `is_pinned`, `is_archived`, and `session_data.message_count`.

---

### 10.2 New Endpoints

#### `PATCH /v1/chat/sessions/{session_id}`

**Purpose:** Update session properties (title, pin state, archive state)

**Auth required:** Yes

**Request body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | No | Max 500 chars, non-empty if provided |
| `is_archived` | bool | No | |
| `is_pinned` | bool | No | |

**Response 200:** Updated session object

**Errors:** 401, 404

**Note:** This replaces the need for separate pin/unpin/archive/restore endpoints. A single PATCH handles all session metadata updates. Validation ensures only valid combinations:
- Can't pin an archived session
- Can't archive a pinned session (unpin first)

---

#### `POST /v1/chat/sessions/{session_id}/messages/{message_id}/regenerate`

**Purpose:** Regenerate an AI assistant response

**Auth required:** Yes

**Request body:** None

**Response 200:**

```json
{
  "original_message_id": "uuid",
  "new_message": {
    "id": "new-uuid",
    "session_id": "uuid",
    "role": "assistant",
    "content": "Regenerated response...",
    "created_at": "2026-07-22T10:05:00Z",
    "token_count": 1100,
    "model_used": "gpt-5",
    "latency_ms": 2100.0,
    "request_id": "uuid"
  }
}
```

**Behavior:**
1. Find `message_id` (must be assistant role)
2. Find the preceding user message
3. Soft-delete the assistant message (set `deleted_at`) or hard-delete
4. Re-run chat flow
5. Return new message

**Design choice:** Hard-delete the old assistant message. The regeneration replaces it entirely. Session metadata updated to reflect new token counts (don't subtract old, just add new — historical accuracy of total cost).

**Errors:** 401, 404 (session not found), 404 (message not found), 422 (message is not assistant role, or is the only message)

---

#### `POST /v1/chat/sessions/{session_id}/export`

**Purpose:** Export conversation in various formats

**Auth required:** Yes

**Query parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `format` | string | No | `"json"` | Export format: `"json"`, `"markdown"`, `"text"` |

**Response:** Content-Type varies by format
- `json`: `application/json`
- `markdown`: `text/markdown`
- `text`: `text/plain`

**Errors:** 401, 404

---

#### `GET /v1/chat/stats`

**Purpose:** Get conversation statistics for the authenticated user

**Auth required:** Yes

**Response 200:**

```json
{
  "total_sessions": 15,
  "active_sessions": 12,
  "archived_sessions": 3,
  "total_messages": 156,
  "user_messages": 78,
  "assistant_messages": 78,
  "total_tokens_used": 45200,
  "total_prompt_tokens": 31000,
  "total_completion_tokens": 14200,
  "estimated_total_cost_usd": 1.33,
  "average_messages_per_session": 10.4,
  "first_conversation_at": "2026-07-01T10:00:00Z",
  "last_conversation_at": "2026-07-22T14:30:00Z"
}
```

**Errors:** 401

---

#### `POST /v1/chat/sessions/{session_id}/rebuild-memory`

**Purpose:** Force-rebuild conversation summary and facts from scratch

**Auth required:** Yes

**Response 200:**

```json
{
  "message": "Memory rebuilt successfully",
  "summary": "New summary text...",
  "facts_count": 5
}
```

**Behavior:**
1. Load all messages from session
2. Clear existing summary and facts
3. Re-run summarization on all messages
4. Re-run fact extraction
5. Store results

**Errors:** 401, 404

---

### 10.3 Complete Endpoint Summary (Phase 3.2A)

| Method | Path | Auth | Status | Description |
|--------|------|------|--------|-------------|
| `GET` | `/v1/chat/health` | No | Existing | Health check |
| `POST` | `/v1/chat/sessions` | Yes | **Modified** | Create session (auto-generate title on first message) |
| `GET` | `/v1/chat/sessions` | Yes | **Modified** | List sessions (add search, archive filter, sort) |
| `GET` | `/v1/chat/sessions/{id}` | Yes | **Modified** | Get session (include metadata, summary) |
| `PATCH` | `/v1/chat/sessions/{id}` | Yes | **NEW** | Update title, pin, archive |
| `DELETE` | `/v1/chat/sessions/{id}` | Yes | Existing | Delete session |
| `POST` | `/v1/chat/sessions/{id}/messages` | Yes | **Modified** | Send message (auto-title, summarize, facts, metadata) |
| `POST` | `/v1/chat/sessions/{id}/messages/{msg_id}/regenerate` | Yes | **NEW** | Regenerate AI response |
| `POST` | `/v1/chat/sessions/{id}/export` | Yes | **NEW** | Export conversation |
| `POST` | `/v1/chat/sessions/{id}/rebuild-memory` | Yes | **NEW** | Rebuild summary + facts |
| `GET` | `/v1/chat/stats` | Yes | **NEW** | Conversation statistics |

**Total: 11 endpoints** (9 existing/modified + 2 new)

---

## 11. Frontend Integration

### 11.1 How HalfPanda Should Use Every Endpoint

#### Chat List Screen

```
1. On mount: GET /v1/chat/sessions?is_archived=false&page=1&page_size=20
2. Display sessions as cards with:
   - Title (or "New Chat" if null)
   - Message count from session_data.message_count
   - Last message timestamp
   - Pin icon if is_pinned
   - Archive icon
3. Search bar: debounced (300ms) → GET /v1/chat/sessions?search={query}
4. Tab filter: "All" | "Pinned" | "Archived"
   - Pinned: GET /v1/chat/sessions?is_archived=false (sort already puts pinned first)
   - Archived: GET /v1/chat/sessions?is_archived=true
5. Infinite scroll or pagination for sessions
6. Stats bar at top: GET /v1/chat/stats (cached, refresh every 5 min)
```

#### Chat Conversation Screen

```
1. On session load: GET /v1/chat/sessions/{id}
   - Returns session + all messages
   - Display messages in chronological order
   - User messages: right-aligned bubble
   - Assistant messages: left-aligned, rendered Markdown
2. Scroll to bottom on new messages
3. Loading state: spinner on assistant message bubble while waiting
```

#### Sending a Message

```
1. User types message, hits Enter
2. Optimistic update: immediately show user message in chat
3. Show "thinking..." indicator for assistant
4. POST /v1/chat/sessions/{id}/messages with [{role: "user", content: "..."}]
5. On success: replace "thinking..." with actual assistant response
6. On error: show error toast, remove optimistic user message
7. If session title was null, UI may auto-refresh session list to show new title
```

#### Regenerating a Response

```
1. User clicks "regenerate" icon on assistant message
2. POST /v1/chat/sessions/{id}/messages/{msg_id}/regenerate
3. Show spinner on that message bubble
4. On success: replace message content with new response
5. On error: show toast, keep original message
```

#### Pinning/Archiving

```
1. Swipe or context menu on session card → "Pin" / "Archive"
2. PATCH /v1/chat/sessions/{id} with {is_pinned: true} or {is_archived: true}
3. Optimistic update: move session card to appropriate section
4. On error: revert optimistic update, show toast
```

#### Export

```
1. Context menu → "Export"
2. Show format picker: JSON / Markdown / Text
3. POST /v1/chat/sessions/{id}/export?format={format}
4. Download as file (use Blob + URL.createObjectURL)
```

### 11.2 Loading States

| State | UI |
|-------|-----|
| Session list loading | Skeleton cards (3-5 placeholder rows) |
| Messages loading | Skeleton message bubbles (alternating left/right) |
| Message sending | User message appears immediately + assistant bubble with dots animation |
| Title generating | Small spinner next to session title |
| Regenerating | Dots animation on specific message bubble |
| Export downloading | Download button shows spinner |

### 11.3 Caching Strategy

| Data | Cache Duration | Invalidation |
|------|---------------|--------------|
| Session list | 30s | On any session mutation (pin, archive, delete, new message) |
| Session messages | No cache | Always fetch fresh (messages are small, consistency critical) |
| Stats | 5 min | On any message send |
| Prompt list | 5 min (matches server TTL) | On admin prompt edit (future) |

### 11.4 Optimistic Updates

| Action | Optimistic? | Rollback on error? |
|--------|-------------|-------------------|
| Send message | Yes (show user msg immediately) | Yes (remove message) |
| Delete session | Yes (remove from list) | Yes (re-add) |
| Pin/Unpin | Yes (move in list) | Yes (revert) |
| Archive | Yes (remove from active) | Yes (re-add) |
| Rename | Yes (update title) | Yes (revert) |
| Regenerate | No (wait for response) | N/A |

### 11.5 Error Handling

| Error | Frontend Action |
|-------|----------------|
| 401 | Redirect to login |
| 404 | Show "Session not found", remove from list |
| 429 | Show "Too many messages. Please wait X seconds." with countdown |
| 503 | Show "AI is temporarily unavailable. Your message was saved." |
| 500 | Show "Something went wrong. Please try again." with retry button |
| Network error | Show "Connection lost. Retrying..." with auto-retry (3 attempts) |

### 11.6 Retry Strategy

- **Send message:** Auto-retry 2x on 5xx/network errors, then show retry button
- **Regenerate:** No auto-retry, show retry button on failure
- **Session list:** Auto-retry 1x on network error
- **Export:** Auto-retry 1x, then show error

---

## 12. Architecture Diagrams

### 12.1 Conversation Lifecycle

```
┌──────────┐     create      ┌──────────┐
│  (none)  │ ──────────────> │  ACTIVE  │
└──────────┘                 └────┬─────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                 archive       delete       rename/pin
                    │             │             │
                    ▼             ▼             ▼
              ┌──────────┐ ┌──────────┐  (in-place update)
              │ ARCHIVED │ │ DELETED  │
              └────┬─────┘ └────┬─────┘
                   │             │
                restore      retention
                   │          policy
                   ▼             ▼
              ┌──────────┐  (hard delete)
              │  ACTIVE  │
              └──────────┘
```

### 12.2 Memory Lifecycle

```
User sends message
       │
       ▼
┌─────────────────────────────────────┐
│ Load from DB:                       │
│   session.summary (if exists)       │
│   last N messages                   │
│   session.session_data.facts        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Summarization check:                │
│   msg_count > threshold?            │
│   YES → summarize delta → update DB │
│   NO  → use existing summary        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Fact extraction check:              │
│   msg_count % interval == 0?        │
│   YES → extract facts → update DB   │
│   NO  → use existing facts          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Assemble context:                   │
│   [system_prompt]                   │
│   [profile]                         │
│   [facts]                           │
│   [summary]                         │
│   [recent_messages]                 │
│   [portfolio, rec, roadmap, backup] │
│   [user_message]                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Token budget check:                 │
│   total > budget?                   │
│   YES → trim lowest priority items  │
│   NO  → proceed as-is               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Send to AI via AIClient             │
│ (retry, rate limit, token tracking) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Store response + metadata in DB     │
│ Update session.session_data         │
└─────────────────────────────────────┘
```

### 12.3 Prompt Loading Flow

```
┌────────────┐
│ PromptCache │ (TTL = 300s)
└──────┬─────┘
       │ get(name)
       ▼
┌──────────────┐     cache miss     ┌──────────────┐
│ Cache check  │ ──────────────────> │ PromptLoader │
│ (TTL valid?) │                     │ read .md file│
└──────┬───────┘                     └──────┬───────┘
       │ cache hit                          │
       ▼                                    ▼
┌──────────────┐                     ┌──────────────┐
│ Return cached│                     │ Parse YAML   │
│ content      │                     │ frontmatter  │
└──────────────┘                     └──────┬───────┘
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │ Store in cache│
                                     │ with version  │
                                     └──────┬───────┘
                                            │
                                            ▼
                                     ┌──────────────┐
                                     │ Return content│
                                     └──────────────┘

render(name, variables):
  get(name) → replace {{var}} placeholders → return rendered string
```

### 12.4 Chat Request Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      CHAT REQUEST FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend                                                    │
│    │                                                         │
│    │ POST /v1/chat/sessions/{id}/messages                    │
│    │ [{role: "user", content: "..." }]                       │
│    ▼                                                         │
│  API Layer (chat.py)                                        │
│    │                                                         │
│    │ 1. Validate input                                       │
│    │ 2. Verify session ownership                             │
│    │ 3. Store user message in DB                             │
│    │ 4. Update session metadata                              │
│    ▼                                                         │
│  ConversationManager                                        │
│    │                                                         │
│    │ 5. Check title generation needed                        │
│    │ 6. Check summarization needed                           │
│    │ 7. Check fact extraction needed                         │
│    │ 8. Load memory (summary + recent + facts)               │
│    │ 9. Build context via ContextBuilder                     │
│    ▼                                                         │
│  ContextBuilder                                             │
│    │                                                         │
│    │ 10. Load system prompt                                  │
│    │ 11. Load user profile                                   │
│    │ 12. Inject facts                                        │
│    │ 13. Inject summary                                      │
│    │ 14. Inject recent messages                              │
│    │ 15. Inject lower-priority context                       │
│    │ 16. Apply token budget trimming                         │
│    ▼                                                         │
│  AIClient                                                   │
│    │                                                         │
│    │ 17. Rate limit check                                    │
│    │ 18. Build AIRequest                                     │
│    │ 19. retry_with_backoff(provider.complete, request)      │
│    ▼                                                         │
│  AzureFoundryProvider                                        │
│    │                                                         │
│    │ 20. HTTP POST to Azure OpenAI                           │
│    │ 21. Parse response                                      │
│    │ 22. Build AIResponse with token usage                   │
│    ▼                                                         │
│  Back to Chat Layer                                         │
│    │                                                         │
│    │ 23. Store assistant message + metadata                  │
│    │ 24. Update session metadata (tokens, cost)              │
│    │ 25. Return [user_msg, assistant_msg] to frontend        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 12.5 Summarization Flow

```
                   message_count > threshold?
                          │
                    YES ──┤── NO ──> use existing summary (or none)
                    │
                    ▼
            summary_message_count == 0?
              │                │
          YES │                │ NO
              ▼                ▼
     Full summarization   Delta summarization
     of messages          of messages since
     [0..N-keep]          last summary
              │                │
              ▼                ▼
     Store in session.    Merge with existing
     summary              summary via AI
              │                │
              └───────┬────────┘
                      ▼
              Validate summary
              (length, non-empty, unique)
                      │
              pass ──┤── fail ──> keep existing, log warning
              │
              ▼
     Update session.summary
     Update session.summary_updated_at
     Update session.summary_message_count
```

---

## 13. Testing Strategy

### 13.1 Unit Tests

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `test_conversation_manager.py` | Session loading, memory building, title generation, message storage | ~20 tests |
| `test_context_builder.py` | Profile loading, portfolio loading, context assembly, token estimation, budget trimming | ~15 tests |
| `test_memory.py` | Add message, trim, needs_summarization, build_messages_for_ai, clear | ~10 tests |
| `test_summarizer.py` | Summarize messages, fallback on failure, empty input, incremental summary | ~8 tests |
| `test_prompt_loader.py` | Load prompt, render variables, list prompts, missing prompt, cache invalidation | ~12 tests |
| `test_chat_service_enhanced.py` | Enhanced CRUD, search, archive, pin, metadata updates | ~15 tests |

### 13.2 Integration Tests

| Test | Description |
|------|-------------|
| Full chat flow | Create session → send message → verify AI response stored → verify metadata updated |
| Title generation | Create titleless session → send first message → verify title auto-generated |
| Summarization trigger | Send 25 messages → verify summary created and stored |
| Fact extraction | Send 5 messages with factual content → verify facts extracted |
| Memory rebuild | Create session with messages → rebuild → verify summary regenerated |
| Search | Create sessions with different titles → search → verify correct results |
| Pin/Archive | Pin session → verify sort order → archive → verify hidden from default list |
| Export | Create session with messages → export as JSON/Markdown/Text → verify content |
| Regeneration | Send message → regenerate → verify old message deleted, new one stored |

### 13.3 Load Tests

| Test | Description |
|------|-------------|
| Concurrent users | 50 concurrent users sending messages simultaneously |
| Large conversations | Session with 500+ messages → verify performance |
| Many sessions | User with 100 sessions → verify list pagination performance |
| Context assembly | Measure ContextBuilder.build_context() latency with full data |

### 13.4 Regression Tests

| Test | Description |
|------|-------------|
| Existing tests pass | All 116 existing tests continue to pass after changes |
| API backward compatibility | Existing frontend calls still work (additive changes only) |
| Migration rollback | Test `downgrade()` restores original schema |

### 13.5 Conversation-Specific Tests

| Test | Description |
|------|-------------|
| Concurrent message send | Two messages sent rapidly to same session → both stored, no race condition |
| Session deletion mid-conversation | Delete session while AI is processing → graceful error |
| Token budget overflow | Context exceeds model limits → trimming produces valid request |
| AI failure handling | AI returns error → user message still stored, error propagated |
| Empty profile | User with no profile → context builder handles gracefully |
| Summary corruption | Corrupted summary → rebuild-memory restores correctly |

### 13.6 API Tests

Every new/modified endpoint gets tests for:
- Happy path (200/201)
- Authentication (401)
- Not found (404)
- Validation errors (422)
- Rate limiting (429)
- Edge cases (empty content, max length, special characters)

---

## 14. Documentation Plan

### 14.1 Files to Create/Update

| File | Action | Content |
|------|--------|---------|
| `docs/CONVERSATION_PLATFORM.md` | **Create** | Architecture overview, design decisions, how all pieces connect |
| `docs/API_REFERENCE.md` | **Update** | Add all new/modified endpoints with full schemas |
| `docs/CHAT_API_GUIDE.md` | **Create** | Frontend integration guide with sequences, examples, error handling |
| `docs/PROMPT_AUTHORING_GUIDE.md` | **Create** | How to write, test, and version prompt templates |
| `docs/DATABASE_SCHEMA.md` | **Create** | Complete schema reference with all tables, columns, indexes, relationships |
| `docs/AI_PLATFORM_GUIDE.md` | **Update** | Add conversation platform sections |
| `docs/DEPLOYMENT_NOTES.md` | **Create** | Azure deployment specifics, migration steps, rollback procedures |

### 14.2 Document Structures

**CONVERSATION_PLATFORM.md:**
```
1. Overview
2. Architecture
   - Component diagram
   - Data flow
   - Key design decisions
3. Conversation Lifecycle
   - States and transitions
   - Metadata structure
   - Title generation
4. Memory System
   - Summarization
   - Fact extraction
   - Token budgeting
5. Context Builder
   - Priority order
   - Budget allocation
   - Trimming strategy
6. Prompt System
   - File structure
   - Variables
   - Versioning
7. API Reference (quick link to full docs)
8. Frontend Integration (quick link to guide)
9. Configuration Reference
10. Troubleshooting
```

**CHAT_API_GUIDE.md:**
```
1. Getting Started
2. Authentication
3. Session Management (create, list, get, update, delete)
4. Sending Messages
5. Message Regeneration
6. Search and Filtering
7. Pinning and Archiving
8. Export
9. Statistics
10. Error Handling
11. Rate Limits
12. Code Examples (curl, JavaScript, Python)
```

---

## 15. Implementation Roadmap

### Milestone 1: Database Schema Enhancement

**Objectives:**
- Add all new columns to ChatSession and ChatMessage
- Create new indexes
- Verify migration runs cleanly
- Verify all 116 existing tests still pass

**Files affected:**
- `alembic/versions/<new_migration>.py` (create)
- `app/models/chat.py` (modify)
- `app/models/enums.py` (no changes needed)
- `app/schemas/chat.py` (modify)

**Estimated complexity:** Low-Medium (2-3 hours)
**Dependencies:** None
**Testing requirements:**
- Run migration forward and backward
- Run all existing tests
- Verify new columns are accessible via SQLAlchemy

**Verification checklist:**
- [ ] Migration runs without errors
- [ ] `alembic downgrade` restores original schema
- [ ] ChatSession model has all new fields
- [ ] ChatMessage model has all new fields
- [ ] New indexes created
- [ ] All 116 existing tests pass
- [ ] `alembic current` shows correct revision

**Commit:** `feat(db): enhance ChatSession and ChatMessage schemas for conversation platform`

---

### Milestone 2: Session Management Enhancement

**Objectives:**
- Implement PATCH endpoint for session updates (title, pin, archive)
- Implement search in session list
- Implement sort by pin status
- Update session metadata after each message

**Files affected:**
- `app/api/v1/chat.py` (modify — add PATCH endpoint, enhance GET list)
- `app/schemas/chat.py` (modify — add update schema, search params)
- `app/services/chat_service.py` (modify — add update, search, metadata update)
- `app/models/chat.py` (modify — if not done in Milestone 1)

**Estimated complexity:** Medium (3-4 hours)
**Dependencies:** Milestone 1
**Testing requirements:**
- Unit tests for update logic
- Integration tests for search, pin, archive
- API tests for new endpoint

**Verification checklist:**
- [ ] PATCH /v1/chat/sessions/{id} works for title, pin, archive
- [ ] Cannot pin archived session
- [ ] Cannot archive pinned session
- [ ] Search returns correct results
- [ ] Pinned sessions sort first
- [ ] Archived sessions excluded from default list
- [ ] Session metadata updated after message send
- [ ] All existing tests pass

**Commit:** `feat(chat): enhance session management with search, pin, archive, and metadata`

---

### Milestone 3: Conversation Memory System

**Objectives:**
- Implement persistent summary storage and incremental summarization
- Implement fact extraction
- Rewrite ConversationManager to use persistent memory
- Add rebuild-memory endpoint

**Files affected:**
- `app/services/ai/conversation_manager.py` (major rewrite)
- `app/services/ai/memory.py` (enhance)
- `app/services/ai/summarizer.py` (enhance)
- `app/services/ai/fact_extractor.py` (create)
- `app/api/v1/chat.py` (add rebuild-memory endpoint)
- `app/schemas/chat.py` (add rebuild response schema)
- `app/core/config.py` (add memory-related settings)

**Estimated complexity:** High (6-8 hours)
**Dependencies:** Milestone 1, Milestone 2
**Testing requirements:**
- Unit tests for all memory classes
- Integration tests for summarization trigger
- Integration tests for fact extraction
- Test rebuild-memory endpoint
- Test edge cases (empty sessions, very long conversations)

**Verification checklist:**
- [ ] Summary stored in DB after threshold exceeded
- [ ] Incremental summarization works (delta only)
- [ ] Facts extracted periodically
- [ ] Facts stored in session_data JSONB
- [ ] Context uses stored summary (not recomputed)
- [ ] Rebuild-memory endpoint works
- [ ] Memory handles edge cases (empty, corrupted)
- [ ] All existing tests pass

**Commit:** `feat(memory): implement persistent conversation memory with incremental summarization and fact extraction`

---

### Milestone 4: Context Builder Enhancement

**Objectives:**
- Rewrite ContextBuilder with priority-based assembly and token budgeting
- Integrate facts and summary into context
- Implement trimming strategy
- Add token estimation

**Files affected:**
- `app/services/ai/context_builder.py` (major rewrite)
- `app/core/config.py` (add budget settings)
- `app/services/ai/conversation_manager.py` (update to use new ContextBuilder)

**Estimated complexity:** Medium-High (4-6 hours)
**Dependencies:** Milestone 3
**Testing requirements:**
- Unit tests for token estimation
- Unit tests for priority ordering
- Unit tests for budget trimming
- Integration test: full context assembly with all data types
- Integration test: context respects token budget

**Verification checklist:**
- [ ] System prompt always included
- [ ] Profile always included (if exists)
- [ ] Facts injected into context
- [ ] Summary injected into context
- [ ] Recent messages included within budget
- [ ] Lower-priority items trimmed when budget exceeded
- [ ] Minimum 4 recent messages always kept
- [ ] Token estimation is reasonable (within 20% of actual)
- [ ] All existing tests pass

**Commit:** `feat(context): implement priority-based context assembly with token budgeting`

---

### Milestone 5: Title Generation & Enhanced Message Flow

**Objectives:**
- Implement auto-title generation
- Enhance POST /v1/chat/sessions/{id}/messages with full flow
- Implement message regeneration
- Store AI metadata on assistant messages

**Files affected:**
- `app/api/v1/chat.py` (major modify — enhance message flow, add regenerate endpoint)
- `app/services/chat_service.py` (modify — add regenerate, title generation)
- `app/services/ai/conversation_manager.py` (add title generation)
- `app/prompts/title_generation.md` (create)
- `app/schemas/chat.py` (add regenerate response, enhance message response)

**Estimated complexity:** High (6-8 hours)
**Dependencies:** Milestone 2, Milestone 3, Milestone 4
**Testing requirements:**
- Unit tests for title generation
- Integration test: first message triggers title generation
- Integration test: regenerate replaces assistant message
- Integration test: metadata stored on assistant messages
- Test title generation fallback on AI failure

**Verification checklist:**
- [ ] First message to titleless session generates title
- [ ] Title fallback works on AI failure
- [ ] Renaming sets title_auto_generated = false
- [ ] Assistant messages have token_count, model_used, latency_ms
- [ ] Regenerate deletes old message, stores new one
- [ ] Session metadata updated after each message exchange
- [ ] All existing tests pass

**Commit:** `feat(chat): implement title generation, message regeneration, and AI metadata tracking`

---

### Milestone 6: Prompt System Enhancement

**Objectives:**
- Add variable rendering to prompt system
- Add YAML frontmatter parsing
- Add prompt metadata/debugging endpoint
- Create new prompt files (title_generation, summarization, fact_extraction)
- Add prompt testing endpoint

**Files affected:**
- `app/services/ai/prompt_loader.py` (enhance — add render, frontmatter parsing)
- `app/services/ai/prompt_cache.py` (enhance — add rendered cache)
- `app/prompts/title_generation.md` (create — if not created in Milestone 5)
- `app/prompts/summarization.md` (create)
- `app/prompts/fact_extraction.md` (create)
- `app/api/v1/ai.py` (add prompt endpoints)
- `app/schemas/ai.py` (create — prompt metadata schemas)
- `app/core/config.py` (add prompt-related settings)

**Estimated complexity:** Medium (3-4 hours)
**Dependencies:** Milestone 1 (for config settings)
**Testing requirements:**
- Unit tests for render with variables
- Unit tests for frontmatter parsing
- Unit tests for missing/unknown variables
- Integration test: prompt endpoints return correct metadata

**Verification checklist:**
- [ ] `render("chat", {"user_name": "Jane"})` replaces `{{user_name}}`
- [ ] Unknown variables don't cause errors
- [ ] YAML frontmatter parsed correctly
- [ ] Prompt metadata endpoint returns all prompts with stats
- [ ] Prompt test endpoint renders and returns output
- [ ] New prompt files load correctly
- [ ] All existing tests pass

**Commit:** `feat(prompts): add variable rendering, frontmatter, and debugging endpoints`

---

### Milestone 7: Export & Statistics

**Objectives:**
- Implement conversation export in 3 formats
- Implement conversation statistics endpoint
- Add retention policy configuration

**Files affected:**
- `app/api/v1/chat.py` (add export and stats endpoints)
- `app/services/chat_service.py` (add export and stats logic)
- `app/schemas/chat.py` (add export/stats schemas)
- `app/core/config.py` (add retention settings)

**Estimated complexity:** Medium (3-4 hours)
**Dependencies:** Milestone 1, Milestone 2
**Testing requirements:**
- Unit tests for export formatters
- Integration test: export returns correct format
- Integration test: stats aggregation
- Edge case: empty session export

**Verification checklist:**
- [ ] JSON export includes all messages with metadata
- [ ] Markdown export is human-readable
- [ ] Text export is plain text
- [ ] Stats aggregate correctly
- [ ] Stats handle empty sessions
- [ ] Retention settings loaded from config
- [ ] All existing tests pass

**Commit:** `feat(chat): implement conversation export and statistics`

---

### Milestone 8: Tests, Documentation, Final Integration

**Objectives:**
- Write all remaining tests
- Write all documentation
- Full integration testing
- Performance verification
- Final cleanup

**Files affected:**
- `tests/test_conversation_platform.py` (create — integration tests)
- `tests/test_context_builder.py` (create)
- `tests/test_memory.py` (create)
- `docs/CONVERSATION_PLATFORM.md` (create)
- `docs/CHAT_API_GUIDE.md` (create)
- `docs/PROMPT_AUTHORING_GUIDE.md` (create)
- `docs/DATABASE_SCHEMA.md` (create)
- `docs/API_REFERENCE.md` (update)

**Estimated complexity:** High (6-8 hours)
**Dependencies:** All previous milestones
**Testing requirements:**
- Run full test suite
- Verify no regressions
- Load test with realistic data

**Verification checklist:**
- [ ] All unit tests written and passing
- [ ] All integration tests written and passing
- [ ] All existing 116 tests still pass
- [ ] Documentation complete and accurate
- [ ] API reference updated with all new endpoints
- [ ] No TODO/FIXME comments left in code
- [ ] Code follows existing style conventions
- [ ] Migration rollback tested

**Commit:** `docs: Phase 3.2A complete - conversation platform tests and documentation`

---

### Milestone Summary

| Milestone | Name | Complexity | Hours | Dependencies |
|-----------|------|-----------|-------|-------------|
| 1 | Database Schema | Low-Med | 2-3 | None |
| 2 | Session Management | Medium | 3-4 | M1 |
| 3 | Memory System | High | 6-8 | M1, M2 |
| 4 | Context Builder | Med-High | 4-6 | M3 |
| 5 | Title Gen & Message Flow | High | 6-8 | M2, M3, M4 |
| 6 | Prompt System | Medium | 3-4 | M1 |
| 7 | Export & Statistics | Medium | 3-4 | M1, M2 |
| 8 | Tests & Docs | High | 6-8 | All |
| **Total** | | | **33-45h** | |

**Recommended execution order:** M1 → M6 → M2 → M7 → M3 → M4 → M5 → M8

This order allows M6 (prompts) and M7 (export/stats) to be done in parallel with the core conversation work (M3-M5) since they're less interdependent.

---

### Configuration Reference (New Settings)

```python
# Conversation retention
AI_CONVERSATION_RETENTION_DAYS: int = 90
AI_CONVERSATION_ARCHIVE_AFTER_DAYS: int = 30
AI_MAX_CONVERSATIONS_PER_USER: int = 100

# Title generation
AI_TITLE_GENERATION_ENABLED: bool = True
AI_TITLE_GENERATION_TIMEOUT: float = 3.0
AI_TITLE_MAX_LENGTH: int = 80

# Memory
AI_MAX_SUMMARY_LENGTH: int = 2000
AI_FACT_EXTRACTION_INTERVAL: int = 5  # every N user messages

# Context budget
AI_CONTEXT_BUDGET_SYSTEM_PCT: float = 0.15
AI_CONTEXT_BUDGET_SUMMARY_PCT: float = 0.10
AI_CONTEXT_BUDGET_FACTS_PCT: float = 0.05
AI_CONTEXT_BUDGET_MESSAGES_PCT: float = 0.50
AI_CONTEXT_BUDGET_RESPONSE_PCT: float = 0.20
AI_MIN_RECENT_MESSAGES: int = 4

# Prompt system
AI_PROMPT_CACHE_TTL: float = 300.0
AI_PROMPT_DEBUG_ENABLED: bool = True
```

---

*End of Phase 3.2A Design Specification*
