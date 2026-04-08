"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { logger } from "@oranje-wit/types";
import {
  SpelerZoek,
  type SpelerZoekResultaat,
  SpelerAvatar,
} from "@/components/scouting/speler-zoek";
import { LeeftijdsgroepBadge } from "@/components/scouting/leeftijdsgroep-badge";

const RECENT_KEY = "ow-scout-recent-spelers";
const MAX_RECENT = 8;

interface RecentSpeler {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  kleur: string;
  leeftijd: number;
  team: string | null;
  heeftFoto: boolean;
}

export default function ZoekPage() {
  const router = useRouter();
  const [recentBekeken, setRecentBekeken] = useState<RecentSpeler[]>([]);

  // Laad recent bekeken spelers uit localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentBekeken(JSON.parse(stored));
      }
    } catch (error) {
      logger.warn("Recent bekeken laden uit localStorage mislukt:", error);
    }
  }, []);

  function handleSelect(speler: SpelerZoekResultaat) {
    // Voeg toe aan recent bekeken
    const recent: RecentSpeler = {
      relCode: speler.relCode,
      roepnaam: speler.roepnaam,
      achternaam: speler.achternaam,
      kleur: speler.kleur,
      leeftijd: speler.leeftijd,
      team: speler.team,
      heeftFoto: speler.heeftFoto,
    };

    try {
      const bestaand = recentBekeken.filter((r) => r.relCode !== speler.relCode);
      const nieuw = [recent, ...bestaand].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_KEY, JSON.stringify(nieuw));
      setRecentBekeken(nieuw);
    } catch (error) {
      logger.warn("Recent bekeken opslaan in localStorage mislukt:", error);
    }

    // Navigeer naar spelerprofiel
    router.push(`/scouting/speler/${speler.relCode}`);
  }

  return (
    <div className="px-4 pt-6">
      <header className="mb-4">
        <h1 className="text-xl font-bold">Speler zoeken</h1>
        <p className="text-text-secondary mt-1 text-sm">Zoek een speler op naam of team</p>
      </header>

      <SpelerZoek onSelect={handleSelect} placeholder="Zoek een speler op naam..." autoFocus />

      {/* Recent bekeken spelers */}
      {recentBekeken.length > 0 && (
        <section className="mt-8">
          <h2 className="text-text-secondary mb-3 text-sm font-semibold">Recent bekeken</h2>
          <ul className="flex flex-col gap-1">
            {recentBekeken.map((speler) => (
              <li key={speler.relCode}>
                <button
                  type="button"
                  onClick={() => router.push(`/scouting/speler/${speler.relCode}`)}
                  className="touch-target active:bg-surface-elevated flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                >
                  <SpelerAvatar
                    relCode={speler.relCode}
                    roepnaam={speler.roepnaam}
                    achternaam={speler.achternaam}
                    heeftFoto={speler.heeftFoto}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary truncate text-sm font-medium">
                      {speler.roepnaam} {speler.achternaam}
                    </p>
                    {speler.team && (
                      <p className="text-text-secondary truncate text-xs">{speler.team}</p>
                    )}
                  </div>
                  <LeeftijdsgroepBadge kleur={speler.kleur} size="sm" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
