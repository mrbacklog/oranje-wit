"use client";

import { useState, useTransition } from "react";
import type { GezienStatus } from "@oranje-wit/database";
import { PEILJAAR } from "@oranje-wit/types";
import { GezienStatusBadge, GezienStatusDot } from "./GezienStatusBadge";
import {
  updateGezienStatus,
  batchUpdateGezienStatus,
  initialiseerBlauwdrukSpelers,
} from "@/app/(teamindeling)/teamindeling/blauwdruk/gezien-actions";

type SpelerData = {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geslacht: "M" | "V";
  huidig: { team?: string; kleur?: string; a_categorie?: string } | null;
  status: string;
};

type BlauwdrukSpelerRecord = {
  id: string;
  spelerId: string;
  gezienStatus: GezienStatus;
  notitie: string | null;
  signalering: string | null;
  speler: SpelerData;
  actiepunt: {
    id: string;
    beschrijving: string;
    status: string;
    deadline: Date | null;
    toegewezenAan: { naam: string };
  } | null;
  gezienDoor: { naam: string } | null;
};

interface GezienOverzichtProps {
  blauwdrukId: string;
  initialRecords: BlauwdrukSpelerRecord[];
  initialVoortgang: { totaal: number; gezien: number; perStatus: Record<string, number> };
  users: Array<{ id: string; naam: string }>;
}

type FilterStatus = "ALLE" | GezienStatus;

const STATUS_OPTIES: GezienStatus[] = ["GROEN", "GEEL", "ORANJE", "ROOD"];

const SIGNALERING_LABELS: Record<string, string> = {
  VERLAAT_U15: "Verlaat U15",
  VERLAAT_U17: "Verlaat U17",
  VERLAAT_U19: "Verlaat U19",
  NAAR_SENIOREN: "Naar senioren",
  VERLAAT_KLEUR: "Verlaat kleur",
  INSTROOMT_U15: "Instroomt U15",
  INSTROOMT_U17: "Instroomt U17",
  INSTROOMT_U19: "Instroomt U19",
};

export default function GezienOverzicht({
  blauwdrukId,
  initialRecords,
  initialVoortgang,
  users,
}: GezienOverzichtProps) {
  const [records, setRecords] = useState(initialRecords);
  const [voortgang, setVoortgang] = useState(initialVoortgang);
  const [filter, setFilter] = useState<FilterStatus>("ALLE");
  const [isPending, startTransition] = useTransition();

  const gefilterd = filter === "ALLE" ? records : records.filter((r) => r.gezienStatus === filter);

  const doorstroomRecords = records.filter((r) => r.signalering);

  const percentage =
    voortgang.totaal > 0 ? Math.round((voortgang.gezien / voortgang.totaal) * 100) : 0;

  function handleStatusChange(record: BlauwdrukSpelerRecord, newStatus: GezienStatus) {
    // Optimistic update
    setRecords((prev) =>
      prev.map((r) => (r.id === record.id ? { ...r, gezienStatus: newStatus } : r))
    );
    setVoortgang((prev) => {
      const wasGezien = record.gezienStatus !== "ONGEZIEN";
      const isGezien = newStatus !== "ONGEZIEN";
      return {
        ...prev,
        gezien: prev.gezien + (isGezien && !wasGezien ? 1 : !isGezien && wasGezien ? -1 : 0),
        perStatus: {
          ...prev.perStatus,
          [record.gezienStatus]: (prev.perStatus[record.gezienStatus] ?? 1) - 1,
          [newStatus]: (prev.perStatus[newStatus] ?? 0) + 1,
        },
      };
    });

    startTransition(async () => {
      await updateGezienStatus(blauwdrukId, record.spelerId, newStatus);
    });
  }

  function handleInitialiseer() {
    startTransition(async () => {
      await initialiseerBlauwdrukSpelers(blauwdrukId);
      // Page revalidation will refresh data
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      {/* Voortgangsbalk */}
      <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-neutral-200">Spelers gezien</h3>
          <span className="text-sm text-neutral-400">
            {voortgang.gezien} van {voortgang.totaal} ({percentage}%)
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-neutral-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-400 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="mt-2 flex gap-3 text-xs text-neutral-400">
          {(["ONGEZIEN", "GROEN", "GEEL", "ORANJE", "ROOD"] as GezienStatus[]).map(
            (s) =>
              (voortgang.perStatus[s] ?? 0) > 0 && (
                <span key={s} className="flex items-center gap-1">
                  <GezienStatusDot status={s} />
                  {voortgang.perStatus[s]}
                </span>
              )
          )}
        </div>
      </div>

      {/* Initialiseer-knop als er geen records zijn */}
      {records.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-600 p-8 text-center">
          <p className="mb-4 text-neutral-400">Nog geen spelers geladen voor deze blauwdruk.</p>
          <button
            onClick={handleInitialiseer}
            disabled={isPending}
            className="bg-ow-oranje rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isPending ? "Laden..." : "Spelers initialiseren"}
          </button>
        </div>
      )}

      {/* Doorstroom-signaleringen */}
      {doorstroomRecords.length > 0 && (
        <div className="rounded-lg border border-amber-800/30 bg-amber-900/10 p-4">
          <h3 className="mb-3 text-sm font-medium text-amber-400">
            Doorstroom-signaleringen ({doorstroomRecords.length})
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {doorstroomRecords.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md bg-neutral-800/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="text-sm text-neutral-200">
                    {r.speler.roepnaam} {r.speler.achternaam}
                  </span>
                  <span className="ml-2 text-xs text-amber-500">
                    {r.signalering ? (SIGNALERING_LABELS[r.signalering] ?? r.signalering) : ""}
                  </span>
                </div>
                <GezienStatusDot status={r.gezienStatus} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter-balk */}
      {records.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("ALLE")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === "ALLE"
                  ? "bg-neutral-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Alle ({records.length})
            </button>
            {(["ONGEZIEN", "GROEN", "GEEL", "ORANJE", "ROOD"] as GezienStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === s
                    ? "bg-neutral-600 text-white"
                    : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <GezienStatusDot status={s} />
                {voortgang.perStatus[s] ?? 0}
              </button>
            ))}
          </div>

          {/* Spelerslijst */}
          <div className="overflow-hidden rounded-lg border border-neutral-700">
            <table className="w-full text-sm">
              <thead className="bg-neutral-800/80 text-xs text-neutral-400">
                <tr>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Speler</th>
                  <th className="px-4 py-2 text-left">Leeftijd</th>
                  <th className="px-4 py-2 text-left">Huidig team</th>
                  <th className="px-4 py-2 text-left">Signaal</th>
                  <th className="px-4 py-2 text-left">Actie</th>
                  <th className="px-4 py-2 text-left">Gezien door</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {gefilterd.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-800/30">
                    <td className="px-4 py-2">
                      <GezienStatusBadge status={r.gezienStatus} />
                    </td>
                    <td className="px-4 py-2 text-neutral-200">
                      {r.speler.roepnaam} {r.speler.achternaam}
                      <span className="ml-1 text-xs text-neutral-500">{r.speler.geslacht}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-400">
                      {PEILJAAR - r.speler.geboortejaar}
                    </td>
                    <td className="px-4 py-2 text-neutral-400">
                      {(r.speler.huidig as { team?: string } | null)?.team ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      {r.signalering && (
                        <span className="text-xs text-amber-500">
                          {SIGNALERING_LABELS[r.signalering] ?? r.signalering}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={r.gezienStatus}
                        onChange={(e) => handleStatusChange(r, e.target.value as GezienStatus)}
                        className="rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-neutral-200"
                      >
                        <option value="ONGEZIEN">Ongezien</option>
                        {STATUS_OPTIES.map((s) => (
                          <option key={s} value={s}>
                            {s === "GROEN"
                              ? "Beschikbaar"
                              : s === "GEEL"
                                ? "Onzeker"
                                : s === "ORANJE"
                                  ? "Stop-signaal"
                                  : "Stopt"}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-xs text-neutral-500">
                      {r.gezienDoor?.naam ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
