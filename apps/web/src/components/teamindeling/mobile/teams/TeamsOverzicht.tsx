"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SearchInput, Chip } from "@oranje-wit/ui";

/** Kleur-categorien met hun token-kleuren */
const CATEGORIEEN = [
  { key: "ALLE", label: "Alle", color: undefined },
  { key: "BLAUW", label: "Blauw", color: "var(--knkv-blauw-500)" },
  { key: "GROEN", label: "Groen", color: "var(--knkv-groen-500)" },
  { key: "GEEL", label: "Geel", color: "var(--knkv-geel-500)" },
  { key: "ORANJE", label: "Oranje", color: "var(--knkv-oranje-500)" },
  { key: "ROOD", label: "Rood", color: "var(--knkv-rood-500)" },
  { key: "SENIOREN", label: "Senioren", color: "var(--text-tertiary)" },
] as const;

/** Kleur-labels voor sectiehoofdjes */
const KLEUR_SECTIE_LABELS: Record<string, string> = {
  BLAUW: "Blauw (5-7)",
  GROEN: "Groen (8-9)",
  GEEL: "Geel (10-12)",
  ORANJE: "Oranje (13-15)",
  ROOD: "Rood (16-18)",
  SENIOREN: "Senioren",
};

/** CSS var voor kleur-dot per kleur */
const KLEUR_DOT_CSS: Record<string, string> = {
  BLAUW: "var(--knkv-blauw-500)",
  GROEN: "var(--knkv-groen-500)",
  GEEL: "var(--knkv-geel-500)",
  ORANJE: "var(--knkv-oranje-500)",
  ROOD: "var(--knkv-rood-500)",
};

/** Volgorde van kleuren */
const KLEUR_VOLGORDE = ["BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD", "SENIOREN"];

export interface TeamItem {
  id: number;
  naam: string | null;
  owCode: string;
  categorie: string;
  kleur: string | null;
  leeftijdsgroep: string | null;
  spelvorm: string | null;
  spelersCount: number;
}

interface TeamsOverzichtProps {
  teams: TeamItem[];
  seizoen: string;
}

/** Bepaal de effectieve kleurgroep van een team */
function getKleurGroep(team: TeamItem): string {
  if (team.kleur) return team.kleur.toUpperCase();
  if (team.categorie === "a") return "SENIOREN";
  return "SENIOREN";
}

export function TeamsOverzicht({ teams, seizoen }: TeamsOverzichtProps) {
  const [zoekterm, setZoekterm] = useState("");
  const [actieveFilter, setActieveFilter] = useState("ALLE");

  const gefilterd = useMemo(() => {
    let resultaat = teams;

    // Filter op zoekterm
    if (zoekterm.trim()) {
      const term = zoekterm.toLowerCase();
      resultaat = resultaat.filter(
        (t) =>
          (t.naam?.toLowerCase().includes(term) ?? false) || t.owCode.toLowerCase().includes(term)
      );
    }

    // Filter op kleur-categorie
    if (actieveFilter !== "ALLE") {
      resultaat = resultaat.filter((t) => getKleurGroep(t) === actieveFilter);
    }

    return resultaat;
  }, [teams, zoekterm, actieveFilter]);

  // Groepeer teams per kleur
  const gegroepeerd = useMemo(() => {
    const groepen = new Map<string, TeamItem[]>();

    for (const team of gefilterd) {
      const kleur = getKleurGroep(team);
      if (!groepen.has(kleur)) groepen.set(kleur, []);
      groepen.get(kleur)!.push(team);
    }

    // Sorteer op volgorde
    return KLEUR_VOLGORDE.filter((k) => groepen.has(k)).map((k) => ({
      kleur: k,
      label: KLEUR_SECTIE_LABELS[k] ?? k,
      teams: groepen.get(k)!,
    }));
  }, [gefilterd]);

  return (
    <motion.div
      className="flex flex-col gap-4 px-4 pt-4 pb-24"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Titel */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Teams
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          {seizoen} &middot; {teams.length} teams
        </p>
      </div>

      {/* Zoekbalk */}
      <SearchInput value={zoekterm} onChange={setZoekterm} placeholder="Zoek teams..." />

      {/* Categorie-filter chips */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {CATEGORIEEN.map((cat) => (
          <Chip
            key={cat.key}
            label={cat.label}
            selected={actieveFilter === cat.key}
            color={cat.color}
            onSelect={() => setActieveFilter(actieveFilter === cat.key ? "ALLE" : cat.key)}
          />
        ))}
      </div>

      {/* Resultaten */}
      {gefilterd.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p style={{ color: "var(--text-tertiary)" }}>
            Geen teams gevonden
            {zoekterm ? ` voor "${zoekterm}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {gegroepeerd.map((groep) => (
            <div key={groep.kleur}>
              {/* Sectie-header */}
              <h2
                className="mb-2 text-[13px] font-semibold tracking-wider uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                {groep.label}
              </h2>

              {/* Team-kaarten */}
              <div
                className="overflow-hidden rounded-2xl"
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {groep.teams.map((team, idx) => (
                  <Link key={team.id} href={`/teamindeling/teams/${team.id}`} className="block">
                    <motion.div
                      className="flex items-center gap-3 px-4"
                      style={{
                        minHeight: 56,
                        borderBottom:
                          idx < groep.teams.length - 1
                            ? "1px solid var(--border-default)"
                            : undefined,
                      }}
                      whileTap={{ scale: 0.98, backgroundColor: "var(--state-pressed)" }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Kleur-dot */}
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            KLEUR_DOT_CSS[getKleurGroep(team)] ?? "var(--text-tertiary)",
                        }}
                      />

                      {/* Info */}
                      <div className="min-w-0 flex-1 py-3">
                        <div
                          className="truncate text-base font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {team.naam ?? team.owCode}
                        </div>
                        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {team.spelvorm ?? "Team"}
                          {team.spelersCount > 0 && <> &middot; {team.spelersCount} spelers</>}
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: "var(--text-tertiary)" }}
                        className="shrink-0"
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
