"use client";

import { useState, type FormEvent } from "react";
import type { PortfolioItem, PortfolioItemCreatePayload } from "@/types/portfolio";
import type { PortfolioItemType } from "@/lib/constants";
import { PORTFOLIO_ITEM_TYPES, SKILL_PRESETS, SKILL_LEVELS, DEFAULT_SKILL_LEVEL } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { X, Plus, Check, ChevronsUpDown } from "lucide-react";

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
    if (skills[name.trim()]) return;
    setSkills({ ...skills, [name.trim()]: DEFAULT_SKILL_LEVEL });
    setSkillInput("");
  };

  const removeSkill = (name: string) => {
    const next = { ...skills };
    delete next[name];
    setSkills(next);
  };

  const setSkillLevel = (name: string, level: string) => {
    setSkills({ ...skills, [name]: level });
  };

  const [levelPickerOpen, setLevelPickerOpen] = useState<string | null>(null);

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
          <label className="mb-1 block text-sm font-medium text-text-secondary">Type</label>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value as PortfolioItemType)}
            className="w-full rounded-lg border border-border bg-surface/30 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {PORTFOLIO_ITEM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-secondary">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-surface/30 px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none"
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
          <label className="mb-1 block text-sm font-medium text-text-secondary">Skills Used</label>
          {Object.keys(skills).length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {Object.entries(skills).map(([skill, level]) => (
                <div key={skill} className="group relative">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 pl-2.5 pr-1.5 py-1 text-xs font-medium text-accent-light">
                    {skill}
                    <button
                      type="button"
                      onClick={() => setLevelPickerOpen(levelPickerOpen === skill ? null : skill)}
                      className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] uppercase tracking-wider text-accent/60 hover:text-accent transition-colors"
                    >
                      {level}
                      <ChevronsUpDown className="h-2.5 w-2.5" />
                    </button>
                    <button type="button" onClick={() => removeSkill(skill)}
                      className="ml-0.5 rounded p-0.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                  {levelPickerOpen === skill && (
                    <div className="absolute top-full left-0 z-20 mt-1 w-36 rounded-lg border border-border bg-surface shadow-xl overflow-hidden">
                      {SKILL_LEVELS.map((sl) => (
                        <button
                          key={sl.value}
                          type="button"
                          onClick={() => { setSkillLevel(skill, sl.value); setLevelPickerOpen(null); }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                            level === sl.value
                              ? "bg-accent/15 text-accent-light"
                              : "text-text-secondary hover:bg-surface-light/30 hover:text-foreground"
                          }`}
                        >
                          {level === sl.value && <Check className="h-3 w-3 shrink-0" />}
                          <span className={level === sl.value ? "" : "ml-5"}>{sl.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="relative">
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
                placeholder="Type a skill name and press Enter..."
                className="w-full rounded-lg border border-border bg-surface/30 pl-3 pr-10 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {skillInput.trim() && !skills[skillInput.trim()] && (
                <button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-accent hover:bg-accent/10 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            {skillInput && suggestions.length > 0 && (
              <div className="absolute top-full left-0 z-10 mt-1 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-xl">
                {suggestions.slice(0, 6).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-light/30 hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3 w-3 shrink-0 text-accent" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !title.trim()}>
            {saving ? "Saving..." : item ? "Update" : "Add Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
