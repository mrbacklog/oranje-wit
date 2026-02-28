interface LogEntryData {
  id: string;
  actie: string;
  detail: string | null;
  createdAt: Date;
  door: {
    naam: string;
  };
}

interface BesluitenLogProps {
  entries: LogEntryData[];
}

export default function BesluitenLog({ entries }: BesluitenLogProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Besluitenlog</h3>
        <p className="text-sm text-gray-400">Nog geen besluiten vastgelegd.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Besluitenlog</h3>
      <div className="relative">
        {/* Tijdlijn-lijn */}
        <div className="absolute top-2 bottom-2 left-3 w-px bg-gray-200" />

        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="relative pl-8">
              {/* Bolletje */}
              <div className="absolute top-1.5 left-1.5 h-3 w-3 rounded-full border-2 border-white bg-orange-400" />

              <div>
                <p className="text-sm font-medium text-gray-900">{entry.actie}</p>
                {entry.detail && <p className="mt-0.5 text-sm text-gray-500">{entry.detail}</p>}
                <p className="mt-1 text-xs text-gray-400">
                  {entry.door.naam} &mdash;{" "}
                  {new Date(entry.createdAt).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
