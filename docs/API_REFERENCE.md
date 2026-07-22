# Tophexity Backend API Reference

**Base URL:** `https://tophexity-func.azurewebsites.net`  
**Swagger UI:** `https://tophexity-func.azurewebsites.net/docs`  
**ReDoc:** `https://tophexity-func.azurewebsites.net/redoc`  
**API Version:** v1 (prefix `/v1`)

---

## Authentication

All protected endpoints require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

**Token lifetimes:**
- Access token: 30 minutes
- Refresh token: 7 days

**How to obtain tokens:** Register, then login. Use the `refresh_token` to get new access tokens without re-login.

---

## Common Response Shapes

All paginated endpoints return:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "total_pages": 0
}
```

Error responses:

```json
{
  "detail": "Error message"
}
```

All responses include `X-Process-Time` header with server-side processing time in seconds.

---

## Table of Contents

1. [Health Endpoints](#1-health-endpoints)
2. [Auth (`/v1/auth`)](#2-auth)
3. [Users / Profile (`/v1/users`)](#3-users--profile)
4. [Portfolio (`/v1/portfolio`)](#4-portfolio)
5. [Careers (`/v1/careers`)](#5-careers)
6. [Recommendations (`/v1/recommendations`)](#6-recommendations)
7. [Roadmaps (`/v1/roadmaps`)](#7-roadmaps)
8. [Backup Plans (`/v1/backups`)](#8-backup-plans)
9. [Chat (`/v1/chat`)](#9-chat)
10. [AI (`/v1/ai`)](#10-ai)

---

## 1. Health Endpoints

### `GET /health`

Returns service health status and version. No authentication required.

**Response 200:**

```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

### `GET /health/ai`

Verify Azure AI connectivity, deployment, authentication, and latency. No authentication required.

**Response 200:**

```json
{
  "status": "healthy",
  "azure_connected": true,
  "deployment_available": true,
  "authentication_valid": true,
  "latency_ms": 931.7,
  "model": "gpt-5",
  "endpoint": "https://tophex.cognitiveservices.azure.com/",
  "error": null
}
```

---

## 2. Auth

**Prefix:** `/v1/auth`  
**Tags:** Auth

### `GET /v1/auth/health`

Health check for the auth service. No authentication required.

**Response 200:**

```json
{ "status": "auth router active" }
```

---

### `POST /v1/auth/register`

Register a new user account.

**Auth required:** No

**Request body:**

| Field      | Type   | Required | Constraints              |
|------------|--------|----------|--------------------------|
| `email`    | string | Yes      | Valid email format       |
| `password` | string | Yes      | Min 8, max 128 characters|

**Request example:**

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response 201:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "is_active": true,
  "is_verified": false,
  "role": "user",
  "created_at": "2026-07-22T10:00:00"
}
```

**Errors:**
- `409` - Email already registered
- `422` - Validation error (invalid email, short password)

---

### `POST /v1/auth/login`

Authenticate and receive JWT tokens.

**Auth required:** No

**Request body:**

| Field      | Type   | Required | Constraints |
|------------|--------|----------|-------------|
| `email`    | string | Yes      | Valid email |
| `password` | string | Yes      |             |

**Request example:**

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response 200:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**Errors:**
- `401` - Invalid credentials

---

### `POST /v1/auth/refresh`

Exchange a refresh token for new access and refresh tokens.

**Auth required:** No (uses refresh token in body)

**Request body:**

| Field           | Type   | Required | Constraints |
|-----------------|--------|----------|-------------|
| `refresh_token` | string | Yes      |             |

**Request example:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**Errors:**
- `401` - Invalid or expired refresh token

---

### `POST /v1/auth/logout`

Logout the current user. Client should discard stored tokens.

**Auth required:** Yes

**Request body:** None

**Response 200:**

```json
{ "message": "Successfully logged out" }
```

**Errors:**
- `401` - Not authenticated

---

### `GET /v1/auth/me`

Get the authenticated user's account information.

**Auth required:** Yes

**Request body:** None

**Response 200:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "is_active": true,
  "is_verified": false,
  "role": "user",
  "created_at": "2026-07-22T10:00:00"
}
```

**Errors:**
- `401` - Not authenticated

---

## 3. Users / Profile

**Prefix:** `/v1/users`  
**Tags:** Users

### `GET /v1/users/health`

Health check for the users service. No authentication required.

**Response 200:**

```json
{ "status": "users router active" }
```

---

### `POST /v1/users/profile`

Create a detailed profile for the authenticated user. Only one profile per user.

**Auth required:** Yes

**Request body (all fields optional):**

| Field              | Type   | Required | Description |
|--------------------|--------|----------|-------------|
| `full_name`        | string | No       |             |
| `headline`         | string | No       | Short professional tagline |
| `bio`              | string | No       | Longer biographical text |
| `location`         | string | No       | City/country |
| `avatar_url`       | string | No       | URL to profile image |
| `education_level`  | string | No       | e.g., "bachelor", "master" |
| `years_experience` | int    | No       | Years of professional experience |
| `current_field`    | string | No       | Current professional field |
| `target_fields`    | object | No       | JSON object of desired fields |
| `skills`           | object | No       | JSON object of skills |
| `interests`        | object | No       | JSON object of interests |

**Request example:**

```json
{
  "full_name": "Jane Doe",
  "headline": "ML Engineer",
  "bio": "Passionate about AI and data science.",
  "location": "Hyderabad, India",
  "education_level": "master",
  "years_experience": 3,
  "current_field": "data science",
  "target_fields": ["machine learning", "NLP", "computer vision"],
  "skills": {"python": "advanced", "tensorflow": "intermediate", "pytorch": "advanced"},
  "interests": ["deep learning", "reinforcement learning"]
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "full_name": "Jane Doe",
  "headline": "ML Engineer",
  "bio": "Passionate about AI and data science.",
  "location": "Hyderabad, India",
  "avatar_url": null,
  "education_level": "master",
  "years_experience": 3,
  "current_field": "data science",
  "target_fields": ["machine learning", "NLP", "computer vision"],
  "skills": {"python": "advanced", "tensorflow": "intermediate", "pytorch": "advanced"},
  "interests": ["deep learning", "reinforcement learning"],
  "created_at": "2026-07-22T10:00:00",
  "updated_at": "2026-07-22T10:00:00"
}
```

**Errors:**
- `401` - Not authenticated
- `409` - Profile already exists

---

### `GET /v1/users/profile`

Get the authenticated user's profile.

**Auth required:** Yes

**Response 200:** Same shape as `POST /v1/users/profile` response.

**Errors:**
- `401` - Not authenticated
- `404` - Profile not found

---

### `PUT /v1/users/profile`

Update the authenticated user's profile. Creates a version snapshot automatically.

**Auth required:** Yes

**Request body:** Same fields as `POST /v1/users/profile`, all optional (only send fields to update).

**Request example:**

```json
{
  "headline": "Senior ML Engineer",
  "years_experience": 4
}
```

**Response 200:** Updated profile, same shape as `POST` response.

**Errors:**
- `401` - Not authenticated
- `404` - Profile not found

---

### `GET /v1/users/profile/versions`

Get all historical snapshots of the user's profile.

**Auth required:** Yes

**Response 200:**

```json
[
  {
    "id": "uuid",
    "version_number": 1,
    "snapshot": {
      "full_name": "Jane Doe",
      "headline": "ML Engineer",
      ...
    }
  },
  {
    "id": "uuid",
    "version_number": 2,
    "snapshot": { ... }
  }
]
```

**Errors:**
- `401` - Not authenticated
- `404` - Profile not found

---

## 4. Portfolio

**Prefix:** `/v1/portfolio`  
**Tags:** Portfolio

### `GET /v1/portfolio/health`

Health check. No authentication required.

**Response 200:**

```json
{ "status": "portfolio router active" }
```

---

### `GET /v1/portfolio/items`

List portfolio items with pagination and optional type filter.

**Auth required:** Yes

**Query parameters:**

| Parameter   | Type   | Required | Default | Description |
|-------------|--------|----------|---------|-------------|
| `page`      | int    | No       | `1`     | Page number (>= 1) |
| `page_size` | int    | No       | `20`    | Items per page (1-100) |
| `item_type` | string | No       | null    | Filter by type (see valid types below) |

**Valid `item_type` values:**

| Value          | Description |
|----------------|-------------|
| `project`      | Personal/open-source projects |
| `hackathon`    | Hackathon participation |
| `competition`  | Competitive events |
| `certificate`  | Certifications earned |
| `research`     | Research publications |
| `internship`   | Internships |
| `olympiad`     | Academic olympiads |
| `leadership`   | Leadership roles |
| `volunteering` | Volunteering work |
| `achievement`  | General achievements |

**Request example:**

```
GET /v1/portfolio/items?page=1&page_size=10&item_type=project
```

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Tophexity Career Platform",
      "description": "AI-powered career guidance platform",
      "url": "https://github.com/tophexity",
      "item_type": "project",
      "skills_used": {"python": "advanced", "fastapi": "intermediate"},
      "created_at": "2026-07-22T10:00:00",
      "updated_at": "2026-07-22T10:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

---

### `POST /v1/portfolio/items`

Create a new portfolio item.

**Auth required:** Yes

**Request body:**

| Field         | Type   | Required | Constraints | Description |
|---------------|--------|----------|-------------|-------------|
| `title`       | string | Yes      | Max 500 chars | Item title |
| `description` | string | No       |             | Detailed description |
| `url`         | string | No       |             | Link to project/certificate/etc. |
| `item_type`   | string | Yes      | Must be one of the valid `item_type` values (see above) | |
| `skills_used` | object | No       |             | JSON object of skills used |

**Request example:**

```json
{
  "title": "Hack4HyD Winner",
  "description": "Won first place at Hyderabad hackathon 2026",
  "url": "https://devpost.com/software/tophexity",
  "item_type": "hackathon",
  "skills_used": {"python": "advanced", "react": "intermediate"}
}
```

**Response 201:** Same shape as the item in the list response.

**Errors:**
- `401` - Not authenticated
- `422` - Invalid `item_type`

---

### `GET /v1/portfolio/items/{item_id}`

Get a specific portfolio item by ID.

**Auth required:** Yes

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `item_id` | UUID | Portfolio item ID |

**Response 200:** Single item object (same shape as list item).

**Errors:**
- `401` - Not authenticated
- `404` - Item not found

---

### `PUT /v1/portfolio/items/{item_id}`

Update a portfolio item.

**Auth required:** Yes

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `item_id` | UUID | Portfolio item ID |

**Request body (all fields optional):**

| Field         | Type   | Constraints |
|---------------|--------|-------------|
| `title`       | string | Max 500 chars |
| `description` | string |             |
| `url`         | string |             |
| `skills_used` | object |             |

**Request example:**

```json
{
  "title": "Hack4HyD Winner (Updated)",
  "skills_used": {"python": "expert", "react": "advanced"}
}
```

**Response 200:** Updated item object.

**Errors:**
- `401` - Not authenticated
- `404` - Item not found

---

### `DELETE /v1/portfolio/items/{item_id}`

Soft-delete a portfolio item (marked as deleted, not removed from DB).

**Auth required:** Yes

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `item_id` | UUID | Portfolio item ID |

**Response 200:**

```json
{ "message": "Portfolio item deleted" }
```

**Errors:**
- `401` - Not authenticated
- `404` - Item not found

---

## 5. Careers

**Prefix:** `/v1/careers`  
**Tags:** Careers

### `GET /v1/careers/health`

Health check. No authentication required.

**Response 200:**

```json
{ "status": "careers router active" }
```

---

### `POST /v1/careers/import`

Bulk import careers with related entities. Duplicate careers (by title) are skipped.

**Auth required:** Yes

**Request body:**

```json
{
  "careers": [
    {
      "title": "Machine Learning Engineer",
      "description": "Designs and builds ML models and pipelines.",
      "average_salary": 120000,
      "growth_outlook": "excellent",
      "demand_level": "very_high",
      "required_education": {"degree": "bachelor", "field": "CS or related"},
      "typical_skills": {"python": "required", "ml_frameworks": "required"},
      "skills": [
        { "name": "Python", "category": "programming", "level": "advanced", "is_required": true },
        { "name": "TensorFlow", "category": "ml_framework", "level": "intermediate", "is_required": false }
      ],
      "degrees": [
        { "name": "B.Tech CSE", "level": "bachelor", "field": "Computer Science", "is_required": true }
      ],
      "colleges": [
        { "name": "IIIT Hyderabad", "location": "Hyderabad", "program_name": "B.Tech CSE" }
      ],
      "exams": [
        { "name": "JEE Main", "description": "Engineering entrance exam", "is_required": true }
      ],
      "scholarships": [
        { "name": "Merit Scholarship", "description": "For top 1%ile", "amount": 50000 }
      ],
      "resources": [
        { "title": "ML Course", "url": "https://coursera.org/ml", "resource_type": "course", "description": "Andrew Ng ML course" }
      ]
    }
  ]
}
```

**Field constraints for nested objects:**

| Object | Field | Type | Constraints |
|--------|-------|------|-------------|
| `skills[]` | `name` | string | Required |
| `skills[]` | `category` | string | Optional |
| `skills[]` | `level` | string | Default: `"intermediate"` |
| `skills[]` | `is_required` | bool | Default: `true` |
| `degrees[]` | `name` | string | Required |
| `degrees[]` | `level` | string | Required |
| `degrees[]` | `field` | string | Optional |
| `degrees[]` | `is_required` | bool | Default: `false` |
| `colleges[]` | `name` | string | Required |
| `colleges[]` | `location` | string | Optional |
| `colleges[]` | `program_name` | string | Optional |
| `exams[]` | `name` | string | Required |
| `exams[]` | `description` | string | Optional |
| `exams[]` | `is_required` | bool | Default: `false` |
| `scholarships[]` | `name` | string | Required |
| `scholarships[]` | `description` | string | Optional |
| `scholarships[]` | `amount` | float | Optional |
| `resources[]` | `title` | string | Required |
| `resources[]` | `url` | string | Required |
| `resources[]` | `resource_type` | string | Required (e.g. `"course"`, `"book"`, `"article"`) |
| `resources[]` | `description` | string | Optional |

**Response 201:**

```json
{
  "imported": 1,
  "skipped": 0,
  "careers": [
    {
      "id": "uuid",
      "title": "Machine Learning Engineer",
      "description": "Designs and builds ML models and pipelines.",
      "average_salary": 120000,
      "growth_outlook": "excellent",
      "demand_level": "very_high",
      "required_education": {"degree": "bachelor", "field": "CS or related"},
      "typical_skills": {"python": "required", "ml_frameworks": "required"},
      "created_at": "2026-07-22T10:00:00",
      "updated_at": "2026-07-22T10:00:00"
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated
- `422` - Validation error

---

### `GET /v1/careers`

Search and filter careers. Returns paginated results sorted by title.

**Auth required:** No (public endpoint)

**Query parameters:**

| Parameter     | Type   | Required | Default   | Description |
|---------------|--------|----------|-----------|-------------|
| `search`      | string | No       | null      | Full-text search in title and description |
| `skill`       | string | No       | null      | Filter by skill name |
| `degree_level`| string | No       | null      | Filter by degree level (e.g. `"bachelor"`, `"master"`) |
| `demand_level`| string | No       | null      | Filter by demand level (e.g. `"high"`, `"very_high"`) |
| `min_salary`  | float  | No       | null      | Minimum average salary |
| `max_salary`  | float  | No       | null      | Maximum average salary |
| `sort_by`     | string | No       | `"title"` | Sort field: `"title"`, `"average_salary"`, `"created_at"` |
| `sort_order`  | string | No       | `"asc"`   | Sort order: `"asc"` or `"desc"` |
| `page`        | int    | No       | `1`       | Page number (>= 1) |
| `page_size`   | int    | No       | `20`      | Items per page (1-100) |

**Request example:**

```
GET /v1/careers?search=machine&skill=python&min_salary=80000&sort_by=average_salary&sort_order=desc&page=1&page_size=10
```

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Machine Learning Engineer",
      "description": "Designs and builds ML models.",
      "average_salary": 120000,
      "growth_outlook": "excellent",
      "demand_level": "very_high",
      "required_education": {"degree": "bachelor"},
      "typical_skills": {"python": "required"},
      "created_at": "2026-07-22T10:00:00",
      "updated_at": "2026-07-22T10:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

---

### `GET /v1/careers/{career_id}`

Get full career details including all related entities (skills, degrees, colleges, exams, scholarships, resources).

**Auth required:** No (public endpoint)

**Path parameters:**

| Parameter  | Type | Description |
|------------|------|-------------|
| `career_id` | UUID | Career ID |

**Response 200:**

```json
{
  "id": "uuid",
  "title": "Machine Learning Engineer",
  "description": "Designs and builds ML models.",
  "average_salary": 120000,
  "growth_outlook": "excellent",
  "demand_level": "very_high",
  "required_education": {"degree": "bachelor"},
  "typical_skills": {"python": "required"},
  "skills": [
    { "id": "uuid", "name": "Python", "category": "programming" }
  ],
  "degrees": [
    { "id": "uuid", "name": "B.Tech CSE", "level": "bachelor", "field": "Computer Science" }
  ],
  "colleges": [
    { "id": "uuid", "name": "IIIT Hyderabad", "location": "Hyderabad", "website": null, "ranking": 1 }
  ],
  "exams": [
    { "id": "uuid", "name": "JEE Main", "description": "Engineering entrance exam", "website": null }
  ],
  "scholarships": [
    { "id": "uuid", "name": "Merit Scholarship", "description": "For top 1%", "amount": 50000, "eligibility": null, "deadline": null, "website": null }
  ],
  "resources": [
    { "id": "uuid", "title": "ML Course", "description": "Andrew Ng", "url": "https://coursera.org/ml", "resource_type": "course" }
  ],
  "created_at": "2026-07-22T10:00:00",
  "updated_at": "2026-07-22T10:00:00"
}
```

**Errors:**
- `404` - Career not found

---

### `PUT /v1/careers/{career_id}`

Update a career's basic fields.

**Auth required:** Yes

**Path parameters:**

| Parameter  | Type | Description |
|------------|------|-------------|
| `career_id` | UUID | Career ID |

**Request body (all fields optional):**

| Field                | Type   | Constraints |
|----------------------|--------|-------------|
| `title`              | string | Max 255 chars |
| `description`        | string |             |
| `average_salary`     | float  |             |
| `growth_outlook`     | string |             |
| `demand_level`       | string |             |
| `required_education` | object |             |
| `typical_skills`     | object |             |

**Request example:**

```json
{
  "average_salary": 135000,
  "demand_level": "very_high"
}
```

**Response 200:** Updated career object (same shape as `CareerResponse`).

**Errors:**
- `401` - Not authenticated
- `404` - Career not found

---

### `DELETE /v1/careers/{career_id}`

Delete a career and all its junction table relationships.

**Auth required:** Yes

**Path parameters:**

| Parameter  | Type | Description |
|------------|------|-------------|
| `career_id` | UUID | Career ID |

**Response 200:**

```json
{ "message": "Career deleted successfully" }
```

**Errors:**
- `401` - Not authenticated
- `404` - Career not found

---

## 6. Recommendations

**Prefix:** `/v1/recommendations`  
**Tags:** Recommendations

### `GET /v1/recommendations/health`

Health check. No authentication required.

**Response 200:**

```json
{ "status": "recommendations router active" }
```

---

### `POST /v1/recommendations`

Create a new career recommendation with ranked items.

**Auth required:** Yes

**Request body:**

| Field     | Type   | Required | Constraints | Description |
|-----------|--------|----------|-------------|-------------|
| `title`   | string | No       |             | Recommendation title |
| `summary` | string | No       |             | High-level summary |
| `items`   | array  | Yes      | Min 1 item  | Ranked career recommendations |

**`items[]` fields:**

| Field        | Type   | Required | Constraints |
|--------------|--------|----------|-------------|
| `career_id`  | UUID   | Yes      | Must reference a valid career |
| `match_score`| float  | Yes      | 0.0 - 100.0 |
| `reasoning`  | string | No       | Why this career matches |
| `rank`       | int    | Yes      | >= 1 (1 = best match) |

**Request example:**

```json
{
  "title": "Career Recommendations for Jane",
  "summary": "Based on your ML skills and data science interest, here are top career matches.",
  "items": [
    {
      "career_id": "uuid-of-ml-engineer",
      "match_score": 95.5,
      "reasoning": "Strong match: Python, TensorFlow, data science background.",
      "rank": 1
    },
    {
      "career_id": "uuid-of-data-scientist",
      "match_score": 88.2,
      "reasoning": "Good match: statistics, data analysis, ML fundamentals.",
      "rank": 2
    }
  ]
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Career Recommendations for Jane",
  "summary": "Based on your ML skills...",
  "status": "completed",
  "items": [
    {
      "id": "uuid",
      "career_id": "uuid",
      "match_score": 95.5,
      "reasoning": "Strong match: Python, TensorFlow...",
      "rank": 1
    },
    {
      "id": "uuid",
      "career_id": "uuid",
      "match_score": 88.2,
      "reasoning": "Good match: statistics...",
      "rank": 2
    }
  ],
  "created_at": "2026-07-22T10:00:00"
}
```

**Status values:** `"pending"`, `"completed"`, `"failed"`

**Errors:**
- `401` - Not authenticated
- `422` - Validation error (invalid career_id, score out of range, rank < 1)

---

### `GET /v1/recommendations/history`

List all past recommendations for the authenticated user, sorted by most recent.

**Auth required:** Yes

**Query parameters:**

| Parameter   | Type | Required | Default |
|-------------|------|----------|---------|
| `page`      | int  | No       | `1`     |
| `page_size` | int  | No       | `20`    |

**Request example:**

```
GET /v1/recommendations/history?page=1&page_size=5
```

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Career Recommendations for Jane",
      "summary": "Based on your ML skills...",
      "status": "completed",
      "items": [ ... ],
      "created_at": "2026-07-22T10:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 5,
  "total_pages": 1
}
```

---

### `GET /v1/recommendations/{recommendation_id}`

Get a specific recommendation with all its ranked career items.

**Auth required:** Yes

**Path parameters:**

| Parameter          | Type | Description |
|--------------------|------|-------------|
| `recommendation_id`| UUID | Recommendation ID |

**Response 200:** Single recommendation object (same shape as items in history).

**Errors:**
- `401` - Not authenticated
- `404` - Recommendation not found

---

## 7. Roadmaps

**Prefix:** `/v1/roadmaps`  
**Tags:** Roadmaps

### `GET /v1/roadmaps/health`

Health check. No authentication required.

**Response 200:**

```json
{ "status": "roadmaps router active" }
```

---

### `POST /v1/roadmaps`

Create a new career learning roadmap with ordered steps.

**Auth required:** Yes

**Request body:**

| Field                    | Type   | Required | Constraints | Description |
|--------------------------|--------|----------|-------------|-------------|
| `career_id`              | UUID   | Yes      | Must reference a valid career | Target career |
| `title`                  | string | No       |             | Roadmap title |
| `description`            | string | No       |             | Roadmap description |
| `estimated_duration_months` | int | No       |             | Total estimated duration |
| `steps`                  | array  | Yes      | Min 1 step  | Ordered learning steps |

**`steps[]` fields:**

| Field              | Type   | Required | Constraints |
|--------------------|--------|----------|-------------|
| `title`            | string | Yes      | Max 500 chars |
| `description`      | string | No       | |
| `step_order`       | int    | Yes      | >= 1 (must be unique within a roadmap) |
| `duration_months`  | int    | No       | |
| `resources`        | object | No       | JSON object of learning resources |

**Request example:**

```json
{
  "career_id": "uuid-of-ml-engineer",
  "title": "ML Engineer Learning Path",
  "description": "Step-by-step roadmap to become an ML Engineer",
  "estimated_duration_months": 24,
  "steps": [
    {
      "title": "Learn Python Fundamentals",
      "description": "Master Python basics, OOP, and data structures",
      "step_order": 1,
      "duration_months": 3,
      "resources": {
        "courses": ["Automate the Boring Stuff", "Python Crash Course"],
        "practice": "LeetCode Easy problems"
      }
    },
    {
      "title": "Study Mathematics for ML",
      "description": "Linear algebra, calculus, probability, statistics",
      "step_order": 2,
      "duration_months": 4,
      "resources": {
        "courses": ["Khan Academy Linear Algebra", "MIT OCW 6.041"]
      }
    },
    {
      "title": "Master ML Frameworks",
      "description": "Learn scikit-learn, TensorFlow, PyTorch",
      "step_order": 3,
      "duration_months": 5,
      "resources": {
        "courses": ["Andrew Ng ML Specialization", "Fast.ai"]
      }
    }
  ]
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "career_id": "uuid",
  "title": "ML Engineer Learning Path",
  "description": "Step-by-step roadmap to become an ML Engineer",
  "status": "active",
  "estimated_duration_months": 24,
  "steps": [
    {
      "id": "uuid",
      "title": "Learn Python Fundamentals",
      "description": "Master Python basics, OOP, and data structures",
      "step_order": 1,
      "duration_months": 3,
      "resources": { "courses": ["Automate the Boring Stuff", "Python Crash Course"], "practice": "LeetCode Easy problems" }
    },
    ...
  ],
  "created_at": "2026-07-22T10:00:00"
}
```

**Status values:** `"active"`, `"completed"`, `"archived"`

**Errors:**
- `401` - Not authenticated
- `422` - Validation error (invalid career_id, duplicate step_order, step_order < 1)

---

### `GET /v1/roadmaps/history`

List all past roadmaps for the authenticated user, sorted by most recent.

**Auth required:** Yes

**Query parameters:**

| Parameter   | Type | Required | Default |
|-------------|------|----------|---------|
| `page`      | int  | No       | `1`     |
| `page_size` | int  | No       | `20`    |

**Request example:**

```
GET /v1/roadmaps/history?page=1&page_size=5
```

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "career_id": "uuid",
      "title": "ML Engineer Learning Path",
      "description": "...",
      "status": "active",
      "estimated_duration_months": 24,
      "steps": [ ... ],
      "created_at": "2026-07-22T10:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 5,
  "total_pages": 1
}
```

---

### `GET /v1/roadmaps/{roadmap_id}`

Get a specific roadmap with all its ordered learning steps.

**Auth required:** Yes

**Path parameters:**

| Parameter   | Type | Description |
|-------------|------|-------------|
| `roadmap_id`| UUID | Roadmap ID |

**Response 200:** Single roadmap object (same shape as items in history).

**Errors:**
- `401` - Not authenticated
- `404` - Roadmap not found

---

## 8. Backup Plans

**Prefix:** `/v1/backups`  
**Tags:** Backup Plans

### `GET /v1/backups/health`

Health check. No authentication required.

**Response 200:**

```json
{ "status": "backups router active" }
```

---

### `POST /v1/backups`

Create a new career backup plan with alternative career scenarios.

**Auth required:** Yes

**Request body:**

| Field       | Type   | Required | Constraints | Description |
|-------------|--------|----------|-------------|-------------|
| `title`     | string | No       |             | Backup plan title |
| `description`| string| No       |             | Plan description |
| `scenarios` | array  | Yes      | Min 1 scenario | Alternative career scenarios |

**`scenarios[]` fields:**

| Field                         | Type   | Required | Constraints |
|-------------------------------|--------|----------|-------------|
| `career_id`                   | UUID   | Yes      | Must reference a valid career |
| `scenario_name`               | string | Yes      | Max 500 chars |
| `description`                 | string | No       | |
| `transition_difficulty`       | string | No       | e.g., `"easy"`, `"medium"`, `"hard"` |
| `estimated_transition_months` | int    | No       | |
| `reasoning`                   | string | No       | Why this is a viable backup |

**Request example:**

```json
{
  "title": "Jane's Career Backup Plan",
  "description": "Alternative paths if ML Engineer doesn't work out",
  "scenarios": [
    {
      "career_id": "uuid-of-data-scientist",
      "scenario_name": "Pivot to Data Science",
      "description": "Leverage ML skills for data analysis and business insights roles.",
      "transition_difficulty": "easy",
      "estimated_transition_months": 2,
      "reasoning": "Direct transfer of ML/stats skills. Only need to learn business domain."
    },
    {
      "career_id": "uuid-of-software-engineer",
      "scenario_name": "Backend Engineering Fallback",
      "description": "Use Python/backend skills for general software engineering.",
      "transition_difficulty": "medium",
      "estimated_transition_months": 4,
      "reasoning": "Strong Python foundation, need to deepen system design and devops knowledge."
    }
  ]
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Jane's Career Backup Plan",
  "description": "Alternative paths if ML Engineer doesn't work out",
  "status": "active",
  "scenarios": [
    {
      "id": "uuid",
      "career_id": "uuid",
      "scenario_name": "Pivot to Data Science",
      "description": "Leverage ML skills for data analysis...",
      "transition_difficulty": "easy",
      "estimated_transition_months": 2,
      "reasoning": "Direct transfer of ML/stats skills..."
    },
    ...
  ],
  "created_at": "2026-07-22T10:00:00"
}
```

**Status values:** `"active"`, `"inactive"`

**Errors:**
- `401` - Not authenticated
- `422` - Validation error (invalid career_id, scenario_name too long)

---

### `GET /v1/backups/history`

List all past backup plans for the authenticated user, sorted by most recent.

**Auth required:** Yes

**Query parameters:**

| Parameter   | Type | Required | Default |
|-------------|------|----------|---------|
| `page`      | int  | No       | `1`     |
| `page_size` | int  | No       | `20`    |

**Request example:**

```
GET /v1/backups/history?page=1&page_size=5
```

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Jane's Career Backup Plan",
      "description": "...",
      "status": "active",
      "scenarios": [ ... ],
      "created_at": "2026-07-22T10:00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 5,
  "total_pages": 1
}
```

---

### `GET /v1/backups/{plan_id}`

Get a specific backup plan with all its alternative career scenarios.

**Auth required:** Yes

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plan_id` | UUID | Backup plan ID |

**Response 200:** Single backup plan object (same shape as items in history).

**Errors:**
- `401` - Not authenticated
- `404` - Backup plan not found

---

## 9. Chat

**Prefix:** `/v1/chat`  
**Tags:** Chat

### `GET /v1/chat/health`

Health check. No authentication required.

**Response 200:**

```json
{ "status": "chat router active" }
```

---

### `POST /v1/chat/sessions`

Create a new AI chat session.

**Auth required:** Yes

**Request body:**

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `title` | string | No       | Session title |

**Request example:**

```json
{
  "title": "Career Guidance Chat"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Career Guidance Chat",
  "is_archived": false,
  "is_pinned": false,
  "session_data": {},
  "created_at": "2026-07-22T10:00:00",
  "updated_at": "2026-07-22T10:00:00"
}
```

**Errors:**
- `401` - Not authenticated

---

### `GET /v1/chat/sessions`

List chat sessions for the authenticated user with optional search and archive filter.

**Auth required:** Yes

**Query parameters:**

| Parameter    | Type    | Required | Default | Description |
|--------------|---------|----------|---------|-------------|
| `page`       | int     | No       | `1`     | Page number |
| `page_size`  | int     | No       | `20`    | Items per page (max 100) |
| `search`     | string  | No       | null    | Search sessions by title |
| `is_archived`| boolean | No       | `false` | Filter by archived status |

**Request example:**

```
GET /v1/chat/sessions?page=1&page_size=10&search=career&is_archived=false
```

**Response 200:**

```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Career Guidance Chat",
      "is_archived": false,
      "is_pinned": true,
      "session_data": {"message_count": 12, "total_tokens_used": 4500},
      "created_at": "2026-07-22T10:00:00",
      "updated_at": "2026-07-22T14:30:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 10,
  "total_pages": 1
}
```

---

### `GET /v1/chat/sessions/{session_id}`

Get a chat session with all its messages.

**Auth required:** Yes

**Path parameters:**

| Parameter    | Type | Description |
|--------------|------|-------------|
| `session_id` | UUID | Chat session ID |

**Response 200:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Career Guidance Chat",
  "is_archived": false,
  "is_pinned": false,
  "summary": "User discussed transitioning to ML...",
  "session_data": {"message_count": 12, "facts": []},
  "created_at": "2026-07-22T10:00:00",
  "updated_at": "2026-07-22T14:30:00",
  "messages": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "role": "user",
      "content": "What career should I pursue?",
      "token_count": null,
      "model_used": null,
      "latency_ms": null,
      "request_id": null,
      "message_data": {},
      "created_at": "2026-07-22T10:00:05"
    },
    {
      "id": "uuid",
      "session_id": "uuid",
      "role": "assistant",
      "content": "Based on your profile, I recommend...",
      "token_count": 450,
      "model_used": "gpt-5",
      "latency_ms": 1234.5,
      "request_id": "req-uuid",
      "message_data": {"finish_reason": "stop", "prompt_tokens": 300, "completion_tokens": 150},
      "created_at": "2026-07-22T10:00:10"
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Session not found

---

### `PATCH /v1/chat/sessions/{session_id}`

Update session title, pin, or archive status.

**Auth required:** Yes

**Path parameters:**

| Parameter    | Type | Description |
|--------------|------|-------------|
| `session_id` | UUID | Chat session ID |

**Request body (all fields optional):**

| Field         | Type    | Description |
|---------------|---------|-------------|
| `title`       | string  | New title (max 500 chars) |
| `is_pinned`   | boolean | Pin/unpin the session |
| `is_archived` | boolean | Archive/restore the session |

**Request example:**

```json
{
  "title": "New Title",
  "is_pinned": true
}
```

**Response 200:** Updated session object.

**Errors:**
- `400` - Cannot pin archived session or archive pinned session
- `401` - Not authenticated
- `404` - Session not found

---

### `POST /v1/chat/sessions/{session_id}/messages`

Send messages to a chat session. If user messages are included, Azure AI generates a response automatically. On first message to a titleless session, a title is auto-generated.

**Auth required:** Yes

**Path parameters:**

| Parameter    | Type | Description |
|--------------|------|-------------|
| `session_id` | UUID | Chat session ID |

**Request body:** Array of message objects

| Field     | Type   | Required | Constraints | Description |
|-----------|--------|----------|-------------|-------------|
| `role`    | string | Yes      | Must be: `"user"`, `"assistant"`, or `"system"` | Message role |
| `content` | string | Yes      | Min 1 character | Message content |

**Request example:**

```json
[
  {
    "role": "user",
    "content": "I'm interested in machine learning. What skills do I need?"
  }
]
```

**Response 201:** Array of stored messages (user message + AI assistant response).

```json
[
  {
    "id": "uuid",
    "session_id": "uuid",
    "role": "user",
    "content": "I'm interested in machine learning. What skills do I need?",
    "token_count": null,
    "model_used": null,
    "latency_ms": null,
    "request_id": null,
    "message_data": {},
    "created_at": "2026-07-22T10:00:05"
  },
  {
    "id": "uuid",
    "session_id": "uuid",
    "role": "assistant",
    "content": "To get started in machine learning, you'll need: 1) Strong Python programming...",
    "token_count": 450,
    "model_used": "gpt-5",
    "latency_ms": 1234.5,
    "request_id": "req-uuid",
    "message_data": {"finish_reason": "stop", "prompt_tokens": 300, "completion_tokens": 150},
    "created_at": "2026-07-22T10:00:12"
  }
]
```

**Behavior notes:**
- User messages trigger Azure AI response generation
- AI response is built using: user profile, portfolio, latest recommendation, latest roadmap, conversation summary, facts
- On first message to a titleless session, a title is auto-generated via AI
- Session metadata (token counts, message counts) is updated after each exchange
- Facts are extracted periodically (every 5th user message)
- If AI is not configured, only user messages are stored (no AI response)

**Errors:**
- `401` - Not authenticated
- `404` - Session not found
- `422` - Invalid role or empty content
- `503` - AI service not configured

---

### `DELETE /v1/chat/sessions/{session_id}`

Delete a chat session and all its messages.

**Auth required:** Yes

**Path parameters:**

| Parameter    | Type | Description |
|--------------|------|-------------|
| `session_id` | UUID | Chat session ID |

**Response 200:**

```json
{ "message": "Chat session deleted" }
```

**Errors:**
- `401` - Not authenticated
- `404` - Session not found

---

### `POST /v1/chat/sessions/{session_id}/rebuild-memory`

Clear and regenerate the session's summary and extracted facts.

**Auth required:** Yes

**Path parameters:**

| Parameter    | Type | Description |
|--------------|------|-------------|
| `session_id` | UUID | Chat session ID |

**Response 200:**

```json
{
  "session_id": "uuid",
  "summary": "Regenerated summary...",
  "summary_message_count": 10,
  "facts_count": 3,
  "message": "Memory rebuilt successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Session not found

---

### `GET /v1/chat/sessions/{session_id}/export`

Export a chat session in JSON, Markdown, or plain text format.

**Auth required:** Yes

**Path parameters:**

| Parameter    | Type | Description |
|--------------|------|-------------|
| `session_id` | UUID | Chat session ID |

**Query parameters:**

| Parameter | Type   | Required | Default | Description |
|-----------|--------|----------|---------|-------------|
| `format`  | string | No       | `json`  | Export format: `json`, `markdown`, `text` |

**Response 200:**

```json
{
  "session": {
    "id": "uuid",
    "title": "Career Discussion",
    "created_at": "2026-07-22T10:00:00Z",
    "message_count": 12
  },
  "summary": "User discussed transitioning to ML...",
  "messages": [
    {
      "role": "user",
      "content": "I want to switch to ML...",
      "timestamp": "2026-07-22T10:00:05Z"
    },
    {
      "role": "assistant",
      "content": "Great choice! Based on your profile...",
      "timestamp": "2026-07-22T10:00:12Z",
      "model": "gpt-5",
      "tokens": 450
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Session not found

---

### `GET /v1/chat/stats`

Get aggregate chat statistics for the authenticated user.

**Auth required:** Yes

**Response 200:**

```json
{
  "total_sessions": 15,
  "active_sessions": 12,
  "archived_sessions": 3,
  "total_messages": 156,
  "total_tokens_used": 45200,
  "estimated_total_cost_usd": 1.356,
  "average_messages_per_session": 10.4,
  "first_conversation_at": "2026-07-01T10:00:00Z",
  "last_conversation_at": "2026-07-22T14:30:00Z"
}
```

**Errors:**
- `401` - Not authenticated

---

## 10. AI

**Prefix:** `/v1/ai`  
**Tags:** AI

### `GET /v1/ai/health`

Verify Azure AI connectivity, deployment, authentication, and latency.

**Auth required:** No

**Response 200:**

```json
{
  "status": "healthy",
  "azure_connected": true,
  "deployment_available": true,
  "authentication_valid": true,
  "latency_ms": 931.7,
  "model": "gpt-5",
  "endpoint": "https://tophex.cognitiveservices.azure.com/",
  "error": null
}
```

---

### `POST /v1/ai/test`

Send a simple message to Azure AI and return the response. For backend verification only.

**Auth required:** Yes

**Request body:**

| Field     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `message` | string | No       | Message to send. Defaults to `"Hello, this is a test message."` if not provided |

**Request example:**

```json
{
  "message": "What is machine learning?"
}
```

**Response 200:**

```json
{
  "response": "Machine learning is a subset of artificial intelligence...",
  "model": "gpt-5",
  "tokens": 150,
  "latency_ms": 1234.5,
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**
- `401` - Not authenticated
- `503` - AI service not configured

---

## Quick Reference: All Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Service health check |
| `GET` | `/health/ai` | No | AI connectivity check |
| `GET` | `/v1/auth/health` | No | Auth service health |
| `POST` | `/v1/auth/register` | No | Register new user |
| `POST` | `/v1/auth/login` | No | Login, get tokens |
| `POST` | `/v1/auth/refresh` | No | Refresh access token |
| `POST` | `/v1/auth/logout` | Yes | Logout user |
| `GET` | `/v1/auth/me` | Yes | Get current user info |
| `GET` | `/v1/users/health` | No | Users service health |
| `POST` | `/v1/users/profile` | Yes | Create profile |
| `GET` | `/v1/users/profile` | Yes | Get profile |
| `PUT` | `/v1/users/profile` | Yes | Update profile |
| `GET` | `/v1/users/profile/versions` | Yes | Profile version history |
| `GET` | `/v1/portfolio/health` | No | Portfolio service health |
| `GET` | `/v1/portfolio/items` | Yes | List portfolio items |
| `POST` | `/v1/portfolio/items` | Yes | Create portfolio item |
| `GET` | `/v1/portfolio/items/{item_id}` | Yes | Get portfolio item |
| `PUT` | `/v1/portfolio/items/{item_id}` | Yes | Update portfolio item |
| `DELETE` | `/v1/portfolio/items/{item_id}` | Yes | Delete portfolio item |
| `GET` | `/v1/careers/health` | No | Careers service health |
| `POST` | `/v1/careers/import` | Yes | Bulk import careers |
| `GET` | `/v1/careers` | No | Search/filter careers |
| `GET` | `/v1/careers/{career_id}` | No | Get career details |
| `PUT` | `/v1/careers/{career_id}` | Yes | Update career |
| `DELETE` | `/v1/careers/{career_id}` | Yes | Delete career |
| `GET` | `/v1/recommendations/health` | No | Recommendations health |
| `POST` | `/v1/recommendations` | Yes | Create recommendation |
| `GET` | `/v1/recommendations/history` | Yes | List recommendation history |
| `GET` | `/v1/recommendations/{id}` | Yes | Get recommendation |
| `GET` | `/v1/roadmaps/health` | No | Roadmaps health |
| `POST` | `/v1/roadmaps` | Yes | Create roadmap |
| `GET` | `/v1/roadmaps/history` | Yes | List roadmap history |
| `GET` | `/v1/roadmaps/{id}` | Yes | Get roadmap |
| `GET` | `/v1/backups/health` | No | Backups health |
| `POST` | `/v1/backups` | Yes | Create backup plan |
| `GET` | `/v1/backups/history` | Yes | List backup plan history |
| `GET` | `/v1/backups/{id}` | Yes | Get backup plan |
| `GET` | `/v1/chat/health` | No | Chat service health |
| `POST` | `/v1/chat/sessions` | Yes | Create chat session |
| `GET` | `/v1/chat/sessions` | Yes | List chat sessions (search, filter) |
| `GET` | `/v1/chat/sessions/{id}` | Yes | Get session with messages |
| `PATCH` | `/v1/chat/sessions/{id}` | Yes | Update session (title, pin, archive) |
| `POST` | `/v1/chat/sessions/{id}/messages` | Yes | Send message (triggers AI) |
| `DELETE` | `/v1/chat/sessions/{id}` | Yes | Delete session |
| `POST` | `/v1/chat/sessions/{id}/rebuild-memory` | Yes | Rebuild summary + facts |
| `GET` | `/v1/chat/sessions/{id}/export` | Yes | Export session (JSON/MD/text) |
| `GET` | `/v1/chat/stats` | Yes | Chat statistics |
| `GET` | `/v1/ai/health` | No | AI health check |
| `POST` | `/v1/ai/test` | Yes | Test AI integration |
| `GET` | `/v1/ai/prompts` | No | List all AI prompts |
| `POST` | `/v1/ai/prompts/{name}/test` | Yes | Test-render a prompt |

**Total: 48 endpoints**

---

## Auth Usage Examples

### Python — Register, Login, and Use the API

```python
import httpx

BASE_URL = "https://tophexity-func.azurewebsites.net"


def register(email: str, password: str) -> dict:
    resp = httpx.post(f"{BASE_URL}/v1/auth/register", json={
        "email": email,
        "password": password,
    })
    resp.raise_for_status()
    return resp.json()


def login(email: str, password: str) -> dict:
    resp = httpx.post(f"{BASE_URL}/v1/auth/login", json={
        "email": email,
        "password": password,
    })
    resp.raise_for_status()
    return resp.json()


def auth_headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


def refresh(refresh_token: str) -> dict:
    resp = httpx.post(f"{BASE_URL}/v1/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    resp.raise_for_status()
    return resp.json()


# --- Full flow ---
if __name__ == "__main__":
    # 1. Register
    user = register("user@example.com", "securepass123")
    print("Registered:", user["id"])

    # 2. Login
    tokens = login("user@example.com", "securepass123")
    access = tokens["access_token"]
    refresh_tok = tokens["refresh_token"]
    print("Logged in:", tokens["user_id"])

    # 3. Get current user
    me = httpx.get(f"{BASE_URL}/v1/auth/me", headers=auth_headers(access))
    print("Current user:", me.json()["email"])

    # 4. Create a profile
    profile = httpx.post(f"{BASE_URL}/v1/users/profile", headers=auth_headers(access), json={
        "full_name": "Jane Doe",
        "headline": "ML Engineer",
        "location": "Hyderabad",
        "education_level": "master",
        "years_experience": 3,
        "current_field": "data science",
        "skills": {"python": "advanced", "tensorflow": "intermediate"},
    })
    print("Profile created:", profile.status_code)

    # 5. Create a chat session
    session = httpx.post(f"{BASE_URL}/v1/chat/sessions", headers=auth_headers(access), json={
        "title": "Career Guidance",
    })
    session_id = session.json()["id"]

    # 6. Send a message (triggers AI response)
    messages = httpx.post(
        f"{BASE_URL}/v1/chat/sessions/{session_id}/messages",
        headers=auth_headers(access),
        json=[{"role": "user", "content": "What career should I pursue?"}],
    )
    for msg in messages.json():
        print(f"  [{msg['role']}] {msg['content'][:100]}...")

    # 7. Refresh tokens (when access token expires)
    new_tokens = refresh(refresh_tok)
    access = new_tokens["access_token"]
    print("Token refreshed")

    # 8. Logout
    httpx.post(f"{BASE_URL}/v1/auth/logout", headers=auth_headers(access))
    print("Logged out")
```

### cURL — Register and Login

```bash
# Register
curl -X POST https://tophexity-func.azurewebsites.net/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'

# Login
curl -X POST https://tophexity-func.azurewebsites.net/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepass123"}'

# Use access token
curl https://tophexity-func.azurewebsites.net/v1/auth/me \
  -H "Authorization: Bearer <access_token>"

# Refresh token
curl -X POST https://tophexity-func.azurewebsites.net/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "<refresh_token>"}'
```

### JavaScript (fetch) — Register and Login

```javascript
const BASE = "https://tophexity-func.azurewebsites.net";

async function register(email, password) {
  const res = await fetch(`${BASE}/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function login(email, password) {
  const res = await fetch(`${BASE}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

async function getMe(accessToken) {
  const res = await fetch(`${BASE}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}

// Usage
const user = await register("user@example.com", "securepass123");
const tokens = await login("user@example.com", "securepass123");
const me = await getMe(tokens.access_token);
```

---

## Enum Reference

| Enum | Values |
|------|--------|
| `UserRole` | `user`, `admin` |
| `SkillLevel` | `beginner`, `intermediate`, `advanced`, `expert` |
| `PortfolioItemType` | `project`, `hackathon`, `competition`, `certificate`, `research`, `internship`, `olympiad`, `leadership`, `volunteering`, `achievement` |
| `RecommendationStatus` | `pending`, `completed`, `failed` |
| `RoadmapStatus` | `active`, `completed`, `archived` |
| `BackupPlanStatus` | `active`, `inactive` |
| `ChatMessageRole` | `user`, `assistant`, `system` |
