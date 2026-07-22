"use client";

import { useState, type FormEvent } from "react";
import type { Profile, ProfileUpdatePayload } from "@/types/profile";
import { EDUCATION_LEVELS } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import SkillsInput from "@/components/profile/SkillsInput";
import { Save, X } from "lucide-react";

interface ProfileEditProps {
  profile: Profile;
  onSave: (payload: ProfileUpdatePayload) => Promise<void>;
  onCancel: () => void;
}

export default function ProfileEdit({ profile, onSave, onCancel }: ProfileEditProps) {
  const [form, setForm] = useState<ProfileUpdatePayload>({
    full_name: profile.full_name || "",
    headline: profile.headline || "",
    bio: profile.bio || "",
    location: profile.location || "",
    avatar_url: profile.avatar_url || "",
    education_level: profile.education_level || "",
    years_experience: profile.years_experience ?? null,
    current_field: profile.current_field || "",
    target_fields: profile.target_fields || [],
    skills: profile.skills || {},
    interests: profile.interests || [],
  });
  const [saving, setSaving] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const addToArray = (field: "target_fields" | "interests", value: string) => {
    if (!value.trim()) return;
    const arr = (form[field] as string[]) || [];
    if (!arr.includes(value.trim())) {
      setForm({ ...form, [field]: [...arr, value.trim()] });
    }
  };

  const removeFromArray = (field: "target_fields" | "interests", value: string) => {
    const arr = (form[field] as string[]) || [];
    setForm({ ...form, [field]: arr.filter((v) => v !== value) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Full Name"
            value={form.full_name || ""}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="John Doe"
          />
          <Input
            label="Headline"
            value={form.headline || ""}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            placeholder="Full Stack Developer"
          />
          <Input
            label="Location"
            value={form.location || ""}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Hyderabad, India"
          />
          <Input
            label="Avatar URL"
            value={form.avatar_url || ""}
            onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
          <textarea
            value={form.bio || ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
            placeholder="Tell us about yourself..."
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Education & Experience</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Education Level</label>
            <select
              value={form.education_level || ""}
              onChange={(e) => setForm({ ...form, education_level: e.target.value || null })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Select...</option>
              {EDUCATION_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Years of Experience"
            type="number"
            min={0}
            value={form.years_experience?.toString() || ""}
            onChange={(e) => setForm({ ...form, years_experience: e.target.value ? Number(e.target.value) : null })}
          />
          <Input
            label="Current Field"
            value={form.current_field || ""}
            onChange={(e) => setForm({ ...form, current_field: e.target.value })}
            placeholder="Software Engineering"
          />
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Target Fields</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {(form.target_fields || []).map((field) => (
            <span key={field} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              {field}
              <button type="button" onClick={() => removeFromArray("target_fields", field)} className="ml-0.5 text-blue-400 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-300">
                <span className="sr-only">Remove</span>&times;
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addToArray("target_fields", targetInput);
                setTargetInput("");
              }
            }}
            placeholder="Add a target field..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={() => {
              addToArray("target_fields", targetInput);
              setTargetInput("");
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Add
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Skills</h3>
        <SkillsInput
          value={(form.skills as Record<string, string>) || {}}
          onChange={(skills) => setForm({ ...form, skills })}
        />
      </Card>

      <Card>
        <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">Interests</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {(form.interests || []).map((interest) => (
            <span key={interest} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              {interest}
              <button type="button" onClick={() => removeFromArray("interests", interest)} className="ml-0.5 text-amber-400 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-300">
                <span className="sr-only">Remove</span>&times;
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addToArray("interests", interestInput);
                setInterestInput("");
              }
            }}
            placeholder="Add an interest..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={() => {
              addToArray("interests", interestInput);
              setInterestInput("");
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Add
          </button>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Profile
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
