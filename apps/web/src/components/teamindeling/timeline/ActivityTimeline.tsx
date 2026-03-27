"use client";

import { useState } from "react";
import type { WerkitemData } from "@/components/teamindeling/werkbord/WerkitemKaart";
import { logger } from "@oranje-wit/types";

interface ActivityTimelineProps {
  werkitems: WerkitemData[];
  onToggleActiepunt: (id: string) => void;
}

function formatDatum(datum: Date | string): string {
  return new Date(datum).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DotIcon({ type, afgerond }: { type: string; afgerond?: boolean }) {
  if (type === "ACTIEPUNT") {
    return (
      <div
        className={`absolute top-1.5 -left-[9px] h-4 w-4 rounded-full border-2 border-white ${
          afgerond ? "bg-green-500" : "bg-orange-500"
        }`}
      />
    );
  }
  if (type === "STATUS_WIJZIGING") {
    return (
      <div className="absolute top-1.5 -left-[9px] h-4 w-4 rounded-full border-2 border-white bg-blue-500" />
    );
  }
  return (
    <div className="absolute top-1.5 -left-[9px] h-4 w-4 rounded-full border-2 border-white bg-gray-400" />
  );
}

function WerkitemEntry({ werkitem }: { werkitem: WerkitemData }) {
  const isStatusWijziging = werkitem.titel.startsWith("Status:");

  if (isStatusWijziging) {
    return (
      <div className="relative pl-6">
        <DotIcon type="STATUS_WIJZIGING" />
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
            />
          </svg>
          <span className="text-sm text-gray-700">{werkitem.beschrijving}</span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
          <span>{formatDatum(werkitem.createdAt)}</span>
          <span className="text-gray-500">{werkitem.auteur.naam}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      <DotIcon type="OPMERKING" />
      <div className="rounded-md bg-gray-50 px-3 py-2">
        <p className="text-sm font-medium text-gray-700">{werkitem.titel}</p>
        {werkitem.beschrijving && (
          <p className="mt-0.5 text-sm text-gray-600">{werkitem.beschrijving}</p>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
        <span>{formatDatum(werkitem.createdAt)}</span>
        <span className="text-gray-500">{werkitem.auteur.naam}</span>
      </div>
    </div>
  );
}

function ActiepuntEntry({
  actiepunt,
  werkitem,
  onToggle,
}: {
  actiepunt: WerkitemData["actiepunten"][number];
  werkitem: WerkitemData;
  onToggle: (id: string) => void;
}) {
  const [toggling, setToggling] = useState(false);
  const afgerond = actiepunt.status === "AFGEROND";

  async function handleToggle() {
    setToggling(true);
    try {
      onToggle(actiepunt.id);
    } catch (error) {
      logger.warn("Fout bij toggle actiepunt:", error);
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="relative pl-6">
      <DotIcon type="ACTIEPUNT" afgerond={afgerond} />
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={afgerond}
          disabled={toggling}
          onChange={handleToggle}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
        />
        <div className="flex-1">
          <p className={`text-sm ${afgerond ? "text-gray-400 line-through" : "text-gray-700"}`}>
            {actiepunt.beschrijving}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span>{formatDatum(werkitem.createdAt)}</span>
            <span className="text-gray-500">{werkitem.auteur.naam}</span>
            {actiepunt.toegewezenAan && (
              <span className="badge-orange">{actiepunt.toegewezenAan.naam}</span>
            )}
            {actiepunt.deadline && (
              <span className="text-gray-500">Deadline: {formatDatum(actiepunt.deadline)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivityTimeline({ werkitems, onToggleActiepunt }: ActivityTimelineProps) {
  if (werkitems.length === 0) {
    return <p className="py-4 text-center text-sm text-gray-400">Nog geen activiteiten.</p>;
  }

  // Flatten: werkitems + inline actiepunten, sorted by date
  type Entry =
    | { type: "werkitem"; data: WerkitemData; date: Date }
    | {
        type: "actiepunt";
        data: WerkitemData["actiepunten"][number];
        parent: WerkitemData;
        date: Date;
      };

  const entries: Entry[] = [];
  for (const w of werkitems) {
    entries.push({ type: "werkitem", data: w, date: new Date(w.createdAt) });
    for (const ap of w.actiepunten) {
      entries.push({ type: "actiepunt", data: ap, parent: w, date: new Date(w.createdAt) });
    }
  }
  entries.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="relative border-l-2 border-gray-200">
      <div className="space-y-4 py-2">
        {entries.map((entry) => {
          if (entry.type === "actiepunt") {
            return (
              <ActiepuntEntry
                key={`ap-${entry.data.id}`}
                actiepunt={entry.data}
                werkitem={entry.parent}
                onToggle={onToggleActiepunt}
              />
            );
          }
          // Skip werkitems that only serve as actiepunt containers
          if (entry.data.actiepunten.length > 0 && !entry.data.beschrijving) return null;
          return <WerkitemEntry key={entry.data.id} werkitem={entry.data} />;
        })}
      </div>
    </div>
  );
}
