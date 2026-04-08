"use client";

import { useState, useCallback, useMemo } from "react";
import type { TeamData } from "../types";
import { createWhatIf } from "@/app/(teamindeling-studio)/ti-studio/indeling/whatif-actions";
import { logger } from "@oranje-wit/types";

interface WhatIfStartDialoogProps {
  open: boolean;
  werkindelingId: string;
  teams: TeamData[];
  onClose: () => void;
  onCreated: () => void;
}

type TeamCategorie = TeamData["categorie"];

const CATEGORIE_LABELS: Record<string, string> = {
  B_CATEGORIE: "B-categorie",
  A_CATEGORIE: "A-categorie",
  SENIOREN: "Senioren",
};

export default function WhatIfStartDialoog({
  open,
  werkindelingId,
  teams,
  onClose,
  onCreated,
}: WhatIfStartDialoogProps) {
  const [vraag, setVraag] = useState("");
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set());
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  const groepenPerCategorie = useMemo(() => {
    const map = new Map<string, TeamData[]>();
    for (const team of teams) {
      const cat = team.categorie as string;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(team);
    }
    return map;
  }, [teams]);

  const toggleTeam = useCallback((id: string) => {
    setGeselecteerd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAlleInCategorie = useCallback(
    (cat: string) => {
      const teamIds = (groepenPerCategorie.get(cat) ?? []).map((t) => t.id);
      const alleGeselecteerd = teamIds.every((id) => geselecteerd.has(id));
      setGeselecteerd((prev) => {
        const next = new Set(prev);
        if (alleGeselecteerd) {
          teamIds.forEach((id) => next.delete(id));
        } else {
          teamIds.forEach((id) => next.add(id));
        }
        return next;
      });
    },
    [groepenPerCategorie, geselecteerd]
  );

  const kanSubmit = vraag.trim().length > 0 && geselecteerd.size > 0;

  const handleSubmit = useCallback(async () => {
    if (!kanSubmit || bezig) return;
    setBezig(true);
    setFout(null);
    try {
      await createWhatIf(werkindelingId, {
        vraag: vraag.trim(),
        teamIds: Array.from(geselecteerd),
      });
      setVraag("");
      setGeselecteerd(new Set());
      onCreated();
      onClose();
    } catch (error) {
      logger.warn("What-if aanmaken mislukt:", error);
      setFout(error instanceof Error ? error.message : "Onbekende fout");
    } finally {
      setBezig(false);
    }
  }, [kanSubmit, bezig, werkindelingId, vraag, geselecteerd, onCreated, onClose]);

  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div
        className="dialog-panel w-full max-w-md"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Nieuwe what-if</h3>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            Stel een vraag en selecteer de teams waarop je de what-if uitvoert.
          </p>
        </div>

        <div className="dialog-body">
          {/* Vraag */}
          <div>
            <label
              htmlFor="whatif-vraag"
              className="mb-1 block text-sm font-medium text-[var(--text-primary)]"
            >
              Vraag <span className="text-red-500">*</span>
            </label>
            <textarea
              id="whatif-vraag"
              value={vraag}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVraag(e.target.value)}
              placeholder="Bijv. Wat als we Sen-1 en Sen-2 omdraaien?"
              rows={3}
              className="input resize-none"
              autoFocus
            />
          </div>

          {/* Team-selectie */}
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
              Teams <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-[var(--text-secondary)]">
                ({geselecteerd.size} geselecteerd)
              </span>
            </p>

            {teams.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">Geen teams beschikbaar.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-[var(--border-default)]">
                {Array.from(groepenPerCategorie.entries()).map(([cat, catTeams]) => {
                  const alleGeselecteerd = catTeams.every((t) => geselecteerd.has(t.id));
                  const gedeeltelijk =
                    !alleGeselecteerd && catTeams.some((t) => geselecteerd.has(t.id));

                  return (
                    <div key={cat}>
                      {/* Categorie-header */}
                      <button
                        type="button"
                        onClick={() => toggleAlleInCategorie(cat)}
                        className="flex w-full items-center gap-2 border-b border-[var(--border-default)] px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)]"
                        style={{ background: "var(--surface-sunken)" }}
                      >
                        <span
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[10px] ${
                            alleGeselecteerd
                              ? "border-orange-500 bg-orange-500 text-white"
                              : gedeeltelijk
                                ? "border-orange-400 bg-orange-100 text-orange-600"
                                : "border-[var(--border-default)]"
                          }`}
                          style={
                            !alleGeselecteerd && !gedeeltelijk
                              ? { background: "var(--surface-card)" }
                              : undefined
                          }
                        >
                          {alleGeselecteerd && "✓"}
                          {gedeeltelijk && "–"}
                        </span>
                        {CATEGORIE_LABELS[cat] ?? cat}
                        <span className="ml-auto font-normal text-[var(--text-secondary)]">
                          {catTeams.length} teams
                        </span>
                      </button>

                      {/* Teams */}
                      {catTeams.map((team) => {
                        const aan = geselecteerd.has(team.id);
                        return (
                          <label
                            key={team.id}
                            className="flex cursor-pointer items-center gap-2 border-b border-[var(--border-default)] px-4 py-2 text-sm last:border-b-0"
                            style={{
                              background: aan ? "rgba(255,107,0,0.12)" : "var(--surface-card)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={aan}
                              onChange={() => toggleTeam(team.id)}
                              className="h-3.5 w-3.5 accent-orange-500"
                            />
                            <span
                              className={
                                aan ? "font-medium text-orange-400" : "text-[var(--text-primary)]"
                              }
                            >
                              {team.naam}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {fout && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{fout}</p>}
        </div>

        <div className="dialog-footer">
          <button onClick={onClose} className="btn-ghost" disabled={bezig}>
            Annuleren
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={!kanSubmit || bezig}
            className="btn-primary"
          >
            {bezig ? "Aanmaken..." : "Start what-if"}
          </button>
        </div>
      </div>
    </div>
  );
}
