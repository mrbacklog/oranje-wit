"use client";
import { KNKV_KLEUR_HEX, KNKV_KLEUREN_VOLGORDE } from "./knkv-kleur";
import type { PresentatieTeam } from "../presentatie-types";

export type FilterWaarde =
  | "alle"
  | "senioren"
  | "jeugd"
  | "selecties"
  | "sen-selecties"
  | "jeugd-selecties"
  | "kleur-rood"
  | "kleur-oranje"
  | "kleur-geel"
  | "kleur-groen"
  | "kleur-blauw";

interface PresentatieFilterBarProps {
  actief: FilterWaarde;
  onChange: (v: FilterWaarde) => void;
  teams: PresentatieTeam[];
}

const KLEUR_LABEL: Record<string, string> = {
  rood: "Rood",
  oranje: "Oranje",
  geel: "Geel",
  groen: "Groen",
  blauw: "Blauw",
};

/** Filter teams op basis van de actieve filterwaarde. */
export function filterTeams(teams: PresentatieTeam[], filter: FilterWaarde): PresentatieTeam[] {
  switch (filter) {
    case "alle":
      return teams;
    case "senioren":
      return teams.filter((t) => t.teamCategorie === "SENIOREN");
    case "jeugd":
      return teams.filter(
        (t) => t.teamCategorie === "A_CATEGORIE" || t.teamCategorie === "B_CATEGORIE"
      );
    case "selecties":
      return teams.filter((t) => t.soort === "selectie");
    case "sen-selecties":
      return teams.filter((t) => t.soort === "selectie" && t.teamCategorie === "SENIOREN");
    case "jeugd-selecties":
      return teams.filter(
        (t) =>
          t.soort === "selectie" &&
          (t.teamCategorie === "A_CATEGORIE" || t.teamCategorie === "B_CATEGORIE")
      );
    default: {
      if (filter.startsWith("kleur-")) {
        const kleur = filter.replace("kleur-", "");
        return teams.filter((t) => t.kleur === kleur);
      }
      return teams;
    }
  }
}

export function PresentatieFilterBar({ actief, onChange, teams }: PresentatieFilterBarProps) {
  // Welke kleuren zijn aanwezig in de teams?
  const aanwezigeKleuren = new Set(teams.map((t) => t.kleur).filter(Boolean));
  const zichtbareKleuren = KNKV_KLEUREN_VOLGORDE.filter((k) => aanwezigeKleuren.has(k));

  function Knop({ waarde, label, dot }: { waarde: FilterWaarde; label: string; dot?: string }) {
    const isActief = actief === waarde;
    return (
      <button
        onClick={() => onChange(waarde)}
        style={{
          background: isActief ? "rgba(255,107,0,.15)" : "var(--bg-2)",
          border: isActief ? "1px solid var(--accent-h)" : "1px solid var(--border-0)",
          borderRadius: 999,
          padding: "5px 13px",
          fontSize: 11,
          fontWeight: 600,
          color: isActief ? "#ffb37a" : "var(--text-2)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
          transition: "background 120ms, border-color 120ms, color 120ms",
          whiteSpace: "nowrap",
        }}
      >
        {dot && (
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: dot,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
        )}
        {label}
      </button>
    );
  }

  function Scheiding() {
    return (
      <div
        style={{
          width: 1,
          height: 18,
          background: "var(--border-0)",
          margin: "0 4px",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "linear-gradient(180deg, var(--bg-0) 85%, transparent 100%)",
        borderBottom: "1px solid var(--border-0)",
        padding: "12px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
        }}
      >
        {/* Categorie-groep */}
        <Knop waarde="alle" label="Alle teams" />
        <Knop waarde="senioren" label="Senioren" />
        <Knop waarde="jeugd" label="Jeugd" />

        <Scheiding />

        {/* Selecties-groep */}
        <Knop waarde="selecties" label="Selecties" />
        <Knop waarde="sen-selecties" label="Sen. selecties" />

        {zichtbareKleuren.length > 0 && (
          <>
            <Scheiding />
            {/* Kleur-groep */}
            {zichtbareKleuren.map((k) => (
              <Knop
                key={k}
                waarde={`kleur-${k}` as FilterWaarde}
                label={KLEUR_LABEL[k] ?? k}
                dot={KNKV_KLEUR_HEX[k]}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
