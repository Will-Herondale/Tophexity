import math
from uuid import UUID

from sqlalchemy import or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.career import (
    Career, CareerCollege, CareerDegree, CareerEntranceExam,
    CareerScholarship, CareerSkill,
    College, Degree, EntranceExam, Scholarship, Skill,
)
from app.schemas.knowledge_base import (
    CareerCollegeDetail, CareerDegreeDetail, CareerExamDetail,
    CareerScholarshipDetail, CareerSkillDetail,
    KBCareerDetail, KBCareerListItem, KBCareerListResponse,
    KBCollegeListResponse, KBCollegeResponse,
    KBDegreeListResponse, KBDegreeResponse,
    KBExamListResponse, KBExamResponse,
    KBScholarshipListResponse, KBScholarshipResponse,
    KBSkillListResponse, KBSkillResponse,
    KBStatsResponse,
)
from app.utils.exceptions import NotFoundException


async def search_careers(
    db: AsyncSession,
    search: str | None = None,
    category: str | None = None,
    industry: str | None = None,
    skill: str | None = None,
    degree_level: str | None = None,
    demand_level: str | None = None,
    min_salary: float | None = None,
    max_salary: float | None = None,
    work_environment: str | None = None,
    sort_by: str = "title",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> KBCareerListResponse:
    query = select(Career)
    count_query = select(func.count(Career.id))

    if search:
        f = or_(
            Career.title.ilike(f"%{search}%"),
            Career.description.ilike(f"%{search}%"),
        )
        query = query.where(f)
        count_query = count_query.where(f)

    if category:
        f = Career.category.ilike(f"%{category}%")
        query = query.where(f)
        count_query = count_query.where(f)

    if industry:
        f = Career.industry.ilike(f"%{industry}%")
        query = query.where(f)
        count_query = count_query.where(f)

    if skill:
        f = Skill.name.ilike(f"%{skill}%")
        query = query.join(CareerSkill).join(Skill).where(f)
        count_query = count_query.join(CareerSkill).join(Skill).where(f)

    if degree_level:
        f = Degree.level.ilike(f"%{degree_level}%")
        query = query.join(CareerDegree).join(Degree).where(f)
        count_query = count_query.join(CareerDegree).join(Degree).where(f)

    if demand_level:
        f = Career.demand_level.ilike(f"%{demand_level}%")
        query = query.where(f)
        count_query = count_query.where(f)

    if min_salary is not None:
        query = query.where(Career.entry_level_salary >= min_salary)
        count_query = count_query.where(Career.entry_level_salary >= min_salary)

    if max_salary is not None:
        query = query.where(Career.highest_salary <= max_salary)
        count_query = count_query.where(Career.highest_salary <= max_salary)

    if work_environment:
        f = Career.work_environment.ilike(f"%{work_environment}%")
        query = query.where(f)
        count_query = count_query.where(f)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    allowed_sorts = {
        "title", "average_salary", "entry_level_salary", "mid_level_salary",
        "senior_level_salary", "highest_salary", "created_at", "updated_at",
    }
    sort_col = getattr(Career, sort_by, Career.title) if sort_by in allowed_sorts else Career.title
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    careers = [KBCareerListItem.model_validate(c) for c in result.scalars().all()]

    return KBCareerListResponse(
        items=careers, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


async def get_career_detail(db: AsyncSession, career_id: UUID) -> KBCareerDetail:
    result = await db.execute(
        select(Career)
        .options(
            selectinload(Career.career_skills).selectinload(CareerSkill.skill),
            selectinload(Career.career_degrees).selectinload(CareerDegree.degree),
            selectinload(Career.career_colleges).selectinload(CareerCollege.college),
            selectinload(Career.career_exams).selectinload(CareerEntranceExam.exam),
            selectinload(Career.career_scholarships).selectinload(CareerScholarship.scholarship),
        )
        .where(Career.id == career_id)
    )
    career = result.unique().scalar_one_or_none()
    if not career:
        raise NotFoundException(detail="Career not found")

    return KBCareerDetail(
        id=career.id,
        title=career.title,
        description=career.description,
        average_salary=career.average_salary,
        growth_outlook=career.growth_outlook,
        demand_level=career.demand_level,
        category=career.category,
        industry=career.industry,
        work_environment=career.work_environment,
        weekly_hours=career.weekly_hours,
        travel_requirement=career.travel_requirement,
        stress_level=career.stress_level,
        work_life_balance=career.work_life_balance,
        automation_risk=career.automation_risk,
        salary_currency=career.salary_currency,
        entry_level_salary=career.entry_level_salary,
        mid_level_salary=career.mid_level_salary,
        senior_level_salary=career.senior_level_salary,
        highest_salary=career.highest_salary,
        required_education=career.required_education,
        typical_skills=career.typical_skills,
        skills=[
            CareerSkillDetail(name=cs.skill.name, category=cs.skill.category, level=cs.level.value if hasattr(cs.level, 'value') else str(cs.level), is_required=cs.is_required)
            for cs in career.career_skills
        ],
        degrees=[
            CareerDegreeDetail(name=cd.degree.name, level=cd.degree.level, field=cd.degree.field, is_required=cd.is_required)
            for cd in career.career_degrees
        ],
        colleges=[
            CareerCollegeDetail(name=cc.college.name, location=cc.college.location, program_name=cc.program_name)
            for cc in career.career_colleges
        ],
        exams=[
            CareerExamDetail(name=ce.exam.name, description=ce.exam.description, is_required=ce.is_required)
            for ce in career.career_exams
        ],
        scholarships=[
            CareerScholarshipDetail(name=cs.scholarship.name, description=cs.scholarship.description, amount=cs.scholarship.amount)
            for cs in career.career_scholarships
        ],
        created_at=career.created_at,
        updated_at=career.updated_at,
    )


async def search_skills(
    db: AsyncSession,
    search: str | None = None,
    category: str | None = None,
    sort_by: str = "name",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> KBSkillListResponse:
    query = select(Skill)
    count_query = select(func.count(Skill.id))

    if search:
        f = Skill.name.ilike(f"%{search}%")
        query = query.where(f)
        count_query = count_query.where(f)

    if category:
        f = Skill.category.ilike(f"%{category}%")
        query = query.where(f)
        count_query = count_query.where(f)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    sort_col = getattr(Skill, sort_by, Skill.name) if sort_by in {"name", "category"} else Skill.name
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    skills = [KBSkillResponse.model_validate(s) for s in result.scalars().all()]

    return KBSkillListResponse(
        items=skills, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


async def search_degrees(
    db: AsyncSession,
    search: str | None = None,
    level: str | None = None,
    field: str | None = None,
    sort_by: str = "name",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> KBDegreeListResponse:
    query = select(Degree)
    count_query = select(func.count(Degree.id))

    if search:
        f = Degree.name.ilike(f"%{search}%")
        query = query.where(f)
        count_query = count_query.where(f)

    if level:
        f = Degree.level.ilike(f"%{level}%")
        query = query.where(f)
        count_query = count_query.where(f)

    if field:
        f = Degree.field.ilike(f"%{field}%")
        query = query.where(f)
        count_query = count_query.where(f)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    sort_col = getattr(Degree, sort_by, Degree.name) if sort_by in {"name", "level", "field"} else Degree.name
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    degrees = [KBDegreeResponse.model_validate(d) for d in result.scalars().all()]

    return KBDegreeListResponse(
        items=degrees, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


async def search_colleges(
    db: AsyncSession,
    search: str | None = None,
    location: str | None = None,
    sort_by: str = "name",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> KBCollegeListResponse:
    query = select(College)
    count_query = select(func.count(College.id))

    if search:
        f = College.name.ilike(f"%{search}%")
        query = query.where(f)
        count_query = count_query.where(f)

    if location:
        f = College.location.ilike(f"%{location}%")
        query = query.where(f)
        count_query = count_query.where(f)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    sort_col = getattr(College, sort_by, College.name) if sort_by in {"name", "location", "ranking"} else College.name
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    colleges = [KBCollegeResponse.model_validate(c) for c in result.scalars().all()]

    return KBCollegeListResponse(
        items=colleges, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


async def search_exams(
    db: AsyncSession,
    search: str | None = None,
    sort_by: str = "name",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> KBExamListResponse:
    query = select(EntranceExam)
    count_query = select(func.count(EntranceExam.id))

    if search:
        f = EntranceExam.name.ilike(f"%{search}%")
        query = query.where(f)
        count_query = count_query.where(f)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    sort_col = getattr(EntranceExam, sort_by, EntranceExam.name) if sort_by in {"name"} else EntranceExam.name
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    exams = [KBExamResponse.model_validate(e) for e in result.scalars().all()]

    return KBExamListResponse(
        items=exams, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


async def search_scholarships(
    db: AsyncSession,
    search: str | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    sort_by: str = "name",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> KBScholarshipListResponse:
    query = select(Scholarship)
    count_query = select(func.count(Scholarship.id))

    if search:
        f = or_(
            Scholarship.name.ilike(f"%{search}%"),
            Scholarship.description.ilike(f"%{search}%"),
        )
        query = query.where(f)
        count_query = count_query.where(f)

    if min_amount is not None:
        query = query.where(Scholarship.amount >= min_amount)
        count_query = count_query.where(Scholarship.amount >= min_amount)

    if max_amount is not None:
        query = query.where(Scholarship.amount <= max_amount)
        count_query = count_query.where(Scholarship.amount <= max_amount)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    sort_col = getattr(Scholarship, sort_by, Scholarship.name) if sort_by in {"name", "amount"} else Scholarship.name
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    scholarships = [KBScholarshipResponse.model_validate(s) for s in result.scalars().all()]

    return KBScholarshipListResponse(
        items=scholarships, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


async def get_stats(db: AsyncSession) -> KBStatsResponse:
    counts = {}
    for name, model in [
        ("total_careers", Career),
        ("total_skills", Skill),
        ("total_degrees", Degree),
        ("total_colleges", College),
        ("total_exams", EntranceExam),
        ("total_scholarships", Scholarship),
    ]:
        r = await db.execute(select(func.count(model.id)))
        counts[name] = r.scalar() or 0

    r = await db.execute(select(Career.category).where(Career.category.isnot(None)).distinct())
    categories = sorted([row[0] for row in r.all() if row[0]])

    r = await db.execute(select(Career.industry).where(Career.industry.isnot(None)).distinct())
    industries = sorted([row[0] for row in r.all() if row[0]])

    return KBStatsResponse(
        total_careers=counts["total_careers"],
        total_skills=counts["total_skills"],
        total_degrees=counts["total_degrees"],
        total_colleges=counts["total_colleges"],
        total_exams=counts["total_exams"],
        total_scholarships=counts["total_scholarships"],
        categories=categories,
        industries=industries,
    )
