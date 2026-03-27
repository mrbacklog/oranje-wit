"use client";

import { useState, useTransition } from "react";
import type { BesluitStatus, BesluitNiveau, Doelgroep } from "@oranje-wit/database";
import {
  updateBesluit,
  createBesluit,
  deleteBesluit,
  initialiseerStandaardBesluiten,
} from "@/app/blauwdruk/besluit-actions";

type ActiepuntData = {
  id: string;
  beschrijving: string;
  status: string;
  deadline: Date | null;
  toegewezenAan: { naam: string };
};

type BesluitRecord = {
  id: string;
  vraag: string;
  isStandaard: boolean;
  standaardCode: string | null;
  volgorde: number;
  antwoord: string | null;
  toelichting: string | null;
  status: BesluitStatus;
  niveau: BesluitNiveau;
  doelgroep: Doelgroep | null;
  auteur: { naam: string };
  actiepunten: ActiepuntData[];
  createdAt: Date;
};

interface BesluitenOverzichtProps {
  blauwdrukId: string;
  initialBesluiten: BesluitRecord[];
  initialStats: { totaal: number; onduidelijk: number; voorlopig: number; definitief: number };
}

const STATUS_CONFIG: Record<BesluitStatus, { label: string; bg: string; text: string; border: string }> = {
  ONDUIDELIJK: {
    label: "Onduidelijk",
    bg: "rgba(239, 68, 68, 0.15)",
    text: "#ef4444",
    border: "rgba(239, 68, 68, 0.3)",
  },
  VOORLOPIG: {
    label: "Voorlopig",
    bg: "rgba(234, 179, 8, 0.15)",
    text: "#eab308",
    border: "rgba(234, 179, 8, 0.3)",
  },
  DEFINITIEF: {
    label: "Definitief",
    bg: "rgba(34, 197, 94, 0.15)",
    text: "#22c55e",
    border: "rgba(34, 197, 94, 0.3)",
  },
};

const NIVEAU_LABELS: Record<BesluitNiveau, string> = {
  BESTUURLIJK: "Bestuurlijk",
  TECHNISCH: "Technisch",
};

function StatusBadge({ status }: { status: BesluitStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.text, borderColor: config.border }}
    >
      {config.label}
    </span>
  );
}

export default function BesluitenOverzicht({
  blauwdrukId,
  initialBesluiten,
  initialStats,
}: BesluitenOverzichtProps) {
  const [besluiten, setBesluiten] = useState(initialBesluiten);
  const [stats, setStats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();
  const [showNieuw, setShowNieuw] = useState(false);
  const [nieuweVraag, setNieuweVraag] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAntwoord, setEditAntwoord] = useState("");

  // Groepeer op categorieën (standaard: gegroepeerd, custom: apart)
  const standaard = besluiten.filter((b) => b.isStandaard);
  const custom = besluiten.filter((b) => !b.isStandaard);

  function handleStatusChange(besluit: BesluitRecord, newStatus: BesluitStatus) {
    setBesluiten((prev) =>
      prev.map((b) => (b.id === besluit.id ? { ...b, status: newStatus } : b))
    );
    // Update stats optimistic
    setStats((prev) => ({
      ...prev,
      [besluit.status.toLowerCase()]: Math.max(0, prev[besluit.status.toLowerCase() as keyof typeof prev] as number - 1),
      [newStatus.toLowerCase()]: (prev[newStatus.toLowerCase() as keyof typeof prev] as number) + 1,
    }));

    startTransition(async () => {
      await updateBesluit(besluit.id, { status: newStatus });
    });
  }

  function handleNiveauChange(besluit: BesluitRecord, newNiveau: BesluitNiveau) {
    setBesluiten((prev) =>
      prev.map((b) => (b.id === besluit.id ? { ...b, niveau: newNiveau } : b))
    );
    startTransition(async () => {
      await updateBesluit(besluit.id, { niveau: newNiveau });
    });
  }

  function startEditAntwoord(besluit: BesluitRecord) {
    setEditingId(besluit.id);
    setEditAntwoord(besluit.antwoord ?? "");
  }

  function saveAntwoord(besluitId: string) {
    setBesluiten((prev) =>
      prev.map((b) => (b.id === besluitId ? { ...b, antwoord: editAntwoord } : b))
    );
    setEditingId(null);
    startTransition(async () => {
      await updateBesluit(besluitId, { antwoord: editAntwoord });
    });
  }

  function handleCreateBesluit() {
    if (!nieuweVraag.trim()) return;
    setShowNieuw(false);
    startTransition(async () => {
      await createBesluit({ blauwdrukId, vraag: nieuweVraag.trim() });
      setNieuweVraag("");
      window.location.reload();
    });
  }

  function handleDelete(besluitId: string) {
    setBesluiten((prev) => prev.filter((b) => b.id !== besluitId));
    startTransition(async () => {
      await deleteBesluit(besluitId);
    });
  }

  function handleInitialiseer() {
    startTransition(async () => {
      await initialiseerStandaardBesluiten(blauwdrukId);
      window.location.reload();
    });
  }

  function renderBesluit(besluit: BesluitRecord) {
    const isEditing = editingId === besluit.id;

    return (
      <div
        key={besluit.id}
        className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-neutral-200">{besluit.vraag}</p>

            {/* Antwoord */}
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editAntwoord}
                  onChange={(e) => setEditAntwoord(e.target.value)}
                  className="w-full rounded border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
                  rows={2}
                  placeholder="Antwoord..."
                  autoFocus
                />
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => saveAntwoord(besluit.id)}
                    className="rounded bg-ow-oranje px-3 py-1 text-xs text-white hover:bg-orange-600"
                  >
                    Opslaan
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="mt-1 cursor-pointer text-sm text-neutral-400 hover:text-neutral-300"
                onClick={() => startEditAntwoord(besluit)}
              >
                {besluit.antwoord || "Klik om antwoord toe te voegen..."}
              </div>
            )}

            {/* Actiepunten */}
            {besluit.actiepunten.length > 0 && (
              <div className="mt-2 space-y-1">
                {besluit.actiepunten.map((ap) => (
                  <div key={ap.id} className="flex items-center gap-2 text-xs text-neutral-500">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        ap.status === "AFGEROND" ? "bg-green-500" : "bg-amber-500"
                      }`}
                    />
                    {ap.beschrijving}
                    <span className="text-neutral-600">— {ap.toegewezenAan.naam}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            <StatusBadge status={besluit.status} />

            <div className="flex gap-1">
              <select
                value={besluit.status}
                onChange={(e) => handleStatusChange(besluit, e.target.value as BesluitStatus)}
                className="rounded border border-neutral-600 bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-300"
              >
                <option value="ONDUIDELIJK">Onduidelijk</option>
                <option value="VOORLOPIG">Voorlopig</option>
                <option value="DEFINITIEF">Definitief</option>
              </select>

              <select
                value={besluit.niveau}
                onChange={(e) => handleNiveauChange(besluit, e.target.value as BesluitNiveau)}
                className="rounded border border-neutral-600 bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-300"
              >
                <option value="TECHNISCH">Technisch</option>
                <option value="BESTUURLIJK">Bestuurlijk</option>
              </select>
            </div>

            {!besluit.isStandaard && (
              <button
                onClick={() => handleDelete(besluit.id)}
                className="text-xs text-red-500 hover:text-red-400"
              >
                Verwijder
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const percentage =
    stats.totaal > 0 ? Math.round((stats.definitief / stats.totaal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Voortgang */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-200">Besluiten</h3>
          <span className="text-sm text-neutral-400">
            {stats.definitief} van {stats.totaal} definitief ({percentage}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-neutral-700">
          <div className="flex h-full">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${stats.totaal > 0 ? (stats.definitief / stats.totaal) * 100 : 0}%` }}
            />
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${stats.totaal > 0 ? (stats.voorlopig / stats.totaal) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> {stats.onduidelijk} onduidelijk
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> {stats.voorlopig} voorlopig
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" /> {stats.definitief} definitief
          </span>
        </div>
      </div>

      {/* Lege staat */}
      {besluiten.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-600 p-8 text-center">
          <p className="mb-4 text-neutral-400">
            Nog geen besluiten voor deze blauwdruk.
          </p>
          <button
            onClick={handleInitialiseer}
            disabled={isPending}
            className="rounded-lg bg-ow-oranje px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isPending ? "Laden..." : "Standaardvragen laden"}
          </button>
        </div>
      )}

      {/* Standaardvragen */}
      {standaard.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-300">Standaardvragen</h3>
          <div className="space-y-3">{standaard.map(renderBesluit)}</div>
        </div>
      )}

      {/* Aanvullende vragen */}
      {custom.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-neutral-300">Aanvullende vragen</h3>
          <div className="space-y-3">{custom.map(renderBesluit)}</div>
        </div>
      )}

      {/* Nieuwe vraag toevoegen */}
      {besluiten.length > 0 && (
        <div>
          {showNieuw ? (
            <div className="rounded-lg border border-neutral-600 bg-neutral-800/50 p-4">
              <textarea
                value={nieuweVraag}
                onChange={(e) => setNieuweVraag(e.target.value)}
                className="w-full rounded border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-neutral-200"
                rows={2}
                placeholder="Stel een vraag..."
                autoFocus
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleCreateBesluit}
                  disabled={!nieuweVraag.trim() || isPending}
                  className="rounded bg-ow-oranje px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  Toevoegen
                </button>
                <button
                  onClick={() => { setShowNieuw(false); setNieuweVraag(""); }}
                  className="rounded px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNieuw(true)}
              className="rounded-lg border border-dashed border-neutral-600 px-4 py-2.5 text-sm text-neutral-400 hover:border-neutral-500 hover:text-neutral-300"
            >
              + Voeg vraag toe
            </button>
          )}
        </div>
      )}
    </div>
  );
}
