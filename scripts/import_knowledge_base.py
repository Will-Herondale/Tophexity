"""Import Career Intelligence Knowledge Base data into PostgreSQL.

Bulk-optimized: loads entities into memory, uses batch inserts.
Idempotent: skips existing careers by title.
"""

import asyncio
import csv
import io
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import async_session_factory
from app.models.career import (
    Career, CareerCollege, CareerDegree, CareerEntranceExam,
    CareerResource, CareerScholarship, CareerSkill,
    College, Degree, EntranceExam, Resource, Scholarship, Skill,
)
from app.models.enums import SkillLevel
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert

RDOCS = Path(__file__).resolve().parent.parent / "rdocs"
EXTRACTED = RDOCS / "extracted" / "main research files"


def detect_delimiter(first_line: str) -> str:
    if "\t" in first_line:
        return "\t"
    if "|" in first_line:
        return "|"
    return ","


def read_file(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8-sig", errors="replace")
    first_line = text.split("\n")[0]
    delim = detect_delimiter(first_line)
    reader = csv.DictReader(io.StringIO(text), delimiter=delim)
    return list(reader)


def parse_salary(raw: str) -> float | None:
    if not raw or raw.strip() in ("", "N/A", "Not specified", "-", "None", "USD", "INR"):
        return None
    raw = raw.strip().replace("$", "").replace(",", "").replace("₹", "").replace("INR", "").strip()
    raw = re.sub(r'[+]$', '', raw)
    raw = raw.replace("K", "000").replace("k", "000")
    for sep in [" - ", "-", "–", "~", " to "]:
        if sep in raw:
            parts = raw.split(sep, 1)
            try:
                return (float(parts[0].strip()) + float(parts[1].strip())) / 2
            except ValueError:
                pass
    try:
        return float(raw.strip())
    except ValueError:
        return None


def normalize_skill(name: str) -> str:
    return re.sub(r'\s+', ' ', name.strip().lower())


def normalize_degree(name: str) -> tuple[str, str]:
    name = re.sub(r'\s+', ' ', name.strip())
    level = "unknown"
    lower = name.lower()
    if any(w in lower for w in ["phd", "doctorate", "doctoral", "d.phil"]):
        level = "doctorate"
    elif any(w in lower for w in ["master", "mba", "m.sc", "mtech", "m.s.", "ms "]):
        level = "master"
    elif any(w in lower for w in ["bachelor", "b.sc", "btech", "b.s.", "bs ", "b.e.", "b.com", "bba", "b.a.", "a.b."]):
        level = "bachelor"
    elif any(w in lower for w in ["associate", "diploma", "certificate"]):
        level = "associate"
    elif any(w in lower for w in ["high school", "secondary", "12th", "10th"]):
        level = "high_school"
    return name, level


def parse_list_field(raw: str) -> list[str]:
    if not raw or raw.strip() in ("", "N/A", "-", "None"):
        return []
    return [i.strip() for i in raw.replace(";", ",").split(",") if i.strip() and i.strip() not in ("N/A", "-", "None")]


def map_skill_level(demand: str) -> SkillLevel:
    if not demand:
        return SkillLevel.INTERMEDIATE
    d = demand.lower()
    if "very high" in d or "high" in d:
        return SkillLevel.ADVANCED
    elif "low" in d or "entry" in d:
        return SkillLevel.BEGINNER
    return SkillLevel.INTERMEDIATE


def _count_filled(row: dict) -> int:
    c = 0
    for v in row.values():
        if isinstance(v, list):
            if v: c += 1
        elif v and isinstance(v, str) and v.strip() not in ("", "N/A", "-", "None"):
            c += 1
    return c


def collect_all_careers() -> list[dict]:
    all_files = sorted(
        [f for f in RDOCS.glob("*") if f.suffix in (".csv", ".tsv")]
        + [f for f in EXTRACTED.glob("*") if f.suffix in (".csv", ".tsv")]
    )
    seen = {}
    for fpath in all_files:
        for row in read_file(fpath):
            title = (row.get("Career Title") or "").strip()
            if not title:
                continue
            key = title.lower()
            if key not in seen or _count_filled(row) > _count_filled(seen[key]):
                seen[key] = row
    return list(seen.values())


async def import_data():
    print("=" * 70)
    print("CAREER INTELLIGENCE KNOWLEDGE BASE IMPORT")
    print("=" * 70)

    careers_data = collect_all_careers()
    print(f"\nUnique careers after dedup: {len(careers_data)}")

    stats = {k: 0 for k in [
        "careers_imported", "careers_skipped",
        "skills", "degrees", "colleges", "exams", "scholarships", "resources",
        "career_skills", "career_degrees", "career_colleges",
        "career_exams", "career_scholarships", "career_resources",
    ]}

    async with async_session_factory() as db:
        # Load existing career titles
        result = await db.execute(select(Career.title))
        existing_titles = {r[0].lower() for r in result.all()}
        print(f"Existing careers in DB: {len(existing_titles)}")

        # Pre-load all existing lookup entities into memory
        skill_map = {}
        for r in (await db.execute(select(Skill))).scalars().all():
            skill_map[r.name.lower()] = r.id
        degree_map = {}
        for r in (await db.execute(select(Degree))).scalars().all():
            degree_map[r.name.lower()] = r.id
        college_map = {}
        for r in (await db.execute(select(College))).scalars().all():
            college_map[r.name.lower()] = r.id
        exam_map = {}
        for r in (await db.execute(select(EntranceExam))).scalars().all():
            exam_map[r.name.lower()] = r.id
        sch_map = {}
        for r in (await db.execute(select(Scholarship))).scalars().all():
            sch_map[r.name.lower()] = r.id

        # Pre-load existing career junction keys
        existing_career_skills = set()
        existing_career_degrees = set()
        existing_career_colleges = set()
        existing_career_exams = set()
        existing_career_scholarships = set()

        # New entities to insert
        new_skills = {}  # name -> {name, category}
        new_degrees = {}  # name -> {name, level}
        new_colleges = {}  # name -> {name}
        new_exams = {}  # name -> {name}
        new_scholarships = {}  # name -> {name}

        # Careers to insert
        careers_to_insert = []
        junction_rows = {"skills": [], "degrees": [], "colleges": [], "exams": [], "scholarships": [], "resources": []}

        for row in careers_data:
            title = (row.get("Career Title") or "").strip()
            description = (row.get("Detailed Description") or row.get("Short Description") or "").strip()
            if not title or not description:
                stats["careers_skipped"] += 1
                continue
            if title.lower() in existing_titles:
                stats["careers_skipped"] += 1
                continue

            entry_sal = parse_salary(row.get("Entry-Level Salary", ""))
            mid_sal = parse_salary(row.get("Mid-Level Salary", ""))
            senior_sal = parse_salary(row.get("Senior-Level Salary", ""))
            highest_sal = parse_salary(row.get("Highest Typical Salary", ""))
            avg_sal = None
            if entry_sal and mid_sal:
                avg_sal = (entry_sal + mid_sal) / 2
            elif entry_sal:
                avg_sal = entry_sal
            elif mid_sal:
                avg_sal = mid_sal

            meta = {}
            for key in [
                "Alternative Job Titles", "Typical Daily Responsibilities", "Typical Projects",
                "Common Tools", "Common Software", "Common Programming Languages",
                "Personality Traits", "Suitable Interests", "Industries Hiring", "Major Employers",
                "Entry-Level Roles", "Mid-Level Roles", "Senior Roles", "Leadership Roles",
                "Required School Subjects", "Relevant Fields of Study", "Recommended Certifications",
                "Professional Licenses", "Creativity Requirement", "Mathematical Requirement",
                "Communication Requirement", "Leadership Requirement",
                "Beginner Learning Resources", "Intermediate Learning Resources", "Advanced Learning Resources",
                "Recommended Books", "Online Courses", "Practice Platforms",
                "Competitions / Hackathons / Olympiads", "Professional Communities",
                "Internship Opportunities", "Research Opportunities", "Sources",
                "Alternative / Backup Careers", "Emerging Career",
            ]:
                val = (row.get(key) or "").strip()
                if val and val not in ("N/A", "-", "None"):
                    meta[key] = val

            def _cap_salary(v):
                if v is not None and (v > 9999999999.99 or v < -9999999999.99):
                    return None
                return v

            careers_to_insert.append({
                "title": title[:255],
                "description": description[:5000],
                "average_salary": _cap_salary(avg_sal),
                "growth_outlook": (row.get("Future Growth Outlook") or "").strip()[:100] or None,
                "demand_level": (row.get("Demand Level") or "").strip()[:50] or None,
                "category": (row.get("Career Category") or "").strip()[:255] or None,
                "industry": (row.get("Industry / Sector") or "").strip()[:255] or None,
                "work_environment": (row.get("Work Environment") or "").strip()[:2000] or None,
                "weekly_hours": (row.get("Typical Weekly Working Hours") or "").strip()[:50] or None,
                "travel_requirement": (row.get("Travel Requirement") or "").strip()[:100] or None,
                "stress_level": (row.get("Stress Level") or "").strip()[:50] or None,
                "work_life_balance": (row.get("Work-Life Balance") or "").strip()[:50] or None,
                "automation_risk": (row.get("Automation / AI Risk") or "").strip()[:100] or None,
                "salary_currency": (row.get("Salary Currency") or "").strip()[:10] or None,
                "entry_level_salary": _cap_salary(entry_sal),
                "mid_level_salary": _cap_salary(mid_sal),
                "senior_level_salary": _cap_salary(senior_sal),
                "highest_salary": _cap_salary(highest_sal),
                "metadata": meta if meta else None,
            })
            stats["careers_imported"] += 1

            # Collect skills
            for field, cat in [("Required Technical Skills", "technical"), ("Required Soft Skills", "soft"), ("Optional Skills", "optional")]:
                for sn in parse_list_field(row.get(field, "")):
                    n = normalize_skill(sn)
                    if n and n not in skill_map and n not in new_skills:
                        new_skills[n] = {"name": n, "category": cat}

            # Collect degrees
            for dn in parse_list_field(row.get("Preferred Degree(s)", "")) + parse_list_field(row.get("Top Relevant Degrees", "")):
                nn, nl = normalize_degree(dn)
                if nn and nn.lower() not in degree_map and nn.lower() not in new_degrees:
                    new_degrees[nn.lower()] = {"name": nn, "level": nl}

            # Collect colleges
            for cn in parse_list_field(row.get("Top Colleges / Universities", "")):
                nc = re.sub(r'\s+', ' ', cn.strip())
                if nc and nc.lower() not in college_map and nc.lower() not in new_colleges:
                    new_colleges[nc.lower()] = {"name": nc}

            # Collect exams
            for en in parse_list_field(row.get("Entrance Exams", "")):
                ne = re.sub(r'\s+', ' ', en.strip())
                if ne and ne.lower() not in exam_map and ne.lower() not in new_exams and ne.lower() not in ("none", "null", "n/a", "not applicable"):
                    new_exams[ne.lower()] = {"name": ne}

            # Collect scholarships
            for sn in parse_list_field(row.get("Scholarships", "")):
                ns = re.sub(r'\s+', ' ', sn.strip())
                if ns and ns.lower() not in sch_map and ns.lower() not in new_scholarships:
                    new_scholarships[ns.lower()] = {"name": ns}

        print(f"  Careers to insert: {len(careers_to_insert)}")
        print(f"  New skills to create: {len(new_skills)}")
        print(f"  New degrees to create: {len(new_degrees)}")
        print(f"  New colleges to create: {len(new_colleges)}")
        print(f"  New exams to create: {len(new_exams)}")
        print(f"  New scholarships to create: {len(new_scholarships)}")

        # Bulk insert new lookup entities
        if new_skills:
            await db.execute(pg_insert(Skill).values(list(new_skills.values())).on_conflict_do_nothing(index_elements=["name"]))
            await db.flush()
            for r in (await db.execute(select(Skill))).scalars().all():
                skill_map[r.name.lower()] = r.id
            stats["skills"] = len(new_skills)

        if new_degrees:
            await db.execute(pg_insert(Degree).values(list(new_degrees.values())).on_conflict_do_nothing(index_elements=["name"]))
            await db.flush()
            for r in (await db.execute(select(Degree))).scalars().all():
                degree_map[r.name.lower()] = r.id
            stats["degrees"] = len(new_degrees)

        if new_colleges:
            for c in new_colleges.values():
                existing = await db.execute(select(College.id).where(College.name == c["name"]).limit(1))
                if not existing.scalar_one_or_none():
                    db.add(College(**c))
            await db.flush()
            for r in (await db.execute(select(College))).scalars().all():
                college_map[r.name.lower()] = r.id
            stats["colleges"] = len(new_colleges)

        if new_exams:
            await db.execute(pg_insert(EntranceExam).values(list(new_exams.values())).on_conflict_do_nothing(index_elements=["name"]))
            await db.flush()
            for r in (await db.execute(select(EntranceExam))).scalars().all():
                exam_map[r.name.lower()] = r.id
            stats["exams"] = len(new_exams)

        if new_scholarships:
            for s in new_scholarships.values():
                existing = await db.execute(select(Scholarship.id).where(Scholarship.name == s["name"]).limit(1))
                if not existing.scalar_one_or_none():
                    db.add(Scholarship(**s))
            await db.flush()
            for r in (await db.execute(select(Scholarship))).scalars().all():
                sch_map[r.name.lower()] = r.id
            stats["scholarships"] = len(new_scholarships)

        # Bulk insert careers in batches of 50
        career_title_to_id = {}
        errors = 0
        for i in range(0, len(careers_to_insert), 50):
            batch = careers_to_insert[i:i+50]
            for cdata in batch:
                md = cdata.pop("metadata", None)
                try:
                    career = Career(**cdata)
                    if md:
                        career.metadata_ = md
                    db.add(career)
                    await db.flush()
                    career_title_to_id[cdata["title"].lower()] = career.id
                except Exception as e:
                    await db.rollback()
                    errors += 1
                    if errors <= 5:
                        print(f"  ERROR inserting '{cdata.get('title', '?')}': {str(e)[:200]}")
            if (i // 50) % 5 == 0:
                print(f"  Processed careers batch {i//50 + 1}...")

        # Also load existing career IDs for title->id mapping
        result = await db.execute(select(Career.id, Career.title))
        for cid, ctitle in result.all():
            career_title_to_id[ctitle.lower()] = cid

        print(f"  Total career IDs mapped: {len(career_title_to_id)}")

        # Build junction rows from original data
        for row in careers_data:
            title = (row.get("Career Title") or "").strip()
            if not title or title.lower() not in career_title_to_id:
                continue
            cid = career_title_to_id[title.lower()]

            for field in ["Required Technical Skills", "Required Soft Skills", "Optional Skills"]:
                is_req = field != "Optional Skills"
                for sn in parse_list_field(row.get(field, "")):
                    n = normalize_skill(sn)
                    if n in skill_map:
                        junction_rows["skills"].append({"career_id": cid, "skill_id": skill_map[n], "level": map_skill_level(row.get("Demand Level", "")).value, "is_required": is_req})

            for dn in parse_list_field(row.get("Preferred Degree(s)", "")) + parse_list_field(row.get("Top Relevant Degrees", "")):
                nn, _ = normalize_degree(dn)
                if nn.lower() in degree_map:
                    junction_rows["degrees"].append({"career_id": cid, "degree_id": degree_map[nn.lower()], "is_required": False})

            for cn in parse_list_field(row.get("Top Colleges / Universities", "")):
                nc = re.sub(r'\s+', ' ', cn.strip()).lower()
                if nc in college_map:
                    junction_rows["colleges"].append({"career_id": cid, "college_id": college_map[nc]})

            for en in parse_list_field(row.get("Entrance Exams", "")):
                ne = re.sub(r'\s+', ' ', en.strip()).lower()
                if ne in exam_map:
                    junction_rows["exams"].append({"career_id": cid, "exam_id": exam_map[ne], "is_required": False})

            for sn in parse_list_field(row.get("Scholarships", "")):
                ns = re.sub(r'\s+', ' ', sn.strip()).lower()
                if ns in sch_map:
                    junction_rows["scholarships"].append({"career_id": cid, "scholarship_id": sch_map[ns]})

        # Bulk insert junctions in chunks
        CHUNK = 500

        for i in range(0, len(junction_rows["skills"]), CHUNK):
            chunk = junction_rows["skills"][i:i+CHUNK]
            for r in chunk:
                r["level"] = SkillLevel(r["level"])
            await db.execute(pg_insert(CareerSkill).values(chunk).on_conflict_do_nothing(index_elements=["career_id", "skill_id"]))
        stats["career_skills"] = len(junction_rows["skills"])

        for i in range(0, len(junction_rows["degrees"]), CHUNK):
            await db.execute(pg_insert(CareerDegree).values(junction_rows["degrees"][i:i+CHUNK]).on_conflict_do_nothing(index_elements=["career_id", "degree_id"]))
        stats["career_degrees"] = len(junction_rows["degrees"])

        for i in range(0, len(junction_rows["colleges"]), CHUNK):
            await db.execute(pg_insert(CareerCollege).values(junction_rows["colleges"][i:i+CHUNK]).on_conflict_do_nothing(index_elements=["career_id", "college_id"]))
        stats["career_colleges"] = len(junction_rows["colleges"])

        for i in range(0, len(junction_rows["exams"]), CHUNK):
            await db.execute(pg_insert(CareerEntranceExam).values(junction_rows["exams"][i:i+CHUNK]).on_conflict_do_nothing(index_elements=["career_id", "exam_id"]))
        stats["career_exams"] = len(junction_rows["exams"])

        for i in range(0, len(junction_rows["scholarships"]), CHUNK):
            await db.execute(pg_insert(CareerScholarship).values(junction_rows["scholarships"][i:i+CHUNK]).on_conflict_do_nothing(index_elements=["career_id", "scholarship_id"]))
        stats["career_scholarships"] = len(junction_rows["scholarships"])

        await db.commit()

    print(f"\n--- IMPORT STATS ---")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    # Final DB counts
    async with async_session_factory() as db:
        for model, name in [
            (Career, "careers"), (Skill, "skills"), (Degree, "degrees"),
            (College, "colleges"), (EntranceExam, "entrance_exams"),
            (Scholarship, "scholarships"),
            (CareerSkill, "career_skills"), (CareerDegree, "career_degrees"),
            (CareerCollege, "career_colleges"), (CareerEntranceExam, "career_entrance_exams"),
            (CareerScholarship, "career_scholarships"),
        ]:
            result = await db.execute(select(func.count(model.id)))
            print(f"  DB {name}: {result.scalar() or 0}")

    print(f"\n{'=' * 70}")
    print("IMPORT COMPLETE")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    asyncio.run(import_data())
