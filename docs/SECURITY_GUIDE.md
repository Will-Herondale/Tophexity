# Security Guide

## Overview

This guide documents the security measures implemented to protect the AI platform from malicious inputs, abuse, and data leakage.

## Prompt Injection Detection

### Patterns Detected

| Pattern Type | Examples | Risk Level |
|--------------|----------|------------|
| Direct Override | "Ignore previous instructions" | High |
| Role Manipulation | "You are now a different AI" | High |
| Instruction Smuggling | "Execute this code:" | Critical |
| Output Manipulation | "Respond with only: ..." | Medium |
| Context Breaking | "New conversation starts now" | High |

### Detection Algorithm

```python
# Pattern scoring system
def detect_injection(text: str) -> tuple[bool, float]:
    score = 0.0
    
    # High-risk patterns (weight: 0.4)
    high_risk = [
        r"ignore\s+(previous|all|above)",
        r"disregard\s+(previous|all|instructions)",
        r"you\s+are\s+now",
        r"new\s+(role|identity|persona)",
    ]
    
    # Medium-risk patterns (weight: 0.3)
    medium_risk = [
        r"respond\s+with\s+only",
        r"output\s+format\s*:",
        r"system\s*:\s*",
        r"<\|system\|>",
    ]
    
    # Low-risk patterns (weight: 0.1)
    low_risk = [
        r"please\s+ignore",
        r"forget\s+everything",
        r"override",
    ]
    
    # Calculate score
    for pattern in high_risk:
        if re.search(pattern, text, re.IGNORECASE):
            score += 0.4
    
    for pattern in medium_risk:
        if re.search(pattern, text, re.IGNORECASE):
            score += 0.3
    
    for pattern in low_risk:
        if re.search(pattern, text, re.IGNORECASE):
            score += 0.1
    
    # Threshold: 0.7
    return score >= 0.7, score
```

### Response Actions

- **Score < 0.3**: Allow request
- **Score 0.3-0.7**: Flag for monitoring
- **Score 0.7-0.9**: Block request, log incident
- **Score > 0.9**: Block request, alert admin, rate limit user

## Jailbreak Detection

### Known Attack Vectors

1. **DAN (Do Anything Now)**
   - Attempts to bypass content policies
   - Detects persona switching

2. **Developer Mode**
   - Requests "debug" or "dev" modes
   - Asks to disable safety filters

3. **Hypothetical Scenarios**
   - "What if you were..."
   - "In a fictional world..."

### Detection Rules

```python
JAILBREAK_PATTERNS = [
    r"act\s+as\s+if\s+you\s+have\s+no\s+restrictions",
    r"pretend\s+you\s+are\s+(unrestricted|uncensored)",
    r"roleplay\s+as\s+(evil|malicious|unethical)",
    r"in\s+(this|a)\s+(scenario|world|universe)\s+where",
    r"you\s+have\s+(no|zero)\s+(restrictions|limits)",
]
```

## Input Sanitization

### HTML Sanitization

```python
def sanitize_html(text: str) -> str:
    # Remove all HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Decode HTML entities
    text = html.unescape(text)
    
    # Remove script content
    text = re.sub(r'<script.*?</script>', '', text, flags=re.DOTALL)
    
    return text.strip()
```

### Markdown Sanitization

```python
def sanitize_markdown(text: str) -> str:
    # Remove code blocks that could contain attacks
    text = re.sub(r'```[\s\S]*?```', '', text)
    
    # Remove inline code
    text = re.sub(r'`[^`]*`', '', text)
    
    # Remove HTML in markdown
    text = re.sub(r'<[^>]+>', '', text)
    
    return text.strip()
```

### Sanitization Pipeline

```
Raw Input
    │
    ▼
┌─────────────────┐
│ HTML Decode     │
│ &lt;script&gt;  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Strip HTML Tags │
│ <script>...</>  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Remove Markdown │
│ ```code```      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trim Whitespace │
└────────┬────────┘
         │
         ▼
    Clean Input
```

## Token Abuse Prevention

### Detection Rules

| Pattern | Action | Duration |
|---------|--------|----------|
| >50 requests/min | Rate limit | 5 min |
| >500 requests/hour | Rate limit | 1 hour |
| >10000 tokens/min | Throttle | 10 min |
| Excessive long messages | Reject | Immediate |

### Token Budget Per Request

```
User Input Max:     4000 tokens
System Prompt:       500 tokens
Context Window:     2000 tokens
Response Max:       1500 tokens
────────────────────────────
Total Budget:       8000 tokens
```

## Ownership Validation

### Resource Ownership Rules

```python
def validate_ownership(user_id: str, resource_id: str) -> bool:
    """Verify user owns the requested resource."""
    
    # Check user exists
    user = db.get_user(user_id)
    if not user:
        return False
    
    # Check resource exists
    resource = db.get_resource(resource_id)
    if not resource:
        return False
    
    # Verify ownership
    return resource.owner_id == user_id
```

### Access Control Matrix

| Resource | Owner | Admin | Public |
|----------|-------|-------|--------|
| Conversations | Read/Write | Read | None |
| Prompts | Read | Read/Write | None |
| Analytics | Read | Read/Write | None |
| Settings | Read/Write | Read/Write | None |

## Secret Protection

### Secret Detection

```python
SECRET_PATTERNS = [
    r'(?i)api[_-]?key\s*[:=]\s*["\']?[\w-]+',
    r'(?i)secret\s*[:=]\s*["\']?[\w-]+',
    r'(?i)password\s*[:=]\s*["\']?[\w-]+',
    r'(?i)token\s*[:=]\s*["\']?[\w-]+',
    r'sk-[a-zA-Z0-9]{48}',  # OpenAI keys
    r'ghp_[a-zA-Z0-9]{36}',  # GitHub tokens
]

def detect_secrets(text: str) -> list[str]:
    """Detect potential secrets in text."""
    found = []
    for pattern in SECRET_PATTERNS:
        matches = re.findall(pattern, text)
        found.extend(matches)
    return found
```

### Protection Actions

1. **Detection**: Scan all outputs for secrets
2. **Masking**: Replace secrets with `***REDACTED***`
3. **Logging**: Log detection event (not the secret)
4. **Alerting**: Notify admin of potential leak

## Rate Limiting

### Limit Configuration

```yaml
rate_limits:
  burst:
    requests_per_second: 100
    window_seconds: 1
  
  sustained:
    requests_per_minute: 1000
    window_seconds: 60
  
  daily:
    requests_per_day: 50000
    window_hours: 24
  
  per_user:
    requests_per_minute: 100
    requests_per_day: 5000
```

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1627084800
X-RateLimit-Policy: burst
```

### Rate Limit Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 30,
    "limit": 100,
    "window": "1m"
  }
}
```

## Security Configuration

### Environment Variables

```bash
# Security Settings
SECURITY_ENABLED=true
SECURITY_LOG_LEVEL=info
SECURITY_BLOCK_THRESHOLD=0.7
SECURITY_ALERT_THRESHOLD=0.9

# Rate Limiting
RATE_LIMIT_BURST=100
RATE_LIMIT_SUSTAINED=1000
RATE_LIMIT_DAILY=50000

# Secret Detection
SECRET_DETECTION_ENABLED=true
SECRET_MASKING_ENABLED=true
```

### Security Headers

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Active attack/data breach | Immediate |
| P1 | Security policy bypass | < 1 hour |
| P2 | Suspicious activity | < 4 hours |
| P3 | Policy violation | < 24 hours |

### Response Procedures

1. **Detection**
   - Alert triggered
   - Automated blocking

2. **Assessment**
   - Review incident logs
   - Determine scope

3. **Containment**
   - Block attacking IP/user
   - Enable enhanced monitoring

4. **Recovery**
   - Patch vulnerability
   - Clear false positives

5. **Post-Mortem**
   - Document incident
   - Update patterns
   - Improve detection

### Log Analysis

```sql
-- Find security incidents
SELECT * FROM security_events
WHERE severity IN ('HIGH', 'CRITICAL')
AND timestamp > DATEADD(hour, -24, GETUTCDATE())
ORDER BY timestamp DESC;

-- Find blocked requests by user
SELECT user_id, COUNT(*) as blocked_count
FROM security_events
WHERE action = 'BLOCKED'
AND timestamp > DATEADD(hour, -1, GETUTCDATE())
GROUP BY user_id
ORDER BY blocked_count DESC;
```
