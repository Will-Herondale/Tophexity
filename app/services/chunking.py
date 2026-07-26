"""Document chunking service for the knowledge base.

Each source type has a tailored chunking strategy that preserves semantic meaning.
"""
import hashlib
import re
from dataclasses import dataclass, field


@dataclass
class Chunk:
    text: str
    source_id: str
    source_type: str
    chunk_index: int
    metadata: dict = field(default_factory=dict)

    @property
    def content_hash(self) -> str:
        return hashlib.sha256(self.text.encode()).hexdigest()


def _clean(text: str | None) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _split_into_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]


def chunk_career(career: dict, chunk_size: int = 512) -> list[Chunk]:
    """Chunk a career record into semantic pieces."""
    chunks = []
    cid = str(career["id"])

    core_text = _clean(career.get("description", ""))
    if core_text:
        sub_chunks = _smart_split(core_text, chunk_size)
        for i, text in enumerate(sub_chunks):
            chunks.append(Chunk(
                text=text,
                source_id=cid,
                source_type="career",
                chunk_index=i,
                metadata={
                    "title": career.get("title", ""),
                    "category": career.get("category", ""),
                    "industry": career.get("industry", ""),
                    "chunk_role": "description",
                },
            ))

    salary_parts = []
    if career.get("entry_level_salary"):
        salary_parts.append(f"Entry level salary: {career['salary_currency'] or 'USD'} {career['entry_level_salary']}")
    if career.get("mid_level_salary"):
        salary_parts.append(f"Mid level salary: {career['salary_currency'] or 'USD'} {career['mid_level_salary']}")
    if career.get("senior_level_salary"):
        salary_parts.append(f"Senior level salary: {career['salary_currency'] or 'USD'} {career['senior_level_salary']}")
    if salary_parts:
        idx = len(chunks)
        chunks.append(Chunk(
            text=f"{career.get('title', 'Career')}. Salaries: {'; '.join(salary_parts)}.",
            source_id=cid,
            source_type="career",
            chunk_index=idx,
            metadata={"title": career.get("title", ""), "chunk_role": "salary"},
        ))

    work_parts = []
    for field_name, label in [
        ("work_environment", "Work environment"),
        ("weekly_hours", "Weekly hours"),
        ("stress_level", "Stress level"),
        ("work_life_balance", "Work-life balance"),
        ("automation_risk", "Automation risk"),
        ("travel_requirement", "Travel requirement"),
    ]:
        val = career.get(field_name)
        if val:
            work_parts.append(f"{label}: {_clean(val)}")
    if work_parts:
        idx = len(chunks)
        chunks.append(Chunk(
            text=f"{career.get('title', 'Career')}. {'; '.join(work_parts)}.",
            source_id=cid,
            source_type="career",
            chunk_index=idx,
            metadata={"title": career.get("title", ""), "chunk_role": "work_profile"},
        ))

    skills = career.get("skills", [])
    if skills:
        skill_names = [s.get("name", "") for s in skills if s.get("name")]
        if skill_names:
            idx = len(chunks)
            chunks.append(Chunk(
                text=f"{career.get('title', 'Career')} requires skills: {', '.join(skill_names[:30])}.",
                source_id=cid,
                source_type="career",
                chunk_index=idx,
                metadata={"title": career.get("title", ""), "chunk_role": "skills", "skill_count": len(skill_names)},
            ))

    degrees = career.get("degrees", [])
    if degrees:
        deg_names = [d.get("name", "") for d in degrees if d.get("name")]
        if deg_names:
            idx = len(chunks)
            chunks.append(Chunk(
                text=f"{career.get('title', 'Career')} requires degrees: {', '.join(deg_names[:15])}.",
                source_id=cid,
                source_type="career",
                chunk_index=idx,
                metadata={"title": career.get("title", ""), "chunk_role": "degrees"},
            ))

    colleges = career.get("colleges", [])
    if colleges:
        col_names = [c.get("name", "") for c in colleges if c.get("name")]
        if col_names:
            idx = len(chunks)
            chunks.append(Chunk(
                text=f"Colleges for {career.get('title', 'Career')}: {', '.join(col_names[:15])}.",
                source_id=cid,
                source_type="career",
                chunk_index=idx,
                metadata={"title": career.get("title", ""), "chunk_role": "colleges"},
            ))

    exams = career.get("exams", [])
    if exams:
        ex_names = [e.get("name", "") for e in exams if e.get("name")]
        if ex_names:
            idx = len(chunks)
            chunks.append(Chunk(
                text=f"Entrance exams for {career.get('title', 'Career')}: {', '.join(ex_names[:10])}.",
                source_id=cid,
                source_type="career",
                chunk_index=idx,
                metadata={"title": career.get("title", ""), "chunk_role": "exams"},
            ))

    scholarships = career.get("scholarships", [])
    if scholarships:
        sch_names = [s.get("name", "") for s in scholarships if s.get("name")]
        if sch_names:
            idx = len(chunks)
            chunks.append(Chunk(
                text=f"Scholarships for {career.get('title', 'Career')}: {', '.join(sch_names[:10])}.",
                source_id=cid,
                source_type="career",
                chunk_index=idx,
                metadata={"title": career.get("title", ""), "chunk_role": "scholarships"},
            ))

    return chunks if chunks else [Chunk(
        text=f"{career.get('title', 'Unknown career')}: {_clean(career.get('description', 'No description'))}",
        source_id=cid,
        source_type="career",
        chunk_index=0,
        metadata={"title": career.get("title", ""), "chunk_role": "basic"},
    )]


def chunk_skill(skill: dict) -> list[Chunk]:
    sid = str(skill["id"])
    text = f"Skill: {skill['name']}"
    if skill.get("category"):
        text += f" (category: {skill['category']})"
    career_count = skill.get("career_count", 0)
    if career_count:
        text += f". Used in {career_count} careers."
    return [Chunk(text=text, source_id=sid, source_type="skill", chunk_index=0,
                  metadata={"name": skill["name"], "category": skill.get("category", "")})]


def chunk_degree(degree: dict) -> list[Chunk]:
    sid = str(degree["id"])
    text = f"Degree: {degree['name']}, level: {degree['level']}"
    if degree.get("field"):
        text += f", field: {degree['field']}"
    return [Chunk(text=text, source_id=sid, source_type="degree", chunk_index=0,
                  metadata={"name": degree["name"], "level": degree["level"]})]


def chunk_college(college: dict) -> list[Chunk]:
    sid = str(college["id"])
    text = f"College: {college['name']}"
    if college.get("location"):
        text += f", located in {college['location']}"
    if college.get("ranking"):
        text += f", ranking #{college['ranking']}"
    return [Chunk(text=text, source_id=sid, source_type="college", chunk_index=0,
                  metadata={"name": college["name"], "location": college.get("location", "")})]


def chunk_scholarship(scholarship: dict) -> list[Chunk]:
    sid = str(scholarship["id"])
    text = f"Scholarship: {scholarship['name']}"
    if scholarship.get("amount"):
        text += f", amount: {scholarship['amount']}"
    if scholarship.get("eligibility"):
        text += f". Eligibility: {_clean(scholarship['eligibility'])[:200]}"
    if scholarship.get("description"):
        text += f". {_clean(scholarship['description'])[:300]}"
    return [Chunk(text=text, source_id=sid, source_type="scholarship", chunk_index=0,
                  metadata={"name": scholarship["name"]})]


def chunk_exam(exam: dict) -> list[Chunk]:
    sid = str(exam["id"])
    text = f"Entrance Exam: {exam['name']}"
    if exam.get("description"):
        text += f". {_clean(exam['description'])[:300]}"
    return [Chunk(text=text, source_id=sid, source_type="exam", chunk_index=0,
                  metadata={"name": exam["name"]})]


def _smart_split(text: str, max_chars: int = 512) -> list[str]:
    if len(text) <= max_chars:
        return [text]

    sentences = _split_into_sentences(text)
    chunks = []
    current = ""
    for sentence in sentences:
        if len(current) + len(sentence) + 1 <= max_chars:
            current = f"{current} {sentence}".strip() if current else sentence
        else:
            if current:
                chunks.append(current)
            current = sentence
    if current:
        chunks.append(current)

    if not chunks:
        for i in range(0, len(text), max_chars):
            chunks.append(text[i:i + max_chars])

    return chunks
