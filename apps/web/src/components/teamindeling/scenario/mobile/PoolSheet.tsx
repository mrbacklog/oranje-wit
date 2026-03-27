"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { BottomSheet } from "@oranje-wit/ui/feedback/bottom-sheet";
import { SearchInput, Chip } from "@oranje-wit/ui/data-input";
import type { SpelerData, TeamData } from "../types";
import { korfbalLeeftijd, kleurIndicatie, KLEUR_DOT } from "../types";
import type { Kleur } from "@oranje-wit/database";

interface PoolSheetProps {
  /** Is het sheet open? */
  open: boolean;
  /** Sluit het sheet */
  onClose: () => void;
  /** Alle spelers die niet in een team zitten */
  poolSpelers: SpelerData[];
  /** Alle spelers (om team-naam op te zoeken) */
  alleSpelers: SpelerData[];
  /** Teams voor context (toon waar speler nu zit) */
  teams: TeamData[];
  /** Voeg speler toe aan huidig team */
  onAddToTeam: (spelerId: string) => void;
  /** ID van het team waar de carousel op staat */
  activeTeamId?: string;
}

/** Unieke leeftijdsgroepen in de pool */
const LEEFTIJDS_GROEPEN: { label: string; kleur: Kleur; min: number; max: number }[] = [
  { label: "Blauw", kleur: "BLAUW", min: 5, max: 8 },
  { label: "Groen", kleur: "GROEN", min: 9, max: 10 },
  { label: "Geel", kleur: "GEEL", min: 11, max: 12 },
  { label: "Oranje", kleur: "ORANJE", min: 13, max: 14 },
  { label: "Rood", kleur: "ROOD", min: 15, max: 18 },
];

/** KNKV-kleur kleuren voor de Chip component */
const KLEUR_HEX: Record<string, string> = {
  BLAUW: "#60a5fa",
  GROEN: "#34d399",
  GEEL: "#fbbf24",
  ORANJE: "#fb923c",
  ROOD: "#f87171",
};

/**
 * PoolSheet -- BottomSheet met de spelerspool.
 *
 * Features:
 * - SearchInput bovenaan
 * - Filter chips per leeftijdsgroep
 * - Gefilterde speler lijst
 * - Tap op speler = voeg toe aan huidig team
 * - Toont waar elke speler nu zit (Pool / team naam)
 */
export default function PoolSheet({
  open,
  onClose,
  poolSpelers,
  alleSpelers: _alleSpelers,
  teams,
  onAddToTeam,
  activeTeamId,
}: PoolSheetProps) {
  const [zoekterm, setZoekterm] = useState("");
  const [activeFilter, setActiveFilter] = useState<Kleur | null>(null);

  // Bouw lookup: spelerId -> teamNaam
  const spelerTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const team of teams) {
      for (const ts of team.spelers) {
        map.set(ts.spelerId, team.naam);
      }
    }
    return map;
  }, [teams]);

  // Pool speler IDs voor snelle lookup
  const poolSpelerIds = useMemo(() => new Set(poolSpelers.map((s) => s.id)), [poolSpelers]);

  // Gefilterde spelers
  const gefilterd = useMemo(() => {
    let lijst = [...poolSpelers];

    // Filter op zoekterm
    if (zoekterm.trim()) {
      const term = zoekterm.toLowerCase();
      lijst = lijst.filter(
        (s) => s.roepnaam.toLowerCase().includes(term) || s.achternaam.toLowerCase().includes(term)
      );
    }

    // Filter op leeftijdsgroep
    if (activeFilter) {
      const groep = LEEFTIJDS_GROEPEN.find((g) => g.kleur === activeFilter);
      if (groep) {
        lijst = lijst.filter((s) => {
          const leeftijd = Math.floor(korfbalLeeftijd(s.geboortedatum, s.geboortejaar));
          return leeftijd >= groep.min && leeftijd <= groep.max;
        });
      }
    }

    // Sorteer: heren eerst, dan aflopend op leeftijd
    lijst.sort((a, b) => {
      if (a.geslacht !== b.geslacht) return a.geslacht === "M" ? -1 : 1;
      const la = korfbalLeeftijd(a.geboortedatum, a.geboortejaar);
      const lb = korfbalLeeftijd(b.geboortedatum, b.geboortejaar);
      return lb - la;
    });

    return lijst;
  }, [poolSpelers, zoekterm, activeFilter]);

  // Beschikbare filters (alleen tonen als er spelers in die groep zitten)
  const beschikbareGroepen = useMemo(() => {
    return LEEFTIJDS_GROEPEN.filter((groep) =>
      poolSpelers.some((s) => {
        const leeftijd = Math.floor(korfbalLeeftijd(s.geboortedatum, s.geboortejaar));
        return leeftijd >= groep.min && leeftijd <= groep.max;
      })
    );
  }, [poolSpelers]);

  const activeTeamNaam = teams.find((t) => t.id === activeTeamId)?.naam;

  return (
    <BottomSheet open={open} onClose={onClose} height={90} title="Spelerspool">
      {/* Zoekbalk */}
      <SearchInput
        value={zoekterm}
        onChange={setZoekterm}
        placeholder="Zoek speler..."
        className="mb-3"
      />

      {/* Filter chips */}
      {beschikbareGroepen.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Chip
            label="Alle"
            selected={activeFilter === null}
            onSelect={() => setActiveFilter(null)}
          />
          {beschikbareGroepen.map((groep) => (
            <Chip
              key={groep.kleur}
              label={groep.label}
              selected={activeFilter === groep.kleur}
              color={KLEUR_HEX[groep.kleur]}
              onSelect={() => setActiveFilter(activeFilter === groep.kleur ? null : groep.kleur)}
            />
          ))}
        </div>
      )}

      {/* Hint */}
      {activeTeamNaam && (
        <p className="mb-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          Tik op een speler om toe te voegen aan{" "}
          <span style={{ color: "var(--ow-oranje-400)" }}>{activeTeamNaam}</span>
        </p>
      )}

      {/* Speler lijst */}
      <div className="flex flex-col gap-1.5">
        {gefilterd.length === 0 && (
          <p className="py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
            {zoekterm ? "Geen spelers gevonden" : "Alle spelers zijn ingedeeld"}
          </p>
        )}

        {gefilterd.map((speler) => {
          const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
          const kleur = kleurIndicatie(leeftijd);
          const teamNaam = spelerTeamMap.get(speler.id);
          const inPool = poolSpelerIds.has(speler.id);

          return (
            <motion.button
              key={speler.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
              style={{
                backgroundColor: "var(--surface-card)",
                border: "1px solid var(--border-default)",
                minHeight: 44,
              }}
              onClick={() => onAddToTeam(speler.id)}
              whileTap={{ scale: 0.97 }}
              aria-label={`${speler.roepnaam} ${speler.achternaam} toevoegen`}
            >
              {/* Initialen avatar */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{
                  background: kleur
                    ? `linear-gradient(135deg, ${KLEUR_HEX[kleur] ?? "#888"}, ${KLEUR_HEX[kleur] ?? "#666"}88)`
                    : "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-700))",
                }}
              >
                {`${speler.roepnaam.charAt(0)}${speler.achternaam.charAt(0)}`.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className="truncate text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {speler.roepnaam} {speler.achternaam}
                </span>
                <div className="flex items-center gap-1.5">
                  {kleur && (
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${KLEUR_DOT[kleur]}`} />
                  )}
                  <span className="text-xs tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                    {leeftijd.toFixed(1)} jr
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        speler.geslacht === "M"
                          ? "var(--color-info-400, #60a5fa)"
                          : "var(--color-error-400, #f87171)",
                    }}
                  >
                    {speler.geslacht === "M" ? "H" : "D"}
                  </span>
                </div>
              </div>

              {/* Locatie label */}
              <span
                className="shrink-0 text-[10px] font-medium"
                style={{
                  color: inPool ? "var(--text-tertiary)" : "var(--ow-oranje-400)",
                }}
              >
                {inPool ? "Pool" : (teamNaam ?? "")}
              </span>
            </motion.button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
