import type { ChatRole } from "@/lib/constants";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  is_archived: boolean;
  is_pinned: boolean;
  session_data: Record<string, unknown>;
  summary: string | null;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  token_count: number | null;
  model_used: string | null;
  latency_ms: number | null;
  request_id: string | null;
  message_data: Record<string, unknown>;
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

export interface ChatSessionUpdatePayload {
  title?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface ChatStats {
  total_sessions: number;
  active_sessions: number;
  archived_sessions: number;
  total_messages: number;
  total_tokens_used: number;
  estimated_total_cost_usd: number;
  average_messages_per_session: number;
  first_conversation_at: string | null;
  last_conversation_at: string | null;
}

export interface ChatExportResponse {
  session: {
    id: string;
    title: string;
    created_at: string;
    message_count: number;
  };
  summary: string | null;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    model?: string;
    tokens?: number;
  }>;
}

export interface ChatRebuildMemoryResponse {
  session_id: string;
  summary: string;
  summary_message_count: number;
  facts_count: number;
  message: string;
}
