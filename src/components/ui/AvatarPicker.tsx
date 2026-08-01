"use client";

import { useState, useRef } from "react";
import { Camera, X, Smile, User } from "lucide-react";
import clsx from "clsx";

interface AvatarPickerProps {
  name: string;
  value: string | null;
  onChange: (value: string | null) => void;
  size?: "sm" | "md" | "lg";
}

const EMOJI_GRID = [
  "😀", "😎", "🤓", "🧑‍💻", "👩‍💻", "🧑‍🚀", "👨‍🚀", "🧑‍🎨", "👩‍🎨", "🦊",
  "🐱", "🐶", "🦁", "🐼", "🐨", "🦄", "🐸", "🌸", "🌟", "🔥",
  "⚡", "🎯", "🚀", "💎", "🎨", "🎵", "🏆", "💪", "🧠", "✨",
];

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500",
];

function getInitialColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const sizeMap = {
  sm: "h-12 w-12 text-lg",
  md: "h-20 w-20 text-2xl",
  lg: "h-28 w-28 text-4xl",
};

type Tab = "initials" | "upload" | "emoji";

export default function AvatarPicker({ name, value, onChange, size = "md" }: AvatarPickerProps) {
  const [tab, setTab] = useState<Tab>("initials");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = name ? name.charAt(0).toUpperCase() : "?";
  const isEmoji = value && value.length <= 2 && /\p{Emoji}/u.test(value);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={clsx(
            "flex items-center justify-center rounded-full font-bold text-white select-none overflow-hidden",
            sizeMap[size],
            !value && getInitialColor(name || "?")
          )}
        >
          {value ? (
            isEmoji ? (
              <span className={clsx(size === "sm" ? "text-2xl" : size === "md" ? "text-4xl" : "text-5xl")}>{value}</span>
            ) : (
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            initials
          )}
        </div>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-surface/30 p-0.5">
        {([
          { id: "initials", icon: <User className="h-3 w-3" />, label: "Initials" },
          { id: "upload", icon: <Camera className="h-3 w-3" />, label: "Upload" },
          { id: "emoji", icon: <Smile className="h-3 w-3" />, label: "Emoji" },
        ] as const).map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
              tab === id ? "bg-accent/15 text-accent" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === "initials" && (
        <p className="text-xs text-text-muted text-center">Auto-generated from your name</p>
      )}

      {tab === "upload" && (
        <div className="text-center">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-dashed border-border px-4 py-2 text-xs text-text-secondary hover:border-accent hover:text-accent transition-colors"
          >
            Choose an image
          </button>
        </div>
      )}

      {tab === "emoji" && (
        <div className="grid grid-cols-6 gap-1">
          {EMOJI_GRID.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all hover:bg-surface/50 hover:scale-110",
                value === emoji && "bg-accent/15 ring-1 ring-accent"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
