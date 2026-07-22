export interface Roadmap {
  id: string;
  user_id: string;
  career_id: string;
  title: string | null;
  description: string | null;
  estimated_duration_months: number | null;
  status: string;
  created_at: string;
  steps: RoadmapStep[];
}

export interface RoadmapStep {
  id: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  step_order: number;
  duration_months: number | null;
  resources: Record<string, unknown> | null;
}

export interface RoadmapListResponse {
  items: Roadmap[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RoadmapStepCreatePayload {
  title: string;
  description?: string;
  step_order: number;
  duration_months?: number;
  resources?: Record<string, unknown>;
}

export interface RoadmapCreatePayload {
  career_id: string;
  title?: string;
  description?: string;
  estimated_duration_months?: number;
  steps: RoadmapStepCreatePayload[];
}
