"use client";

import Link from "next/link";

type BlockerNotitie = {
  id: string;
  titel: string;
  categorie: string;
  auteur: { naam: string };
  createdAt: Date;
};

interface BlockerChecklistProps {
  blockers: BlockerNotitie[];
}

export default function BlockerChecklist({ blockers }: BlockerChecklistProps) {
  if (blockers.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        Alle blockers zijn opgelost
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="mb-3 text-sm font-medium text-red-800">
        Openstaande blockers ({blockers.length})
      </p>
      <ul className="space-y-2">
        {blockers.map((b) => (
          <li key={b.id} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded border border-red-300 bg-white" />
            <div>
              <span className="font-medium text-red-900">{b.titel}</span>
              <span className="ml-2 text-xs text-red-500">
                door {b.auteur.naam} ·{" "}
                {new Date(b.createdAt).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-red-600">
        <Link href="/notities" className="underline hover:text-red-800">
          Los deze blockers op
        </Link>{" "}
        voordat je verder kunt.
      </p>
    </div>
  );
}
