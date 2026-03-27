"use client";

import { useEffect, useState, use } from "react";

interface Ronde {
  id: string;
  seizoen: string;
  ronde: number;
  naam: string;
  type: string;
  deadline: string;
  status: string;
  uitnodigingen: Array<{
    id: string;
    naam: string;
    email: string;
    owTeam?: { id: number; naam: string } | null;
    emailVerstuurd: string | null;
    reminderVerstuurd: string | null;
  }>;
  evaluaties: Array<{
    id: string;
    spelerId: string;
    status: string;
    teamNaam: string | null;
    coach: string | null;
    ingediendOp: string | null;
  }>;
}

interface Team {
  id: number;
  naam: string;
  categorie: string;
  spelers: Array<{
    relCode: string;
    naam: string;
    geslacht: string;
    email?: string | null;
  }>;
}

export default function RondeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ronde, setRonde] = useState<Ronde | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [actie, setActie] = useState<string | null>(null);

  const fetchRonde = () => {
    fetch(`/api/rondes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setRonde(data.data);
      });
  };

  useEffect(() => {
    Promise.all([
      fetch(`/api/rondes/${id}`).then((r) => r.json()),
      fetch(`/api/rondes/${id}/teams`).then((r) => r.json()),
    ]).then(([rondeData, teamsData]) => {
      if (rondeData.ok) setRonde(rondeData.data);
      if (teamsData.ok) setTeams(teamsData.data.teams);
      setLoading(false);
    });
  }, [id]);

  async function updateStatus(status: string) {
    setActie("status");
    await fetch(`/api/rondes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRonde();
    setActie(null);
  }

  async function verstuurHerinneringen() {
    setActie("herinneren");
    const res = await fetch(`/api/rondes/${id}/herinneren`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.ok) {
      alert(`${data.data.verstuurd} van ${data.data.totaal} herinneringen verstuurd.`);
    }
    fetchRonde();
    setActie(null);
  }

  if (loading || !ronde) return <p className="text-text-muted">Laden...</p>;

  const statusKleuren: Record<string, string> = {
    concept: "bg-surface-sunken text-text-secondary",
    actief: "bg-green-900/30 text-green-400",
    gesloten: "bg-red-900/30 text-red-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">{ronde.naam}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusKleuren[ronde.status] ?? ""}`}
          >
            {ronde.status}
          </span>
        </div>
        <p className="text-text-muted mt-1 text-sm">
          {ronde.seizoen} &middot; Ronde {ronde.ronde} &middot; {ronde.type} &middot; Deadline:{" "}
          {new Date(ronde.deadline).toLocaleDateString("nl-NL")}
        </p>
      </div>

      {/* Status knoppen */}
      <div className="flex gap-2">
        {ronde.status === "concept" && (
          <button
            onClick={() => updateStatus("actief")}
            disabled={!!actie}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            Activeren
          </button>
        )}
        {ronde.status === "actief" && (
          <>
            <button
              onClick={() => updateStatus("gesloten")}
              disabled={!!actie}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              Sluiten
            </button>
            <button
              onClick={verstuurHerinneringen}
              disabled={!!actie}
              className="rounded-md bg-yellow-600 px-3 py-1.5 text-sm text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              {actie === "herinneren" ? "Versturen..." : "Herinneringen sturen"}
            </button>
          </>
        )}
      </div>

      {/* Uitnodigingen overzicht */}
      <div>
        <h2 className="text-lg font-semibold">Uitnodigingen ({ronde.uitnodigingen.length})</h2>
        {ronde.uitnodigingen.length === 0 ? (
          <p className="text-text-muted mt-2 text-sm">Nog geen uitnodigingen verstuurd.</p>
        ) : (
          <table className="mt-2 w-full text-left text-sm">
            <thead
              className="text-text-muted border-b"
              style={{ borderColor: "var(--border-default)" }}
            >
              <tr>
                <th className="pb-2">Naam</th>
                <th className="pb-2">E-mail</th>
                <th className="pb-2">Team</th>
                <th className="pb-2">Verstuurd</th>
                <th className="pb-2">Herinnering</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border-light)" }}>
              {ronde.uitnodigingen.map((u) => {
                const heeftEvaluatie = ronde.evaluaties.some(
                  (e) => e.coach === u.naam && e.teamNaam === u.owTeam?.naam
                );
                return (
                  <tr key={u.id}>
                    <td className="py-2">{u.naam}</td>
                    <td className="text-text-muted py-2">{u.email}</td>
                    <td className="py-2">{u.owTeam?.naam ?? "-"}</td>
                    <td className="text-text-muted py-2">
                      {u.emailVerstuurd
                        ? new Date(u.emailVerstuurd).toLocaleDateString("nl-NL")
                        : "-"}
                    </td>
                    <td className="text-text-muted py-2">
                      {u.reminderVerstuurd
                        ? new Date(u.reminderVerstuurd).toLocaleDateString("nl-NL")
                        : "-"}
                    </td>
                    <td className="py-2">
                      {heeftEvaluatie ? (
                        <span className="font-medium text-green-400">Ingediend</span>
                      ) : (
                        <span className="text-yellow-400">Openstaand</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Teams */}
      <div>
        <h2 className="text-lg font-semibold">Teams ({teams.length})</h2>
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-lg border p-4"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-default)",
              }}
            >
              <h3 className="font-semibold">{team.naam}</h3>
              <p className="text-text-muted text-xs">
                {team.categorie} &middot; {team.spelers.length} spelers
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
