"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  token: string;
}

export default function SpelerZelfEvaluatieForm({ token }: Props) {
  const router = useRouter();
  const [stap, setStap] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Plezier
  const [plezierKorfbal, setPlezierKorfbal] = useState<number | null>(null);
  const [plezierTeam, setPlezierTeam] = useState<number | null>(null);
  const [plezierUitdaging, setPlezierUitdaging] = useState<number | null>(null);
  const [plezierToelichting, setPlezierToelichting] = useState("");

  // Training
  const [trainingZin, setTrainingZin] = useState<number | null>(null);
  const [trainingKwaliteit, setTrainingKwaliteit] = useState<number | null>(null);
  const [wedstrijdBeleving, setWedstrijdBeleving] = useState<number | null>(null);
  const [trainingVerbetering, setTrainingVerbetering] = useState<number | null>(null);
  const [trainingToelichting, setTrainingToelichting] = useState("");

  // Toekomst
  const [toekomstIntentie, setToekomstIntentie] = useState<string | null>(null);
  const [toekomstAmbitie, setToekomstAmbitie] = useState<string | null>(null);
  const [toekomstToelichting, setToekomstToelichting] = useState("");

  // Algemeen
  const [algemeenOpmerking, setAlgemeenOpmerking] = useState("");

  async function indienen() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/zelf-evaluaties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          plezierKorfbal,
          plezierTeam,
          plezierUitdaging,
          plezierToelichting,
          trainingZin,
          trainingKwaliteit,
          wedstrijdBeleving,
          trainingVerbetering,
          trainingToelichting,
          toekomstIntentie,
          toekomstAmbitie,
          toekomstToelichting,
          algemeenOpmerking,
        }),
      });
      if (res.ok) {
        router.push("/zelf/bedankt");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const stappen = [
    <div key="plezier" className="space-y-6">
      <h2 className="text-lg font-semibold">Plezier & Sfeer</h2>
      <ScoreRij
        label="Ik heb plezier in het korfballen"
        value={plezierKorfbal}
        onChange={setPlezierKorfbal}
      />
      <ScoreRij
        label="Ik voel me thuis in mijn team"
        value={plezierTeam}
        onChange={setPlezierTeam}
      />
      <ScoreRij
        label="Ik word voldoende uitgedaagd"
        value={plezierUitdaging}
        onChange={setPlezierUitdaging}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700">Toelichting (optioneel)</label>
        <textarea
          value={plezierToelichting}
          onChange={(e) => setPlezierToelichting(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    </div>,

    <div key="training" className="space-y-6">
      <h2 className="text-lg font-semibold">Trainingen & Wedstrijden</h2>
      <ScoreRij label="Ik heb zin in trainen" value={trainingZin} onChange={setTrainingZin} />
      <ScoreRij
        label="De trainingen zijn goed"
        value={trainingKwaliteit}
        onChange={setTrainingKwaliteit}
      />
      <ScoreRij
        label="Ik geniet van wedstrijden"
        value={wedstrijdBeleving}
        onChange={setWedstrijdBeleving}
      />
      <ScoreRij
        label="Ik merk dat ik beter word"
        value={trainingVerbetering}
        onChange={setTrainingVerbetering}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700">Toelichting (optioneel)</label>
        <textarea
          value={trainingToelichting}
          onChange={(e) => setTrainingToelichting(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    </div>,

    <div key="toekomst" className="space-y-6">
      <h2 className="text-lg font-semibold">Toekomst</h2>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Wat wil je komend seizoen?</p>
        {[
          { value: "doorgaan", label: "Ik wil doorgaan" },
          { value: "twijfel", label: "Ik twijfel" },
          { value: "stop", label: "Ik wil stoppen" },
        ].map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2 py-1">
            <input
              type="radio"
              name="intentie"
              checked={toekomstIntentie === opt.value}
              onChange={() => setToekomstIntentie(opt.value)}
              className="accent-orange-600"
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Op welk niveau wil je spelen?</p>
        {[
          { value: "hoger", label: "Hoger spelen" },
          { value: "zelfde", label: "Zelfde niveau" },
          { value: "lager", label: "Lager spelen" },
        ].map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2 py-1">
            <input
              type="radio"
              name="ambitie"
              checked={toekomstAmbitie === opt.value}
              onChange={() => setToekomstAmbitie(opt.value)}
              className="accent-orange-600"
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Toelichting (optioneel)</label>
        <textarea
          value={toekomstToelichting}
          onChange={(e) => setToekomstToelichting(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
    </div>,

    <div key="algemeen" className="space-y-6">
      <h2 className="text-lg font-semibold">Algemeen</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Heb je nog iets te melden? (max 500 tekens)
        </label>
        <textarea
          value={algemeenOpmerking}
          onChange={(e) => setAlgemeenOpmerking(e.target.value.slice(0, 500))}
          rows={4}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">{algemeenOpmerking.length}/500</p>
      </div>
    </div>,
  ];

  return (
    <div className="rounded-lg border bg-white p-6">
      {/* Progress */}
      <div className="mb-6 flex gap-2">
        {["Plezier", "Training", "Toekomst", "Algemeen"].map((label, i) => (
          <div
            key={label}
            className={`flex-1 rounded-full py-1 text-center text-xs font-medium ${
              i === stap
                ? "bg-orange-600 text-white"
                : i < stap
                  ? "bg-orange-100 text-orange-600"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {stappen[stap]}

      <div className="mt-6 flex justify-between">
        {stap > 0 ? (
          <button
            onClick={() => setStap(stap - 1)}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
          >
            Vorige
          </button>
        ) : (
          <div />
        )}
        {stap < stappen.length - 1 ? (
          <button
            onClick={() => setStap(stap + 1)}
            className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
          >
            Volgende
          </button>
        ) : (
          <button
            onClick={indienen}
            disabled={submitting}
            className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Verzenden..." : "Indienen"}
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreRij({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition ${
              value === n
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-orange-100"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
