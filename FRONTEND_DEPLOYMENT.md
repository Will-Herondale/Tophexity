# Tophexity Frontend Deployment

## Project Detected
- **Repository:** https://github.com/Will-Herondale/Tophexity.git (branch `halfpanda`)
- **Workspace:** `C:\DefaultStuff\hack4hyd\Tophexity-Frontend`
- **Project name:** career-recommendation (v0.1.0)

## Framework
- **Framework:** Next.js 16.2.11 (App Router, Turbopack)
- **React:** 19.2.4
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 (via @tailwindcss/postcss)
- **HTTP client:** axios 1.18.1
- **Animations:** framer-motion 12
- **Icons:** lucide-react

## Build Process
- **Package manager:** npm 11.6.1 (package-lock.json present)
- **Node:** v24.10.0
- **Build command:** `npm run build` (`next build`)
- **Output:** Static + dynamic pages generated (16 routes), standalone build produced in `.next/`
- **Build status:** SUCCESS (0 errors, 0 warnings)

## Deployment Process
- Tested `https://tophexity-func.azurewebsites.net` endpoints — live and reachable.
- No existing frontend hosting resource in Azure; created new App Service (Linux/Node) to support Next.js SSR + rewrites proxy (Static Web Apps cannot run `next start` middleware).
- Deployed prebuilt `.next` + `public` + source via zip deploy; Oryx installed Linux dependencies and skipped rebuild (BUILD_COMMAND override). Deployment successful.

## Azure Resources Used
| Resource | Name | Group | Region | Notes |
|---|---|---|---|---|
| App Service Plan (Linux, B1) | `tophexity-frontend-plan` | tophexity-rg | centralindia | Created for frontend |
| Web App (Node 22 LTS) | `tophexity-frontend` | tophexity-rg | centralindia | Created for frontend |
| (existing) Function App | `tophexity-func` | tophexity-rg | centralindia | Backend (unchanged) |
| (existing) PostgreSQL | `tophexity-pg` | tophexity-rg | centralindia | Backend DB (unchanged) |
| (existing) Storage | `tophexitysa` | tophexity-rg | centralindia | Backend storage (unchanged) |

**Subscription:** Visual Studio Enterprise Subscription (a1ee9903-7c4d-4e4a-a18c-6283adfdfeb8)

## Environment Variables
| Variable | Value | Where |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://tophexity-func.azurewebsites.net` | `.env.local` + Azure app setting |
| (rewrites proxy) | `/v1/* -> https://tophexity-func.azurewebsites.net/v1/*` | `next.config.ts` |

No secrets stored — auth tokens kept client-side in `localStorage`; API requests proxied through Next.js rewrites to avoid CORS and credential exposure.

## URLs
| Item | URL |
|---|---|
| Frontend | https://tophexity-frontend.azurewebsites.net |
| Backend | https://tophexity-func.azurewebsites.net |
| Backend health/base | https://tophexity-func.azurewebsites.net/v1/* |

## Backend Connectivity Verification
| Path | Status |
|---|---|
| `GET /v1/careers` | 200 OK (15KB JSON) |
| `POST /v1/auth/login` | 405 (endpoint live, GET disallowed) |
| `POST /v1/recommendations` | 405 (live, POST expected) |
| `POST /v1/roadmaps` | 405 (live, POST expected) |
| `POST /v1/portfolio` | 405 (live, POST expected) |

Proxy verified via frontend host: `https://tophexity-frontend.azurewebsites.net/v1/careers` -> 200 OK (proxied to backend).

## Frontend Verification
| Check | Result |
|---|---|
| Frontend root loads (`/`) | 200 OK (55KB) |
| Login page (`/login`) | 200 OK (14KB) |
| Register page (`/register`) | 200 OK (16KB) |
| Auth-protected routes redirect `/chat`, `/portfolio`, `/recommendations`, `/roadmaps`, `/careers`, `/dashboard` | 307 redirect to login (expected) |
| API proxy `/v1/careers` | 200 OK (15KB from backend) |
| Static assets | present in `/public`, served |
| Build warnings | none |
| Runtime errors | none |

## Troubleshooting
- **504 on `az webapp deploy`:** Synchronous deploy API timed out because the B1 plan + Oryx `npm install` took ~10 min. The command returned 504 but the deploy continued server-side and finished successfully. Check with `az webapp log deployment show -n tophexity-frontend -g tophexity-rg`. For future deploys, wait and poll logs rather than retrying.
- **`az webapp config set` quoting issue:** The `--linux-fx-version "NODE|22-lts"` flag was misquoted by PowerShell; the runtime was already set during `webapp create` so no correction was needed.
- **First site request timeouts after deploy:** Container was still warming up. Resolved after ~20s; subsequent requests return 200.
- **`SCM_DO_BUILD_DURING_DEPLOYMENT`:** Kept `true` so Oryx performs `npm install` (installs Linux-compatible @next/swc). `BUILD_COMMAND=echo skip-build-prebuilt` skips a second `next build` since the app was already built locally.
- **No Static Web App used:** Next.js 16 uses middleware/rewrites that require a Node server (`next start`), unsupported by Azure Static Web Apps. App Service (Linux/Node) chosen instead.

## Issues Fixed
- None required during setup — build succeeded on first attempt. Backend URLs were already correct pointing at `https://tophexity-func.azurewebsites.net`; no placeholder replacement was needed.

## Remaining Issues
- None. Optional: pin the deploy to avoid the 504 by pre-installing `node_modules` (Linux) or upgrading the App Service plan to P1v3 for faster deploys.