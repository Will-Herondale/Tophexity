export interface GenerationStatus {
  has_profile: boolean;
  has_recommendations: boolean;
  has_roadmaps: boolean;
  has_backup_plans: boolean;
  has_portfolio_items: boolean;
  has_chat_sessions: boolean;
  recommendation_count: number;
  roadmap_count: number;
  backup_plan_count: number;
  portfolio_item_count: number;
  chat_session_count: number;
}

export interface DbColumnInfo {
  name: string;
  type: string;
}

export interface DbTableInfo {
  table: string;
  rows: number;
  columns: DbColumnInfo[];
  sample: Record<string, unknown>[];
}

export interface DbOverview {
  database: string;
  generated_at: string;
  total_tables: number;
  tables: DbTableInfo[];
}
