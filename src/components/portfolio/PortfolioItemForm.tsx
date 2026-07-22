"use client";

import { useState, type FormEvent } from "react";
import type { PortfolioItem, PortfolioItemCreatePayload } from "@/types/portfolio";
import type { PortfolioItemType } from "@/lib/constants";
import { PORTFOLIO_ITEM_TYPES, SKILL_PRESETS, DEFAULT_SKILL_LEVEL } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface PortfolioItemFormProps {
  item?: PortfolioItem;
  onSave: (payload: PortfolioItemCreatePayload) => Promise<void>;
  onClose: () => void;
}

export default function PortfolioItemForm({ item, onSave, onClose }: PortfolioItemFormProps) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [url, setUrl] = useState(item?.url || "");
  const [itemType, setItemType] = useState<PortfolioItemType>(item?.item_type || "project");
  const [skills, setSkills] = useState<Record<string, string>>(item?.skills_used || {});
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  const allSkills = Object.values(SKILL_PRESETS).flat();
  const suggestions = allSkills.filter(
    (s) => s.toLowerCase().includes(skillInput.toLowerCase()) && !skills[s]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        url: url.trim() || null,
        item_type: itemType,
        skills_used: Object.keys(skills).length > 0 ? skills : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (name: string) => {
    if (!name.trim()) return;
    setSkills({ ...skills, [name.trim()]: DEFAULT_SKILL_LEVEL });
    setSkillInput("");
  };

  const removeSkill = (name: string) => {
    const next = { ...skills };
    delete next[name];
    setSkills(next);
  };

  return (
    <Modal isOpen onClose={onClose} title={item ? "Edit Portfolio Item" : "Add Portfolio Item"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My awesome project"
          required
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value as PortfolioItemType)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
            {PORTFOLIO_ITEM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="What did you do? What did you learn?"
          />
        </div>

        <Input
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/..."
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Skills Used</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {Object.entries(skills).map(([skill, level]) => (
              <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {skill} <span className="text-[10px] capitalize text-indigo-400 dark:text-indigo-500">{level}</span>
                <button type="button" onClick={() => removeSkill(skill)} className="ml-0.5 text-indigo-400 hover:text-indigo-700 dark:text-indigo-500 dark:hover:text-indigo-300">
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && skillInput.trim()) {
                  e.preventDefault();
                  addSkill(skillInput);
                }
              }}
              placeholder="Type a skill..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            {skillInput && suggestions.length > 0 && (
              <div className="absolute top-full left-0 z-10 mt-1 max-h-32 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {suggestions.slice(0, 5).map((s) => (
                  <button key={s} type="button" onClick={() => addSkill(s)} className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Default level: {DEFAULT_SKILL_LEVEL}. Add a skill to edit its level.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? "Saving..." : item ? "Update" : "Add Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
