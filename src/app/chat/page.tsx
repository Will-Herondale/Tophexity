"use client";

import { useState, useEffect, useCallback } from "react";
import { getChatSessions, createChatSession, deleteChatSession } from "@/lib/api";
import type { ChatSession } from "@/types/chat";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import ChatStatsCard from "@/components/chat/ChatStatsCard";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await getChatSessions();
      setSessions(data.items || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
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
        {/* Stats in sidebar */}
        <div className="border-t border-[rgba(30,79,163,0.15)] p-2">
          <ChatStatsCard variant="sidebar" />
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        <ChatArea session={activeSession} />
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <Modal isOpen onClose={() => setDeleteConfirm(null)} title="Delete Conversation">
          <p className="text-sm text-[#8a8a9a]">Are you sure you want to delete this conversation? This cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSession}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
