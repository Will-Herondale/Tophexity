"use client";

import type { Profile } from "@/types/profile";
import { EDUCATION_LEVELS } from "@/lib/constants";
import Card from "@/components/ui/Card";
import { User, MapPin, Briefcase, GraduationCap, Wrench, Heart } from "lucide-react";

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-gray-400 dark:text-gray-500">{icon}</span>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

function SkillBadge({ name, level }: { name: string; level: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
      {name}
      <span className="text-[10px] capitalize text-indigo-400 dark:text-indigo-500">{level}</span>
    </span>
  );
}

export default function ProfileView({ profile }: { profile: Profile }) {
  const eduLabel = EDUCATION_LEVELS.find((e) => e.value === profile.education_level)?.label || profile.education_level;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
              {profile.full_name?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.full_name || "No name set"}</h2>
            {profile.headline && <p className="text-sm text-gray-500 dark:text-gray-400">{profile.headline}</p>}
            {profile.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <MapPin className="h-3 w-3" /> {profile.location}
              </p>
            )}
          </div>
        </div>
        {profile.bio && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed dark:text-gray-300">{profile.bio}</p>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Details</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Education Level" value={eduLabel} />
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Years of Experience" value={profile.years_experience} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Current Field" value={profile.current_field} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Target Fields</h3>
          {profile.target_fields && profile.target_fields.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.target_fields.map((field) => (
                <span key={field} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {field}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No target fields set</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <Wrench className="mr-1 inline h-4 w-4" />
            Skills
          </h3>
          {profile.skills && Object.keys(profile.skills).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.skills).map(([name, level]) => (
                <SkillBadge key={name} name={name} level={level} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No skills added</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <Heart className="mr-1 inline h-4 w-4" />
            Interests
          </h3>
          {profile.interests && profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span key={interest} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">No interests added</p>
          )}
        </Card>
      </div>
    </div>
  );
}
