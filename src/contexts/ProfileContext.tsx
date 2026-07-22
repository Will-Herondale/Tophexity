"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ProfileContextType {
  selectedCareerId: string | null;
  setSelectedCareerId: (id: string | null) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);

  return (
    <ProfileContext.Provider value={{ selectedCareerId, setSelectedCareerId }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used within ProfileProvider");
  return context;
}
