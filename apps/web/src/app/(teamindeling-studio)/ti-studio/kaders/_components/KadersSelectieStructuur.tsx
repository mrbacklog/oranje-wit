"use client";

import { useState, useTransition } from "react";
import {
  updateKadersVoorkeuren,
  type SelectieVoorkeur,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";

interface TeamTotaal {
  v: number;
  m: number;
  totaal: number;
}

interface KadersSelectieStructuurProps {
  kadersId: string;
  initieleSelecties: SelectieVoorkeur[];
  beschikbareTeams: { naam: string; kleur: string | null; teamType: string }[];
  teamTotalen: Record<string, TeamTotaal>;
}

const LEGE_SELECTIE = (index: number): SelectieVoorkeur => ({
  id: `selectie-${index + 1}`,
  naam: "",
  actief: false,
  team1: null,
  team2: null,
});

function SelectieTotaalBadge({ v, m, totaal }: { v: number; m: number; totaal: number }) {
  if (totaal === 0) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
        fontSize: 11,
        color: "var(--text-tertiary)",
      }}
    >
      <span style={{ color: "#f472b6", fontWeight: 600 }}>V{v}</span>
      <span style={{ color: "#60a5fa", fontWeight: 600 }}>M{m}</span>
      <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>=&nbsp;{totaal}</span>
    </span>
  );
}

export default function KadersSelectieStructuur({
  kadersId,
  initieleSelecties,
  beschikbareTeams,
  teamTotalen,
}: KadersSelectieStructuurProps) {
  const [selecties, setSelecties] = useState<SelectieVoorkeur[]>(() => {
    // Zorg voor altijd 5 rijen
    const basis = Array.from({ length: 5 }, (_, i) => initieleSelecties[i] ?? LEGE_SELECTIE(i));
    return basis;
  });
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; bericht: string } | null>(null);

  function setVeld<K extends keyof SelectieVoorkeur>(
    index: number,
    veld: K,
    waarde: SelectieVoorkeur[K]
  ) {
    setSelecties((prev) => {
      const kopie = [...prev];
      kopie[index] = { ...kopie[index], [veld]: waarde };
      return kopie;
    });
    setFeedback(null);
  }

  function handleOpslaan() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateKadersVoorkeuren(kadersId, { selecties });
      if (result.ok) {
        setFeedback({ ok: true, bericht: "Selectiestructuur opgeslagen" });
      } else {
        setFeedback({ ok: false, bericht: result.error });
      }
    });
  }

  return (
    <div
      style={{
        background: "var(--surface-card)",
        borderRadius: 10,
        border: "1px solid var(--border-default)",
        padding: "16px 20px",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <span
          style={{
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Selectiestructuur
        </span>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4 }}>
          Welke selecties zijn actief en aan welke teams zijn ze gekoppeld.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {selecties.map((sel, i) => {
          // Bereken gecombineerde totalen van team1 + team2
          const t1 = sel.team1 ? (teamTotalen[sel.team1] ?? { v: 0, m: 0, totaal: 0 }) : null;
          const t2 = sel.team2 ? (teamTotalen[sel.team2] ?? { v: 0, m: 0, totaal: 0 }) : null;
          const gecombineerd = {
            v: (t1?.v ?? 0) + (t2?.v ?? 0),
            m: (t1?.m ?? 0) + (t2?.m ?? 0),
            totaal: (t1?.totaal ?? 0) + (t2?.totaal ?? 0),
          };

          return (
            <div key={sel.id} style={{ opacity: sel.actief ? 1 : 0.5 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr 1fr 1fr",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => setVeld(i, "actief", !sel.actief)}
                  style={{
                    width: 32,
                    height: 18,
                    borderRadius: 9,
                    background: sel.actief ? "var(--ow-oranje-500)" : "var(--border-default)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.15s",
                    flexShrink: 0,
                  }}
                  aria-label={sel.actief ? "Deactiveer selectie" : "Activeer selectie"}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: sel.actief ? 16 : 2,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "white",
                      transition: "left 0.15s",
                    }}
                  />
                </button>

                {/* Naam */}
                <input
                  type="text"
                  value={sel.naam}
                  onChange={(e) => setVeld(i, "naam", e.target.value)}
                  placeholder={`Selectie ${i + 1} naam`}
                  disabled={!sel.actief}
                  style={{
                    background: "var(--surface-sunken)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    padding: "6px 10px",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    width: "100%",
                    outline: "none",
                  }}
                />

                {/* Team 1 */}
                <select
                  value={sel.team1 ?? ""}
                  onChange={(e) => setVeld(i, "team1", e.target.value || null)}
                  disabled={!sel.actief}
                  style={{
                    background: "var(--surface-sunken)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    padding: "6px 10px",
                    color: sel.team1 ? "var(--text-primary)" : "var(--text-secondary)",
                    fontSize: 12,
                    width: "100%",
                    outline: "none",
                  }}
                >
                  <option value="">Team 1 (optioneel)</option>
                  {beschikbareTeams.map((t) => (
                    <option key={t.naam} value={t.naam}>
                      {t.naam}
                    </option>
                  ))}
                </select>

                {/* Team 2 */}
                <select
                  value={sel.team2 ?? ""}
                  onChange={(e) => setVeld(i, "team2", e.target.value || null)}
                  disabled={!sel.actief}
                  style={{
                    background: "var(--surface-sunken)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 6,
                    padding: "6px 10px",
                    color: sel.team2 ? "var(--text-primary)" : "var(--text-secondary)",
                    fontSize: 12,
                    width: "100%",
                    outline: "none",
                  }}
                >
                  <option value="">Team 2 (optioneel)</option>
                  {beschikbareTeams.map((t) => (
                    <option key={t.naam} value={t.naam}>
                      {t.naam}
                    </option>
                  ))}
                </select>
              </div>
              {/* Totalen onder de rij */}
              {sel.actief && gecombineerd.totaal > 0 && (
                <div style={{ paddingLeft: 40, marginTop: 3 }}>
                  <SelectieTotaalBadge {...gecombineerd} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        {feedback ? (
          <span
            style={{
              fontSize: 12,
              color: feedback.ok ? "#4ade80" : "#f87171",
            }}
          >
            {feedback.bericht}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleOpslaan}
          disabled={isPending}
          className="btn btn-primary btn-sm"
        >
          {isPending ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </div>
  );
}
