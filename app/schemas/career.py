from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SkillCreate(BaseModel):
    name: str = Field(..., max_length=255)
    category: str | None = None


class SkillResponse(BaseModel):
    id: UUID
    name: str
    category: str | None = None

    model_config = {"from_attributes": True}


class CareerSkillCreate(BaseModel):
    name: str
    category: str | None = None
    level: str = "intermediate"
    is_required: bool = True


class DegreeCreate(BaseModel):
    name: str = Field(..., max_length=255)
    level: str = Field(..., max_length=100)
    field: str | None = None


class DegreeResponse(BaseModel):
    id: UUID
    name: str
    level: str
    field: str | None = None

    model_config = {"from_attributes": True}


class CareerDegreeCreate(BaseModel):
    name: str
    level: str
    field: str | None = None
    is_required: bool = False


class CollegeCreate(BaseModel):
    name: str = Field(..., max_length=500)
    location: str | None = None
    website: str | None = None
    ranking: int | None = None


class CollegeResponse(BaseModel):
    id: UUID
    name: str
    location: str | None = None
    website: str | None = None
    ranking: int | None = None

    model_config = {"from_attributes": True}


class CareerCollegeCreate(BaseModel):
    name: str
    location: str | None = None
    program_name: str | None = None


class EntranceExamCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: str | None = None
    website: str | None = None


class EntranceExamResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    website: str | None = None

    model_config = {"from_attributes": True}


class CareerExamCreate(BaseModel):
    name: str
    description: str | None = None
    is_required: bool = False


class ScholarshipCreate(BaseModel):
    name: str = Field(..., max_length=500)
    description: str | None = None
    amount: float | None = None
    eligibility: str | None = None
    deadline: str | None = None
    website: str | None = None


class ScholarshipResponse(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    amount: float | None = None
    eligibility: str | None = None
    deadline: str | None = None
    website: str | None = None

    model_config = {"from_attributes": True}


class CareerScholarshipCreate(BaseModel):
    name: str
    description: str | None = None
    amount: float | None = None


class ResourceCreate(BaseModel):
    title: str = Field(..., max_length=500)
    description: str | None = None
    url: str = Field(..., max_length=1024)
    resource_type: str = Field(..., max_length=100)


class ResourceResponse(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    url: str
    resource_type: str

    model_config = {"from_attributes": True}


class CareerResourceCreate(BaseModel):
    title: str
    url: str
    resource_type: str
    description: str | None = None


class CareerCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    average_salary: float | None = None
    growth_outlook: str | None = None
    demand_level: str | None = None
    required_education: dict | None = None
    typical_skills: dict | None = None
    skills: list[CareerSkillCreate] | None = None
    degrees: list[CareerDegreeCreate] | None = None
    colleges: list[CareerCollegeCreate] | None = None
    exams: list[CareerExamCreate] | None = None
    scholarships: list[CareerScholarshipCreate] | None = None
    resources: list[CareerResourceCreate] | None = None


class CareerUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    average_salary: float | None = None
    growth_outlook: str | None = None
    demand_level: str | None = None
    required_education: dict | None = None
    typical_skills: dict | None = None


class CareerResponse(BaseModel):
    id: UUID
    title: str
    description: str
    average_salary: float | None = None
    growth_outlook: str | None = None
    demand_level: str | None = None
    required_education: dict | None = None
    typical_skills: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CareerDetailResponse(BaseModel):
    id: UUID
    title: str
    description: str
    average_salary: float | None = None
    growth_outlook: str | None = None
    demand_level: str | None = None
    required_education: dict | None = None
    typical_skills: dict | None = None
    skills: list[SkillResponse] = []
    degrees: list[DegreeResponse] = []
    colleges: list[CollegeResponse] = []
    exams: list[EntranceExamResponse] = []
    scholarships: list[ScholarshipResponse] = []
    resources: list[ResourceResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CareerImportRequest(BaseModel):
    careers: list[CareerCreate]


class CareerImportResponse(BaseModel):
    imported: int
    skipped: int
    careers: list[CareerResponse]


class CareerListResponse(BaseModel):
    items: list[CareerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
