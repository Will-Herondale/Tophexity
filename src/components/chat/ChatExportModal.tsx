"use client";

import { useState } from "react";
import { exportChatSession } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Download, Copy, Check, Loader2, FileText, FileCode, File } from "lucide-react";

interface ChatExportModalProps {
  sessionId: string;
  sessionTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = "json" | "markdown" | "text";

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: typeof FileText; ext: string }[] = [
  { value: "json", label: "JSON", icon: FileCode, ext: "json" },
  { value: "markdown", label: "Markdown", icon: FileText, ext: "md" },
  { value: "text", label: "Plain Text", icon: File, ext: "txt" },
];

export default function ChatExportModal({ sessionId, sessionTitle, isOpen, onClose }: ChatExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await exportChatSession(sessionId, format);
      let content: string;
      if (format === "json") {
        content = JSON.stringify(data, null, 2);
      } else if (format === "markdown") {
        const lines: string[] = [`# ${data.session.title || "Chat Export"}\n`];
        if (data.summary) lines.push(`**Summary:** ${data.summary}\n`);
        lines.push("---\n");
        for (const msg of data.messages) {
          const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
          const time = new Date(msg.timestamp).toLocaleString();
          lines.push(`### ${role} — ${time}\n`);
          lines.push(`${msg.content}\n`);
          if (msg.model) lines.push(`*Model: ${msg.model} | Tokens: ${msg.tokens || "N/A"}*\n`);
        }
        content = lines.join("\n");
      } else {
        const lines: string[] = [`${data.session.title || "Chat Export"}`, `Date: ${data.session.created_at}`, ""];
        if (data.summary) lines.push(`Summary: ${data.summary}`, "");
        for (const msg of data.messages) {
          const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
          lines.push(`[${role}] ${msg.timestamp}`);
          lines.push(msg.content);
          lines.push("");
        }
        content = lines.join("\n");
      }
      setExported(content);
    } catch {
      setExported("Failed to export chat.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!exported) return;
    const opt = FORMAT_OPTIONS.find((f) => f.value === format)!;
    const blob = new Blob([exported], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sessionTitle.replace(/[^a-zA-Z0-9]/g, "_") || "chat"}.${opt.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!exported) return;
    await navigator.clipboard.writeText(exported);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Chat">
      <div className="space-y-4">
        {/* Format selector */}
        <div>
          <p className="text-xs text-text-secondary mb-2">Format</p>
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setFormat(opt.value); setExported(null); }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  format === opt.value
                    ? "bg-accent/20 text-accent border border-border-light"
                    : "text-text-secondary border border-border hover:border-border-light"
                }`}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export button or content */}
        {!exported ? (
          <Button onClick={handleExport} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Generate Export
          </Button>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-background/50 p-3 max-h-60 overflow-y-auto">
              <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono">{exported}</pre>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCopy} variant="outline" className="flex-1">
                {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
