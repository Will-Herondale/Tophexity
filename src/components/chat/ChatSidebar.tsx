"use client";

import type { ChatSession } from "@/types/chat";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export default function ChatSidebar({ sessions, activeSessionId, onSelect, onCreate, onDelete }: ChatSidebarProps) {
  return (
    <div className="flex h-full flex-col border-r border-[rgba(30,79,163,0.15)] bg-[#0d214f]/20">
      <div className="border-b border-[rgba(30,79,163,0.15)] p-3">
        <button
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1E4FA3] px-3 py-2.5 text-sm font-medium text-white hover:bg-[#1E4FA3]/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-[#5a5a6a]" />
            <p className="mt-2 text-xs text-[#5a5a6a]">No conversations yet</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => onSelect(session.id)}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-colors ${
                  activeSessionId === session.id
                    ? "bg-[#1E4FA3]/15 text-[#f0f0f0] border border-[#1E4FA3]/30"
                    : "text-[#8a8a9a] hover:bg-[#0d214f]/40 hover:text-[#f0f0f0]"
                }`}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">{session.title || "New Chat"}</p>
                  <p className="text-[10px] text-[#5a5a6a]">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="hidden group-hover:block rounded p-1 text-[#5a5a6a] hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
