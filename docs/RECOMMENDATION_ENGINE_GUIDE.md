# Recommendation Engine Integration Guide

This guide is for Razer's AI integration team. It explains how to submit recommendations, roadmaps, and backup plans to the Tophexity backend.

**Base URL:** `https://tophexity-func.azurewebsites.net`

---

## Overview

The recommendation engine generates career recommendations, roadmaps, and backup plans based on user profiles. The backend stores these results via REST API endpoints.

**Integration flow:**

1. Import careers into the system (if not already present)
2. Fetch user profile from the backend
3. Generate recommendations based on profile
4. Submit recommendations via API
5. Generate roadmap for top career match
6. Submit roadmap via API
7. Generate backup plans
8. Submit backup plans via API

---

## Step-by-Step Integration

### Step 1: Ensure Careers Exist

Before creating recommendations, ensure the `careers` table has the careers you want to reference. Import careers using `POST /v1/careers/import`.

**Endpoint:** `POST /v1/careers/import`

**Request:**

```json
{
  "careers": [
    {
      "title": "Software Engineer",
      "description": "Design, develop, and maintain software systems.",
      "average_salary": 95000,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "required_education": {"minimum": "bachelor", "preferred": "master"},
      "typical_skills": ["Python", "JavaScript", "SQL", "Git"],
      "skills": [
        {"name": "Python", "category": "Programming", "level": "advanced", "is_required": true},
        {"name": "JavaScript", "category": "Programming", "level": "advanced", "is_required": true}
      ],
      "degrees": [
        {"name": "B.Tech Computer Science", "level": "bachelor", "field": "Computer Science", "is_required": true}
      ],
      "colleges": [
        {"name": "IIT Hyderabad", "location": "Hyderabad"}
      ],
      "exams": [
        {"name": "JEE Main", "description": "Joint Entrance Examination", "is_required": true}
      ],
      "scholarships": [
        {"name": "INSPIRE Scholarship", "description": "Merit-based", "amount": 80000}
      ],
      "resources": [
        {"title": "CS50 by Harvard", "url": "https://cs50.harvard.edu", "resource_type": "course"}
      ]
    },
    {
      "title": "Data Scientist",
      "description": "Analyze complex datasets to extract insights.",
      "average_salary": 110000,
      "growth_outlook": "much_above_average",
      "demand_level": "very_high",
      "skills": [
        {"name": "Python", "category": "Programming", "level": "advanced", "is_required": true},
        {"name": "Machine Learning", "category": "AI", "level": "intermediate", "is_required": true}
      ]
    }
  ]
}
```

**Response (201):**

```json
{
  "imported": 2,
  "skipped": 0,
  "careers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440030",
      "title": "Software Engineer",
      "description": "Design, develop, and maintain software systems.",
      "average_salary": 95000,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "required_education": {"minimum": "bachelor", "preferred": "master"},
      "typical_skills": ["Python", "JavaScript", "SQL", "Git"],
      "created_at": "2025-07-22T10:00:00Z",
      "updated_at": "2025-07-22T10:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440031",
      "title": "Data Scientist",
      "description": "Analyze complex datasets to extract insights.",
      "average_salary": 110000,
      "growth_outlook": "much_above_average",
      "demand_level": "very_high",
      "required_education": null,
      "typical_skills": null,
      "created_at": "2025-07-22T10:00:00Z",
      "updated_at": "2025-07-22T10:00:00Z"
    }
  ]
}
```

**Notes:**
- Careers with duplicate titles are skipped (counted in `skipped`)
- Save the returned career `id` values -- you need them for recommendations, roadmaps, and backup plans
- Careers with related entities (skills, degrees, etc.) are fully created with junction table records

**Authentication:** Yes (Bearer token required)

---

### Step 2: Fetch User Profile

**Endpoint:** `GET /v1/users/profile`

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response (200):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "Alice Johnson",
  "headline": "Full-Stack Developer",
  "bio": "Passionate about building scalable web applications.",
  "location": "Hyderabad, India",
  "avatar_url": null,
  "education_level": "bachelor",
  "years_experience": 3,
  "current_field": "Software Engineering",
  "target_fields": {"primary": "Cloud Architecture", "secondary": "AI/ML"},
  "skills": {"languages": ["Python", "JavaScript", "Go"], "frameworks": ["FastAPI", "React"]},
  "interests": {"topics": ["cloud", "distributed systems", "open source"]},
  "created_at": "2025-07-22T10:00:00Z",
  "updated_at": "2025-07-22T10:00:00Z"
}
```

**Notes:**
- Returns 404 if profile doesn't exist
- Use `target_fields`, `skills`, and `interests` to drive recommendation generation
- `education_level` and `years_experience` help determine match scores

---

### Step 3: Submit Recommendations

**Endpoint:** `POST /v1/recommendations`

**Request:**

```json
{
  "title": "Career Recommendations for Alice",
  "summary": "Based on your full-stack development background and interest in cloud architecture, here are your top career matches.",
  "items": [
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440030",
      "match_score": 95.0,
      "reasoning": "Your Python, JavaScript, and FastAPI experience directly aligns with software engineering roles. 3 years of experience is strong for this career path.",
      "rank": 1
    },
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440032",
      "match_score": 82.0,
      "reasoning": "Your interest in cloud and distributed systems makes cloud architecture a strong secondary match. Some additional AWS/Azure skills would be needed.",
      "rank": 2
    },
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440033",
      "match_score": 75.0,
      "reasoning": "Your Python skills and analytical background are relevant for data science. Additional ML/statistics training recommended.",
      "rank": 3
    }
  ]
}
```

**Validation Rules:**

| Field | Rule |
|---|---|
| `title` | Optional, max 500 characters |
| `summary` | Optional, text |
| `items` | Required, array with at least 1 item |
| `items[].career_id` | Required, must be a valid UUID of an existing career |
| `items[].match_score` | Required, float between 0.0 and 100.0 (inclusive) |
| `items[].reasoning` | Optional, text explaining why this career matches |
| `items[].rank` | Required, integer >= 1 (unique within the recommendation) |

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440040",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Career Recommendations for Alice",
  "summary": "Based on your full-stack development background...",
  "status": "completed",
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440041",
      "career_id": "550e8400-e29b-41d4-a716-446655440030",
      "match_score": 95.0,
      "reasoning": "Your Python, JavaScript, and FastAPI experience...",
      "rank": 1
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440042",
      "career_id": "550e8400-e29b-41d4-a716-446655440032",
      "match_score": 82.0,
      "reasoning": "Your interest in cloud and distributed systems...",
      "rank": 2
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440043",
      "career_id": "550e8400-e29b-41d4-a716-446655440033",
      "match_score": 75.0,
      "reasoning": "Your Python skills and analytical background...",
      "rank": 3
    }
  ],
  "created_at": "2025-07-22T10:05:00Z"
}
```

**Notes:**
- The `status` field is automatically set to `"completed"`
- Items are ordered by `rank` in responses
- Save the recommendation `id` if you need to reference it later

---

### Step 4: Submit Roadmap for Top Career

**Endpoint:** `POST /v1/roadmaps`

**Request:**

```json
{
  "career_id": "550e8400-e29b-41d4-a716-446655440030",
  "title": "Path to Software Engineer",
  "description": "A structured learning path to become a proficient software engineer.",
  "estimated_duration_months": 18,
  "steps": [
    {
      "title": "Master Programming Fundamentals",
      "description": "Learn Python and JavaScript deeply. Understand data structures, algorithms, and OOP concepts.",
      "step_order": 1,
      "duration_months": 3,
      "resources": {
        "courses": ["CS50 by Harvard", "Python Crash Course"],
        "practice": "LeetCode Easy/Medium problems"
      }
    },
    {
      "title": "Learn Web Development",
      "description": "Master frontend (React) and backend (FastAPI/Express) frameworks.",
      "step_order": 2,
      "duration_months": 4,
      "resources": {
        "frontend": ["React Documentation", "freeCodeCamp"],
        "backend": ["FastAPI Documentation", "MDN Web Docs"]
      }
    },
    {
      "title": "Database & System Design",
      "description": "Learn SQL, PostgreSQL, Redis, and basic system design patterns.",
      "step_order": 3,
      "duration_months": 3,
      "resources": {
        "database": ["PostgreSQL Tutorial"],
        "system_design": ["System Design Interview (Alex Xu)"]
      }
    },
    {
      "title": "Cloud & DevOps Basics",
      "description": "Learn Docker, basic CI/CD, and cloud deployment (AWS/Azure).",
      "step_order": 4,
      "duration_months": 3,
      "resources": {
        "docker": ["Docker Documentation"],
        "cloud": ["AWS Free Tier", "Azure Free Account"]
      }
    },
    {
      "title": "Build Portfolio Projects",
      "description": "Create 2-3 substantial projects to demonstrate skills.",
      "step_order": 5,
      "duration_months": 3,
      "resources": {
        "ideas": ["Full-stack app", "API service", "Open source contribution"]
      }
    },
    {
      "title": "Interview Preparation",
      "description": "Practice coding interviews, system design, and behavioral questions.",
      "step_order": 6,
      "duration_months": 2,
      "resources": {
        "coding": ["LeetCode", "HackerRank"],
        "behavioral": ["STAR method preparation"]
      }
    }
  ]
}
```

**Validation Rules:**

| Field | Rule |
|---|---|
| `career_id` | Required, must be a valid UUID of an existing career |
| `title` | Optional, max 500 characters |
| `description` | Optional, text |
| `estimated_duration_months` | Optional, integer |
| `steps` | Required, array with at least 1 item |
| `steps[].title` | Required, max 500 characters |
| `steps[].description` | Optional, text |
| `steps[].step_order` | Required, integer >= 1 |
| `steps[].duration_months` | Optional, integer |
| `steps[].resources` | Optional, JSON object |

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440050",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "career_id": "550e8400-e29b-41d4-a716-446655440030",
  "title": "Path to Software Engineer",
  "description": "A structured learning path to become a proficient software engineer.",
  "status": "active",
  "estimated_duration_months": 18,
  "steps": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440051",
      "title": "Master Programming Fundamentals",
      "description": "Learn Python and JavaScript deeply.",
      "step_order": 1,
      "duration_months": 3,
      "resources": {
        "courses": ["CS50 by Harvard", "Python Crash Course"],
        "practice": "LeetCode Easy/Medium problems"
      }
    }
  ],
  "created_at": "2025-07-22T10:05:00Z"
}
```

**Notes:**
- The `status` is automatically set to `"active"`
- Steps are returned ordered by `step_order`
- Each step can have arbitrary JSON in `resources`

---

### Step 5: Submit Backup Plans

**Endpoint:** `POST /v1/backups`

**Request:**

```json
{
  "title": "Alternative Career Paths",
  "description": "Contingency plans if the primary career path doesn't work out.",
  "scenarios": [
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440033",
      "scenario_name": "Transition to Data Science",
      "description": "Leverage Python and analytical skills to move into data science.",
      "transition_difficulty": "medium",
      "estimated_transition_months": 12,
      "reasoning": "Your existing Python skills and analytical mindset are transferable. You would need to learn ML/statistics and gain experience with data tools like Pandas and Scikit-learn."
    },
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440034",
      "scenario_name": "Move to DevOps Engineering",
      "description": "Transition to DevOps focusing on CI/CD and cloud infrastructure.",
      "transition_difficulty": "easy",
      "estimated_transition_months": 6,
      "reasoning": "Your software engineering background provides a natural bridge to DevOps. You already understand code deployment concepts."
    },
    {
      "career_id": "550e8400-e29b-41d4-a716-446655440035",
      "scenario_name": "Product Management",
      "description": "Move into product management combining technical and business skills.",
      "transition_difficulty": "hard",
      "estimated_transition_months": 18,
      "reasoning": "Requires developing business strategy, communication, and stakeholder management skills. An MBA may help."
    }
  ]
}
```

**Validation Rules:**

| Field | Rule |
|---|---|
| `title` | Optional, max 500 characters |
| `description` | Optional, text |
| `scenarios` | Required, array with at least 1 item |
| `scenarios[].career_id` | Required, must be a valid UUID of an existing career |
| `scenarios[].scenario_name` | Required, max 500 characters |
| `scenarios[].description` | Optional, text |
| `scenarios[].transition_difficulty` | Optional, max 50 chars (suggest: "easy", "medium", "hard") |
| `scenarios[].estimated_transition_months` | Optional, integer |
| `scenarios[].reasoning` | Optional, text |

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440060",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Alternative Career Paths",
  "description": "Contingency plans if the primary career path doesn't work out.",
  "status": "active",
  "scenarios": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440061",
      "career_id": "550e8400-e29b-41d4-a716-446655440033",
      "scenario_name": "Transition to Data Science",
      "description": "Leverage Python and analytical skills to move into data science.",
      "transition_difficulty": "medium",
      "estimated_transition_months": 12,
      "reasoning": "Your existing Python skills and analytical mindset are transferable."
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440062",
      "career_id": "550e8400-e29b-41d4-a716-446655440034",
      "scenario_name": "Move to DevOps Engineering",
      "description": "Transition to DevOps focusing on CI/CD and cloud infrastructure.",
      "transition_difficulty": "easy",
      "estimated_transition_months": 6,
      "reasoning": "Your software engineering background provides a natural bridge."
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440063",
      "career_id": "550e8400-e29b-41d4-a716-446655440035",
      "scenario_name": "Product Management",
      "description": "Move into product management.",
      "transition_difficulty": "hard",
      "estimated_transition_months": 18,
      "reasoning": "Requires developing business strategy skills."
    }
  ],
  "created_at": "2025-07-22T10:05:00Z"
}
```

**Notes:**
- The `status` is automatically set to `"active"`
- Scenarios are ordered by creation time

---

## Viewing Recommendation History

**Endpoint:** `GET /v1/recommendations/history`

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `page_size` | int | 20 | Items per page (max 100) |

**Response (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440040",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Career Recommendations for Alice",
      "summary": "Based on your full-stack development background...",
      "status": "completed",
      "items": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440041",
          "career_id": "550e8400-e29b-41d4-a716-446655440030",
          "match_score": 95.0,
          "reasoning": "Strong match based on skills.",
          "rank": 1
        }
      ],
      "created_at": "2025-07-22T10:05:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

**Viewing Roadmap History:**

```
GET /v1/roadmaps/history?page=1&page_size=20
```

Same response format as recommendations.

**Viewing Backup Plan History:**

```
GET /v1/backups/history?page=1&page_size=20
```

Same response format as recommendations.

---

## Retrieving Specific Records

```bash
# Get a specific recommendation
GET /v1/recommendations/{recommendation_id}

# Get a specific roadmap
GET /v1/roadmaps/{roadmap_id}

# Get a specific backup plan
GET /v1/backups/{plan_id}
```

All return the single record with nested items/steps/scenarios.

---

## Complete Integration Example (Python)

```python
import httpx

BASE_URL = "https://tophexity-func.azurewebsites.net"
TOKEN = "your_access_token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

# 1. Import careers
careers_response = httpx.post(
    f"{BASE_URL}/v1/careers/import",
    headers=headers,
    json={
        "careers": [
            {
                "title": "AI Research Scientist",
                "description": "Conduct cutting-edge AI research.",
                "average_salary": 130000,
                "demand_level": "very_high",
                "skills": [
                    {"name": "Machine Learning", "category": "AI", "level": "expert"},
                ],
            }
        ]
    },
)
career_ids = [c["id"] for c in careers_response.json()["careers"]]

# 2. Create recommendation
rec_response = httpx.post(
    f"{BASE_URL}/v1/recommendations",
    headers=headers,
    json={
        "title": "AI Engine Results",
        "summary": "Top matches based on profile analysis.",
        "items": [
            {
                "career_id": career_ids[0],
                "match_score": 88.5,
                "reasoning": "Strong ML background.",
                "rank": 1,
            }
        ],
    },
)

# 3. Create roadmap
roadmap_response = httpx.post(
    f"{BASE_URL}/v1/roadmaps",
    headers=headers,
    json={
        "career_id": career_ids[0],
        "title": "Path to AI Research Scientist",
        "estimated_duration_months": 36,
        "steps": [
            {
                "title": "Complete ML Fundamentals",
                "description": "Master core ML concepts.",
                "step_order": 1,
                "duration_months": 6,
            },
            {
                "title": "Research Experience",
                "description": "Join a research lab.",
                "step_order": 2,
                "duration_months": 24,
            },
        ],
    },
)

# 4. Create backup plan
backup_response = httpx.post(
    f"{BASE_URL}/v1/backups",
    headers=headers,
    json={
        "title": "AI Research Alternatives",
        "scenarios": [
            {
                "career_id": career_ids[0],
                "scenario_name": "ML Engineer",
                "description": "Apply ML skills in industry.",
                "transition_difficulty": "easy",
                "estimated_transition_months": 3,
                "reasoning": "Direct skill transfer.",
            }
        ],
    },
)
```

---

## Error Handling

### Common Errors

| Scenario | Status Code | Response | Action |
|---|---|---|---|
| Invalid career_id in recommendation item | 422 | Validation error | Verify career_id exists |
| Invalid career_id in roadmap | 422 | Validation error | Verify career_id exists |
| Invalid career_id in backup scenario | 422 | Validation error | Verify career_id exists |
| match_score out of range | 422 | Validation error | Ensure 0.0 <= score <= 100.0 |
| rank < 1 | 422 | Validation error | Ensure rank >= 1 |
| Missing required field | 422 | Validation error | Check request body |
| Invalid token | 401 | "Invalid or expired token" | Refresh token |
| Career not found for roadmap | 404 | "Career not found" | Import career first |

### Error Response Format

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Recommended Retry Strategy

1. On **401**: Refresh the access token using `POST /v1/auth/refresh`, then retry
2. On **404** (career not found): Import the career first, then retry
3. On **422**: Fix validation errors and retry
4. On **500**: Log the error and retry with exponential backoff

---

## Status Values

| Resource | Possible Status Values |
|---|---|
| Recommendation | `pending`, `completed`, `failed` |
| Roadmap | `active`, `completed`, `archived` |
| Backup Plan | `active`, `inactive` |

Note: The API automatically sets status to `completed` (recommendations) or `active` (roadmaps, backups) upon creation. The engine does not need to set these explicitly.

---

## Summary of Endpoints

| Action | Method | Endpoint | Auth |
|---|---|---|---|
| Import careers | POST | `/v1/careers/import` | Yes |
| Get career detail | GET | `/v1/careers/{career_id}` | No |
| Get user profile | GET | `/v1/users/profile` | Yes |
| Create recommendation | POST | `/v1/recommendations` | Yes |
| View recommendation | GET | `/v1/recommendations/{recommendation_id}` | Yes |
| List recommendations | GET | `/v1/recommendations/history` | Yes |
| Create roadmap | POST | `/v1/roadmaps` | Yes |
| View roadmap | GET | `/v1/roadmaps/{roadmap_id}` | Yes |
| List roadmaps | GET | `/v1/roadmaps/history` | Yes |
| Create backup plan | POST | `/v1/backups` | Yes |
| View backup plan | GET | `/v1/backups/{plan_id}` | Yes |
| List backup plans | GET | `/v1/backups/history` | Yes |
| Login | POST | `/v1/auth/login` | No |
| Refresh token | POST | `/v1/auth/refresh` | No |
