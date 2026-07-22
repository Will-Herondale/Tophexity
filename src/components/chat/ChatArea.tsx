"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import type { ChatSession, ChatMessage } from "@/types/chat";
import { getChatSession, sendChatMessages } from "@/lib/api";
import ChatMessageBubble from "./ChatMessage";
import { Send, Loader2 } from "lucide-react";

interface ChatAreaProps {
  session: ChatSession | null;
}

export default function ChatArea({ session }: ChatAreaProps) {
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => session ? (allMessages[session.id] || []) : [], [session, allMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    getChatSession(session.id)
      .then((data) => {
        if (!cancelled && data.messages) {
          setAllMessages((prev) => ({ ...prev, [session.id]: data.messages! }));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingSession(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const handleSend = async () => {
    if (!session || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: session.id,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setAllMessages((prev) => ({ ...prev, [session.id]: [...(prev[session.id] || []), userMsg] }));
    setSending(true);
    try {
      const response = await sendChatMessages(session.id, [{ role: "user", content }]);
      if (Array.isArray(response)) {
        setAllMessages((prev) => {
          const current = prev[session.id] || [];
          const withoutTemp = current.filter((m) => m.id !== userMsg.id);
          return { ...prev, [session.id]: [...withoutTemp, ...response] };
        });
      }
    } catch {
      setAllMessages((prev) => {
        const current = prev[session.id] || [];
        return { ...prev, [session.id]: [...current.filter((m) => m.id !== userMsg.id)] };
      });
      setAllMessages((prev) => ({
        ...prev,
        [session.id]: [
          ...(prev[session.id] || []),
          { id: `error-${Date.now()}`, session_id: session.id, role: "assistant", content: "Failed to send message. Please try again.", created_at: new Date().toISOString() },
        ],
      }));
    } finally {
      setSending(false);
    }
  };

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <p className="text-lg font-semibold font-[family-name:var(--font-display)] text-[#f0f0f0]">Career Guidance Chat</p>
          <p className="mt-1 text-sm text-[#8a8a9a]">Select a conversation or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0a0f]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingSession ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#1E4FA3]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-[#5a5a6a]">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[rgba(30,79,163,0.15)] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about careers..."
            disabled={sending}
            className="flex-1 rounded-lg border border-[rgba(30,79,163,0.15)] bg-[#0d214f]/30 px-4 py-2.5 text-sm text-[#f0f0f0] placeholder:text-[#5a5a6a] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="rounded-lg bg-[#1E4FA3] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1E4FA3]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
