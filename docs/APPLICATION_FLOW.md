# Application Flow

This document describes the complete user journey through Tophexity. It clearly marks what works now (Phase 2) and what requires AI integration (Phase 3).

---

## User Journey

```
1. User discovers Tophexity
   |
   v
2. Registration (Phase 2 - WORKING)
   |  POST /v1/auth/register
   |  User provides email + password
   |  Account created
   |
   v
3. Login (Phase 2 - WORKING)
   |  POST /v1/auth/login
   |  User receives access_token + refresh_token
   |  Tokens stored in browser (localStorage or secure cookie)
   |
   v
4. Profile Setup (Phase 2 - WORKING)
   |  POST /v1/users/profile
   |  User fills: name, headline, bio, education, skills, interests
   |  Profile created + version history started
   |
   v
5. Explore Careers (Phase 2 - WORKING)
   |  GET /v1/careers (search, filter, paginate)
   |  GET /v1/careers/{id} (full details: skills, degrees, colleges, etc.)
   |  User browses 27+ careers in the database
   |
   v
6. Build Portfolio (Phase 2 - WORKING)
   |  POST /v1/portfolio/items (add projects, hackathons, certs, etc.)
   |  GET /v1/portfolio/items (view all, filter by type)
   |  PUT /v1/portfolio/items/{id} (edit)
   |  DELETE /v1/portfolio/items/{id} (soft delete)
   |  User showcases their work and achievements
   |
   v
7. Get AI Recommendations (Phase 3 - PENDING)
   |  [AI Engine analyzes profile + portfolio]
   |  POST /v1/recommendations (AI stores results)
   |  GET /v1/recommendations/history (user views recommendations)
   |  User sees ranked career matches with match scores and reasoning
   |
   v
8. View Learning Roadmap (Phase 3 - PENDING)
   |  [AI Engine generates step-by-step plan]
   |  POST /v1/roadmaps (AI stores roadmap)
   |  GET /v1/roadmaps/{id} (user views ordered steps)
   |  User sees learning path with resources and timelines
   |
   v
9. Explore Backup Plans (Phase 3 - PENDING)
   |  [AI Engine generates alternatives]
   |  POST /v1/backups (AI stores backup plans)
   |  GET /v1/backups/{id} (user views alternative scenarios)
   |  User sees "what if" career alternatives
   |
   v
10. Chat with AI (Phase 3 - PENDING)
    |  POST /v1/chat/sessions (start conversation)
    |  POST /v1/chat/sessions/{id}/messages (send messages)
    |  [AI generates responses in Phase 3]
    |  User gets personalized career guidance
    |
    v
11. Track Progress (Phase 2 - WORKING)
    |  GET /v1/users/profile/versions (profile change history)
    |  User can see how their profile evolved over time
```

---

## What Works Now (Phase 2)

| Feature | Status | Notes |
|---|---|---|
| Registration | Working | Email + password only |
| Login | Working | JWT access + refresh tokens |
| Token Refresh | Working | 30min access, 7-day refresh |
| Logout | Working | Client-side token clearing |
| Profile CRUD | Working | Create, read, update, version history |
| Portfolio CRUD | Working | 10 item types, soft delete, filtering |
| Career Database | Working | 27+ careers, search, filter, full details |
| Career Import | Working | Bulk import with deduplication |
| Recommendations Storage | Working | API ready, needs AI engine to populate |
| Roadmap Storage | Working | API ready, needs AI engine to populate |
| Backup Plans Storage | Working | API ready, needs AI engine to populate |
| Chat Sessions | Working | Session management, message storage |
| Chat AI Responses | Pending | Phase 3 - needs Azure OpenAI integration |
| Swagger Documentation | Working | Interactive API explorer at /docs |

---

## What Requires Phase 3 (AI Integration)

### 7a. Recommendation Generation
- Razer's engine receives user profile + portfolio
- Analyzes skills, interests, education, experience
- Returns ranked career matches with scores and reasoning
- Backend stores via POST /v1/recommendations

### 7b. Roadmap Generation
- Razer's engine receives selected career path
- Generates step-by-step learning plan
- Includes resources, timelines, prerequisites
- Backend stores via POST /v1/roadmaps

### 7c. Backup Plan Generation
- Razer's engine considers alternative career paths
- Generates "what if" scenarios
- Includes transition difficulty and timeline
- Backend stores via POST /v1/backups

### 7d. AI Chat
- User sends natural language questions
- AI generates personalized career guidance
- Responses stored in chat session
- Phase 3: POST /v1/chat/sessions/{id}/messages will trigger AI response

---

## Data Flow Summary

```
Frontend (HalfPanda)          Backend (Tophexity)           AI Engine (Razer)
       |                            |                              |
       |-- Register/Login --------->|                              |
       |<-- Tokens ----------------|                              |
       |                            |                              |
       |-- Create Profile --------->|                              |
       |<-- Profile Created --------|                              |
       |                            |                              |
       |-- Add Portfolio ---------->|                              |
       |<-- Items Stored -----------|                              |
       |                            |                              |
       |-- Browse Careers --------->|                              |
       |<-- Career List ------------|                              |
       |                            |                              |
       |-- Request Recs (UI) ------>|-- Send Profile to AI ------->|
       |                            |<-- Recommendations ---------|
       |                            |-- POST /recommendations ---->|
       |<-- View Recs --------------|                              |
       |                            |                              |
       |-- View Roadmap ----------->|-- Request from AI ---------->|
       |                            |<-- Roadmap Data -------------|
       |                            |-- POST /roadmaps ----------->|
       |<-- Roadmap Steps ----------|                              |
       |                            |                              |
       |-- View Backups ----------->|-- Request from AI ---------->|
       |                            |<-- Backup Plans -------------|
       |                            |-- POST /backups ------------>|
       |<-- Backup Scenarios -------|                              |
       |                            |                              |
       |-- Chat Messages ---------->|                              |
       |                            |-- AI generates response ---->|
       |<-- AI Response ------------|                              |
```

---

## Token Lifecycle

```
Register -> Login -> [Access Token (30min)] -> API calls
                    [Refresh Token (7 days)] -> get new Access Token
                    Token expired? -> Use Refresh Token -> get new tokens
                    Refresh expired? -> Redirect to Login
```

---

## Key Design Decisions

1. **One profile per user:** Users create exactly one profile. Updates create version snapshots automatically.

2. **Soft delete for portfolio:** Portfolio items are soft-deleted (marked with `deleted_at` timestamp). They don't appear in lists but remain in the database.

3. **Hard delete for chat:** Chat sessions and messages are permanently deleted.

4. **Career deduplication:** Careers are deduplicated by title during import. Skills, degrees, colleges are shared across careers via junction tables.

5. **No server-side sessions:** JWT tokens are stateless. Logout is client-side (discard tokens). The backend does not maintain session state.

6. **AI calls are store-only:** The backend stores AI-generated recommendations, roadmaps, and backup plans. The AI engine calls the backend to store results. The frontend reads stored results.
