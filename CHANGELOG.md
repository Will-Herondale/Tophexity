# Changelog

## [1.0.0-rc2] — 2026-07-28

### Fixed
- CORS origins now include production Azure frontend domain
- Frontend API functions no longer include dead code (`createRecommendation`, `testAi`)
- Removed duplicate list/detail endpoints from intelligence router (redundant with CRUD routers)
- Consolidated `generate_json` and `generate` methods in AI client
- Centralized career fuzzy-lookup pattern into shared utility
- Bulk-delete chat messages instead of row-by-row in session deletion
- Removed unused `get_career_context_for_ai` helper from retrieval engine
- Cleaned unused imports across all backend modules

### Removed
- Dead config `RECOMMENDATION_SERVICE_URL` (unused)
- Dead config property `jwt_secret_is_default` (always false)
- Redundant `get_current_active_user` dependency (passthrough to `get_current_user`)
- Dead frontend API functions (`createRecommendation`, `testAi`)
- `careers_9_20.py` and `do_deploy.ps1` from version control
- Duplicate `next.config.ts` in repository root

### Changed
- `AIClient.generate()` now handles both plain text and JSON generation
- `find_career_by_title()` used in recommendation and backup engines
- `delete_chat_session` uses `DELETE FROM` instead of per-row deletion
- `config.py`: CORS_ORIGINS defaults include Azure App Service URL

### Security
- Verified no secrets in git history
- Verified `.env` and `api_key.txt` are not tracked
- Maintained prompt injection and jailbreak detection

## [1.0.0-rc1] — 2026-07-28

### Added
- Complete RC1 feature set
- Azure Function App + Azure App Service deployment
- AI 503 error fix — three root causes resolved
- Frontend API integration for recommendations, roadmaps, backups
- Standalone Next.js build for Azure deployment
- Backend and frontend verified healthy in production
