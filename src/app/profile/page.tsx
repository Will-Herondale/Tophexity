"use client";

import { useState, useEffect } from "react";
import { getProfile, createProfile, updateProfile } from "@/lib/api";
import type { Profile, ProfileUpdatePayload } from "@/types/profile";
import { createEmptyProfile } from "@/types/profile";
import ProfileView from "@/components/profile/ProfileView";
import ProfileEdit from "@/components/profile/ProfileEdit";
import Button from "@/components/ui/Button";
import { Edit3, Plus, History } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(createEmptyProfile());
  const [hasProfile, setHasProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((data) => {
        if (!cancelled) { setProfile(data); setHasProfile(true); }
      })
      .catch((err) => {
        const axiosErr = err as { response?: { status?: number } };
        if (!cancelled && axiosErr.response?.status === 404) setHasProfile(false);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (payload: ProfileUpdatePayload) => {
    setMessage(null);
    try {
      if (hasProfile) {
        const updated = await updateProfile(payload);
        setProfile(updated);
        setMessage({ type: "success", text: "Profile updated successfully" });
      } else {
        const created = await createProfile(payload);
        setProfile(created);
        setHasProfile(true);
        setMessage({ type: "success", text: "Profile created successfully" });
      }
      setEditing(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
      const detail = axiosErr.response?.data?.detail;
      const text = Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : typeof detail === "string" ? detail : "Failed to save profile";
      setMessage({ type: "error", text });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1E4FA3]/30 border-t-[#1E4FA3]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#f0f0f0]">My Profile</h1>
          <p className="mt-1 text-sm text-[#8a8a9a]">
            {hasProfile ? "Manage your career profile" : "Create your profile to get personalized recommendations"}
          </p>
        </div>
        {hasProfile && !editing && (
          <Button onClick={() => setEditing(true)}>
            <Edit3 className="mr-1 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl border p-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {editing ? (
        <ProfileEdit
          profile={profile}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : hasProfile ? (
        <ProfileView profile={profile} />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[#1E4FA3]/20 bg-[#0d214f]/30 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1E4FA3]/20">
            <Plus className="h-8 w-8 text-[#1E4FA3]" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#f0f0f0]">No profile yet</h3>
          <p className="mt-2 text-sm text-[#8a8a9a]">Create your profile to start getting career recommendations.</p>
          <Button className="mt-6" onClick={() => setEditing(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Profile
          </Button>
        </div>
      )}

      {hasProfile && !editing && (
        <div className="mt-8">
          <button className="flex items-center gap-2 text-sm text-[#5a5a6a] hover:text-[#8a8a9a]">
            <History className="h-4 w-4" />
            View profile version history
          </button>
        </div>
      )}
    </div>
  );
}
