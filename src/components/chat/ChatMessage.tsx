"use client";

import type { ChatMessage } from "@/types/chat";
import { Cpu, Clock } from "lucide-react";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-accent text-white"
            : "bg-surface/20 text-foreground"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <p className={`text-[10px] ${isUser ? "text-blue-200" : "text-text-muted"}`}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          {!isUser && message.model_used && (
            <span className="flex items-center gap-1 text-[10px] text-text-muted">
              <Cpu className="h-2.5 w-2.5" />
              {message.model_used}
            </span>
          )}
          {!isUser && message.latency_ms && (
            <span className="flex items-center gap-1 text-[10px] text-text-muted">
              <Clock className="h-2.5 w-2.5" />
              {(message.latency_ms / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
