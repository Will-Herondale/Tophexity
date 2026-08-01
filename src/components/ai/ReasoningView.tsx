"use client";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Check,
  GraduationCap,
  Landmark,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

interface ReasoningViewProps {
  text: string | null | undefined;
  className?: string;
}

function toList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function parseReasoning(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function Section({
  title,
  icon,
  items,
  chipClass,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
  chipClass: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {icon}
        {title}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <li key={i} className={`rounded-md px-2 py-0.5 text-xs ${chipClass}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReasoningView({ text, className }: ReasoningViewProps) {
  if (!text) return null;

  const parsed = parseReasoning(text);
  if (!parsed) {
    return <p className={`text-sm leading-relaxed text-text-secondary ${className ?? ""}`}>{text}</p>;
  }

  const mainText = toText(parsed.reasoning || parsed.why_recommended || parsed.difficulty);
  const confidence = toText(parsed.confidence);
  const difficulty = toText(parsed.difficulty);
  const probability =
    typeof parsed.probability_of_success === "number" ? parsed.probability_of_success : null;

  const strengths = toList(parsed.strengths);
  const weaknesses = toList(parsed.weaknesses);
  const missingSkills = toList(parsed.missing_skills);
  const degrees = toList(parsed.suggested_degrees);
  const colleges = toList(parsed.suggested_colleges);
  const certifications = toList(parsed.suggested_certifications);

  const tradeOffs = parsed.trade_offs as { gains?: unknown; loses?: unknown } | null | undefined;
  const gains = toList(tradeOffs?.gains);
  const loses = toList(tradeOffs?.loses);

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {mainText && <p className="text-sm leading-relaxed text-text-secondary">{mainText}</p>}

      {(confidence || difficulty || probability !== null) && (
        <div className="flex flex-wrap gap-1.5">
          {confidence && (
            <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent">
              Confidence: {confidence}
            </span>
          )}
          {difficulty && (
            <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent">
              Difficulty: {difficulty}
            </span>
          )}
          {probability !== null && (
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
              Success probability: {probability}%
            </span>
          )}
        </div>
      )}

      <Section title="Strengths" icon={<Check className="h-3 w-3 text-emerald-400" />} items={strengths} chipClass="bg-emerald-500/10 text-emerald-400" />
      <Section title="Weaknesses" icon={<AlertTriangle className="h-3 w-3 text-amber-400" />} items={weaknesses} chipClass="bg-amber-500/10 text-amber-400" />
      <Section title="Missing Skills" icon={<Sparkles className="h-3 w-3 text-red-400" />} items={missingSkills} chipClass="bg-red-500/10 text-red-400" />
      <Section title="Suggested Degrees" icon={<GraduationCap className="h-3 w-3 text-blue-400" />} items={degrees} chipClass="bg-blue-500/10 text-blue-400" />
      <Section title="Suggested Colleges" icon={<Landmark className="h-3 w-3 text-purple-400" />} items={colleges} chipClass="bg-purple-500/10 text-purple-400" />
      <Section title="Suggested Certifications" icon={<Award className="h-3 w-3 text-teal-400" />} items={certifications} chipClass="bg-teal-500/10 text-teal-400" />
      <Section title="What You Gain" icon={<ArrowUpRight className="h-3 w-3 text-emerald-400" />} items={gains} chipClass="bg-emerald-500/10 text-emerald-400" />
      <Section title="What You Lose" icon={<ArrowDownRight className="h-3 w-3 text-red-400" />} items={loses} chipClass="bg-red-500/10 text-red-400" />
    </div>
  );
}
