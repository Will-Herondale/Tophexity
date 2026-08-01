"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getChatSessions, createChatSession, deleteChatSession, getCareerById } from "@/lib/api";
import type { ChatSession } from "@/types/chat";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import ChatStatsCard from "@/components/chat/ChatStatsCard";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { usePageTitle } from "@/hooks/usePageTitle";

function buildCareerContext(title: string, description: string | null, salary: number | null, demand: string | null, skills: Record<string, string> | null): string {
  const lines = [`I want to learn about the "${title}" career path.`];
  if (description) lines.push(`Description: ${description}`);
  if (salary) lines.push(`Average salary: $${(salary / 1000).toFixed(0)}k`);
  if (demand) lines.push(`Demand level: ${demand.replace("_", " ")}`);
  if (skills && Object.keys(skills).length > 0) lines.push(`Key skills: ${Object.keys(skills).join(", ")}`);
  lines.push("");
  lines.push("Can you help me understand this career path? Tell me about the day-to-day work, growth opportunities, and whether it might be a good fit for me based on my profile.");
  return lines.join("\n");
}

function buildCompareContext(careers: { title: string; description: string | null; salary: number | null }[]): string {
  const lines = ["I want to compare the following career paths:"];
  lines.push("");
  careers.forEach((c, i) => {
    lines.push(`${i + 1}. ${c.title}${c.salary ? ` ($${(c.salary / 1000).toFixed(0)}k avg)` : ""}`);
    if (c.description) lines.push(`   ${c.description}`);
  });
  lines.push("");
  lines.push("Which of these would be the best fit for me? Give me a detailed comparison of pros, cons, salary potential, job market, and your recommendation based on my profile.");
  return lines.join("\n");
}

function ChatContent() {
  usePageTitle("Chat");
  const searchParams = useSearchParams();
  const careerParam = searchParams.get("career");
  const compareParam = searchParams.get("compare");
  const recommendParam = searchParams.get("recommend");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [prefillLoading, setPrefillLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getChatSessions()
      .then((data) => { if (!cancelled) setSessions(data.items || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!careerParam && !compareParam && !recommendParam) return;
    if (activeSessionId) return;

    let cancelled = false;

    const setup = async () => {
      setPrefillLoading(true);
      try {
        let contextMessage = "";

        if (careerParam) {
          const career = await getCareerById(careerParam);
          contextMessage = buildCareerContext(career.title, career.description, career.average_salary, career.demand_level, career.typical_skills);
          const session = await createChatSession(`Career: ${career.title}`);
          if (!cancelled) {
            setSessions((prev) => [session, ...prev]);
            setActiveSessionId(session.id);
            setInitialMessage(contextMessage);
          }
        } else if (compareParam) {
          const ids = compareParam.split(",");
          const careers = await Promise.all(ids.map((id) => getCareerById(id.trim())));
          contextMessage = buildCompareContext(careers.map((c) => ({ title: c.title, description: c.description, salary: c.average_salary })));
          const titles = careers.map((c) => c.title).join(" vs ");
          const session = await createChatSession(`Compare: ${titles}`);
          if (!cancelled) {
            setSessions((prev) => [session, ...prev]);
            setActiveSessionId(session.id);
            setInitialMessage(contextMessage);
          }
        } else if (recommendParam) {
          contextMessage = "Based on my profile, please generate personalized career recommendations. Analyze my skills, experience, education, interests, and target fields. For each recommendation, provide: the career title, why it's a good match (with a match score out of 100), and detailed reasoning. Rank them from best to least good fit.";
          const session = await createChatSession("Career Recommendations");
          if (!cancelled) {
            setSessions((prev) => [session, ...prev]);
            setActiveSessionId(session.id);
            setInitialMessage(contextMessage);
          }
        }
      } catch {} finally {
        if (!cancelled) setPrefillLoading(false);
      }
    };

    setup();
    return () => { cancelled = true; };
  }, [careerParam, compareParam, recommendParam, activeSessionId]);

  const handleCreateSession = async () => {
    try {
      const session = await createChatSession("Career Discussion");
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);
    } catch {}
  };

  const handleDeleteSession = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteChatSession(deleteConfirm);
      setSessions((prev) => prev.filter((s) => s.id !== deleteConfirm));
      if (activeSessionId === deleteConfirm) setActiveSessionId(null);
    } catch {} finally {
      setDeleteConfirm(null);
    }
  };

  const handleSessionUpdated = (updated: ChatSession) => {
    setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="flex h-full">
      <div className="w-72 flex-shrink-0 flex flex-col">
        <div className="flex-1 overflow-hidden">
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={setActiveSessionId}
            onCreate={handleCreateSession}
            onDelete={setDeleteConfirm}
            onSessionUpdated={handleSessionUpdated}
          />
        </div>
        <div className="border-t border-border p-2">
          <ChatStatsCard variant="sidebar" />
        </div>
      </div>

      <div className="flex-1">
        {prefillLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
              <p className="text-sm text-text-secondary">Setting up your conversation...</p>
            </div>
          </div>
        ) : (
          <ChatArea session={activeSession} initialMessage={initialMessage} />
        )}
      </div>

      {deleteConfirm && (
        <Modal isOpen onClose={() => setDeleteConfirm(null)} title="Delete Conversation">
          <p className="text-sm text-text-secondary">Are you sure you want to delete this conversation? This cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSession}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
