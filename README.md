# Tophexity — AI-Powered Career Guidance Platform

Tophexity is a full-stack web application that provides AI-driven career recommendations, learning roadmaps, and personalized guidance for both students (8th grade through college) and working professionals looking to pivot careers.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Integration](#api-integration)
- [Theme System](#theme-system)
- [Screenshots](#screenshots)

## Overview

Career guidance is often inaccessible to those who need it most. Tophexity solves this by combining AI-powered personalized recommendations with comprehensive career pathway mapping — from required education and entrance exams to colleges, scholarships, and learning resources. The platform serves a dual audience: students exploring career options and professionals seeking career transitions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| HTTP Client | Axios |
| Backend API | Python FastAPI (Azure Functions) |
| AI Model | GPT-5 (via Azure OpenAI) |
| Hosting | Vercel (Frontend) + Azure (Backend) |

## Features

### Profile System
- 5-step profile stepper: About You, Education, Experience, Skills, Goals
- Avatar picker with initials auto-generation and file upload
- Skills with proficiency levels (beginner/intermediate/advanced/expert)
- Work history, certifications, target fields, and interests
- Profile version history with diff highlighting
- Auto-detection of profile completeness triggering recommendation generation

### Career Explorer
- Paginated career listing with search and advanced filters
- Filter by skill, education level, demand level, salary range
- Expandable career cards showing education requirements, skills, salary, demand, and growth outlook
- Full career detail modal with required education, skills, degrees, recommended colleges, entrance exams, scholarships, and resources
- Malformed URL normalization for external resource links

### Favorites & AI Integration
- Heart toggle to save/unsave careers (localStorage persistence)
- "Saved" tab on careers page for quick access
- "Ask AI" button on career cards and detail modal — opens chat with career context pre-filled
- Multi-career selection mode with comparison feature
- Auto-redirect to AI recommendations when profile is complete

### AI Chat
- Full session management: create, rename, pin, archive, delete
- Chat sidebar with search and session filtering
- Thinking indicator with elapsed timer and rotating tips
- Retry button on failed messages (120s timeout for AI responses)
- Rebuild memory and export features
- Pre-filled context from career pages and recommendation prompts

### Career Recommendations
- AI-generated career matches based on user profile
- Match scores with reasoning for each recommendation
- Ranked career items with detailed career links
- Manual generation via chat or automatic on profile completion

### Learning Roadmaps
- Step-by-step learning paths tied to specific careers
- Pause, resume, and cancel controls
- Status badges (Active, Paused, Cancelled)
- Duration tracking and resource links per step

### Backup Plans
- Alternative career paths when primary recommendations don't work out
- Cancel functionality with confirmation dialog
- Status tracking

### Portfolio
- 17 item types: internship, project, volunteer, certification, coursework, hackathon, research, leadership, contract, freelance, publication, speaking, award, open_source, consulting
- CRUD operations with create/edit/delete modals

### Admin Panel
- Secret code gate (BEFOREGTA6) for admin access
- JSON career import from file or clipboard
- Edit career details with form validation
- Delete careers with confirmation

### Theme System
- Light, Dark, and System theme modes
- Visual theme picker in settings
- Customizable sidebar navigation
- Full dark mode with glow effects and accent colors

### Settings
- Theme selection with live preview
- Notification preferences
- Sidebar customization (show/hide/reorder nav items)

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Vercel)                │
│  Next.js 16 + React 19 + TypeScript + Tailwind   │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Pages    │  │Components│  │  Contexts     │   │
│  │  (Routes) │  │  (UI)    │  │  (Auth/Theme) │   │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       └──────────────┼───────────────┘            │
│                      │                            │
│              ┌───────┴────────┐                   │
│              │   API Layer    │                   │
│              │   (Axios)      │                   │
│              └───────┬────────┘                   │
└──────────────────────┼────────────────────────────┘
                       │  HTTPS
┌──────────────────────┼────────────────────────────┐
│              Backend (Azure Functions)              │
│  Python FastAPI + GPT-5 + RAG Pipeline             │
│                                                     │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Auth    │  │Careers   │  │  AI Engine       │  │
│  │  JWT     │  │CRUD + AI │  │  Chat/Rec/Roadmap│  │
│  └─────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page (VT-style design)
│   ├── layout.tsx                # Root layout with theme script
│   ├── globals.css               # Theme tokens and animations
│   ├── login/page.tsx            # Login page
│   ├── register/page.tsx         # Register page
│   ├── dashboard/page.tsx        # Dashboard overview
│   ├── profile/page.tsx          # Profile management
│   ├── careers/
│   │   ├── page.tsx              # Career explorer with favorites
│   │   └── admin/page.tsx        # Admin panel (gated)
│   ├── chat/page.tsx             # AI chat with sessions
│   ├── recommendations/
│   │   ├── page.tsx              # Recommendations list
│   │   └── [id]/page.tsx         # Recommendation detail
│   ├── roadmaps/
│   │   ├── page.tsx              # Roadmaps list
│   │   └── [id]/page.tsx         # Roadmap detail
│   ├── backups/
│   │   └── [id]/page.tsx         # Backup plan detail
│   ├── portfolio/page.tsx        # Portfolio management
│   └── settings/page.tsx         # Settings & customization
├── components/
│   ├── careers/                  # CareerCard, CareerDetailModal, CareerFilters
│   ├── chat/                     # ChatArea, ChatSidebar, ChatMessage, ChatExportModal
│   ├── profile/                  # ProfileEdit, ProfileView, ProfileVersionHistory, SkillsInput
│   ├── recommendations/          # RecommendationCard
│   ├── roadmaps/                 # RoadmapCard
│   ├── backups/                  # BackupPlanCard
│   ├── portfolio/                # PortfolioItemCard, PortfolioItemForm
│   ├── settings/                 # SettingsForm, NavCustomizer
│   ├── nav/                      # Sidebar
│   └── ui/                       # Button, Card, Input, Modal, AvatarPicker
├── contexts/
│   ├── AuthContext.tsx            # Authentication state & JWT management
│   └── SettingsContext.tsx        # UI preferences & navigation
├── hooks/
│   └── useFavorites.ts           # localStorage favorites management
├── lib/
│   ├── api.ts                    # All API functions with interceptors
│   └── constants.ts              # App config, education levels, portfolio types
└── types/
    ├── auth.ts                   # Auth types (tokens, login, register)
    ├── career.ts                 # Career, CareerDetail, CareerResource
    ├── chat.ts                   # ChatSession, ChatMessage, ChatStats
    ├── profile.ts                # Profile, PreviousRole, Certification
    ├── recommendation.ts         # Recommendation, RecommendationItem
    ├── roadmap.ts                # Roadmap, RoadmapStep
    ├── backup.ts                 # BackupPlan, BackupPlanItem
    ├── portfolio.ts              # PortfolioItem (17 types)
    └── settings.ts               # UserSettings, NavItem
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/Will-Herondale/Tophexity.git
cd Tophexity
npm install
```

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=https://tophexity-func.azurewebsites.net
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

### Test Credentials

- Email: `test@test.com`
- Password: `Test1234!`

## API Integration

All API calls go through a centralized Axios instance (`src/lib/api.ts`) with:

- Automatic JWT token injection (Bearer header)
- Token refresh on 401 responses (skips auth endpoints)
- 120-second timeout for AI-powered endpoints
- Response unwrapping for wrapped endpoints (`{ value: [...] }`)

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/auth/login` | POST | User login |
| `/v1/auth/register` | POST | User registration |
| `/v1/users/profile` | GET/PUT | Profile CRUD |
| `/v1/careers` | GET | Career search with filters |
| `/v1/careers/{id}` | GET | Career detail |
| `/v1/recommendations/history` | GET | Recommendation history |
| `/v1/chat/sessions` | GET/POST | Chat session management |
| `/v1/chat/sessions/{id}/messages` | POST | Send messages (120s timeout) |
| `/v1/roadmaps/history` | GET | Roadmap history |
| `/v1/backups/history` | GET | Backup plan history |
| `/v1/portfolio/items` | GET/POST | Portfolio management |
| `/v1/ai/test` | POST | AI health check |

## Theme System

Tophexity uses Tailwind CSS v4's `@theme` directive for token-based theming. Dark mode overrides are applied via `html.dark` selector. An inline script in `layout.tsx` prevents flash of unstyled content (FOUC) by applying the theme class before React hydration.

**Color tokens:** `background`, `foreground`, `surface`, `accent`, `border`, `text-secondary`, `text-muted`

**Dark mode:** Full override with custom glow effects, accent lighting, and gradient backgrounds.

## License

Private project — All rights reserved.
