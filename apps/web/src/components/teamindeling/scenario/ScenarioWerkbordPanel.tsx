"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  getWerkitems,
  createWerkitem,
  updateWerkitemStatus,
  updateActiepuntStatus,
} from "@/app/(teamindeling-studio)/ti-studio/werkbord/actions";
import type { WerkitemData } from "@/components/teamindeling/werkbord/WerkitemKaart";
import type { WerkitemType, WerkitemPrioriteit, WerkitemStatus } from "@oranje-wit/database";

interface ScenarioWerkbordPanelProps {
  blauwdrukId: string;
  scenarioId: string;
}

const STATUS_KLEUR: Record<string, string> = {
  OPEN: "bg-blue-400",
  IN_BESPREKING: "bg-yellow-400",
  OPGELOST: "bg-green-400",
  GEACCEPTEERD_RISICO: "bg-orange-400",
  GEARCHIVEERD: "bg-gray-300",
};

const PRIORITEIT_RAND: Record<string, string> = {
  BLOCKER: "border-l-red-400",
  HOOG: "border-l-orange-400",
};

const TYPE_LABEL: Record<string, string> = {
  STRATEGISCH: "Strat.",
  DATA: "Data",
  REGEL: "Regel",
  TRAINER: "Trainer",
  SPELER: "Speler",
  BESLUIT: "Besluit",
};

export default function ScenarioWerkbordPanel({
  blauwdrukId,
  scenarioId,
}: ScenarioWerkbordPanelProps) {
  const [werkitems, setWerkitems] = useState<WerkitemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Quick-add form
  const [titel, setTitel] = useState("");
  const [type, setType] = useState<WerkitemType>("STRATEGISCH");
  const [prioriteit, setPrioriteit] = useState<WerkitemPrioriteit>("MIDDEL");
  const [scope, setScope] = useState<"scenario" | "blauwdruk">("scenario");

  const refresh = useCallback(async () => {
    // Haal zowel blauwdruk-brede als scenario-specifieke werkitems op
    const [blauwdrukItems, scenarioItems] = await Promise.all([
      getWerkitems(blauwdrukId, { scenarioId: null }),
      getWerkitems(blauwdrukId, { scenarioId }),
    ]);
    setWerkitems([...scenarioItems, ...blauwdrukItems]);
    setLoading(false);
  }, [blauwdrukId, scenarioId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = useCallback(() => {
    if (!titel.trim()) return;
    const t = titel.trim();
    setTitel("");
    startTransition(async () => {
      await createWerkitem({
        blauwdrukId,
        titel: t,
        beschrijving: "",
        type,
        prioriteit,
        scenarioId: scope === "scenario" ? scenarioId : undefined,
      });
      await refresh();
    });
  }, [titel, type, prioriteit, scope, blauwdrukId, scenarioId, refresh]);

  const handleStatusWijzig = useCallback(
    (id: string, status: WerkitemStatus) => {
      startTransition(async () => {
        await updateWerkitemStatus(id, status);
        await refresh();
      });
    },
    [refresh]
  );

  const handleActiepuntToggle = useCallback(
    (actiepuntId: string, huidig: string) => {
      startTransition(async () => {
        await updateActiepuntStatus(actiepuntId, huidig === "AFGEROND" ? "OPEN" : "AFGEROND");
        await refresh();
      });
    },
    [refresh]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-300 border-t-transparent" />
        <span className="text-xs text-gray-400">Laden...</span>
      </div>
    );
  }

  const scenarioItems = werkitems.filter((w) => w.scenario?.id === scenarioId);
  const blauwdrukItems = werkitems.filter((w) => !w.scenario);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Quick-add */}
      <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <input
          value={titel}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nieuw werkitem..."
          className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-orange-300 focus:outline-none"
        />
        <div className="flex items-center gap-1.5">
          <select
            value={type}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setType(e.target.value as WerkitemType)
            }
            className="rounded border border-gray-200 px-1.5 py-1 text-xs"
          >
            <option value="STRATEGISCH">Strategisch</option>
            <option value="DATA">Data</option>
            <option value="REGEL">Regel</option>
            <option value="TRAINER">Trainer</option>
            <option value="SPELER">Speler</option>
            <option value="BESLUIT">Besluit</option>
          </select>
          <select
            value={prioriteit}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setPrioriteit(e.target.value as WerkitemPrioriteit)
            }
            className="rounded border border-gray-200 px-1.5 py-1 text-xs"
          >
            <option value="BLOCKER">Blocker</option>
            <option value="HOOG">Hoog</option>
            <option value="MIDDEL">Middel</option>
            <option value="LAAG">Laag</option>
            <option value="INFO">Info</option>
          </select>
          <select
            value={scope}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setScope(e.target.value as "scenario" | "blauwdruk")
            }
            className="rounded border border-gray-200 px-1.5 py-1 text-xs"
          >
            <option value="scenario">Dit scenario</option>
            <option value="blauwdruk">Blauwdruk</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!titel.trim() || isPending}
            className="ml-auto rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      {/* Scenario-specifieke items */}
      {scenarioItems.length > 0 && (
        <Section
          label="Dit scenario"
          items={scenarioItems}
          onStatusWijzig={handleStatusWijzig}
          onActiepuntToggle={handleActiepuntToggle}
        />
      )}

      {/* Blauwdruk-brede items */}
      {blauwdrukItems.length > 0 && (
        <Section
          label="Blauwdruk"
          items={blauwdrukItems}
          onStatusWijzig={handleStatusWijzig}
          onActiepuntToggle={handleActiepuntToggle}
        />
      )}

      {werkitems.length === 0 && (
        <p className="py-4 text-center text-xs text-gray-400">Geen werkitems</p>
      )}
    </div>
  );
}

// --- Sub-componenten ---

function Section({
  label,
  items,
  onStatusWijzig,
  onActiepuntToggle,
}: {
  label: string;
  items: WerkitemData[];
  onStatusWijzig: (id: string, status: WerkitemStatus) => void;
  onActiepuntToggle: (id: string, huidig: string) => void;
}) {
  return (
    <div>
      <h4 className="mb-1.5 text-[10px] font-semibold tracking-wide text-gray-400 uppercase">
        {label}
        <span className="ml-1 text-gray-300">({items.length})</span>
      </h4>
      <div className="space-y-1.5">
        {items.map((w) => (
          <CompactKaart
            key={w.id}
            werkitem={w}
            onStatusWijzig={onStatusWijzig}
            onActiepuntToggle={onActiepuntToggle}
          />
        ))}
      </div>
    </div>
  );
}

function CompactKaart({
  werkitem,
  onStatusWijzig,
  onActiepuntToggle,
}: {
  werkitem: WerkitemData;
  onStatusWijzig: (id: string, status: WerkitemStatus) => void;
  onActiepuntToggle: (id: string, huidig: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rand = PRIORITEIT_RAND[werkitem.prioriteit] ?? "";
  const afgerond = werkitem.actiepunten.filter((a) => a.status === "AFGEROND").length;
  const totaal = werkitem.actiepunten.length;

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white text-xs ${rand ? `border-l-2 ${rand}` : ""}`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-2 px-2 py-1.5 text-left"
      >
        <span
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_KLEUR[werkitem.status] ?? "bg-gray-300"}`}
          title={werkitem.status}
        />
        <span className="flex-1 leading-snug font-medium text-gray-800">{werkitem.titel}</span>
        <span className="shrink-0 text-[10px] text-gray-400">
          {TYPE_LABEL[werkitem.type] ?? werkitem.type}
        </span>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="space-y-2 border-t border-gray-100 px-2 py-2">
          {werkitem.beschrijving && (
            <p className="leading-snug text-gray-600">{werkitem.beschrijving}</p>
          )}

          {/* Status-knoppen */}
          <div className="flex flex-wrap gap-1">
            {(["OPEN", "IN_BESPREKING", "OPGELOST"] as WerkitemStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => onStatusWijzig(werkitem.id, s)}
                disabled={werkitem.status === s}
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  werkitem.status === s
                    ? "bg-gray-200 font-semibold text-gray-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {s === "OPEN" ? "Open" : s === "IN_BESPREKING" ? "Bespreking" : "Opgelost"}
              </button>
            ))}
          </div>

          {/* Actiepunten */}
          {totaal > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400">
                Acties {afgerond}/{totaal}
              </span>
              {werkitem.actiepunten.map((a) => (
                <label key={a.id} className="flex items-start gap-1.5">
                  <input
                    type="checkbox"
                    checked={a.status === "AFGEROND"}
                    onChange={() => onActiepuntToggle(a.id, a.status)}
                    className="mt-0.5 rounded border-gray-300"
                  />
                  <span
                    className={`leading-snug ${a.status === "AFGEROND" ? "text-gray-400 line-through" : "text-gray-700"}`}
                  >
                    {a.beschrijving}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Koppeling */}
          {werkitem.speler && (
            <span className="text-[10px] text-gray-400">
              Speler: {werkitem.speler.roepnaam} {werkitem.speler.achternaam}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
