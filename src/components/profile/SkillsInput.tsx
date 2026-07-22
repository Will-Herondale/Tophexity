"use client";

import { useState, useRef, useCallback } from "react";
import { SKILL_PRESETS, SKILL_LEVELS, DEFAULT_SKILL_LEVEL } from "@/lib/constants";
import type { SkillLevel } from "@/lib/constants";
import { X, Plus, ChevronDown } from "lucide-react";

interface SkillsInputProps {
  value: Record<string, string>;
  onChange: (skills: Record<string, string>) => void;
}

export default function SkillsInput({ value, onChange }: SkillsInputProps) {
  const [input, setInput] = useState("");
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = Object.values(SKILL_PRESETS)
    .flat()
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !value[s]);

  const addSkill = useCallback(
    (name: string, level: SkillLevel = DEFAULT_SKILL_LEVEL) => {
      if (!name.trim()) return;
      onChange({ ...value, [name.trim()]: level });
      setInput("");
      inputRef.current?.focus();
    },
    [value, onChange]
  );

  const removeSkill = useCallback(
    (name: string) => {
      const next = { ...value };
      delete next[name];
      onChange(next);
    },
    [value, onChange]
  );

  const updateLevel = useCallback(
    (name: string, level: string) => {
      onChange({ ...value, [name]: level });
    },
    [value, onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {Object.entries(value).map(([name, level]) => (
          <div key={name} className="group relative">
            <button
              type="button"
              onClick={() => setEditingSkill(editingSkill === name ? null : name)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4FA3]/15 px-3 py-1.5 text-xs font-medium text-[#1E4FA3] transition-colors hover:bg-[#1E4FA3]/25"
            >
              {name}
              <span className="text-[10px] capitalize text-[#1E4FA3]/60">{level}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  removeSkill(name);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    removeSkill(name);
                  }
                }}
                className="ml-0.5 rounded-full p-0.5 text-[#1E4FA3]/60 hover:bg-[#1E4FA3]/20 hover:text-[#1E4FA3]"
              >
                <X className="h-3 w-3" />
              </span>
            </button>
            {editingSkill === name && (
              <div className="absolute top-full left-0 z-10 mt-1 rounded-lg border border-[#1E4FA3]/15 bg-[#0d214f] p-3 shadow-lg shadow-black/30">
                <p className="mb-2 text-xs font-medium text-[#8a8a9a]">
                  {name} — <span className="capitalize text-[#f0f0f0]">{level}</span>
                </p>
                <select
                  value={level}
                  onChange={(e) => updateLevel(name, e.target.value)}
                  className="w-full rounded-lg border border-[#1E4FA3]/15 bg-[#0a0a0f]/60 px-2 py-1.5 text-xs text-[#f0f0f0] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
                >
                  {SKILL_LEVELS.map((sl) => (
                    <option key={sl.value} value={sl.value}>
                      {sl.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                e.preventDefault();
                addSkill(input);
              }
            }}
            placeholder="Type a skill name..."
            className="w-full rounded-lg border border-[#1E4FA3]/15 bg-[#0d214f]/30 px-3 py-2 text-sm text-[#f0f0f0] placeholder:text-[#5a5a6a] focus:border-[#1E4FA3] focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
          />
          {input && suggestions.length > 0 && (
            <div className="absolute top-full left-0 z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-[#1E4FA3]/15 bg-[#0d214f] shadow-lg shadow-black/30">
              {suggestions.slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="block w-full px-3 py-2 text-left text-sm text-[#f0f0f0] hover:bg-[#1E4FA3]/15"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => input.trim() && addSkill(input)}
          className="rounded-lg bg-[#1E4FA3] px-3 py-2 text-sm font-medium text-white hover:bg-[#1E4FA3]/80"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-1 rounded-lg border border-[#1E4FA3]/15 px-3 py-2 text-sm text-[#8a8a9a] hover:bg-[#0d214f]/30 hover:text-[#f0f0f0]"
        >
          Quick Add <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {showPresets && (
        <div className="rounded-lg border border-[#1E4FA3]/15 bg-[#0d214f]/30 p-3">
          {Object.entries(SKILL_PRESETS).map(([category, skills]) => (
            <div key={category} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-xs font-semibold text-[#5a5a6a]">{category}</p>
              <div className="flex flex-wrap gap-1.5">
                {skills
                  .filter((s) => !value[s])
                  .map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="rounded-full border border-[#1E4FA3]/15 bg-[#0a0a0f]/40 px-2.5 py-1 text-xs text-[#8a8a9a] transition-colors hover:border-[#1E4FA3]/40 hover:bg-[#1E4FA3]/15 hover:text-[#1E4FA3]"
                    >
                      + {skill}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
