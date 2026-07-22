export interface Recommendation {
  id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  status: string;
  created_at: string;
  items: RecommendationItem[];
}

export interface RecommendationItem {
  id: string;
  recommendation_id: string;
  career_id: string;
  match_score: number;
  reasoning: string | null;
  rank: number;
  career?: {
    id: string;
    title: string;
    description: string;
    average_salary: number | null;
    demand_level: string | null;
  };
}

export interface RecommendationListResponse {
  items: Recommendation[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RecommendationItemCreatePayload {
  career_id: string;
  match_score: number;
  reasoning?: string;
  rank: number;
}

export interface RecommendationCreatePayload {
  title?: string;
  summary?: string;
  items: RecommendationItemCreatePayload[];
}
