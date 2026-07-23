# Tophexity Career Intelligence Module — Technical Specification

**Version:** 1.0.0
**Date:** 2026-07-23
**Author:** Tophexity Backend Team
**Audience:** Razer (Career Intelligence Developer)
**Status:** Authoritative — this document is the single source of truth for the integration contract.

---

## Table of Contents

1. [System Responsibilities & Architecture](#1-system-responsibilities--architecture)
2. [Knowledge Base Data Model](#2-knowledge-base-data-model)
3. [Recommendation Engine](#3-recommendation-engine)
4. [REST API Specification](#4-rest-api-specification)
5. [Input JSON Schema](#5-input-json-schema)
6. [Output JSON Schema](#6-output-json-schema)
7. [Integration Protocol](#7-integration-protocol)
8. [Testing Requirements](#8-testing-requirements)
9. [Documentation Package](#9-documentation-package)
10. [Appendix: Full Example Flows](#10-appendix-full-example-flows)

---

# 1. System Responsibilities & Architecture

## 1.1 Three-Developer Model

| Developer | Scope | System |
|-----------|-------|--------|
| **Tophexity Backend** (Developer 1) | Azure infrastructure, database, auth, AI (GPT-5), chat system, conversation memory, user profiles, portfolio, roadmaps, backup plans, API gateway, deployment | `https://tophexity-func.azurewebsites.net` |
| **Razer** (Developer 2) | Career intelligence — knowledge base, recommendation engine, roadmap generation, backup plan generation, skill gap analysis | Exposed via REST API at a URL provided by Razer (e.g., `https://razer-engine.example.com`) |
| **HalfPanda** (Developer 3) | Frontend UI/UX | Communicates ONLY with Tophexity Backend |

## 1.2 Communication Flow

```
┌─────────────┐         ┌──────────────────────┐         ┌─────────────────────┐
│   Frontend   │ ──1──▶  │  Tophexity Backend    │ ──3──▶  │  Razer's Engine     │
│ (HalfPanda)  │ ◀──2──  │  (Azure Functions)    │ ◀──4──  │  (Career Intel)     │
└─────────────┘         │                      │         │                     │
                        │  - Auth (JWT)        │         │  - Knowledge Base   │
                        │  - DB (PostgreSQL)   │         │  - Recommendations  │
                        │  - AI (GPT-5)        │         │  - Roadmaps         │
                        │  - Chat              │         │  - Backup Plans     │
                        │  - Profiles          │         │  - Skill Analysis   │
                        │  - Portfolio         │         │                     │
                        └──────────────────────┘         └─────────────────────┘
```

**Rule:** The frontend NEVER communicates directly with Razer. All requests flow through the Tophexity Backend. Razer's API is only consumed by the Tophexity Backend.

## 1.3 What Razer Owns

- Career knowledge base (careers, skills, colleges, degrees, exams, scholarships, resources)
- Recommendation algorithm (profile analysis, match scoring, confidence, reasoning)
- Roadmap generation (step-by-step learning paths for careers)
- Backup plan generation (alternative career scenarios)
- Skill gap analysis (comparing user skills against career requirements)
- Career comparison and search
- All domain-specific intelligence logic

## 1.4 What Razer Does NOT Own

- User authentication or authorization (Tophexity handles this)
- Database storage of user data (Tophexity stores recommendations, roadmaps, backups)
- Chat or conversation AI (Tophexity handles this via GPT-5)
- Frontend rendering (HalfPanda handles this)
- User profile CRUD (Tophexity handles this)
- Portfolio management (Tophexity handles this)
- AI prompt management (Tophexity handles this)
- Rate limiting or circuit breaker logic (Tophexity handles this)

## 1.5 What Tophexity Backend Owns

- PostgreSQL database with 27 tables including: `users`, `profiles`, `profile_versions`, `portfolio_items`, `careers`, `skills`, `career_skills`, `degrees`, `career_degrees`, `colleges`, `career_colleges`, `entrance_exams`, `career_entrance_exams`, `scholarships`, `career_scholarships`, `resources`, `career_resources`, `career_relations`, `recommendations`, `recommendation_items`, `roadmaps`, `roadmap_steps`, `backup_plans`, `backup_scenarios`, `chat_sessions`, `chat_messages`
- JWT authentication (access tokens: 30min, refresh tokens: 7 days)
- Career CRUD API (`POST /v1/careers/import`, `GET /v1/careers`, etc.)
- Recommendation storage (`POST /v1/recommendations`)
- Roadmap storage (`POST /v1/roadmaps`)
- Backup plan storage (`POST /v1/backups`)
- GPT-5 integration for chat and prompt rendering
- Circuit breaker, rate limiting, security scanning
- All admin and monitoring APIs

## 1.6 Technology Freedom

Razer has complete freedom regarding implementation language, framework, database, and deployment. The ONLY requirement is that the system exposes HTTP REST APIs conforming to the contract defined in this specification.

Recommended (but not required):
- Any language: Python, Go, Rust, TypeScript, etc.
- Any framework: FastAPI, Gin, Axum, Express, etc.
- Any database for internal knowledge base storage
- Any deployment target: cloud VM, container, serverless

---

# 2. Knowledge Base Data Model

Razer's knowledge base is the authoritative source for career intelligence data. Tophexity's database mirrors this data via the import endpoint.

## 2.1 Careers

### Purpose
The central entity. Every recommendation, roadmap, and backup plan references a career.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier. Must be a UUID v4 string. |
| `title` | string (max 255) | Yes | Unique career title. Must be unique across all careers. Examples: "Software Engineer", "Data Scientist", "Mechanical Engineer". |
| `description` | string (text) | Yes | 2-5 sentence description of what the career involves, day-to-day work, and impact. |
| `average_salary` | number (12,2) | No | Annual salary in USD. Example: `120000.00`. Null if unknown. |
| `growth_outlook` | string (max 100) | No | One of: `"above_average"`, `"average"`, `"below_average"`, `"declining"`, `"emerging"`. |
| `demand_level` | string (max 50) | No | One of: `"high"`, `"medium"`, `"low"`, `"very_high"`, `"very_low"`. |
| `required_education` | JSON object | No | Structured education requirements. See schema below. |
| `typical_skills` | JSON object | No | Key-value pairs of skill name to proficiency level (1-10). |
| `created_at` | ISO 8601 | Auto | Timestamp. |
| `updated_at` | ISO 8601 | Auto | Timestamp. |

**`required_education` schema:**
```json
{
  "min_degree": "bachelor",
  "preferred_degree": "master",
  "fields": ["Computer Science", "Engineering", "Mathematics"]
}
```

**`typical_skills` schema:**
```json
{
  "programming": 9,
  "problem_solving": 8,
  "communication": 7,
  "leadership": 6
}
```

### Relationships
- Has many `skills` via `career_skills` junction table
- Has many `degrees` via `career_degrees` junction table
- Has many `colleges` via `career_colleges` junction table
- Has many `entrance_exams` via `career_entrance_exams` junction table
- Has many `scholarships` via `career_scholarships` junction table
- Has many `resources` via `career_resources` junction table
- Has many outgoing/incoming `career_relations`

### Validation Rules
- `title` must be unique (case-sensitive)
- `title` must be 1-255 characters
- `description` must be non-empty
- `average_salary` must be >= 0 if provided
- `growth_outlook` must be one of the allowed values
- `demand_level` must be one of the allowed values

### IDs
UUID v4 strings. Example: `"550e8400-e29b-41d4-a716-446655440000"`

### Normalization
- Careers are normalized as top-level entities
- Skills, degrees, colleges, exams, scholarships, resources are separate normalized tables
- Junction tables handle many-to-many relationships with additional metadata (e.g., `is_required`, `level`, `program_name`)

### Versioning
- Not versioned. Careers are updated in place via `updated_at` timestamp.
- When a career's data changes significantly, the `updated_at` timestamp is updated.

### Update Strategy
- Razer periodically refreshes the knowledge base (weekly or on-demand)
- New careers are added, existing ones updated, obsolete ones marked
- The Tophexity import endpoint (`POST /v1/careers/import`) handles deduplication by title

### Expected Size
- 200-500 careers at launch
- Scaling to 1000+ careers over time
- Each career has 3-15 related skills, 1-5 degrees, 5-50 colleges, 1-10 exams, 0-20 scholarships, 1-10 resources

### Storage
- Razer stores internally however they choose (PostgreSQL, MongoDB, JSON files, etc.)
- Must be able to export via API endpoints for Tophexity to consume

### Export Format
- JSON via REST API (see Section 4)

---

## 2.2 Skills

### Purpose
Taxonomy of skills that careers require and users possess.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 255) | Yes | Unique skill name. Example: "Python", "Machine Learning", "Project Management" |
| `category` | string (max 255) | No | Skill category. Example: "Programming", "Data Science", "Soft Skills", "DevOps", "Design" |

### Validation Rules
- `name` must be unique (case-sensitive)
- `name` must be 1-255 characters
- `category` is optional but recommended for grouping

### Expected Size
- 500-2000 skills
- Categories: Programming, Data Science, Cloud/DevOps, Design, Soft Skills, Domain-Specific

---

## 2.3 Career-Skill Junction

### Purpose
Links careers to skills with proficiency requirements.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | References career |
| `skill_id` | UUID | Yes | References skill |
| `level` | enum | Yes | One of: `"beginner"`, `"intermediate"`, `"advanced"`, `"expert"` |
| `is_required` | boolean | Yes | Default: `true`. If false, skill is preferred but not mandatory. |

### Unique Constraint
`(career_id, skill_id)` — a career-skill pair appears at most once.

---

## 2.4 Degrees

### Purpose
Academic degrees relevant to careers.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 255) | Yes | Unique degree name. Example: "B.Tech Computer Science" |
| `level` | string (max 100) | Yes | Degree level: `"high_school"`, `"diploma"`, `"bachelor"`, `"master"`, `"phd"`, `"certificate"` |
| `field` | string (max 255) | No | Field of study. Example: "Computer Science" |

### Expected Size
- 100-300 degrees

---

## 2.5 Colleges

### Purpose
Educational institutions offering programs relevant to careers.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | College name. NOT globally unique (same name can exist in different locations) |
| `location` | string (max 255) | No | City, State, Country. Example: "Hyderabad, India" |
| `website` | string (max 1024) | No | Official website URL |
| `ranking` | integer | No | National or global ranking (lower = better) |

### Expected Size
- 200-1000 colleges
- Focus on India initially, expanding globally

---

## 2.6 Entrance Exams

### Purpose
Examinations required or recommended for career paths.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 255) | Yes | Unique exam name. Example: "JEE Main", "GRE", "CAT" |
| `description` | text | No | What the exam covers, who conducts it |
| `website` | string (max 1024) | No | Official exam website |

### Expected Size
- 50-200 exams

---

## 2.7 Scholarships

### Purpose
Financial aid opportunities linked to career paths.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | Scholarship name |
| `description` | text | No | Eligibility criteria, what it covers |
| `amount` | number (12,2) | No | Amount in USD |
| `eligibility` | text | No | Who can apply |
| `deadline` | string (max 50) | No | Application deadline. Format: `"YYYY-MM-DD"` or `"Rolling"` |
| `website` | string (max 1024) | No | Application URL |

### Expected Size
- 100-500 scholarships

---

## 2.8 Learning Resources

### Purpose
Courses, tutorials, books, and tools for skill development.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `title` | string (max 500) | Yes | Resource title. Example: "CS50: Introduction to Computer Science" |
| `description` | text | No | What the resource covers |
| `url` | string (max 1024) | Yes | Direct link to the resource |
| `resource_type` | string (max 100) | Yes | One of: `"course"`, `"book"`, `"tutorial"`, `"practice"`, `"tool"`, `"certification"`, `"video"`, `"article"` |

### Expected Size
- 500-2000 resources

---

## 2.9 Career Relations

### Purpose
Defines relationships between careers (e.g., "Software Engineer" is related to "Data Engineer").

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | Source career |
| `related_career_id` | UUID | Yes | Target career |
| `relation_type` | enum | Yes | One of: `"related"`, `"alternative"`, `"prerequisite"`, `"supplementary"` |
| `description` | text | No | Why this relationship exists |

### Relation Types
- `related` — Similar career, easy to transition
- `alternative` — Viable backup option
- `prerequisite` — Must complete this career/skill first
- `supplementary` — Complementary career that enhances the primary

### Unique Constraint
`(career_id, related_career_id, relation_type)` — no duplicate relations

---

## 2.10 Industries (Optional Extension)

### Purpose
Group careers by industry sector. Not in current Tophexity schema but recommended for Razer's internal use.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 255) | Yes | Industry name. Example: "Technology", "Healthcare", "Finance" |
| `description` | text | No | Brief description |

### Expected Size
- 20-50 industries

---

# 3. Recommendation Engine

## 3.1 Overview

The recommendation engine takes a user profile (submitted by Tophexity Backend) and produces a ranked list of career recommendations with match scores, confidence levels, reasoning, suggested colleges, degrees, exams, scholarships, and learning resources.

## 3.2 Profile Analysis

The engine analyzes these dimensions of the user:

### 3.2.1 Interests
- Parsed from `profile.interests` (JSON dict)
- Mapped to career interest clusters using Holland Code (RIASEC) or similar framework
- Weight: 25% of total match score

### 3.2.2 Academic Background
- Parsed from `profile.education_level`, `academic_info` in input JSON
- Compared against career `required_education`
- Weight: 20% of total match score

### 3.2.3 Skills
- Parsed from `profile.skills` (JSON dict) and `portfolio[].skills_used`
- Compared against career `typical_skills` and `career_skills` junction
- Gap analysis: which required skills are missing
- Weight: 25% of total match score

### 3.2.4 Experience
- Parsed from `profile.years_experience` and `portfolio` items
- Portfolio items weighted by type: internship > project > certificate > competition
- Weight: 10% of total match score

### 3.2.5 Goals
- Parsed from `profile.target_fields` and `goals` in input JSON
- Directly influence which careers are considered
- Weight: 10% of total match score

### 3.2.6 Financial Constraints
- Parsed from `financial_info` in input JSON
- Influences college/scholarship suggestions
- Filters careers by salary expectations vs. education cost
- Weight: 5% of total match score

### 3.2.7 Location
- Parsed from `profile.location` and `preferences.location` in input JSON
- Filters colleges by location
- Influences salary expectations (cost of living adjustment)
- Weight: 5% of total match score

## 3.3 Match Score Calculation

Each career gets a `match_score` between 0.00 and 100.00.

```
match_score = (
    interest_score * 0.25 +
    academic_score * 0.20 +
    skill_score * 0.25 +
    experience_score * 0.10 +
    goal_score * 0.10 +
    financial_score * 0.05 +
    location_score * 0.05
)
```

Each sub-score is 0-100:
- **interest_score**: How well user interests align with career domain
- **academic_score**: How well education level matches requirements (100 = exact match, 0 = completely mismatched)
- **skill_score**: Percentage of required skills the user already has, weighted by `is_required`
- **experience_score**: Relevance and depth of portfolio items
- **goal_score**: Alignment with user's stated target fields
- **financial_score**: Whether the career path is financially feasible given constraints
- **location_score**: Whether relevant colleges/opportunities exist near the user

## 3.4 Confidence Score

Each recommendation includes a `confidence` score (0.00-1.00) indicating how certain the engine is about the match.

```
confidence = f(profile_completeness, data_quality, historical_accuracy)
```

Factors:
- **Profile completeness**: More profile data = higher confidence
- **Data quality**: How many fields in the knowledge base are populated for this career
- **Historical accuracy**: If feedback data is available, how accurate past recommendations were

Minimum confidence threshold: 0.30. Recommendations below this threshold are excluded.

## 3.5 Reasoning Generation

Every recommendation must include a `reasoning` object explaining why this career was recommended. This is structured JSON, not free-form text.

```json
{
  "summary": "Software Engineering matches your strong programming skills and interest in building products.",
  "strengths": [
    "You have intermediate Python skills, which is a core requirement",
    "Your project portfolio demonstrates practical software development experience",
    "Your education level meets the typical requirement"
  ],
  "weaknesses": [
    "You lack experience with cloud platforms (AWS/Azure), which is increasingly important",
    "No formal degree in Computer Science (optional for this career)"
  ],
  "missing_skills": [
    {"skill": "AWS", "importance": "high", "how_to_acquire": "AWS Free Tier + hands-on projects"},
    {"skill": "Docker", "importance": "medium", "how_to_acquire": "Official Docker tutorial + personal projects"}
  ],
  "career_outlook": "Strong demand with above-average growth. AI/ML specialization can further boost prospects.",
  "salary_range": {"min": 80000, "max": 160000, "currency": "USD", "experience_level": "mid"}
}
```

## 3.6 Alternative Careers

For each primary recommendation, include 2-3 alternative careers that:
- Share 60%+ of required skills
- Are viable transitions from the primary career
- Have different risk profiles (e.g., more stable, higher growth, lower entry barrier)

## 3.7 Ranking

Recommendations are ranked by `match_score` descending. Ties broken by:
1. Higher confidence
2. Better growth outlook
3. Higher demand level

Return top 5-10 recommendations.

## 3.8 Determinism

For the same input profile, the engine MUST produce the same output (deterministic). This means:
- No random sampling in the core algorithm
- If using LLM for reasoning generation, use temperature=0 and fixed seed
- Knowledge base lookups must be consistent
- Score calculations must be pure functions of input

Exception: If the knowledge base has been updated between calls, different results are expected.

## 3.9 Roadmap Generation

For each recommended career, generate a roadmap with:
- 4-8 sequential steps
- Each step has a title, description, duration (months), and resources
- Steps progress from foundational to advanced
- Resources reference specific courses, certifications, or milestones from the knowledge base

## 3.10 Backup Plan Generation

For each recommended career, generate 2-3 backup plans:
- Alternative careers that share skills with the primary
- Each plan includes: career reference, scenario name, description, transition difficulty (`"easy"`, `"medium"`, `"hard"`), estimated transition time (months), reasoning
- Backup careers should be lower-risk or more accessible versions of the primary

---

# 4. REST API Specification

All endpoints are consumed by the Tophexity Backend. Razer does NOT need to handle user authentication — the Tophexity Backend authenticates users and forwards only the relevant data.

## 4.1 Base Configuration

```
Base URL: <RAZER_SERVICE_URL>  (provided by Razer, e.g., https://razer-engine.example.com)
API Version: v1 (prefix: /api/v1)
Content-Type: application/json
```

## 4.2 Authentication

Razer's API is INTERNAL — only the Tophexity Backend calls it. Two options:

**Option A (Recommended): API Key**
- Tophexity Backend sends `X-API-Key: <shared-secret>` header
- Razer validates this key
- Simple, no OAuth flow needed

**Option B: Mutual TLS**
- mTLS between Tophexity Backend and Razer's service
- Stronger security, more complex setup

Tophexity Backend will store Razer's API key in its `Settings` configuration under `RECOMMENDATION_SERVICE_API_KEY`.

## 4.3 Rate Limits

Razer should expect:
- Peak: 100 requests/minute during high traffic
- Average: 20 requests/minute
- Burst: up to 50 requests in 10 seconds

Razer should implement rate limiting and return `429 Too Many Requests` with `Retry-After` header if exceeded.

## 4.4 Endpoints

### 4.4.1 Health Check

**Purpose:** Verify Razer's service is running and healthy.

**Route:** `GET /api/v1/health`

**Authentication:** None

**Headers:** None

**Request Body:** None

**Response 200:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-07-23T12:00:00Z",
  "knowledge_base": {
    "careers": 350,
    "skills": 1200,
    "colleges": 500,
    "last_updated": "2026-07-22T06:00:00Z"
  }
}
```

**Response 503:**
```json
{
  "status": "unhealthy",
  "error": "Knowledge base sync failed",
  "timestamp": "2026-07-23T12:00:00Z"
}
```

---

### 4.4.2 Version

**Purpose:** API version information for backwards compatibility.

**Route:** `GET /api/v1/version`

**Authentication:** None

**Response 200:**
```json
{
  "api_version": "1.0.0",
  "engine_version": "1.0.0",
  "min_compatible_version": "1.0.0",
  "supported_features": [
    "recommendations",
    "roadmaps",
    "backup_plans",
    "career_search",
    "skill_analysis",
    "career_comparison"
  ]
}
```

---

### 4.4.3 Model Status

**Purpose:** Check if the recommendation model/engine is loaded and ready.

**Route:** `GET /api/v1/model/status`

**Authentication:** API Key

**Response 200:**
```json
{
  "model_loaded": true,
  "model_name": "career-recommender-v1",
  "model_version": "1.0.0",
  "knowledge_base_version": "2026-07-22",
  "uptime_seconds": 86400,
  "memory_usage_mb": 256,
  "last_prediction_ms": 145.2
}
```

---

### 4.4.4 Statistics

**Purpose:** Operational metrics for monitoring.

**Route:** `GET /api/v1/stats`

**Authentication:** API Key

**Response 200:**
```json
{
  "total_recommendations_served": 15230,
  "average_response_time_ms": 230.5,
  "p95_response_time_ms": 450.0,
  "p99_response_time_ms": 800.0,
  "error_rate_percent": 0.12,
  "active_connections": 3,
  "knowledge_base": {
    "total_careers": 350,
    "total_skills": 1200,
    "total_colleges": 500,
    "total_degrees": 150,
    "total_exams": 80,
    "total_scholarships": 200,
    "total_resources": 1000,
    "total_relations": 800
  }
}
```

---

### 4.4.5 Generate Recommendations

**Purpose:** Core endpoint. Takes a user profile and returns ranked career recommendations.

**Route:** `POST /api/v1/recommendations/generate`

**Authentication:** API Key

**Headers:**
```
Content-Type: application/json
X-API-Key: <shared-secret>
X-Request-ID: <uuid>  (optional, for tracing)
```

**Request JSON:** See Section 5 (Input JSON Schema)

**Response 200:**
```json
{
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "generated_at": "2026-07-23T12:00:00Z",
  "processing_time_ms": 245.3,
  "profile_summary": {
    "education_level": "bachelor",
    "skills_count": 8,
    "experience_years": 2,
    "interests_count": 5
  },
  "recommendations": [
    {
      "rank": 1,
      "career_id": "550e8400-e29b-41d4-a716-446655440001",
      "career_title": "Software Engineer",
      "match_score": 87.50,
      "confidence": 0.92,
      "reasoning": {
        "summary": "Software Engineering aligns strongly with your programming skills and project experience.",
        "strengths": [
          "Strong Python skills match core requirement",
          "Portfolio demonstrates practical development",
          "Education level is appropriate"
        ],
        "weaknesses": [
          "Limited cloud platform experience",
          "No formal CS degree"
        ],
        "missing_skills": [
          {
            "skill": "AWS",
            "importance": "high",
            "current_level": "none",
            "required_level": "beginner",
            "how_to_acquire": "AWS Free Tier + hands-on projects",
            "estimated_time_months": 3
          }
        ],
        "career_outlook": "Above-average growth, strong demand",
        "salary_range": {
          "min": 80000,
          "max": 160000,
          "currency": "USD",
          "experience_level": "mid"
        }
      },
      "career_details": {
        "description": "Design, develop, and maintain software systems.",
        "average_salary": 120000.00,
        "growth_outlook": "above_average",
        "demand_level": "high"
      },
      "suggested_colleges": [
        {
          "college_id": "...",
          "name": "IIT Hyderabad",
          "location": "Hyderabad, India",
          "program_name": "B.Tech CSE",
          "relevance_reason": "Top-ranked CS program, strong placement record"
        }
      ],
      "suggested_degrees": [
        {
          "degree_id": "...",
          "name": "B.Tech Computer Science",
          "level": "bachelor",
          "is_required": false,
          "relevance_reason": "Provides foundational knowledge for software engineering"
        }
      ],
      "suggested_exams": [
        {
          "exam_id": "...",
          "name": "JEE Main",
          "is_required": false,
          "relevance_reason": "Required for admission to top engineering colleges"
        }
      ],
      "suggested_scholarships": [
        {
          "scholarship_id": "...",
          "name": "Merit-cum-Means Scholarship",
          "amount": 50000.00,
          "eligibility": "Economically weaker sections with strong academics",
          "relevance_reason": "Matches your financial profile"
        }
      ],
      "learning_resources": [
        {
          "resource_id": "...",
          "title": "CS50: Introduction to Computer Science",
          "url": "https://cs50.harvard.edu",
          "resource_type": "course",
          "relevance_reason": "Builds foundational CS knowledge"
        }
      ],
      "alternatives": [
        {
          "career_id": "...",
          "career_title": "Data Engineer",
          "match_score": 72.30,
          "transition_difficulty": "easy",
          "reasoning": "Shares 70% of software engineering skills with added data focus"
        },
        {
          "career_id": "...",
          "career_title": "DevOps Engineer",
          "match_score": 68.10,
          "transition_difficulty": "medium",
          "reasoning": "Combines software development with infrastructure skills"
        }
      ],
      "related_careers": [
        {
          "career_id": "...",
          "career_title": "Full Stack Developer",
          "relation_type": "related"
        }
      ]
    }
  ],
  "metadata": {
    "total_careers_evaluated": 350,
    "algorithm_version": "1.0.0",
    "knowledge_base_version": "2026-07-22"
  }
}
```

**Response 400:** (Invalid input)
```json
{
  "error": "invalid_input",
  "message": "Profile must include at least one of: interests, skills, or education_level",
  "details": {
    "missing_fields": ["interests", "skills"]
  }
}
```

**Response 422:** (Validation error)
```json
{
  "error": "validation_error",
  "message": "Invalid field types in request body",
  "details": {
    "field": "profile.skills",
    "expected": "object",
    "received": "string"
  }
}
```

**Response 429:** (Rate limited)
```json
{
  "error": "rate_limited",
  "message": "Too many requests",
  "retry_after_seconds": 30
}
```

**Response 500:** (Internal error)
```json
{
  "error": "internal_error",
  "message": "Recommendation generation failed",
  "request_id": "..."
}
```

**Response 503:** (Model not ready)
```json
{
  "error": "service_unavailable",
  "message": "Recommendation model is not loaded"
}
```

**Typical Usage:**
Tophexity Backend calls this when a user requests career recommendations. The backend assembles the input JSON from the user's profile, portfolio, and preferences, then stores the returned recommendations in its database.

**Timeout:** Tophexity Backend will wait up to 10 seconds for a response. Razer should aim for p95 < 500ms.

---

### 4.4.6 Search Careers

**Purpose:** Search the career knowledge base by query, filters, or both.

**Route:** `GET /api/v1/careers/search`

**Authentication:** API Key

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | No | Free-text search across title and description |
| `category` | string | No | Filter by industry/category |
| `min_salary` | number | No | Minimum average salary |
| `max_salary` | number | No | Maximum average salary |
| `demand_level` | string | No | Filter by demand level |
| `growth_outlook` | string | No | Filter by growth outlook |
| `skill` | string | No | Filter by skill name (partial match) |
| `page` | integer | No | Page number (default: 1) |
| `page_size` | integer | No | Results per page (default: 20, max: 100) |

**Response 200:**
```json
{
  "items": [
    {
      "id": "...",
      "title": "Software Engineer",
      "description": "Design, develop, and maintain software systems.",
      "average_salary": 120000.00,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "skills_count": 8,
      "relevance_score": 0.95
    }
  ],
  "total": 45,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

---

### 4.4.7 Get Career Details

**Purpose:** Get full details of a single career including all relationships.

**Route:** `GET /api/v1/careers/{career_id}`

**Authentication:** API Key

**Response 200:**
```json
{
  "id": "...",
  "title": "Software Engineer",
  "description": "Design, develop, and maintain software systems.",
  "average_salary": 120000.00,
  "growth_outlook": "above_average",
  "demand_level": "high",
  "required_education": {
    "min_degree": "bachelor",
    "fields": ["Computer Science", "Engineering"]
  },
  "typical_skills": {
    "programming": 9,
    "problem_solving": 8
  },
  "skills": [
    {"id": "...", "name": "Python", "category": "Programming", "level": "intermediate", "is_required": true}
  ],
  "degrees": [
    {"id": "...", "name": "B.Tech Computer Science", "level": "bachelor", "field": "Computer Science", "is_required": false}
  ],
  "colleges": [
    {"id": "...", "name": "IIT Hyderabad", "location": "Hyderabad", "program_name": "B.Tech CSE"}
  ],
  "exams": [
    {"id": "...", "name": "JEE Main", "description": "Engineering entrance exam", "is_required": false}
  ],
  "scholarships": [
    {"id": "...", "name": "Merit-cum-Means Scholarship", "amount": 50000.00}
  ],
  "resources": [
    {"id": "...", "title": "freeCodeCamp", "url": "https://freecodecamp.org", "resource_type": "course"}
  ],
  "related_careers": [
    {"id": "...", "title": "Data Engineer", "relation_type": "related", "description": "Shares core programming skills"}
  ]
}
```

**Response 404:**
```json
{
  "error": "not_found",
  "message": "Career not found"
}
```

---

### 4.4.8 Get Skill Details

**Purpose:** Get details of a specific skill and which careers require it.

**Route:** `GET /api/v1/skills/{skill_id}`

**Authentication:** API Key

**Response 200:**
```json
{
  "id": "...",
  "name": "Python",
  "category": "Programming",
  "careers_requiring": 85,
  "average_demand_level": "high",
  "related_skills": ["JavaScript", "Java", "C++"],
  "learning_resources": [
    {"id": "...", "title": "Python.org Tutorial", "url": "...", "resource_type": "tutorial"}
  ]
}
```

---

### 4.4.9 Compare Careers

**Purpose:** Side-by-side comparison of 2-5 careers.

**Route:** `POST /api/v1/careers/compare`

**Authentication:** API Key

**Request JSON:**
```json
{
  "career_ids": ["uuid1", "uuid2", "uuid3"],
  "user_profile": {
    "skills": {"Python": 8, "JavaScript": 6},
    "education_level": "bachelor",
    "interests": ["technology", "data"]
  }
}
```

**Response 200:**
```json
{
  "careers": [
    {
      "id": "uuid1",
      "title": "Software Engineer",
      "match_score": 87.50,
      "salary": 120000.00,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "required_skills": 8,
      "user_matching_skills": 6,
      "missing_skills": ["AWS", "Docker"]
    },
    {
      "id": "uuid2",
      "title": "Data Scientist",
      "match_score": 72.30,
      "salary": 110000.00,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "required_skills": 10,
      "user_matching_skills": 4,
      "missing_skills": ["R", "TensorFlow", "Statistics"]
    }
  ],
  "comparison_summary": "Software Engineering is a stronger match due to your existing programming skills. Data Science requires additional statistical and ML expertise."
}
```

---

### 4.4.10 Explain Recommendation

**Purpose:** Get a detailed explanation of why a specific career was recommended for a specific profile. Deeper than the reasoning in the generate response.

**Route:** `POST /api/v1/recommendations/explain`

**Authentication:** API Key

**Request JSON:**
```json
{
  "career_id": "uuid",
  "user_profile": { ... }
}
```

**Response 200:**
```json
{
  "career_id": "uuid",
  "career_title": "Software Engineer",
  "match_score": 87.50,
  "explanation": {
    "interest_alignment": {
      "score": 92,
      "details": "Your interest in 'building things' and 'problem solving' directly aligns with software engineering."
    },
    "academic_alignment": {
      "score": 85,
      "details": "Your bachelor's degree in a technical field meets the typical requirement."
    },
    "skill_alignment": {
      "score": 78,
      "details": "You match 6 of 8 required skills. Python (intermediate) and JavaScript (intermediate) are strong matches."
    },
    "experience_alignment": {
      "score": 80,
      "details": "Your 3 portfolio projects demonstrate hands-on development experience."
    },
    "goal_alignment": {
      "score": 95,
      "details": "Software Engineering is listed in your target fields."
    }
  },
  "counter_arguments": [
    "Cloud platform experience is increasingly important but missing",
    "A formal CS degree would strengthen your profile for top companies"
  ]
}
```

---

### 4.4.11 Get Recommendation History (Internal)

**Purpose:** Retrieve past recommendations for a user (for Razer's internal caching or analytics).

**Route:** `GET /api/v1/recommendations/history`

**Authentication:** API Key

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | UUID | Yes | Tophexity user ID |
| `page` | integer | No | Page (default: 1) |
| `page_size` | integer | No | Results (default: 20) |

**Response 200:**
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "total_pages": 0
}
```

*Note: Razer may or may not implement this. If not, Tophexity Backend stores all recommendations in its own database.*

---

# 5. Input JSON Schema

This is the exact JSON the Tophexity Backend sends to Razer's `POST /api/v1/recommendations/generate` endpoint.

```json
{
  "user_id": "string (UUID v4, required)",
  "request_id": "string (UUID v4, required)",
  "profile": {
    "full_name": "string or null",
    "education_level": "string or null — one of: 'high_school', 'diploma', 'bachelor', 'master', 'phd', 'certificate'",
    "years_experience": "integer or null — total years of professional experience",
    "current_field": "string or null — current industry or job title",
    "target_fields": ["string"] or null — array of desired career fields,
    "skills": {
      "<skill_name>": "integer (1-10) — self-assessed proficiency"
    } or null,
    "interests": {
      "<interest_area>": "integer (1-10) — interest level"
    } or null,
    "location": "string or null — city, state, country"
  },
  "academic_info": {
    "current_education": "string or null — current degree/program",
    "institution": "string or null — current school/university",
    "gpa": "number or null — GPA on 4.0 scale",
    "relevant_courses": ["string"] or null — list of relevant coursework,
    "board_exam_score": "number or null — standardized test score",
    "board_exam_percentile": "number or null — percentile rank"
  },
  "portfolio": [
    {
      "title": "string — project/achievement title",
      "item_type": "string — one of: 'project', 'hackathon', 'competition', 'certificate', 'research', 'internship', 'olympiad', 'leadership', 'volunteering', 'achievement'",
      "description": "string or null",
      "skills_used": ["string"] or null — list of skills demonstrated
    }
  ] or null,
  "goals": {
    "short_term": "string or null — goal for next 1-2 years",
    "long_term": "string or null — goal for next 5-10 years",
    "salary期望": "number or null — desired annual salary in USD",
    "work_style": "string or null — one of: 'remote', 'hybrid', 'onsite', 'flexible'",
    "industry_preference": ["string"] or null — preferred industries,
    "entrepreneurial_interest": "boolean or null — interested in starting a business"
  } or null,
  "financial_info": {
    "budget_for_education": "number or null — available funds for education in USD",
    "scholarship_needed": "boolean or null — requires financial aid",
    "family_income_level": "string or null — one of: 'low', 'middle', 'upper_middle', 'high'",
    "willing_to_relocate": "boolean or null",
    "relocation_budget": "number or null — available funds for relocation in USD"
  } or null,
  "preferences": {
    "max_recommendations": "integer (1-10, default: 5) — how many recommendations to return",
    "include_alternatives": "boolean (default: true) — include alternative career suggestions",
    "include_resources": "boolean (default: true) — include learning resources",
    "include_colleges": "boolean (default: true) — include college suggestions",
    "include_scholarships": "boolean (default: true) — include scholarship suggestions",
    "career_categories": ["string"] or null — restrict to specific career categories,
    "exclude_careers": ["string (UUID)"] or null — careers to exclude from recommendations,
    "prioritize": "string or null — one of: 'salary', 'growth', 'stability', 'passion', 'balance' — what to prioritize in ranking"
  } or null
}
```

### Field Descriptions

**`profile`** — Core user identity and self-assessed capabilities. This is populated from Tophexity's `profiles` table.

**`academic_info`** — Formal education details. May come from profile or be collected separately.

**`portfolio`** — Concrete evidence of skills and achievements. Populated from Tophexity's `portfolio_items` table.

**`goals`** — What the user wants to achieve. Directly influences which careers are considered and how they're ranked.

**`financial_info`** — Constraints and resources. Filters out careers with prohibitive education costs, influences scholarship suggestions.

**`preferences`** — How the engine should behave for this request. Allows per-request customization without changing the user's profile.

---

# 6. Output JSON Schema

This is the exact JSON returned by `POST /api/v1/recommendations/generate`. See Section 4.4.5 for the complete response. Here is the formal schema:

```json
{
  "request_id": "UUID string",
  "generated_at": "ISO 8601 datetime",
  "processing_time_ms": "number",
  "profile_summary": {
    "education_level": "string",
    "skills_count": "integer",
    "experience_years": "integer",
    "interests_count": "integer"
  },
  "recommendations": [
    {
      "rank": "integer (1-N)",
      "career_id": "UUID string",
      "career_title": "string",
      "match_score": "number (0.00-100.00)",
      "confidence": "number (0.00-1.00)",
      "reasoning": {
        "summary": "string (1-3 sentences)",
        "strengths": ["string"],
        "weaknesses": ["string"],
        "missing_skills": [
          {
            "skill": "string",
            "importance": "string — 'critical', 'high', 'medium', 'low'",
            "current_level": "string — 'none', 'beginner', 'intermediate', 'advanced'",
            "required_level": "string — 'beginner', 'intermediate', 'advanced', 'expert'",
            "how_to_acquire": "string — specific advice",
            "estimated_time_months": "integer"
          }
        ],
        "career_outlook": "string",
        "salary_range": {
          "min": "number",
          "max": "number",
          "currency": "string (ISO 4217)",
          "experience_level": "string — 'entry', 'mid', 'senior'"
        }
      },
      "career_details": {
        "description": "string",
        "average_salary": "number or null",
        "growth_outlook": "string or null",
        "demand_level": "string or null"
      },
      "suggested_colleges": [
        {
          "college_id": "UUID string",
          "name": "string",
          "location": "string or null",
          "program_name": "string or null",
          "relevance_reason": "string"
        }
      ],
      "suggested_degrees": [
        {
          "degree_id": "UUID string",
          "name": "string",
          "level": "string",
          "is_required": "boolean",
          "relevance_reason": "string"
        }
      ],
      "suggested_exams": [
        {
          "exam_id": "UUID string",
          "name": "string",
          "is_required": "boolean",
          "relevance_reason": "string"
        }
      ],
      "suggested_scholarships": [
        {
          "scholarship_id": "UUID string",
          "name": "string",
          "amount": "number or null",
          "eligibility": "string or null",
          "relevance_reason": "string"
        }
      ],
      "learning_resources": [
        {
          "resource_id": "UUID string",
          "title": "string",
          "url": "string",
          "resource_type": "string",
          "relevance_reason": "string"
        }
      ],
      "alternatives": [
        {
          "career_id": "UUID string",
          "career_title": "string",
          "match_score": "number",
          "transition_difficulty": "string — 'easy', 'medium', 'hard'",
          "reasoning": "string"
        }
      ],
      "related_careers": [
        {
          "career_id": "UUID string",
          "career_title": "string",
          "relation_type": "string — 'related', 'alternative', 'prerequisite', 'supplementary'"
        }
      ]
    }
  ],
  "metadata": {
    "total_careers_evaluated": "integer",
    "algorithm_version": "string",
    "knowledge_base_version": "string (date)"
  }
}
```

### Validation Rules for Output

- `recommendations` array length: 0-10 (0 if no career meets minimum confidence)
- `match_score`: 0.00-100.00, two decimal places
- `confidence`: 0.00-1.00, two decimal places
- `rank`: sequential starting from 1
- `career_id`: valid UUID referencing a career in the knowledge base
- `alternatives`: 0-3 per recommendation
- `missing_skills`: 0-10 per recommendation
- All string fields must be non-empty when present
- No markdown, HTML, or rich text in any string field — plain text only

---

# 7. Integration Protocol

## 7.1 How Tophexity Backend Calls Razer

The Tophexity Backend uses an HTTP client (httpx/requests) to call Razer's API. The relevant configuration:

```python
RECOMMENDATION_SERVICE_URL = "http://localhost:8001"  # Razer's base URL
RECOMMENDATION_SERVICE_API_KEY = "shared-secret-key"   # Authentication key
```

The call is made via `recommendation_client.py` (currently a stub with `NotImplementedError`). When implemented, it will:

1. Assemble the input JSON from user profile, portfolio, and preferences
2. Send `POST /api/v1/recommendations/generate` to Razer
3. Parse the response
4. Return structured data to the service layer
5. Tophexity stores the result in the `recommendations` and `recommendation_items` tables

## 7.2 Retries

Tophexity Backend implements a circuit breaker pattern:

- **Threshold:** 5 consecutive failures → circuit opens
- **Recovery timeout:** 60 seconds → circuit goes to half-open
- **Retry policy:** Exponential backoff, base delay 1s, max delay 30s, max 3 retries
- **Retryable status codes:** 429, 500, 502, 503, 504

Razer should implement idempotent endpoints. The `X-Request-ID` header can be used for deduplication.

## 7.3 Failure Handling

| Razer Response | Tophexity Behavior |
|----------------|---------------------|
| 200 OK | Store results, return to user |
| 400 Bad Request | Log error, return error to user, do NOT retry |
| 429 Rate Limited | Retry after `Retry-After` header value |
| 500 Internal Error | Retry up to 3 times with backoff |
| 503 Service Unavailable | Retry after 30s, circuit breaker counts failure |
| Timeout (>10s) | Abort, count as failure, return error to user |
| Connection refused | Circuit breaker counts failure, return error |

## 7.4 Timeouts

- **Connection timeout:** 3 seconds
- **Read timeout:** 10 seconds
- **Total request timeout:** 15 seconds

Razer should aim for:
- **p50 response time:** < 200ms
- **p95 response time:** < 500ms
- **p99 response time:** < 1000ms

## 7.5 API Versioning

- Current API version: `v1`
- Version is in the URL path: `/api/v1/...`
- Breaking changes require a new version: `/api/v2/...`
- Non-breaking changes (adding optional fields) do not require version bump
- Razer must support the minimum compatible version for at least 6 months after a new version is released

## 7.6 Backwards Compatibility Rules

- New optional fields may be added to request/response JSON without version bump
- Existing fields MUST NOT be removed or renamed
- Field types MUST NOT change
- Enum values may be added but not removed
- Status codes MUST NOT change for existing scenarios
- If a field is unknown to the consumer, it should be silently ignored

## 7.7 Caching

Tophexity Backend may cache Razer responses:

- **Recommendation cache:** Not cached (user-specific, time-sensitive)
- **Career search cache:** 5 minutes TTL (knowledge base changes infrequently)
- **Career details cache:** 5 minutes TTL
- **Skill details cache:** 10 minutes TTL
- **Health/version cache:** 30 seconds TTL

Razer should set appropriate `Cache-Control` headers.

## 7.8 Duplicate Request Prevention

- Tophexity Backend sends `X-Request-ID` (UUID) with each request
- Razer should check this header and return cached response if the same request_id was received within the last 5 minutes
- This prevents duplicate processing during retries

---

# 8. Testing Requirements

## 8.1 Unit Tests

Razer must implement unit tests covering:

- Score calculation functions (each sub-score independently)
- Profile parsing and normalization
- Skill matching algorithm
- Interest-to-career mapping
- Determinism verification (same input → same output)
- Edge cases: empty profile, missing fields, maximum values

## 8.2 Integration Tests

- Full recommendation generation with sample profiles
- Knowledge base CRUD operations
- API endpoint request/response validation
- Error handling for malformed requests
- Authentication (API key validation)

## 8.3 Load Tests

Razer must verify:

- 100 concurrent requests without degradation
- Response time stays under 1 second at p95 under load
- Memory usage stays stable under sustained load
- No database connection leaks

## 8.4 Performance Tests

- Benchmark recommendation generation for profiles of varying complexity
- Benchmark knowledge base search with 500+ careers
- Benchmark career comparison with 5 careers

## 8.5 Validation Tests

- All input fields validated against schema
- Boundary values tested (min/max for numbers, empty strings, null values)
- Invalid UUIDs rejected
- Unknown fields gracefully ignored

## 8.6 Recommendation Consistency Tests

- Same profile submitted 10 times → identical results
- Similar profiles produce similar rankings
- Profiles with strong skill matches rank higher than weak matches
- Financial constraints filter out unaffordable paths
- Location preferences influence college suggestions

## 8.7 Expected Accuracy Tests

- A profile with strong Python skills and CS interest should rank Software Engineering in top 3
- A profile with biology interest and medical education should rank Medical careers in top 3
- A profile with zero skills and no education should produce low-confidence, broad recommendations
- Missing required skills should be flagged in reasoning

---

# 9. Documentation Package

Razer must deliver:

1. **API Documentation** — OpenAPI 3.0/Swagger spec for all endpoints
2. **Data Model Documentation** — Entity-relationship diagram for knowledge base
3. **Architecture Document** — System design, technology choices, deployment diagram
4. **Integration Guide** — How Tophexity Backend should connect (mirrors Section 7)
5. **Runbook** — How to deploy, monitor, troubleshoot, and update the knowledge base
6. **Change Log** — Version history with breaking/non-breaking change annotations

---

# 10. Appendix: Full Example Flows

## 10.1 Complete Recommendation Request

**Scenario:** User is a 2nd-year CS student with Python skills, interested in AI.

**Tophexity Backend assembles:**

```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "request_id": "f0e1d2c3-b4a5-6789-0123-456789abcdef",
  "profile": {
    "full_name": "Priya Sharma",
    "education_level": "bachelor",
    "years_experience": 0,
    "current_field": "Computer Science (2nd year)",
    "target_fields": ["Artificial Intelligence", "Machine Learning", "Software Engineering"],
    "skills": {
      "Python": 7,
      "JavaScript": 5,
      "SQL": 4,
      "Git": 6,
      "Linear Algebra": 5
    },
    "interests": {
      "artificial_intelligence": 9,
      "machine_learning": 8,
      "web_development": 5,
      "data_analysis": 7,
      "problem_solving": 8
    },
    "location": "Hyderabad, India"
  },
  "academic_info": {
    "current_education": "B.Tech Computer Science (2nd year)",
    "institution": "JNTU Hyderabad",
    "gpa": 8.2,
    "relevant_courses": ["Data Structures", "Algorithms", "Database Management", "Operating Systems"],
    "board_exam_score": 95.5,
    "board_exam_percentile": 98
  },
  "portfolio": [
    {
      "title": "Student Performance Predictor",
      "item_type": "project",
      "description": "ML model predicting student grades from demographic and academic data",
      "skills_used": ["Python", "scikit-learn", "pandas", "matplotlib"]
    },
    {
      "title": "Smart Attend System",
      "item_type": "project",
      "description": "Face recognition attendance system using OpenCV",
      "skills_used": ["Python", "OpenCV", "SQLite"]
    },
    {
      "title": "Hackfest 2026 Finalist",
      "item_type": "hackathon",
      "description": "Built a mental health chatbot in 48 hours",
      "skills_used": ["Python", "Flask", "NLP"]
    }
  ],
  "goals": {
    "short_term": "Get an AI/ML internship in 3rd year",
    "long_term": "Become an AI research engineer at a top tech company",
    "salary期望": 15000,
    "work_style": "flexible",
    "industry_preference": ["Technology", "Research"],
    "entrepreneurial_interest": false
  },
  "financial_info": {
    "budget_for_education": 5000,
    "scholarship_needed": true,
    "family_income_level": "middle",
    "willing_to_relocate": true,
    "relocation_budget": 2000
  },
  "preferences": {
    "max_recommendations": 5,
    "include_alternatives": true,
    "include_resources": true,
    "include_colleges": true,
    "include_scholarships": true,
    "career_categories": null,
    "exclude_careers": null,
    "prioritize": "growth"
  }
}
```

**Razer returns (abbreviated):**

```json
{
  "request_id": "f0e1d2c3-b4a5-6789-0123-456789abcdef",
  "generated_at": "2026-07-23T12:00:00Z",
  "processing_time_ms": 187.5,
  "profile_summary": {
    "education_level": "bachelor",
    "skills_count": 5,
    "experience_years": 0,
    "interests_count": 5
  },
  "recommendations": [
    {
      "rank": 1,
      "career_id": "...",
      "career_title": "Machine Learning Engineer",
      "match_score": 89.20,
      "confidence": 0.88,
      "reasoning": {
        "summary": "Your strong AI/ML interests, Python skills, and ML project experience make this an excellent fit.",
        "strengths": [
          "Strong interest in AI/ML (9/10)",
          "Python proficiency meets core requirement",
          "ML project experience demonstrates practical skills",
          "Strong academic performance (8.2 GPA)"
        ],
        "weaknesses": [
          "No professional experience yet",
          "Limited statistics knowledge",
          "Missing deep learning framework experience"
        ],
        "missing_skills": [
          {
            "skill": "TensorFlow/PyTorch",
            "importance": "high",
            "current_level": "none",
            "required_level": "intermediate",
            "how_to_acquire": "Fast.ai course + Kaggle competitions",
            "estimated_time_months": 4
          },
          {
            "skill": "Statistics",
            "importance": "high",
            "current_level": "beginner",
            "required_level": "intermediate",
            "how_to_acquire": "Khan Academy Statistics + hands-on with scipy",
            "estimated_time_months": 3
          }
        ],
        "career_outlook": "Very high demand with emerging growth. AI talent shortage globally.",
        "salary_range": {
          "min": 10000,
          "max": 35000,
          "currency": "USD",
          "experience_level": "entry"
        }
      },
      "career_details": {
        "description": "Design and implement machine learning models and systems.",
        "average_salary": 125000.00,
        "growth_outlook": "emerging",
        "demand_level": "very_high"
      },
      "suggested_colleges": [...],
      "suggested_degrees": [...],
      "suggested_exams": [...],
      "suggested_scholarships": [...],
      "learning_resources": [...],
      "alternatives": [
        {
          "career_id": "...",
          "career_title": "Data Scientist",
          "match_score": 81.50,
          "transition_difficulty": "easy",
          "reasoning": "Overlaps heavily with ML engineering, adds business analysis"
        },
        {
          "career_id": "...",
          "career_title": "AI Research Scientist",
          "match_score": 76.80,
          "transition_difficulty": "hard",
          "reasoning": "Requires advanced degree, but strong research interest alignment"
        }
      ],
      "related_careers": [...]
    },
    {
      "rank": 2,
      "career_title": "Software Engineer",
      "match_score": 78.40,
      "confidence": 0.91,
      ...
    },
    ...
  ],
  "metadata": {
    "total_careers_evaluated": 350,
    "algorithm_version": "1.0.0",
    "knowledge_base_version": "2026-07-22"
  }
}
```

## 10.2 Career Search Flow

**Request:**
```
GET /api/v1/careers/search?q=machine+learning&demand_level=high&page_size=5
X-API-Key: shared-secret
```

**Response 200:**
```json
{
  "items": [
    {"id": "...", "title": "Machine Learning Engineer", "demand_level": "high", "relevance_score": 0.98},
    {"id": "...", "title": "Data Scientist", "demand_level": "high", "relevance_score": 0.92},
    {"id": "...", "title": "AI Research Scientist", "demand_level": "high", "relevance_score": 0.88},
    {"id": "...", "title": "NLP Engineer", "demand_level": "high", "relevance_score": 0.85},
    {"id": "...", "title": "Computer Vision Engineer", "demand_level": "high", "relevance_score": 0.82}
  ],
  "total": 12,
  "page": 1,
  "page_size": 5,
  "total_pages": 3
}
```

## 10.3 Health Check Flow

**Request:**
```
GET /api/v1/health
```

**Response 200:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-07-23T12:00:00Z",
  "knowledge_base": {
    "careers": 350,
    "skills": 1200,
    "colleges": 500,
    "last_updated": "2026-07-22T06:00:00Z"
  }
}
```

---

# Summary of Deliverables for Razer

| Deliverable | Description |
|-------------|-------------|
| Recommendation API | `POST /api/v1/recommendations/generate` — core endpoint |
| Career Search API | `GET /api/v1/careers/search` — search and filter careers |
| Career Details API | `GET /api/v1/careers/{id}` — full career information |
| Skill Details API | `GET /api/v1/skills/{id}` — skill info and related careers |
| Career Comparison API | `POST /api/v1/careers/compare` — side-by-side comparison |
| Explain API | `POST /api/v1/recommendations/explain` — detailed reasoning |
| Health API | `GET /api/v1/health` — liveness check |
| Version API | `GET /api/v1/version` — version info |
| Model Status API | `GET /api/v1/model/status` — engine health |
| Statistics API | `GET /api/v1/stats` — operational metrics |
| Knowledge Base | Careers, skills, colleges, degrees, exams, scholarships, resources, relations |
| Documentation | OpenAPI spec, architecture, integration guide, runbook |
| Tests | Unit, integration, load, performance, consistency tests |
| Deployment | Deployed service with monitoring and health checks |

---

*End of specification.*
