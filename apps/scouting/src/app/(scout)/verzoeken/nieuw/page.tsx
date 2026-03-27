"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DeadlineBadge } from "@/components/deadline-badge";
import { LeeftijdsgroepBadge } from "@/components/leeftijdsgroep-badge";
import { logger } from "@oranje-wit/types";

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

const TYPE_INFO: Record<VerzoekType, { label: string; beschrijving: string; icon: string }> = {
  GENERIEK: {
    label: "Team beoordeling",
    beschrijving: "Beoordeel alle spelers van een team",
    icon: "👥",
  },
  SPECIFIEK: {
    label: "Individuele beoordeling",
    beschrijving: "Beoordeel 1 speler met gerichte vraag",
    icon: "👤",
  },
  VERGELIJKING: {
    label: "Vergelijking",
    beschrijving: "Vergelijk 2 of meer spelers",
    icon: "⚖️",
  },
};

const DOEL_OPTIES: { value: VerzoekDoel; label: string }[] = [
  { value: "NIVEAUBEPALING", label: "Niveaubepaling" },
  { value: "DOORSTROOM", label: "Doorstroom" },
  { value: "SELECTIE", label: "Selectie" },
  { value: "OVERIG", label: "Overig" },
];

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

    // TODO: scouts endpoint toevoegen
    // Voorlopig: lege lijst
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
    <div className="flex min-h-screen flex-col bg-surface-dark">
      {/* Header */}
      <header className="border-b border-border-subtle bg-surface-card px-4 py-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} className="text-sm text-text-muted">
            ← Annuleren
          </button>
          <h1 className="text-sm font-semibold text-text-primary">Nieuw verzoek</h1>
          <div className="w-16" />
        </div>
        {/* Progress */}
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
        <p className="mt-2 text-center text-xs text-text-muted">
          Stap {stapIndex + 1} van {STAPPEN.length}
        </p>
      </header>

      {/* Stappen */}
      <div className="flex-1 px-4 py-4">
        {/* Stap 1: Type kiezen */}
        {stap === "type" && (
          <div>
            <h2 className="text-lg font-bold text-text-primary">Wat wil je scouten?</h2>
            <div className="mt-4 space-y-3">
              {(Object.entries(TYPE_INFO) as [VerzoekType, (typeof TYPE_INFO)[VerzoekType]][]).map(
                ([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                      type === key
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-border-subtle bg-surface-card hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <p className="font-semibold text-text-primary">{info.label}</p>
                        <p className="text-xs text-text-muted">{info.beschrijving}</p>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Stap 2: Scope */}
        {stap === "scope" && type === "GENERIEK" && (
          <div>
            <h2 className="text-lg font-bold text-text-primary">Welk team?</h2>
            <p className="mt-1 text-sm text-text-muted">
              Alle spelers van dit team worden beoordeeld
            </p>
            <div className="mt-4 space-y-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    selectedTeamId === team.id
                      ? "border-orange-500 bg-orange-50"
                      : "border-border-subtle bg-surface-card"
                  }`}
                >
                  <LeeftijdsgroepBadge kleur={team.kleur} />
                  <span className="text-sm font-medium text-text-primary">{team.naam}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {stap === "scope" && (type === "SPECIFIEK" || type === "VERGELIJKING") && (
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {type === "SPECIFIEK" ? "Welke speler?" : "Welke spelers vergelijken?"}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {type === "VERGELIJKING"
                ? "Selecteer minimaal 2 spelers"
                : "Zoek en selecteer een speler"}
            </p>

            <input
              type="text"
              value={spelerZoek}
              onChange={(e) => setSpelerZoek(e.target.value)}
              placeholder="Zoek op naam..."
              className="mt-4 w-full rounded-lg border border-border-subtle px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
            />

            {/* Geselecteerde spelers */}
            {selectedSpelerIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedSpelerIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700"
                  >
                    {id}
                    <button
                      type="button"
                      onClick={() => toggleSpeler(id)}
                      className="ml-1 text-orange-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Zoekresultaten */}
            <div className="mt-3 space-y-2">
              {spelers.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSpeler(s.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                    selectedSpelerIds.includes(s.id)
                      ? "border-orange-500 bg-orange-50"
                      : "border-border-subtle bg-surface-card"
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {s.roepnaam.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {s.roepnaam} {s.achternaam}
                    </p>
                    <p className="text-xs text-text-muted">{s.team}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stap 3: Details */}
        {stap === "details" && (
          <div>
            <h2 className="text-lg font-bold text-text-primary">Details</h2>

            <div className="mt-4 space-y-4">
              {/* Doel */}
              <div>
                <label className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                  Doel
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DOEL_OPTIES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDoel(opt.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        doel === opt.value
                          ? "bg-orange-500 text-white"
                          : "border border-border-subtle bg-surface-card text-text-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toelichting */}
              <div>
                <label className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                  Toelichting voor de scout
                </label>
                <textarea
                  value={toelichting}
                  onChange={(e) => setToelichting(e.target.value)}
                  rows={3}
                  placeholder="Waar moet de scout op letten? Specifieke aandachtspunten..."
                  className="mt-2 w-full rounded-lg border border-border-subtle px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                  Deadline (optioneel)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border-subtle px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
                />
                {deadline && <DeadlineBadge deadline={deadline} />}
              </div>
            </div>
          </div>
        )}

        {/* Stap 4: Scouts toewijzen */}
        {stap === "scouts" && (
          <div>
            <h2 className="text-lg font-bold text-text-primary">Scouts toewijzen</h2>
            <p className="mt-1 text-sm text-text-muted">
              Kies welke scouts dit verzoek moeten uitvoeren (optioneel)
            </p>

            <div className="mt-4 space-y-2">
              {scouts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <p className="text-sm text-text-muted">Nog geen scouts beschikbaar</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Scouts worden aangemaakt zodra ze voor het eerst inloggen
                  </p>
                </div>
              ) : (
                scouts.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleScout(s.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                      selectedScoutIds.includes(s.id)
                        ? "border-orange-500 bg-orange-50"
                        : "border-border-subtle bg-surface-card"
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-text-secondary">
                      {s.naam.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{s.naam}</p>
                      <p className="text-xs text-text-muted">{s.email}</p>
                    </div>
                    {selectedScoutIds.includes(s.id) && (
                      <svg
                        className="ml-auto h-5 w-5 text-orange-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Foutmelding */}
      {fout && (
        <div className="mx-4 mb-2 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700">{fout}</div>
      )}

      {/* Navigatie */}
      <div className="border-t border-border-subtle bg-surface-card p-4">
        <div className="flex gap-3">
          {stapIndex > 0 && (
            <button
              type="button"
              onClick={vorigeStap}
              className="flex-1 rounded-xl border border-border-subtle px-4 py-3 text-sm font-semibold text-text-secondary"
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
