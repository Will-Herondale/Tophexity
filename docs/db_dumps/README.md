# Tophexity Database Dumps

Full snapshot of the production PostgreSQL database (`career_path`) for the
Tophexity Career Intelligence platform, dumped on 2026-08-04.

## Files

| File | Size | Contents |
|---|---|---|
| `tophexity_core_dump.sql` | ~6.7 MB | **Recommended.** Schema for all 32 tables + full data for every table *except* `document_embeddings` (whose 13,354 vector rows are regeneratable via `scripts/rebuild_embeddings.py` against the `careers` text). |
| `tophexity_full_dump.sql.gz` | ~85 MB | Complete archive — same as core **plus** the full `document_embeddings` data. Gzipped (the raw `tophexity_full_dump.sql` is gitignored — it's ~257 MB). |
| `tophexity_counts.json` | small | Per-table row counts for the full dump. |
| `tophexity_core_counts.json` | small | Per-table row counts for the core dump. |

## Snapshot summary

- **32 tables**, **46,364 total rows**
- Knowledge base: careers 540, skills 4,782, career_skills 9,839, career_degrees 3,433, colleges 1,001, career_colleges 2,796, scholarships 1,135, career_scholarships 1,790, entrance_exams 451, career_entrance_exams 1,160, resources 1,986, career_resources 1,986, document_embeddings 13,354
- App data: users 33, profiles 8, chat_sessions 26, chat_messages 30, roadmaps 6, roadmap_steps 90, recommendations 7, backup_plans 1, generation_progress 12

## How it was produced

```bash
# full dump (all data, embeddings included)
DATABASE_URL="postgresql://tophexityadmin:***@tophexity-pg.postgres.database.azure.com:5432/career_path?sslmode=require" \
  python scripts/dump_db.py

# core dump (embeddings schema-only)
DATABASE_URL="..." DUMP_MODE=core python scripts/dump_db.py

# gzip the full dump for storage
gzip docs/db_dumps/tophexity_full_dump.sql
```

The dump script is `scripts/dump_db.py` — it emits CREATE TABLE statements, INSERT
data, and index definitions for every table in the `public` schema.

## How to restore

```bash
createdb career_path
psql -d career_path -f docs/db_dumps/tophexity_core_dump.sql
# (embeddings can be regenerated)
psql -d career_path -c "TRUNCATE document_embeddings;"
python scripts/rebuild_embeddings.py
```