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
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors dark:bg-indigo-900/50 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
            >
              {name}
              <span className="text-[10px] text-indigo-400 dark:text-indigo-500 capitalize">{level}</span>
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
                className="ml-0.5 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-200 hover:text-indigo-700 dark:text-indigo-500 dark:hover:bg-indigo-800 dark:hover:text-indigo-300"
              >
                <X className="h-3 w-3" />
              </span>
            </button>
            {editingSkill === name && (
              <div className="absolute top-full left-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                  {name} — <span className="capitalize">{level}</span>
                </p>
                <select
                  value={level}
                  onChange={(e) => updateLevel(name, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
          {input && suggestions.length > 0 && (
            <div className="absolute top-full left-0 z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {suggestions.slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
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
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Quick Add <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {showPresets && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          {Object.entries(SKILL_PRESETS).map(([category, skills]) => (
            <div key={category} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">{category}</p>
              <div className="flex flex-wrap gap-1.5">
                {skills
                  .filter((s) => !value[s])
                  .map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300"
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
