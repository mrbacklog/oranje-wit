"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  StapTeam,
  StapSpelers,
  StapSamenvatting,
  type Speler,
  type SpelerScore,
  type TeamScore,
} from "@/components/evaluatie/TrainerEvaluatieStappen";

interface Props {
  token: string;
  trainerNaam: string;
  teamNaam: string;
  rondeNaam: string;
  deadline: string;
  spelers: Speler[];
}

export default function TrainerEvaluatieForm({
  token,
  trainerNaam,
  teamNaam,
  rondeNaam,
  deadline,
  spelers,
}: Props) {
  const router = useRouter();
  const [stap, setStap] = useState(1);
  const [saving, setSaving] = useState(false);

  const [teamScore, setTeamScore] = useState<TeamScore>({
    plezier: null,
    plezierToelichting: "",
    ontwikkeling: null,
    ontwikkelingToelichting: "",
    prestatie: null,
    prestatieToelichting: "",
  });

  const [spelerScores, setSpelerScores] = useState<SpelerScore[]>(
    spelers.map((s) => ({
      relCode: s.relCode,
      niveau: null,
      inzet: null,
      groei: null,
      opmerking: "",
    }))
  );

  function updateSpelerScore(
    index: number,
    field: keyof SpelerScore,
    value: number | string | null
  ) {
    setSpelerScores((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  async function handleSubmit() {
    setSaving(true);
    const body = {
      token,
      teamScore,
      spelerScores: spelerScores.map((s) => ({
        ...s,
        naam: spelers.find((sp) => sp.relCode === s.relCode)?.naam ?? s.relCode,
      })),
    };

    const res = await fetch("/api/evaluatie/evaluaties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.ok) {
      router.push(`/evaluatie/invullen/bedankt?team=${encodeURIComponent(teamNaam)}`);
    } else {
      alert(data.error?.message ?? "Er ging iets mis bij het opslaan.");
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-ow-oranje text-xl font-bold">Evaluatie {teamNaam}</h1>
        <p className="text-text-muted text-sm">
          {rondeNaam} &middot; Trainer: {trainerNaam} &middot; Deadline:{" "}
          {new Date(deadline).toLocaleDateString("nl-NL")}
        </p>
      </div>
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= stap ? "bg-ow-oranje" : "bg-surface-sunken"}`}
          />
        ))}
      </div>
      {stap === 1 && (
        <StapTeam teamScore={teamScore} setTeamScore={setTeamScore} onVolgende={() => setStap(2)} />
      )}
      {stap === 2 && (
        <StapSpelers
          spelers={spelers}
          spelerScores={spelerScores}
          updateSpelerScore={updateSpelerScore}
          onTerug={() => setStap(1)}
          onVolgende={() => setStap(3)}
        />
      )}
      {stap === 3 && (
        <StapSamenvatting
          teamScore={teamScore}
          spelers={spelers}
          spelerScores={spelerScores}
          saving={saving}
          onTerug={() => setStap(2)}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}
