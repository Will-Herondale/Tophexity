"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, createProfile, updateProfile } from "@/lib/api";
import type { Profile, ProfileUpdatePayload } from "@/types/profile";
import { createEmptyProfile } from "@/types/profile";
import ProfileView from "@/components/profile/ProfileView";
import ProfileEdit from "@/components/profile/ProfileEdit";
import ProfileVersionHistory from "@/components/profile/ProfileVersionHistory";
import Button from "@/components/ui/Button";
import { Edit3, Plus, History, Sparkles } from "lucide-react";

function isProfileComplete(p: Profile): boolean {
  const hasSkills = p.skills && Object.keys(p.skills).length > 0;
  const hasTargets = p.target_fields && Object.keys(p.target_fields).length > 0;
  const hasInterests = p.interests && Object.keys(p.interests).length > 0;
  return !!(p.full_name && (hasSkills || hasTargets || hasInterests));
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(createEmptyProfile());
  const [hasProfile, setHasProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showVersions, setShowVersions] = useState(false);

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
      let updatedProfile: Profile;
      if (hasProfile) {
        updatedProfile = await updateProfile(payload);
        setProfile(updatedProfile);
      } else {
        updatedProfile = await createProfile(payload);
        setProfile(updatedProfile);
        setHasProfile(true);
      }
      setEditing(false);
      if (isProfileComplete(updatedProfile)) {
        setMessage({ type: "success", text: "Profile complete! Generating your career recommendations..." });
        setTimeout(() => router.push("/chat?recommend=true"), 1500);
      } else {
        setMessage({ type: "success", text: "Profile updated successfully" });
      }
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-sm text-text-secondary">
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
        <div className="space-y-6">
          <ProfileView profile={profile} />
          {isProfileComplete(profile) && (
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-center">
              <p className="mb-3 text-sm text-text-secondary">Your profile looks complete! Ready for AI-powered career recommendations.</p>
              <Button onClick={() => router.push("/chat?recommend=true")}>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Get AI Recommendations
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border bg-surface/30 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
            <Plus className="h-8 w-8 text-accent" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">No profile yet</h3>
          <p className="mt-2 text-sm text-text-secondary">Create your profile to start getting career recommendations.</p>
          <Button className="mt-6" onClick={() => setEditing(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Profile
          </Button>
        </div>
      )}

      {hasProfile && !editing && (
        <div className="mt-8">
          {!showVersions ? (
            <button
              onClick={() => setShowVersions(true)}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              <History className="h-4 w-4" />
              View profile version history
            </button>
          ) : (
            <div className="rounded-2xl bg-surface/15 p-6">
              <ProfileVersionHistory onClose={() => setShowVersions(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
