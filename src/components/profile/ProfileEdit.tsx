"use client";

import { useState, type FormEvent } from "react";
import type { Profile, ProfileUpdatePayload, PreviousRole, Certification } from "@/types/profile";
import { EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import AvatarPicker from "@/components/ui/AvatarPicker";
import SkillsInput from "@/components/profile/SkillsInput";
import {
  Save, X, ChevronRight, ChevronLeft, User, GraduationCap, Briefcase, Wrench, Target, Plus, Trash2,
} from "lucide-react";

interface ProfileEditProps {
  profile: Profile;
  onSave: (payload: ProfileUpdatePayload) => Promise<void>;
  onCancel: () => void;
}

const STEPS = [
  { id: "about", label: "About You", icon: User },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "goals", label: "Goals", icon: Target },
] as const;

const inputClass =
  "w-full rounded-lg border border-border bg-surface/30 px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const selectClass =
  "w-full rounded-lg border border-border bg-surface/30 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "mb-1 block text-sm font-medium text-text-secondary";

export default function ProfileEdit({ profile, onSave, onCancel }: ProfileEditProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProfileUpdatePayload>({
    full_name: profile.full_name || "",
    headline: profile.headline || "",
    bio: profile.bio || "",
    location: profile.location || "",
    avatar_url: profile.avatar_url || "",
    education_level: profile.education_level || "",
    years_experience: profile.years_experience ?? null,
    experience_level: profile.experience_level || "",
    current_field: profile.current_field || "",
    target_fields: profile.target_fields || [],
    skills: profile.skills || {},
    interests: profile.interests || [],
    previous_roles: profile.previous_roles || [],
    certifications: profile.certifications || [],
  });
  const [saving, setSaving] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [interestInput, setInterestInput] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const clean: ProfileUpdatePayload = {};
      if (form.full_name) clean.full_name = form.full_name;
      if (form.headline) clean.headline = form.headline;
      if (form.bio) clean.bio = form.bio;
      if (form.location) clean.location = form.location;
      if (form.avatar_url) clean.avatar_url = form.avatar_url;
      if (form.education_level) clean.education_level = form.education_level;
      if (form.experience_level) clean.experience_level = form.experience_level;
      if (form.years_experience != null) clean.years_experience = form.years_experience;
      if (form.current_field) clean.current_field = form.current_field;
      if (form.target_fields && form.target_fields.length > 0) clean.target_fields = form.target_fields;
      if (form.interests && form.interests.length > 0) clean.interests = form.interests;
      if (form.skills && Object.keys(form.skills).length > 0) clean.skills = form.skills;
      if (form.previous_roles && form.previous_roles.length > 0) clean.previous_roles = form.previous_roles;
      if (form.certifications && form.certifications.length > 0) clean.certifications = form.certifications;
      await onSave(clean);
    } finally {
      setSaving(false);
    }
  };

  const update = (patch: Partial<ProfileUpdatePayload>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const addToArray = (field: "target_fields" | "interests", value: string) => {
    if (!value.trim()) return;
    const arr = (form[field] as string[]) || [];
    if (!arr.includes(value.trim())) {
      update({ [field]: [...arr, value.trim()] });
    }
  };

  const removeFromArray = (field: "target_fields" | "interests", value: string) => {
    const arr = (form[field] as string[]) || [];
    update({ [field]: arr.filter((v) => v !== value) });
  };

  const addRole = () => {
    const roles = form.previous_roles || [];
    update({
      previous_roles: [...roles, { title: "", company: "", start_date: null, end_date: null, description: null }],
    });
  };

  const updateRole = (idx: number, patch: Partial<PreviousRole>) => {
    const roles = [...(form.previous_roles || [])];
    roles[idx] = { ...roles[idx], ...patch };
    update({ previous_roles: roles });
  };

  const removeRole = (idx: number) => {
    const roles = [...(form.previous_roles || [])];
    roles.splice(idx, 1);
    update({ previous_roles: roles });
  };

  const addCert = () => {
    const certs = form.certifications || [];
    update({
      certifications: [...certs, { name: "", issuer: "", date_obtained: null, expiry_date: null, credential_url: null }],
    });
  };

  const updateCert = (idx: number, patch: Partial<Certification>) => {
    const certs = [...(form.certifications || [])];
    certs[idx] = { ...certs[idx], ...patch };
    update({ certifications: certs });
  };

  const removeCert = (idx: number) => {
    const certs = [...(form.certifications || [])];
    certs.splice(idx, 1);
    update({ certifications: certs });
  };

  const canNext = () => {
    if (step === 0) return !!(form.full_name || form.headline);
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent/15 text-accent"
                  : done
                    ? "text-accent hover:bg-accent/10"
                    : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
              {done && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 0 && (
          <Card>
            <h3 className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">About You</h3>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <AvatarPicker
                name={form.full_name || ""}
                value={form.avatar_url || null}
                onChange={(v) => update({ avatar_url: v })}
                size="lg"
              />
              <div className="grid flex-1 gap-4 md:grid-cols-2">
                <Input
                  label="Full Name"
                  value={form.full_name || ""}
                  onChange={(e) => update({ full_name: e.target.value })}
                  placeholder="John Doe"
                />
                <Input
                  label="Headline"
                  value={form.headline || ""}
                  onChange={(e) => update({ headline: e.target.value })}
                  placeholder="Full Stack Developer"
                />
                <Input
                  label="Location"
                  value={form.location || ""}
                  onChange={(e) => update({ location: e.target.value })}
                  placeholder="Hyderabad, India"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelClass}>Bio</label>
              <textarea
                value={form.bio || ""}
                onChange={(e) => update({ bio: e.target.value })}
                rows={3}
                className={inputClass}
                placeholder="Tell us about yourself — what drives you, what you're working on..."
              />
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <h3 className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">Education & Background</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Education Level</label>
                <select
                  value={form.education_level || ""}
                  onChange={(e) => update({ education_level: e.target.value || null })}
                  className={selectClass}
                >
                  <option value="">Select...</option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Experience Level</label>
                <select
                  value={form.experience_level || ""}
                  onChange={(e) => update({ experience_level: e.target.value || null })}
                  className={selectClass}
                >
                  <option value="">Select...</option>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Years of Experience"
                type="number"
                min={0}
                value={form.years_experience?.toString() || ""}
                onChange={(e) => update({ years_experience: e.target.value ? Number(e.target.value) : null })}
              />
              <Input
                label="Current Field"
                value={form.current_field || ""}
                onChange={(e) => update({ current_field: e.target.value })}
                placeholder="Software Engineering"
              />
            </div>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">Previous Roles</h3>
                <button type="button" onClick={addRole} className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-light">
                  <Plus className="h-3 w-3" /> Add Role
                </button>
              </div>
              {(form.previous_roles || []).length === 0 && (
                <p className="text-sm text-text-muted">No previous roles added yet. Add your work history to help us understand your background.</p>
              )}
              <div className="space-y-4">
                {(form.previous_roles || []).map((role, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-surface/20 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid flex-1 grid-cols-2 gap-3">
                        <Input
                          label="Job Title"
                          value={role.title}
                          onChange={(e) => updateRole(idx, { title: e.target.value })}
                          placeholder="Software Engineer"
                        />
                        <Input
                          label="Company"
                          value={role.company}
                          onChange={(e) => updateRole(idx, { company: e.target.value })}
                          placeholder="Google"
                        />
                        <Input
                          label="Start Date"
                          type="date"
                          value={role.start_date || ""}
                          onChange={(e) => updateRole(idx, { start_date: e.target.value || null })}
                        />
                        <Input
                          label="End Date"
                          type="date"
                          value={role.end_date || ""}
                          onChange={(e) => updateRole(idx, { end_date: e.target.value || null })}
                        />
                      </div>
                      <button type="button" onClick={() => removeRole(idx)} className="mt-6 text-text-muted hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea
                        value={role.description || ""}
                        onChange={(e) => updateRole(idx, { description: e.target.value || null })}
                        rows={2}
                        className={inputClass}
                        placeholder="What did you accomplish in this role?"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">Certifications</h3>
                <button type="button" onClick={addCert} className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-light">
                  <Plus className="h-3 w-3" /> Add Certification
                </button>
              </div>
              {(form.certifications || []).length === 0 && (
                <p className="text-sm text-text-muted">No certifications added yet. Certifications help validate your skills.</p>
              )}
              <div className="space-y-4">
                {(form.certifications || []).map((cert, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-surface/20 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid flex-1 grid-cols-2 gap-3">
                        <Input
                          label="Certification Name"
                          value={cert.name}
                          onChange={(e) => updateCert(idx, { name: e.target.value })}
                          placeholder="AWS Solutions Architect"
                        />
                        <Input
                          label="Issuing Organization"
                          value={cert.issuer}
                          onChange={(e) => updateCert(idx, { issuer: e.target.value })}
                          placeholder="Amazon Web Services"
                        />
                        <Input
                          label="Date Obtained"
                          type="date"
                          value={cert.date_obtained || ""}
                          onChange={(e) => updateCert(idx, { date_obtained: e.target.value || null })}
                        />
                        <Input
                          label="Expiry Date"
                          type="date"
                          value={cert.expiry_date || ""}
                          onChange={(e) => updateCert(idx, { expiry_date: e.target.value || null })}
                        />
                      </div>
                      <button type="button" onClick={() => removeCert(idx)} className="mt-6 text-text-muted hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <Input
                      label="Credential URL"
                      value={cert.credential_url || ""}
                      onChange={(e) => updateCert(idx, { credential_url: e.target.value || null })}
                      placeholder="https://..."
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {step === 3 && (
          <Card>
            <h3 className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">Your Skills</h3>
            <SkillsInput
              value={(form.skills as Record<string, string>) || {}}
              onChange={(skills) => update({ skills })}
            />
          </Card>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Card>
              <h3 className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">Target Fields</h3>
              <p className="mb-3 text-sm text-text-secondary">What fields or roles are you aiming for?</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {(form.target_fields || []).map((field) => (
                  <span key={field} className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                    {field}
                    <button type="button" onClick={() => removeFromArray("target_fields", field)} className="ml-0.5 text-accent/60 hover:text-accent">
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
                  placeholder="e.g. Machine Learning Engineer, Product Manager..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => { addToArray("target_fields", targetInput); setTargetInput(""); }}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface/30 hover:text-foreground"
                >
                  Add
                </button>
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">Interests</h3>
              <p className="mb-3 text-sm text-text-secondary">What topics or areas fascinate you?</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {(form.interests || []).map((interest) => (
                  <span key={interest} className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                    {interest}
                    <button type="button" onClick={() => removeFromArray("interests", interest)} className="ml-0.5 text-accent/60 hover:text-accent">
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
                  placeholder="e.g. AI Ethics, Open Source, Design Systems..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => { addToArray("interests", interestInput); setInterestInput(""); }}
                  className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-surface/30 hover:text-foreground"
                >
                  Add
                </button>
              </div>
            </Card>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canNext()}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
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
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
