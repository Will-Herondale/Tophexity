"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, getRecommendationsHistory, getPortfolioItems, getGenerationStatus } from "@/lib/api";
import type { Profile } from "@/types/profile";
import type { Recommendation } from "@/types/recommendation";
import type { PortfolioItem } from "@/types/portfolio";
import type { GenerationStatus } from "@/types/system";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ChatStatsCard from "@/components/chat/ChatStatsCard";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  User, Briefcase, Star, Map, FolderOpen, Shield, MessageSquare, ArrowRight, CheckCircle2, Circle,
} from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-64 rounded-lg bg-surface/20" />
        <div className="mt-2 h-4 w-48 rounded bg-surface/15" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 rounded-2xl bg-surface/20 p-4">
            <div className="h-10 w-10 rounded-xl bg-surface/15" />
            <div className="h-4 w-16 rounded bg-surface/15" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-surface/20 p-6">
          <div className="mb-3 h-5 w-40 rounded bg-surface/15" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-surface/15" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-surface/20 p-6">
          <div className="mb-3 h-5 w-32 rounded bg-surface/15" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-surface/15" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  usePageTitle("Dashboard");
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [genStatus, setGenStatus] = useState<GenerationStatus | null>(null);
  const [genStatusFailed, setGenStatusFailed] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getProfile().catch(() => null),
      getRecommendationsHistory(1, 3).catch(() => null),
      getPortfolioItems({ page: 1, page_size: 5 }).catch(() => null),
      getGenerationStatus().catch(() => null),
    ]).then(([profileRes, recsRes, portfolioRes, genRes]) => {
      if (cancelled) return;
      const failed: string[] = [];
      if (profileRes.status === "fulfilled" && profileRes.value) setProfile(profileRes.value as Profile);
      else if (profileRes.status === "rejected" || !profileRes.value) failed.push("profile");
      if (recsRes.status === "fulfilled" && recsRes.value) setRecommendations((recsRes.value as { items: Recommendation[] }).items || []);
      else if (recsRes.status === "rejected" || !recsRes.value) failed.push("recommendations");
      if (portfolioRes.status === "fulfilled" && portfolioRes.value) setPortfolioItems((portfolioRes.value as { items: PortfolioItem[] }).items || []);
      else if (portfolioRes.status === "rejected" || !portfolioRes.value) failed.push("portfolio");
      if (genRes.status === "fulfilled" && genRes.value) setGenStatus(genRes.value as GenerationStatus);
      else if (genRes.status === "rejected" || !genRes.value) setGenStatusFailed(true);
      if (failed.length > 0) {
        setFetchError(`Couldn't load ${failed.join(", ")}. Refresh the page or check your connection.`);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <DashboardSkeleton />;

  const quickLinks = [
    { icon: <User className="h-5 w-5" />, label: "Profile", href: "/profile", color: "bg-accent/20 text-accent" },
    { icon: <Briefcase className="h-5 w-5" />, label: "Careers", href: "/careers", color: "bg-accent/20 text-accent-light" },
    { icon: <FolderOpen className="h-5 w-5" />, label: "Portfolio", href: "/portfolio", color: "bg-amber-500/15 text-amber-400" },
    { icon: <Star className="h-5 w-5" />, label: "Recommendations", href: "/recommendations", color: "bg-emerald-500/15 text-emerald-400" },
    { icon: <Map className="h-5 w-5" />, label: "Roadmaps", href: "/roadmaps", color: "bg-purple-500/15 text-purple-400" },
    { icon: <Shield className="h-5 w-5" />, label: "Backup Plans", href: "/backups", color: "bg-red-500/15 text-red-400" },
    { icon: <MessageSquare className="h-5 w-5" />, label: "Chat", href: "/chat", color: "bg-teal-500/15 text-teal-400" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}!
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {profile
            ? profile.headline || "Manage your career journey"
            : "Complete your profile to get started"}
        </p>
      </div>

      {fetchError && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {fetchError}
        </div>
      )}

      {!profile && (
        <Card className="mb-6 border-border-light bg-surface/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Complete your profile</h3>
              <p className="mt-1 text-xs text-text-secondary">
                Tell us about yourself to get personalized career recommendations.
              </p>
            </div>
            <Button size="sm" onClick={() => router.push("/profile")}>
              Get Started <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <button
            key={link.href}
            onClick={() => router.push(link.href)}
            className="flex flex-col items-center gap-2 rounded-2xl bg-surface/20 p-4 text-center transition-all hover:bg-surface/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className={`rounded-xl p-2.5 ${link.color}`}>{link.icon}</div>
            <span className="text-sm font-medium text-foreground">{link.label}</span>
          </button>
        ))}
      </div>

      {genStatus && (
        <Card className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
            AI Generation Status
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Profile", done: genStatus.has_profile, href: "/profile" },
              { label: `Recommendations${genStatus.recommendation_count ? ` (${genStatus.recommendation_count})` : ""}`, done: genStatus.has_recommendations, href: "/recommendations" },
              { label: `Roadmaps${genStatus.roadmap_count ? ` (${genStatus.roadmap_count})` : ""}`, done: genStatus.has_roadmaps, href: "/roadmaps" },
              { label: `Backup Plans${genStatus.backup_plan_count ? ` (${genStatus.backup_plan_count})` : ""}`, done: genStatus.has_backup_plans, href: "/backups" },
              { label: `Portfolio Items${genStatus.portfolio_item_count ? ` (${genStatus.portfolio_item_count})` : ""}`, done: genStatus.has_portfolio_items, href: "/portfolio" },
              { label: `Chat Sessions${genStatus.chat_session_count ? ` (${genStatus.chat_session_count})` : ""}`, done: genStatus.has_chat_sessions, href: "/chat" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className="flex items-center gap-2 rounded-xl bg-surface/15 p-3 text-left transition-colors hover:bg-surface/30"
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-4 w-4 flex-shrink-0 text-text-muted" />
                )}
                <span className="text-sm text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {genStatusFailed && (
        <Card className="mb-6 border-border-light">
          <h3 className="mb-1 text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
            AI Generation Status
          </h3>
          <p className="text-xs text-text-muted">
            Status is unavailable right now. Try refreshing the page.
          </p>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
            <Star className="mr-1 inline h-4 w-4 text-amber-400" />
            Recent Recommendations
          </h3>
          {recommendations.length === 0 ? (
            <p className="text-xs text-text-muted">No recommendations yet. Complete your profile to get started.</p>
          ) : (
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => router.push(`/recommendations/${rec.id}`)}
                  className="flex w-full items-center justify-between rounded-xl bg-surface/15 p-3 text-left transition-colors hover:bg-surface/30"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{rec.title || "Career Recommendation"}</p>
                    <p className="text-xs text-text-muted">{(rec.items?.length ?? 0)} careers</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-text-muted" />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-foreground font-[family-name:var(--font-display)]">
            <FolderOpen className="mr-1 inline h-4 w-4 text-amber-400" />
            Portfolio Items
          </h3>
          {portfolioItems.length === 0 ? (
            <p className="text-xs text-text-muted">No portfolio items yet. Start showcasing your work.</p>
          ) : (
            <div className="space-y-2">
              {portfolioItems.map((item) => (
                <div key={item.id} className="rounded-xl bg-surface/15 p-3">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-text-muted capitalize">{item.item_type.replace("_", " ")}</p>
                </div>
              ))}
            </div>
          )}
          {portfolioItems.length > 0 && (
            <button
              onClick={() => router.push("/portfolio")}
              className="mt-3 text-xs font-medium text-accent hover:text-accent-light"
            >
              View all →
            </button>
          )}
        </Card>

        <ChatStatsCard variant="dashboard" />
      </div>
    </div>
  );
}
