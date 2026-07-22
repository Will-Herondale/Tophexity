"use client";

import { useState, useEffect } from "react";
import { getChatSessions, createChatSession, deleteChatSession } from "@/lib/api";
import type { ChatSession } from "@/types/chat";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatArea from "@/components/chat/ChatArea";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getChatSessions()
      .then((data) => { if (!cancelled) setSessions(data.items || []); })
      .catch(() => {})
      .finally(() => {});
    return () => { cancelled = true; };
  }, []);

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

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-72 flex-shrink-0">
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActiveSessionId}
          onCreate={handleCreateSession}
          onDelete={setDeleteConfirm}
        />
      </div>
      <div className="flex-1">
        <ChatArea session={activeSession} />
      </div>

      {deleteConfirm && (
        <Modal isOpen onClose={() => setDeleteConfirm(null)} title="Delete Conversation">
          <p className="text-sm text-gray-600 dark:text-gray-300">Are you sure you want to delete this conversation?</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSession}>Delete</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
