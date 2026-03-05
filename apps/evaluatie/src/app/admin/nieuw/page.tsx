"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

    const res = await fetch("/api/rondes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.ok) {
      router.push(`/admin/${data.data.id}`);
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
          <label className="block text-sm font-medium text-gray-700">Naam</label>
          <input
            name="naam"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Evaluatieronde 1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Seizoen</label>
          <input
            name="seizoen"
            required
            defaultValue="2025-2026"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="2025-2026"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ronde nummer</label>
          <input
            name="ronde"
            type="number"
            required
            defaultValue={1}
            min={1}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select name="type" required className="mt-1 w-full rounded-md border px-3 py-2 text-sm">
            <option value="trainer">Trainer-evaluatie</option>
            <option value="speler">Speler-zelfevaluatie</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deadline</label>
          <input
            name="deadline"
            type="date"
            required
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Opslaan..." : "Ronde aanmaken"}
        </button>
      </form>
    </div>
  );
}
