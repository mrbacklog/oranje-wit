"use client";

import { useState } from "react";
import { Button, Badge, Dialog, Input, Select } from "@oranje-wit/ui";
import type { MijlpaalRow, ActionResult } from "./actions";
import { createMijlpaal, toggleMijlpaalAfgerond, deleteMijlpaal } from "./actions";

function formatDatum(d: Date): string {
  return new Date(d).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface MijlpalenLijstProps {
  initialData: MijlpaalRow[];
  seizoenOpties: { seizoen: string; status: string }[];
}

export function MijlpalenLijst({ initialData, seizoenOpties }: MijlpalenLijstProps) {
  const [showNieuw, setShowNieuw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [togglePending, setTogglePending] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState<string | null>(null);

  // Groepeer per seizoen
  const perSeizoen = new Map<string, MijlpaalRow[]>();
  for (const m of initialData) {
    const lijst = perSeizoen.get(m.seizoen) ?? [];
    lijst.push(m);
    perSeizoen.set(m.seizoen, lijst);
  }

  async function handleCreate(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createMijlpaal(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      setShowNieuw(false);
      setSuccess("Mijlpaal aangemaakt");
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  async function handleToggle(id: string) {
    setTogglePending(id);
    setError(null);
    const result = await toggleMijlpaalAfgerond(id);
    setTogglePending(null);
    if (!result.ok) {
      setError(result.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je deze mijlpaal wilt verwijderen?")) return;
    setDeletePending(id);
    setError(null);
    const result = await deleteMijlpaal(id);
    setDeletePending(null);
    if (!result.ok) {
      setError(result.error);
    } else {
      setSuccess("Mijlpaal verwijderd");
      setTimeout(() => setSuccess(null), 3000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Actiebalk */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {initialData.length} mijlpa{initialData.length !== 1 ? "len" : "al"}
        </p>
        <Button size="sm" onClick={() => setShowNieuw(true)}>
          Nieuwe mijlpaal
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

      {/* Tabel gegroepeerd per seizoen */}
      {perSeizoen.size === 0 ? (
        <div
          className="overflow-hidden rounded-xl border px-6 py-12 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nog geen mijlpalen. Voeg er een toe.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(perSeizoen.entries()).map(([seizoen, items]) => (
            <div
              key={seizoen}
              className="overflow-hidden rounded-xl border"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {seizoen}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="beheer-table">
                  <thead>
                    <tr>
                      <th className="w-16">#</th>
                      <th>Mijlpaal</th>
                      <th>Datum</th>
                      <th>Status</th>
                      <th className="text-right">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((m) => (
                      <tr key={m.id}>
                        <td className="dimmed">{m.volgorde}</td>
                        <td className="font-medium">{m.label}</td>
                        <td className="muted">{formatDatum(m.datum)}</td>
                        <td>
                          <button
                            onClick={() => handleToggle(m.id)}
                            disabled={togglePending === m.id}
                            title={m.afgerond ? "Klik om te heropenen" : "Klik om af te vinken"}
                          >
                            {m.afgerond ? (
                              <span className="status-badge actief">
                                <span className="status-dot" />
                                Afgerond
                              </span>
                            ) : (
                              <Badge color="orange">Open</Badge>
                            )}
                          </button>
                        </td>
                        <td className="text-right">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(m.id)}
                            disabled={deletePending === m.id}
                          >
                            {deletePending === m.id ? "Bezig..." : "Verwijder"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nieuwe mijlpaal dialog */}
      <Dialog
        open={showNieuw}
        onClose={() => {
          setShowNieuw(false);
          setError(null);
        }}
        title="Nieuwe mijlpaal"
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
            <Button size="sm" type="submit" form="form-nieuwe-mijlpaal" disabled={pending}>
              {pending ? "Bezig..." : "Toevoegen"}
            </Button>
          </>
        }
      >
        <form id="form-nieuwe-mijlpaal" action={handleCreate} className="space-y-4">
          <Select label="Seizoen" name="seizoen" required>
            <option value="">Kies een seizoen</option>
            {seizoenOpties.map((s) => (
              <option key={s.seizoen} value={s.seizoen}>
                {s.seizoen} ({s.status.toLowerCase()})
              </option>
            ))}
          </Select>
          <Input label="Mijlpaal" name="label" required placeholder="Bijv. Seizoensstart" />
          <Input label="Datum" name="datum" type="date" required />
          <Input label="Volgorde" name="volgorde" type="number" defaultValue="0" />
        </form>
      </Dialog>
    </div>
  );
}
