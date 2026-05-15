"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { InspectionStage } from "@/types";

interface InspectionDraft {
  stage: InspectionStage | null;
  room: string;
  notes: string;
  photos: File[];
}

interface InspectionContextValue {
  draft: InspectionDraft;
  setStage: (stage: InspectionStage) => void;
  setRoom: (room: string) => void;
  setNotes: (notes: string) => void;
  setPhotos: (photos: File[]) => void;
  reset: () => void;
}

const defaultDraft: InspectionDraft = {
  stage: null,
  room: "",
  notes: "",
  photos: [],
};

const InspectionContext = createContext<InspectionContextValue | null>(null);

export function InspectionProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<InspectionDraft>(defaultDraft);

  return (
    <InspectionContext.Provider
      value={{
        draft,
        setStage: (stage) => setDraft((d) => ({ ...d, stage })),
        setRoom: (room) => setDraft((d) => ({ ...d, room })),
        setNotes: (notes) => setDraft((d) => ({ ...d, notes })),
        setPhotos: (photos) => setDraft((d) => ({ ...d, photos })),
        reset: () => setDraft(defaultDraft),
      }}
    >
      {children}
    </InspectionContext.Provider>
  );
}

export function useInspection() {
  const ctx = useContext(InspectionContext);
  if (!ctx) throw new Error("useInspection must be used within InspectionProvider");
  return ctx;
}
