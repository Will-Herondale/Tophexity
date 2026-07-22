# Frontend Workflow

This guide tells HalfPanda exactly what to build on each page, which APIs to call, in what order, and how to handle responses and errors.

---

## Base Configuration

```
Base URL: https://tophexity-func.azurewebsites.net
API Prefix: /v1
Swagger: https://tophexity-func.azurewebsites.net/docs
```

**Store in app state:**
- `accessToken` - current JWT access token
- `refreshToken` - current JWT refresh token
- `userId` - current user's UUID
- `email` - current user's email

**HTTP Client Setup:**
- Add `Authorization: Bearer {accessToken}` to all requests (except register, login, refresh, careers).
- On 401: Try `/v1/auth/refresh` with stored refresh token. If that also fails, redirect to login.
- On 422: Show validation errors from response body.

---

## Registration Page

**User sees:** Email + password form.

**API calls:**
1. `POST /v1/auth/register` with `{email, password}`
2. On success (201): Show "Account created" message, redirect to login.
3. On 409: Show "Email already registered".
4. On 422: Show field-level errors.

---

## Login Page

**User sees:** Email + password form.

**API calls:**
1. `POST /v1/auth/login` with `{email, password}`
2. On success (200): Store `access_token`, `refresh_token`, `user_id`, `email`. Redirect to dashboard.
3. On 401: Show "Invalid credentials".

---

## Dashboard

**User sees:** Welcome message, profile summary, recent recommendations, quick links.

**API calls (on page load):**
1. `GET /v1/auth/me` - Verify token, get user info.
2. `GET /v1/users/profile` - Get profile for display name/headline.
   - On 404: Show "Complete your profile" CTA, link to profile page.
3. `GET /v1/recommendations/history?page=1&page_size=3` - Show latest 3 recommendations (empty in Phase 2, will populate in Phase 3).
4. `GET /v1/portfolio/items?page=1&page_size=5` - Show recent portfolio items.

**Refresh:** Load on page visit. No auto-refresh needed.

---

## Profile Page

**User sees:** Profile form with all fields. View mode and edit mode.

**API calls:**

**On page load (view mode):**
1. `GET /v1/users/profile`
   - On 404: Show empty form (user hasn't created profile yet). Show "Create Profile" button.
   - On 200: Populate form with existing data. Show "Edit" button.

**On save (create - first time):**
1. `POST /v1/users/profile` with form data (all fields optional).
2. On 201: Switch to view mode, show "Profile created" toast.
3. On 409: Profile already exists. Use update instead.

**On save (update):**
1. `PUT /v1/users/profile` with only changed fields.
2. On 200: Switch to view mode, show "Profile updated" toast.

**Version history (optional):**
1. `GET /v1/users/profile/versions` - Show list of past snapshots.

**All profile fields:**
| Field | Type | Description |
|---|---|---|
| full_name | string | Display name |
| headline | string | Short tagline (shows on cards) |
| bio | string | Long description |
| location | string | City/country |
| avatar_url | string | Profile picture URL |
| education_level | string | "high_school", "bachelor", "master", "phd" |
| years_experience | integer | Years of experience |
| current_field | string | Current work/study field |
| target_fields | array | Desired fields (JSON) |
| skills | object | Skill -> level mapping (JSON) |
| interests | array | Interest areas (JSON) |

---

## Portfolio Page

**User sees:** Grid/list of portfolio items with add/edit/delete.

**API calls:**

**On page load:**
1. `GET /v1/portfolio/items?page=1&page_size=20`
2. Optional: `GET /v1/portfolio/items?item_type=project` to filter by type.

**On add item:**
1. Show form with: title, description, url, item_type (dropdown), skills_used.
2. `POST /v1/portfolio/items` with form data.
3. On 201: Add item to list, show success toast.

**On edit item:**
1. `PUT /v1/portfolio/items/{id}` with changed fields.
2. On 200: Update item in list.

**On delete item:**
1. Show confirmation dialog.
2. `DELETE /v1/portfolio/items/{id}`
3. On 200: Remove item from list.

**On view item:**
1. `GET /v1/portfolio/items/{id}` for full details.

**Valid item types for dropdown:**
project, hackathon, competition, certificate, research, internship, olympiad, leadership, volunteering, achievement.

**Refresh:** Load on page visit.

---

## Career Search Page

**User sees:** Search bar, filters, paginated career cards.

**API calls:**

**On page load:**
1. `GET /v1/careers?page=1&page_size=20`

**On search:**
1. `GET /v1/careers?search={query}&page=1&page_size=20`

**On filter:**
1. `GET /v1/careers?skill={skill}&degree_level={level}&demand_level={demand}&min_salary={min}&max_salary={max}&sort_by={field}&sort_order={order}`

**On career click:**
1. `GET /v1/careers/{career_id}` - Get full details (skills, degrees, colleges, exams, scholarships, resources).
2. Show detail modal/page.

**No auth required** for career endpoints.

**Note:** Career list will be empty until careers are imported. Use the data loader script or Razer's engine to populate careers.

---

## Recommendations Page

**User sees:** List of past recommendations with ranked career matches.

**API calls:**

**On page load:**
1. `GET /v1/recommendations/history?page=1&page_size=10`
2. Show empty state if no recommendations yet (Phase 2).

**On recommendation click:**
1. `GET /v1/recommendations/{id}` - Get full details with ranked items.

**Phase 3 integration:**
- After Razer's engine generates recommendations, they appear here automatically.
- Each recommendation shows: title, summary, ranked items with match scores and reasoning.

**Refresh:** Manual refresh button or load on page visit.

---

## Roadmaps Page

**User sees:** List of learning roadmaps with steps.

**API calls:**

**On page load:**
1. `GET /v1/roadmaps/history?page=1&page_size=10`
2. Show empty state if no roadmaps yet (Phase 2).

**On roadmap click:**
1. `GET /v1/roadmaps/{id}` - Get full roadmap with ordered steps.
2. Show timeline/stepper UI with steps in `step_order`.

**Each step shows:** title, description, duration_months, resources.

**Refresh:** Manual refresh or load on page visit.

---

## Backup Plans Page

**User sees:** List of backup career plans with alternative scenarios.

**API calls:**

**On page load:**
1. `GET /v1/backups/history?page=1&page_size=10`
2. Show empty state if no backup plans yet (Phase 2).

**On plan click:**
1. `GET /v1/backups/{id}` - Get full plan with all scenarios.
2. Show cards for each alternative career scenario.

**Each scenario shows:** career name, transition_difficulty (easy/medium/hard), estimated_transition_months, reasoning.

**Refresh:** Manual refresh or load on page visit.

---

## Chat Page

**User sees:** Chat interface with session list sidebar and message area.

**API calls:**

**On page load:**
1. `GET /v1/chat/sessions?page=1&page_size=50` - Show session list.

**On new chat:**
1. `POST /v1/chat/sessions` with `{title: "Career Discussion"}` (or auto-generated title).
2. On 201: Add session to sidebar, open empty chat.

**On select session:**
1. `GET /v1/chat/sessions/{session_id}` - Load all messages.
2. Display messages in chat UI.

**On send message:**
1. `POST /v1/chat/sessions/{session_id}/messages` with `[{role: "user", content: "..."}]`
2. On 201: Append user message to chat UI.
3. **Phase 3:** AI assistant response will also be returned in the same response. Display it as assistant message.
4. **Phase 2:** Only user messages are stored. No AI response yet.

**On delete session:**
1. Show confirmation dialog.
2. `DELETE /v1/chat/sessions/{session_id}`
3. On 200: Remove from sidebar.

**Refresh:** Load on page visit. Auto-scroll on new messages.

---

## Common UI Patterns

### Token Management
```
On app load:
  1. Check if accessToken exists in storage
  2. If yes: Call GET /v1/auth/me
     - 200: User is valid, proceed to dashboard
     - 401: Try POST /v1/auth/refresh
       - 200: Update tokens, retry GET /v1/auth/me
       - 401: Redirect to login
  3. If no: Redirect to login
```

### Loading States
- Show skeleton/spinner during API calls.
- Show empty state illustrations when lists are empty.
- Show error toasts for 4xx/5xx responses.

### Pagination
- Show "Load more" button or page numbers.
- Track `total_pages` from response.
- Disable "next" when `page >= total_pages`.

### Error Handling
| Status | Meaning | UI Action |
|---|---|---|
| 200 | Success | Update UI |
| 201 | Created | Add to list, show toast |
| 401 | Not authenticated | Try refresh, then redirect to login |
| 404 | Not found | Show "not found" message |
| 409 | Conflict | Show specific conflict message |
| 422 | Validation error | Show field-level errors |
| 500 | Server error | Show generic error, retry button |

---

## API Call Summary by Page

| Page | APIs Called | Auth Required |
|---|---|---|
| Registration | POST /auth/register | No |
| Login | POST /auth/login | No |
| Dashboard | GET /auth/me, GET /users/profile, GET /recommendations/history, GET /portfolio/items | Yes |
| Profile | GET/POST/PUT /users/profile, GET /users/profile/versions | Yes |
| Portfolio | GET/POST/PUT/DELETE /portfolio/items | Yes |
| Career Search | GET /careers, GET /careers/{id} | No |
| Recommendations | GET /recommendations/history, GET /recommendations/{id} | Yes |
| Roadmaps | GET /roadmaps/history, GET /roadmaps/{id} | Yes |
| Backup Plans | GET /backups/history, GET /backups/{id} | Yes |
| Chat | GET/POST /chat/sessions, GET/POST/DELETE /chat/sessions/{id}, POST /chat/sessions/{id}/messages | Yes |
