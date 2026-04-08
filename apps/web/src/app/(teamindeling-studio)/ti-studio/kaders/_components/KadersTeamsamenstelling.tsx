"use client";

import { useState, useTransition } from "react";
import {
  updateKadersVoorkeuren,
  type TeamaantallenVoorkeur,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";

interface KadersTeamsamenstellingProps {
  kadersId: string;
  initieleAantallen: Record<string, TeamaantallenVoorkeur>;
}

const CATEGORIE_LABELS: Record<string, string> = {
  SENIOREN: "Senioren",
  A_CATEGORIE: "A-categorie",
  B_CATEGORIE: "B-categorie",
};

const DEFAULTS: Record<string, TeamaantallenVoorkeur> = {
  SENIOREN: { minV: 3, maxV: 4, minM: 3, maxM: 4, minSpelers: 6, maxSpelers: 12 },
  A_CATEGORIE: { minV: 3, maxV: 4, minM: 3, maxM: 4, minSpelers: 6, maxSpelers: 10 },
  B_CATEGORIE: { minV: 2, maxV: 4, minM: 2, maxM: 4, minSpelers: 4, maxSpelers: 8 },
};

const KOLOMMEN: { veld: keyof TeamaantallenVoorkeur; label: string }[] = [
  { veld: "minV", label: "Min V" },
  { veld: "maxV", label: "Max V" },
  { veld: "minM", label: "Min M" },
  { veld: "maxM", label: "Max M" },
  { veld: "minSpelers", label: "Min Sp." },
  { veld: "maxSpelers", label: "Max Sp." },
];

export default function KadersTeamsamenstelling({
  kadersId,
  initieleAantallen,
}: KadersTeamsamenstellingProps) {
  const [aantallen, setAantallen] = useState<Record<string, TeamaantallenVoorkeur>>(() => {
    const resultaat: Record<string, TeamaantallenVoorkeur> = {};
    for (const sleutel of Object.keys(DEFAULTS)) {
      resultaat[sleutel] = { ...DEFAULTS[sleutel], ...(initieleAantallen[sleutel] ?? {}) };
    }
    return resultaat;
  });
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; bericht: string } | null>(null);

  function setWaarde(sleutel: string, veld: keyof TeamaantallenVoorkeur, waarde: number) {
    setAantallen((prev) => ({
      ...prev,
      [sleutel]: { ...prev[sleutel], [veld]: waarde },
    }));
    setFeedback(null);
  }

  function handleOpslaan() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateKadersVoorkeuren(kadersId, { teamaantallen: aantallen });
      if (result.ok) {
        setFeedback({ ok: true, bericht: "Teamaantallen opgeslagen" });
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
        <span style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 13 }}>
          Teamsamenstelling per categorie
        </span>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4 }}>
          Minimum en maximum aantal V, M en spelers per team.
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border-default)",
                  width: 140,
                }}
              >
                Categorie
              </th>
              {KOLOMMEN.map((k) => (
                <th
                  key={k.veld}
                  style={{
                    textAlign: "center",
                    padding: "6px 4px",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  {k.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(DEFAULTS).map((sleutel) => {
              const rij = aantallen[sleutel];
              return (
                <tr
                  key={sleutel}
                  style={{
                    borderBottom: "1px solid var(--border-default)",
                  }}
                >
                  <td
                    style={{
                      padding: "8px 8px",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    {CATEGORIE_LABELS[sleutel] ?? sleutel}
                  </td>
                  {KOLOMMEN.map((k) => (
                    <td key={k.veld} style={{ padding: "6px 4px", textAlign: "center" }}>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={rij[k.veld]}
                        onChange={(e) =>
                          setWaarde(sleutel, k.veld, parseInt(e.target.value, 10) || 0)
                        }
                        style={{
                          width: 60,
                          background: "var(--surface-sunken)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 5,
                          padding: "4px 6px",
                          color: "var(--text-primary)",
                          fontSize: 12,
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        {feedback ? (
          <span style={{ fontSize: 12, color: feedback.ok ? "#4ade80" : "#f87171" }}>
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
