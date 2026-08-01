"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, createProfile, updateProfile, getRecommendationsHistory, generateRecommendation } from "@/lib/api";
import type { Profile, ProfileUpdatePayload } from "@/types/profile";
import { createEmptyProfile } from "@/types/profile";
import ProfileView from "@/components/profile/ProfileView";
import ProfileEdit from "@/components/profile/ProfileEdit";
import ProfileVersionHistory from "@/components/profile/ProfileVersionHistory";
import Button from "@/components/ui/Button";
import GenerationProgress from "@/components/ui/GenerationProgress";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/contexts/ToastContext";
import { Edit3, Plus, History, Sparkles, CheckCircle2 } from "lucide-react";

function isProfileComplete(p: Profile): boolean {
  const hasSkills = p.skills && Object.keys(p.skills).length > 0;
  const hasTargets = p.target_fields && Object.keys(p.target_fields).length > 0;
  const hasInterests = p.interests && Object.keys(p.interests).length > 0;
  return !!(p.full_name && (hasSkills || hasTargets || hasInterests));
}

export default function ProfilePage() {
  usePageTitle("Profile");
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile>(createEmptyProfile());
  const [hasProfile, setHasProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progressToken, setProgressToken] = useState<string | null>(null);
  const { progress, elapsedSeconds, stop } = useGenerationProgress(progressToken);

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
    getRecommendationsHistory(1, 1)
      .then((data) => { if (!cancelled) setHasRecommendations((data.items?.length ?? 0) > 0); })
      .catch(() => { if (!cancelled) setHasRecommendations(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (payload: ProfileUpdatePayload) => {
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
      toast.showToast("Profile updated successfully", "success");
      if (isProfileComplete(updatedProfile)) {
        setTimeout(() => router.push("/chat?recommend=true"), 1200);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } };
      const detail = axiosErr.response?.data?.detail;
      const text = Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : typeof detail === "string" ? detail : "Failed to save profile";
      toast.showToast(text, "error");
    }
  };

  const handleGetRecommendations = async () => {
    const token = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `pg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setGenerating(true);
    setProgressToken(token);
    try {
      await generateRecommendation({ include_profile: true, max_results: 10, progress_token: token });
      setHasRecommendations(true);
      toast.showToast("Recommendations generated and profile updated", "success");
      setTimeout(() => router.push("/chat?recommend=true"), 800);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } }; message?: string };
      const detail = axiosErr.response?.data?.detail;
      const text = Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : typeof detail === "string" ? detail : axiosErr?.message || "Failed to generate recommendations";
      toast.showToast(text, "error");
    } finally {
      stop();
      setProgressToken(null);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border-light border-t-accent" />
            <div className="absolute inset-0 h-10 w-10 animate-pulse rounded-full bg-accent/5" />
          </div>
          <p className="text-sm text-text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">My Profile</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {hasProfile ? "Manage your career profile" : "Create your profile to get personalized recommendations"}
          </p>
        </div>
        {hasProfile && !editing && (
          <div className="flex items-center gap-3">
          {isProfileComplete(profile) && !hasRecommendations && (
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:inline-flex">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete
              </span>
            )}
            <Button onClick={() => setEditing(true)}>
              <Edit3 className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </div>
        )}
      </div>

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
            <div className="group relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-accent/[0.02] p-6 text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <p className="mb-1 text-sm font-medium text-foreground">
                  {hasRecommendations
                    ? "Your AI recommendations are ready — refresh them as your profile changes"
                    : "Your profile is ready for AI-powered career recommendations"}
                </p>
                <p className="mb-4 text-xs text-text-muted">Our AI analyzes your profile to find the best career paths for you</p>
                {generating ? (
                  <div className="mx-auto mt-1 max-w-md rounded-xl bg-surface/20 p-4 text-left">
                    <GenerationProgress
                      percent={progress?.percent ?? 5}
                      phase={progress?.phase ?? "Starting..."}
                      message={progress?.message ?? "Preparing your personalized analysis"}
                      elapsedSeconds={elapsedSeconds}
                    />
                  </div>
                ) : (
                  <Button onClick={handleGetRecommendations}>
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    {hasRecommendations ? "Regenerate Recommendations" : "Get AI Recommendations"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border bg-gradient-to-b from-surface/30 to-surface/10 p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Plus className="h-8 w-8 text-accent" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground">No profile yet</h3>
          <p className="mt-2 text-sm text-text-secondary">Create your profile to start getting personalized career recommendations.</p>
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
