"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

export default function TagInput({
  label,
  tags,
  onChange,
  placeholder = "Type and press Enter...",
  suggestions = [],
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className={clsx("space-y-1", className)}>
      {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface/30 p-2 focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/30">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-border-light bg-accent/15 px-3 py-1 text-sm font-medium text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full p-0.5 hover:bg-accent/30"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted"
        />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg shadow-accent/5">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(s)}
              className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
