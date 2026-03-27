"use client";

import { useState, useCallback } from "react";
import { logger } from "@oranje-wit/types";

/**
 * Draft/pauze systeem voor beoordelingen.
 *
 * Slaat scores tussentijds op in localStorage zodat een scout
 * een beoordeling kan pauzeren en later hervatten.
 *
 * Key: `ow-scout-draft-{verzoekId}-{relCode}`
 * Drafts verlopen na 7 dagen.
 */

interface DraftData {
  verzoekId: string;
  relCode: string;
  stap: number;
  scores: Record<string, number>;
  relatie: string;
  context: string;
  contextDetail?: string;
  opmerking?: string;
  laatsteUpdate: string; // ISO date
}

const DRAFT_PREFIX = "ow-scout-draft-";
const DRAFT_EXPIRY_DAYS = 7;

function getDraftKey(verzoekId: string, relCode: string): string {
  return `${DRAFT_PREFIX}${verzoekId}-${relCode}`;
}

function isExpired(draft: DraftData): boolean {
  const laatsteUpdate = new Date(draft.laatsteUpdate);
  const now = new Date();
  const diffDays = (now.getTime() - laatsteUpdate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > DRAFT_EXPIRY_DAYS;
}

export function useDraft(verzoekId: string, relCode: string) {
  const key = getDraftKey(verzoekId, relCode);

  const [draft, setDraftState] = useState<DraftData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as DraftData;
      if (isExpired(parsed)) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed;
    } catch (error) {
      logger.info("Draft laden uit localStorage mislukt:", error);
      return null;
    }
  });

  const saveDraft = useCallback(
    (update: Partial<Omit<DraftData, "verzoekId" | "relCode" | "laatsteUpdate">>) => {
      const newDraft: DraftData = {
        verzoekId,
        relCode,
        stap: update.stap ?? draft?.stap ?? 0,
        scores: update.scores ?? draft?.scores ?? {},
        relatie: update.relatie ?? draft?.relatie ?? "GEEN",
        context: update.context ?? draft?.context ?? "",
        contextDetail: update.contextDetail ?? draft?.contextDetail,
        opmerking: update.opmerking ?? draft?.opmerking,
        laatsteUpdate: new Date().toISOString(),
      };

      try {
        localStorage.setItem(key, JSON.stringify(newDraft));
        setDraftState(newDraft);
      } catch (error) {
        logger.info("Draft opslaan in localStorage mislukt:", error);
      }
    },
    [key, verzoekId, relCode, draft]
  );

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.info("Draft verwijderen uit localStorage mislukt:", error);
    }
    setDraftState(null);
  }, [key]);

  const hasDraft = draft !== null;

  return { draft, hasDraft, saveDraft, clearDraft };
}

/**
 * Haal alle actieve drafts op (voor het dashboard).
 * Retourneert een lijst van niet-verlopen drafts.
 */
export function getAllDrafts(): DraftData[] {
  if (typeof window === "undefined") return [];

  const drafts: DraftData[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(DRAFT_PREFIX)) continue;

      const stored = localStorage.getItem(k);
      if (!stored) continue;

      const parsed = JSON.parse(stored) as DraftData;
      if (isExpired(parsed)) {
        localStorage.removeItem(k);
        continue;
      }
      drafts.push(parsed);
    }
  } catch (error) {
    logger.info("Drafts ophalen uit localStorage mislukt:", error);
  }

  return drafts.sort(
    (a, b) => new Date(b.laatsteUpdate).getTime() - new Date(a.laatsteUpdate).getTime()
  );
}
