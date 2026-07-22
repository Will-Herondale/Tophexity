export interface Career {
  id: string;
  title: string;
  description: string;
  average_salary: number | null;
  growth_outlook: string | null;
  demand_level: string | null;
  required_education: Record<string, string> | null;
  typical_skills: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface CareerDetail extends Career {
  skills: CareerSkill[];
  degrees: CareerDegree[];
  colleges: CareerCollege[];
  exams: CareerExam[];
  scholarships: CareerScholarship[];
  resources: CareerResource[];
}

export interface CareerSkill {
  id: string;
  name: string;
  category: string | null;
}

export interface CareerDegree {
  id: string;
  name: string;
  level: string | null;
  field: string | null;
}

export interface CareerCollege {
  id: string;
  name: string;
  location: string | null;
  website: string | null;
  ranking: number | null;
}

export interface CareerExam {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
}

export interface CareerScholarship {
  id: string;
  name: string;
  description: string | null;
  amount: number | null;
}

export interface CareerResource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  resource_type: string | null;
}

export interface CareerListResponse {
  items: Career[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CareerSearchParams {
  search?: string;
  skill?: string;
  degree_level?: string;
  demand_level?: string;
  min_salary?: number;
  max_salary?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}
