import type { Clearance, SpelersKaartData } from "@oranje-wit/types";

interface SpelersKaartProps {
  speler: SpelersKaartData;
  clearance: Clearance;
  compact?: boolean;
}

const KLEUR_KLEUREN: Record<string, { bg: string; text: string; border: string }> = {
  paars: {
    bg: "color-mix(in srgb, var(--knkv-paars-500) 12%, transparent)",
    text: "var(--knkv-paars-400)",
    border: "color-mix(in srgb, var(--knkv-paars-500) 30%, transparent)",
  },
  blauw: {
    bg: "color-mix(in srgb, var(--knkv-blauw-500) 12%, transparent)",
    text: "var(--knkv-blauw-400)",
    border: "color-mix(in srgb, var(--knkv-blauw-500) 30%, transparent)",
  },
  groen: {
    bg: "color-mix(in srgb, var(--knkv-groen-500) 12%, transparent)",
    text: "var(--knkv-groen-400)",
    border: "color-mix(in srgb, var(--knkv-groen-500) 30%, transparent)",
  },
  geel: {
    bg: "color-mix(in srgb, var(--knkv-geel-500) 12%, transparent)",
    text: "var(--knkv-geel-400)",
    border: "color-mix(in srgb, var(--knkv-geel-500) 30%, transparent)",
  },
  oranje: {
    bg: "color-mix(in srgb, var(--knkv-oranje-500) 12%, transparent)",
    text: "var(--knkv-oranje-400)",
    border: "color-mix(in srgb, var(--knkv-oranje-500) 30%, transparent)",
  },
  rood: {
    bg: "color-mix(in srgb, var(--knkv-rood-500) 12%, transparent)",
    text: "var(--knkv-rood-400)",
    border: "color-mix(in srgb, var(--knkv-rood-500) 30%, transparent)",
  },
};

const TIER_STIJL: Record<string, string> = {
  brons: "tier-brons",
  zilver: "tier-zilver",
  goud: "tier-goud",
};

/**
 * SpelersKaart — Gedeeld component met clearance-based rendering.
 *
 * Clearance 0: Naam + leeftijd + team (geen scores)
 * Clearance 1: + relatieve positie binnen team
 * Clearance 2: + USS-getal + trend
 * Clearance 3: + volledige kaart (6 pijlers, radar placeholder, rapporten)
 */
export function SpelersKaart({ speler, clearance, compact = false }: SpelersKaartProps) {
  const kleur = KLEUR_KLEUREN[speler.kleur] ?? KLEUR_KLEUREN.blauw;
  const tierClass = speler.tier ? (TIER_STIJL[speler.tier] ?? "") : "";
  const hasTier = !!tierClass;

  return (
    <div
      className={`rounded-xl border ${tierClass} ${compact ? "p-3" : "p-4"} transition-shadow hover:shadow-md`}
      style={
        !hasTier
          ? {
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
            }
          : undefined
      }
    >
      {/* Header: altijd zichtbaar (clearance 0+) */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: kleur.bg, color: kleur.text }}
        >
          {speler.roepnaam.charAt(0)}
          {speler.achternaam.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {speler.roepnaam} {speler.achternaam}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {speler.leeftijd} jr
            </span>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: kleur.bg, color: kleur.text }}
            >
              {speler.team}
            </span>
          </div>
        </div>

        {/* Clearance 2+: USS score badge */}
        {clearance >= 2 && speler.ussScore != null && (
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {speler.ussScore}
            </span>
            {speler.ussTrend != null && speler.ussTrend !== 0 && (
              <span
                className="text-xs font-medium"
                style={{
                  color:
                    speler.ussTrend > 0 ? "var(--color-success-500)" : "var(--color-error-500)",
                }}
              >
                {speler.ussTrend > 0 ? "+" : ""}
                {speler.ussTrend}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Clearance 1+: relatieve positie binnen team */}
      {clearance >= 1 && speler.relatievePositie != null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--text-tertiary)" }}>Positie in team</span>
            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
              {speler.relatievePositie >= 75
                ? "Bovengemiddeld"
                : speler.relatievePositie >= 25
                  ? "Gemiddeld"
                  : "Ondergemiddeld"}
            </span>
          </div>
          <div
            className="mt-1 h-2 w-full rounded-full"
            style={{ backgroundColor: "var(--surface-sunken)" }}
          >
            <div
              className="h-2 rounded-full"
              style={{
                width: `${speler.relatievePositie}%`,
                background:
                  "linear-gradient(to right, var(--color-error-400, #f87171), var(--color-warning-400, #fbbf24), var(--color-success-400, #4ade80))",
              }}
            />
          </div>
        </div>
      )}

      {/* Clearance 3: volledige pijler-scores */}
      {clearance >= 3 && speler.pijlerScores && !compact && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(
            [
              ["SCH", speler.pijlerScores.schot],
              ["AAN", speler.pijlerScores.aanval],
              ["PAS", speler.pijlerScores.passing],
              ["VER", speler.pijlerScores.verdediging],
              ["FYS", speler.pijlerScores.fysiek],
              ["MEN", speler.pijlerScores.mentaal],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg px-2 py-1.5 text-center"
              style={{ backgroundColor: "var(--surface-sunken)" }}
            >
              <p className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                {label}
              </p>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Clearance 3: betrouwbaarheid en rapporten */}
      {clearance >= 3 && speler.aantalRapporten != null && !compact && (
        <div
          className="mt-2 flex items-center justify-between text-xs"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span>{speler.aantalRapporten} rapporten</span>
          {speler.betrouwbaarheid && (
            <span
              className="rounded-full px-2 py-0.5 font-medium"
              style={
                speler.betrouwbaarheid === "bevestigd"
                  ? {
                      backgroundColor: "var(--color-success-50)",
                      color: "var(--color-success-500)",
                    }
                  : speler.betrouwbaarheid === "betrouwbaar"
                    ? {
                        backgroundColor: "var(--color-info-50)",
                        color: "var(--color-info-500)",
                      }
                    : {
                        backgroundColor: "var(--surface-sunken)",
                        color: "var(--text-secondary)",
                      }
              }
            >
              {speler.betrouwbaarheid}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
