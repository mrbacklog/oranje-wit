"use client";

import { useEffect, useState } from "react";

interface CoordinatorTeam {
  id: string;
  owTeamId: number;
  seizoen: string;
  owTeam: { id: number; naam: string };
}

interface Coordinator {
  id: string;
  naam: string;
  email: string;
  teams: CoordinatorTeam[];
}

const SEIZOEN = "2025-2026";

export default function CoordinatorenPage() {
  const [coordinatoren, setCoordinatoren] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    fetch("/api/coordinatoren")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setCoordinatoren(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function addCoordinator(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/coordinatoren", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ naam, email }),
    });
    const data = await res.json();
    if (data.ok) {
      setNaam("");
      setEmail("");
      fetchData();
    } else {
      alert(data.error?.message ?? "Fout");
    }
    setSaving(false);
  }

  async function deleteCoordinator(id: string, coordNaam: string) {
    if (!confirm(`Weet je zeker dat je ${coordNaam} wilt verwijderen?`)) return;
    await fetch(`/api/coordinatoren/${id}`, { method: "DELETE" });
    fetchData();
  }

  async function linkTeam(coordinatorId: string, owTeamId: number) {
    await fetch(`/api/coordinatoren/${coordinatorId}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owTeamId, seizoen: SEIZOEN }),
    });
    fetchData();
  }

  async function unlinkTeam(coordinatorId: string, owTeamId: number) {
    await fetch(`/api/coordinatoren/${coordinatorId}/teams`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owTeamId, seizoen: SEIZOEN }),
    });
    fetchData();
  }

  if (loading) return <p className="text-gray-500">Laden...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold">Coordinatoren</h1>

      {/* Toevoegen */}
      <form onSubmit={addCoordinator} className="flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Naam</label>
          <input
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            required
            className="mt-1 rounded-md border px-3 py-2 text-sm"
            placeholder="Naam"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="mt-1 rounded-md border px-3 py-2 text-sm"
            placeholder="email@voorbeeld.nl"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
        >
          Toevoegen
        </button>
      </form>

      {/* Lijst */}
      {coordinatoren.length === 0 ? (
        <p className="text-gray-500">Nog geen coordinatoren.</p>
      ) : (
        <div className="space-y-4">
          {coordinatoren.map((c) => (
            <CoordinatorCard
              key={c.id}
              coordinator={c}
              onDelete={() => deleteCoordinator(c.id, c.naam)}
              onLinkTeam={(teamId) => linkTeam(c.id, teamId)}
              onUnlinkTeam={(teamId) => unlinkTeam(c.id, teamId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CoordinatorCard({
  coordinator,
  onDelete,
  onLinkTeam,
  onUnlinkTeam,
}: {
  coordinator: Coordinator;
  onDelete: () => void;
  onLinkTeam: (teamId: number) => void;
  onUnlinkTeam: (teamId: number) => void;
}) {
  const [teamIdInput, setTeamIdInput] = useState("");
  const seizoenTeams = coordinator.teams.filter((t) => t.seizoen === SEIZOEN);

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{coordinator.naam}</h3>
          <p className="text-sm text-gray-500">{coordinator.email}</p>
        </div>
        <button onClick={onDelete} className="text-sm text-red-600 hover:text-red-800">
          Verwijderen
        </button>
      </div>

      {/* Gekoppelde teams */}
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 uppercase">Teams ({SEIZOEN})</p>
        {seizoenTeams.length === 0 ? (
          <p className="mt-1 text-sm text-gray-400">Geen teams gekoppeld</p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-2">
            {seizoenTeams.map((t) => (
              <span
                key={t.id}
                className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs"
              >
                {t.owTeam.naam}
                <button
                  onClick={() => onUnlinkTeam(t.owTeamId)}
                  className="ml-1 text-red-400 hover:text-red-600"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Team koppelen */}
        <div className="mt-2 flex gap-2">
          <input
            value={teamIdInput}
            onChange={(e) => setTeamIdInput(e.target.value)}
            placeholder="Team ID"
            className="w-24 rounded-md border px-2 py-1 text-xs"
          />
          <button
            onClick={() => {
              const id = Number(teamIdInput);
              if (id > 0) {
                onLinkTeam(id);
                setTeamIdInput("");
              }
            }}
            className="rounded-md bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
          >
            Koppelen
          </button>
        </div>
      </div>
    </div>
  );
}
