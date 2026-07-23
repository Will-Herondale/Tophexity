# AI Platform Guide - Phase 3.1

## Architecture Overview

```
app/
├── services/
│   └── ai/
│       ├── __init__.py              # Public API exports
│       ├── client.py                # AIClient - single interface for all AI operations
│       ├── provider.py              # Abstract AI provider interface
│       ├── azure_foundry.py         # Azure OpenAI / Foundry implementation
│       ├── context_builder.py       # Builds user context for AI requests
│       ├── conversation_manager.py  # Conversation lifecycle management
│       ├── memory.py                # Working memory window for conversations
│       ├── summarizer.py            # Automatic conversation summarization
│       ├── prompt_loader.py         # Load external prompt files
│       ├── prompt_cache.py          # In-memory prompt cache with TTL
│       ├── response_parser.py       # Parse AI responses, extract JSON
│       ├── json_validator.py        # Validate JSON against Pydantic models
│       ├── retry.py                 # Exponential backoff retry logic
│       ├── rate_limiter.py          # Backend-side rate limiting
│       ├── token_usage.py           # Token tracking and cost estimation
│       ├── health.py                # AI health check logic
│       ├── exceptions.py            # AI-specific exceptions
│       └── models.py                # AI data models (AIRequest, AIResponse, etc.)
└── prompts/
    ├── system.md                    # Base system prompt
    ├── chat.md                      # Chat conversation prompt
    ├── recommendation.md            # Career recommendation prompt
    ├── roadmap.md                   # Learning roadmap prompt
    └── backup.md                    # Backup plan prompt
```

**Key Principle:** Only `AIClient` communicates with Azure AI. Nothing else directly calls Azure.

---

## Conversation Lifecycle

1. **Create Session** → `POST /v1/chat/sessions` → Creates a `ChatSession` in the database
2. **Send Message** → `POST /v1/chat/sessions/{id}/messages` → Stores user message, builds context, calls AI, stores response
3. **Resume Session** → `GET /v1/chat/sessions/{id}` → Loads session with all messages
4. **List Sessions** → `GET /v1/chat/sessions` → Paginated list of user's sessions
5. **Delete Session** → `DELETE /v1/chat/sessions/{id}` → Cascading delete of session and messages

---

## Memory Management

The AI platform maintains conversation memory using the `ConversationMemory` class:

- **Recent Messages:** The last N messages (configurable via `AI_MAX_CONTEXT_MESSAGES`, default 50)
- **Summarization:** When messages exceed `AI_SUMMARY_THRESHOLD_MESSAGES` (default 20), older messages are summarized and replaced
- **Summary Injection:** Summaries are included as system messages in the AI context

### How summarization works:

```
Messages exceed threshold
    ↓
Messages[:-keep_recent] → Summarize via AI → Store summary
    ↓
Messages[-keep_recent:] → Keep as recent context
    ↓
Next AI request includes: [system prompt] + [summary] + [recent messages]
```

---

## Context Building

Every AI request automatically constructs context via `ContextBuilder`:

1. **User Profile** - Full name, headline, bio, skills, interests, experience
2. **Portfolio** - All portfolio items with types and skills
3. **Latest Recommendation** - Most recent career recommendation with items
4. **Latest Roadmap** - Most recent learning roadmap with steps
5. **Latest Backup Plan** - Most recent backup plan with scenarios

This context is injected into the system prompt so the AI always has current user data.

---

## Prompt System

All prompts are external Markdown files in `app/prompts/`:

| File | Purpose |
|---|---|
| `system.md` | Base system prompt for all AI interactions |
| `chat.md` | Chat-specific conversation guidelines |
| `recommendation.md` | JSON output format for career recommendations |
| `roadmap.md` | JSON output format for learning roadmaps |
| `backup.md` | JSON output format for backup plans |

### How prompts work:

1. `PromptLoader` reads `.md` files from disk
2. `PromptCache` caches them in memory (5-minute TTL)
3. `ContextBuilder.build_system_prompt()` combines base prompt + user context
4. `ConversationManager` assembles the final message list

### To update a prompt:
- Edit the `.md` file in `app/prompts/`
- Cache auto-refreshes after TTL (or call `prompt_cache.clear()`)

---

## Rate Limiting

Backend-side rate limiting protects Azure AI API usage:

| Scope | Default Limit | Window |
|---|---|---|
| Per user per minute | 10 requests | 60s |
| Per user per hour | 200 requests | 3600s |
| Per IP per minute | 30 requests | 60s |
| Per conversation per minute | 15 requests | 60s |

### Configuration:
All limits are configurable via environment variables:
```
AI_RATE_LIMIT_PER_USER_PER_MINUTE=10
AI_RATE_LIMIT_PER_HOUR=200
AI_RATE_LIMIT_PER_IP_PER_MINUTE=30
AI_RATE_LIMIT_PER_CONVERSATION_PER_MINUTE=15
```

### Behavior:
- Returns HTTP 429 with `Retry-After` header when exceeded
- Rate limits only apply to AI endpoints, not normal backend APIs
- Rate limit violations are logged

---

## Retry Strategy

Automatic retry with exponential backoff for transient failures:

- **Retryable errors:** Timeout, 429, 500, 502, 503, 504, connection errors
- **Non-retryable errors:** 400, 401, 403, 404, validation errors
- **Backoff:** Base delay × 2^attempt, capped at `AI_RETRY_MAX_DELAY` (30s)
- **Jitter:** Random 25% added to prevent thundering herd
- **Configurable:** `AI_MAX_RETRIES` (default 3), `AI_RETRY_BASE_DELAY` (1s)

---

## Token Tracking

Every AI request tracks:
- **Prompt tokens** - Input tokens consumed
- **Completion tokens** - Output tokens generated
- **Total tokens** - Sum of above
- **Estimated cost** - USD estimate based on model pricing
- **Latency** - Round-trip time in milliseconds
- **Model** - Which model handled the request
- **Request ID** - Unique identifier for tracing

All metrics are logged and stored in-memory (extendable to database persistence).

### Logging policy:
- **Logs:** Latency, retry count, model, tokens, conversation ID, user ID, status
- **Never logs:** API keys, personal information, complete prompts, sensitive profile data

---

## Health Check

`GET /health/ai` verifies:
- Azure connectivity
- Deployment availability
- Authentication validity
- Response latency
- Configuration status

Returns detailed diagnostics with error messages for troubleshooting.

---

## API Key Management

1. API key stored in `api_key.txt` at project root
2. On startup, `_load_api_key_into_env()` reads the file
3. Sets `AI_API_KEY` environment variable
4. Updates `.env` file for persistence
5. `api_key.txt` is in `.gitignore`
6. If missing, AI endpoints return 503 gracefully

---

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `AI_ENDPOINT` | `https://tophex.cognitiveservices.azure.com/openai/v1` | Azure OpenAI endpoint |
| `AI_API_KEY` | `""` | Azure API key |
| `AI_DEPLOYMENT_NAME` | `gpt-5` | Model deployment name |
| `AI_API_VERSION` | `2024-12-01-preview` | API version |
| `AI_MAX_RETRIES` | `3` | Max retry attempts |
| `AI_RETRY_BASE_DELAY` | `1.0` | Base delay in seconds |
| `AI_RETRY_MAX_DELAY` | `30.0` | Max delay in seconds |
| `AI_REQUEST_TIMEOUT` | `60.0` | Request timeout in seconds |
| `AI_MAX_TOKENS` | `4096` | Max completion tokens |
| `AI_TEMPERATURE` | `0.7` | Default temperature |
| `AI_SUMMARY_THRESHOLD_MESSAGES` | `20` | Messages before summarization |
| `AI_SUMMARY_KEEP_RECENT` | `10` | Recent messages to keep |
| `AI_MAX_CONTEXT_MESSAGES` | `50` | Max messages in context |

---

## Future Phase Integration

### Phase 3.2 - Recommendation Engine
Use `AIClient.generate_json()` with `recommendation.md` prompt. ContextBuilder provides profile + portfolio. Response validated against `RecommendationCreate` schema.

### Phase 3.3 - Roadmap Generation
Use `AIClient.generate_json()` with `roadmap.md` prompt. ContextBuilder provides profile + recommendation. Response validated against `RoadmapCreate` schema.

### Phase 3.4 - AI Chat
Already integrated. Chat endpoints use `ConversationManager` + `AIClient`. Extends to support streaming if needed.
