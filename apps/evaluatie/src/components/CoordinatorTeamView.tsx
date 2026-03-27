"use client";

import { useState } from "react";

interface EvaluatieData {
  id: string;
  spelerId: string;
  spelerNaam: string;
  coach: string;
  scores: Record<string, number | string | null>;
  opmerkingen: string | null;
  coordinatorMemo: string | null;
  ingediendOp: string | null;
}

interface Props {
  evaluaties: EvaluatieData[];
  token: string;
}

export default function CoordinatorTeamView({ evaluaties, token }: Props) {
  // Group by speler
  const perSpeler = new Map<string, EvaluatieData[]>();
  for (const e of evaluaties) {
    const list = perSpeler.get(e.spelerId) ?? [];
    list.push(e);
    perSpeler.set(e.spelerId, list);
  }

  return (
    <div className="mt-6 space-y-8">
      {evaluaties.length === 0 && (
        <p className="text-text-muted">Nog geen evaluaties ingediend voor dit team.</p>
      )}

      {Array.from(perSpeler.entries()).map(([spelerId, evals]) => (
        <div key={spelerId} className="bg-surface-card rounded-lg border p-4">
          <h3 className="font-semibold">{evals[0].spelerNaam}</h3>

          {evals.map((e) => (
            <div key={e.id} className="mt-3 border-t pt-3">
              <div className="text-text-muted flex items-center justify-between text-sm">
                <span>Trainer: {e.coach}</span>
                {e.ingediendOp && (
                  <span>{new Date(e.ingediendOp).toLocaleDateString("nl-NL")}</span>
                )}
              </div>

              <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                <ScoreLabel label="Niveau" value={e.scores.niveau as number | null} max={5} />
                <ScoreLabel label="Inzet" value={e.scores.inzet as number | null} max={3} />
                <ScoreLabel label="Groei" value={e.scores.groei as number | null} max={4} />
              </div>

              {e.scores.team_plezier != null && (
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  <ScoreLabel
                    label="Plezier"
                    value={e.scores.team_plezier as number | null}
                    max={5}
                  />
                  <ScoreLabel
                    label="Ontwikkeling"
                    value={e.scores.team_ontwikkeling as number | null}
                    max={5}
                  />
                  <ScoreLabel
                    label="Prestatie"
                    value={e.scores.team_prestatie as number | null}
                    max={5}
                  />
                </div>
              )}

              {e.opmerkingen && (
                <p className="text-text-secondary mt-2 text-sm">
                  <span className="font-medium">Opmerking:</span> {e.opmerkingen}
                </p>
              )}

              <MemoVeld evaluatieId={e.id} initieel={e.coordinatorMemo} token={token} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ScoreLabel({ label, value, max }: { label: string; value: number | null; max: number }) {
  if (value === null || value === undefined) return null;
  return (
    <div>
      <span className="text-text-muted">{label}:</span>{" "}
      <span className="font-medium">
        {value}/{max}
      </span>
    </div>
  );
}

function MemoVeld({
  evaluatieId,
  initieel,
  token,
}: {
  evaluatieId: string;
  initieel: string | null;
  token: string;
}) {
  const [memo, setMemo] = useState(initieel ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function opslaan() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/evaluaties/${evaluatieId}/memo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo, token }),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
  }

  return (
    <div className="mt-3">
      <label className="text-text-muted block text-xs font-medium">Coordinator memo</label>
      <div className="mt-1 flex gap-2">
        <textarea
          value={memo}
          onChange={(e) => {
            setMemo(e.target.value);
            setSaved(false);
          }}
          rows={2}
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="Voeg een memo toe..."
        />
        <button
          onClick={opslaan}
          disabled={saving}
          className="bg-ow-oranje hover:bg-ow-oranje-dark self-end rounded-md px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {saving ? "..." : saved ? "V" : "Opslaan"}
        </button>
      </div>
    </div>
  );
}
