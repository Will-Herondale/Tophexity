# AI Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AI Platform                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  Client  │───▶│   API    │───▶│ Security │───▶│  Rate    │      │
│  │  Request │    │ Gateway  │    │  Layer   │    │ Limiter  │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│                                               │                     │
│                                               ▼                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │ Response │◀───│    AI    │◀───│ Context  │◀───│  Prompt  │      │
│  │Validator │    │  Engine  │    │ Builder  │    │ Manager  │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │Analytics │───▶│ Logging  │───▶│Database  │                      │
│  └──────────┘    └──────────┘    └──────────┘                      │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                      │
│  │ Circuit  │    │  Memory  │    │  Cache   │                      │
│  │ Breaker  │    │  System  │    │  Layer   │                      │
│  └──────────┘    └──────────┘    └──────────┘                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### AIClient
The core AI client manages communication with Azure OpenAI services.

- **Location**: `services/ai/client.py`
- **Responsibilities**:
  - Manage API connections
  - Handle model selection
  - Implement retry logic
  - Track usage metrics

### SecurityLayer
Protects against malicious inputs and ensures safe AI interactions.

- **Location**: `security.py`
- **Capabilities**:
  - Prompt injection detection
  - Jailbreak prevention
  - Input sanitization
  - Token abuse prevention

### RateLimiter
Controls request throughput to prevent abuse and manage costs.

- **Location**: `rate_limiter.py`
- **Features**:
  - Burst rate limiting (per second)
  - Sustained rate limiting (per minute)
  - Daily quotas
  - Per-user limits

### PromptManager
Manages versioned prompt templates and their lifecycle.

- **Location**: `prompt_manager.py`
- **Features**:
  - Version management
  - Template rendering
  - Cache management
  - A/B testing support

### ContextBuilder
Assembles conversation context within token constraints.

- **Location**: `context_builder.py`
- **Algorithm**:
  1. Calculate available tokens
  2. Prioritize recent messages
  3. Include system context
  4. Apply compression if needed

### Memory System
Manages conversation history and user preferences.

- **Location**: `memory.py`
- **Features**:
  - Short-term conversation memory
  - Long-term user preferences
  - Semantic search capabilities
  - Automatic cleanup

### Analytics
Tracks usage patterns and system performance.

- **Location**: `analytics.py`
- **Metrics**:
  - Request counts
  - Response times
  - Token usage
  - Error rates
  - User satisfaction

### CircuitBreaker
Prevents cascade failures by breaking connection to failing services.

- **Location**: `circuit_breaker.py`
- **States**:
  - CLOSED (normal operation)
  - OPEN (blocking requests)
  - HALF_OPEN (testing recovery)

## Request Flow

```
1. User Request
   └─▶ Validate authentication token
   └─▶ Parse request parameters

2. API Gateway
   └─▶ Route to appropriate handler
   └─▶ Add request metadata

3. Security Layer
   └─▶ Check prompt injection patterns
   └─▶ Detect jailbreak attempts
   └─▶ Sanitize input content
   └─▶ Block malicious requests

4. Rate Limiter
   └─▶ Check burst limits (100/sec)
   └─▶ Check sustained limits (1000/min)
   └─▶ Check daily quotas
   └─▶ Return 429 if exceeded

5. Prompt Manager
   └─▶ Load prompt template
   └─▶ Validate template version
   └─▶ Cache for reuse

6. Context Builder
   └─▶ Fetch conversation history
   └─▶ Calculate token budget
   └─▶ Assemble context window
   └─▶ Apply compression if needed

7. AI Engine
   └─▶ Check circuit breaker state
   └─▶ Call Azure OpenAI API
   └─▶ Handle streaming response
   └─▶ Track token usage

8. Response Validator
   └─▶ Check output safety
   └─▶ Validate response format
   └─▶ Scan for sensitive data
   └─▶ Block harmful content

9. Analytics
   └─▶ Record request metrics
   └─▶ Update usage counters
   └─▶ Calculate latency
   └─▶ Track cost

10. Logging
    └─▶ Write audit trail
    └─▶ Log performance data
    └─▶ Store error details

11. Database
    └─▶ Save conversation
    └─▶ Update user stats
    └─▶ Persist analytics
```

## Data Flow Diagrams

### Request Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Request Pipeline                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Input         Processing       Output                  │
│  ─────────    ─────────────    ──────────────────       │
│                                                         │
│  user_msg ──▶ Security ──▶ sanitized_msg               │
│                                                         │
│  sanitized  ──▶ Context  ──▶ enriched_prompt            │
│  + history      Builder                                   │
│                                                         │
│  prompt ──────▶ AI API ──▶ raw_response                 │
│                                                         │
│  raw_resp ───▶ Validator ──▶ safe_response              │
│                                                         │
│  safe_resp ──▶ Analytics ──▶ logged_response            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Token Budget Allocation

```
Total Token Budget: 4096 tokens
├── System Prompt:      500 tokens (12%)
├── Context Window:    2048 tokens (50%)
│   ├── History:       1200 tokens
│   ├── User Info:      200 tokens
│   └── Metadata:       100 tokens
├── Response Limit:    1024 tokens (25%)
└── Safety Buffer:     524 tokens (13%)
```

## Caching Layers

### Prompt Cache
- **Type**: In-memory LRU cache
- **Size**: 1000 entries max
- **TTL**: 1 hour
- **Key**: Template name + version

### Context Cache
- **Type**: Redis-backed cache
- **Size**: 10000 entries
- **TTL**: 15 minutes
- **Key**: User ID + conversation ID

### Cache Invalidation
```python
# Manual invalidation
await cache.invalidate("prompt:template_name")
await cache.invalidate(f"context:{user_id}:{conversation_id}")

# TTL-based expiry (automatic)
# Force refresh on template update
```

## Error Handling Strategy

### Error Categories

| Category | Severity | Action | Recovery |
|----------|----------|--------|----------|
| Security Violation | Critical | Block request | Log incident |
| Rate Limit | Medium | Return 429 | Automatic |
| AI Service | High | Circuit breaker | Auto-recovery |
| Validation | Medium | Sanitize/retry | Fallback response |
| Database | High | Queue for retry | Manual review |

### Circuit Breaker Flow

```
CLOSED ──────▶ OPEN ──────▶ HALF_OPEN
  │              │              │
  │ failure      │ timeout      │
  │ threshold    │ expired      │
  │ reached      │              │
  │              │              │
  └──────────────◀──────────────┘
                   recovery
                   detected
```

### Error Response Format

```json
{
  "error": {
    "code": "SECURITY_VIOLATION",
    "message": "Request blocked by security policy",
    "request_id": "req_abc123",
    "timestamp": "2026-07-23T10:00:00Z"
  }
}
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Azure Function App              │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Function │  │ Function │  │ Function │ │
│  │    1    │  │    2    │  │    3    │ │
│  └────┬────┘  └────┬────┘  └────┬────┘ │
│       │            │            │       │
│       └────────────┼────────────┘       │
│                    ▼                    │
│              ┌─────────┐               │
│              │ Shared  │               │
│              │ Services│               │
│              └────┬────┘               │
└───────────────────┼─────────────────────┘
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
┌────────┐    ┌────────┐    ┌────────┐
│Azure AI │    │PostgreSQL│   │ Redis  │
│Service  │    │        │    │ Cache  │
└────────┘    └────────┘    └────────┘
```
