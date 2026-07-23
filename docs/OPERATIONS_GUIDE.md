# Operations Guide

## Deployment Process

### Prerequisites

- Azure CLI installed and authenticated
- Azure Function Core Tools v4+
- Python 3.9+
- Access to Azure subscription

### Initial Deployment

```bash
# 1. Login to Azure
az login

# 2. Set subscription
az account set --subscription <subscription-id>

# 3. Create resource group (if needed)
az group create --name hack4hyd-rg --location eastus

# 4. Create storage account
az storage account create \
  --name hack4hydstore \
  --resource-group hack4hyd-rg \
  --location eastus \
  --sku Standard_LRS

# 5. Create Function App
az functionapp create \
  --name hack4hyd-ai \
  --resource-group hack4hyd-rg \
  --consumption-plan-location eastus \
  --runtime python \
  --runtime-version 3.9 \
  --functions-version 4 \
  --storage-account hack4hydstore

# 6. Configure settings
az functionapp config appsettings set \
  --name hack4hyd-ai \
  --resource-group hack4hyd-rg \
  --settings \
    "OPENAI_ENDPOINT=https://your-resource.openai.azure.com/" \
    "OPENAI_API_KEY=your-api-key" \
    "COSMOS_ENDPOINT=https://your-cosmos.documents.azure.com:443/" \
    "COSMOS_KEY=your-cosmos-key"

# 7. Deploy
func azure functionapp publish hack4hyd-ai
```

### Update Deployment

```bash
# Pull latest changes
git pull origin main

# Deploy updates
func azure functionapp publish hack4hyd-ai

# Verify deployment
curl https://hack4hyd-ai.azurewebsites.net/api/health
```

### Deployment Slots

```bash
# Create staging slot
az functionapp deployment slot create \
  --name hack4hyd-ai \
  --resource-group hack4hyd-rg \
  --slot staging

# Deploy to staging
func azure functionapp publish hack4hyd-ai --slot staging

# Test in staging
curl https://hack4hyd-ai-staging.azurewebsites.net/api/health

# Swap to production
az functionapp deployment slot swap \
  --name hack4hyd-ai \
  --resource-group hack4hyd-rg \
  --slot staging \
  --target-slot production
```

## Health Checks

### Basic Health Check

```bash
# Check if service is running
curl https://hack4hyd-ai.azurewebsites.net/api/health

# Response:
{
  "status": "healthy",
  "timestamp": "2026-07-23T10:00:00Z",
  "version": "1.2.3"
}
```

### AI Health Check

```bash
# Check AI connectivity
curl https://hack4hyd-ai.azurewebsites.net/api/health/ai

# Response:
{
  "status": "healthy",
  "ai_service": "connected",
  "model": "gpt-4",
  "latency_ms": 245
}
```

### Deep Health Check

```bash
# Full system check
curl https://hack4hyd-ai.azurewebsites.net/api/health/deep

# Response:
{
  "status": "healthy",
  "components": {
    "ai_service": "healthy",
    "database": "healthy",
    "cache": "healthy",
    "security": "healthy"
  },
  "metrics": {
    "uptime_hours": 72.5,
    "requests_today": 15420,
    "avg_response_ms": 320
  }
}
```

## Monitoring Endpoints

### System Status

```bash
GET /api/admin/status
Authorization: Bearer <admin-token>

# Response:
{
  "status": "operational",
  "version": "1.2.3",
  "environment": "production",
  "uptime": "72h 15m",
  "requests_per_minute": 245,
  "active_users": 89
}
```

### Metrics Dashboard

```bash
GET /api/admin/metrics?period=24h
Authorization: Bearer <admin-token>

# Response:
{
  "period": "24h",
  "requests": {
    "total": 15420,
    "success": 15200,
    "failed": 220,
    "rate_limited": 45
  },
  "tokens": {
    "input": 4520000,
    "output": 2100000
  },
  "latency": {
    "avg_ms": 320,
    "p95_ms": 890,
    "p99_ms": 1450
  }
}
```

## Configuration Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_ENDPOINT` | Azure OpenAI endpoint | - | Yes |
| `OPENAI_API_KEY` | Azure OpenAI API key | - | Yes |
| `OPENAI_DEPLOYMENT` | Model deployment name | gpt-4 | Yes |
| `COSMOS_ENDPOINT` | Cosmos DB endpoint | - | Yes |
| `COSMOS_KEY` | Cosmos DB key | - | Yes |
| `COSMOS_DATABASE` | Database name | ai-platform | Yes |
| `REDIS_CONNECTION` | Redis connection string | - | No |
| `ADMIN_API_KEY` | Admin API key | - | Yes |
| `ENVIRONMENT` | Environment name | development | No |
| `LOG_LEVEL` | Logging level | INFO | No |
| `MAX_TOKENS` | Max tokens per request | 4096 | No |
| `RATE_LIMIT_BURST` | Burst rate limit | 100 | No |
| `RATE_LIMIT_SUSTAINED` | Sustained rate limit | 1000 | No |

### Local Development Settings

```json
// local.settings.json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "OPENAI_ENDPOINT": "https://your-dev.openai.azure.com/",
    "OPENAI_API_KEY": "your-dev-key",
    "ENVIRONMENT": "development",
    "LOG_LEVEL": "DEBUG"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Cold Start Delays

**Symptom**: First request takes 10-30 seconds
**Solution**:
```bash
# Enable Always On
az functionapp config set \
  --name hack4hyd-ai \
  --resource-group hack4hyd-rg \
  --always-on true
```

#### 2. Rate Limiting Errors

**Symptom**: 429 Too Many Requests
**Solution**:
```bash
# Check current limits
curl /api/admin/rate-limits

# Increase limits if needed
az functionapp config appsettings set \
  --name hack4hyd-ai \
  --settings "RATE_LIMIT_BURST=200"
```

#### 3. AI Service Timeout

**Symptom**: 504 Gateway Timeout
**Solution**:
```bash
# Check circuit breaker status
curl /api/admin/circuit-breaker

# Reset if needed
curl -X POST /api/admin/circuit-breaker/reset
```

#### 4. Database Connection Issues

**Symptom**: 500 Internal Server Error
**Solution**:
```bash
# Verify connection string
az functionapp config appsettings list \
  --name hack4hyd-ai \
  --resource-group hack4hyd-rg

# Test connection
curl /api/admin/diagnostics/database
```

### Log Analysis

```bash
# Stream live logs
func log tail --name hack4hyd-ai

# Download log files
func log download --name hack4hyd-ai

# Query Application Insights
az monitor app-insights query \
  --app hack4hyd-ai \
  --analytics-query "traces | where severityLevel >= 3 | take 100"
```

## Scaling Considerations

### Auto-Scaling Rules

```bash
# Configure auto-scaling
az monitor autoscale create \
  --resource-group hack4hyd-rg \
  --resource hack4hyd-ai \
  --resource-type Microsoft.Web/sites \
  --min 1 --max 10 --count 2

# Add scale-out rule
az monitor autoscale rule create \
  --resource-group hack4hyd-rg \
  --autoscale-name hack4hyd-autoscale \
  --condition "Percentage CPU > 70" \
  --scale out 2
```

### Scaling Metrics

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU Usage | > 70% | Scale out +2 |
| Memory Usage | > 80% | Scale out +1 |
| Request Queue | > 100 | Scale out +3 |
| Response Time | > 5000ms | Scale out +2 |

### Database Scaling

```bash
# Scale Cosmos DB
az cosmosdb update \
  --name hack4hyd-cosmos \
  --resource-group hack4hyd-rg \
  --locations regionName=eastus failoverPriority=0 \
  --default-consistency-level Session

# Enable autoscale
az cosmosdb sql database update \
  --account-name hack4hyd-cosmos \
  --name ai-platform \
  --resource-group hack4hyd-rg \
  --max-throughput 10000
```

## Cost Optimization

### Cost Monitoring

```bash
# Check current costs
az cost restapi show \
  --subscription <subscription-id> \
  --query "[?resourceGroup=='hack4hyd-rg']"

# Set budget alerts
az consumption budget create \
  --amount 500 \
  --name hack4hyd-budget \
  --resource-group hack4hyd-rg \
  --time-grain Monthly \
  --start-date 2026-07-01 \
  --end-date 2026-12-31
```

### Cost Reduction Tips

1. **Use Consumption Plan**: Pay only for execution time
2. **Optimize Token Usage**: Implement prompt compression
3. **Cache Aggressively**: Reduce AI API calls
4. **Use Cheaper Models**: GPT-3.5 for simple tasks
5. **Monitor Daily**: Track token consumption

### Token Cost Tracking

```sql
-- Daily token usage
SELECT 
  DATE(timestamp) as date,
  SUM(input_tokens) as total_input,
  SUM(output_tokens) as total_output,
  SUM(input_tokens + output_tokens) as total_tokens
FROM token_usage
WHERE timestamp > DATEADD(day, -30, GETUTCDATE())
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

## Backup and Recovery

### Database Backup

```bash
# Enable continuous backup
az cosmosdb update \
  --name hack4hyd-cosmos \
  --resource-group hack4hyd-rg \
  --backup-policy-type Continuous

# Manual backup
az cosmosdb sql database backup \
  --account-name hack4hyd-cosmos \
  --name ai-platform \
  --resource-group hack4hyd-rg
```

### Recovery Procedures

1. **Data Recovery**
   ```bash
   # Restore from backup
   az cosmosdb sql database restore \
     --account-name hack4hyd-cosmos \
     --name ai-platform \
     --resource-group hack4hyd-rg \
     --restore-timestamp 2026-07-23T00:00:00Z
   ```

2. **Configuration Recovery**
   ```bash
   # Export current settings
   az functionapp config appsettings list \
     --name hack4hyd-ai \
     --resource-group hack4hyd-rg \
     --output table > settings-backup.txt
   ```
