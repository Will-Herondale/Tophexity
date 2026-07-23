import type { TransitionDifficulty } from "@/lib/constants";

export interface BackupPlan {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  status: string;
  created_at: string;
  scenarios: BackupScenario[];
}

export interface BackupScenario {
  id: string;
  backup_plan_id: string;
  career_id: string;
  scenario_name: string;
  description: string | null;
  transition_difficulty: TransitionDifficulty | null;
  estimated_transition_months: number | null;
  reasoning: string | null;
  career?: {
    id: string;
    title: string;
    description: string;
    average_salary: number | null;
  };
}

export interface BackupPlanListResponse {
  items: BackupPlan[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BackupScenarioCreatePayload {
  career_id: string;
  scenario_name: string;
  description?: string;
  transition_difficulty?: TransitionDifficulty;
  estimated_transition_months?: number;
  reasoning?: string;
}

export interface BackupPlanCreatePayload {
  title?: string;
  description?: string;
  scenarios: BackupScenarioCreatePayload[];
}
