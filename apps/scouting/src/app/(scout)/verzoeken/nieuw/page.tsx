"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@oranje-wit/types";
import {
  StapType,
  StapScopeTeam,
  StapScopeSpelers,
  StapDetails,
  StapScouts,
} from "./verzoek-stappen";

type VerzoekType = "GENERIEK" | "SPECIFIEK" | "VERGELIJKING";
type VerzoekDoel = "DOORSTROOM" | "SELECTIE" | "NIVEAUBEPALING" | "OVERIG";

interface TeamOptie {
  id: number;
  naam: string;
  kleur: string;
}

interface SpelerOptie {
  id: string;
  roepnaam: string;
  achternaam: string;
  team: string;
  kleur: string;
}

interface ScoutOptie {
  id: string;
  naam: string;
  email: string;
}

type Stap = "type" | "scope" | "details" | "scouts";
const STAPPEN: Stap[] = ["type", "scope", "details", "scouts"];

export default function NieuwVerzoekPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [stap, setStap] = useState<Stap>("type");
  const [type, setType] = useState<VerzoekType | null>(null);
  const [doel, setDoel] = useState<VerzoekDoel>("NIVEAUBEPALING");
  const [toelichting, setToelichting] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSpelerIds, setSelectedSpelerIds] = useState<string[]>([]);
  const [selectedScoutIds, setSelectedScoutIds] = useState<string[]>([]);
  const [spelerZoek, setSpelerZoek] = useState("");

  // Data
  const [teams, setTeams] = useState<TeamOptie[]>([]);
  const [spelers, setSpelers] = useState<SpelerOptie[]>([]);
  const [scouts, setScouts] = useState<ScoutOptie[]>([]);
  const [fout, setFout] = useState<string | null>(null);

  const stapIndex = STAPPEN.indexOf(stap);

  // Laad teams en scouts bij mount
  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((d) => setTeams(d.data?.teams ?? d.data ?? []))
      .catch((error) => {
        logger.warn("Teams ophalen mislukt:", error);
      });
  }, []);

  // Zoek spelers bij typen
  useEffect(() => {
    if (spelerZoek.length < 2) {
      setSpelers([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/spelers/zoek?q=${encodeURIComponent(spelerZoek)}`)
        .then((r) => r.json())
        .then((d) => {
          const results = d.data ?? [];
          setSpelers(
            results.map((s: any) => ({
              id: s.id ?? s.relCode,
              roepnaam: s.roepnaam,
              achternaam: s.achternaam,
              team: s.team ?? "",
              kleur: s.kleur ?? "blauw",
            }))
          );
        })
        .catch((error) => {
          logger.warn("Spelers zoeken mislukt:", error);
        });
    }, 300);
    return () => clearTimeout(timeout);
  }, [spelerZoek]);

  const toggleSpeler = useCallback((id: string) => {
    setSelectedSpelerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleScout = useCallback((id: string) => {
    setSelectedScoutIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const volgendeStap = useCallback(() => {
    const volgende = STAPPEN[stapIndex + 1];
    if (volgende) setStap(volgende);
  }, [stapIndex]);

  const vorigeStap = useCallback(() => {
    const vorige = STAPPEN[stapIndex - 1];
    if (vorige) setStap(vorige);
  }, [stapIndex]);

  const handleAanmaken = useCallback(async () => {
    if (!type) return;
    setFout(null);

    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          type,
          doel,
          toelichting: toelichting || undefined,
          deadline: deadline || undefined,
          seizoen: "2025-2026",
        };

        if (type === "GENERIEK" && selectedTeamId) {
          body.teamId = String(selectedTeamId);
        }
        if ((type === "SPECIFIEK" || type === "VERGELIJKING") && selectedSpelerIds.length > 0) {
          body.spelerIds = selectedSpelerIds;
        }
        if (selectedScoutIds.length > 0) {
          body.scoutIds = selectedScoutIds;
        }

        const res = await fetch("/api/verzoeken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!data.ok) {
          setFout(data.error?.message ?? "Aanmaken mislukt");
          return;
        }

        router.push(`/verzoeken/${data.data.id}`);
      } catch (error) {
        logger.error("Fout bij aanmaken verzoek:", error);
        setFout("Kon verzoek niet aanmaken. Probeer het opnieuw.");
      }
    });
  }, [
    type,
    doel,
    toelichting,
    deadline,
    selectedTeamId,
    selectedSpelerIds,
    selectedScoutIds,
    router,
  ]);

  const kanDoorgaan =
    (stap === "type" && type !== null) ||
    (stap === "scope" &&
      ((type === "GENERIEK" && selectedTeamId !== null) ||
        (type === "SPECIFIEK" && selectedSpelerIds.length >= 1) ||
        (type === "VERGELIJKING" && selectedSpelerIds.length >= 2))) ||
    stap === "details" ||
    stap === "scouts";

  return (
    <div className="bg-surface-dark flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-border-subtle bg-surface-card border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="text-text-muted text-sm">
            ← Annuleren
          </button>
          <h1 className="text-text-primary text-sm font-semibold">Nieuw verzoek</h1>
          <div className="w-16" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          {STAPPEN.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= stapIndex ? "bg-orange-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-text-muted mt-2 text-center text-xs">
          Stap {stapIndex + 1} van {STAPPEN.length}
        </p>
      </header>

      {/* Stappen */}
      <div className="flex-1 px-4 py-4">
        {stap === "type" && <StapType type={type} onTypeChange={setType} />}

        {stap === "scope" && type === "GENERIEK" && (
          <StapScopeTeam
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelectTeam={setSelectedTeamId}
          />
        )}

        {stap === "scope" && (type === "SPECIFIEK" || type === "VERGELIJKING") && (
          <StapScopeSpelers
            type={type}
            spelerZoek={spelerZoek}
            onZoekChange={setSpelerZoek}
            selectedSpelerIds={selectedSpelerIds}
            onToggleSpeler={toggleSpeler}
            spelers={spelers}
          />
        )}

        {stap === "details" && (
          <StapDetails
            doel={doel}
            onDoelChange={setDoel}
            toelichting={toelichting}
            onToelichtingChange={setToelichting}
            deadline={deadline}
            onDeadlineChange={setDeadline}
          />
        )}

        {stap === "scouts" && (
          <StapScouts
            scouts={scouts}
            selectedScoutIds={selectedScoutIds}
            onToggleScout={toggleScout}
          />
        )}
      </div>

      {/* Foutmelding */}
      {fout && (
        <div className="mx-4 mb-2 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700">{fout}</div>
      )}

      {/* Navigatie */}
      <div className="border-border-subtle bg-surface-card border-t p-4">
        <div className="flex gap-3">
          {stapIndex > 0 && (
            <button
              type="button"
              onClick={vorigeStap}
              className="border-border-subtle text-text-secondary flex-1 rounded-xl border px-4 py-3 text-sm font-semibold"
            >
              Vorige
            </button>
          )}

          {stap === "scouts" ? (
            <button
              type="button"
              onClick={handleAanmaken}
              disabled={isPending}
              className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? "Aanmaken..." : "Verzoek aanmaken"}
            </button>
          ) : (
            <button
              type="button"
              onClick={volgendeStap}
              disabled={!kanDoorgaan}
              className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Volgende
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
