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
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Besluitenlog
        </h3>
        <p className="text-sm text-gray-400">
          Nog geen besluiten vastgelegd.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Besluitenlog
      </h3>
      <div className="relative">
        {/* Tijdlijn-lijn */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />

        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="relative pl-8">
              {/* Bolletje */}
              <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-orange-400 border-2 border-white" />

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {entry.actie}
                </p>
                {entry.detail && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {entry.detail}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
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
