"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@oranje-wit/types";

// ─── Types ───

interface ScoutData {
  id: string;
  naam: string;
  email: string;
  rol: "SCOUT" | "TC";
  vrijScouten: boolean;
  xp: number;
  level: number;
  aantalRapporten: number;
}

// ─── Helpers ───

function getInitialen(naam: string): string {
  return naam
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const LEVEL_NAMEN: Record<number, string> = {
  1: "Starter",
  2: "Verkenner",
  3: "Speurder",
  4: "Analist",
  5: "Expert",
};

// ─── Component ───

export default function ScoutsPage() {
  const router = useRouter();
  const [scouts, setScouts] = useState<ScoutData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTC, setIsTC] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const laadData = useCallback(async () => {
    try {
      // Check of gebruiker TC is
      const profielRes = await fetch("/api/scouting/scout/profiel");
      if (profielRes.ok) {
        const profiel = await profielRes.json();
        const rol = profiel.data?.scout?.rol;
        if (rol !== "TC") {
          router.replace("/verzoeken");
          return;
        }
        setIsTC(true);
      } else {
        router.replace("/verzoeken");
        return;
      }

      // Haal scouts op
      const res = await fetch("/api/scouting/scouts");
      if (!res.ok) throw new Error("Scouts ophalen mislukt");
      const data = await res.json();
      setScouts(data.data ?? []);
    } catch (error) {
      logger.warn("Fout bij laden scouts:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    laadData();
  }, [laadData]);

  const toggleVrijScouten = async (scoutId: string, nieuweWaarde: boolean) => {
    // Optimistic update
    setScouts((prev) =>
      prev.map((s) => (s.id === scoutId ? { ...s, vrijScouten: nieuweWaarde } : s))
    );
    setToggling((prev) => new Set(prev).add(scoutId));

    try {
      const res = await fetch(`/api/scouting/scouts/${scoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vrijScouten: nieuweWaarde }),
      });

      if (!res.ok) {
        // Rollback bij fout
        setScouts((prev) =>
          prev.map((s) => (s.id === scoutId ? { ...s, vrijScouten: !nieuweWaarde } : s))
        );
        logger.warn("VrijScouten toggle mislukt");
      }
    } catch (error) {
      // Rollback
      setScouts((prev) =>
        prev.map((s) => (s.id === scoutId ? { ...s, vrijScouten: !nieuweWaarde } : s))
      );
      logger.warn("VrijScouten toggle fout:", error);
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(scoutId);
        return next;
      });
    }
  };

  if (loading) {
    return <ScoutsSkeleton />;
  }

  if (!isTC) return null;

  const tcScouts = scouts.filter((s) => s.rol === "TC");
  const reguliereScouts = scouts.filter((s) => s.rol === "SCOUT");

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-text-primary text-xl font-bold">Scouts</h1>
            <p className="text-text-muted mt-0.5 text-sm">
              {scouts.length} {scouts.length === 1 ? "scout" : "scouts"} geregistreerd
            </p>
          </div>
          <div className="bg-surface-card flex h-10 w-10 items-center justify-center rounded-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="text-text-secondary h-5 w-5"
              strokeWidth={1.5}
            >
              <path
                d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                stroke="currentColor"
                strokeLinecap="round"
              />
              <circle cx="9" cy="7" r="4" stroke="currentColor" />
              <path
                d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                stroke="currentColor"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-4">
        {/* TC-leden */}
        {tcScouts.length > 0 && (
          <section>
            <h2 className="text-text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              TC-leden ({tcScouts.length})
            </h2>
            <div className="space-y-3">
              {tcScouts.map((scout) => (
                <ScoutKaart
                  key={scout.id}
                  scout={scout}
                  onToggleVrijScouten={toggleVrijScouten}
                  isToggling={toggling.has(scout.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Reguliere scouts */}
        {reguliereScouts.length > 0 && (
          <section>
            <h2 className="text-text-muted mb-2 text-xs font-semibold tracking-wide uppercase">
              Scouts ({reguliereScouts.length})
            </h2>
            <div className="space-y-3">
              {reguliereScouts.map((scout) => (
                <ScoutKaart
                  key={scout.id}
                  scout={scout}
                  onToggleVrijScouten={toggleVrijScouten}
                  isToggling={toggling.has(scout.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Lege staat */}
        {scouts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-surface-card mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="text-text-muted h-8 w-8"
                strokeWidth={1.5}
              >
                <path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  stroke="currentColor"
                  strokeLinecap="round"
                />
                <circle cx="9" cy="7" r="4" stroke="currentColor" />
                <path d="M20 8v6M23 11h-6" stroke="currentColor" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-text-primary text-sm font-medium">Geen scouts</p>
            <p className="text-text-muted mt-1 text-xs">
              Er zijn nog geen scouts geregistreerd in het systeem
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scout Kaart ───

function ScoutKaart({
  scout,
  onToggleVrijScouten,
  isToggling,
}: {
  scout: ScoutData;
  onToggleVrijScouten: (id: string, waarde: boolean) => void;
  isToggling: boolean;
}) {
  const initialen = getInitialen(scout.naam);
  const levelNaam = LEVEL_NAMEN[scout.level] ?? `Level ${scout.level}`;

  return (
    <div className="bg-surface-card rounded-2xl border border-gray-700 p-4">
      {/* Bovenste rij: avatar + naam + rol badge */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="from-ow-oranje/30 to-ow-oranje/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br">
          <span className="text-ow-oranje text-sm font-bold">{initialen}</span>
        </div>

        {/* Naam en email */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-text-primary truncate text-sm font-semibold">{scout.naam}</p>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                scout.rol === "TC"
                  ? "bg-ow-oranje/20 text-ow-oranje"
                  : "bg-indigo-900/30 text-indigo-400"
              }`}
            >
              {scout.rol}
            </span>
          </div>
          <p className="text-text-muted truncate text-xs">{scout.email}</p>
        </div>
      </div>

      {/* Stats rij */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="bg-surface-elevated flex h-6 w-6 items-center justify-center rounded-md">
            <span className="text-text-secondary text-[10px] font-bold">{scout.level}</span>
          </div>
          <span className="text-text-secondary text-xs">{levelNaam}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="text-tier-goud h-3.5 w-3.5"
            strokeWidth={1.5}
          >
            <path
              d="M8 2l2 4 4.5.7-3.2 3.2.8 4.5L8 12.2l-4.1 2.2.8-4.5L1.5 6.7 6 6l2-4z"
              stroke="currentColor"
            />
          </svg>
          <span className="text-text-secondary text-xs tabular-nums">{scout.xp} XP</span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="text-text-secondary h-3.5 w-3.5"
            strokeWidth={1.5}
          >
            <path
              d="M6 3.5H5a1.5 1.5 0 00-1.5 1.5v8A1.5 1.5 0 005 14.5h6a1.5 1.5 0 001.5-1.5V5A1.5 1.5 0 0011 3.5h-1"
              stroke="currentColor"
              strokeLinecap="round"
            />
            <rect x="6" y="2" width="4" height="3" rx="0.75" stroke="currentColor" />
          </svg>
          <span className="text-text-secondary text-xs tabular-nums">{scout.aantalRapporten}</span>
        </div>
      </div>

      {/* Vrij scouten toggle */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-700/50 pt-3">
        <div>
          <p className="text-text-secondary text-xs font-medium">Vrij scouten</p>
          <p className="text-text-muted text-[10px]">
            {scout.vrijScouten ? "Mag zelf spelers scouten" : "Alleen op verzoek"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={scout.vrijScouten}
          disabled={isToggling}
          onClick={() => onToggleVrijScouten(scout.id, !scout.vrijScouten)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
            isToggling ? "cursor-wait opacity-60" : "cursor-pointer"
          } ${scout.vrijScouten ? "bg-ow-oranje" : "bg-gray-600"}`}
        >
          <span
            className={`bg-surface-card inline-block h-5 w-5 rounded-full shadow-none transition-transform duration-200 ${
              scout.vrijScouten ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ───

function ScoutsSkeleton() {
  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 pt-6 pb-4">
        <div className="bg-surface-elevated h-6 w-24 animate-pulse rounded" />
        <div className="bg-surface-elevated mt-2 h-4 w-40 animate-pulse rounded" />
      </div>
      <div className="space-y-3 px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-card rounded-2xl border border-gray-700 p-4">
            <div className="flex items-start gap-3">
              <div className="bg-surface-elevated h-11 w-11 animate-pulse rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-surface-elevated h-4 w-32 animate-pulse rounded" />
                <div className="bg-surface-elevated h-3 w-44 animate-pulse rounded" />
              </div>
            </div>
            <div className="mt-3 flex gap-4">
              <div className="bg-surface-elevated h-6 w-20 animate-pulse rounded" />
              <div className="bg-surface-elevated h-6 w-16 animate-pulse rounded" />
              <div className="bg-surface-elevated h-6 w-12 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
