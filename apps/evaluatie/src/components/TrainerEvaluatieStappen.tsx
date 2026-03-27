"use client";

import ScoreVeld from "@/components/ScoreVeld";
import type { Speler, SpelerScore, TeamScore } from "@/components/evaluatie-types";

export type { Speler, SpelerScore, TeamScore };

export function StapTeam({
  teamScore,
  setTeamScore,
  onVolgende,
}: {
  teamScore: TeamScore;
  setTeamScore: React.Dispatch<React.SetStateAction<TeamScore>>;
  onVolgende: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Team-evaluatie (Oranje Draad)</h2>
      <p className="text-text-muted text-sm">
        Beoordeel het team op de drie pijlers van de Oranje Draad.
      </p>
      <ScoreVeld
        label="Plezier"
        max={5}
        value={teamScore.plezier}
        onChange={(v) => setTeamScore((p) => ({ ...p, plezier: v }))}
      />
      <textarea
        placeholder="Toelichting plezier (optioneel)"
        value={teamScore.plezierToelichting}
        onChange={(e) => setTeamScore((p) => ({ ...p, plezierToelichting: e.target.value }))}
        className="w-full rounded-md border px-3 py-2 text-sm"
        rows={2}
      />
      <ScoreVeld
        label="Ontwikkeling"
        max={5}
        value={teamScore.ontwikkeling}
        onChange={(v) => setTeamScore((p) => ({ ...p, ontwikkeling: v }))}
      />
      <textarea
        placeholder="Toelichting ontwikkeling (optioneel)"
        value={teamScore.ontwikkelingToelichting}
        onChange={(e) => setTeamScore((p) => ({ ...p, ontwikkelingToelichting: e.target.value }))}
        className="w-full rounded-md border px-3 py-2 text-sm"
        rows={2}
      />
      <ScoreVeld
        label="Prestatie"
        max={5}
        value={teamScore.prestatie}
        onChange={(v) => setTeamScore((p) => ({ ...p, prestatie: v }))}
      />
      <textarea
        placeholder="Toelichting prestatie (optioneel)"
        value={teamScore.prestatieToelichting}
        onChange={(e) => setTeamScore((p) => ({ ...p, prestatieToelichting: e.target.value }))}
        className="w-full rounded-md border px-3 py-2 text-sm"
        rows={2}
      />
      <button
        onClick={onVolgende}
        className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-md px-4 py-2 text-sm text-white"
      >
        Volgende: Spelersbeoordelingen
      </button>
    </div>
  );
}

export function StapSpelers({
  spelers,
  spelerScores,
  updateSpelerScore,
  onTerug,
  onVolgende,
}: {
  spelers: Speler[];
  spelerScores: SpelerScore[];
  updateSpelerScore: (
    index: number,
    field: keyof SpelerScore,
    value: number | string | null
  ) => void;
  onTerug: () => void;
  onVolgende: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Spelersbeoordelingen</h2>
      <p className="text-text-muted text-sm">Beoordeel elke speler individueel.</p>
      {spelers.map((speler, i) => (
        <div key={speler.relCode} className="bg-surface-card rounded-lg border p-4">
          <h3 className="font-medium">{speler.naam}</h3>
          <div className="mt-3 space-y-3">
            <ScoreVeld
              label="Niveau"
              max={5}
              value={spelerScores[i].niveau}
              onChange={(v) => updateSpelerScore(i, "niveau", v)}
            />
            <div>
              <label className="text-text-secondary block text-xs font-medium">Inzet</label>
              <div className="mt-1 flex gap-2">
                {[
                  { v: 1, l: "Minder" },
                  { v: 2, l: "Normaal" },
                  { v: 3, l: "Meer" },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateSpelerScore(i, "inzet", v)}
                    className={`rounded-md border px-3 py-1 text-xs ${spelerScores[i].inzet === v ? "border-ow-oranje bg-ow-oranje/20 text-ow-oranje" : "hover:bg-surface-raised"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-text-secondary block text-xs font-medium">Groei</label>
              <div className="mt-1 flex gap-2">
                {[
                  { v: 1, l: "Geen" },
                  { v: 2, l: "Weinig" },
                  { v: 3, l: "Normaal" },
                  { v: 4, l: "Veel" },
                ].map(({ v, l }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateSpelerScore(i, "groei", v)}
                    className={`rounded-md border px-3 py-1 text-xs ${spelerScores[i].groei === v ? "border-ow-oranje bg-ow-oranje/20 text-ow-oranje" : "hover:bg-surface-raised"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder="Opmerking (optioneel)"
              value={spelerScores[i].opmerking}
              onChange={(e) => updateSpelerScore(i, "opmerking", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              rows={2}
            />
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <button
          onClick={onTerug}
          className="bg-surface-sunken hover:bg-surface-raised rounded-md px-4 py-2 text-sm"
        >
          Terug
        </button>
        <button
          onClick={onVolgende}
          className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-md px-4 py-2 text-sm text-white"
        >
          Volgende: Samenvatting
        </button>
      </div>
    </div>
  );
}

export function StapSamenvatting({
  teamScore,
  spelers,
  spelerScores,
  saving,
  onTerug,
  onSubmit,
}: {
  teamScore: TeamScore;
  spelers: Speler[];
  spelerScores: SpelerScore[];
  saving: boolean;
  onTerug: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Samenvatting</h2>
      <div className="bg-surface-card rounded-lg border p-4">
        <h3 className="font-medium">Team-evaluatie</h3>
        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
          <div>
            Plezier: <strong>{teamScore.plezier ?? "-"}/5</strong>
          </div>
          <div>
            Ontwikkeling: <strong>{teamScore.ontwikkeling ?? "-"}/5</strong>
          </div>
          <div>
            Prestatie: <strong>{teamScore.prestatie ?? "-"}/5</strong>
          </div>
        </div>
      </div>
      <div className="bg-surface-card rounded-lg border p-4">
        <h3 className="font-medium">Spelersbeoordelingen ({spelerScores.length})</h3>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-text-muted border-b text-xs">
            <tr>
              <th className="pb-1">Speler</th>
              <th className="pb-1">Niveau</th>
              <th className="pb-1">Inzet</th>
              <th className="pb-1">Groei</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {spelers.map((s, i) => (
              <tr key={s.relCode}>
                <td className="py-1">{s.naam}</td>
                <td className="py-1">{spelerScores[i].niveau ?? "-"}/5</td>
                <td className="py-1">{spelerScores[i].inzet ?? "-"}/3</td>
                <td className="py-1">{spelerScores[i].groei ?? "-"}/4</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onTerug}
          className="bg-surface-sunken hover:bg-surface-raised rounded-md px-4 py-2 text-sm"
        >
          Terug
        </button>
        <button
          onClick={onSubmit}
          disabled={saving}
          className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? "Indienen..." : "Evaluatie indienen"}
        </button>
      </div>
    </div>
  );
}
