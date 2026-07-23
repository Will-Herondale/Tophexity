# Recommendation Engine Integration

This guide explains how Razer's AI recommendation engine should interact with the Tophexity backend.

---

## Architecture

```
User Profile (Database)
       |
       v
Razer's AI Engine (External)
  - Analyzes profile + portfolio
  - Generates recommendations
  - Generates roadmaps
  - Generates backup plans
       |
       v
Tophexity Backend (API)
  - Stores recommendations via POST /v1/recommendations
  - Stores roadmaps via POST /v1/roadmaps
  - Stores backup plans via POST /v1/backups
       |
       v
Frontend (HalfPanda)
  - Reads stored data via GET endpoints
  - Displays to user
```

---

## Authentication

All write endpoints require a JWT Bearer token.

```
Authorization: Bearer <access_token>
```

Get a token by calling `POST /v1/auth/login`:
```json
{"email": "razer-engine@tophexity.com", "password": "your-password"}
```

Or use an existing user's token if operating on their behalf.

---

## Step 1: Import Careers

Before generating recommendations, the career database must be populated.

**Endpoint:** `POST /v1/careers/import`

**Request:**
```json
{
  "careers": [
    {
      "title": "Software Engineer",
      "description": "Design, develop, and maintain software systems. Work with programming languages, frameworks, and tools to build applications.",
      "average_salary": 120000.00,
      "growth_outlook": "above_average",
      "demand_level": "high",
      "required_education": {"min_degree": "bachelor", "fields": ["Computer Science", "Engineering"]},
      "typical_skills": {"programming": 9, "problem_solving": 8, "teamwork": 7},
      "skills": [
        {"name": "Python", "category": "Programming", "level": "intermediate", "is_required": true},
        {"name": "JavaScript", "category": "Programming", "level": "intermediate", "is_required": true},
        {"name": "Git", "category": "DevOps", "level": "beginner", "is_required": true},
        {"name": "SQL", "category": "Database", "level": "intermediate", "is_required": true},
        {"name": "AWS", "category": "Cloud", "level": "beginner", "is_required": false}
      ],
      "degrees": [
        {"name": "B.Tech Computer Science", "level": "bachelor", "field": "Computer Science", "is_required": false},
        {"name": "B.Sc Computer Science", "level": "bachelor", "field": "Computer Science", "is_required": false}
      ],
      "colleges": [
        {"name": "IIT Hyderabad", "location": "Hyderabad", "program_name": "B.Tech CSE"},
        {"name": "IIIT Hyderabad", "location": "Hyderabad", "program_name": "B.Tech CSE"}
      ],
      "exams": [
        {"name": "JEE Main", "description": "Engineering entrance exam", "is_required": false}
      ],
      "scholarships": [
        {"name": "Merit-cum-Means Scholarship", "description": "For economically weaker sections", "amount": 50000}
      ],
      "resources": [
        {"title": "freeCodeCamp", "url": "https://freecodecamp.org", "resource_type": "course", "description": "Free coding bootcamp"},
        {"title": "LeetCode", "url": "https://leetcode.com", "resource_type": "practice", "description": "Coding practice platform"}
      ]
    }
  ]
}
```

**Duplicate handling:** Careers with the same title are skipped. Skills, degrees, colleges are deduplicated by name.

**Response (201):**
```json
{
  "imported": 1,
  "skipped": 0,
  "careers": [...]
}
```

**Recommendation:** Import 20-30 careers covering the target career space.

---

## Step 2: Get User Profile

To generate recommendations, first fetch the user's profile.

**Endpoint:** `GET /v1/users/profile`
**Header:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "full_name": "Alice Johnson",
  "headline": "Full Stack Developer",
  "bio": "Passionate about building web applications...",
  "location": "Hyderabad",
  "education_level": "bachelor",
  "years_experience": 2,
  "current_field": "Software Engineering",
  "target_fields": ["Data Science", "AI/ML"],
  "skills": {"Python": 8, "JavaScript": 7, "React": 6, "SQL": 5},
  "interests": ["Machine Learning", "Cloud Computing", "Open Source"],
  "created_at": "...",
  "updated_at": "..."
}
```

Also fetch portfolio for richer context:

**Endpoint:** `GET /v1/portfolio/items?page_size=100`

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "E-commerce Platform",
      "description": "Built a full-stack e-commerce app with React and Node.js",
      "item_type": "project",
      "skills_used": {"React": 7, "Node.js": 6, "MongoDB": 5}
    }
  ],
  "total": 5
}
```

---

## Step 3: Generate and Store Recommendations

Analyze the profile and portfolio, then store results.

**Endpoint:** `POST /v1/recommendations`
**Header:** `Authorization: Bearer <token>`

**Your engine should:**
1. Compare user's skills against career skill requirements
2. Match interests to career fields
3. Consider education level and experience
4. Score each career 0-100
5. Rank results by match_score descending

**Request:**
```json
{
  "title": "Career Recommendations for Alice",
  "summary": "Based on your strong Python and JavaScript skills, combined with your interest in AI/ML, here are your top career matches.",
  "items": [
    {
      "career_id": "uuid-of-data-scientist",
      "match_score": 92.5,
      "reasoning": "Strong match: Your Python skills (8/10) and interest in Machine Learning align well with Data Science. Your 2 years of experience provide a solid foundation. Consider deepening SQL and adding TensorFlow/PyTorch.",
      "rank": 1
    },
    {
      "career_id": "uuid-of-full-stack-developer",
      "match_score": 88.0,
      "reasoning": "Excellent match: Your JavaScript (7/10) and React (6/10) skills are directly applicable. Your project portfolio demonstrates practical experience. Growth into senior roles is straightforward.",
      "rank": 2
    },
    {
      "career_id": "uuid-of-cloud-architect",
      "match_score": 75.0,
      "reasoning": "Good potential: Your backend skills transfer well. Would need to develop AWS/cloud expertise. Your interest in Cloud Computing is a positive indicator.",
      "rank": 3
    }
  ]
}
```

**Rules:**
- `career_id` must exist in the careers table (import careers first!)
- `match_score` must be between 0.0 and 100.0
- `rank` must start from 1 and be unique within the recommendation
- Items are automatically ordered by rank in responses

**Response (201):** Full recommendation object with generated `id` and `status: "completed"`.

---

## Step 4: Generate and Store Roadmaps

For each recommended career, generate a learning roadmap.

**Endpoint:** `POST /v1/roadmaps`
**Header:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "career_id": "uuid-of-data-scientist",
  "title": "Roadmap to Data Science",
  "description": "A 12-month learning path from full-stack developer to data scientist",
  "estimated_duration_months": 12,
  "steps": [
    {
      "title": "Master Python for Data Science",
      "description": "Complete Python data science track covering NumPy, Pandas, and data manipulation.",
      "step_order": 1,
      "duration_months": 2,
      "resources": {
        "courses": ["Python for Data Science (Coursera)", "Kaggle Learn"],
        "practice": ["Kaggle Notebooks"],
        "certification": ["Google Python Certificate"]
      }
    },
    {
      "title": "Learn Statistics and Mathematics",
      "description": "Build foundation in probability, statistics, and linear algebra.",
      "step_order": 2,
      "duration_months": 2,
      "resources": {
        "courses": ["Statistics (Khan Academy)", "MIT OCW Linear Algebra"]
      }
    },
    {
      "title": "Master Machine Learning",
      "description": "Learn ML algorithms, model evaluation, and scikit-learn.",
      "step_order": 3,
      "duration_months": 3,
      "resources": {
        "courses": ["Andrew Ng ML Course (Coursera)"],
        "practice": ["Kaggle Competitions"]
      }
    },
    {
      "title": "Learn Deep Learning",
      "description": "Neural networks, CNNs, RNNs with TensorFlow/PyTorch.",
      "step_order": 4,
      "duration_months": 2,
      "resources": {
        "courses": ["Deep Learning Specialization (Coursera)"]
      }
    },
    {
      "title": "Build Portfolio Projects",
      "description": "Complete 3-5 data science projects demonstrating end-to-end pipeline skills.",
      "step_order": 5,
      "duration_months": 2,
      "resources": {
        "project_ideas": ["Predict housing prices", "Customer segmentation", "Sentiment analysis"]
      }
    },
    {
      "title": "Apply and Interview",
      "description": "Update resume, practice system design, apply to positions.",
      "step_order": 6,
      "duration_months": 1,
      "resources": {
        "platforms": ["LinkedIn", "Naukri", "Instahyre"]
      }
    }
  ]
}
```

**Rules:**
- `career_id` must exist in careers table
- `step_order` starts from 1, must be unique within the roadmap
- Steps are returned ordered by `step_order`

**Response (201):** Full roadmap with `id`, `status: "active"`, and all steps.

---

## Step 5: Generate and Store Backup Plans

Generate alternative career scenarios.

**Endpoint:** `POST /v1/backups`
**Header:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "title": "Alternative Career Paths for Alice",
  "description": "If Data Science doesn't work out, here are viable alternatives that leverage your existing skills.",
  "scenarios": [
    {
      "career_id": "uuid-of-full-stack-developer",
      "scenario_name": "Continue as Full Stack Developer",
      "description": "Your current path with deeper specialization. Move to senior/lead roles.",
      "transition_difficulty": "easy",
      "estimated_transition_months": 0,
      "reasoning": "No transition needed. Focus on system design and leadership skills for senior roles."
    },
    {
      "career_id": "uuid-of-devops-engineer",
      "scenario_name": "Transition to DevOps",
      "description": "Leverage your coding skills for infrastructure automation and CI/CD.",
      "transition_difficulty": "medium",
      "estimated_transition_months": 4,
      "reasoning": "Your coding background transfers well. Need to learn Docker, Kubernetes, CI/CD pipelines, and cloud platforms."
    },
    {
      "career_id": "uuid-of-technical-product-manager",
      "scenario_name": "Move to Technical Product Management",
      "description": "Use technical knowledge to lead product strategy and development.",
      "transition_difficulty": "medium",
      "estimated_transition_months": 6,
      "reasoning": "Your engineering background gives credibility. Need to develop business acumen, user research, and stakeholder management skills."
    }
  ]
}
```

**Rules:**
- `career_id` must exist in careers table
- `transition_difficulty`: "easy", "medium", or "hard"
- At least 1 scenario required

---

## Step 6: Trigger AI Chat (Phase 3)

When the user sends a chat message, generate an AI response.

**Endpoint:** `POST /v1/chat/sessions/{session_id}/messages`

**Current behavior (Phase 2):** Only stores messages. No AI response.

**Phase 3 behavior:**
1. User sends: `{"role": "user", "content": "What skills should I learn for data science?"}`
2. Backend receives the message
3. Backend calls your AI engine with the message + user context
4. Your engine returns: `"Based on your profile, focus on Python, SQL, and statistics..."`
5. Backend stores both messages and returns them

**How to integrate:** The backend's `app/services/services/ai/client.py` needs to be updated to call your engine. See `docs/RECOMMENDATION_ENGINE_GUIDE.md` for the integration contract.

---

## Testing with Dummy Data

Load pre-made test data:

```bash
python scripts/load_dummy_data.py
```

This creates:
- 5 users (alice@example.com / password123)
- 2 profiles
- 10 careers with skills, degrees, colleges
- 5 portfolio items
- 2 recommendations
- 1 roadmap with 6 steps
- 1 backup plan with 3 scenarios
- 1 chat session with messages

Or load with reset:
```bash
python scripts/load_dummy_data.py --reset    # Wipes existing data first
python scripts/load_dummy_data.py --seed 42  # Use specific random seed
```

---

## API Endpoints Summary for Razer

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| /v1/auth/login | POST | No | Get access token |
| /v1/users/profile | GET | Yes | Get user profile for analysis |
| /v1/portfolio/items | GET | Yes | Get user portfolio for context |
| /v1/careers | GET | No | Look up career IDs |
| /v1/careers/import | POST | Yes | Populate career database |
| /v1/recommendations | POST | Yes | Store generated recommendations |
| /v1/recommendations/history | GET | Yes | Verify stored recommendations |
| /v1/roadmaps | POST | Yes | Store generated roadmaps |
| /v1/roadmaps/history | GET | Yes | Verify stored roadmaps |
| /v1/backups | POST | Yes | Store generated backup plans |
| /v1/backups/history | GET | Yes | Verify stored backup plans |
| /v1/chat/sessions/{id}/messages | POST | Yes | Store chat messages (Phase 3) |

---

## Error Handling

| Status | Meaning | Action |
|---|---|---|
| 201 | Created successfully | Continue |
| 401 | Token expired | Re-login to get new token |
| 404 | Career not found | Import careers first via POST /v1/careers/import |
| 409 | Duplicate career title | Skip or update existing career |
| 422 | Validation error | Check request body format |

---

## Best Practices

1. **Import careers first** before generating recommendations. The `career_id` in recommendations must reference an existing career.

2. **Use meaningful titles and summaries** - these are displayed to users.

3. **Include detailed reasoning** for each recommendation item - users want to understand why.

4. **Order ranks sequentially** starting from 1.

5. **Generate roadmaps with 4-8 steps** - too few feels incomplete, too many feels overwhelming.

6. **Include specific resources** in roadmap steps - courses, platforms, practice sites.

7. **Set realistic transition difficulties** for backup plans - easy (< 2 months), medium (2-6 months), hard (6+ months).

8. **Verify your data** by calling GET endpoints after POST to confirm storage.
