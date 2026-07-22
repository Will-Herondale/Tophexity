# AI API Reference - Phase 3.1

## Endpoints

---

### POST /v1/ai/test

**Purpose:** Verify Azure AI integration with a simple test message.

**Authentication:** Required (Bearer token)

**Rate Limits:** Per user per minute, per IP per minute

**Request:**
```json
{
  "message": "Hello, this is a test message."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | No | Test message (defaults to "Hello, this is a test message.") |

**Response (200):**
```json
{
  "response": "Hello! I'm Tophexity AI...",
  "model": "gpt-5",
  "tokens": 42,
  "latency_ms": 1250.3,
  "request_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Error Responses:**
| Code | Description |
|---|---|
| 401 | Not authenticated |
| 503 | AI service not configured |

**Internal Flow:**
1. Validate authentication
2. Rate limit check
3. Send message to Azure AI
4. Receive response
5. Track token usage
6. Return response with metrics

---

### GET /v1/ai/health

**Purpose:** Verify Azure AI connectivity, deployment, authentication, and latency.

**Authentication:** None

**Rate Limits:** None

**Response (200):**
```json
{
  "status": "healthy",
  "azure_connected": true,
  "deployment_available": true,
  "authentication_valid": true,
  "latency_ms": 850.2,
  "model": "gpt-5",
  "endpoint": "https://tophex.openai.azure.com/openai/v1",
  "error": null
}
```

**Unhealthy Response (200):**
```json
{
  "status": "unhealthy",
  "azure_connected": false,
  "deployment_available": false,
  "authentication_valid": false,
  "latency_ms": 5000.0,
  "model": "gpt-5",
  "endpoint": "https://tophex.openai.azure.com/openai/v1",
  "error": "Connection refused"
}
```

---

### GET /health/ai

**Purpose:** Top-level AI health check (outside v1 prefix).

**Authentication:** None

**Response:** Same as `GET /v1/ai/health`

---

## Chat Endpoints (Updated)

### POST /v1/chat/sessions/{session_id}/messages

**Purpose:** Send a user message and receive an AI-generated response.

**Authentication:** Required (Bearer token)

**Request:**
```json
[
  {"role": "user", "content": "What careers match my skills?"}
]
```

**Response (201):**
```json
[
  {
    "id": "...",
    "session_id": "...",
    "role": "user",
    "content": "What careers match my skills?",
    "created_at": "2026-07-22T..."
  },
  {
    "id": "...",
    "session_id": "...",
    "role": "assistant",
    "content": "Based on your profile, here are the top careers...",
    "created_at": "2026-07-22T..."
  }
]
```

**Internal Flow:**
1. Store user message(s) in database
2. If user messages present and AI configured:
   a. Load conversation memory from DB
   b. Build context (profile, portfolio, recommendations, roadmap, backup)
   c. Assemble system prompt + context + memory + user message
   d. Call Azure AI via AIClient
   e. Store assistant response in database
3. Return all stored messages (user + assistant)

**Note:** If AI is not configured, only user messages are stored (no AI response).

---

### GET /v1/chat/sessions/{session_id}

**Purpose:** Retrieve a chat session with all messages.

**Authentication:** Required

**Response (200):**
```json
{
  "id": "...",
  "user_id": "...",
  "title": "Career Discussion",
  "created_at": "2026-07-22T...",
  "messages": [
    {
      "id": "...",
      "session_id": "...",
      "role": "user",
      "content": "...",
      "created_at": "2026-07-22T..."
    },
    {
      "id": "...",
      "session_id": "...",
      "role": "assistant",
      "content": "...",
      "created_at": "2026-07-22T..."
    }
  ]
}
```

---

### POST /v1/chat/sessions

**Purpose:** Create a new chat session.

**Authentication:** Required

**Request:**
```json
{
  "title": "Career Discussion"
}
```

**Response (201):**
```json
{
  "id": "...",
  "user_id": "...",
  "title": "Career Discussion",
  "created_at": "2026-07-22T..."
}
```

---

### GET /v1/chat/sessions

**Purpose:** List all chat sessions for the authenticated user.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `page_size` | int | 20 | Items per page (max 100) |

**Response (200):**
```json
{
  "items": [...],
  "total": 15,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

---

### DELETE /v1/chat/sessions/{session_id}

**Purpose:** Delete a chat session and all its messages.

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Chat session deleted"
}
```

---

## Rate Limiting Details

All AI endpoints enforce rate limits. When exceeded:

**Response (429):**
```json
{
  "detail": "AI rate limit exceeded. Retry after 45 seconds."
}
```

**Headers:**
```
Retry-After: 45
```

---

## Error Codes

| Code | Description |
|---|---|
| 200 | Success |
| 201 | Created |
| 401 | Not authenticated |
| 404 | Resource not found |
| 422 | Validation error |
| 429 | Rate limit exceeded |
| 503 | AI service not configured |

---

## Who Should Call What

| Endpoint | Caller | Purpose |
|---|---|---|
| `POST /v1/ai/test` | Backend only | Verify AI integration |
| `GET /v1/ai/health` | Backend / Monitoring | Check AI status |
| `GET /health/ai` | Load balancer / Monitoring | Top-level health |
| `POST /v1/chat/sessions/{id}/messages` | Frontend | Send message, get AI response |
| `GET /v1/chat/sessions` | Frontend | List conversations |
| `GET /v1/chat/sessions/{id}` | Frontend | View conversation |
| `POST /v1/chat/sessions` | Frontend | Start new conversation |
| `DELETE /v1/chat/sessions/{id}` | Frontend | Delete conversation |
