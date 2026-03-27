"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export default function NieuweRondePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const form = new FormData(e.currentTarget);
    const body = {
      naam: form.get("naam") as string,
      seizoen: form.get("seizoen") as string,
      ronde: Number(form.get("ronde")),
      type: form.get("type") as string,
      deadline: new Date(form.get("deadline") as string).toISOString(),
    };

    const res = await fetch("/api/evaluatie/rondes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.ok) {
      router.push(`/evaluatie/admin/${data.data.id}`);
    } else {
      alert(data.error?.message ?? "Fout bij aanmaken");
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Nieuwe evaluatieronde</h1>
      <form onSubmit={handleSubmit} className="mt-6 max-w-md space-y-4">
        <div>
          <label className="text-text-secondary block text-sm font-medium">Naam</label>
          <input
            name="naam"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            placeholder="Evaluatieronde 1"
          />
        </div>
        <div>
          <label className="text-text-secondary block text-sm font-medium">Seizoen</label>
          <input
            name="seizoen"
            required
            defaultValue={HUIDIG_SEIZOEN}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
            placeholder="2025-2026"
          />
        </div>
        <div>
          <label className="text-text-secondary block text-sm font-medium">Ronde nummer</label>
          <input
            name="ronde"
            type="number"
            required
            defaultValue={1}
            min={1}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label className="text-text-secondary block text-sm font-medium">Type</label>
          <select
            name="type"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          >
            <option value="trainer">Trainer-evaluatie</option>
            <option value="speler">Speler-zelfevaluatie</option>
          </select>
        </div>
        <div>
          <label className="text-text-secondary block text-sm font-medium">Deadline</label>
          <input
            name="deadline"
            type="date"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-md px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Opslaan..." : "Ronde aanmaken"}
        </button>
      </form>
    </div>
  );
}
