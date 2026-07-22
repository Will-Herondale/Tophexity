import type { ChatRole } from "@/lib/constants";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface ChatSessionListResponse {
  items: ChatSession[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ChatMessageCreatePayload {
  role: ChatRole;
  content: string;
}
