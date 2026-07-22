import type { PortfolioItemType } from "@/lib/constants";

export interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  url: string | null;
  item_type: PortfolioItemType;
  skills_used: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemCreatePayload {
  title: string;
  description?: string | null;
  url?: string | null;
  item_type: PortfolioItemType;
  skills_used?: Record<string, string> | null;
}

export interface PortfolioItemUpdatePayload {
  title?: string;
  description?: string | null;
  url?: string | null;
  skills_used?: Record<string, string> | null;
}

export interface PortfolioListResponse {
  items: PortfolioItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
