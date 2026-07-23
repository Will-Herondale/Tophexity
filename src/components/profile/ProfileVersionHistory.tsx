"use client";

import { useState, useEffect } from "react";
import { getProfileVersions } from "@/lib/api";
import type { ProfileVersion } from "@/types/profile";
import { ChevronDown, ChevronRight, Clock, ArrowLeftRight } from "lucide-react";

interface ProfileVersionHistoryProps {
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full Name",
  headline: "Headline",
  bio: "Bio",
  location: "Location",
  avatar_url: "Avatar URL",
  education_level: "Education",
  years_experience: "Experience (years)",
  current_field: "Current Field",
  target_fields: "Target Fields",
  skills: "Skills",
  interests: "Interests",
};

export default function ProfileVersionHistory({ onClose }: ProfileVersionHistoryProps) {
  const [versions, setVersions] = useState<ProfileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getProfileVersions()
      .then((data) => { if (!cancelled) setVersions(data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getChangedFields = (current: ProfileVersion, previous: ProfileVersion | null): Set<string> => {
    if (!previous) return new Set(Object.keys(current.snapshot || {}));
    const changed = new Set<string>();
    const currSnap = current.snapshot || {};
    const prevSnap = previous.snapshot || {};
    for (const key of Object.keys(currSnap)) {
      if (JSON.stringify(currSnap[key]) !== JSON.stringify(prevSnap[key])) {
        changed.add(key);
      }
    }
    return changed;
  };

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
    if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length > 0 ? JSON.stringify(value) : "—";
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#1E4FA3]/30 border-t-[#1E4FA3]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold font-[family-name:var(--font-display)] text-[#f0f0f0] flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#1E4FA3]" />
          Profile History ({versions.length} versions)
        </h3>
        <button onClick={onClose} className="text-xs text-[#5a5a6a] hover:text-[#8a8a9a]">Close</button>
      </div>

      {versions.length === 0 ? (
        <p className="text-xs text-[#5a5a6a] text-center py-8">No version history yet.</p>
      ) : (
        <div className="relative space-y-3">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-4 bottom-4 w-px bg-[rgba(30,79,163,0.2)]" />

          {[...versions].reverse().map((version, idx) => {
            const prevVersion = idx < versions.length - 1 ? versions[versions.length - 1 - idx - 1] : null;
            const changedFields = getChangedFields(version, prevVersion);
            const isExpanded = expanded.has(version.id);

            return (
              <div key={version.id} className="relative pl-8">
                {/* Timeline dot */}
                <div className={`absolute left-0 top-2 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center z-10 ${
                  idx === 0
                    ? "bg-[#1E4FA3] border-[#1E4FA3]"
                    : "bg-[#0a0a0f] border-[rgba(30,79,163,0.3)]"
                }`}>
                  <span className="text-[8px] font-bold text-white">{version.version_number}</span>
                </div>

                <div
                  className={`rounded-xl border transition-all cursor-pointer ${
                    isExpanded
                      ? "border-[rgba(30,79,163,0.3)] bg-[#0d214f]/20"
                      : "border-[rgba(30,79,163,0.1)] bg-[#0d214f]/10 hover:bg-[#0d214f]/20"
                  }`}
                  onClick={() => toggleExpand(version.id)}
                >
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[#8a8a9a]" /> : <ChevronRight className="h-3.5 w-3.5 text-[#8a8a9a]" />}
                      <div>
                        <p className="text-xs font-medium text-[#f0f0f0]">Version {version.version_number}</p>
                        <p className="text-[10px] text-[#5a5a6a]">
                          {changedFields.size} field{changedFields.size !== 1 ? "s" : ""} changed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {idx > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-[#1E4FA3]">
                          <ArrowLeftRight className="h-2.5 w-2.5" />
                          {changedFields.size} diff
                        </span>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[rgba(30,79,163,0.1)] px-4 py-3 space-y-2">
                      {Object.entries(version.snapshot || {}).map(([key, value]) => {
                        const isChanged = changedFields.has(key);
                        const prevValue = prevVersion?.snapshot?.[key];
                        return (
                          <div key={key} className={`rounded-lg px-3 py-2 text-xs ${isChanged ? "bg-[#1E4FA3]/10 border border-[#1E4FA3]/20" : "bg-[#0a0a0f]/30"}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[#8a8a9a] font-medium">{FIELD_LABELS[key] || key}</span>
                              {isChanged && <span className="text-[9px] text-[#1E4FA3]">changed</span>}
                            </div>
                            <p className="text-[#f0f0f0] mt-0.5">{renderValue(value)}</p>
                            {isChanged && prevValue !== undefined && (
                              <p className="text-[10px] text-[#5a5a6a] mt-1 line-through">
                                was: {renderValue(prevValue)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
