"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { updateWerkitemStatus } from "@/app/(teamindeling-studio)/ti-studio/werkbord/actions";
import WerkitemKaart, { type WerkitemData } from "./WerkitemKaart";
import WerkbordFilters, { type WerkbordFilterState } from "./WerkbordFilters";
import WerkitemDialoog from "./WerkitemDialoog";
import type { WerkitemStatus } from "./types";
import { logger } from "@oranje-wit/types";

interface WerkbordOverzichtProps {
  blauwdrukId: string;
  initialWerkitems: WerkitemData[];
  initialStats: { open: number; blockers: number; besluiten: number; afgerond: number };
  refreshAction: () => Promise<{
    werkitems: WerkitemData[];
    stats: { open: number; blockers: number; besluiten: number; afgerond: number };
  }>;
}

// Column config
const COLUMNS: { status: WerkitemStatus; label: string; kleur: string }[] = [
  { status: "OPEN", label: "Open", kleur: "bg-blue-500" },
  { status: "IN_BESPREKING", label: "In bespreking", kleur: "bg-yellow-500" },
  { status: "OPGELOST", label: "Opgelost", kleur: "bg-green-500" },
  { status: "GEACCEPTEERD_RISICO", label: "Geaccepteerd risico", kleur: "bg-orange-500" },
];
const ARCHIEF_KOLOM = {
  status: "GEARCHIVEERD" as WerkitemStatus,
  label: "Gearchiveerd",
  kleur: "bg-gray-400",
};
const EMPTY_FILTERS: WerkbordFilterState = {
  besluitniveau: "",
  doelgroep: "",
  prioriteit: "",
  entiteit: "",
  type: "",
};

export default function WerkbordOverzicht({
  blauwdrukId,
  initialWerkitems,
  initialStats,
  refreshAction,
}: WerkbordOverzichtProps) {
  const [werkitems, setWerkitems] = useState<WerkitemData[]>(initialWerkitems);
  const [stats, setStats] = useState(initialStats);
  const [filters, setFilters] = useState<WerkbordFilterState>(EMPTY_FILTERS);
  const [toonArchief, setToonArchief] = useState(false);
  const [dialoogOpen, setDialoogOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<WerkitemData | null>(null);
  const [resolutieTarget, setResolutieTarget] = useState<string | null>(null);
  const [resolutieTekst, setResolutieTekst] = useState("");
  const [isPending, startTransition] = useTransition();
  const resolutieRef = useRef<HTMLTextAreaElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Client-side filtering
  const gefilterd = werkitems.filter((w) => {
    if (filters.besluitniveau && w.besluitniveau !== filters.besluitniveau) return false;
    if (filters.doelgroep && w.doelgroep !== filters.doelgroep) return false;
    if (filters.prioriteit && w.prioriteit !== filters.prioriteit) return false;
    if (filters.entiteit && w.entiteit !== filters.entiteit) return false;
    if (filters.type && w.type !== filters.type) return false;
    return true;
  });

  const kolommen = toonArchief ? [...COLUMNS, ARCHIEF_KOLOM] : COLUMNS;

  const refresh = useCallback(async () => {
    try {
      const data = await refreshAction();
      setWerkitems(data.werkitems);
      setStats(data.stats);
    } catch (err) {
      logger.warn("Werkbord refresh mislukt:", err);
    }
  }, [refreshAction]);

  const verplaatsItem = useCallback(
    (werkitemId: string, nieuweStatus: WerkitemStatus, resolutie?: string) => {
      setWerkitems((prev) =>
        prev.map((w) =>
          w.id === werkitemId
            ? {
                ...w,
                status: nieuweStatus,
                resolutie: resolutie ?? w.resolutie,
                opgelostOp:
                  nieuweStatus === "OPGELOST" || nieuweStatus === "GEACCEPTEERD_RISICO"
                    ? new Date()
                    : w.opgelostOp,
              }
            : w
        )
      );
      startTransition(async () => {
        try {
          await updateWerkitemStatus(werkitemId, nieuweStatus, resolutie);
          await refresh();
        } catch (err) {
          logger.warn("Status update mislukt:", err);
          await refresh();
        }
      });
    },
    [refresh]
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as { werkitem: WerkitemData } | undefined;
    if (data?.werkitem) setActiveItem(data.werkitem);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;
    const werkitem = (active.data.current as { werkitem: WerkitemData })?.werkitem;
    const doelStatus = (over.data.current as { status: WerkitemStatus })?.status;
    if (!werkitem || !doelStatus || werkitem.status === doelStatus) return;
    if (doelStatus === "OPGELOST") {
      setResolutieTarget(werkitem.id);
      setResolutieTekst("");
      setTimeout(() => resolutieRef.current?.focus(), 50);
      return;
    }
    verplaatsItem(werkitem.id, doelStatus);
  }

  function bevestigResolutie() {
    if (!resolutieTarget || !resolutieTekst.trim()) return;
    verplaatsItem(resolutieTarget, "OPGELOST", resolutieTekst.trim());
    setResolutieTarget(null);
    setResolutieTekst("");
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-card">
          <span className="stat-value">{stats.open}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-card">
          <span className="stat-value text-red-600">{stats.blockers}</span>
          <span className="stat-label">Blockers</span>
        </div>
        <div className="stat-card">
          <span className="stat-value text-blue-600">{stats.besluiten}</span>
          <span className="stat-label">Besluiten</span>
        </div>
        <div className="stat-card">
          <span className="stat-value text-green-600">{stats.afgerond}</span>
          <span className="stat-label">Afgerond</span>
        </div>
      </div>

      {/* Filter bar + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <WerkbordFilters filters={filters} onChange={setFilters} />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-gray-500">
            <input
              type="checkbox"
              checked={toonArchief}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setToonArchief(e.target.checked)
              }
              className="rounded border-gray-300"
            />
            Toon archief
          </label>
          <button className="btn-primary btn-sm" onClick={() => setDialoogOpen(true)}>
            + Nieuw werkitem
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="grid gap-3 max-md:grid-cols-1"
          style={{ gridTemplateColumns: `repeat(${kolommen.length}, minmax(0, 1fr))` }}
        >
          {kolommen.map((col) => (
            <KanbanKolom
              key={col.status}
              status={col.status}
              label={col.label}
              kleur={col.kleur}
              items={gefilterd.filter((w) => w.status === col.status)}
              resolutieTarget={col.status === "OPGELOST" ? resolutieTarget : null}
              resolutieTekst={resolutieTekst}
              resolutieRef={resolutieRef}
              onResolutieTekst={setResolutieTekst}
              onBevestig={bevestigResolutie}
              onAnnuleer={() => {
                setResolutieTarget(null);
                setResolutieTekst("");
              }}
              isPending={isPending}
            />
          ))}
        </div>
        <DragOverlay>
          {activeItem ? (
            <div className="w-64 rotate-2 opacity-90">
              <WerkitemKaart werkitem={activeItem} compact />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {dialoogOpen && (
        <WerkitemDialoog
          blauwdrukId={blauwdrukId}
          onClose={() => setDialoogOpen(false)}
          onCreated={refresh}
        />
      )}
    </div>
  );
}

// ---- Kolom ----

function KanbanKolom({
  status,
  label,
  kleur,
  items,
  resolutieTarget,
  resolutieTekst,
  resolutieRef,
  onResolutieTekst,
  onBevestig,
  onAnnuleer,
  isPending,
}: {
  status: WerkitemStatus;
  label: string;
  kleur: string;
  items: WerkitemData[];
  resolutieTarget: string | null;
  resolutieTekst: string;
  resolutieRef: React.RefObject<HTMLTextAreaElement | null>;
  onResolutieTekst: (t: string) => void;
  onBevestig: () => void;
  onAnnuleer: () => void;
  isPending: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `kolom-${status}`, data: { status } });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[300px] flex-col rounded-lg border bg-gray-50 transition-colors ${isOver ? "border-orange-300 bg-orange-50" : "border-gray-200"}`}
    >
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${kleur}`} />
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        <span className="badge-gray ml-auto">{items.length}</span>
      </div>

      {resolutieTarget && (
        <div className="animate-fade-in m-2 rounded-md border border-green-200 bg-green-50 p-3">
          <p className="mb-2 text-xs font-medium text-green-800">Hoe is dit opgelost?</p>
          <textarea
            ref={resolutieRef}
            value={resolutieTekst}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onResolutieTekst(e.target.value)
            }
            placeholder="Beschrijf de resolutie..."
            className="input mb-2 text-xs"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onBevestig();
              }
            }}
          />
          <div className="flex gap-2">
            <button
              className="btn-primary btn-sm"
              disabled={!resolutieTekst.trim() || isPending}
              onClick={onBevestig}
            >
              Bevestig
            </button>
            <button className="btn-ghost btn-sm" disabled={isPending} onClick={onAnnuleer}>
              Annuleer
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {items.map((item) => (
          <DraggableKaart key={item.id} werkitem={item} />
        ))}
        {items.length === 0 && !resolutieTarget && (
          <p className="py-8 text-center text-xs text-gray-400">Geen items</p>
        )}
      </div>
    </div>
  );
}

// ---- Draggable kaart ----

function DraggableKaart({ werkitem }: { werkitem: WerkitemData }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `werkitem-${werkitem.id}`,
    data: { werkitem },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab transition-opacity ${isDragging ? "opacity-30" : ""}`}
    >
      <WerkitemKaart werkitem={werkitem} compact />
    </div>
  );
}
