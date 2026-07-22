export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  education_level: string | null;
  years_experience: number | null;
  current_field: string | null;
  target_fields: string[] | null;
  skills: Record<string, string> | null;
  interests: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileCreatePayload {
  full_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  avatar_url?: string | null;
  education_level?: string | null;
  years_experience?: number | null;
  current_field?: string | null;
  target_fields?: string[] | null;
  skills?: Record<string, string> | null;
  interests?: string[] | null;
}

export type ProfileUpdatePayload = ProfileCreatePayload;

export interface ProfileVersion {
  id: string;
  version_number: number;
  snapshot: Record<string, unknown>;
}

export function createEmptyProfile(): Profile {
  return {
    id: "",
    user_id: "",
    full_name: null,
    headline: null,
    bio: null,
    location: null,
    avatar_url: null,
    education_level: null,
    years_experience: null,
    current_field: null,
    target_fields: null,
    skills: null,
    interests: null,
    created_at: "",
    updated_at: "",
  };
}
