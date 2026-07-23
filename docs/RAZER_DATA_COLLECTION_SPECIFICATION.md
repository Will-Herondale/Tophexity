# Tophexity — Razer Data Collection Specification

**Version:** 1.0.0
**Date:** 2026-07-23
**Author:** Tophexity Backend Team
**Audience:** Razer (Career Intelligence Developer)
**Status:** Authoritative — the complete reference for every dataset Razer must collect.

---

## Table of Contents

1. [Overview](#1-overview)
2. [How This Document Relates to the Module Spec](#2-how-this-document-relates-to-the-module-spec)
3. [Complete Dataset Catalog](#3-complete-dataset-catalog)
   - 3.1 [Careers](#31-careers)
   - 3.2 [Skills](#32-skills)
   - 3.3 [Skill Relationships](#33-skill-relationships)
   - 3.4 [Degrees](#34-degrees)
   - 3.5 [Colleges](#35-colleges)
   - 3.6 [College Programs](#36-college-programs)
   - 3.7 [Entrance Exams](#37-entrance-exams)
   - 3.8 [Scholarships](#38-scholarships)
   - 3.9 [Certifications](#39-certifications)
   - 3.10 [Learning Resources](#310-learning-resources)
   - 3.11 [Industries](#311-industries)
   - 3.12 [Job Roles](#312-job-roles)
   - 3.13 [Career Progression](#313-career-progression)
   - 3.14 [Career Relations](#314-career-relations)
   - 3.15 [Career-Skill Junction](#315-career-skill-junction)
   - 3.16 [Career-Degree Junction](#316-career-degree-junction)
   - 3.17 [Career-College Junction](#317-career-college-junction)
   - 3.18 [Career-Exam Junction](#318-career-exam-junction)
   - 3.19 [Career-Scholarship Junction](#319-career-scholarship-junction)
   - 3.20 [Career-Resource Junction](#320-career-resource-junction)
   - 3.21 [Salary Information](#321-salary-information)
   - 3.22 [Employment Trends](#322-employment-trends)
   - 3.23 [Work Environment](#323-work-environment)
   - 3.24 [Subject Requirements](#324-subject-requirements)
   - 3.25 [Competitions & Olympiads](#325-competitions--olympiads)
   - 3.26 [Research Opportunities](#326-research-opportunities)
   - 3.27 [Internships](#327-internships)
   - 3.28 [Professional Organizations](#328-professional-organizations)
   - 3.29 [Communities](#329-communities)
   - 3.30 [Mentorship Resources](#330-mentorship-resources)
   - 3.31 [Career Certification Junction](#331-career-certification-junction)
   - 3.32 [Skill Certification Junction](#332-skill-certification-junction)
4. [Relationship Map](#4-relationship-map)
5. [Dataset-to-Feature Mapping](#5-dataset-to-feature-mapping)
6. [Recommended Folder Structure](#6-recommended-folder-structure)
7. [JSON Format Templates](#7-json-format-templates)
8. [Collection Order & Priority Ranking](#8-collection-order--priority-ranking)
9. [Additional Datasets & Metadata](#9-additional-datasets--metadata)
10. [Data Quality Rules](#10-data-quality-rules)
11. [Validation Checklist](#11-validation-checklist)

---

## 1. Overview

This document specifies every dataset Razer must collect for the Tophexity Career Intelligence layer. It is the **data collection companion** to the [RAZER_MODULE_SPECIFICATION.md](./RAZER_MODULE_SPECIFICATION.md), which defines the API contract, recommendation engine, and integration protocol.

**What this document covers that the module spec does not:**
- Complete field-by-field schema for every dataset (including those only partially described in the module spec)
- 15+ new datasets not in the module spec (salary, employment trends, work environment, competitions, research, internships, certifications, professional organizations, communities, mentorship, skill relationships, job roles, career progression, subject requirements, college programs)
- Exact JSON format for every dataset
- Collection priority and recommended order
- Data sources for every dataset
- Relationship map between all datasets
- Which datasets power which feature

**Key principle:** Razer's knowledge base is the **authoritative source**. Tophexity's PostgreSQL database mirrors this data via the import endpoint (`POST /v1/careers/import`). Every record Razer collects will flow into Tophexity's 19 existing tables and 7 junction tables.

---

## 2. How This Document Relates to the Module Spec

| Concern | Module Spec | This Document |
|---------|------------|---------------|
| API endpoints | Section 4 | Not covered (use module spec) |
| Recommendation algorithm | Section 3 | Not covered (use module spec) |
| Input/output JSON schema | Sections 5-6 | Not covered (use module spec) |
| Integration protocol | Section 7 | Not covered (use module spec) |
| **Data models** | **Section 2 (partial)** | **Complete (32 datasets)** |
| **Data sources** | **Not covered** | **Complete** |
| **Collection priority** | **Not covered** | **Complete** |
| **Relationships** | **Partial** | **Complete** |
| **Feature mapping** | **Not covered** | **Complete** |

---

## 3. Complete Dataset Catalog

Each dataset below follows this template:

```
### Purpose
### Fields (Required / Optional)
### Validation Rules
### Relationships
### Unique IDs
### Required Detail Level
### Data Sources
### Update Frequency
### Example Record
### Tophexity Table Mapping
```

---

### 3.1 Careers

#### Purpose
The central entity. Every recommendation, roadmap, backup plan, and career comparison references a career.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `title` | string (max 255) | Yes | Unique career title |
| `description` | text | Yes | 2-5 sentences: what the career involves, day-to-day work, impact |
| `average_salary` | number (12,2) | No | Annual salary in USD |
| `growth_outlook` | enum | No | `"above_average"`, `"average"`, `"below_average"`, `"declining"`, `"emerging"` |
| `demand_level` | enum | No | `"very_high"`, `"high"`, `"medium"`, `"low"`, `"very_low"` |
| `required_education` | JSON object | No | Structured education requirements |
| `typical_skills` | JSON object | No | Key-value pairs of skill name to proficiency level (1-10) |
| `industry_id` | UUID | No | FK to industries table |
| `work_environment` | JSON object | No | Remote/on-site/hybrid, team size, travel %, etc. |
| `career_category` | string (max 100) | No | Broad category: `"technology"`, `"healthcare"`, `"finance"`, `"engineering"`, `"creative"`, `"science"`, `"education"`, `"business"`, `"trades"`, `"public_service"` |
| `is_emerging` | boolean | No | Default: false. True for careers < 10 years old |
| `entry_barrier` | enum | No | `"low"`, `"medium"`, `"high"` — how hard to break in |
| `typical_work_week_hours` | integer | No | Average weekly hours |
| `stress_level` | enum | No | `"low"`, `"moderate"`, `"high"`, `"very_high"` |

#### Validation Rules
- `title` must be unique (case-sensitive), 1-255 characters
- `description` must be non-empty
- `average_salary` must be >= 0 if provided
- `growth_outlook` must be one of the allowed values
- `demand_level` must be one of the allowed values
- `career_category` must be one of the allowed values if provided

#### Relationships
- Has many skills via `career_skills` junction
- Has many degrees via `career_degrees` junction
- Has many colleges via `career_colleges` junction
- Has many entrance exams via `career_entrance_exams` junction
- Has many scholarships via `career_scholarships` junction
- Has many resources via `career_resources` junction
- Has many certifications via `career_certifications` junction
- Has many outgoing/incoming `career_relations`
- Belongs to an industry (optional)
- Has many `salary_records`
- Has many `employment_trends`
- Has many `work_environments`
- Has many `career_progressions` (as source and target)
- Has many `job_roles`

#### Required Detail Level
High. Each career should have at minimum: title, description, 3+ skills, 1+ degree, growth_outlook, demand_level.

#### Data Sources
- Bureau of Labor Statistics (BLS) — Occupational Outlook Handbook
- LinkedIn Economic Graph
- Glassdoor salary data
- Naukri.com (India-focused)
- AmbitionBox (India)
- World Economic Forum Future of Jobs Report
- MyFuture (Australian government)
- ONET Online (US government occupational database)

#### Update Frequency
Quarterly. Salary data annually. Growth outlook every 6 months.

#### Example Record
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Software Engineer",
  "description": "Design, develop, test, and maintain software applications. Work involves writing code, debugging, collaborating with cross-functional teams, and continuously learning new technologies.",
  "average_salary": 120000.00,
  "growth_outlook": "above_average",
  "demand_level": "high",
  "required_education": {
    "min_degree": "bachelor",
    "preferred_degree": "bachelor",
    "fields": ["Computer Science", "Software Engineering", "Information Technology"]
  },
  "typical_skills": {
    "programming": 9,
    "problem_solving": 8,
    "communication": 7,
    "version_control": 8,
    "debugging": 7
  },
  "industry_id": "tech-uuid-here",
  "work_environment": {
    "remote_option": true,
    "team_size": "5-15",
    "travel_percentage": 5
  },
  "career_category": "technology",
  "is_emerging": false,
  "entry_barrier": "medium",
  "typical_work_week_hours": 40,
  "stress_level": "moderate"
}
```

#### Tophexity Table Mapping
Maps directly to `careers` table. New fields (`industry_id`, `work_environment`, `career_category`, `is_emerging`, `entry_barrier`, `typical_work_week_hours`, `stress_level`) will need schema migration or can be stored in the existing JSON fields.

---

### 3.2 Skills

#### Purpose
Taxonomy of skills that careers require and users possess. The backbone of the matching algorithm.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 255) | Yes | Unique skill name |
| `category` | string (max 255) | No | Skill category |
| `subcategory` | string (max 255) | No | Finer grouping |
| `description` | text | No | What this skill entails |
| `difficulty_level` | enum | No | `"beginner"`, `"intermediate"`, `"advanced"`, `"expert"` — typical learning curve |
| `demand_trend` | enum | No | `"rising"`, `"stable"`, `"declining"` |
| `is_technical` | boolean | No | Default: true. False for soft skills |
| `related_tool_names` | JSON array | No | Specific tools/libraries: `["TensorFlow", "PyTorch", "scikit-learn"]` |
| `market_demand_score` | number (0-100) | No | How in-demand this skill is currently |

#### Validation Rules
- `name` must be unique (case-sensitive), 1-255 characters
- `category` must be one of: `"Programming"`, `"Data Science"`, `"Cloud/DevOps"`, `"Design"`, `"Soft Skills"`, `"Domain-Specific"`, `"Business"`, `"Science"`, `"Engineering"`, `"Healthcare"`, `"Creative"`, `"Language"`, `"Management"`, `"Research"`, `"Finance"`, `"Marketing"`
- `difficulty_level` must be one of the allowed values if provided

#### Required Detail Level
High. Every skill needs at minimum: name, category, is_technical.

#### Data Sources
- LinkedIn Skills API / LinkedIn Economic Graph
- O*NET Skills database
- Stack Overflow Developer Survey (for demand trends)
- Indeed Skills taxonomy
- Lightcast (formerly Burning Glass) skills data
- Coursera/Udemy skill taxonomies

#### Update Frequency
Quarterly. Demand trends every 6 months.

#### Example Record
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Python",
  "category": "Programming",
  "subcategory": "General-Purpose Languages",
  "description": "High-level programming language used for web development, data science, AI/ML, automation, and scripting.",
  "difficulty_level": "beginner",
  "demand_trend": "rising",
  "is_technical": true,
  "related_tool_names": ["Django", "Flask", "FastAPI", "NumPy", "pandas", "TensorFlow", "PyTorch"],
  "market_demand_score": 92
}
```

#### Tophexity Table Mapping
Maps to `skills` table (id, name, category). Additional fields are internal to Razer's knowledge base.

---

### 3.3 Skill Relationships

#### Purpose
Maps how skills relate to each other — prerequisites, complements, alternatives. Powers skill-gap analysis and learning path recommendations.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `skill_id` | UUID | Yes | FK to source skill |
| `related_skill_id` | UUID | Yes | FK to related skill |
| `relation_type` | enum | Yes | `"prerequisite"`, `"complement"`, `"alternative"`, `"advanced_version"`, `"subset"` |
| `strength` | number (0-1) | No | How strong the relationship is (0 = weak, 1 = strong) |
| `description` | text | No | Why this relationship exists |

#### Validation Rules
- `skill_id` != `related_skill_id` (no self-references)
- `strength` must be between 0 and 1
- Unique constraint: `(skill_id, related_skill_id, relation_type)`

#### Relationship Types
- `prerequisite` — Must learn skill A before skill B (e.g., Python before TensorFlow)
- `complement` — Skills that work well together (e.g., Docker + Kubernetes)
- `alternative` — Can substitute one for the other (e.g., React vs Vue)
- `advanced_version` — Skill B is an advanced form of skill A (e.g., Python -> Cython)
- `subset` — Skill A is a subset of skill B (e.g., SQL is a subset of Database Management)

#### Required Detail Level
Medium. Focus on the top 200 most common skills. Each should have 3-10 relationships.

#### Data Sources
- Expert curation (most reliable)
- Skill adjacency analysis from job postings (LinkedIn, Indeed)
- Course prerequisite chains (Coursera, edX, Udemy)
- Technology stack analysis (e.g., "React developers also know Node.js")

#### Update Frequency
Semi-annually.

#### Example Record
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "skill_id": "python-skill-uuid",
  "related_skill_id": "tensorflow-skill-uuid",
  "relation_type": "prerequisite",
  "strength": 0.95,
  "description": "TensorFlow is a Python library; Python proficiency is essential before learning TensorFlow."
}
```

#### Tophexity Table Mapping
**New dataset.** Not in current Tophexity schema. Internal to Razer's knowledge base. Used by the recommendation engine for learning path generation.

---

### 3.4 Degrees

#### Purpose
Academic degrees relevant to careers.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 255) | Yes | Unique degree name |
| `level` | enum | Yes | `"high_school"`, `"diploma"`, `"bachelor"`, `"master"`, `"phd"`, `"certificate"` |
| `field` | string (max 255) | No | Field of study |
| `duration_years` | number | No | Typical duration |
| `is_professional` | boolean | No | Whether this is a professional degree (MD, JD, etc.) |
| `common_names` | JSON array | No | Alternative names: `["B.Tech", "Bachelor of Technology", "B.E."]` |

#### Validation Rules
- `name` must be unique (case-sensitive)
- `level` must be one of the allowed values

#### Required Detail Level
High. At least 100 degrees covering all levels.

#### Data Sources
- UNESCO ISCED classification
- University program catalogs
- UGC (India) recognized degrees list
- Wikipedia list of academic degrees

#### Update Frequency
Annually.

#### Example Record
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "name": "B.Tech Computer Science",
  "level": "bachelor",
  "field": "Computer Science",
  "duration_years": 4,
  "is_professional": false,
  "common_names": ["B.Tech CSE", "Bachelor of Technology in Computer Science", "B.E. Computer Science"]
}
```

#### Tophexity Table Mapping
Maps to `degrees` table.

---

### 3.5 Colleges

#### Purpose
Educational institutions offering programs relevant to careers.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | College name |
| `location` | string (max 255) | No | City, State, Country |
| `website` | string (max 1024) | No | Official website URL |
| `ranking` | integer | No | National or global ranking (lower = better) |
| `type` | enum | No | `"public"`, `"private"`, `"community"`, `"online"` |
| `acceptance_rate` | number | No | Percentage (0-100) |
| `tuition_in_state` | number (12,2) | No | Annual tuition for in-state students (USD) |
| `tuition_out_of_state` | number (12,2) | No | Annual tuition for out-of-state students (USD) |
| `has_scholarships` | boolean | No | Default: true |
| `has_online_programs` | boolean | No | Whether online programs are available |
| `country` | string (max 100) | No | Country for filtering |
| `accreditation_body` | string (max 255) | No | Accrediting organization |

#### Validation Rules
- `name` is NOT globally unique (same name can exist in different locations)
- `website` must be a valid URL if provided
- `ranking` must be >= 1 if provided
- `acceptance_rate` must be between 0 and 100 if provided

#### Required Detail Level
High for top 100 institutions per country. Medium for others.

#### Data Sources
- NIRF (India) rankings
- QS World University Rankings
- Times Higher Education rankings
- US News College Rankings
- College Board (US)
- UGC (India) list of recognized institutions
- Shiksha.com (India)
- CollegeDunia (India)

#### Update Frequency
Annually (rankings change yearly).

#### Example Record
```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "name": "Indian Institute of Technology Hyderabad",
  "location": "Hyderabad, Telangana, India",
  "website": "https://iith.ac.in",
  "ranking": 8,
  "type": "public",
  "acceptance_rate": 2.5,
  "tuition_in_state": 2000.00,
  "tuition_out_of_state": 6000.00,
  "has_scholarships": true,
  "has_online_programs": false,
  "country": "India",
  "accreditation_body": "NBA"
}
```

#### Tophexity Table Mapping
Maps to `colleges` table (id, name, location, website, ranking). Additional fields are internal to Razer.

---

### 3.6 College Programs

#### Purpose
Specific programs offered by colleges. Links a college to the degrees and careers it supports. More granular than just college-to-career mapping.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `college_id` | UUID | Yes | FK to college |
| `degree_id` | UUID | Yes | FK to degree |
| `program_name` | string (max 500) | Yes | Full program name |
| `specialization` | string (max 255) | No | Specialization or concentration |
| `duration_years` | number | No | Program duration |
| `tuition_per_year` | number (12,2) | No | Annual tuition |
| `is_available` | boolean | No | Default: true |
| `admission_requirements` | text | No | How to get admitted |
| `placement_rate` | number | No | Percentage of graduates placed |
| `average_placement_salary` | number (12,2) | No | Average salary of placed graduates |
| `website` | string (max 1024) | No | Program-specific URL |

#### Validation Rules
- `program_name` must be non-empty
- `tuition_per_year` must be >= 0 if provided
- `placement_rate` must be between 0 and 100 if provided

#### Required Detail Level
High for top institutions. Medium for others. At minimum: college_id, degree_id, program_name.

#### Data Sources
- College websites (most accurate)
- NIRF institutional data
- Shiksha.com program listings
- CollegeDunia
- Common App (US)

#### Update Frequency
Annually.

#### Example Record
```json
{
  "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
  "college_id": "iith-uuid",
  "degree_id": "btech-cse-uuid",
  "program_name": "B.Tech Computer Science and Engineering",
  "specialization": "Artificial Intelligence",
  "duration_years": 4,
  "tuition_per_year": 225000.00,
  "is_available": true,
  "admission_requirements": "JEE Main + JEE Advanced rank within top 1000",
  "placement_rate": 95.0,
  "average_placement_salary": 2500000.00,
  "website": "https://iith.ac.in/cse"
}
```

#### Tophexity Table Mapping
Extends `career_colleges` junction. The `program_name` field already exists in `career_colleges`. This dataset provides more detail internally.

---

### 3.7 Entrance Exams

#### Purpose
Examinations required or recommended for career paths.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 255) | Yes | Unique exam name |
| `description` | text | No | What the exam covers, who conducts it |
| `website` | string (max 1024) | No | Official website |
| `exam_type` | enum | No | `"entrance"`, `"certification"`, `"aptitude"`, `"subject_test"`, `"language"`, `"competitive"` |
| `conducting_body` | string (max 255) | No | Organization that conducts the exam |
| `frequency` | string (max 100) | No | How often: `"annual"`, `"biannual"`, `"quarterly"`, `"monthly"`, `"rolling"` |
| `duration_hours` | number | No | Exam duration in hours |
| `total_marks` | integer | No | Maximum marks/score |
| `eligibility_criteria` | text | No | Who can take the exam |
| `application_fee_usd` | number | No | Cost to apply |
| `validity_years` | integer | No | How long the score is valid |
| `countries` | JSON array | No | Where the exam is available: `["India", "USA"]` |
| `language` | string (max 50) | No | Language of the exam |

#### Validation Rules
- `name` must be unique (case-sensitive)
- `duration_hours` must be > 0 if provided
- `total_marks` must be > 0 if provided
- `validity_years` must be > 0 if provided

#### Required Detail Level
High. At least 50 exams covering India, US, UK, and global exams.

#### Data Sources
- NTA (India) official notifications
- College Board (SAT, AP)
- ETS (GRE, TOEFL)
- GMAC (GMAT)
- IELTS official data
- JEE/NEET official websites
- CAT official website
- Wikipedia list of standardized tests

#### Update Frequency
Annually. Exam patterns/conducting bodies may change more frequently.

#### Example Record
```json
{
  "id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
  "name": "JEE Main",
  "description": "Joint Entrance Examination Main — national-level engineering entrance exam for admission to NITs, IIITs, and other participating institutions.",
  "website": "https://jeemain.nta.ac.in",
  "exam_type": "entrance",
  "conducting_body": "National Testing Agency (NTA)",
  "frequency": "biannual",
  "duration_hours": 3,
  "total_marks": 300,
  "eligibility_criteria": "Class 12 pass with Physics, Chemistry, and Mathematics",
  "application_fee_usd": 15.00,
  "validity_years": 1,
  "countries": ["India"],
  "language": "English, Hindi, and regional languages"
}
```

#### Tophexity Table Mapping
Maps to `entrance_exams` table (id, name, description, website). Additional fields are internal to Razer.

---

### 3.8 Scholarships

#### Purpose
Financial aid opportunities linked to career paths.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | Scholarship name |
| `description` | text | No | What it covers, purpose |
| `amount` | number (12,2) | No | Amount in USD |
| `eligibility` | text | No | Who can apply |
| `deadline` | string (max 50) | No | `"YYYY-MM-DD"` or `"Rolling"` or `"Annual"` |
| `website` | string (max 1024) | No | Application URL |
| `scholarship_type` | enum | No | `"merit"`, `"need_based"`, `"athletic"`, `"research"`, `"minority"`, `"government"`, `"corporate"` |
| `renewable` | boolean | No | Can be renewed each year |
| `coverage` | JSON object | No | What it covers: tuition, housing, books, travel |
| `countries` | JSON array | No | Where available |
| `min_gpa` | number | No | Minimum GPA required |
| `fields_of_study` | JSON array | No | Which fields of study are eligible |

#### Validation Rules
- `amount` must be >= 0 if provided
- `min_gpa` must be between 0 and 4.0 (or equivalent) if provided
- `deadline` must be valid date string or one of the special values

#### Required Detail Level
High. At least 100 scholarships.

#### Data Sources
- Scholarship portal APIs (ScholarshipPortal.com)
- Government scholarship databases (India: NSP, US: Fastweb)
- University financial aid pages
- Corporate scholarship programs (Google, Microsoft, Tata)
- UNESCO scholarship database

#### Update Frequency
Quarterly. Deadlines change frequently.

#### Example Record
```json
{
  "id": "a7b8c9d0-e1f2-3456-abcd-567890123456",
  "name": "INSPIRE Scholarship",
  "description": "Innovation in Science Pursuit for Inspired Research — Government of India scholarship for top 1% of Class 12 board exam students pursuing B.Sc./B.S./Integrated M.S.",
  "amount": 800.00,
  "eligibility": "Top 1% of Class 12 board exams, pursuing natural/basic sciences",
  "deadline": "Annual",
  "website": "https://www.online-inspire.gov.in",
  "scholarship_type": "government",
  "renewable": true,
  "coverage": {"tuition": true, "housing": false, "books": true, "travel": false},
  "countries": ["India"],
  "min_gpa": null,
  "fields_of_study": ["Physics", "Chemistry", "Mathematics", "Biology", "Statistics"]
}
```

#### Tophexity Table Mapping
Maps to `scholarships` table (id, name, description, amount, eligibility, deadline, website). Additional fields are internal to Razer.

---

### 3.9 Certifications

#### Purpose
Industry certifications that validate specific skills. Important for career advancement and skill verification.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | Certification name |
| `issuing_organization` | string (max 255) | Yes | Who issues it |
| `description` | text | No | What it covers |
| `website` | string (max 1024) | No | Official page |
| `difficulty_level` | enum | No | `"beginner"`, `"intermediate"`, `"advanced"`, `"expert"` |
| `cost_usd` | number | No | Exam/certification cost |
| `validity_years` | integer | No | How long it's valid |
| `renewal_required` | boolean | No | Whether renewal is needed |
| `exam_format` | string (max 100) | No | `"online"`, `"in_person"`, `"both"` |
| `study_hours_required` | integer | No | Estimated study hours |
| `recognition_level` | enum | No | `"global"`, `"regional"`, `"industry_specific"` |
| `is_entry_level` | boolean | No | Suitable for beginners |

#### Validation Rules
- `name` + `issuing_organization` should be treated as a composite unique key
- `cost_usd` must be >= 0 if provided
- `validity_years` must be > 0 if provided
- `study_hours_required` must be >= 0 if provided

#### Required Detail Level
High. At least 100 certifications across technology, business, healthcare, and engineering.

#### Data Sources
- Vendor documentation (AWS, Google, Microsoft, Cisco, Oracle)
- Coursera/edX certificate catalogs
- PMI (PMP), CompTIA, (ISC)² official sites
- ISRO/DRDO training certifications (India)
- LinkedIn Learning certificate directory

#### Update Frequency
Quarterly. New certifications are added frequently.

#### Example Record
```json
{
  "id": "b8c9d0e1-f2a3-4567-bcde-678901234567",
  "name": "AWS Certified Solutions Architect – Associate",
  "issuing_organization": "Amazon Web Services",
  "description": "Validates ability to design and deploy well-architected solutions on AWS.",
  "website": "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
  "difficulty_level": "intermediate",
  "cost_usd": 150.00,
  "validity_years": 3,
  "renewal_required": true,
  "exam_format": "both",
  "study_hours_required": 80,
  "recognition_level": "global",
  "is_entry_level": false
}
```

#### Tophexity Table Mapping
**New dataset.** Not in current Tophexity schema. Internal to Razer. Mapped to careers via `career_certifications` junction and to skills via `skill_certifications` junction.

---

### 3.10 Learning Resources

#### Purpose
Courses, tutorials, books, and tools for skill development. Powers the "learning resources" section of recommendations.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `title` | string (max 500) | Yes | Resource title |
| `description` | text | No | What it covers |
| `url` | string (max 1024) | Yes | Direct link |
| `resource_type` | enum | Yes | `"course"`, `"book"`, `"tutorial"`, `"practice"`, `"tool"`, `"certification"`, `"video"`, `"article"`, `"bootcamp"`, `"workshop"`, `"podcast"` |
| `provider` | string (max 255) | No | Who offers it: `"Coursera"`, `"edX"`, `"Udemy"`, `"freeCodeCamp"` |
| `is_free` | boolean | No | Default: true |
| `cost_usd` | number | No | Cost if paid |
| `duration_hours` | number | No | Estimated completion time |
| `difficulty_level` | enum | No | `"beginner"`, `"intermediate"`, `"advanced"` |
| `rating` | number (0-5) | No | Average user rating |
| `language` | string (max 50) | No | Language of the resource |
| `certificate_offered` | boolean | No | Whether a certificate is provided |
| `last_verified` | ISO 8601 | No | When the URL was last verified working |

#### Validation Rules
- `url` must be a valid URL
- `cost_usd` must be >= 0 if provided
- `rating` must be between 0 and 5 if provided
- `duration_hours` must be > 0 if provided

#### Required Detail Level
High. At least 500 resources. Focus on free/low-cost resources.

#### Data Sources
- Coursera API / catalog
- edX course catalog
- freeCodeCamp curriculum
- Khan Academy
- MIT OpenCourseWare
- YouTube educational channels (verified)
- Amazon book listings
- Udemy course data
- Pluralsight course catalog

#### Update Frequency
Monthly. URLs break frequently — verify quarterly.

#### Example Record
```json
{
  "id": "c9d0e1f2-a3b4-5678-cdef-789012345678",
  "title": "CS50: Introduction to Computer Science",
  "description": "Harvard's introduction to the intellectual enterprises of computer science and the art of programming.",
  "url": "https://cs50.harvard.edu",
  "resource_type": "course",
  "provider": "Harvard edX",
  "is_free": true,
  "cost_usd": 0,
  "duration_hours": 120,
  "difficulty_level": "beginner",
  "rating": 4.9,
  "language": "English",
  "certificate_offered": true,
  "last_verified": "2026-07-20T00:00:00Z"
}
```

#### Tophexity Table Mapping
Maps to `resources` table (id, title, description, url, resource_type). Additional fields are internal to Razer.

---

### 3.11 Industries

#### Purpose
Group careers by industry sector. Enables industry-level filtering and trend analysis.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 255) | Yes | Unique industry name |
| `description` | text | No | Brief description |
| `parent_industry_id` | UUID | No | FK to parent industry (for hierarchy) |
| `growth_outlook` | enum | No | Same enum as careers |
| `total_employers` | integer | No | Approximate number of companies |
| `average_entry_salary` | number (12,2) | No | Average entry-level salary |
| `icon_name` | string (max 100) | No | For UI display |

#### Validation Rules
- `name` must be unique
- `parent_industry_id` must reference a valid industry if provided

#### Required Detail Level
Medium. 20-50 industries.

#### Data Sources
- GICS (Global Industry Classification Standard)
- NAICS codes
- BLS industry classifications
- LinkedIn industry taxonomy

#### Update Frequency
Annually.

#### Example Record
```json
{
  "id": "d0e1f2a3-b4c5-6789-defa-890123456789",
  "name": "Technology",
  "description": "Companies building software, hardware, and digital services.",
  "parent_industry_id": null,
  "growth_outlook": "above_average",
  "total_employers": 500000,
  "average_entry_salary": 75000.00,
  "icon_name": "cpu"
}
```

#### Tophexity Table Mapping
**New dataset.** Not in current Tophexity schema. Internal to Razer. Careers reference industries via `industry_id`.

---

### 3.12 Job Roles

#### Purpose
Specific job titles within careers. A single career (e.g., "Software Engineer") may have many job roles (e.g., "Frontend Developer", "Backend Developer", "DevOps Engineer", "Mobile Developer"). This provides granularity beyond career-level recommendations.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `career_id` | UUID | Yes | FK to parent career |
| `title` | string (max 255) | Yes | Job role title |
| `description` | text | No | What this role specifically does |
| `average_salary` | number (12,2) | No | Role-specific salary |
| `demand_level` | enum | No | Role-specific demand |
| `is_entry_level` | boolean | No | Whether this role is typically entry-level |
| `common_titles` | JSON array | No | Alternative names for the same role |
| `daily_tasks` | JSON array | No | Typical daily tasks |

#### Validation Rules
- `title` should be unique within a career context
- `career_id` must reference a valid career

#### Required Detail Level
Medium. 3-10 roles per career for the top 50 careers.

#### Data Sources
- LinkedIn job titles
- BLS occupational titles
- Indeed job listings
- Glassdoor job titles
- Company career pages

#### Update Frequency
Semi-annually.

#### Example Record
```json
{
  "id": "e1f2a3b4-c5d6-7890-efab-901234567890",
  "career_id": "software-engineer-uuid",
  "title": "Frontend Developer",
  "description": "Specializes in building user interfaces and client-side web applications using HTML, CSS, and JavaScript frameworks.",
  "average_salary": 105000.00,
  "demand_level": "high",
  "is_entry_level": true,
  "common_titles": ["UI Developer", "Web Developer", "Client-Side Developer"],
  "daily_tasks": ["Build responsive UIs", "Optimize page performance", "Collaborate with designers", "Write unit tests"]
}
```

#### Tophexity Table Mapping
**New dataset.** Not in current Tophexity schema. Internal to Razer. Used for more granular recommendations.

---

### 3.13 Career Progression

#### Purpose
Defines how careers evolve over time — entry-level to mid-level to senior to leadership. Powers roadmap generation and career growth projections.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `from_career_id` | UUID | Yes | FK to source career |
| `to_career_id` | UUID | Yes | FK to target career |
| `progression_type` | enum | Yes | `"promotion"`, `"lateral_move"`, `"career_change"`, `"specialization"` |
| `typical_years_experience` | integer | No | Years needed before this progression |
| `additional_skills_needed` | JSON array | No | Skills to acquire for the transition |
| `difficulty` | enum | No | `"easy"`, `"medium"`, `"hard"`, `"very_hard"` |
| `salary_change_percentage` | number | No | Expected salary change |
| `description` | text | No | Why/how this progression happens |

#### Validation Rules
- `from_career_id` != `to_career_id`
- `typical_years_experience` must be >= 0 if provided
- Unique constraint: `(from_career_id, to_career_id, progression_type)`

#### Required Detail Level
Medium. At least 2-5 progression paths per career for the top 50 careers.

#### Data Sources
- LinkedIn career path data
- BLS career progression studies
- Glassdoor career trajectory data
- Expert interviews / career counselor input
- Company promotion frameworks

#### Update Frequency
Annually.

#### Example Record
```json
{
  "id": "f2a3b4c5-d6e7-8901-fabc-012345678901",
  "from_career_id": "junior-software-engineer-uuid",
  "to_career_id": "senior-software-engineer-uuid",
  "progression_type": "promotion",
  "typical_years_experience": 5,
  "additional_skills_needed": ["system_design", "mentoring", "code_review", "architecture"],
  "difficulty": "medium",
  "salary_change_percentage": 40.0,
  "description": "After 3-5 years of building production systems, engineers typically advance to senior roles with architectural responsibilities."
}
```

#### Tophexity Table Mapping
**New dataset.** Not in current Tophexity schema. Internal to Razer. Powers roadmap generation.

---

### 3.14 Career Relations

#### Purpose
Defines relationships between careers — related, alternative, prerequisite, supplementary.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | Source career |
| `related_career_id` | UUID | Yes | Target career |
| `relation_type` | enum | Yes | `"related"`, `"alternative"`, `"prerequisite"`, `"supplementary"` |
| `description` | text | No | Why this relationship exists |
| `skill_overlap_percentage` | number | No | How many skills overlap (0-100) |

#### Validation Rules
- `career_id` != `related_career_id`
- Unique constraint: `(career_id, related_career_id, relation_type)`
- Bidirectional: if A→B is "related", consider adding B→A

#### Relationship Types
- `related` — Similar career, easy to transition
- `alternative` — Viable backup option
- `prerequisite` — Must complete this career/skill first
- `supplementary` — Complementary career that enhances the primary

#### Required Detail Level
High. Each career should have 3-10 relations. Focus on alternatives (backup plans).

#### Data Sources
- Skill overlap analysis (compute from skill sets)
- LinkedIn career transitions data
- BLS career similarity analysis
- Expert curation

#### Update Frequency
Semi-annually.

#### Example Record
```json
{
  "id": "a3b4c5d6-e7f8-9012-abcd-123456789abc",
  "career_id": "software-engineer-uuid",
  "related_career_id": "data-engineer-uuid",
  "relation_type": "related",
  "description": "Both careers share core programming and system design skills. Data engineering adds distributed systems and data pipeline expertise.",
  "skill_overlap_percentage": 65
}
```

#### Tophexity Table Mapping
Maps to `career_relations` table (career_id, related_career_id, relation_type, description).

---

### 3.15 Career-Skill Junction

#### Purpose
Links careers to skills with proficiency requirements.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | FK to career |
| `skill_id` | UUID | Yes | FK to skill |
| `level` | enum | Yes | `"beginner"`, `"intermediate"`, `"advanced"`, `"expert"` |
| `is_required` | boolean | Yes | Default: true |
| `weight` | number (0-1) | No | Importance weight for scoring |

#### Validation Rules
- Unique constraint: `(career_id, skill_id)`

#### Required Detail Level
High. 5-15 skills per career.

#### Tophexity Table Mapping
Maps to `career_skills` table.

---

### 3.16 Career-Degree Junction

#### Purpose
Links careers to required/preferred degrees.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | FK to career |
| `degree_id` | UUID | Yes | FK to degree |
| `is_required` | boolean | Yes | Default: false |

#### Validation Rules
- Unique constraint: `(career_id, degree_id)`

#### Tophexity Table Mapping
Maps to `career_degrees` table.

---

### 3.17 Career-College Junction

#### Purpose
Links careers to colleges that offer relevant programs.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | FK to career |
| `college_id` | UUID | Yes | FK to college |
| `program_name` | string (max 500) | No | Specific program name |
| `relevance_score` | number (0-1) | No | How relevant this college is for this career |

#### Validation Rules
- Unique constraint: `(career_id, college_id)`

#### Tophexity Table Mapping
Maps to `career_colleges` table (career_id, college_id, program_name).

---

### 3.18 Career-Exam Junction

#### Purpose
Links careers to required/preferred entrance exams.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | FK to career |
| `exam_id` | UUID | Yes | FK to entrance exam |
| `is_required` | boolean | Yes | Default: false |

#### Validation Rules
- Unique constraint: `(career_id, exam_id)`

#### Tophexity Table Mapping
Maps to `career_entrance_exams` table.

---

### 3.19 Career-Scholarship Junction

#### Purpose
Links careers to relevant scholarships.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | FK to career |
| `scholarship_id` | UUID | Yes | FK to scholarship |

#### Validation Rules
- Unique constraint: `(career_id, scholarship_id)`

#### Tophexity Table Mapping
Maps to `career_scholarships` table.

---

### 3.20 Career-Resource Junction

#### Purpose
Links careers to learning resources.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | FK to career |
| `resource_id` | UUID | Yes | FK to resource |
| `relevance_type` | enum | No | `"foundational"`, `"intermediate"`, `"advanced"`, `"reference"` |

#### Validation Rules
- Unique constraint: `(career_id, resource_id)`

#### Tophexity Table Mapping
Maps to `career_resources` table.

---

### 3.21 Salary Information

#### Purpose
Detailed salary data by career, experience level, location, and industry. Powers the salary range in recommendations and career comparison.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `career_id` | UUID | Yes | FK to career |
| `experience_level` | enum | Yes | `"entry"`, `"junior"`, `"mid"`, `"senior"`, `"lead"`, `"executive"` |
| `salary_min` | number (12,2) | Yes | Minimum annual salary (USD) |
| `salary_max` | number (12,2) | Yes | Maximum annual salary (USD) |
| `salary_median` | number (12,2) | No | Median salary (USD) |
| `currency` | string (3) | No | ISO 4217 currency code. Default: `"USD"` |
| `location` | string (max 255) | No | Geographic area |
| `industry` | string (max 255) | No | Industry context |
| `year` | integer | Yes | Data year |
| `source` | string (max 255) | No | Data source |
| `percentile_25` | number (12,2) | No | 25th percentile |
| `percentile_75` | number (12,2) | No | 75th percentile |
| `percentile_90` | number (12,2) | No | 90th percentile |
| `total_compensation` | number (12,2) | No | Including bonuses, equity, benefits |

#### Validation Rules
- `salary_min` <= `salary_max`
- `salary_median` should be between min and max if provided
- `year` should be within the last 5 years
- `percentile_25` <= `percentile_75` <= `percentile_90` if all provided

#### Required Detail Level
High. At least 3 experience levels per career for the top 100 careers.

#### Data Sources
- BLS Occupational Employment and Wage Statistics
- Glassdoor salary data
- Levels.fyi (tech compensation)
- Payscale
- LinkedIn Salary Insights
- AmbitionBox salary data (India)
- PayScale India
- Randstad salary reports

#### Update Frequency
Annually.

#### Example Record
```json
{
  "id": "b4c5d6e7-f8a9-0123-bcde-234567890abc",
  "career_id": "software-engineer-uuid",
  "experience_level": "mid",
  "salary_min": 90000.00,
  "salary_max": 140000.00,
  "salary_median": 115000.00,
  "currency": "USD",
  "location": "United States",
  "industry": "Technology",
  "year": 2026,
  "source": "BLS OES 2026",
  "percentile_25": 95000.00,
  "percentile_75": 130000.00,
  "percentile_90": 155000.00,
  "total_compensation": 145000.00
}
```

#### Tophexity Table Mapping
**New dataset.** Not in current Tophexity schema. Internal to Razer. Stored as structured JSON in career's `required_education` or `typical_skills` JSON fields, or as separate internal collection.

---

### 3.22 Employment Trends

#### Purpose
Tracks hiring demand, growth rates, and emerging trends for careers over time. Powers demand_level and growth_outlook in recommendations.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `career_id` | UUID | Yes | FK to career |
| `year` | integer | Yes | Data year |
| `demand_level` | enum | Yes | Same as career demand_level |
| `job_postings_count` | integer | No | Approximate job postings |
| `growth_rate_percent` | number | No | Year-over-year growth |
| `top_employers` | JSON array | No | Top hiring companies |
| `hot_locations` | JSON array | No | Cities/regions with most demand |
| `emerging_skills` | JSON array | No | New skills becoming important |
| `remote_availability` | number | No | Percentage of jobs offering remote |
| `source` | string (max 255) | No | Data source |

#### Validation Rules
- `growth_rate_percent` can be negative (for declining careers)
- `remote_availability` must be between 0 and 100 if provided
- Unique constraint: `(career_id, year)`

#### Required Detail Level
Medium. Current year + 1 year historical for top 100 careers.

#### Data Sources
- LinkedIn Jobs data / Economic Graph
- Indeed job trends
- BLS employment projections
- Glassdoor hiring trends
- Lightcast (Burning Glass) labor market data
- Naukri.com job indices (India)

#### Update Frequency
Quarterly.

#### Example Record
```json
{
  "id": "c5d6e7f8-a9b0-1234-cdef-345678901bcd",
  "career_id": "ml-engineer-uuid",
  "year": 2026,
  "demand_level": "very_high",
  "job_postings_count": 125000,
  "growth_rate_percent": 35.0,
  "top_employers": ["Google", "Microsoft", "Amazon", "Meta", "OpenAI"],
  "hot_locations": ["San Francisco", "Seattle", "New York", "Bangalore", "London"],
  "emerging_skills": ["LLM Fine-tuning", "RAG", "AI Agents", "MLOps"],
  "remote_availability": 65.0,
  "source": "LinkedIn Economic Graph 2026"
}
```

#### Tophexity Table Mapping
**New dataset.** Not in current Tophexity schema. Internal to Razer. Feeds into career's `demand_level` and `growth_outlook`.

---

### 3.23 Work Environment

#### Purpose
Describes the typical work conditions for each career — remote options, team dynamics, travel, physical demands. Helps filter careers by lifestyle preferences.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `career_id` | UUID | Yes | FK to career |
| `remote_option` | enum | Yes | `"full"`, `"partial"`, `"none"` |
| `typical_team_size` | string | No | `"solo"`, `"2-5"`, `"5-15"`, `"15-50"`, `"50+"` |
| `travel_required` | enum | No | `"none"`, `"minimal"`, `"moderate"`, `"heavy"` |
| `travel_percentage` | number | No | 0-100 |
| `physical_demands` | enum | No | `"sedentary"`, `"light"`, `"moderate"`, `"heavy"` |
| `work_hours_flexibility` | enum | No | `"rigid"`, `"somewhat_flexible"`, `"very_flexible"` |
| `overtime_common` | boolean | No | Whether overtime is common |
| `office_environment` | enum | No | `"office"`, `"remote"`, `"hybrid"`, `"field"`, `"varies"` |
| `team_collaboration_level` | enum | No | `"individual"`, `"moderate"`, `"highly_collaborative"` |
| `stress_level` | enum | No | `"low"`, `"moderate"`, `"high"`, `"very_high"` |
| `work_life_balance_score` | number (1-10) | No | Subjective score |

#### Validation Rules
- `travel_percentage` must be between 0 and 100 if provided
- `work_life_balance_score` must be between 1 and 10 if provided

#### Required Detail Level
Medium. At least for the top 100 careers.

#### Data Sources
- BLS occupational characteristics
- O*NET work context data
- Glassdoor work-life balance reviews
- Indeed company reviews
- PayScale work environment data

#### Update Frequency
Annually.

#### Example Record
```json
{
  "id": "d6e7f8a9-b0c1-2345-defa-456789012cde",
  "career_id": "software-engineer-uuid",
  "remote_option": "full",
  "typical_team_size": "5-15",
  "travel_required": "minimal",
  "travel_percentage": 5,
  "physical_demands": "sedentary",
  "work_hours_flexibility": "very_flexible",
  "overtime_common": false,
  "office_environment": "hybrid",
  "team_collaboration_level": "highly_collaborative",
  "stress_level": "moderate",
  "work_life_balance_score": 7
}
```

#### Tophexity Table Mapping
**New dataset.** Not in current Tophexity schema. Internal to Razer. Powers career filtering by lifestyle preferences.

---

### 3.24 Subject Requirements

#### Purpose
Academic subjects required or preferred for careers. More granular than degree requirements — specifies which subjects within a degree matter.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `career_id` | UUID | Yes | FK to career |
| `subject_name` | string (max 255) | Yes | Subject name |
| `importance` | enum | Yes | `"required"`, `"preferred"`, `"helpful"` |
| `min_proficiency` | enum | No | `"basic"`, `"intermediate"`, `"advanced"` |
| `description` | text | No | Why this subject matters |

#### Validation Rules
- Unique constraint: `(career_id, subject_name)`

#### Required Detail Level
Medium. 3-8 subjects per career for top 50 careers.

#### Data Sources
- University program syllabi
- BLS education requirements
- Career counselor input
- Course prerequisite data

#### Update Frequency
Annually.

#### Example Record
```json
{
  "id": "e7f8a9b0-c1d2-3456-efab-567890123def",
  "career_id": "data-scientist-uuid",
  "subject_name": "Statistics",
  "importance": "required",
  "min_proficiency": "intermediate",
  "description": "Statistical inference, hypothesis testing, and regression analysis are fundamental to data science."
}
```

#### Tophexity Table Mapping
**New dataset.** Internal to Razer. Used by recommendation engine for academic alignment scoring.

---

### 3.25 Competitions & Olympiads

#### Purpose
Academic and skill competitions that strengthen profiles and demonstrate expertise. Useful for roadmap suggestions and portfolio building.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | Competition name |
| `description` | text | No | What it involves |
| `website` | string (max 1024) | No | Official page |
| `type` | enum | Yes | `"hackathon"`, `"olympiad"`, `"case_competition"`, `"debate"`, `"research_symposium"`, `" coding_contest"`, `"robotics"`, `"math_contest"` |
| `difficulty_level` | enum | No | `"beginner"`, `"intermediate"`, `"advanced"` |
| `frequency` | string (max 100) | No | `"annual"`, `"biannual"`, `"quarterly"` |
| `eligibility` | text | No | Who can participate |
| `skills_tested` | JSON array | No | Skills evaluated |
| `career_relevance` | JSON array | No | Which careers value this |
| `prestige_level` | enum | No | `"local"`, `"national"`, `"international"` |
| `prizes` | text | No | Prize information |
| `registration_deadline` | string | No | When registration closes |

#### Validation Rules
- `name` should be unique
- `prestige_level` must be one of the allowed values

#### Required Detail Level
Medium. At least 50 competitions across categories.

#### Data Sources
- Kaggle competitions
- HackerRank/LeetCode contests
- Science Olympiad official data
- IMO, IPhO, IChO official data
- MLH (Major League Hacking) events
- TechCrunch Disrupt, HackMIT, etc.
- Case competition databases

#### Update Frequency
Quarterly.

#### Example Record
```json
{
  "id": "f8a9b0c1-d2e3-4567-fabc-678901234ef0",
  "name": "Kaggle机器学习竞赛",
  "description": "Global platform for ML competitions with real-world datasets and cash prizes.",
  "website": "https://kaggle.com/competitions",
  "type": "coding_contest",
  "difficulty_level": "advanced",
  "frequency": "continuous",
  "eligibility": "Open to all",
  "skills_tested": ["Python", "Machine Learning", "Data Analysis", "Feature Engineering"],
  "career_relevance": ["Data Scientist", "ML Engineer", "Data Analyst"],
  "prestige_level": "international",
  "prizes": "Cash prizes up to $100,000 per competition",
  "registration_deadline": "Rolling"
}
```

#### Tophexity Table Mapping
**New dataset.** Internal to Razer. Used for portfolio suggestions in recommendations.

---

### 3.26 Research Opportunities

#### Purpose
Research programs, labs, and academic opportunities for students and early-career professionals. Relevant for research-oriented careers.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | Program/lab name |
| `organization` | string (max 255) | Yes | Institution or company |
| `description` | text | No | What the opportunity involves |
| `website` | string (max 1024) | No | Application page |
| `type` | enum | Yes | `"research_lab"`, `"summer_research"`, `"undergraduate_research"`, `"phd_position"`, `"postdoc"`, `"industry_research"` |
| `field` | string (max 255) | No | Research field |
| `eligibility` | text | No | Who can apply |
| `compensation` | text | No | Stipend, salary, or fellowship amount |
| `deadline` | string (max 50) | No | Application deadline |
| `location` | string (max 255) | No | Where it's based |
| `is_remote` | boolean | No | Whether remote participation is possible |

#### Validation Rules
- `name` + `organization` should be unique

#### Required Detail Level
Medium. At least 30 research opportunities.

#### Data Sources
- NSF REU program directory
- MIT CSAIL research openings
- Google Research internships
- University lab websites
- ResearchGate listings
- PhD position portals (FindAPhD, AcademicTransfer)

#### Update Frequency
Quarterly.

#### Example Record
```json
{
  "id": "a9b0c1d2-e3f4-5678-abcd-789012345fa1",
  "name": "Google Summer of Code",
  "organization": "Google",
  "description": "Global program pairing students with open-source organizations for summer coding projects.",
  "website": "https://summerofcode.withgoogle.com",
  "type": "summer_research",
  "field": "Computer Science / Open Source",
  "eligibility": "University students 18+",
  "compensation": "$3000 stipend",
  "deadline": "Annual (March-April)",
  "location": "Remote",
  "is_remote": true
}
```

#### Tophexity Table Mapping
**New dataset.** Internal to Razer. Used for roadmap suggestions.

---

### 3.27 Internships

#### Purpose
Internship opportunities linked to careers. Critical for students and early-career professionals.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `title` | string (max 500) | Yes | Internship title |
| `company` | string (max 255) | Yes | Company name |
| `description` | text | No | What the internship involves |
| `career_id` | UUID | No | FK to related career |
| `location` | string (max 255) | No | Where |
| `is_remote` | boolean | No | Remote option |
| `duration_weeks` | integer | No | Duration |
| `paid` | boolean | No | Whether paid |
| `stipend_usd` | number | No | Monthly stipend |
| `skills_required` | JSON array | No | Skills needed |
| `application_url` | string (max 1024) | No | Apply link |
| `application_deadline` | string | No | Deadline |
| `season` | enum | No | `"summer"`, `"winter"`, `"spring"`, `"fall"`, `"year_round"` |
| `conversion_rate` | number | No | % of interns who get full-time offers |

#### Validation Rules
- `duration_weeks` must be > 0 if provided
- `stipend_usd` must be >= 0 if provided

#### Required Detail Level
Medium. At least 50 internships across top careers.

#### Data Sources
- LinkedIn internship listings
- Glassdoor internship reviews
- Company career pages
- Internshala (India)
- Chegg internships
- Handshake (university job boards)

#### Update Frequency
Monthly. Internship deadlines are seasonal.

#### Example Record
```json
{
  "id": "b0c1d2e3-f4a5-6789-bcde-890123456ab2",
  "title": "Software Engineering Intern",
  "company": "Google",
  "description": "Work on real Google projects alongside full-time engineers.",
  "career_id": "software-engineer-uuid",
  "location": "Mountain View, CA",
  "is_remote": true,
  "duration_weeks": 12,
  "paid": true,
  "stipend_usd": 8000,
  "skills_required": ["Python", "Java", "Data Structures", "Algorithms"],
  "application_url": "https://careers.google.com/students/",
  "application_deadline": "2026-09-30",
  "season": "summer",
  "conversion_rate": 0.35
}
```

#### Tophexity Table Mapping
**New dataset.** Internal to Razer. Used for portfolio suggestions and roadmap steps.

---

### 3.28 Professional Organizations

#### Purpose
Industry associations and professional bodies. Useful for networking, certifications, and career development suggestions.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | Organization name |
| `description` | text | No | What they do |
| `website` | string (max 1024) | No | Official page |
| `industry` | string (max 255) | No | Related industry |
| `membership_cost_usd` | number | No | Annual membership fee |
| `benefits` | JSON array | No | Member benefits |
| `student_membership` | boolean | No | Whether student membership exists |
| `student_cost_usd` | number | No | Student membership fee |

#### Validation Rules
- `name` should be unique
- `student_cost_usd` should be <= `membership_cost_usd` if both provided

#### Required Detail Level
Low. At least 20 organizations.

#### Data Sources
- ACM (Association for Computing Machinery)
- IEEE
- PMI (Project Management Institute)
- ASME (American Society of Mechanical Engineers)
- AMA (American Medical Association)
- Bar associations
- Company/industry directories

#### Update Frequency
Annually.

#### Example Record
```json
{
  "id": "c1d2e3f4-a5b6-7890-cdef-901234567bc3",
  "name": "Association for Computing Machinery (ACM)",
  "description": "World's largest computing society, advancing computing as a science and profession.",
  "website": "https://acm.org",
  "industry": "Technology",
  "membership_cost_usd": 99.00,
  "benefits": ["Access to Digital Library", "Conferences", "Magazines", "Special Interest Groups", "Career Resources"],
  "student_membership": true,
  "student_cost_usd": 49.00
}
```

#### Tophexity Table Mapping
**New dataset.** Internal to Razer. Used for career development suggestions.

---

### 3.29 Communities

#### Purpose
Online and offline communities where professionals in a career field gather. Important for networking, mentorship, and staying current.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | Community name |
| `platform` | enum | Yes | `"discord"`, `"slack"`, `"reddit"`, `"linkedin"`, `"meetup"`, `"forum"`, `"twitter"`, `"github"` |
| `url` | string (max 1024) | Yes | Join link |
| `description` | text | No | What the community is about |
| `career_ids` | JSON array | No | Which careers are relevant |
| `member_count` | integer | No | Approximate size |
| `is_free` | boolean | No | Default: true |
| `activity_level` | enum | No | `"very_active"`, `"active"`, `"moderate"`, `"low"` |
| `language` | string (max 50) | No | Primary language |

#### Validation Rules
- `url` must be a valid URL
- `member_count` must be >= 0 if provided

#### Required Detail Level
Low. At least 30 communities.

#### Data Sources
- Reddit sidebar links
- Discord server directories
- Meetup.com
- GitHub communities
- LinkedIn groups
- Hacker News

#### Update Frequency
Semi-annually.

#### Example Record
```json
{
  "id": "d2e3f4a5-b6c7-8901-defa-012345678cd4",
  "name": "r/MachineLearning",
  "platform": "reddit",
  "url": "https://reddit.com/r/MachineLearning",
  "description": "Reddit's largest ML community for discussions, papers, and projects.",
  "career_ids": ["ml-engineer-uuid", "data-scientist-uuid", "ai-researcher-uuid"],
  "member_count": 2500000,
  "is_free": true,
  "activity_level": "very_active",
  "language": "English"
}
```

#### Tophexity Table Mapping
**New dataset.** Internal to Razer. Used for career development suggestions in chat context.

---

### 3.30 Mentorship Resources

#### Purpose
Mentorship programs and platforms that connect mentees with experienced professionals. Valuable for roadmap and career development suggestions.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID v4 | Auto | Unique identifier |
| `name` | string (max 500) | Yes | Program/platform name |
| `description` | text | No | How it works |
| `website` | string (max 1024) | No | Link |
| `type` | enum | Yes | `"platform"`, `"formal_program"`, `"informal"`, `"peer"` |
| `cost` | enum | No | `"free"`, `"subscription"`, `"per_session"` |
| `cost_usd` | number | No | Cost amount |
| `career_focus` | JSON array | No | Which careers it covers |
| `availability` | string (max 100) | No | `"global"`, `"us_only"`, `"india_only"` |
| `rating` | number (1-5) | No | Average rating |

#### Validation Rules
- `rating` must be between 1 and 5 if provided
- `cost_usd` must be >= 0 if provided

#### Required Detail Level
Low. At least 15 mentorship resources.

#### Data Sources
- MentorCruise
- ADPList (free mentorship)
- Score.org (business mentorship)
- LinkedIn Mentorship
- Clubhouse (for specific fields)
- University alumni mentorship programs

#### Update Frequency
Semi-annually.

#### Example Record
```json
{
  "id": "e3f4a5b6-c7d8-9012-efab-123456789de5",
  "name": "ADPList",
  "description": "Free platform connecting learners with mentors in design, engineering, data, and product.",
  "website": "https://adplist.org",
  "type": "platform",
  "cost": "free",
  "cost_usd": 0,
  "career_focus": ["Software Engineering", "Data Science", "Product Design", "Product Management"],
  "availability": "global",
  "rating": 4.7
}
```

#### Tophexity Table Mapping
**New dataset.** Internal to Razer. Used for career development suggestions.

---

### 3.31 Career Certification Junction

#### Purpose
Links careers to relevant certifications.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `career_id` | UUID | Yes | FK to career |
| `certification_id` | UUID | Yes | FK to certification |
| `is_recommended` | boolean | Yes | Default: true |
| `relevance_level` | enum | No | `"essential"`, `"recommended"`, `"nice_to_have"` |

#### Validation Rules
- Unique constraint: `(career_id, certification_id)`

#### Tophexity Table Mapping
**New junction.** Internal to Razer.

---

### 3.32 Skill Certification Junction

#### Purpose
Links skills to certifications that validate them.

#### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `skill_id` | UUID | Yes | FK to skill |
| `certification_id` | UUID | Yes | FK to certification |

#### Validation Rules
- Unique constraint: `(skill_id, certification_id)`

#### Tophexity Table Mapping
**New junction.** Internal to Razer.

---

## 4. Relationship Map

```
Industries ─────┐
                 │ 1:N
                 ▼
              Careers ──────────────────────────────────────────────┐
              │  │  │  │  │  │  │  │  │  │                        │
              │  │  │  │  │  │  │  │  │  │                        │
              │  │  │  │  │  │  │  │  │  └── Career Relations (self-ref)
              │  │  │  │  │  │  │  │  │
              │  │  │  │  │  │  │  │  └── Career Progression (self-ref)
              │  │  │  │  │  │  │  │
              │  │  │  │  │  │  │  └── Job Roles (1:N)
              │  │  │  │  │  │  │
              │  │  │  │  │  │  └── Salary Information (1:N)
              │  │  │  │  │  │
              │  │  │  │  │  └── Employment Trends (1:N)
              │  │  │  │  │
              │  │  │  │  └── Work Environment (1:1)
              │  │  │  │
              │  │  │  └── Subject Requirements (1:N)
              │  │  │
              │  │  └── Career-Skill ──── Skills
              │  │         (junction)         │
              │  │                            ├── Skill Relationships
              │  │                            └── Skill Certifications ─── Certifications
              │  │
              │  └── Career-Degree ──── Degrees
              │
              ├── Career-College ──── Colleges
              │                        │
              │                        └── College Programs ──── Degrees
              │
              ├── Career-Exam ──── Entrance Exams
              │
              ├── Career-Scholarship ──── Scholarships
              │
              ├── Career-Resource ──── Learning Resources
              │
              ├── Career-Certification ──── Certifications
              │
              ├── Competitions & Olympiads
              │
              ├── Research Opportunities
              │
              ├── Internships
              │
              ├── Professional Organizations
              │
              ├── Communities
              │
              └── Mentorship Resources
```

---

## 5. Dataset-to-Feature Mapping

| Feature | Datasets Used | Priority |
|---------|--------------|----------|
| **RAG (Chat Context)** | Careers, Skills, Learning Resources, Certifications, Communities, Professional Organizations | High |
| **Recommendation Engine** | Careers, Skills, Career-Skill, Degrees, Career-Degree, Industries, Salary Information, Employment Trends, Work Environment, Subject Requirements, Career Relations, Career Progression, Job Roles | High |
| **Roadmap Generation** | Careers, Skills, Skill Relationships, Career Progression, Learning Resources, Certifications, Competitions, Research Opportunities, Internships | High |
| **Backup Plan Generation** | Careers, Career Relations, Career-Skill, Skill Relationships, Career Progression, Salary Information | High |
| **AI Chat Context** | Careers, Skills, Colleges, Degrees, Scholarships, Learning Resources, Communities, Mentorship Resources | Medium |
| **Career Comparison** | Careers, Skills, Salary Information, Work Environment, Employment Trends, Job Roles | Medium |
| **Skill Gap Analysis** | Skills, Skill Relationships, Career-Skill, Certifications | Medium |
| **College Recommendations** | Colleges, College Programs, Career-College, Career-Degree, Scholarships, Entrance Exams | Medium |
| **Financial Planning** | Salary Information, Scholarships, Colleges (tuition data) | Low |
| **Career Exploration** | Industries, Careers, Job Roles, Career Progression, Career Relations | Low |

---

## 6. Recommended Folder Structure

```
razer-knowledge-base/
├── README.md                          # Overview and setup instructions
├── data/
│   ├── careers/
│   │   ├── careers.json               # Core career records
│   │   ├── career_relations.json      # Career-to-career relationships
│   │   ├── career_progression.json    # Career progression paths
│   │   └── job_roles.json             # Specific job roles per career
│   ├── skills/
│   │   ├── skills.json                # Skill taxonomy
│   │   └── skill_relationships.json   # Skill prerequisites, complements
│   ├── education/
│   │   ├── degrees.json               # Degree catalog
│   │   ├── colleges.json              # College catalog
│   │   ├── college_programs.json      # Programs offered by colleges
│   │   └── entrance_exams.json        # Exam catalog
│   ├── financial/
│   │   ├── scholarships.json          # Scholarship catalog
│   │   └── salary_data.json           # Salary information
│   ├── credentials/
│   │   ├── certifications.json        # Certification catalog
│   │   └── competitions.json          # Competitions and olympiads
│   ├── resources/
│   │   ├── learning_resources.json    # Courses, books, tutorials
│   │   ├── research_opportunities.json
│   │   ├── internships.json
│   │   └── mentorship_resources.json
│   ├── industry/
│   │   ├── industries.json            # Industry catalog
│   │   ├── employment_trends.json     # Hiring trends
│   │   └── work_environments.json     # Work conditions
│   ├── community/
│   │   ├── professional_organizations.json
│   │   └── communities.json           # Online/offline communities
│   └── junctions/
│       ├── career_skills.json
│       ├── career_degrees.json
│       ├── career_colleges.json
│       ├── career_exams.json
│       ├── career_scholarships.json
│       ├── career_resources.json
│       ├── career_certifications.json
│       └── skill_certifications.json
├── schemas/
│   ├── careers.schema.json            # JSON Schema for validation
│   ├── skills.schema.json
│   └── ... (one schema per dataset)
├── scripts/
│   ├── validate.py                    # Validate all data files
│   ├── import_to_tophexity.py         # Import into Tophexity DB
│   └── generate_junctions.py          # Auto-generate junction data
├── tests/
│   ├── test_data_integrity.py         # Referential integrity checks
│   └── test_import.py                 # Test import into Tophexity
└── docs/
    ├── collection_guide.md            # How to collect each dataset
    ├── data_sources.md                # Where to find the data
    └── update_procedure.md            # How to refresh data
```

---

## 7. JSON Format Templates

Every dataset file should follow this structure:

```json
{
  "metadata": {
    "dataset": "careers",
    "version": "1.0.0",
    "last_updated": "2026-07-23T00:00:00Z",
    "total_records": 350,
    "schema_version": "1.0"
  },
  "records": [
    { "id": "...", "title": "...", "..." : "..." }
  ]
}
```

Every record must have:
- `id`: UUID v4 string
- All required fields populated
- Optional fields as `null` if not available

---

## 8. Collection Order & Priority Ranking

| Priority | Dataset | Est. Records | Est. Time | Why This Order |
|----------|---------|-------------|-----------|----------------|
| **P0** | Careers | 300-500 | 2 weeks | Everything depends on this |
| **P0** | Skills | 500-2000 | 1 week | Core to matching algorithm |
| **P0** | Career-Skill Junction | 2000-5000 | 1 week | Links careers to skills |
| **P0** | Career Relations | 1000-2000 | 3 days | Powers alternatives and backup plans |
| **P1** | Degrees | 100-300 | 3 days | Education requirements |
| **P1** | Career-Degree Junction | 500-1000 | 2 days | Links careers to degrees |
| **P1** | Entrance Exams | 50-200 | 3 days | India-focused, critical for Indian users |
| **P1** | Career-Exam Junction | 200-500 | 2 days | Links careers to exams |
| **P1** | Colleges | 200-500 | 1 week | India-focused initially |
| **P1** | Career-College Junction | 500-1000 | 3 days | Links careers to colleges |
| **P1** | Learning Resources | 500-2000 | 1 week | Powers learning path recommendations |
| **P1** | Career-Resource Junction | 1000-3000 | 3 days | Links careers to resources |
| **P2** | Salary Information | 500-1000 | 3 days | Detailed salary data |
| **P2** | Scholarships | 100-500 | 3 days | Financial aid |
| **P2** | Career-Scholarship Junction | 200-500 | 1 day | Links careers to scholarships |
| **P2** | Work Environment | 200-500 | 2 days | Lifestyle filtering |
| **P2** | Employment Trends | 300-500 | 2 days | Demand data |
| **P2** | Industries | 20-50 | 1 day | Career categorization |
| **P2** | Subject Requirements | 200-500 | 2 days | Academic alignment |
| **P2** | Skill Relationships | 500-1000 | 3 days | Learning path prerequisites |
| **P3** | Certifications | 100-300 | 3 days | Career validation |
| **P3** | Career-Certification Junction | 200-500 | 1 day | Links careers to certifications |
| **P3** | Skill Certification Junction | 300-500 | 1 day | Links skills to certifications |
| **P3** | Job Roles | 300-500 | 3 days | Granular career breakdown |
| **P3** | Career Progression | 500-1000 | 3 days | Career growth paths |
| **P3** | Competitions & Olympiads | 50-100 | 2 days | Profile building |
| **P4** | Internships | 50-100 | 2 days | Student opportunities |
| **P4** | Research Opportunities | 30-50 | 1 day | Academic research |
| **P4** | Professional Organizations | 20-30 | 1 day | Networking |
| **P4** | Communities | 30-50 | 1 day | Community engagement |
| **P4** | Mentorship Resources | 15-20 | 1 day | Career guidance |
| **P4** | College Programs | 200-500 | 3 days | Granular program data |

**Total estimated records:** ~15,000-25,000
**Total estimated time:** 8-12 weeks for a single developer

---

## 9. Additional Datasets & Metadata

### 9.1 Metadata Datasets (Recommended)

| Dataset | Purpose | Priority |
|---------|---------|----------|
| `data_sources` | Track where each piece of data came from | High |
| `data_quality_scores` | Rate completeness/accuracy of each record | Medium |
| `update_logs` | Track when records were last refreshed | Medium |
| `career_tags` | Flexible tagging system for careers | Low |
| `user_feedback` | Track which recommendations users liked/disliked | Medium |
| `regional_variations` | Career data may differ by country/region | Low |

### 9.2 Datasets That Would Significantly Improve Quality

| Dataset | Why | Priority |
|---------|-----|----------|
| **Day-in-the-Life Descriptions** | Rich text describing a typical day for each career. Powers AI chat context. | High |
| **Interview Preparation Data** | Common interview questions per career. Useful for roadmap. | Medium |
| **Portfolio Examples** | Example projects that demonstrate career-readiness. Powers portfolio suggestions. | Medium |
| **Industry Salary Benchmarks** | Aggregate salary data by industry and region. Better than per-career salary. | Medium |
| **Career Personality Mapping** | Map careers to Holland Code (RIASEC) types. Improves interest-to-career matching. | High |
| **Time-to-Entry Data** | How long it realistically takes to enter each career (education + job search). | Medium |
| **Geographic Demand Heatmap** | Where each career is in demand. Powers location-based recommendations. | Low |
| **Employer Ratings** | Company culture, compensation, and growth ratings. Useful for career context. | Low |
| **Visa/Work Permit Data** | International career mobility information. Relevant for relocation scenarios. | Low |

---

## 10. Data Quality Rules

### 10.1 Completeness Requirements

| Field Category | Minimum Completeness |
|---------------|---------------------|
| Career: title, description | 100% |
| Career: average_salary, growth_outlook, demand_level | 80% |
| Skills: name, category | 100% |
| Career-Skill junctions | Every career must have 3+ skills |
| Career-Degree junctions | Every career must have 1+ degree |
| Career-Resource junctions | Every career must have 1+ resource |
| Colleges: name, location | 100% |
| Scholarships: name, amount or eligibility | 100% |
| Resources: title, url, resource_type | 100% |

### 10.2 Accuracy Rules

- All URLs must be verified working at time of collection
- Salary data must be from the last 2 years
- Growth outlook must be backed by BLS or equivalent data
- College rankings must be from recognized ranking bodies
- Exam information must be from official sources

### 10.3 Consistency Rules

- All UUIDs must be v4 format
- All dates must be ISO 8601
- All monetary values must be in USD (convert if needed)
- Enum values must match the specified allowed values
- Career titles must be consistent (e.g., always "Software Engineer" not sometimes "Software Developer")

### 10.4 Referential Integrity

- Every `career_id` in a junction table must reference a valid career
- Every `skill_id` in a junction table must reference a valid skill
- No orphaned records — if a career is removed, update all junctions first
- Self-referencing FKs (career_relations, skill_relationships) must not create cycles for `prerequisite` type

---

## 11. Validation Checklist

Before importing data into Tophexity, Razer must verify:

- [ ] All UUIDs are valid v4 format
- [ ] All required fields are populated (not null, not empty)
- [ ] All enum values are within allowed ranges
- [ ] All URLs are valid and accessible
- [ ] All monetary values are >= 0
- [ ] All percentage values are between 0 and 100
- [ ] All junction tables reference valid parent records
- [ ] No duplicate records within any dataset
- [ ] Career titles are unique
- [ ] Skill names are unique
- [ ] Exam names are unique
- [ ] Degree names are unique
- [ ] JSON fields contain valid JSON
- [ ] All `min` salary values are <= corresponding `max` salary values
- [ ] Career-Skill levels match the allowed enum values
- [ ] No circular prerequisites in skill_relationships
- [ ] Every career has at least 1 skill, 1 degree, and 1 resource
- [ ] Every college program references a valid college and degree
- [ ] Total records match expected ranges (±20%)
- [ ] No markdown, HTML, or rich text in plain text fields
- [ ] All timestamps are in UTC

---

*End of specification.*
