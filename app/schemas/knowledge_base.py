from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class KBSkillResponse(BaseModel):
    id: UUID
    name: str
    category: str | None = None
    career_count: int = 0

    model_config = {"from_attributes": True}


class KBDegreeResponse(BaseModel):
    id: UUID
    name: str
    level: str
    field: str | None = None
    career_count: int = 0

    model_config = {"from_attributes": True}


class KBCollegeResponse(BaseModel):
    id: UUID
    name: str
    location: str | None = None
    website: str | None = None
    ranking: int | None = None
    career_count: int = 0

    model_config = {"from_attributes": True}


class KBExamResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    website: str | None = None
    career_count: int = 0

    model_config = {"from_attributes": True}


class KBScholarshipResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    amount: float | None = None
    eligibility: str | None = None
    deadline: str | None = None
    website: str | None = None
    career_count: int = 0

    model_config = {"from_attributes": True}


class CareerSkillDetail(BaseModel):
    name: str
    category: str | None = None
    level: str = "intermediate"
    is_required: bool = True


class CareerDegreeDetail(BaseModel):
    name: str
    level: str
    field: str | None = None
    is_required: bool = False


class CareerCollegeDetail(BaseModel):
    name: str
    location: str | None = None
    program_name: str | None = None


class CareerExamDetail(BaseModel):
    name: str
    description: str | None = None
    is_required: bool = False


class CareerScholarshipDetail(BaseModel):
    name: str
    description: str | None = None
    amount: float | None = None


class KBCareerDetail(BaseModel):
    id: UUID
    title: str
    description: str
    average_salary: float | None = None
    growth_outlook: str | None = None
    demand_level: str | None = None
    category: str | None = None
    industry: str | None = None
    work_environment: str | None = None
    weekly_hours: str | None = None
    travel_requirement: str | None = None
    stress_level: str | None = None
    work_life_balance: str | None = None
    automation_risk: str | None = None
    salary_currency: str | None = None
    entry_level_salary: float | None = None
    mid_level_salary: float | None = None
    senior_level_salary: float | None = None
    highest_salary: float | None = None
    required_education: dict | None = None
    typical_skills: dict | None = None
    skills: list[CareerSkillDetail] = []
    degrees: list[CareerDegreeDetail] = []
    colleges: list[CareerCollegeDetail] = []
    exams: list[CareerExamDetail] = []
    scholarships: list[CareerScholarshipDetail] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KBCareerListItem(BaseModel):
    id: UUID
    title: str
    description: str
    average_salary: float | None = None
    growth_outlook: str | None = None
    demand_level: str | None = None
    category: str | None = None
    industry: str | None = None
    salary_currency: str | None = None
    entry_level_salary: float | None = None
    mid_level_salary: float | None = None
    senior_level_salary: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KBCareerListResponse(BaseModel):
    items: list[KBCareerListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class KBSkillListResponse(BaseModel):
    items: list[KBSkillResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class KBDegreeListResponse(BaseModel):
    items: list[KBDegreeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class KBCollegeListResponse(BaseModel):
    items: list[KBCollegeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class KBExamListResponse(BaseModel):
    items: list[KBExamResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class KBScholarshipListResponse(BaseModel):
    items: list[KBScholarshipResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class KBStatsResponse(BaseModel):
    total_careers: int
    total_skills: int
    total_degrees: int
    total_colleges: int
    total_exams: int
    total_scholarships: int
    categories: list[str]
    industries: list[str]
