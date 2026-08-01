"use client";

import type { Profile } from "@/types/profile";
import { EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/lib/constants";
import Card from "@/components/ui/Card";
import {
  MapPin, GraduationCap, Wrench, Heart, Award, Building, Calendar,
  Link as LinkIcon, Target, Briefcase,
} from "lucide-react";

function SectionHeader({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</span>
      <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">{label}</h3>
      {count !== undefined && count > 0 && (
        <span className="ml-auto rounded-full bg-surface-light px-2.5 py-0.5 text-xs font-medium text-text-secondary">
          {count}
        </span>
      )}
    </div>
  );
}

function Avatar({ profile }: { profile: Profile }) {
  const initials = (profile.full_name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (profile.avatar_url) {
    if (profile.avatar_url.length <= 2 && /\p{Emoji}/u.test(profile.avatar_url)) {
      return (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 text-5xl ring-4 ring-background">
          {profile.avatar_url}
        </div>
      );
    }
    return (
      <img src={profile.avatar_url} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-4 ring-background" />
    );
  }

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-light text-3xl font-bold text-white shadow-lg shadow-accent/25 ring-4 ring-background">
      {initials}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex min-w-0 items-start gap-3.5 rounded-2xl border border-border bg-surface/20 p-4 transition-colors hover:bg-surface/30">
      <div className="shrink-0 rounded-xl bg-accent/10 p-2.5 text-accent">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SkillBadge({ name, level }: { name: string; level: string }) {
  const levelColors: Record<string, string> = {
    beginner: "bg-emerald-500/10 text-emerald-400",
    intermediate: "bg-amber-500/10 text-amber-400",
    advanced: "bg-orange-500/10 text-orange-400",
    expert: "bg-red-500/10 text-red-400",
  };
  const color = levelColors[level.toLowerCase()] || "bg-accent/15 text-accent";
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${color}`}>
      <span className="min-w-0 break-words">{name}</span>
      <span className="shrink-0 text-[10px] capitalize opacity-70">{level}</span>
    </span>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
      <span className="min-w-0 break-words">{label}</span>
    </span>
  );
}

function TimelineDot() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="h-2.5 w-2.5 rounded-full border-2 border-accent bg-background" />
    </div>
  );
}

export default function ProfileView({ profile }: { profile: Profile }) {
  const eduLabel = EDUCATION_LEVELS.find((e) => e.value === profile.education_level)?.label || profile.education_level;
  const expLabel = EXPERIENCE_LEVELS.find((e) => e.value === profile.experience_level)?.label || profile.experience_level;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/20 shadow-sm">
        <div className="h-24 bg-gradient-to-r from-accent/25 via-accent/10 to-transparent sm:h-28" />
        <div className="relative -mt-14 px-5 pb-6 sm:-mt-16 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <Avatar profile={profile} />
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="break-words font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
                {profile.full_name || "No name set"}
              </h2>
              {profile.headline && (
                <p className="mt-1 break-words text-sm text-text-secondary">{profile.headline}</p>
              )}
              {profile.location && (
                <p className="mt-1.5 flex items-start gap-1.5 text-xs text-text-muted">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 break-words">{profile.location}</span>
                </p>
              )}
            </div>
          </div>
          {profile.bio && (
            <p className="mt-5 max-w-3xl break-words text-sm leading-relaxed text-text-secondary">{profile.bio}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Education" value={eduLabel} />
        <StatCard icon={<Briefcase className="h-5 w-5" />} label="Experience Level" value={expLabel} />
        <StatCard icon={<Calendar className="h-5 w-5" />} label="Years of Experience" value={profile.years_experience} />
        <StatCard icon={<Target className="h-5 w-5" />} label="Current Field" value={profile.current_field} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <SectionHeader
            icon={<Target className="h-3.5 w-3.5" />}
            label="Target Fields"
            count={profile.target_fields ? Object.keys(profile.target_fields).length : undefined}
          />
          {profile.target_fields && Object.keys(profile.target_fields).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.target_fields).map(([field]) => (
                <TagPill key={field} label={field} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No target fields set</p>
          )}
        </Card>

        <Card>
          <SectionHeader
            icon={<Heart className="h-3.5 w-3.5" />}
            label="Interests"
            count={profile.interests ? Object.keys(profile.interests).length : undefined}
          />
          {profile.interests && Object.keys(profile.interests).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.interests).map(([interest]) => (
                <TagPill key={interest} label={interest} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No interests added</p>
          )}
        </Card>
      </div>

      {(profile.skills && Object.keys(profile.skills).length > 0) && (
        <Card>
          <SectionHeader
            icon={<Wrench className="h-3.5 w-3.5" />}
            label="Skills"
            count={Object.keys(profile.skills).length}
          />
          <div className="flex flex-wrap gap-2">
            {Object.entries(profile.skills).map(([name, level]) => (
              <SkillBadge key={name} name={name} level={level} />
            ))}
          </div>
        </Card>
      )}

      {profile.previous_roles && profile.previous_roles.length > 0 && (
        <Card>
          <SectionHeader
            icon={<Building className="h-3.5 w-3.5" />}
            label="Work Experience"
            count={profile.previous_roles.length}
          />
          <div className="relative">
            {profile.previous_roles.map((role, idx) => (
              <div key={idx} className="relative flex gap-5 pb-7 last:pb-0">
                {idx < (profile.previous_roles?.length ?? 0) - 1 && (
                  <div className="absolute left-[7px] top-4 h-full w-0.5 bg-border" />
                )}
                <div className="mt-1.5 shrink-0">
                  <TimelineDot />
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface/15 p-4 transition-colors hover:bg-surface/25 sm:p-5">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-foreground">{role.title}</p>
                      {role.company && (
                        <p className="mt-0.5 break-words text-xs text-text-secondary">{role.company}</p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-text-muted">
                      <Calendar className="-mt-0.5 mr-1 inline h-3 w-3" />
                      {role.start_date || "N/A"} — {role.end_date || "Present"}
                    </p>
                  </div>
                  {role.description && (
                    <p className="mt-2.5 break-words text-xs leading-relaxed text-text-secondary">{role.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {profile.certifications && profile.certifications.length > 0 && (
        <Card>
          <SectionHeader
            icon={<Award className="h-3.5 w-3.5" />}
            label="Certifications"
            count={profile.certifications.length}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {profile.certifications.map((cert, idx) => (
              <div key={idx} className="min-w-0 rounded-xl border border-border bg-surface/15 p-4 transition-colors hover:bg-surface/25 sm:p-5">
                <p className="break-words text-sm font-medium text-foreground">{cert.name}</p>
                {cert.issuer && (
                  <p className="mt-0.5 break-words text-xs text-text-secondary">{cert.issuer}</p>
                )}
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  {cert.date_obtained && (
                    <p className="break-words text-xs text-text-muted">{cert.date_obtained}</p>
                  )}
                  {cert.credential_url && (
                    <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs text-accent hover:text-accent-light">
                      <LinkIcon className="h-3 w-3" />
                      Verify
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
