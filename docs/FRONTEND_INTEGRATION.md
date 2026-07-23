# Frontend Integration Guide

This guide covers how HalfPanda should integrate with the Tophexity backend for each frontend page/feature.

**Base URL:** `https://tophexity-func.azurewebsites.net`

---

## Token Management

### Storage

```javascript
// After login, store tokens in localStorage (or sessionStorage for higher security)
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);
localStorage.setItem('user_id', data.user_id);
localStorage.setItem('user_email', data.email);
```

### Attaching Token to Requests

```javascript
function authHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
```

### Token Refresh

```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch(`${BASE_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) {
    // Refresh token expired, redirect to login
    logout();
    return null;
  }
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  return data.access_token;
}
```

### Automatic Token Refresh Wrapper

```javascript
async function apiFetch(url, options = {}) {
  let response = await fetch(url, options);

  // If 401, try refreshing the token once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      window.location.href = '/login';
      return response;
    }
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${newToken}`,
    };
    response = await fetch(url, options);
  }

  return response;
}
```

### Logout

```javascript
function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
  window.location.href = '/login';
}
```

---

## Error Handling Patterns

```javascript
async function handleApiCall(url, options = {}) {
  try {
    const response = await apiFetch(url, options);

    if (!response.ok) {
      const error = await response.json();
      switch (response.status) {
        case 401:
          // Token expired or invalid
          logout();
          break;
        case 404:
          showNotification('Resource not found', 'error');
          break;
        case 409:
          showNotification(error.detail || 'Resource already exists', 'warning');
          break;
        case 422:
          showNotification('Validation error: ' + error.detail, 'error');
          break;
        default:
          showNotification(error.detail || 'An error occurred', 'error');
      }
      return null;
    }

    return await response.json();
  } catch (err) {
    showNotification('Network error. Please try again.', 'error');
    return null;
  }
}
```

---

## 1. Landing Page

**Authentication:** No

**Endpoint:** `GET /health`

**When to call:** On page load.

**Purpose:** Display API status or use as a liveness check.

```javascript
async function checkHealth() {
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();
  // data: { "status": "healthy", "version": "0.1.0" }
}
```

---

## 2. Registration Page

**Authentication:** No

**Endpoint:** `POST /v1/auth/register`

**When to call:** On registration form submit.

**Request:**

```javascript
async function register(email, password, fullName) {
  const response = await fetch(`${BASE_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password,
      full_name: fullName || null,
    }),
  });

  if (response.status === 409) {
    showNotification('Email already registered', 'error');
    return null;
  }

  const data = await response.json();
  // data: { id, email, is_active, is_verified, role, created_at }
  return data;
}
```

**Post-registration:** Redirect to login page.

---

## 3. Login Page

**Authentication:** No

**Endpoint:** `POST /v1/auth/login`

**When to call:** On login form submit.

```javascript
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 401) {
    showNotification('Invalid email or password', 'error');
    return null;
  }

  const data = await response.json();
  // data: { access_token, refresh_token, token_type, user_id, email }

  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user_id', data.user_id);
  localStorage.setItem('user_email', data.email);

  return data;
}
```

**Post-login:** Redirect to dashboard.

---

## 3b. Forgot Password (No Auth)

**Endpoint:** `POST /v1/auth/forgot-password`

**When to call:** When user clicks "Forgot password?" on the login page.

```javascript
async function forgotPassword(email) {
  const response = await fetch(`${BASE_URL}/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  // Always shows success to prevent email enumeration
  showNotification('If the email exists, a reset link has been sent', 'info');
  return data;
}
```

---

## 3c. Reset Password (No Auth)

**Endpoint:** `POST /v1/auth/reset-password`

**When to call:** When user submits a new password from the reset password page (token in URL query params).

```javascript
async function resetPassword(token, newPassword) {
  const response = await fetch(`${BASE_URL}/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  if (response.status === 400) {
    showNotification('Invalid or expired reset token', 'error');
    return false;
  }

  const data = await response.json();
  showNotification('Password reset successfully', 'success');
  return true;
}
```

---

## 4. Dashboard (Requires Auth)

**Authentication:** Yes

**Endpoints to call on page load:**

1. `GET /v1/auth/me` - Get current user info
2. `GET /v1/users/profile` - Get profile (may 404 if not created yet)
3. `GET /v1/recommendations/history?page_size=5` - Latest recommendations
4. `GET /v1/roadmaps/history?page_size=3` - Latest roadmaps
5. `GET /v1/backups/history?page_size=3` - Latest backup plans

```javascript
async function loadDashboard() {
  const [user, profile, recs, roadmaps, backups] = await Promise.all([
    handleApiCall(`${BASE_URL}/v1/auth/me`),
    handleApiCall(`${BASE_URL}/v1/users/profile`),
    handleApiCall(`${BASE_URL}/v1/recommendations/history?page_size=5`),
    handleApiCall(`${BASE_URL}/v1/roadmaps/history?page_size=3`),
    handleApiCall(`${BASE_URL}/v1/backups/history?page_size=3`),
  ]);

  if (profile === null) {
    showNotification('Please complete your profile', 'info');
    // Redirect to profile setup
  }

  return { user, profile, recs, roadmaps, backups };
}
```

---

## 5. Profile Setup / Edit

**Authentication:** Yes

### Check if profile exists

```javascript
async function checkProfile() {
  const response = await apiFetch(`${BASE_URL}/v1/users/profile`);
  if (response.status === 404) return null;
  return await response.json();
}
```

### Create profile (if none exists)

```javascript
async function createProfile(profileData) {
  const response = await apiFetch(`${BASE_URL}/v1/users/profile`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(profileData),
  });

  if (response.status === 409) {
    showNotification('Profile already exists. Use update instead.', 'warning');
    return null;
  }

  return await response.json();
}

// Usage:
const profile = await createProfile({
  full_name: 'Alice Johnson',
  headline: 'Full-Stack Developer',
  bio: 'Passionate about building scalable web applications.',
  location: 'Hyderabad, India',
  education_level: 'bachelor',
  years_experience: 3,
  current_field: 'Software Engineering',
  target_fields: { primary: 'Cloud Architecture', secondary: 'AI/ML' },
  skills: { languages: ['Python', 'JavaScript'], frameworks: ['FastAPI'] },
  interests: { topics: ['cloud', 'distributed systems'] },
});
```

### Update profile (if exists)

```javascript
async function updateProfile(profileData) {
  const response = await apiFetch(`${BASE_URL}/v1/users/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(profileData),
  });
  return await response.json();
}
```

### View profile versions

```javascript
async function getProfileVersions() {
  const data = await handleApiCall(`${BASE_URL}/v1/users/profile/versions`);
  return data; // Array of { id, version_number, snapshot }
}
```

---

## 6. Career Explorer (Browse / Search)

**Authentication:** No

**When to call:** On page load (with default params), and on filter/search input.

**Endpoints:**

- `GET /v1/careers` - List/search careers

```javascript
async function searchCareers({
  search = '',
  skill = '',
  degreeLevel = '',
  demandLevel = '',
  minSalary = null,
  maxSalary = null,
  sortBy = 'title',
  sortOrder = 'asc',
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (skill) params.set('skill', skill);
  if (degreeLevel) params.set('degree_level', degreeLevel);
  if (demandLevel) params.set('demand_level', demandLevel);
  if (minSalary !== null) params.set('min_salary', minSalary);
  if (maxSalary !== null) params.set('max_salary', maxSalary);
  params.set('sort_by', sortBy);
  params.set('sort_order', sortOrder);
  params.set('page', page);
  params.set('page_size', pageSize);

  const data = await handleApiCall(`${BASE_URL}/v1/careers?${params}`);
  return data;
  // data: { items: [...], total, page, page_size, total_pages }
}
```

**UI Recommendations:**
- Debounce search input (300ms)
- Show skeleton loading during fetch
- Display total count and pagination controls
- Show "No results found" when `items` is empty

---

## 7. Career Detail Page

**Authentication:** No

**Endpoint:** `GET /v1/careers/{career_id}`

**When to call:** On page load, using career ID from URL params.

```javascript
async function getCareerDetail(careerId) {
  const data = await handleApiCall(`${BASE_URL}/v1/careers/${careerId}`);
  return data;
  // data: { id, title, description, average_salary, growth_outlook,
  //   demand_level, required_education, typical_skills,
  //   skills: [...], degrees: [...], colleges: [...],
  //   exams: [...], scholarships: [...], resources: [...],
  //   created_at, updated_at }
}
```

**Display sections:**
- Career overview (title, description, salary, outlook, demand)
- Required skills table
- Degrees required
- Recommended colleges
- Entrance exams
- Scholarships
- Learning resources

---

## 8. Portfolio Manager

**Authentication:** Yes

### List portfolio items

```javascript
async function listPortfolioItems({ page = 1, pageSize = 20, itemType = null } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('page_size', pageSize);
  if (itemType) params.set('item_type', itemType);

  const data = await handleApiCall(`${BASE_URL}/v1/portfolio/items?${params}`, {
    headers: authHeaders(),
  });
  return data;
  // data: { items: [...], total, page, page_size, total_pages }
}
```

### Create a portfolio item

```javascript
async function createPortfolioItem(itemData) {
  const response = await apiFetch(`${BASE_URL}/v1/portfolio/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(itemData),
  });
  return await response.json();
}

// Usage:
await createPortfolioItem({
  title: 'Hack4Hyd Project',
  description: 'Built an AI-powered career guidance system',
  url: 'https://github.com/user/hack4hyd',
  item_type: 'hackathon',
  skills_used: { languages: ['Python', 'TypeScript'], frameworks: ['FastAPI', 'React'] },
});
```

### Update a portfolio item

```javascript
async function updatePortfolioItem(itemId, updateData) {
  const response = await apiFetch(`${BASE_URL}/v1/portfolio/items/${itemId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updateData),
  });
  return await response.json();
}
```

### Delete a portfolio item

```javascript
async function deletePortfolioItem(itemId) {
  const response = await apiFetch(`${BASE_URL}/v1/portfolio/items/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await response.json();
  // data: { message: "Portfolio item deleted" }
}
```

**Valid `item_type` values:** `project`, `hackathon`, `competition`, `certificate`, `research`, `internship`, `olympiad`, `leadership`, `volunteering`, `achievement`

---

## 9. Recommendation History

**Authentication:** Yes

**Endpoint:** `GET /v1/recommendations/history`

**When to call:** On page load.

```javascript
async function getRecommendationHistory({ page = 1, pageSize = 20 } = {}) {
  const data = await handleApiCall(
    `${BASE_URL}/v1/recommendations/history?page=${page}&page_size=${pageSize}`,
    { headers: authHeaders() }
  );
  return data;
  // data: { items: [{ id, user_id, title, summary, status, items: [...], created_at }], total, page, page_size, total_pages }
}
```

### View single recommendation detail

```javascript
async function getRecommendationDetail(recommendationId) {
  const data = await handleApiCall(
    `${BASE_URL}/v1/recommendations/${recommendationId}`,
    { headers: authHeaders() }
  );
  return data;
}
```

**Display:** Each recommendation shows title, summary, status, and a ranked list of career matches with scores and reasoning.

---

## 10. Roadmap Viewer

**Authentication:** Yes

**Endpoints:**

- `GET /v1/roadmaps/history` - List all roadmaps
- `GET /v1/roadmaps/{roadmap_id}` - Get specific roadmap with steps

```javascript
async function getRoadmapHistory({ page = 1, pageSize = 20 } = {}) {
  const data = await handleApiCall(
    `${BASE_URL}/v1/roadmaps/history?page=${page}&page_size=${pageSize}`,
    { headers: authHeaders() }
  );
  return data;
}

async function getRoadmapDetail(roadmapId) {
  const data = await handleApiCall(
    `${BASE_URL}/v1/roadmaps/${roadmapId}`,
    { headers: authHeaders() }
  );
  return data;
  // data: { id, user_id, career_id, title, description, status,
  //   estimated_duration_months, steps: [{ id, title, description,
  //   step_order, duration_months, resources }], created_at }
}
```

**Display:** Show roadmap as a vertical timeline with steps ordered by `step_order`. Each step shows title, description, duration, and resources.

---

## 11. Backup Plan Viewer

**Authentication:** Yes

**Endpoints:**

- `GET /v1/backups/history` - List all backup plans
- `GET /v1/backups/{plan_id}` - Get specific plan with scenarios

```javascript
async function getBackupHistory({ page = 1, pageSize = 20 } = {}) {
  const data = await handleApiCall(
    `${BASE_URL}/v1/backups/history?page=${page}&page_size=${pageSize}`,
    { headers: authHeaders() }
  );
  return data;
}

async function getBackupPlanDetail(planId) {
  const data = await handleApiCall(
    `${BASE_URL}/v1/backups/${planId}`,
    { headers: authHeaders() }
  );
  return data;
  // data: { id, user_id, title, description, status,
  //   scenarios: [{ id, career_id, scenario_name, description,
  //   transition_difficulty, estimated_transition_months, reasoning }],
  //   created_at }
}
```

**Display:** Show each backup plan with its scenarios. Each scenario shows the career name, difficulty level, estimated transition time, and reasoning.

---

## 12. AI Chat

**Authentication:** Yes

### Create a chat session

```javascript
async function createChatSession(title) {
  const response = await apiFetch(`${BASE_URL}/v1/chat/sessions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ title: title || null }),
  });
  return await response.json();
  // data: { id, user_id, title, created_at }
}
```

### Send messages to a session

```javascript
async function sendMessage(sessionId, role, content) {
  const response = await apiFetch(`${BASE_URL}/v1/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify([{ role, content }]),
  });
  return await response.json();
  // data: [{ id, session_id, role, content, created_at }]
}
```

### Load session messages

```javascript
async function loadSessionMessages(sessionId) {
  const data = await handleApiCall(
    `${BASE_URL}/v1/chat/sessions/${sessionId}`,
    { headers: authHeaders() }
  );
  return data;
  // data: { id, user_id, title, created_at, messages: [{ id, session_id, role, content, created_at }] }
}
```

### List all sessions

```javascript
async function listChatSessions({ page = 1, pageSize = 20 } = {}) {
  const data = await handleApiCall(
    `${BASE_URL}/v1/chat/sessions?page=${page}&page_size=${pageSize}`,
    { headers: authHeaders() }
  );
  return data;
}
```

### Delete a session

```javascript
async function deleteChatSession(sessionId) {
  const response = await apiFetch(`${BASE_URL}/v1/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const data = await response.json();
  // data: { message: "Chat session deleted" }
}
```

**Chat flow:**
1. User opens chat page -> Create session or load existing
2. User types message -> Call `sendMessage(sessionId, 'user', content)`
3. Display user message immediately in UI
4. Call AI service (Phase 3) -> Get assistant response
5. Store assistant response via `sendMessage(sessionId, 'assistant', response)`
6. Display assistant response in UI

**Note:** Currently in Phase 2, messages are stored without AI response generation. The frontend should handle displaying a "thinking" state until AI integration is complete.

---

## Page-to-Endpoint Summary

| Page | Endpoints | Auth |
|---|---|---|
| Landing Page | `GET /health` | No |
| Registration | `POST /v1/auth/register` | No |
| Login | `POST /v1/auth/login` | No |
| Forgot Password | `POST /v1/auth/forgot-password` | No |
| Reset Password | `POST /v1/auth/reset-password` | No |
| Dashboard | `GET /v1/auth/me`, `GET /v1/users/profile`, `GET /v1/recommendations/history`, `GET /v1/roadmaps/history`, `GET /v1/backups/history` | Yes |
| Profile Setup/Edit | `POST /v1/users/profile`, `GET /v1/users/profile`, `PUT /v1/users/profile`, `GET /v1/users/profile/versions` | Yes |
| Career Explorer | `GET /v1/careers` | No |
| Career Detail | `GET /v1/careers/{career_id}` | No |
| Portfolio Manager | `GET /v1/portfolio/items`, `POST /v1/portfolio/items`, `PUT /v1/portfolio/items/{item_id}`, `DELETE /v1/portfolio/items/{item_id}`, `GET /v1/portfolio/items/{item_id}` | Yes |
| Recommendation History | `GET /v1/recommendations/history`, `GET /v1/recommendations/{recommendation_id}` | Yes |
| Roadmap Viewer | `GET /v1/roadmaps/history`, `GET /v1/roadmaps/{roadmap_id}` | Yes |
| Backup Plan Viewer | `GET /v1/backups/history`, `GET /v1/backups/{plan_id}` | Yes |
| AI Chat | `POST /v1/chat/sessions`, `GET /v1/chat/sessions`, `GET /v1/chat/sessions/{session_id}`, `POST /v1/chat/sessions/{session_id}/messages`, `DELETE /v1/chat/sessions/{session_id}` | Yes |
