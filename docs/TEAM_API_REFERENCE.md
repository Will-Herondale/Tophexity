# Team API Reference

This document teaches you how to use the Tophexity backend. Read this before writing any code.

---

## Quick Start

**Base URL:** `https://tophexity-func.azurewebsites.net`
**API Prefix:** `/v1` (all endpoints below are relative to this)
**Swagger UI:** `https://tophexity-func.azurewebsites.net/docs` (use this to test interactively)

**Test Credentials:**
- Email: `test@test.com`
- Password: `Test1234!`

---

## Authentication

Every protected endpoint requires an `Authorization` header:

```
Authorization: Bearer <access_token>
```

You get tokens from the login endpoint. Tokens expire after 30 minutes. Use the refresh endpoint to get new tokens without re-logging in.

**If you get 401:** Your token is expired or invalid. Call `/v1/auth/refresh` with your refresh token, or re-login.

**If you get 422 on protected endpoints:** You forgot the `Authorization` header entirely.

---

## Endpoints

---

### POST /v1/auth/register

**Purpose:** Create a new user account.

**Who uses it:**
- HalfPanda: Registration page
- Razer: Never
- Backend: Never

**When to call:** When user submits the registration form.

**Request:**
```json
{
  "email": "user@example.com",       // Required. Valid email format.
  "password": "securepassword123"    // Required. 8-128 characters.
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "is_active": true,
  "is_verified": false,
  "role": "user",
  "created_at": "2026-01-01T00:00:00Z"
}
```

**What frontend does with response:** Show success, redirect to login page.

**Failure cases:**
- 409: Email already registered. Show "Email already in use" message.
- 422: Invalid email format or password too short. Show validation errors.

**Database:** Writes to `users` table.

---

### POST /v1/auth/login

**Purpose:** Get access and refresh tokens.

**Who uses it:**
- HalfPanda: Login page
- Razer: Never
- Backend: Never

**When to call:** When user submits login form. Also called after registration.

**Request:**
```json
{
  "email": "user@example.com",       // Required. Valid email.
  "password": "securepassword123"    // Required. Any length.
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",           // Use in Authorization header.
  "refresh_token": "eyJ...",          // Store securely. Used to get new access tokens.
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "user@example.com"
}
```

**What frontend does with response:** Store both tokens. Store `user_id` and `email` in app state. Redirect to dashboard.

**Failure cases:**
- 401: Wrong email or password. Show "Invalid credentials" message.

**Database:** Reads from `users` table.

---

### POST /v1/auth/refresh

**Purpose:** Get new tokens without re-logging in.

**Who uses it:**
- HalfPanda: Token refresh logic (call automatically when access token expires)
- Razer: Never
- Backend: Never

**When to call:** When you get 401 on any protected endpoint, try refresh first. Or call proactively before token expires.

**Request:**
```json
{
  "refresh_token": "eyJ..."           // Required. The refresh token from login.
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",           // New access token.
  "refresh_token": "eyJ...",          // New refresh token (old one still works too).
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "user@example.com"
}
```

**What frontend does with response:** Replace stored tokens. Retry the failed request.

**Failure cases:**
- 401: Refresh token expired (7 days). User must re-login.

**Database:** Reads from `users` table.

---

### POST /v1/auth/logout

**Purpose:** Signal logout. Backend does not track sessions server-side.

**Who uses it:**
- HalfPanda: Logout button
- Razer: Never
- Backend: Never

**When to call:** When user clicks logout.

**Request:** None (just Authorization header).

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

**What frontend does with response:** Clear all stored tokens from localStorage/cookies. Clear app state. Redirect to login page.

**Failure cases:**
- 401: Token already expired. Still clear tokens on client side.

**Database:** None.

---

### GET /v1/auth/me

**Purpose:** Get current user's account info. Useful for verifying token is valid.

**Who uses it:**
- HalfPanda: App initialization, user menu
- Razer: Never
- Backend: Never

**When to call:** On app load (to verify user is still logged in). After refresh.

**Request:** None (just Authorization header).

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "is_active": true,
  "is_verified": false,
  "role": "user",
  "created_at": "2026-01-01T00:00:00Z"
}
```

**What frontend does with response:** Populate user state. If 401, redirect to login.

**Database:** Reads from `users` table.

---

### POST /v1/users/profile

**Purpose:** Create user's detailed profile. Only one profile per user.

**Who uses it:**
- HalfPanda: Profile setup page (first-time or onboarding)
- Razer: Never
- Backend: Never

**When to call:** After user completes profile setup form. Only once per user.

**Request:**
```json
{
  "full_name": "John Doe",                    // Optional. Display name.
  "headline": "Full Stack Developer",         // Optional. Short tagline.
  "bio": "I love building things...",         // Optional. Long description.
  "location": "Hyderabad, India",             // Optional. City/country.
  "avatar_url": "https://...",                // Optional. Profile picture URL.
  "education_level": "bachelor",              // Optional. "high_school", "bachelor", "master", "phd".
  "years_experience": 3,                      // Optional. Integer.
  "current_field": "Software Engineering",    // Optional. Current work/study field.
  "target_fields": ["Data Science", "AI"],    // Optional. JSON array of desired fields.
  "skills": {"Python": 8, "React": 6},        // Optional. JSON object. Key=skill, Value=level (1-10).
  "interests": ["AI", "Cloud Computing"]      // Optional. JSON array.
}
```

**Response (201):** Same as request fields plus `id`, `user_id`, `created_at`, `updated_at`.

**What frontend does with response:** Show profile page. Store profile data in app state.

**Failure cases:**
- 401: Not logged in.
- 409: Profile already exists. Use PUT instead.

**Database:** Writes to `profiles` table. Creates `profile_versions` entry (version 1).

**Typical flow:**
```
User completes profile form
  -> POST /v1/users/profile
  -> Profile created
  -> ProfileVersion v1 created automatically
  -> Frontend shows profile page
```

---

### GET /v1/users/profile

**Purpose:** Get the current user's profile.

**Who uses it:**
- HalfPanda: Profile page, Dashboard (to show name/headline)
- Razer: To get user profile for recommendations (via internal API)
- Backend: Never

**When to call:** When opening profile page. When dashboard needs user info.

**Request:** None.

**Response (200):** Full profile object (same fields as POST response).

**Failure cases:**
- 404: Profile not found. Show "Complete your profile" prompt.

**Database:** Reads from `profiles` table.

---

### PUT /v1/users/profile

**Purpose:** Update profile. Automatically creates a version snapshot.

**Who uses it:**
- HalfPanda: Edit profile page
- Razer: Never
- Backend: Never

**When to call:** When user saves profile changes.

**Request:** Same fields as POST, all optional (only send changed fields).

**Response (200):** Updated profile object.

**What frontend does with response:** Update displayed profile. Optionally show "Profile updated" toast.

**Failure cases:**
- 404: Profile not found. Should not happen if user created profile.

**Database:** Updates `profiles` row. Creates new `profile_versions` entry with incremented version number.

**Typical flow:**
```
User edits profile and clicks Save
  -> PUT /v1/users/profile
  -> Profile row updated
  -> New ProfileVersion created (auto-incremented version number)
  -> Frontend shows updated profile
```

---

### GET /v1/users/profile/versions

**Purpose:** View history of all profile changes.

**Who uses it:**
- HalfPanda: Profile version history page (optional)
- Razer: Never
- Backend: Never

**When to call:** When user wants to see profile change history.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "version_number": 2,
    "snapshot": {"full_name": "John Doe", "headline": "Developer", ...}
  },
  {
    "id": "uuid",
    "version_number": 1,
    "snapshot": {"full_name": "John", "headline": null, ...}
  }
]
```

**What frontend does with response:** Show version list. Optionally allow comparing versions.

**Database:** Reads from `profile_versions` table.

---

### GET /v1/portfolio/items

**Purpose:** List user's portfolio items with pagination and optional type filter.

**Who uses it:**
- HalfPanda: Portfolio page
- Razer: To understand user's background for recommendations
- Backend: Never

**When to call:** When opening portfolio page.

**Query Parameters:**
- `page` (int, default 1): Page number.
- `page_size` (int, default 20, max 100): Items per page.
- `item_type` (string, optional): Filter by type. One of: `project`, `hackathon`, `competition`, `certificate`, `research`, `internship`, `olympiad`, `leadership`, `volunteering`, `achievement`.

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "My Project",
      "description": "Built a cool app",
      "url": "https://github.com/...",
      "item_type": "project",
      "skills_used": {"Python": 8, "FastAPI": 7},
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**Database:** Reads from `portfolio_items` table (filters out soft-deleted items).

---

### POST /v1/portfolio/items

**Purpose:** Add a portfolio item.

**Who uses it:**
- HalfPanda: Add portfolio item form/modal
- Razer: Never
- Backend: Never

**When to call:** When user saves a new portfolio item.

**Request:**
```json
{
  "title": "My Hackathon Project",              // Required. Max 500 chars.
  "description": "Built in 24 hours...",        // Optional.
  "url": "https://github.com/...",              // Optional.
  "item_type": "hackathon",                     // Required. Must be valid enum value.
  "skills_used": {"React": 7, "Node.js": 6}    // Optional. JSON object.
}
```

**Valid item_type values:** project, hackathon, competition, certificate, research, internship, olympiad, leadership, volunteering, achievement.

**Response (201):** Created item with `id`, `created_at`, `updated_at`.

**Failure cases:**
- 422: Invalid `item_type` value. Show dropdown with valid types.

**Database:** Writes to `portfolio_items` table.

---

### GET /v1/portfolio/items/{item_id}

**Purpose:** Get a specific portfolio item.

**Who uses it:**
- HalfPanda: Portfolio detail view
- Razer: Never
- Backend: Never

**Response (200):** Single portfolio item object.

**Failure cases:**
- 404: Item not found or belongs to another user.

---

### PUT /v1/portfolio/items/{item_id}

**Purpose:** Update a portfolio item.

**Who uses it:**
- HalfPanda: Edit portfolio item form
- Razer: Never
- Backend: Never

**Request:** Same fields as POST, all optional.

**Response (200):** Updated item.

---

### DELETE /v1/portfolio/items/{item_id}

**Purpose:** Soft-delete a portfolio item. Item is marked as deleted but not removed.

**Who uses it:**
- HalfPanda: Delete button on portfolio item
- Razer: Never
- Backend: Never

**Response (200):**
```json
{"message": "Portfolio item deleted"}
```

**Database:** Sets `deleted_at` timestamp on the row.

---

### GET /v1/careers

**Purpose:** Search and filter the career database. This is a public endpoint (no auth required).

**Who uses it:**
- HalfPanda: Career search page, Career list
- Razer: To look up career IDs before creating recommendations
- Backend: Internal data

**When to call:** When user opens career search, or types in search box.

**Query Parameters:**
- `search` (string): Full-text search in title and description.
- `skill` (string): Filter by skill name (partial match).
- `degree_level` (string): Filter by degree level (partial match).
- `demand_level` (string): Filter by demand level (partial match).
- `min_salary` (float): Minimum average salary.
- `max_salary` (float): Maximum average salary.
- `sort_by` (string, default "title"): Sort field. Options: `title`, `average_salary`, `created_at`.
- `sort_order` (string, default "asc"): `asc` or `desc`.
- `page` (int, default 1): Page number.
- `page_size` (int, default 20, max 100): Items per page.

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Software Engineer",
      "description": "Build software applications",
      "average_salary": 120000.00,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "required_education": null,
      "typical_skills": null,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

**Note:** Returns basic career info. For full details (skills, degrees, colleges, etc.), call GET /v1/careers/{id}.

**Database:** Reads from `careers` table and junction tables.

---

### GET /v1/careers/{career_id}

**Purpose:** Get full career details with all related data.

**Who uses it:**
- HalfPanda: Career detail page
- Razer: To understand career context for recommendations
- Backend: Never

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Software Engineer",
  "description": "Build software applications",
  "average_salary": 120000.00,
  "growth_outlook": "above_average",
  "demand_level": "high",
  "required_education": null,
  "typical_skills": null,
  "skills": [
    {"id": "uuid", "name": "Python", "category": "Programming"}
  ],
  "degrees": [
    {"id": "uuid", "name": "B.Tech CSE", "level": "bachelor", "field": "Computer Science"}
  ],
  "colleges": [
    {"id": "uuid", "name": "IIT Hyderabad", "location": "Hyderabad", "website": null, "ranking": 8}
  ],
  "exams": [
    {"id": "uuid", "name": "JEE Main", "description": null, "website": null}
  ],
  "scholarships": [],
  "resources": [
    {"id": "uuid", "title": "freeCodeCamp", "description": null, "url": "https://freecodecamp.org", "resource_type": "course"}
  ],
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

**Failure cases:**
- 404: Career not found.

**Database:** Reads from `careers`, `career_skills`, `skills`, `career_degrees`, `degrees`, `career_colleges`, `colleges`, `career_entrance_exams`, `entrance_exams`, `career_scholarships`, `scholarships`, `career_resources`, `resources` tables.

---

### POST /v1/careers/import

**Purpose:** Bulk import careers with all related data. Used to populate the career database.

**Who uses it:**
- HalfPanda: Admin page (optional)
- Razer: To populate career database before generating recommendations
- Backend: Data seeding

**When to call:** Once at the start, or when updating career data. Duplicate careers (by title) are skipped.

**Request:**
```json
{
  "careers": [
    {
      "title": "Software Engineer",
      "description": "Build software applications",
      "average_salary": 120000.00,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "skills": [
        {"name": "Python", "category": "Programming", "level": "intermediate", "is_required": true}
      ],
      "degrees": [
        {"name": "B.Tech CSE", "level": "bachelor", "field": "Computer Science", "is_required": false}
      ],
      "colleges": [
        {"name": "IIT Hyderabad", "location": "Hyderabad", "program_name": "B.Tech CSE"}
      ],
      "exams": [
        {"name": "JEE Main", "description": "Engineering entrance exam", "is_required": false}
      ],
      "scholarships": [
        {"name": "Merit Scholarship", "description": "For top performers", "amount": 50000}
      ],
      "resources": [
        {"title": "freeCodeCamp", "url": "https://freecodecamp.org", "resource_type": "course", "description": "Free coding courses"}
      ]
    }
  ]
}
```

**All sub-arrays (skills, degrees, colleges, exams, scholarships, resources) are optional.**

**Response (201):**
```json
{
  "imported": 1,
  "skipped": 0,
  "careers": [...]
}
```

**Database:** Writes to `careers` and all junction/reference tables. Skills, degrees, colleges, etc. are deduplicated by name.

---

### PUT /v1/careers/{career_id}

**Purpose:** Update a career entry's basic fields.

**Who uses it:**
- HalfPanda: Admin editing (if needed)
- Razer: Never
- Backend: Never

**Request:** Same fields as CareerUpdate schema, all optional.

**Response (200):** Updated career object.

---

### DELETE /v1/careers/{career_id}

**Purpose:** Delete a career and all its junction table relationships.

**Who uses it:**
- HalfPanda: Admin page (if needed)
- Razer: Never
- Backend: Never

**Response (200):**
```json
{"message": "Career deleted successfully"}
```

---

### POST /v1/recommendations

**Purpose:** Store a career recommendation (generated by Razer's AI engine).

**Who uses it:**
- HalfPanda: Never (Razer calls this internally)
- Razer: After generating recommendations from user profile
- Backend: Phase 3 will call this automatically

**When to call:** After the AI engine analyzes a user's profile and generates ranked career recommendations.

**Request:**
```json
{
  "title": "Top Career Matches for You",       // Optional. Display title.
  "summary": "Based on your skills in...",     // Optional. AI-generated summary.
  "items": [
    {
      "career_id": "uuid",                     // Required. Must exist in careers table.
      "match_score": 95.5,                     // Required. 0.0 to 100.0.
      "reasoning": "Strong match because...",  // Optional. AI explanation.
      "rank": 1                                // Required. Starting from 1.
    },
    {
      "career_id": "uuid",
      "match_score": 82.0,
      "reasoning": "Good potential...",
      "rank": 2
    }
  ]
}
```

**Response (201):** Full recommendation object with generated `id`, `status: "completed"`, and `created_at`.

**Failure cases:**
- 401: Not authenticated.
- 422: Invalid career_id, match_score out of range, or duplicate rank.

**Database:** Writes to `recommendations` and `recommendation_items` tables.

**Typical flow:**
```
User clicks "Get Recommendations"
  -> Frontend sends profile to Razer's engine (Phase 3)
  -> Razer's engine analyzes profile
  -> Razer calls POST /v1/recommendations with results
  -> Recommendation stored in database
  -> Frontend polls GET /v1/recommendations/history
  -> New recommendation appears
```

---

### GET /v1/recommendations/history

**Purpose:** List all past recommendations for the user.

**Who uses it:**
- HalfPanda: Recommendations page, Dashboard
- Razer: To verify recommendation was stored
- Backend: Never

**Query Parameters:** `page`, `page_size` (standard pagination).

**Response (200):** Paginated list of recommendations, each containing its items.

**Database:** Reads from `recommendations` and `recommendation_items` tables.

---

### GET /v1/recommendations/{recommendation_id}

**Purpose:** Get a specific recommendation with all its ranked items.

**Who uses it:**
- HalfPanda: Recommendation detail page
- Razer: Never
- Backend: Never

**Response (200):** Full recommendation with items array, each containing `career_id`, `match_score`, `reasoning`, `rank`.

**Failure cases:**
- 404: Not found or belongs to another user.

---

### POST /v1/roadmaps

**Purpose:** Store a learning roadmap (generated by Razer's AI engine).

**Who uses it:**
- HalfPanda: Never (Razer calls this)
- Razer: After generating a roadmap for a career path
- Backend: Phase 3 will call this automatically

**Request:**
```json
{
  "career_id": "uuid",                         // Required. Target career.
  "title": "Path to Cloud Architect",          // Optional.
  "description": "6-month learning plan...",   // Optional.
  "estimated_duration_months": 6,              // Optional.
  "steps": [
    {
      "title": "Learn Python Basics",          // Required. Max 500 chars.
      "description": "Complete Python course", // Optional.
      "step_order": 1,                         // Required. Starts from 1. Must be unique.
      "duration_months": 1,                    // Optional.
      "resources": {                           // Optional. JSON object.
        "courses": ["Python for Everybody"],
        "platforms": ["Coursera"]
      }
    },
    {
      "title": "Learn Cloud Fundamentals",
      "step_order": 2,
      "duration_months": 2
    }
  ]
}
```

**Response (201):** Full roadmap with `id`, `status: "active"`, `created_at`, and all steps.

**Database:** Writes to `roadmaps` and `roadmap_steps` tables.

---

### GET /v1/roadmaps/history

**Purpose:** List all past roadmaps for the user.

**Who uses it:**
- HalfPanda: Roadmaps page
- Razer: Never
- Backend: Never

**Response:** Paginated list of roadmaps with their steps.

---

### GET /v1/roadmaps/{roadmap_id}

**Purpose:** Get a specific roadmap with all its ordered steps.

**Who uses it:**
- HalfPanda: Roadmap detail page
- Razer: Never
- Backend: Never

**Response:** Full roadmap with steps array ordered by `step_order`.

---

### POST /v1/backups

**Purpose:** Store a backup career plan (generated by Razer's AI engine).

**Who uses it:**
- HalfPanda: Never (Razer calls this)
- Razer: After generating alternative career scenarios
- Backend: Phase 3 will call this automatically

**Request:**
```json
{
  "title": "Alternative Career Paths",           // Optional.
  "description": "If primary path doesn't work...", // Optional.
  "scenarios": [
    {
      "career_id": "uuid",                       // Required. Alternative career.
      "scenario_name": "Switch to Data Science", // Required. Max 500 chars.
      "description": "Leverage coding skills...", // Optional.
      "transition_difficulty": "medium",          // Optional. "easy", "medium", "hard".
      "estimated_transition_months": 6,           // Optional.
      "reasoning": "Your Python skills transfer..." // Optional.
    }
  ]
}
```

**Response (201):** Full backup plan with `id`, `status: "active"`, `created_at`, and all scenarios.

**Database:** Writes to `backup_plans` and `backup_scenarios` tables.

---

### GET /v1/backups/history

**Purpose:** List all past backup plans.

**Who uses it:**
- HalfPanda: Backup Plans page
- Razer: Never
- Backend: Never

**Response:** Paginated list of backup plans with their scenarios.

---

### GET /v1/backups/{plan_id}

**Purpose:** Get a specific backup plan with all its alternative scenarios.

**Who uses it:**
- HalfPanda: Backup plan detail page
- Razer: Never
- Backend: Never

**Response:** Full backup plan with scenarios array.

---

### POST /v1/chat/sessions

**Purpose:** Start a new AI chat session.

**Who uses it:**
- HalfPanda: Chat page (when user starts new conversation)
- Razer: Never
- Backend: Phase 3 will handle AI responses

**Request:**
```json
{
  "title": "Career Guidance"                     // Optional. Display title.
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Career Guidance",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### GET /v1/chat/sessions

**Purpose:** List all chat sessions.

**Who uses it:**
- HalfPanda: Chat sidebar/history
- Razer: Never
- Backend: Never

**Response:** Paginated list of sessions (without messages).

---

### GET /v1/chat/sessions/{session_id}

**Purpose:** Get a chat session with all its messages.

**Who uses it:**
- HalfPanda: Chat page (when opening a conversation)
- Razer: Never
- Backend: Never

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Career Guidance",
  "created_at": "2026-01-01T00:00:00Z",
  "messages": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "role": "user",
      "content": "What career should I pursue?",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### POST /v1/chat/sessions/{session_id}/messages

**Purpose:** Add messages to a chat session.

**Who uses it:**
- HalfPanda: Chat input (sends user message, displays assistant response)
- Razer: Never
- Backend: Phase 3 will generate AI responses here

**Request:** Array of messages:
```json
[
  {"role": "user", "content": "What careers match my skills?"},
  {"role": "assistant", "content": "Based on your profile..."}   // Phase 3: auto-generated
]
```

**Valid roles:** `user`, `assistant`, `system`.

**Response (201):** Array of created message objects.

**Phase 3 behavior:** When a `user` message is sent, the backend will automatically generate an `assistant` response using AI. Currently, only manual messages are stored.

---

### DELETE /v1/chat/sessions/{session_id}

**Purpose:** Delete a chat session and all its messages.

**Who uses it:**
- HalfPanda: Delete button on chat session
- Razer: Never
- Backend: Never

**Response (200):**
```json
{"message": "Chat session deleted"}
```

---

## Common Patterns

### Pagination

All list endpoints return the same format:
```json
{
  "items": [...],
  "total": 100,         // Total items across all pages
  "page": 1,            // Current page (1-indexed)
  "page_size": 20,      // Items per page
  "total_pages": 5      // Total number of pages
}
```

### Error Format

All errors return:
```json
{
  "detail": "Human-readable error message"
}
```

Validation errors (422) return more detail:
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    }
  ]
}
```

### Database UUIDs

All entity IDs are UUID v4 strings: `"550e8400-e29b-41d4-a716-446655440000"`

---

## Common Mistakes

1. **Sending `full_name` during registration.** The register endpoint only accepts `email` and `password`. Create a profile afterwards with POST /v1/users/profile.

2. **Forgetting Authorization header.** All endpoints except `/health`, `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/refresh`, and `/v1/careers` require authentication.

3. **Using wrong status codes to check success.** Always check: 200 = OK, 201 = Created, 401 = Not authenticated, 404 = Not found, 409 = Conflict, 422 = Validation error.

4. **Sending full object on update.** PUT endpoints accept partial updates. Only send fields that changed.

5. **Not handling token expiry.** Access tokens expire in 30 minutes. Implement automatic refresh using `/v1/auth/refresh`.

---

## Rate Limits

No server-side rate limiting is implemented in Phase 2. Frontend should implement reasonable request throttling (e.g., debounce search inputs).

---

## Permissions

- **Unauthenticated:** Can access `/health`, `/v1/auth/*` (register, login, refresh), `/v1/careers` (read-only).
- **Authenticated:** Can access all other endpoints. Users can only access their own data (profile, portfolio, recommendations, roadmaps, backups, chat).
- **Admin role:** Not yet implemented. The `role` field exists but is not checked.
