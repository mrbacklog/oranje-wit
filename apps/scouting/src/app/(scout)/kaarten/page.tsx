"use client";

/**
 * Kaarten-collectie pagina.
 *
 * Grid van alle spelerskaarten, filterbaar op leeftijdsgroep,
 * sorteerbaar op rating/recent/naam. Klik op kaart navigeert
 * naar het spelerprofiel.
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@oranje-wit/types";
import { SpelersKaart, type AchterkantData } from "@/components/spelers-kaart";

// ================================================================
// Types
// ================================================================

interface KaartData {
  spelerId: string;
  roepnaam: string;
  achternaam: string;
  leeftijd: number;
  team?: string;
  overall: number;
  stats: {
    schot: number;
    aanval: number;
    passing: number;
    verdediging: number;
    fysiek: number;
    mentaal: number;
  };
  tier: "brons" | "zilver" | "goud";
  sterren: number;
  fotoUrl: string | null;
  laatsteUpdate: string;
  achterkant: AchterkantData;
}

type SorteerOptie = "rating" | "recent" | "naam";

type LeeftijdsgroepFilter = "alle" | "paars" | "blauw" | "groen" | "geel" | "oranje" | "rood";

// ================================================================
// Constanten
// ================================================================

const GROEP_CHIPS: Array<{
  id: LeeftijdsgroepFilter;
  label: string;
  color: string;
  leeftijden: number[];
}> = [
  { id: "alle", label: "Alle", color: "#6B7280", leeftijden: [] },
  { id: "paars", label: "Paars", color: "#A855F7", leeftijden: [5] },
  { id: "blauw", label: "Blauw", color: "#3B82F6", leeftijden: [6, 7] },
  { id: "groen", label: "Groen", color: "#22C55E", leeftijden: [8, 9] },
  { id: "geel", label: "Geel", color: "#EAB308", leeftijden: [10, 11, 12] },
  { id: "oranje", label: "Oranje", color: "#F97316", leeftijden: [13, 14, 15] },
  { id: "rood", label: "Rood", color: "#EF4444", leeftijden: [16, 17, 18] },
];

const SORTEER_OPTIES: Array<{ id: SorteerOptie; label: string }> = [
  { id: "rating", label: "Rating" },
  { id: "recent", label: "Recent" },
  { id: "naam", label: "Naam" },
];

// ================================================================
// Component
// ================================================================

export default function KaartenPage() {
  const router = useRouter();
  const [kaarten, setKaarten] = useState<KaartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeeftijdsgroepFilter>("alle");
  const [sorteer, setSorteer] = useState<SorteerOptie>("rating");

  useEffect(() => {
    async function laad() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/kaarten");
        const data = await res.json();

        if (data.ok && Array.isArray(data.data)) {
          setKaarten(data.data);
        } else {
          // Geen kaarten of tabel bestaat nog niet — toon lege state
          setKaarten([]);
        }
      } catch (err) {
        logger.warn("[kaarten] Fetch fout:", err);
        setError("Kon kaarten niet laden");
      } finally {
        setIsLoading(false);
      }
    }

    laad();
  }, []);

  const gefilterd = useMemo(() => {
    let result = [...kaarten];

    // Filter op leeftijdsgroep
    if (filter !== "alle") {
      const groep = GROEP_CHIPS.find((g) => g.id === filter);
      if (groep && groep.leeftijden.length > 0) {
        result = result.filter((k) => groep.leeftijden.includes(k.leeftijd));
      }
    }

    // Sorteer
    switch (sorteer) {
      case "rating":
        result.sort((a, b) => b.overall - a.overall);
        break;
      case "recent":
        result.sort(
          (a, b) => new Date(b.laatsteUpdate).getTime() - new Date(a.laatsteUpdate).getTime()
        );
        break;
      case "naam":
        result.sort((a, b) =>
          `${a.achternaam} ${a.roepnaam}`.localeCompare(`${b.achternaam} ${b.roepnaam}`, "nl")
        );
        break;
    }

    return result;
  }, [kaarten, filter, sorteer]);

  const navigeerNaarSpeler = useCallback(
    (spelerId: string) => {
      router.push(`/speler/${spelerId}`);
    },
    [router]
  );

  if (isLoading) return <LaadSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20">
        <p className="text-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-text-primary text-2xl font-bold">Kaarten</h1>
        <p className="text-text-secondary mt-1 text-sm">
          {kaarten.length} speler{kaarten.length !== 1 ? "s" : ""} gescout
        </p>
      </div>

      {/* Filter chips */}
      <div className="overflow-x-auto px-4 pt-3">
        <div className="flex gap-2 pb-2">
          {GROEP_CHIPS.map((groep) => (
            <button
              key={groep.id}
              type="button"
              onClick={() => setFilter(groep.id)}
              className={`touch-target shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                filter === groep.id
                  ? "scale-105 text-white shadow-md"
                  : "text-text-secondary bg-surface-card"
              }`}
              style={filter === groep.id ? { background: groep.color } : undefined}
            >
              {groep.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sorteer */}
      <div className="flex gap-2 px-4 pt-2 pb-3">
        {SORTEER_OPTIES.map((optie) => (
          <button
            key={optie.id}
            type="button"
            onClick={() => setSorteer(optie.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              sorteer === optie.id ? "text-ow-oranje bg-ow-oranje/10" : "text-text-muted"
            }`}
          >
            {optie.label}
          </button>
        ))}
      </div>

      {/* Kaarten grid */}
      {gefilterd.length === 0 ? (
        <LegeState heeftKaarten={kaarten.length > 0} />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {gefilterd.map((kaart) => (
            <div key={kaart.spelerId} className="flex justify-center">
              <SpelersKaart
                spelerId={kaart.spelerId}
                roepnaam={kaart.roepnaam}
                achternaam={kaart.achternaam}
                leeftijd={kaart.leeftijd}
                team={kaart.team}
                overall={kaart.overall}
                stats={kaart.stats}
                tier={kaart.tier}
                sterren={kaart.sterren}
                fotoUrl={kaart.fotoUrl ?? undefined}
                size="small"
                onClick={() => navigeerNaarSpeler(kaart.spelerId)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================================================================
// Sub-componenten
// ================================================================

function LegeState({ heeftKaarten }: { heeftKaarten: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="bg-surface-elevated mb-4 flex h-20 w-20 items-center justify-center rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="text-text-muted h-10 w-10"
          strokeWidth={1.5}
        >
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" />
          <path d="M3 10h18" stroke="currentColor" />
          <circle cx="8" cy="15" r="1.5" stroke="currentColor" />
          <circle cx="16" cy="15" r="1.5" stroke="currentColor" />
        </svg>
      </div>
      {heeftKaarten ? (
        <>
          <p className="text-text-secondary text-sm font-medium">Geen kaarten in deze groep</p>
          <p className="text-text-muted mt-1 text-xs">Selecteer een andere leeftijdsgroep</p>
        </>
      ) : (
        <>
          <p className="text-text-secondary text-sm font-medium">Nog geen kaarten</p>
          <p className="text-text-muted mt-1 max-w-[280px] text-center text-xs">
            Scout je eerste speler! Kaarten worden automatisch gegenereerd na scouting rapporten.
          </p>
        </>
      )}
    </div>
  );
}

function LaadSkeleton() {
  return (
    <div className="flex flex-col pb-24">
      <div className="px-4 pt-6 pb-2">
        <div className="bg-surface-elevated h-7 w-32 animate-pulse rounded" />
        <div className="bg-surface-elevated mt-2 h-4 w-24 animate-pulse rounded" />
      </div>
      <div className="flex gap-2 px-4 pt-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-elevated h-8 w-16 shrink-0 animate-pulse rounded-full"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pt-6 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface-elevated mx-auto h-[180px] w-[120px] animate-pulse rounded-2xl"
          />
        ))}
      </div>
    </div>
  );
}
