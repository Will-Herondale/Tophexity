# Tophexity — Data Collection Method

**Purpose:** Explain to judges how the Tophexity career knowledge base was built.

---

## 1. The Starting Point

Two authoritative documents defined *what* to collect and *how* it would be used:

- **`RAZER_DATA_COLLECTION_SPECIFICATION.md`** — the complete catalog of 32 datasets (careers, skills, degrees, colleges, entrance exams, scholarships, resources, salaries, trends, and junctions). For every dataset it specifies:
  - the exact field schema,
  - validation rules,
  - required detail level,
  - data sources,
  - and a collection priority order (P0 → P4).
- **`RAZER_MODULE_SPECIFICATION.md`** — the API/integration contract: how the collected data flows into Tophexity (via `POST /v1/careers/import`) and which datasets power which feature (recommendations, roadmaps, backup plans, RAG chat).

These docs made the data collection **structured and repeatable** rather than ad-hoc.

---

## 2. What Was Collected

A knowledge base covering 150+ careers across domains, each captured as a **63-column record**:

- **Identity:** Career Title, Category, Industry, Alternative Job Titles
- **Description:** Short + Detailed Description, Daily Responsibilities, Typical Projects
- **Work context:** Work Environment, Weekly Hours, Travel, Stress Level, Work-Life Balance
- **Education path:** Minimum Qualification, Preferred Degrees, Fields of Study, School Subjects, Entrance Exams, Licenses, Certifications
- **Skills:** Required Technical / Soft / Optional Skills, Tools, Software, Programming Languages
- **Market data:** Demand Level, Growth Outlook, Emerging-Career and AI-risk flags
- **Compensation:** Entry / Mid / Senior / Highest Salary bands + currency
- **Career paths:** Roles by seniority, Related Careers, Alternative / Backup Careers
- **Learning:** Beginner/Intermediate/Advanced Resources, Books, Docs, Courses, Practice Platforms
- **Growth:** Competitions, Professional Communities, Degrees, Colleges, Scholarships, Internships, Research Opportunities
- **Fit:** Personality Traits, Interests, and requirement scores
- **Provenance:** a **Sources** column on every row (often with exact URLs)

Collected in domain-grouped research files under `rdocs/`:

| File | Domain | Scope |
|---|---|---|
| `career-research-technology-software-50-careers.csv` | Technology / Software | 50 careers |
| `core_engineering_careers_50_complete.csv` | Engineering | 50 careers |
| `AI_Data_Careers_Research.csv` | AI / Data | 50 careers |
| `creative_media_design_50_careers_master.tsv` | Creative / Media / Design | 50 careers |
| `50_Education_Social_Sciences_Careers.tsv` | Education / Social Sciences | 50 careers |
| `science_careers_research_100.csv` | Science | 100 careers |
| `careers_business_finance_management.csv` | Business / Finance / Management | — |
| `careers_150_combined.csv` | Merged master set | 150 careers |

---

## 3. How the Data Was Gathered

The collection process combined **direct web scraping** of primary sources with **manual curation/verification**, driven by the data-source list in the spec:

| Source | Used For | Example |
|---|---|---|
| BLS Occupational Outlook Handbook | Duties, outlook %, salary bands, education requirements | `bls.gov/ooh/computer-and-information-technology/software-developers.htm` |
| O*NET OnLine | Skills, work environment, task breakdown (per SOC code) | `onetonline.org/link/summary/15-1132.00` |
| Glassdoor / PayScale / Levels.fyi / AmbitionBox / Naukri | Entry/mid/senior salary figures (US + India) | — |
| Professional associations (IEEE, ASME, AIGA, D&AD, APA, NASW, NEA) | Communities, certifications, resources | — |
| NIRF / AICTE / NTA / National Scholarship Portal | Colleges, entrance exams, scholarships | — |
| WEF Future of Jobs Report | Growth outlook, emerging-career flags | — |

**Process per career:**
1. Pull the authoritative description/outlook data from BLS OOH + O*NET for that title.
2. Cross-check salary bands across salary sites; normalize to USD (or INR where India-specific).
3. Fill education, skill, resource, college, and scholarship columns from the remaining sources.
4. Record the **Sources** for that row so every fact is traceable.
5. Validate against the spec's checklist (unique titles, allowed enums, salary min ≤ max, every career has ≥1 skill/degree/resource, verified URLs).

---

## 4. From Research Files to the Database

1. **Research files** (`rdocs/`) — the scraped/curated data as CSV/TSV with the shared 63-column schema.
2. **Authoring scripts** (`batch1-10.py`, `generate_careers.py`) — same records, programmatically assembled.
3. **`build_all.py`** — merges batches into a single pipe-delimited output.
4. **`scripts/import_knowledge_base.py`** — bulk, idempotent importer that parses the research files (auto-detects delimiter), normalizes fields, and loads entities + junction rows into PostgreSQL.

---

## 5. Result in Production

Live Postgres knowledge base (visible in the app's DB Viewer):

- careers **540**, skills **4,782**, career_skills **9,839**, career_degrees **3,433**
- colleges **1,001**, career_colleges **2,796**, scholarships **1,135**, career_scholarships **1,790**
- entrance_exams **1,160**, career_entrance_exams **1,160**, resources **1,986**, career_resources **1,986**
- 32 tables total, ~13,000 document embeddings for RAG-powered chat

---

*Companion docs: `RAZER_DATA_COLLECTION_SPECIFICATION.md`, `RAZER_MODULE_SPECIFICATION.md`.*
