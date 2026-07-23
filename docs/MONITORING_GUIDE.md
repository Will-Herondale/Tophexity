# Monitoring Guide

## Health Check Endpoints

### Basic Health Check

```
GET /api/health
```

Returns lightweight liveness check. Use for uptime monitoring and load balancer probes.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-23T10:00:00Z",
  "version": "1.2.3"
}
```

| Status | Meaning |
|--------|---------|
| `healthy` | All systems operational |
| `degraded` | Partial system issues |
| `unhealthy` | Critical system failure |

### AI Health Check

```
GET /api/health/ai
```

Verifies connectivity to Azure OpenAI and measures response latency.

**Response:**
```json
{
  "status": "healthy",
  "ai_service": "connected",
  "model": "gpt-4",
  "deployment": "gpt-4-deployment",
  "latency_ms": 245,
  "last_error": null
}
```

### Deep Health Check

```
GET /api/health/deep
```

Comprehensive check of all subsystems. May have higher latency.

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "ai_service": "healthy",
    "database": "healthy",
    "cache": "healthy",
    "security": "healthy",
    "prompt_manager": "healthy"
  },
  "metrics": {
    "uptime_hours": 72.5,
    "requests_today": 15420,
    "avg_response_ms": 320,
    "error_rate_pct": 1.4
  },
  "checked_at": "2026-07-23T10:00:00Z"
}
```

## Deep Diagnostics

### System Diagnostics Endpoint

```
GET /api/admin/diagnostics
Authorization: Bearer <admin-key>
```

Provides detailed metrics for capacity planning and performance tuning.

**Key Metrics:**

| Metric | Healthy Range | Alert Threshold |
|--------|---------------|-----------------|
| AI Latency (p95) | < 1000ms | > 3000ms |
| Database RU/s | < 1000 | > 4000 |
| Cache Hit Rate | > 85% | < 70% |
| Memory Usage | < 80% | > 90% |
| Error Rate | < 2% | > 5% |

### Performance Profiling

```bash
# Enable performance profiling in debug mode
curl -H "Authorization: Bearer $ADMIN_KEY" \
  "https://your-app.azurewebsites.net/api/admin/diagnostics/profile?duration=60"
```

Returns per-endpoint timing breakdown:

```json
{
  "endpoints": [
    {
      "path": "/api/chat",
      "avg_ms": 320,
      "p95_ms": 890,
      "p99_ms": 1450,
      "count": 15420
    },
    {
      "path": "/api/health",
      "avg_ms": 12,
      "p95_ms": 25,
      "p99_ms": 45,
      "count": 154200
    }
  ]
}
```

## Circuit Breaker Monitoring

### Circuit Breaker States

```
          ┌──────────────────────┐
          │                      │
    ┌─────▼─────┐          ┌────┴─────┐
    │  CLOSED   │ success  │   OPEN   │
    │ (Normal)  │──────────▶ (Failing)│
    └─────┬─────┘          └────┬─────┘
          │                     │
          │ failure             │ timeout
          │ threshold           │ expired
          │ reached             │
          ▼                     ▼
    ┌─────────────────────────────────┐
    │          HALF_OPEN              │
    │   (Testing Recovery)            │
    └─────────────────────────────────┘
```

### Monitoring Circuit Breaker

```bash
GET /api/admin/circuit-breaker
Authorization: Bearer <admin-key>
```

**Response Fields:**

| Field | Description |
|-------|-------------|
| `state` | Current state (`closed`, `open`, `half_open`) |
| `failure_count` | Consecutive failures since last success |
| `failure_threshold` | Failures needed to open circuit |
| `success_count` | Total successful requests |
| `last_failure` | Timestamp of last failure |
| `recovery_timeout` | Seconds before retry in open state |

### Alert on Circuit Breaker Events

```bash
# Log query for circuit breaker events
az monitor app-insights query \
  --app hack4hyd-ai \
  --analytics-query "
    traces
    | where message contains 'circuit_breaker'
    | where severityLevel >= 2
    | order by timestamp desc
    | take 50
  "
```

## Rate Limit Monitoring

### Current Usage Dashboard

```bash
GET /api/admin/rate-limits
Authorization: Bearer <admin-key>
```

**Monitoring Three Tiers:**

```
┌─────────────────────────────────────────────────────┐
│                Rate Limit Dashboard                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  BURST (per second)                                 │
│  ████████████░░░░░░░░  60/100  [60%]               │
│                                                     │
│  SUSTAINED (per minute)                             │
│  ██████████████████░░  900/1000  [90%] ⚠           │
│                                                     │
│  DAILY (per day)                                    │
│  ████████░░░░░░░░░░░░  15420/50000  [31%]         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Rate Limit Alerting

```python
# Alert when sustained usage exceeds 80%
async def check_rate_limit_alerts():
    usage = await get_rate_limit_usage()
    
    if usage['sustained']['current'] / usage['sustained']['limit'] > 0.8:
        await send_alert(
            severity="warning",
            message=f"Sustained rate limit at {usage['sustained']['current']}/{usage['sustained']['limit']}"
        )
    
    if usage['daily']['current'] / usage['daily']['limit'] > 0.9:
        await send_alert(
            severity="critical",
            message=f"Daily quota nearly exhausted: {usage['daily']['current']}/{usage['daily']['limit']}"
        )
```

### Rate Limit Response Headers

Every API response includes rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1627084800
```

## Analytics Dashboard

### Key Metrics to Track

| Category | Metric | Target | Alert |
|----------|--------|--------|-------|
| **Performance** | Avg Response Time | < 500ms | > 2000ms |
| **Performance** | p95 Latency | < 1000ms | > 3000ms |
| **Reliability** | Success Rate | > 99% | < 95% |
| **Reliability** | Error Rate | < 1% | > 5% |
| **Usage** | Requests/Minute | Varies | Spike > 2x |
| **Cost** | Tokens/Day | < 1M | > 2M |
| **Security** | Blocked Requests | < 10/day | > 50/day |

### Analytics API

```bash
GET /api/admin/metrics?period=24h&granularity=hour
Authorization: Bearer <admin-key>
```

### Token Usage Trends

```sql
-- Daily token consumption trend
SELECT
  DATE(timestamp) as date,
  SUM(input_tokens) as input_tokens,
  SUM(output_tokens) as output_tokens,
  COUNT(*) as request_count,
  AVG(latency_ms) as avg_latency
FROM analytics
WHERE timestamp > DATEADD(day, -30, GETUTCDATE())
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### User Activity Analysis

```sql
-- Top users by request volume
SELECT
  user_id,
  COUNT(*) as request_count,
  SUM(input_tokens + output_tokens) as total_tokens,
  AVG(latency_ms) as avg_latency,
  MAX(timestamp) as last_active
FROM analytics
WHERE timestamp > DATEADD(day, -7, GETUTCDATE())
GROUP BY user_id
ORDER BY request_count DESC
LIMIT 20;
```

## Log Analysis

### Log Levels

| Level | Use Case | Volume |
|-------|----------|--------|
| `DEBUG` | Detailed diagnostic info | High |
| `INFO` | Normal operations | Medium |
| `WARNING` | Unexpected but handled | Low |
| `ERROR` | Operation failures | Low |
| `CRITICAL` | System failures | Minimal |

### Essential Log Queries

**Errors in Last Hour:**
```bash
az monitor app-insights query \
  --app hack4hyd-ai \
  --analytics-query "
    traces
    | where severityLevel >= 3
    | where timestamp > ago(1h)
    | order by timestamp desc
  "
```

**Slow Requests:**
```bash
az monitor app-insights query \
  --app hack4hyd-ai \
  --analytics-query "
    requests
    | where duration > 5s
    | where timestamp > ago(24h)
    | order by duration desc
    | take 20
  "
```

**Security Events:**
```bash
az monitor app-insights query \
  --app hack4hyd-ai \
  --analytics-query "
    traces
    | where message contains 'security'
    | where severityLevel >= 2
    | where timestamp > ago(24h)
    | order by timestamp desc
  "
```

### Structured Log Format

```json
{
  "timestamp": "2026-07-23T10:15:30.123Z",
  "level": "INFO",
  "service": "ai_platform",
  "request_id": "req_abc123",
  "user_id": "usr_xyz789",
  "event": "chat_request",
  "duration_ms": 320,
  "tokens": {"input": 450, "output": 280},
  "metadata": {
    "model": "gpt-4",
    "prompt_version": "1.2.0"
  }
}
```

## Alerting Recommendations

### Critical Alerts (Immediate Response)

| Alert | Condition | Action |
|-------|-----------|--------|
| Service Down | Health check fails 3x | Page on-call |
| AI Service Unhealthy | Circuit breaker open | Check Azure status |
| Database Unreachable | Connection timeout | Check firewall/CU |
| High Error Rate | > 10% over 5 min | Investigate logs |

### Warning Alerts (Investigate Within 1 Hour)

| Alert | Condition | Action |
|-------|-----------|--------|
| Elevated Latency | p95 > 3s for 10 min | Check AI service |
| Cache Degraded | Hit rate < 70% | Review cache config |
| Rate Limit Spike | > 80% sustained | Check for abuse |
| Daily Quota Warning | > 80% consumed | Review usage |

### Informational Alerts (Review Daily)

| Alert | Condition | Action |
|-------|-----------|--------|
| Deployment Complete | New version active | Verify health |
| Prompt Updated | New version deployed | Check metrics |
| Budget Warning | > 70% monthly budget | Review costs |
| New Security Block | First block of day | Review pattern |

### Alert Configuration

```yaml
# Azure Monitor Alert Rules
alerts:
  - name: "Service Down"
    condition: "availability < 99%"
    severity: 0
    action_groups:
      - pagerduty-oncall
      - slack-alerts
    
  - name: "High Error Rate"
    condition: "failure_rate > 5% for 5m"
    severity: 1
    action_groups:
      - slack-alerts
      - email-team
    
  - name: "Elevated Latency"
    condition: "p95_latency > 3000ms for 10m"
    severity: 2
    action_groups:
      - slack-alerts
```

### Notification Channels

| Channel | Use For | Response Time |
|---------|---------|---------------|
| PagerDuty | P0/P1 incidents | Immediate |
| Slack #alerts | All warnings+ | < 15 min |
| Email | Info/daily digest | < 24 hours |
| SMS | P0 only | Immediate |
