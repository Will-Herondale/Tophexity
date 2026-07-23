# Admin API Reference

## Authentication

All admin endpoints require an API key via the `Authorization` header.

```
Authorization: Bearer <admin-api-key>
```

Requests without valid authentication return `401 Unauthorized`.

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/status` | System status |
| `GET` | `/api/admin/metrics` | Usage metrics |
| `GET` | `/api/admin/diagnostics` | Deep diagnostics |
| `GET` | `/api/admin/prompts` | List prompts |
| `POST` | `/api/admin/prompts` | Create prompt |
| `PUT` | `/api/admin/prompts/{name}` | Update prompt |
| `DELETE` | `/api/admin/prompts/{name}` | Delete prompt |
| `POST` | `/api/admin/cache/invalidate` | Invalidate cache |
| `GET` | `/api/admin/cache/stats` | Cache statistics |
| `GET` | `/api/admin/rate-limits` | Rate limit status |
| `GET` | `/api/admin/conversations` | List conversations |
| `DELETE` | `/api/admin/conversations/{id}` | Delete conversation |
| `GET` | `/api/admin/circuit-breaker` | Circuit breaker status |
| `POST` | `/api/admin/circuit-breaker/reset` | Reset breaker |
| `GET` | `/api/admin/security/events` | Security events |
| `GET` | `/api/admin/health/deep` | Deep health check |

## System Status

### GET /api/admin/status

Returns current system status and basic metrics.

**Request:**
```bash
curl -H "Authorization: Bearer $ADMIN_KEY" \
  https://tophexity-func.azurewebsites.net/api/admin/status
```

**Response (200 OK):**
```json
{
  "status": "operational",
  "version": "1.2.3",
  "environment": "production",
  "uptime": "72h 15m",
  "requests_per_minute": 245,
  "active_users": 89,
  "circuit_breaker": "closed",
  "last_deployment": "2026-07-22T14:30:00Z"
}
```

## Metrics Reference

### GET /api/admin/metrics

Returns usage metrics for a specified time period.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `1h` | Time period (`1h`, `24h`, `7d`, `30d`) |
| `granularity` | string | `auto` | Data granularity (`minute`, `hour`, `day`) |

**Request:**
```bash
curl -H "Authorization: Bearer $ADMIN_KEY" \
  "https://tophexity-func.azurewebsites.net/api/admin/metrics?period=24h&granularity=hour"
```

**Response (200 OK):**
```json
{
  "period": "24h",
  "granularity": "hour",
  "requests": {
    "total": 15420,
    "success": 15200,
    "failed": 220,
    "rate_limited": 45,
    "security_blocked": 8
  },
  "tokens": {
    "input_total": 4520000,
    "output_total": 2100000,
    "avg_per_request": 429
  },
  "latency": {
    "avg_ms": 320,
    "p50_ms": 280,
    "p95_ms": 890,
    "p99_ms": 1450,
    "max_ms": 5200
  },
  "errors": {
    "total": 220,
    "by_type": {
      "timeout": 85,
      "rate_limit": 45,
      "security": 8,
      "validation": 52,
      "internal": 30
    }
  },
  "users": {
    "unique": 342,
    "new": 28,
    "active": 89
  },
  "time_series": [
    {"timestamp": "2026-07-23T00:00:00Z", "requests": 120, "tokens": 48000},
    {"timestamp": "2026-07-23T01:00:00Z", "requests": 85, "tokens": 34000}
  ]
}
```

## Diagnostics Reference

### GET /api/admin/diagnostics

Returns detailed system diagnostics.

**Request:**
```bash
curl -H "Authorization: Bearer $ADMIN_KEY" \
  https://tophexity-func.azurewebsites.net/api/admin/diagnostics
```

**Response (200 OK):**
```json
{
  "components": {
    "ai_service": {
      "status": "healthy",
      "latency_ms": 245,
      "model": "gpt-5",
      "endpoint": "https://tophex.cognitiveservices.azure.com/",
      "last_error": null,
      "uptime_pct": 99.95
    },
    "database": {
      "status": "healthy",
      "latency_ms": 12,
      " RU消耗": 450,
      "containers": {
        "conversations": {"count": 15420, "size_kb": 204800},
        "analytics": {"count": 154200, "size_kb": 51200},
        "users": {"count": 342, "size_kb": 1024}
      }
    },
    "cache": {
      "status": "healthy",
      "type": "redis",
      "hit_rate": 0.92,
      "memory_used_mb": 128,
      "memory_max_mb": 512,
      "connected_clients": 5
    },
    "security": {
      "status": "active",
      "blocked_requests_24h": 8,
      "active_rate_limits": 3,
      "circuit_breaker": "closed"
    }
  },
  "runtime": {
    "python_version": "3.11",
    "function_runtime": "4.0.0",
    "memory_used_mb": 456,
    "memory_limit_mb": 1536,
    "cpu_time_ms": 125000
  },
  "environment": {
    "region": "eastus",
    "instance": "tophexity-func",
    "slot": "production"
  }
}
```

## Prompt Management

### GET /api/admin/prompts

List all registered prompts.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `tag` | string | Filter by tag |
| `status` | string | Filter by status (`active`, `deprecated`) |

**Response (200 OK):**
```json
{
  "prompts": [
    {
      "name": "general_chat",
      "versions": ["1.0.0", "1.1.0", "1.2.0"],
      "active_version": "1.2.0",
      "description": "General-purpose chat assistant",
      "tags": ["chat", "general", "production"],
      "total_uses": 15420,
      "avg_rating": 4.2,
      "created_at": "2026-07-01T00:00:00Z"
    },
    {
      "name": "code_review",
      "versions": ["1.0.0"],
      "active_version": "1.0.0",
      "description": "Code review assistant",
      "tags": ["code", "review"],
      "total_uses": 3200,
      "avg_rating": 4.5,
      "created_at": "2026-07-10T00:00:00Z"
    }
  ],
  "total": 2
}
```

### POST /api/admin/prompts

Create a new prompt.

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "data_analysis",
    "version": "1.0.0",
    "description": "Data analysis assistant",
    "content": "You are a data analysis expert...\n\n## Data\n{{data}}",
    "tags": ["data", "analysis"],
    "variables": [
      {"name": "data", "type": "string", "required": true}
    ],
    "model": {
      "preferred": "gpt-5",
      "temperature": 0.5,
      "max_tokens": 2048
    }
  }' \
  https://tophexity-func.azurewebsites.net/api/admin/prompts
```

**Response (201 Created):**
```json
{
  "name": "data_analysis",
  "version": "1.0.0",
  "status": "active",
  "created_at": "2026-07-23T10:00:00Z"
}
```

### PUT /api/admin/prompts/{name}

Update an existing prompt.

**Request:**
```bash
curl -X PUT \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.1.0",
    "content": "Updated prompt content...",
    "changes": "Improved accuracy for edge cases"
  }' \
  https://tophexity-func.azurewebsites.net/api/admin/prompts/data_analysis
```

**Response (200 OK):**
```json
{
  "name": "data_analysis",
  "version": "1.1.0",
  "previous_version": "1.0.0",
  "updated_at": "2026-07-23T11:00:00Z"
}
```

### DELETE /api/admin/prompts/{name}

Delete a prompt and all its versions.

**Request:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer $ADMIN_KEY" \
  https://tophexity-func.azurewebsites.net/api/admin/prompts/data_analysis
```

**Response (200 OK):**
```json
{
  "deleted": "data_analysis",
  "versions_removed": 2,
  "deleted_at": "2026-07-23T12:00:00Z"
}
```

## Cache Management

### POST /api/admin/cache/invalidate

Invalidate cached prompts or contexts.

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "prompt",
    "name": "general_chat",
    "version": "1.2.0"
  }' \
  https://tophexity-func.azurewebsites.net/api/admin/cache/invalidate
```

**Response (200 OK):**
```json
{
  "invalidated": {
    "memory": true,
    "disk": true,
    "entries_removed": 3
  }
}
```

### GET /api/admin/cache/stats

Return cache statistics.

**Response (200 OK):**
```json
{
  "memory": {
    "type": "lru",
    "size": 850,
    "max_size": 1000,
    "hit_count": 45200,
    "miss_count": 3800,
    "hit_rate": 0.922,
    "evictions": 120
  },
  "disk": {
    "type": "file",
    "size": 1520,
    "hit_count": 3800,
    "miss_count": 660,
    "hit_rate": 0.853,
    "total_size_mb": 45.2
  }
}
```

## Rate Limit Monitoring

### GET /api/admin/rate-limits

Show current rate limit status across all users.

**Request:**
```bash
curl -H "Authorization: Bearer $ADMIN_KEY" \
  https://tophexity-func.azurewebsites.net/api/admin/rate-limits
```

**Response (200 OK):**
```json
{
  "global": {
    "burst": {"limit": 100, "current": 45, "window": "1s"},
    "sustained": {"limit": 1000, "current": 620, "window": "1m"},
    "daily": {"limit": 50000, "current": 15420, "window": "24h"}
  },
  "top_users": [
    {"user_id": "usr_abc123", "requests_today": 1200, "limit": 5000},
    {"user_id": "usr_def456", "requests_today": 980, "limit": 5000},
    {"user_id": "usr_ghi789", "requests_today": 875, "limit": 5000}
  ],
  "blocked_users": [
    {"user_id": "usr_xyz000", "blocked_until": "2026-07-23T11:00:00Z", "reason": "burst_exceeded"}
  ]
}
```

## Conversation Management

### GET /api/admin/conversations

List recent conversations.

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | int | `20` | Max results (1-100) |
| `user_id` | string | - | Filter by user |
| `since` | string | - | ISO 8601 timestamp |

**Response (200 OK):**
```json
{
  "conversations": [
    {
      "id": "conv_abc123",
      "user_id": "usr_xyz789",
      "title": "Python help",
      "messages": 8,
      "tokens_used": 3420,
      "created_at": "2026-07-23T09:30:00Z",
      "last_message_at": "2026-07-23T09:45:00Z"
    }
  ],
  "total": 15420,
  "has_more": true
}
```

### DELETE /api/admin/conversations/{id}

Delete a specific conversation.

**Request:**
```bash
curl -X DELETE \
  -H "Authorization: Bearer $ADMIN_KEY" \
  https://tophexity-func.azurewebsites.net/api/admin/conversations/conv_abc123
```

**Response (200 OK):**
```json
{
  "deleted": "conv_abc123",
  "messages_removed": 8,
  "deleted_at": "2026-07-23T12:00:00Z"
}
```

## Circuit Breaker

### GET /api/admin/circuit-breaker

Get circuit breaker status.

**Response (200 OK):**
```json
{
  "state": "closed",
  "service": "ai_service",
  "failure_count": 0,
  "failure_threshold": 5,
  "success_count": 15200,
  "last_failure": null,
  "last_state_change": "2026-07-22T14:30:00Z",
  "recovery_timeout": 30
}
```

### POST /api/admin/circuit-breaker/reset

Force reset the circuit breaker to closed state.

**Request:**
```bash
curl -X POST \
  -H "Authorization: Bearer $ADMIN_KEY" \
  https://tophexity-func.azurewebsites.net/api/admin/circuit-breaker/reset
```

**Response (200 OK):**
```json
{
  "state": "closed",
  "previous_state": "open",
  "reset_at": "2026-07-23T12:00:00Z"
}
```

## Security Events

### GET /api/admin/security/events

List recent security events.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `severity` | string | Filter by severity (`low`, `medium`, `high`, `critical`) |
| `limit` | int | Max results (default 50) |

**Response (200 OK):**
```json
{
  "events": [
    {
      "id": "evt_abc123",
      "type": "prompt_injection",
      "severity": "high",
      "user_id": "usr_xyz000",
      "input_preview": "Ignore previous instr...",
      "score": 0.85,
      "action": "blocked",
      "timestamp": "2026-07-23T10:15:00Z"
    }
  ],
  "summary": {
    "total_24h": 8,
    "by_type": {
      "prompt_injection": 3,
      "jailbreak_attempt": 2,
      "rate_limit_abuse": 2,
      "secret_detected": 1
    }
  }
}
```

## Error Responses

All endpoints use consistent error format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key",
    "request_id": "req_abc123"
  }
}
```

| Status | Code | Description |
|--------|------|-------------|
| 401 | `UNAUTHORIZED` | Missing or invalid API key |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
