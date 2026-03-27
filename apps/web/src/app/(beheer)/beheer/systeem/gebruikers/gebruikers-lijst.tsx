"use client";

import { useState } from "react";
import { Button, Badge, Dialog, Input, Select } from "@oranje-wit/ui";
import type { GebruikerRow } from "./actions";
import {
  createGebruiker,
  updateGebruiker,
  toggleActief,
  deleteGebruiker,
  stuurSmartlink,
} from "./actions";

// ── Helpers ───────────────────────────────────────────────────

const CLEARANCE_LABELS: Record<number, string> = {
  0: "Geen",
  1: "Basis",
  2: "Uitgebreid",
  3: "Volledig",
};

// ── Props ─────────────────────────────────────────────────────

interface GebruikersLijstProps {
  initialData: GebruikerRow[];
}

// ── Component ─────────────────────────────────────────────────

export function GebruikersLijst({ initialData }: GebruikersLijstProps) {
  const [showNieuw, setShowNieuw] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [smartlinkPending, setSmartlinkPending] = useState<string | null>(null);
  const [smartlinkUrl, setSmartlinkUrl] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createGebruiker(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
    } else {
      setShowNieuw(false);
      setError(null);
    }
  }

  async function handleCapabilityWijzig(id: string, field: string, value: string | boolean) {
    const fd = new FormData();
    fd.set(field, String(value));
    const result = await updateGebruiker(id, fd);
    if (!result.ok) {
      setError(result.error);
    }
    setEditId(null);
  }

  async function handleToggleActief(id: string) {
    const result = await toggleActief(id);
    if (!result.ok) {
      setError(result.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Weet je zeker dat je deze gebruiker wilt verwijderen?")) return;
    const result = await deleteGebruiker(id);
    if (!result.ok) {
      setError(result.error);
    }
  }

  async function handleSmartlink(id: string) {
    setSmartlinkPending(id);
    setError(null);
    const result = await stuurSmartlink(id);
    setSmartlinkPending(null);
    if (!result.ok) {
      setError(result.error);
    } else {
      const url = result.data.url;
      try {
        await navigator.clipboard.writeText(url);
        setSmartlinkUrl(url);
        setTimeout(() => setSmartlinkUrl(null), 5000);
      } catch {
        setSmartlinkUrl(url);
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Actiebalk */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {initialData.length} gebruiker{initialData.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setShowNieuw(true)}>
          Uitnodigen
        </Button>
      </div>

      {/* Foutmelding */}
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

      {/* Smartlink gekopieerd */}
      {smartlinkUrl && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            borderColor: "rgba(34, 197, 94, 0.25)",
            color: "rgb(34, 197, 94)",
          }}
        >
          Smartlink gekopieerd naar klembord!
          <button onClick={() => setSmartlinkUrl(null)} className="ml-2 font-medium underline">
            Sluiten
          </button>
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
        <div className="overflow-x-auto">
          <table className="beheer-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>E-mail</th>
                <th>Capabilities</th>
                <th>Clearance</th>
                <th>Status</th>
                <th className="text-right">Acties</th>
              </tr>
            </thead>
            <tbody>
              {initialData.map((g) => (
                <tr key={g.id} style={{ opacity: g.actief ? 1 : 0.45 }}>
                  <td className="font-medium">{g.naam}</td>
                  <td className="muted">{g.email}</td>
                  <td>
                    {editId === g.id ? (
                      <div className="flex flex-wrap gap-2">
                        <label
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <input
                            type="checkbox"
                            defaultChecked={g.isTC}
                            onChange={(e) => handleCapabilityWijzig(g.id, "isTC", e.target.checked)}
                          />
                          TC-lid
                        </label>
                        <label
                          className="flex items-center gap-1.5 text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <input
                            type="checkbox"
                            defaultChecked={g.isScout}
                            onChange={(e) =>
                              handleCapabilityWijzig(g.id, "isScout", e.target.checked)
                            }
                          />
                          Scout
                        </label>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-[10px] underline"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          Klaar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditId(g.id)}
                        title="Klik om te wijzigen"
                        className="flex flex-wrap gap-1"
                      >
                        {g.isTC && <Badge color="blue">TC-lid</Badge>}
                        {g.isScout && <Badge color="green">Scout</Badge>}
                        {g.doelgroepen.length > 0 && <Badge color="orange">Coordinator</Badge>}
                        {!g.isTC && !g.isScout && g.doelgroepen.length === 0 && (
                          <Badge color="gray">Gebruiker</Badge>
                        )}
                      </button>
                    )}
                  </td>
                  <td>
                    {editId === g.id ? (
                      <select
                        defaultValue={g.clearance}
                        onChange={(e) => handleCapabilityWijzig(g.id, "clearance", e.target.value)}
                        className="rounded border px-2 py-1 text-xs focus:outline-none"
                        style={{
                          backgroundColor: "var(--surface-raised)",
                          borderColor: "var(--border-strong)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="0">0 — Geen</option>
                        <option value="1">1 — Basis</option>
                        <option value="2">2 — Uitgebreid</option>
                        <option value="3">3 — Volledig</option>
                      </select>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {CLEARANCE_LABELS[g.clearance] ?? g.clearance}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleActief(g.id)}
                      title={g.actief ? "Klik om te deactiveren" : "Klik om te activeren"}
                    >
                      {g.actief ? (
                        <span className="status-badge actief">
                          <span className="status-dot" />
                          Actief
                        </span>
                      ) : (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: "var(--color-error-50)",
                            color: "var(--color-error-500)",
                          }}
                        >
                          Inactief
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!g.isTC && g.actief && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSmartlink(g.id)}
                          disabled={smartlinkPending === g.id}
                          title="Genereer smartlink (14 dagen geldig)"
                        >
                          {smartlinkPending === g.id ? (
                            "Bezig..."
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                              </svg>
                              Smartlink
                            </span>
                          )}
                        </Button>
                      )}
                      {!g.isTC && (
                        <Button variant="danger" size="sm" onClick={() => handleDelete(g.id)}>
                          Verwijder
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nieuw-dialoog */}
      <Dialog
        open={showNieuw}
        onClose={() => {
          setShowNieuw(false);
          setError(null);
        }}
        title="Gebruiker uitnodigen"
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
            <Button size="sm" type="submit" form="form-nieuwe-gebruiker" disabled={pending}>
              {pending ? "Bezig..." : "Uitnodigen"}
            </Button>
          </>
        }
      >
        <form id="form-nieuwe-gebruiker" action={handleCreate} className="space-y-4">
          <Input
            label="E-mailadres"
            name="email"
            type="email"
            required
            placeholder="naam@voorbeeld.nl"
          />
          <Input label="Naam" name="naam" required placeholder="Volledige naam" />
          <div className="flex gap-6">
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              <input type="checkbox" name="isTC" value="true" />
              TC-lid
            </label>
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              <input type="checkbox" name="isScout" value="true" />
              Scout
            </label>
          </div>
          <Select label="Clearance" name="clearance" defaultValue="0">
            <option value="0">0 — Geen</option>
            <option value="1">1 — Basis</option>
            <option value="2">2 — Uitgebreid</option>
            <option value="3">3 — Volledig</option>
          </Select>
        </form>
      </Dialog>
    </div>
  );
}
