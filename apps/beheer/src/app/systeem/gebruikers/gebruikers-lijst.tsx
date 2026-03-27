"use client";

import { useState } from "react";
import { Button, Badge, Dialog, Input, Select } from "@oranje-wit/ui";
import type { GebruikerRow } from "./actions";
import { createGebruiker, updateGebruiker, toggleActief, deleteGebruiker } from "./actions";

// ── Helpers ───────────────────────────────────────────────────

const ROL_KLEUREN: Record<string, "blue" | "orange" | "gray"> = {
  EDITOR: "blue",
  REVIEWER: "orange",
  VIEWER: "gray",
};

const ROL_LABELS: Record<string, string> = {
  EDITOR: "TC-lid",
  REVIEWER: "Reviewer",
  VIEWER: "Viewer",
};

const SCOUT_ROL_LABELS: Record<string, string> = {
  SCOUT: "Scout",
  TC: "TC-scout",
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

  async function handleRolWijzig(id: string, rol: string) {
    const fd = new FormData();
    fd.set("rol", rol);
    const result = await updateGebruiker(id, fd);
    if (!result.ok) {
      setError(result.error);
    }
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
                <th>Rol</th>
                <th>Scout-rol</th>
                <th>Admin</th>
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
                      <select
                        defaultValue={g.rol}
                        onChange={(e) => {
                          handleRolWijzig(g.id, e.target.value);
                          setEditId(null);
                        }}
                        onBlur={() => setEditId(null)}
                        autoFocus
                        className="rounded border px-2 py-1 text-xs focus:outline-none"
                        style={{
                          backgroundColor: "var(--surface-raised)",
                          borderColor: "var(--border-strong)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="EDITOR">TC-lid</option>
                        <option value="REVIEWER">Reviewer</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    ) : (
                      <button onClick={() => setEditId(g.id)} title="Klik om te wijzigen">
                        <Badge color={ROL_KLEUREN[g.rol] ?? "gray"}>
                          {ROL_LABELS[g.rol] ?? g.rol}
                        </Badge>
                      </button>
                    )}
                  </td>
                  <td>
                    {g.scoutRol ? (
                      <Badge color="green">{SCOUT_ROL_LABELS[g.scoutRol] ?? g.scoutRol}</Badge>
                    ) : (
                      <span className="dimmed">-</span>
                    )}
                  </td>
                  <td>
                    {g.isAdmin ? (
                      <Badge color="orange">Admin</Badge>
                    ) : (
                      <span className="dimmed">-</span>
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
                    {!g.isAdmin && (
                      <Button variant="danger" size="sm" onClick={() => handleDelete(g.id)}>
                        Verwijder
                      </Button>
                    )}
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
          <Select label="Rol" name="rol" defaultValue="VIEWER">
            <option value="EDITOR">TC-lid (Editor)</option>
            <option value="REVIEWER">Reviewer</option>
            <option value="VIEWER">Viewer</option>
          </Select>
          <Select label="Scout-rol" name="scoutRol" defaultValue="">
            <option value="">Geen</option>
            <option value="SCOUT">Scout</option>
            <option value="TC">TC-scout</option>
          </Select>
        </form>
      </Dialog>
    </div>
  );
}
