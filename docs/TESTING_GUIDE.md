# Tophexity Testing Guide

## Prerequisites

1. **Python 3.11+**
2. **PostgreSQL** database (local or Azure)
3. **`.env` file** configured (copy from `.env.example`):

```bash
cp .env.example .env
```

Key variables to set:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/career_path
JWT_SECRET_KEY=your-strong-secret-key
AI_ENDPOINT=
AI_API_KEY=
AI_DEPLOYMENT_NAME=
```

4. **Install dependencies:**

```bash
pip install -r requirements.txt
```

---

## Seed Script

The project includes a seed script at `scripts/seed_data.py` to load dummy data.

### Load Dummy Data

```bash
python scripts/seed_data.py
```

This creates:

| Data | Count | Details |
|---|---|---|
| Users | 3 | `alice@example.com`, `bob@example.com`, `charlie@example.com` (all password: `password123`) |
| Profiles | 2 | For Alice and Bob |
| Careers | 5 | Software Engineer, Data Scientist, Cloud Architect, DevOps Engineer, Product Manager |
| Skills | 20 | Across Programming, Frontend, Backend, DevOps, Cloud, AI, etc. |
| Degrees | 6 | B.Tech, B.Sc, M.Tech, M.Sc, MBA, BBA |
| Colleges | 4 | IIT Hyderabad, IIT Bombay, BITS Pilani, IIIT Hyderabad |
| Entrance Exams | 4 | JEE Main, GATE, CAT, GRE |
| Scholarships | 3 | INSPIRE, AICTE, Reliance Foundation |
| Resources | 3 | CS50, FastAPI Docs, Kaggle Learn |
| Recommendations | 1 | For Alice, with 3 career items |
| Roadmaps | 1 | Cloud Architect path, 6 steps, 24 months |
| Backup Plans | 1 | 3 scenarios (Data Science, DevOps, Product Management) |
| Chat Sessions | 1 | 4 messages (career guidance conversation) |

---

## Frontend Testing (HalfPanda)

### Step 1: Register a New User

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "frontend_test@example.com",
    "password": "securepass123",
    "full_name": "Frontend Tester"
  }'
```

Expected: 201 with user info.

### Step 2: Login to Get Tokens

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "frontend_test@example.com",
    "password": "securepass123"
  }'
```

Expected: 200 with `access_token`, `refresh_token`, `user_id`, `email`.

**Save the access token** for all subsequent requests:

```bash
export TOKEN="your_access_token_here"
```

### Step 3: Create Profile

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Frontend Tester",
    "headline": "QA Engineer",
    "education_level": "bachelor",
    "years_experience": 2,
    "skills": {"tools": ["Selenium", "Postman"]}
  }'
```

Expected: 201 with profile data.

### Step 4: Browse Careers

```bash
# List all careers
curl "https://tophexity-func.azurewebsites.net/v1/careers"

# Search for specific careers
curl "https://tophexity-func.azurewebsites.net/v1/careers?search=engineer&demand_level=high"

# Get career detail
curl "https://tophexity-func.azurewebsites.net/v1/careers/{career_id}"
```

Expected: 200 with career data (no auth required).

### Step 5: Create Portfolio Items

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/portfolio/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Automation Framework",
    "description": "Built a test automation framework using Python and Selenium",
    "url": "https://github.com/tester/automation",
    "item_type": "project",
    "skills_used": {"tools": ["Python", "Selenium", "Pytest"]}
  }'
```

### Step 6: View Recommendations

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://tophexity-func.azurewebsites.net/v1/recommendations/history"
```

### Step 7: Test Token Refresh

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"YOUR_REFRESH_TOKEN\"}"
```

### Swagger UI Testing

Navigate to `https://tophexity-func.azurewebsites.net/docs` in your browser for interactive API testing. The Swagger UI allows you to:

1. Click "Authorize" button at the top
2. Enter `Bearer {your_access_token}` in the format: `Bearer eyJhbGci...`
3. Test all endpoints interactively

---

## AI Engine Testing (Razer)

### Step 1: Import Careers

First, ensure careers exist in the database:

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/careers/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "careers": [
      {
        "title": "AI Research Scientist",
        "description": "Conduct cutting-edge AI research and develop novel algorithms.",
        "average_salary": 130000,
        "growth_outlook": "much_above_average",
        "demand_level": "very_high",
        "skills": [
          {"name": "Machine Learning", "category": "AI", "level": "expert", "is_required": true},
          {"name": "Python", "category": "Programming", "level": "advanced", "is_required": true}
        ],
        "degrees": [
          {"name": "PhD Computer Science", "level": "doctorate", "field": "AI/ML", "is_required": true}
        ]
      }
    ]
  }'
```

Note: Careers with duplicate titles are skipped. The response tells you how many were imported vs skipped.

### Step 2: Create Recommendations

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/recommendations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Engine Recommendations - Batch 1",
    "summary": "Recommendations generated based on user profile analysis.",
    "items": [
      {
        "career_id": "EXISTING_CAREER_UUID_1",
        "match_score": 92.5,
        "reasoning": "User has strong ML skills and research background.",
        "rank": 1
      },
      {
        "career_id": "EXISTING_CAREER_UUID_2",
        "match_score": 78.0,
        "reasoning": "User's system design experience is relevant.",
        "rank": 2
      }
    ]
  }'
```

### Step 3: Create Roadmaps

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/roadmaps \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "career_id": "EXISTING_CAREER_UUID_1",
    "title": "Path to AI Research Scientist",
    "description": "4-year plan to transition into AI research.",
    "estimated_duration_months": 48,
    "steps": [
      {
        "title": "Complete ML Fundamentals",
        "description": "Complete Andrew Ng ML course and Stanford CS229.",
        "step_order": 1,
        "duration_months": 6,
        "resources": {"courses": ["Coursera ML", "CS229"]}
      },
      {
        "title": "Research Experience",
        "description": "Join a research lab and publish papers.",
        "step_order": 2,
        "duration_months": 24,
        "resources": {"venues": ["arXiv", "NeurIPS", "ICML"]}
      }
    ]
  }'
```

### Step 4: Create Backup Plans

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/backups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Research Backup Options",
    "description": "Alternative paths if research doesn't work out.",
    "scenarios": [
      {
        "career_id": "EXISTING_CAREER_UUID_2",
        "scenario_name": "ML Engineer at FAANG",
        "description": "Apply ML engineering roles at large tech companies.",
        "transition_difficulty": "easy",
        "estimated_transition_months": 3,
        "reasoning": "Directly leverages ML research skills."
      }
    ]
  }'
```

### Step 5: View History

```bash
# Recommendations history
curl -H "Authorization: Bearer $TOKEN" \
  "https://tophexity-func.azurewebsites.net/v1/recommendations/history"

# Roadmaps history
curl -H "Authorization: Bearer $TOKEN" \
  "https://tophexity-func.azurewebsites.net/v1/roadmaps/history"

# Backup plans history
curl -H "Authorization: Bearer $TOKEN" \
  "https://tophexity-func.azurewebsites.net/v1/backups/history"
```

---

## Chat System Testing

### Step 1: Create a Session

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/chat/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat Session"}'
```

### Step 2: Add Messages

```bash
curl -X POST https://tophexity-func.azurewebsites.net/v1/chat/sessions/{SESSION_ID}/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"role": "user", "content": "Hi, I need career guidance."},
    {"role": "assistant", "content": "Hello! What is your background?"}
  ]'
```

### Step 3: View Session with Messages

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://tophexity-func.azurewebsites.net/v1/chat/sessions/{SESSION_ID}"
```

### Step 4: List All Sessions

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://tophexity-func.azurewebsites.net/v1/chat/sessions"
```

---

## Running the Test Suite

```bash
python -m pytest tests/ -v
```

The test suite covers:

| Test File | Coverage |
|---|---|
| `test_health.py` | Health endpoint |
| `test_auth.py` | Register, login, refresh, logout, me |
| `test_profile.py` | Create, get, update profile, versions |
| `test_portfolio.py` | CRUD for portfolio items, filtering |
| `test_career.py` | Import, search, detail, update, delete |
| `test_recommendation.py` | Create, get, list recommendations |
| `test_roadmap.py` | Create, get, list roadmaps |
| `test_backup.py` | Create, get, list backup plans |
| `test_chat.py` | Session CRUD, messages, deletion |

---

## Seed Data Accounts

| Email | Password | Active | Verified |
|---|---|---|---|
| alice@example.com | password123 | Yes | Yes |
| bob@example.com | password123 | Yes | Yes |
| charlie@example.com | password123 | Yes | No |

Alice has a complete profile, portfolio, recommendations, roadmaps, backup plans, and chat session. Bob has a profile only. Charlie has no profile.

---

## Notes

- The seed script uses direct database inserts, so it does not go through the API validation layer.
- Careers imported via the seed script may have duplicate title issues if you also import via the API. The import endpoint skips careers with duplicate titles.
- The API uses async PostgreSQL (`asyncpg`). Make sure your `DATABASE_URL` starts with `postgresql+asyncpg://`.
- The seed script can be run multiple times. Duplicate users will cause database errors; drop tables first if needed.
