"use client";

import type { Profile } from "@/types/profile";
import { EDUCATION_LEVELS, EXPERIENCE_LEVELS } from "@/lib/constants";
import Card from "@/components/ui/Card";
import { User, MapPin, Briefcase, GraduationCap, Wrench, Heart, Award, Building } from "lucide-react";

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-accent">{icon}</span>
      <div>
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

function SkillBadge({ name, level }: { name: string; level: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
      {name}
      <span className="text-[10px] capitalize text-accent/60">{level}</span>
    </span>
  );
}

export default function ProfileView({ profile }: { profile: Profile }) {
  const eduLabel = EDUCATION_LEVELS.find((e) => e.value === profile.education_level)?.label || profile.education_level;
  const expLabel = EXPERIENCE_LEVELS.find((e) => e.value === profile.experience_level)?.label || profile.experience_level;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            profile.avatar_url.length <= 2 && /\p{Emoji}/u.test(profile.avatar_url) ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-4xl">
                {profile.avatar_url}
              </div>
            ) : (
              <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            )
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-xl font-bold text-accent">
              {profile.full_name?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground">{profile.full_name || "No name set"}</h2>
            {profile.headline && <p className="text-sm text-text-secondary">{profile.headline}</p>}
            {profile.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                <MapPin className="h-3 w-3" /> {profile.location}
              </p>
            )}
          </div>
        </div>
        {profile.bio && (
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">{profile.bio}</p>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">Details</h3>
          <div className="divide-y divide-border">
            <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Education Level" value={eduLabel} />
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Experience Level" value={expLabel} />
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Years of Experience" value={profile.years_experience} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Current Field" value={profile.current_field} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">Target Fields</h3>
          {profile.target_fields && profile.target_fields.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.target_fields.map((field) => (
                <span key={field} className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                  {field}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No target fields set</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
            <Wrench className="mr-1 inline h-4 w-4 text-accent" />
            Skills
          </h3>
          {profile.skills && Object.keys(profile.skills).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.skills).map(([name, level]) => (
                <SkillBadge key={name} name={name} level={level} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No skills added</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
            <Heart className="mr-1 inline h-4 w-4 text-accent" />
            Interests
          </h3>
          {profile.interests && profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No interests added</p>
          )}
        </Card>
      </div>

      {profile.previous_roles && profile.previous_roles.length > 0 && (
        <Card>
          <h3 className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
            <Building className="mr-1 inline h-4 w-4 text-accent" />
            Work Experience
          </h3>
          <div className="space-y-4">
            {profile.previous_roles.map((role, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-surface/20 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{role.title}</p>
                    <p className="text-xs text-text-secondary">{role.company}</p>
                  </div>
                  <p className="text-xs text-text-muted">
                    {role.start_date || "N/A"} — {role.end_date || "Present"}
                  </p>
                </div>
                {role.description && (
                  <p className="mt-2 text-xs text-text-secondary">{role.description}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {profile.certifications && profile.certifications.length > 0 && (
        <Card>
          <h3 className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
            <Award className="mr-1 inline h-4 w-4 text-accent" />
            Certifications
          </h3>
          <div className="space-y-3">
            {profile.certifications.map((cert, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-border bg-surface/20 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{cert.name}</p>
                  <p className="text-xs text-text-secondary">{cert.issuer}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">{cert.date_obtained || ""}</p>
                  {cert.credential_url && (
                    <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-accent-light">
                      View Credential
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
