"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { ChatSession, ChatMessage } from "@/types/chat";
import { getChatSession, sendChatMessages, rebuildChatMemory, exportChatSession } from "@/lib/api";
import ChatMessageBubble from "./ChatMessage";
import ChatExportModal from "./ChatExportModal";
import GenerationProgress from "@/components/ui/GenerationProgress";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import { Send, Loader2, Brain, Download, CheckCircle, RotateCcw, Clock } from "lucide-react";

interface ChatAreaProps {
  session: ChatSession | null;
  initialMessage?: string;
}

const THINKING_TIPS = [
  "Analyzing your question...",
  "Searching career databases...",
  "Processing your request...",
  "Connecting the dots...",
  "This may take a moment for detailed prompts...",
];

export default function ChatArea({ session, initialMessage }: ChatAreaProps) {
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const initialMessageApplied = useRef(false);
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [thinkingTip, setThinkingTip] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryContent, setRetryContent] = useState<string | null>(null);
  const [progressToken, setProgressToken] = useState<string | null>(null);
  const { progress, elapsedSeconds: progressElapsed } = useGenerationProgress(progressToken);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentContent = useRef<string>("");

  const messages = useMemo(() => session ? (allMessages[session.id] || []) : [], [session, allMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setLoadingSession(true); });
    getChatSession(session.id)
      .then((data) => {
        if (!cancelled && data.messages) {
          setAllMessages((prev) => ({ ...prev, [session.id]: data.messages! }));
        }
      })
      .catch(() => { if (!cancelled) setLastError("Failed to load chat session"); })
      .finally(() => { if (!cancelled) setLoadingSession(false); });
    return () => { cancelled = true; };
  }, [session?.id]);

  useEffect(() => {
    if (initialMessage && !initialMessageApplied.current) {
      setInput(initialMessage);
      initialMessageApplied.current = true;
    }
  }, [initialMessage]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedSeconds(0);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleSend = useCallback(async (overrideContent?: string) => {
    if (!session) return;
    const content = overrideContent || input.trim();
    if (!content || sending) return;
    setInput("");
    setLastError(null);
    setRetryContent(null);

    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: session.id,
      role: "user",
      content,
      token_count: null,
      model_used: null,
      latency_ms: null,
      request_id: null,
      message_data: {},
      created_at: new Date().toISOString(),
    };
    setAllMessages((prev) => ({ ...prev, [session.id]: [...(prev[session.id] || []), userMsg] }));
    setSending(true);
    setElapsedSeconds(0);
    setThinkingTip(0);

    // Start elapsed timer
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      setThinkingTip((prev) => (prev + 1) % THINKING_TIPS.length);
    }, 3000);

    lastSentContent.current = content;
    const token = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `pg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setProgressToken(token);
    try {
      const response = await sendChatMessages(session.id, [{ role: "user", content }], token);
      if (Array.isArray(response)) {
        setAllMessages((prev) => {
          const current = prev[session.id] || [];
          const withoutTemp = current.filter((m) => m.id !== userMsg.id);
          return { ...prev, [session.id]: [...withoutTemp, ...response] };
        });
      }
      setLastError(null);
      setRetryContent(null);
    } catch (err: unknown) {
      setAllMessages((prev) => {
        const current = prev[session.id] || [];
        return { ...prev, [session.id]: [...current.filter((m) => m.id !== userMsg.id)] };
      });
      const axiosErr = err as { code?: string; response?: { status?: number } };
      const isTimeout = axiosErr.code === "ECONNABORTED" || axiosErr.code === "ERR_NETWORK";
      const errorMsg = isTimeout
        ? "The AI is taking longer than expected. Try a shorter prompt or try again."
        : "Failed to send message. Please try again.";
      setLastError(errorMsg);
      setRetryContent(content);
    } finally {
      stopTimer();
      setSending(false);
      setProgressToken(null);
    }
  }, [session, input, sending, stopTimer]);

  const handleRetry = () => {
    if (retryContent) {
      handleSend(retryContent);
    }
  };

  const handleRebuildMemory = async () => {
    if (!session) return;
    setRebuilding(true);
    setRebuildMsg(null);
    try {
      const result = await rebuildChatMemory(session.id);
      setRebuildMsg(result.message);
    } catch {
      setRebuildMsg("Failed to rebuild memory.");
    } finally {
      setRebuilding(false);
      setTimeout(() => setRebuildMsg(null), 3000);
    }
  };

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold font-[family-name:var(--font-display)] text-foreground">Career Guidance Chat</p>
          <p className="mt-1 text-sm text-text-secondary">Select a conversation or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-medium font-[family-name:var(--font-display)] truncate">{session.title || "New Chat"}</p>
          {session.is_pinned && <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">Pinned</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {rebuildMsg && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" />{rebuildMsg}</span>
          )}
          <button
            onClick={handleRebuildMemory}
            disabled={rebuilding}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-text-secondary hover:bg-surface/40 hover:text-foreground transition-colors disabled:opacity-50"
            title="Rebuild memory"
          >
            {rebuilding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
            Memory
          </button>
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] text-text-secondary hover:bg-surface/40 hover:text-foreground transition-colors"
            title="Export chat"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingSession ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => <ChatMessageBubble key={msg.id} message={msg} />)
        )}

        {/* Thinking indicator with timer */}
        {sending && (
          <div className="flex justify-start">
            <div className="w-full max-w-[80%] rounded-2xl px-4 py-3 bg-surface/20 sm:w-[440px]">
              {progress ? (
                <GenerationProgress
                  compact
                  percent={progress.percent}
                  phase={progress.phase}
                  message={progress.message}
                  elapsedSeconds={progressElapsed}
                />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    {elapsedSeconds > 5 && (
                      <div className="flex items-center gap-1 text-[10px] text-text-muted">
                        <Clock className="h-3 w-3" />
                        <span>{elapsedSeconds}s</span>
                      </div>
                    )}
                  </div>
                  {elapsedSeconds > 10 && (
                    <p className="text-[10px] text-text-muted mt-1.5">{THINKING_TIPS[thinkingTip]}</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Error with retry */}
        {lastError && !sending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{lastError}</p>
              {retryContent && (
                <button
                  onClick={handleRetry}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-light transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-4">
        <div className="flex gap-2 items-end">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={sending ? "Waiting for response..." : "Ask about careers..."}
            disabled={sending}
            className="flex-1 rounded-2xl bg-surface/30 px-4 py-3 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {exportOpen && (
        <ChatExportModal
          sessionId={session.id}
          sessionTitle={session.title || "New Chat"}
          isOpen={exportOpen}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
