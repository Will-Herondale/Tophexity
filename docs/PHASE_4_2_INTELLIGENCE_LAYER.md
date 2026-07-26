# Phase 4.2 Intelligence Layer

## What is included

- Vector storage with pgvector in PostgreSQL (`document_embeddings`, `embedding_jobs`)
- Chunking pipeline for careers, skills, degrees, colleges, scholarships, and exams
- Embedding generation using Azure OpenAI `text-embedding-3-small`
- Semantic and hybrid retrieval APIs
- AI recommendation, roadmap, and backup generation with knowledge context
- Chat RAG integration via `ContextBuilder.load_rag_context()`

## New API routes

All routes are under `/v1/intelligence`:

- `GET /recommendations`
- `GET /recommendations/{recommendation_id}`
- `POST /recommendations/generate`
- `POST /recommendations/{recommendation_id}/regenerate`
- `POST /compare`
- `GET /roadmaps`
- `GET /roadmaps/{roadmap_id}`
- `POST /roadmaps/generate`
- `POST /roadmaps/{roadmap_id}/regenerate`
- `GET /backups`
- `GET /backups/{backup_id}`
- `POST /backups/generate`
- `POST /search/semantic`
- `POST /search/hybrid`
- `POST /search/debug`
- `GET /embeddings/status`
- `POST /embeddings/rebuild`
- `GET /embeddings/jobs/{job_id}`

## Embedding rebuild runbook

Start rebuild:

```powershell
python scripts/rebuild_embeddings.py
```

Background rebuild with logs:

```powershell
Start-Process -FilePath "python" -ArgumentList "scripts/rebuild_embeddings.py" -WorkingDirectory "C:\DefaultStuff\hack4hyd" -RedirectStandardOutput "C:\DefaultStuff\hack4hyd\logs\rebuild_embeddings_live.log" -RedirectStandardError "C:\DefaultStuff\hack4hyd\logs\rebuild_embeddings_live.err"
```

Monitor logs:

```powershell
Get-Content -Path "C:\DefaultStuff\hack4hyd\logs\rebuild_embeddings_live.log" -Tail 50
```

Check active rebuild process:

```powershell
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*rebuild_embeddings.py*' } | Select-Object ProcessId, CreationDate
```

## Throughput notes

- Azure deployment capacity was increased to `10`
- Current embedding request settings:
  - `EMBEDDING_REQUEST_BATCH_SIZE = 8`
  - `EMBEDDING_REQUEST_DELAY_SECONDS = 2.5`
- 429 handling reads `retry-after-ms` when available and retries up to 5 times

## Validation

- Full test suite: `266 passed`
- Intelligence tests: `36 passed`
- Deployment completed successfully to `https://tophexity-func.azurewebsites.net`
- OpenAPI includes intelligence paths
