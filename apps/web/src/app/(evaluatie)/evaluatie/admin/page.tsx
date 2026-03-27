"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ronde {
  id: string;
  seizoen: string;
  ronde: number;
  naam: string;
  type: string;
  deadline: string;
  status: string;
  _count: { uitnodigingen: number; evaluaties: number };
}

export default function AdminRondesPage() {
  const [rondes, setRondes] = useState<Ronde[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/evaluatie/rondes")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setRondes(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-text-muted">Laden...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Evaluatierondes</h1>
        <Link
          href="/evaluatie/admin/nieuw"
          className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-md px-4 py-2 text-sm text-white"
        >
          Nieuwe ronde
        </Link>
      </div>

      {rondes.length === 0 ? (
        <p className="text-text-muted mt-4">Nog geen evaluatierondes aangemaakt.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead
            className="text-text-muted border-b"
            style={{ borderColor: "var(--border-default)" }}
          >
            <tr>
              <th className="pb-2">Naam</th>
              <th className="pb-2">Seizoen</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Deadline</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Uitnodigingen</th>
              <th className="pb-2">Ingediend</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border-light)" }}>
            {rondes.map((r) => (
              <tr key={r.id} className="hover:bg-surface-raised">
                <td className="py-2">
                  <Link
                    href={`/evaluatie/admin/${r.id}`}
                    className="text-ow-oranje hover:underline"
                  >
                    {r.naam}
                  </Link>
                </td>
                <td className="py-2">{r.seizoen}</td>
                <td className="py-2 capitalize">{r.type}</td>
                <td className="py-2">{new Date(r.deadline).toLocaleDateString("nl-NL")}</td>
                <td className="py-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="py-2">{r._count.uitnodigingen}</td>
                <td className="py-2">{r._count.evaluaties}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const kleuren: Record<string, string> = {
    concept: "bg-surface-sunken text-text-secondary",
    actief: "bg-green-900/30 text-green-400",
    gesloten: "bg-red-900/30 text-red-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${kleuren[status] ?? "bg-surface-sunken"}`}
    >
      {status}
    </span>
  );
}
