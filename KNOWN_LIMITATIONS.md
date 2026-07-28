# Known Limitations

## Backend

### AI Service
- **Cold start**: Azure Function App cold starts can cause 3-8s initial latency for AI endpoints. Subsequent requests within the same warm period (5-20 min) are fast.
- **AI rate limits**: Default rate limits are conservative (25 req/user/min, 5000 req/user/day). High-traffic scenarios may require adjustment via environment variables.
- **Prompt injection detection**: Regex-based patterns may produce false positives on legitimate content (e.g., code with keywords like "system", "instructions"). The `AI_PROMPT_INJECTION_ENABLED` flag can disable detection if needed.
- **Token estimation**: Input sanitizer uses a rough 4-char-per-token heuristic. May over/under-estimate for non-English or technical content.
- **No streaming**: AI responses are fully buffered before returning. Streaming is not yet implemented.

### Database
- **No connection pooling at scale**: SQLAlchemy pool_size=5 with max_overflow=10 is tuned for moderate load. Heavy concurrent usage may require pool size adjustments.
- **No read replicas**: All queries hit the primary database. No read-replica configuration for analytics-heavy workloads.
- **Migration locks**: Alembic migrations lock the schema. No zero-downtime migration strategy implemented.

### Security
- **Password reset**: Uses a JWT-based reset token (15-min expiry) rather than email-based OTP flow. Email sending is not implemented — the reset token is returned in the API response.
- **No MFA**: Multi-factor authentication is not supported.
- **No audit log**: Admin actions (cache clears, metric views) are logged but there is no structured audit trail.

### Monitoring
- **No APM integration**: Azure Application Insights is configured at the Function App level but no application-level instrumentation (OpenTelemetry) is wired into the FastAPI app.
- **No alerting**: No automated alert rules are configured for rate limit breaches, circuit breaker trips, or AI service degradation.

## Frontend

### Performance
- **No lazy loading**: All page components are eagerly loaded. No `React.lazy()` or dynamic imports for route-level code splitting.
- **No image optimization**: Next.js `<Image>` component is not used. All images use standard `<img>` tags.
- **Bundle size**: The standalone server bundle is ~59MB (includes Node.js runtime for Azure App Service).

### UX
- **No dark mode persistence**: Theme preference is not persisted across sessions.
- **No offline support**: No service worker or PWA configuration.
- **No keyboard shortcuts**: Accessibility keyboard navigation is basic.

### Chat
- **No streaming**: Chat responses are fully buffered. Users see a loading spinner until the complete response is received.
- **No message editing**: Only content editing is supported (via API), not full message editing in the UI.
- **No markdown rendering in chat**: AI markdown responses are rendered as plain text.

## Integrations

### Azure
- **No autoscaling**: Azure Function App and App Service are on default SKUs. No autoscaling rules configured.
- **No CDN**: Static assets are served directly from the App Service, not via Azure CDN or Front Door.
- **No staging slot**: Only production slot is configured. No deployment slot swap for blue/green deployments.
- **No backup/DR**: No geo-redundancy or cross-region failover configured.

### API
- **No OpenAPI/Swagger improvements**: Swagger docs include all endpoints but some response model definitions could be more precise (e.g., 4xx error schemas).
- **No API versioning strategy**: Only `/v1` prefix exists. No deprecation or sunset mechanism for future API versions.
- **No request/response compression**: No gzip/brotli compression on API responses.

## Documentation
- No API client SDKs or code generation examples
- No Postman/Insomnia collection
- No interactive API playground beyond Swagger UI
