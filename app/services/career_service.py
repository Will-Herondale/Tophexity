import math
from uuid import UUID

from sqlalchemy import or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.career import (
    Career, CareerCollege, CareerDegree, CareerEntranceExam,
    CareerResource, CareerScholarship, CareerSkill,
    College, Degree, EntranceExam, Resource, Scholarship, Skill,
)
from app.schemas.career import (
    CareerCreate, CareerDetailResponse, CareerImportRequest,
    CareerImportResponse, CareerListResponse, CareerResponse, CareerUpdate,
)
from app.utils.exceptions import BadRequestException, NotFoundException


async def import_careers(
    db: AsyncSession, data: CareerImportRequest
) -> CareerImportResponse:
    imported = 0
    skipped = 0
    created_careers = []
    for career_data in data.careers:
        result = await db.execute(
            select(Career).where(Career.title == career_data.title)
        )
        if result.scalar_one_or_none():
            skipped += 1
            continue
        career = Career(
            title=career_data.title,
            description=career_data.description,
            average_salary=career_data.average_salary,
            growth_outlook=career_data.growth_outlook,
            demand_level=career_data.demand_level,
            required_education=career_data.required_education,
            typical_skills=career_data.typical_skills,
        )
        db.add(career)
        await db.flush()
        if career_data.skills:
            for s in career_data.skills:
                skill_result = await db.execute(
                    select(Skill).where(Skill.name == s.name)
                )
                skill = skill_result.scalar_one_or_none()
                if not skill:
                    skill = Skill(name=s.name, category=s.category)
                    db.add(skill)
                    await db.flush()
                cs = CareerSkill(
                    career_id=career.id,
                    skill_id=skill.id,
                    level=s.level,
                    is_required=s.is_required,
                )
                db.add(cs)
        if career_data.degrees:
            for d in career_data.degrees:
                deg_result = await db.execute(
                    select(Degree).where(Degree.name == d.name)
                )
                degree = deg_result.scalar_one_or_none()
                if not degree:
                    degree = Degree(name=d.name, level=d.level, field=d.field)
                    db.add(degree)
                    await db.flush()
                cd = CareerDegree(
                    career_id=career.id,
                    degree_id=degree.id,
                    is_required=d.is_required,
                )
                db.add(cd)
        if career_data.colleges:
            for c in career_data.colleges:
                col_result = await db.execute(
                    select(College).where(College.name == c.name)
                )
                college = col_result.scalar_one_or_none()
                if not college:
                    college = College(name=c.name, location=c.location)
                    db.add(college)
                    await db.flush()
                cc = CareerCollege(
                    career_id=career.id,
                    college_id=college.id,
                    program_name=c.program_name,
                )
                db.add(cc)
        if career_data.exams:
            for e in career_data.exams:
                ex_result = await db.execute(
                    select(EntranceExam).where(EntranceExam.name == e.name)
                )
                exam = ex_result.scalar_one_or_none()
                if not exam:
                    exam = EntranceExam(name=e.name, description=e.description)
                    db.add(exam)
                    await db.flush()
                ce = CareerEntranceExam(
                    career_id=career.id,
                    exam_id=exam.id,
                    is_required=e.is_required,
                )
                db.add(ce)
        if career_data.scholarships:
            for s in career_data.scholarships:
                sch_result = await db.execute(
                    select(Scholarship).where(Scholarship.name == s.name)
                )
                scholarship = sch_result.scalar_one_or_none()
                if not scholarship:
                    scholarship = Scholarship(
                        name=s.name, description=s.description, amount=s.amount
                    )
                    db.add(scholarship)
                    await db.flush()
                cs = CareerScholarship(
                    career_id=career.id,
                    scholarship_id=scholarship.id,
                )
                db.add(cs)
        if career_data.resources:
            for r in career_data.resources:
                res = Resource(
                    title=r.title,
                    url=r.url,
                    resource_type=r.resource_type,
                    description=r.description,
                )
                db.add(res)
                await db.flush()
                cr = CareerResource(
                    career_id=career.id,
                    resource_id=res.id,
                )
                db.add(cr)
        imported += 1
        created_careers.append(career)
    await db.flush()
    return CareerImportResponse(
        imported=imported,
        skipped=skipped,
        careers=[CareerResponse.model_validate(c) for c in created_careers],
    )


async def search_careers(
    db: AsyncSession,
    search: str | None = None,
    skill: str | None = None,
    degree_level: str | None = None,
    demand_level: str | None = None,
    min_salary: float | None = None,
    max_salary: float | None = None,
    sort_by: str = "title",
    sort_order: str = "asc",
    page: int = 1,
    page_size: int = 20,
) -> CareerListResponse:
    query = select(Career)
    count_query = select(func.count(Career.id))

    if search:
        search_filter = or_(
            Career.title.ilike(f"%{search}%"),
            Career.description.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if skill:
        query = query.join(CareerSkill).join(Skill).where(Skill.name.ilike(f"%{skill}%"))
        count_query = count_query.join(CareerSkill).join(Skill).where(Skill.name.ilike(f"%{skill}%"))

    if degree_level:
        query = query.join(CareerDegree).join(Degree).where(Degree.level.ilike(f"%{degree_level}%"))
        count_query = count_query.join(CareerDegree).join(Degree).where(Degree.level.ilike(f"%{degree_level}%"))

    if demand_level:
        query = query.where(Career.demand_level.ilike(f"%{demand_level}%"))
        count_query = count_query.where(Career.demand_level.ilike(f"%{demand_level}%"))

    if min_salary is not None:
        query = query.where(Career.average_salary >= min_salary)
        count_query = count_query.where(Career.average_salary >= min_salary)

    if max_salary is not None:
        query = query.where(Career.average_salary <= max_salary)
        count_query = count_query.where(Career.average_salary <= max_salary)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    sort_col = getattr(Career, sort_by, Career.title)
    if sort_order == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    careers = [CareerResponse.model_validate(c) for c in result.scalars().all()]

    return CareerListResponse(
        items=careers, total=total, page=page, page_size=page_size, total_pages=total_pages
    )


async def get_career_detail(db: AsyncSession, career_id: UUID) -> CareerDetailResponse:
    result = await db.execute(
        select(Career)
        .options(
            selectinload(Career.career_skills).selectinload(CareerSkill.skill),
            selectinload(Career.career_degrees).selectinload(CareerDegree.degree),
            selectinload(Career.career_colleges).selectinload(CareerCollege.college),
            selectinload(Career.career_exams).selectinload(CareerEntranceExam.exam),
            selectinload(Career.career_scholarships).selectinload(CareerScholarship.scholarship),
            selectinload(Career.career_resources).selectinload(CareerResource.resource),
        )
        .where(Career.id == career_id)
    )
    career = result.unique().scalar_one_or_none()
    if not career:
        raise NotFoundException(detail="Career not found")
    from app.schemas.career import SkillResponse, DegreeResponse, CollegeResponse, EntranceExamResponse, ScholarshipResponse, ResourceResponse
    return CareerDetailResponse(
        id=career.id,
        title=career.title,
        description=career.description,
        average_salary=career.average_salary,
        growth_outlook=career.growth_outlook,
        demand_level=career.demand_level,
        required_education=career.required_education,
        typical_skills=career.typical_skills,
        skills=[SkillResponse.model_validate(cs.skill) for cs in career.career_skills],
        degrees=[DegreeResponse.model_validate(cd.degree) for cd in career.career_degrees],
        colleges=[CollegeResponse.model_validate(cc.college) for cc in career.career_colleges],
        exams=[EntranceExamResponse.model_validate(ce.exam) for ce in career.career_exams],
        scholarships=[ScholarshipResponse.model_validate(cs.scholarship) for cs in career.career_scholarships],
        resources=[ResourceResponse.model_validate(cr.resource) for cr in career.career_resources],
        created_at=career.created_at,
        updated_at=career.updated_at,
    )


async def update_career(
    db: AsyncSession, career_id: UUID, data: CareerUpdate
) -> CareerResponse:
    result = await db.execute(select(Career).where(Career.id == career_id))
    career = result.scalar_one_or_none()
    if not career:
        raise NotFoundException(detail="Career not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(career, field, value)
    await db.flush()
    return CareerResponse.model_validate(career)


async def delete_career(db: AsyncSession, career_id: UUID) -> None:
    result = await db.execute(select(Career).where(Career.id == career_id))
    career = result.scalar_one_or_none()
    if not career:
        raise NotFoundException(detail="Career not found")
    from sqlalchemy import delete as sa_delete
    for junction_model in [CareerSkill, CareerDegree, CareerCollege, CareerEntranceExam, CareerScholarship, CareerResource]:
        await db.execute(sa_delete(junction_model).where(junction_model.career_id == career_id))
    await db.delete(career)
    await db.flush()
