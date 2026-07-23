"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, getRecommendationsHistory, getPortfolioItems } from "@/lib/api";
import type { Profile } from "@/types/profile";
import type { Recommendation } from "@/types/recommendation";
import type { PortfolioItem } from "@/types/portfolio";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ChatStatsCard from "@/components/chat/ChatStatsCard";
import {
  User, Briefcase, Star, Map, FolderOpen, Shield, MessageSquare, ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getProfile().catch(() => null),
      getRecommendationsHistory(1, 3).catch(() => null),
      getPortfolioItems({ page: 1, page_size: 5 }).catch(() => null),
    ]).then(([profileRes, recsRes, portfolioRes]) => {
      if (cancelled) return;
      if (profileRes.status === "fulfilled" && profileRes.value) setProfile(profileRes.value as Profile);
      if (recsRes.status === "fulfilled" && recsRes.value) setRecommendations((recsRes.value as { items: Recommendation[] }).items || []);
      if (portfolioRes.status === "fulfilled" && portfolioRes.value) setPortfolioItems((portfolioRes.value as { items: PortfolioItem[] }).items || []);
    });
    return () => { cancelled = true; };
  }, []);

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
            className="flex flex-col items-center gap-2 rounded-2xl bg-surface/20 p-4 text-center transition-all hover:bg-surface/30"
          >
            <div className={`rounded-xl p-2.5 ${link.color}`}>{link.icon}</div>
            <span className="text-sm font-medium text-foreground">{link.label}</span>
          </button>
        ))}
      </div>

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
                    <p className="text-xs text-text-muted">{rec.items.length} careers</p>
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
