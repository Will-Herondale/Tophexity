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
          <label className="mb-1 block text-sm font-medium" style={{ color: "#8a8a9a" }}>Type</label>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value as PortfolioItemType)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
            style={{ borderColor: "rgba(30, 79, 163, 0.15)", backgroundColor: "#0d214f", color: "#f0f0f0" }}
          >
            {PORTFOLIO_ITEM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "#8a8a9a" }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
            style={{ borderColor: "rgba(30, 79, 163, 0.15)", backgroundColor: "#0d214f", color: "#f0f0f0" }}
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
          <label className="mb-1 block text-sm font-medium" style={{ color: "#8a8a9a" }}>Skills Used</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {Object.entries(skills).map(([skill, level]) => (
              <span key={skill} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: "#1E4FA3", color: "#ffffff" }}>
                {skill} <span className="text-[10px] capitalize" style={{ color: "#5b9aff" }}>{level}</span>
                <button type="button" onClick={() => removeSkill(skill)} className="ml-0.5 hover:text-white transition-colors" style={{ color: "#8a8a9a" }}>
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
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#1E4FA3]"
              style={{ borderColor: "rgba(30, 79, 163, 0.15)", backgroundColor: "#0d214f", color: "#f0f0f0" }}
            />
            {skillInput && suggestions.length > 0 && (
              <div className="absolute top-full left-0 z-10 mt-1 max-h-32 w-full overflow-y-auto rounded-lg border shadow-lg" style={{ borderColor: "rgba(30, 79, 163, 0.15)", backgroundColor: "#0d214f" }}>
                {suggestions.slice(0, 5).map((s) => (
                  <button key={s} type="button" onClick={() => addSkill(s)} className="block w-full px-3 py-2 text-left text-sm transition-colors" style={{ color: "#f0f0f0" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#112a5e")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0d214f")}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-1 text-xs" style={{ color: "#5a5a6a" }}>Default level: {DEFAULT_SKILL_LEVEL}. Add a skill to edit its level.</p>
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
