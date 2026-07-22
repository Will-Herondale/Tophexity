# Tophexity API Reference

## Base URL

```
https://tophexity-func.azurewebsites.net
```

All endpoints are prefixed with `/v1`. Auth endpoints use prefix `/v1/auth`.

## Authentication

**Method:** JWT Bearer Token

Every authenticated request must include the `Authorization` header:

```
Authorization: Bearer {access_token}
```

**How to obtain tokens:**
1. Register via `POST /v1/auth/register`
2. Login via `POST /v1/auth/login` - returns `access_token` and `refresh_token`
3. Refresh via `POST /v1/auth/refresh` with `refresh_token`

**Token Expiration:**

| Token Type | Expiration |
|---|---|
| Access Token | 30 minutes (configurable via `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`) |
| Refresh Token | 7 days (configurable via `JWT_REFRESH_TOKEN_EXPIRE_MINUTES`) |

**Swagger UI:** Available at `/docs` for interactive testing.

## Pagination

All list endpoints return paginated responses:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**Query Parameters:**

| Parameter | Type | Default | Min | Max |
|---|---|---|---|---|
| `page` | int | 1 | 1 | - |
| `page_size` | int | 20 | 1 | 100 |

---

## Error Response Format

All errors follow this structure:

```json
{
  "detail": "Error message description"
}
```

**Common HTTP Status Codes:**

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 404 | Not Found - Resource does not exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |

---

## 1. Health

### GET `/health`

**Purpose:** Check if the API is running.

**Authentication:** No

**Response:**

```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

**Status Codes:** 200

---

## 2. Authentication

All auth endpoints are under `/v1/auth`.

### GET `/v1/auth/health`

**Purpose:** Check auth router status.

**Authentication:** No

**Response:**

```json
{
  "status": "auth router active"
}
```

### POST `/v1/auth/register`

**Purpose:** Register a new user account.

**Authentication:** No

**Headers:**

```
Content-Type: application/json
```

**Request JSON:**

```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | string (email) | Yes | Valid email format |
| `password` | string | Yes | min 8, max 128 characters |
| `full_name` | string \| null | No | - |

**Response JSON (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "is_active": true,
  "is_verified": false,
  "role": "user",
  "created_at": "2025-07-22T10:00:00Z"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 201 | User registered successfully |
| 409 | Email already registered |
| 422 | Validation error |

**Database Tables:** `users`

**Example:**

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123",
    "full_name": "Alice Johnson"
  }'
```

### POST `/v1/auth/login`

**Purpose:** Authenticate and receive tokens.

**Authentication:** No

**Request JSON:**

```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string (email) | Yes |
| `password` | string | Yes |

**Response JSON (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Login successful |
| 401 | Invalid email or password |
| 401 | User account is deactivated |
| 422 | Validation error |

**Database Tables:** `users`

**Example:**

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

### POST `/v1/auth/refresh`

**Purpose:** Exchange a refresh token for new tokens.

**Authentication:** No (uses refresh_token in body)

**Request JSON:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Required |
|---|---|---|
| `refresh_token` | string | Yes |

**Response JSON (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Tokens refreshed |
| 401 | Invalid or expired refresh token |
| 401 | User not found or deactivated |

### POST `/v1/auth/logout`

**Purpose:** Logout the current user.

**Authentication:** Yes

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response JSON (200):**

```json
{
  "message": "Successfully logged out"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Logged out |
| 401 | Invalid or expired token |

### GET `/v1/auth/me`

**Purpose:** Get current authenticated user info.

**Authentication:** Yes

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response JSON (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "is_active": true,
  "is_verified": true,
  "role": "user",
  "created_at": "2025-07-22T10:00:00Z"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | User info returned |
| 401 | Invalid or expired token |
| 401 | User account is deactivated |

---

## 3. User Profile

All profile endpoints are under `/v1/users`.

### GET `/v1/users/health`

**Purpose:** Check users router status.

**Authentication:** No

**Response:**

```json
{
  "status": "users router active"
}
```

### POST `/v1/users/profile`

**Purpose:** Create the user's profile (one profile per user).

**Authentication:** Yes

**Headers:**

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request JSON:**

```json
{
  "full_name": "Alice Johnson",
  "headline": "Full-Stack Developer",
  "bio": "Passionate about building scalable web applications.",
  "location": "Hyderabad, India",
  "avatar_url": "https://example.com/avatar.png",
  "education_level": "bachelor",
  "years_experience": 3,
  "current_field": "Software Engineering",
  "target_fields": {
    "primary": "Cloud Architecture",
    "secondary": "AI/ML"
  },
  "skills": {
    "languages": ["Python", "JavaScript", "Go"],
    "frameworks": ["FastAPI", "React"]
  },
  "interests": {
    "topics": ["cloud", "distributed systems"]
  }
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `full_name` | string \| null | No | max 255 chars |
| `headline` | string \| null | No | max 500 chars |
| `bio` | string \| null | No | text |
| `location` | string \| null | No | max 255 chars |
| `avatar_url` | string \| null | No | max 1024 chars |
| `education_level` | string \| null | No | max 100 chars |
| `years_experience` | int \| null | No | - |
| `current_field` | string \| null | No | max 255 chars |
| `target_fields` | object \| null | No | JSON |
| `skills` | object \| null | No | JSON |
| `interests` | object \| null | No | JSON |

**Response JSON (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "Alice Johnson",
  "headline": "Full-Stack Developer",
  "bio": "Passionate about building scalable web applications.",
  "location": "Hyderabad, India",
  "avatar_url": "https://example.com/avatar.png",
  "education_level": "bachelor",
  "years_experience": 3,
  "current_field": "Software Engineering",
  "target_fields": {
    "primary": "Cloud Architecture",
    "secondary": "AI/ML"
  },
  "skills": {
    "languages": ["Python", "JavaScript", "Go"],
    "frameworks": ["FastAPI", "React"]
  },
  "interests": {
    "topics": ["cloud", "distributed systems"]
  },
  "created_at": "2025-07-22T10:00:00Z",
  "updated_at": "2025-07-22T10:00:00Z"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 201 | Profile created |
| 401 | Unauthorized |
| 409 | Profile already exists |

**Database Tables:** `profiles`, `profile_versions`

**Example:**

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Alice Johnson",
    "headline": "Full-Stack Developer",
    "education_level": "bachelor",
    "years_experience": 3
  }'
```

### GET `/v1/users/profile`

**Purpose:** Get current user's profile.

**Authentication:** Yes

**Response JSON (200):** Same as POST response.

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Profile returned |
| 401 | Unauthorized |
| 404 | Profile not found |

### PUT `/v1/users/profile`

**Purpose:** Update the current user's profile. Only provided fields are updated.

**Authentication:** Yes

**Request JSON:** Same fields as POST, all optional.

**Response JSON (200):** Updated profile, same schema as POST response.

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Profile updated |
| 401 | Unauthorized |
| 404 | Profile not found |

**Database Tables:** `profiles`, `profile_versions` (new version created on each update)

### GET `/v1/users/profile/versions`

**Purpose:** Get all version snapshots of the user's profile.

**Authentication:** Yes

**Response JSON (200):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "version_number": 2,
    "snapshot": {
      "full_name": "Alice Johnson",
      "headline": "Senior Developer",
      "bio": "Updated bio...",
      "location": "Hyderabad, India",
      "avatar_url": null,
      "education_level": "bachelor",
      "years_experience": "4",
      "current_field": "Software Engineering",
      "target_fields": "{'primary': 'Cloud Architecture'}",
      "skills": "{'languages': ['Python', 'Go']}",
      "interests": "{'topics': ['cloud']}"
    }
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440009",
    "version_number": 1,
    "snapshot": {
      "full_name": "Alice Johnson",
      "headline": "Full-Stack Developer",
      "bio": "Original bio...",
      "location": "Hyderabad, India",
      "avatar_url": null,
      "education_level": "bachelor",
      "years_experience": "3",
      "current_field": "Software Engineering",
      "target_fields": null,
      "skills": null,
      "interests": null
    }
  }
]
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Versions returned |
| 401 | Unauthorized |
| 404 | Profile not found |

---

## 4. Portfolio

All portfolio endpoints are under `/v1/portfolio`.

### GET `/v1/portfolio/health`

**Purpose:** Check portfolio router status.

**Authentication:** No

### GET `/v1/portfolio/items`

**Purpose:** List the current user's portfolio items (paginated).

**Authentication:** Yes

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number (min: 1) |
| `page_size` | int | 20 | Items per page (min: 1, max: 100) |
| `item_type` | string \| null | null | Filter by item type |

**Valid `item_type` values:** `project`, `hackathon`, `competition`, `certificate`, `research`, `internship`, `olympiad`, `leadership`, `volunteering`, `achievement`

**Response JSON (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "E-Commerce Platform",
      "description": "Built a full-stack e-commerce app with React and FastAPI",
      "url": "https://github.com/user/ecommerce",
      "item_type": "project",
      "skills_used": {
        "languages": ["Python", "JavaScript"],
        "frameworks": ["FastAPI", "React"]
      },
      "created_at": "2025-07-22T10:00:00Z",
      "updated_at": "2025-07-22T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Items listed |
| 401 | Unauthorized |

**Database Tables:** `portfolio_items`

### POST `/v1/portfolio/items`

**Purpose:** Create a new portfolio item.

**Authentication:** Yes

**Request JSON:**

```json
{
  "title": "E-Commerce Platform",
  "description": "Built a full-stack e-commerce application",
  "url": "https://github.com/user/ecommerce",
  "item_type": "project",
  "skills_used": {
    "languages": ["Python", "JavaScript"],
    "frameworks": ["FastAPI", "React"]
  }
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string | Yes | max 500 chars |
| `description` | string \| null | No | - |
| `url` | string \| null | No | - |
| `item_type` | string (enum) | Yes | One of: `project`, `hackathon`, `competition`, `certificate`, `research`, `internship`, `olympiad`, `leadership`, `volunteering`, `achievement` |
| `skills_used` | object \| null | No | JSON |

**Response JSON (201):** Created item, same schema as list item.

**Status Codes:**

| Code | Reason |
|---|---|
| 201 | Item created |
| 401 | Unauthorized |
| 422 | Validation error |

**Example:**

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/portfolio/items \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hack4Hyd Project",
    "description": "AI Career Path Finder",
    "item_type": "hackathon",
    "skills_used": {"languages": ["Python", "TypeScript"]}
  }'
```

### GET `/v1/portfolio/items/{item_id}`

**Purpose:** Get a specific portfolio item by ID.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `item_id` | UUID | Portfolio item ID |

**Response JSON (200):** Single item schema.

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Item returned |
| 401 | Unauthorized |
| 404 | Portfolio item not found |

### PUT `/v1/portfolio/items/{item_id}`

**Purpose:** Update a portfolio item. Only provided fields are updated.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `item_id` | UUID | Portfolio item ID |

**Request JSON:** Same as create, all fields optional.

**Response JSON (200):** Updated item.

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Item updated |
| 401 | Unauthorized |
| 404 | Portfolio item not found |

### DELETE `/v1/portfolio/items/{item_id}`

**Purpose:** Soft-delete a portfolio item.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `item_id` | UUID | Portfolio item ID |

**Response JSON (200):**

```json
{
  "message": "Portfolio item deleted"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Item deleted |
| 401 | Unauthorized |
| 404 | Portfolio item not found |

**Note:** This is a soft delete. The item is not removed from the database but marked with a `deleted_at` timestamp and excluded from future queries.

---

## 5. Careers

All career endpoints are under `/v1/careers`.

### GET `/v1/careers/health`

**Purpose:** Check careers router status.

**Authentication:** No

### POST `/v1/careers/import`

**Purpose:** Bulk import careers with related data (skills, degrees, colleges, exams, scholarships, resources). Careers with duplicate titles are skipped.

**Authentication:** Yes

**Request JSON:**

```json
{
  "careers": [
    {
      "title": "Software Engineer",
      "description": "Design, develop, and maintain software systems.",
      "average_salary": 95000,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "required_education": {
        "minimum": "bachelor",
        "preferred": "master"
      },
      "typical_skills": ["Python", "JavaScript", "SQL", "Git"],
      "skills": [
        {
          "name": "Python",
          "category": "Programming",
          "level": "advanced",
          "is_required": true
        }
      ],
      "degrees": [
        {
          "name": "B.Tech Computer Science",
          "level": "bachelor",
          "field": "Computer Science",
          "is_required": true
        }
      ],
      "colleges": [
        {
          "name": "IIT Hyderabad",
          "location": "Hyderabad",
          "program_name": "B.Tech CSE"
        }
      ],
      "exams": [
        {
          "name": "JEE Main",
          "description": "Joint Entrance Examination",
          "is_required": true
        }
      ],
      "scholarships": [
        {
          "name": "INSPIRE Scholarship",
          "description": "Merit-based scholarship",
          "amount": 80000
        }
      ],
      "resources": [
        {
          "title": "CS50 by Harvard",
          "url": "https://cs50.harvard.edu",
          "resource_type": "course",
          "description": "Intro to computer science"
        }
      ]
    }
  ]
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `careers` | array | Yes | Array of CareerCreate objects |

**CareerCreate fields:**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string | Yes | max 255 chars, unique |
| `description` | string | Yes | - |
| `average_salary` | float \| null | No | Numeric(12,2) |
| `growth_outlook` | string \| null | No | max 100 chars |
| `demand_level` | string \| null | No | max 50 chars |
| `required_education` | object \| null | No | JSON |
| `typical_skills` | object \| null | No | JSON |
| `skills` | array \| null | No | Array of CareerSkillCreate |
| `degrees` | array \| null | No | Array of CareerDegreeCreate |
| `colleges` | array \| null | No | Array of CareerCollegeCreate |
| `exams` | array \| null | No | Array of CareerExamCreate |
| `scholarships` | array \| null | No | Array of CareerScholarshipCreate |
| `resources` | array \| null | No | Array of CareerResourceCreate |

**Response JSON (201):**

```json
{
  "imported": 3,
  "skipped": 1,
  "careers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "title": "Software Engineer",
      "description": "Design, develop, and maintain software systems.",
      "average_salary": 95000,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "required_education": {
        "minimum": "bachelor",
        "preferred": "master"
      },
      "typical_skills": ["Python", "JavaScript", "SQL", "Git"],
      "created_at": "2025-07-22T10:00:00Z",
      "updated_at": "2025-07-22T10:00:00Z"
    }
  ]
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 201 | Import completed (some may be skipped) |
| 401 | Unauthorized |

**Database Tables:** `careers`, `skills`, `career_skills`, `degrees`, `career_degrees`, `colleges`, `career_colleges`, `entrance_exams`, `career_entrance_exams`, `scholarships`, `career_scholarships`, `resources`, `career_resources`

### GET `/v1/careers`

**Purpose:** Search and list careers with filtering and pagination.

**Authentication:** No

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | string \| null | null | Search in title and description |
| `skill` | string \| null | null | Filter by skill name (partial match) |
| `degree_level` | string \| null | null | Filter by degree level (partial match) |
| `demand_level` | string \| null | null | Filter by demand level (partial match) |
| `min_salary` | float \| null | null | Minimum average salary |
| `max_salary` | float \| null | null | Maximum average salary |
| `sort_by` | string | "title" | Sort column (e.g., `title`, `average_salary`, `created_at`) |
| `sort_order` | string | "asc" | Sort direction: `asc` or `desc` |
| `page` | int | 1 | Page number (min: 1) |
| `page_size` | int | 20 | Items per page (min: 1, max: 100) |

**Response JSON (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "title": "Software Engineer",
      "description": "Design, develop, and maintain software systems.",
      "average_salary": 95000,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "required_education": {
        "minimum": "bachelor",
        "preferred": "master"
      },
      "typical_skills": ["Python", "JavaScript", "SQL", "Git"],
      "created_at": "2025-07-22T10:00:00Z",
      "updated_at": "2025-07-22T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Careers listed |
| 422 | Invalid query parameters |

**Database Tables:** `careers`, `career_skills`, `skills`, `career_degrees`, `degrees`

**Example:**

```bash
curl "https://tophexity-func.azurewebsites.net/v1/careers?search=engineer&demand_level=high&sort_by=average_salary&sort_order=desc&page_size=5"
```

### GET `/v1/careers/{career_id}`

**Purpose:** Get detailed career info including all related data (skills, degrees, colleges, exams, scholarships, resources).

**Authentication:** No

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `career_id` | UUID | Career ID |

**Response JSON (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440030",
  "title": "Software Engineer",
  "description": "Design, develop, and maintain software systems.",
  "average_salary": 95000,
  "growth_outlook": "above_average",
  "demand_level": "high",
  "required_education": {
    "minimum": "bachelor",
    "preferred": "master"
  },
  "typical_skills": ["Python", "JavaScript", "SQL", "Git"],
  "skills": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440100",
      "name": "Python",
      "category": "Programming"
    }
  ],
  "degrees": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440110",
      "name": "B.Tech Computer Science",
      "level": "bachelor",
      "field": "Computer Science"
    }
  ],
  "colleges": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440120",
      "name": "IIT Hyderabad",
      "location": "Hyderabad",
      "website": null,
      "ranking": 8
    }
  ],
  "exams": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440130",
      "name": "JEE Main",
      "description": "Joint Entrance Examination",
      "website": null
    }
  ],
  "scholarships": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440140",
      "name": "INSPIRE Scholarship",
      "description": "Merit-based scholarship",
      "amount": 80000,
      "eligibility": "Top 1% of board exam",
      "deadline": null,
      "website": null
    }
  ],
  "resources": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440150",
      "title": "CS50 by Harvard",
      "description": "Intro to computer science",
      "url": "https://cs50.harvard.edu",
      "resource_type": "course"
    }
  ],
  "created_at": "2025-07-22T10:00:00Z",
  "updated_at": "2025-07-22T10:00:00Z"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Career detail returned |
| 404 | Career not found |

### PUT `/v1/careers/{career_id}`

**Purpose:** Update a career's basic fields.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `career_id` | UUID | Career ID |

**Request JSON:** All fields optional.

```json
{
  "title": "Senior Software Engineer",
  "description": "Updated description",
  "average_salary": 120000,
  "growth_outlook": "much_above_average",
  "demand_level": "very_high",
  "required_education": {
    "minimum": "bachelor",
    "preferred": "master"
  },
  "typical_skills": ["Python", "Go", "Kubernetes"]
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string \| null | No | max 255 chars |
| `description` | string \| null | No | - |
| `average_salary` | float \| null | No | Numeric(12,2) |
| `growth_outlook` | string \| null | No | max 100 chars |
| `demand_level` | string \| null | No | max 50 chars |
| `required_education` | object \| null | No | JSON |
| `typical_skills` | object \| null | No | JSON |

**Response JSON (200):** Updated career schema.

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Career updated |
| 401 | Unauthorized |
| 404 | Career not found |

### DELETE `/v1/careers/{career_id}`

**Purpose:** Permanently delete a career and all junction table records.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `career_id` | UUID | Career ID |

**Response JSON (200):**

```json
{
  "message": "Career deleted successfully"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Career deleted |
| 401 | Unauthorized |
| 404 | Career not found |

**Note:** This is a hard delete. It removes all junction records (`career_skills`, `career_degrees`, `career_colleges`, `career_entrance_exams`, `career_scholarships`, `career_resources`) and then the career itself.

---

## 6. Recommendations

All recommendation endpoints are under `/v1/recommendations`.

### GET `/v1/recommendations/health`

**Purpose:** Check recommendations router status.

**Authentication:** No

### POST `/v1/recommendations`

**Purpose:** Create a new recommendation with ranked career matches.

**Authentication:** Yes

**Request JSON:**

```json
{
  "title": "Top Career Matches for Alice",
  "summary": "Based on your full-stack development background and cloud interests.",
  "items": [
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440030",
      "match_score": 95.0,
      "reasoning": "Strong match based on your Python and JavaScript skills.",
      "rank": 1
    },
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440031",
      "match_score": 85.0,
      "reasoning": "Good match given your interest in distributed systems.",
      "rank": 2
    }
  ]
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string \| null | No | max 500 chars |
| `summary` | string \| null | No | text |
| `items` | array | Yes | Array of RecommendationItemCreate (min 1 item) |

**RecommendationItemCreate fields:**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `career_id` | UUID | Yes | Must reference an existing career |
| `match_score` | float | Yes | 0.0 - 100.0 (inclusive) |
| `reasoning` | string \| null | No | text |
| `rank` | int | Yes | >= 1 |

**Response JSON (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440040",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Top Career Matches for Alice",
  "summary": "Based on your full-stack development background and cloud interests.",
  "status": "completed",
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440041",
      "career_id": "550e8400-e29b-41d4-a716-446655440030",
      "match_score": 95.0,
      "reasoning": "Strong match based on your Python and JavaScript skills.",
      "rank": 1
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440042",
      "career_id": "550e8400-e29b-41d4-a716-446655440031",
      "match_score": 85.0,
      "reasoning": "Good match given your interest in distributed systems.",
      "rank": 2
    }
  ],
  "created_at": "2025-07-22T10:00:00Z"
}
```

**Note:** The `status` field is automatically set to `"completed"` upon creation.

**Status Codes:**

| Code | Reason |
|---|---|
| 201 | Recommendation created |
| 401 | Unauthorized |
| 404 | Career not found (if career_id is invalid) |
| 422 | Validation error |

**Database Tables:** `recommendations`, `recommendation_items`

### GET `/v1/recommendations/history`

**Purpose:** List all recommendations for the current user (paginated, newest first).

**Authentication:** Yes

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number (min: 1) |
| `page_size` | int | 20 | Items per page (min: 1, max: 100) |

**Response JSON (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Top Career Matches for Alice",
      "summary": "Based on your full-stack development background.",
      "status": "completed",
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440041",
          "career_id": "550e8400-e29b-41d4-a716-446655440030",
          "match_score": 95.0,
          "reasoning": "Strong match based on your skills.",
          "rank": 1
        }
      ],
      "created_at": "2025-07-22T10:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | History returned |
| 401 | Unauthorized |

### GET `/v1/recommendations/{recommendation_id}`

**Purpose:** Get a specific recommendation by ID with all items.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `recommendation_id` | UUID | Recommendation ID |

**Response JSON (200):** Single recommendation schema.

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Recommendation returned |
| 401 | Unauthorized |
| 404 | Recommendation not found |

---

## 7. Roadmaps

All roadmap endpoints are under `/v1/roadmaps`.

### GET `/v1/roadmaps/health`

**Purpose:** Check roadmaps router status.

**Authentication:** No

### POST `/v1/roadmaps`

**Purpose:** Create a new roadmap for a career path.

**Authentication:** Yes

**Request JSON:**

```json
{
  "career_id": "550e8400-e29b-41d4-a716-446655440032",
  "title": "Path to Cloud Architect",
  "description": "Step-by-step plan to become a Cloud Architect.",
  "estimated_duration_months": 24,
  "steps": [
    {
      "title": "Master Linux & Networking",
      "description": "Build foundational infrastructure knowledge.",
      "step_order": 1,
      "duration_months": 3,
      "resources": {
        "courses": ["Linux Essentials", "Networking Fundamentals"],
        "practice": "Set up home lab"
      }
    },
    {
      "title": "Learn AWS/Azure Fundamentals",
      "description": "Get cloud certification.",
      "step_order": 2,
      "duration_months": 6,
      "resources": {
        "certification": "AWS Solutions Architect Associate"
      }
    }
  ]
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `career_id` | UUID | Yes | Must reference an existing career |
| `title` | string \| null | No | max 500 chars |
| `description` | string \| null | No | text |
| `estimated_duration_months` | int \| null | No | - |
| `steps` | array | Yes | Array of RoadmapStepCreate (min 1) |

**RoadmapStepCreate fields:**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string | Yes | max 500 chars |
| `description` | string \| null | No | text |
| `step_order` | int | Yes | >= 1 |
| `duration_months` | int \| null | No | - |
| `resources` | object \| null | No | JSON |

**Response JSON (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440050",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "career_id": "550e8400-e29b-41d4-a716-446655440032",
  "title": "Path to Cloud Architect",
  "description": "Step-by-step plan to become a Cloud Architect.",
  "status": "active",
  "estimated_duration_months": 24,
  "steps": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440051",
      "title": "Master Linux & Networking",
      "description": "Build foundational infrastructure knowledge.",
      "step_order": 1,
      "duration_months": 3,
      "resources": {
        "courses": ["Linux Essentials", "Networking Fundamentals"],
        "practice": "Set up home lab"
      }
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440052",
      "title": "Learn AWS/Azure Fundamentals",
      "description": "Get cloud certification.",
      "step_order": 2,
      "duration_months": 6,
      "resources": {
        "certification": "AWS Solutions Architect Associate"
      }
    }
  ],
  "created_at": "2025-07-22T10:00:00Z"
}
```

**Note:** The `status` field is automatically set to `"active"` upon creation.

**Status Codes:**

| Code | Reason |
|---|---|
| 201 | Roadmap created |
| 401 | Unauthorized |
| 404 | Career not found (if career_id is invalid) |
| 422 | Validation error |

**Database Tables:** `roadmaps`, `roadmap_steps`

### GET `/v1/roadmaps/history`

**Purpose:** List all roadmaps for the current user (paginated, newest first).

**Authentication:** Yes

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number (min: 1) |
| `page_size` | int | 20 | Items per page (min: 1, max: 100) |

**Response JSON (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440050",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "career_id": "550e8400-e29b-41d4-a716-446655440032",
      "title": "Path to Cloud Architect",
      "description": "Step-by-step plan to become a Cloud Architect.",
      "status": "active",
      "estimated_duration_months": 24,
      "steps": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440051",
          "title": "Master Linux & Networking",
          "description": "Build foundational infrastructure knowledge.",
          "step_order": 1,
          "duration_months": 3,
          "resources": null
        }
      ],
      "created_at": "2025-07-22T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | History returned |
| 401 | Unauthorized |

### GET `/v1/roadmaps/{roadmap_id}`

**Purpose:** Get a specific roadmap by ID with all steps.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `roadmap_id` | UUID | Roadmap ID |

**Response JSON (200):** Single roadmap schema.

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Roadmap returned |
| 401 | Unauthorized |
| 404 | Roadmap not found |

---

## 8. Backup Plans

All backup plan endpoints are under `/v1/backups`.

### GET `/v1/backups/health`

**Purpose:** Check backups router status.

**Authentication:** No

### POST `/v1/backups`

**Purpose:** Create a new backup plan with alternative career scenarios.

**Authentication:** Yes

**Request JSON:**

```json
{
  "title": "Career Contingency Plan",
  "description": "Alternative paths if primary career doesn't work out.",
  "scenarios": [
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440033",
      "scenario_name": "Switch to Data Science",
      "description": "Transition to data science using Python and analytics skills.",
      "transition_difficulty": "medium",
      "estimated_transition_months": 12,
      "reasoning": "Leverages existing programming and analytical skills."
    },
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440034",
      "scenario_name": "Move to DevOps",
      "description": "Transition to DevOps engineering.",
      "transition_difficulty": "easy",
      "estimated_transition_months": 6,
      "reasoning": "Natural progression from software engineering."
    }
  ]
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string \| null | No | max 500 chars |
| `description` | string \| null | No | text |
| `scenarios` | array | Yes | Array of BackupScenarioCreate (min 1) |

**BackupScenarioCreate fields:**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `career_id` | UUID | Yes | Must reference an existing career |
| `scenario_name` | string | Yes | max 500 chars |
| `description` | string \| null | No | text |
| `transition_difficulty` | string \| null | No | max 50 chars (e.g., "easy", "medium", "hard") |
| `estimated_transition_months` | int \| null | No | - |
| `reasoning` | string \| null | No | text |

**Response JSON (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440060",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Career Contingency Plan",
  "description": "Alternative paths if primary career doesn't work out.",
  "status": "active",
  "scenarios": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440061",
      "career_id": "550e8400-e29b-41d4-a716-446655440033",
      "scenario_name": "Switch to Data Science",
      "description": "Transition to data science using Python and analytics skills.",
      "transition_difficulty": "medium",
      "estimated_transition_months": 12,
      "reasoning": "Leverages existing programming and analytical skills."
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440062",
      "career_id": "550e8400-e29b-41d4-a716-446655440034",
      "scenario_name": "Move to DevOps",
      "description": "Transition to DevOps engineering.",
      "transition_difficulty": "easy",
      "estimated_transition_months": 6,
      "reasoning": "Natural progression from software engineering."
    }
  ],
  "created_at": "2025-07-22T10:00:00Z"
}
```

**Note:** The `status` field is automatically set to `"active"` upon creation.

**Status Codes:**

| Code | Reason |
|---|---|
| 201 | Backup plan created |
| 401 | Unauthorized |
| 404 | Career not found (if career_id is invalid) |
| 422 | Validation error |

**Database Tables:** `backup_plans`, `backup_scenarios`

### GET `/v1/backups/history`

**Purpose:** List all backup plans for the current user (paginated, newest first).

**Authentication:** Yes

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number (min: 1) |
| `page_size` | int | 20 | Items per page (min: 1, max: 100) |

**Response JSON (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440060",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Career Contingency Plan",
      "description": "Alternative paths if primary career doesn't work out.",
      "status": "active",
      "scenarios": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440061",
          "career_id": "550e8400-e29b-41d4-a716-446655440033",
          "scenario_name": "Switch to Data Science",
          "description": "Transition to data science.",
          "transition_difficulty": "medium",
          "estimated_transition_months": 12,
          "reasoning": "Leverages existing skills."
        }
      ],
      "created_at": "2025-07-22T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | History returned |
| 401 | Unauthorized |

### GET `/v1/backups/{plan_id}`

**Purpose:** Get a specific backup plan by ID with all scenarios.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `plan_id` | UUID | Backup plan ID |

**Response JSON (200):** Single backup plan schema.

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Backup plan returned |
| 401 | Unauthorized |
| 404 | Backup plan not found |

---

## 9. Chat

All chat endpoints are under `/v1/chat`.

### GET `/v1/chat/health`

**Purpose:** Check chat router status.

**Authentication:** No

### POST `/v1/chat/sessions`

**Purpose:** Create a new chat session.

**Authentication:** Yes

**Request JSON:**

```json
{
  "title": "Career Guidance Chat"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `title` | string \| null | No | max 500 chars |

**Response JSON (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440070",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Career Guidance Chat",
  "created_at": "2025-07-22T10:00:00Z"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 201 | Session created |
| 401 | Unauthorized |

**Database Tables:** `chat_sessions`

### GET `/v1/chat/sessions`

**Purpose:** List all chat sessions for the current user (paginated, newest first).

**Authentication:** Yes

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number (min: 1) |
| `page_size` | int | 20 | Items per page (min: 1, max: 100) |

**Response JSON (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440070",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Career Guidance Chat",
      "created_at": "2025-07-22T10:00:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Sessions listed |
| 401 | Unauthorized |

### GET `/v1/chat/sessions/{session_id}`

**Purpose:** Get a specific chat session with all messages.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | UUID | Chat session ID |

**Response JSON (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440070",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Career Guidance Chat",
  "created_at": "2025-07-22T10:00:00Z",
  "messages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440071",
      "session_id": "550e8400-e29b-41d4-a716-446655440070",
      "role": "user",
      "content": "Hi, I'm looking for career advice.",
      "created_at": "2025-07-22T10:00:01Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440072",
      "session_id": "550e8400-e29b-41d4-a716-446655440070",
      "role": "assistant",
      "content": "Hello! I'd be happy to help. Tell me about your background.",
      "created_at": "2025-07-22T10:00:02Z"
    }
  ]
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Session with messages returned |
| 401 | Unauthorized |
| 404 | Chat session not found |

### POST `/v1/chat/sessions/{session_id}/messages`

**Purpose:** Add messages to a chat session. Accepts an array of messages.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | UUID | Chat session ID |

**Request JSON:**

```json
[
  {
    "role": "user",
    "content": "What skills do I need for cloud architecture?"
  }
]
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `role` | string | Yes | Must match pattern: `user`, `assistant`, or `system` |
| `content` | string | Yes | min 1 character |

**Note:** The request body is a **JSON array** of messages, not a single object.

**Response JSON (201):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440073",
    "session_id": "550e8400-e29b-41d4-a716-446655440070",
    "role": "user",
    "content": "What skills do I need for cloud architecture?",
    "created_at": "2025-07-22T10:01:00Z"
  }
]
```

**Status Codes:**

| Code | Reason |
|---|---|
| 201 | Messages added |
| 401 | Unauthorized |
| 404 | Chat session not found |
| 422 | Validation error (invalid role, empty content) |

**Database Tables:** `chat_messages`

**Example:**

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/chat/sessions/SESSION_ID/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "role": "user",
      "content": "What skills do I need for cloud architecture?"
    }
  ]'
```

### DELETE `/v1/chat/sessions/{session_id}`

**Purpose:** Delete a chat session and all its messages.

**Authentication:** Yes

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `session_id` | UUID | Chat session ID |

**Response JSON (200):**

```json
{
  "message": "Chat session deleted"
}
```

**Status Codes:**

| Code | Reason |
|---|---|
| 200 | Session deleted |
| 401 | Unauthorized |
| 404 | Chat session not found |

---

## Common Mistakes

1. **Missing Authorization header:** All authenticated endpoints require `Authorization: Bearer {token}`. Forgetting this returns 401.

2. **Using refresh token for API calls:** Only `access_token` should be used in the `Authorization` header. `refresh_token` is only for `POST /v1/auth/refresh`.

3. **Duplicate profile creation:** Each user can only have one profile. `POST /v1/users/profile` returns 409 if a profile already exists.

4. **Wrong content type:** All JSON requests require `Content-Type: application/json`.

5. **Career ID validation:** Recommendation items, roadmap steps, and backup scenarios all require valid `career_id` values. Import careers first before creating recommendations/roadmaps/backups.

6. **Chat messages array:** `POST /v1/chat/sessions/{session_id}/messages` expects a JSON **array** of messages, not a single message object.

7. **Soft delete vs hard delete:** Portfolio items use soft delete (can't be restored via API). Careers use hard delete (permanent).

## Rate Limiting

Rate limiting is not currently enforced at the API level. If deploying behind Azure Front Door or similar, configure rate limits at the infrastructure layer.

## Database Tables Reference

| Table | Description |
|---|---|
| `users` | User accounts with email, password hash, role |
| `profiles` | User profile data (1:1 with users) |
| `profile_versions` | Snapshot history of profile changes |
| `portfolio_items` | User portfolio items (projects, hackathons, etc.) |
| `careers` | Career definitions |
| `skills` | Skill catalog |
| `career_skills` | Career-to-skill junction table |
| `degrees` | Degree catalog |
| `career_degrees` | Career-to-degree junction table |
| `colleges` | College catalog |
| `career_colleges` | Career-to-college junction table |
| `entrance_exams` | Entrance exam catalog |
| `career_entrance_exams` | Career-to-exam junction table |
| `scholarships` | Scholarship catalog |
| `career_scholarships` | Career-to-scholarship junction table |
| `resources` | Resource catalog |
| `career_resources` | Career-to-resource junction table |
| `recommendations` | Recommendation records |
| `recommendation_items` | Individual recommendation items |
| `roadmaps` | Career roadmap records |
| `roadmap_steps` | Individual roadmap steps |
| `backup_plans` | Backup plan records |
| `backup_scenarios` | Individual backup scenarios |
| `chat_sessions` | Chat session records |
| `chat_messages` | Individual chat messages |

## Consumer Reference

| Endpoint Group | Primary Consumer |
|---|---|
| Auth | HalfPanda (Frontend) |
| Profile | HalfPanda (Frontend) |
| Portfolio | HalfPanda (Frontend) |
| Careers | HalfPanda (Frontend), Razer (Backend) |
| Recommendations | Razer (AI Engine) |
| Roadmaps | Razer (AI Engine) |
| Backup Plans | Razer (AI Engine) |
| Chat | HalfPanda (Frontend) |
