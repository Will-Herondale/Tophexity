export interface PreviousRole {
  title: string;
  company: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

export interface Certification {
  name: string;
  issuer: string;
  date_obtained: string | null;
  expiry_date: string | null;
  credential_url: string | null;
}

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
  experience_level: string | null;
  current_field: string | null;
  target_fields: string[] | null;
  skills: Record<string, string> | null;
  interests: string[] | null;
  previous_roles: PreviousRole[] | null;
  certifications: Certification[] | null;
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
  experience_level?: string | null;
  current_field?: string | null;
  target_fields?: string[] | null;
  skills?: Record<string, string> | null;
  interests?: string[] | null;
  previous_roles?: PreviousRole[] | null;
  certifications?: Certification[] | null;
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
    experience_level: null,
    current_field: null,
    target_fields: null,
    skills: null,
    interests: null,
    previous_roles: null,
    certifications: null,
    created_at: "",
    updated_at: "",
  };
}
