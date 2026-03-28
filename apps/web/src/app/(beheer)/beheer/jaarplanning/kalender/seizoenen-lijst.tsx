"use client";

import { useState } from "react";
import { Button, Badge, Dialog, Input } from "@oranje-wit/ui";
import type { SeizoenRow, ActionResult } from "./actions";
import { maakNieuwSeizoen, updateSeizoenStatus } from "./actions";

function formatDatum(d: Date): string {
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_TRANSITIONS: Record<string, { label: string; next: string }> = {
  VOORBEREIDING: { label: "Activeren", next: "ACTIEF" },
  ACTIEF: { label: "Afronden", next: "AFGEROND" },
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    ACTIEF: { cls: "actief", label: "Actief" },
    VOORBEREIDING: { cls: "voorbereiding", label: "Voorbereiding" },
    AFGEROND: { cls: "afgerond", label: "Afgerond" },
  };
  const s = map[status] ?? { cls: "afgerond", label: status };
  return (
    <span className={`status-badge ${s.cls}`}>
      <span className="status-dot" />
      {s.label}
    </span>
  );
}

interface SeizoenenLijstProps {
  initialData: SeizoenRow[];
}

export function SeizoenenLijst({ initialData }: SeizoenenLijstProps) {
  const [showNieuw, setShowNieuw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [statusPending, setStatusPending] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setPending(true);
    setError(null);
    const seizoen = formData.get("seizoen") as string;
    const result = await maakNieuwSeizoen(seizoen);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      setShowNieuw(false);
      setSuccess(`Seizoen ${seizoen} aangemaakt`);
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  async function handleStatusWijzig(seizoen: string, nieuweStatus: string) {
    if (!confirm(`Weet je zeker dat je seizoen ${seizoen} naar "${nieuweStatus}" wilt zetten?`))
      return;
    setStatusPending(seizoen);
    setError(null);
    const result = await updateSeizoenStatus(seizoen, nieuweStatus);
    setStatusPending(null);
    if (!result.ok) {
      setError(result.error);
    } else {
      setSuccess(`Seizoen ${seizoen} is nu ${nieuweStatus}`);
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Actiebalk */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {initialData.length} seizoen{initialData.length !== 1 ? "en" : ""}
        </p>
        <Button size="sm" onClick={() => setShowNieuw(true)}>
          Nieuw seizoen
        </Button>
      </div>

      {/* Feedback */}
      {error && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--color-error-50)",
            borderColor: "rgba(239, 68, 68, 0.25)",
            color: "var(--color-error-500)",
          }}
        >
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">
            Sluiten
          </button>
        </div>
      )}
      {success && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderColor: "rgba(34, 197, 94, 0.25)",
            color: "rgb(34, 197, 94)",
          }}
        >
          {success}
        </div>
      )}

      {/* Tabel */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        {initialData.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Geen seizoenen gevonden. Maak een nieuw seizoen aan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="beheer-table">
              <thead>
                <tr>
                  <th>Seizoen</th>
                  <th>Start</th>
                  <th>Eind</th>
                  <th>Peildatum</th>
                  <th>Status</th>
                  <th className="text-right">Teams</th>
                  <th className="text-right">Spelers</th>
                  <th className="text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {initialData.map((s) => {
                  const transition = STATUS_TRANSITIONS[s.status];
                  return (
                    <tr key={s.seizoen}>
                      <td className="font-medium">{s.seizoen}</td>
                      <td className="muted">{formatDatum(s.startDatum)}</td>
                      <td className="muted">{formatDatum(s.eindDatum)}</td>
                      <td className="muted">{formatDatum(s.peildatum)}</td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="muted text-right">{s._count.owTeams}</td>
                      <td className="muted text-right">{s._count.competitieSpelers}</td>
                      <td className="text-right">
                        {transition && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusWijzig(s.seizoen, transition.next)}
                            disabled={statusPending === s.seizoen}
                          >
                            {statusPending === s.seizoen ? "Bezig..." : transition.label}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nieuw seizoen dialog */}
      <Dialog
        open={showNieuw}
        onClose={() => {
          setShowNieuw(false);
          setError(null);
        }}
        title="Nieuw seizoen aanmaken"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowNieuw(false);
                setError(null);
              }}
            >
              Annuleren
            </Button>
            <Button size="sm" type="submit" form="form-nieuw-seizoen" disabled={pending}>
              {pending ? "Bezig..." : "Aanmaken"}
            </Button>
          </>
        }
      >
        <form id="form-nieuw-seizoen" action={handleCreate} className="space-y-4">
          <Input
            label="Seizoen"
            name="seizoen"
            required
            placeholder="2026-2027"
            pattern="\d{4}-\d{4}"
          />
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            Startdatum wordt 1 augustus, einddatum 30 juni. Status begint als
            &quot;Voorbereiding&quot;.
          </p>
        </form>
      </Dialog>
    </div>
  );
}
