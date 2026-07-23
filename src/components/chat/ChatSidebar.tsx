"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatSession } from "@/types/chat";
import { updateChatSession } from "@/lib/api";
import { Plus, MessageSquare, Trash2, MoreHorizontal, Pin, PinOff, Archive, ArchiveRestore, Pencil, Search, X } from "lucide-react";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onSessionUpdated: (session: ChatSession) => void;
}

export default function ChatSidebar({ sessions, activeSessionId, onSelect, onCreate, onDelete, onSessionUpdated }: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = sessions
    .filter((s) => showArchived ? s.is_archived : !s.is_archived)
    .filter((s) => search === "" || (s.title || "New Chat").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });

  const handleTogglePin = async (session: ChatSession) => {
    setMenuOpen(null);
    const optimistic = { ...session, is_pinned: !session.is_pinned };
    onSessionUpdated(optimistic);
    try {
      await updateChatSession(session.id, { is_pinned: !session.is_pinned });
    } catch (err) {
      console.error("Failed to toggle pin:", err);
      onSessionUpdated(session);
    }
  };

  const handleToggleArchive = async (session: ChatSession) => {
    setMenuOpen(null);
    const optimistic = { ...session, is_archived: !session.is_archived };
    onSessionUpdated(optimistic);
    try {
      await updateChatSession(session.id, { is_archived: !session.is_archived });
    } catch (err) {
      console.error("Failed to toggle archive:", err);
      onSessionUpdated(session);
    }
  };

  const handleStartRename = (session: ChatSession) => {
    setRenamingId(session.id);
    setRenameValue(session.title || "");
    setMenuOpen(null);
  };

  const handleFinishRename = async (session: ChatSession) => {
    const newTitle = renameValue.trim();
    setRenamingId(null);
    if (newTitle && newTitle !== (session.title || "")) {
      const optimistic = { ...session, title: newTitle };
      onSessionUpdated(optimistic);
      try {
        await updateChatSession(session.id, { title: newTitle });
      } catch (err) {
        console.error("Failed to rename:", err);
        onSessionUpdated(session);
      }
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-border/50 bg-surface/10">
      {/* Header */}
      <div className="border-b border-border/50 p-3 space-y-2">
        <button
          onClick={onCreate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white hover:bg-accent-light transition-colors shadow-[0_0_15px_rgba(30,79,163,0.3)]"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full rounded-lg border border-border bg-background/50 py-1.5 pl-8 pr-7 text-xs text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Archive filter */}
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
            showArchived ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <Archive className="h-3 w-3" />
          {showArchived ? "Showing archived" : "Show archived"}
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-text-muted" />
            <p className="mt-2 text-xs text-text-muted">
              {search ? "No matching chats" : showArchived ? "No archived chats" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map((session) => (
              <div
                key={session.id}
                onClick={() => { if (renamingId !== session.id) onSelect(session.id); }}
                className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-colors ${
                  activeSessionId === session.id
                    ? "bg-accent/15 text-foreground border border-border-light"
                    : "text-text-secondary hover:bg-surface/40 hover:text-foreground"
                }`}
              >
                {session.is_pinned ? (
                  <Pin className="h-3.5 w-3.5 flex-shrink-0 text-accent" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {renamingId === session.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleFinishRename(session)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleFinishRename(session); if (e.key === "Escape") setRenamingId(null); }}
                      className="w-full bg-background/80 rounded px-1.5 py-0.5 text-xs text-foreground border border-accent/40 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="text-sm font-medium truncate">{session.title || "New Chat"}</p>
                  )}
                  <p className="text-[10px] text-text-muted">
                    {new Date(session.updated_at || session.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Three-dot menu */}
                <div className="relative" ref={menuOpen === session.id ? menuRef : undefined}>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === session.id ? null : session.id);
                    }}
                    className="rounded p-1 text-text-muted hover:bg-accent/10 hover:text-text-secondary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>

                  {menuOpen === session.id && (
                    <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border-light bg-surface/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] py-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartRename(session); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-accent/10 hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Rename
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTogglePin(session); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-accent/10 hover:text-foreground transition-colors"
                      >
                        {session.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        {session.is_pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleArchive(session); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-secondary hover:bg-accent/10 hover:text-foreground transition-colors"
                      >
                        {session.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                        {session.is_archived ? "Restore" : "Archive"}
                      </button>
                      <div className="my-1 h-px bg-[rgba(30,79,163,0.15)]" />
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(session.id); setMenuOpen(null); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
