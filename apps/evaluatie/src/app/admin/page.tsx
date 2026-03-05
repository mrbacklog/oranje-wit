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
    fetch("/api/rondes")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setRondes(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Laden...</p>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Evaluatierondes</h1>
        <Link
          href="/admin/nieuw"
          className="rounded-md bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700"
        >
          Nieuwe ronde
        </Link>
      </div>

      {rondes.length === 0 ? (
        <p className="mt-4 text-gray-500">Nog geen evaluatierondes aangemaakt.</p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="border-b text-gray-500">
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
          <tbody className="divide-y">
            {rondes.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="py-2">
                  <Link href={`/admin/${r.id}`} className="text-orange-600 hover:underline">
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
    concept: "bg-gray-100 text-gray-700",
    actief: "bg-green-100 text-green-700",
    gesloten: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${kleuren[status] ?? "bg-gray-100"}`}
    >
      {status}
    </span>
  );
}
