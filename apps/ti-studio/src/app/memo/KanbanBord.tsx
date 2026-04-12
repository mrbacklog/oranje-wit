"use client";

import { useState, useCallback } from "react";
import { updateWerkitemStatus, updateWerkitemVolgorde } from "@/app/indeling/werkitem-actions";
import { filterWerkitems, type FilterType } from "./kanban-filter";
import { MemoDrawer, type DrawerWerkitem } from "@/components/ti-studio/MemoDrawer";
import { useSession } from "next-auth/react";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

export type KanbanWerkitem = {
  id: string;
  status: string;
  prioriteit: string;
  beschrijving: string;
  volgorde: number;
  createdAt: string;
  teamId: string | null;
  spelerId: string | null;
  stafId: string | null;
  doelgroep: string | null;
  team: { naam: string; categorie: string } | null;
  speler: { roepnaam: string; achternaam: string } | null;
  staf: { naam: string } | null;
  resolutie: string | null;
  toelichtingen: Array<{
    id: string;
    auteurNaam: string;
    auteurEmail: string;
    tekst: string;
    timestamp: string;
  }>;
  activiteiten: Array<{
    id: string;
    auteurNaam: string;
    auteurEmail: string;
    actie: string;
    detail: string | null;
    timestamp: string;
  }>;
};

type Lane = {
  status: string;
  label: string;
  kleur: string;
  border: string;
  bg: string;
};

// ──────────────────────────────────────────────────────────
// Constanten
// ──────────────────────────────────────────────────────────

const LANES: Lane[] = [
  {
    status: "OPEN",
    label: "Open",
    kleur: "#f97316",
    border: "rgba(249,115,22,.35)",
    bg: "rgba(249,115,22,.06)",
  },
  {
    status: "IN_BESPREKING",
    label: "In bespreking",
    kleur: "#60a5fa",
    border: "rgba(96,165,250,.35)",
    bg: "rgba(96,165,250,.06)",
  },
  {
    status: "OPGELOST",
    label: "Opgelost",
    kleur: "#22c55e",
    border: "rgba(34,197,94,.35)",
    bg: "rgba(34,197,94,.06)",
  },
  {
    status: "GEACCEPTEERD_RISICO",
    label: "Risico geaccepteerd",
    kleur: "#eab308",
    border: "rgba(234,179,8,.35)",
    bg: "rgba(234,179,8,.06)",
  },
  {
    status: "GEARCHIVEERD",
    label: "Gearchiveerd",
    kleur: "#6b7280",
    border: "rgba(107,114,128,.25)",
    bg: "rgba(107,114,128,.05)",
  },
];

const PRIORITEIT_BADGE: Record<string, { label: string; kleur: string }> = {
  BLOCKER: { label: "BLOCKER", kleur: "#ef4444" },
  HOOG: { label: "HOOG", kleur: "#f97316" },
  MIDDEL: { label: "MIDDEL", kleur: "#9ca3af" },
  LAAG: { label: "LAAG", kleur: "#60a5fa" },
  INFO: { label: "INFO", kleur: "#a78bfa" },
};

const PRIORITEIT_ICON: Record<string, string> = {
  BLOCKER: "🔴",
  HOOG: "🟠",
  MIDDEL: "⚪",
  LAAG: "🔵",
  INFO: "💡",
};

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function entiteitInfo(item: KanbanWerkitem): {
  label: string;
  naam: string;
  kleur: string;
  bg: string;
} {
  if (item.teamId && item.team) {
    return {
      label: "Team",
      naam: item.team.naam,
      kleur: "#60a5fa",
      bg: "rgba(96,165,250,.15)",
    };
  }
  if (item.spelerId && item.speler) {
    return {
      label: "Speler",
      naam: `${item.speler.roepnaam} ${item.speler.achternaam}`,
      kleur: "#ec4899",
      bg: "rgba(236,72,153,.15)",
    };
  }
  if (item.stafId && item.staf) {
    return {
      label: "Staf",
      naam: item.staf.naam,
      kleur: "#eab308",
      bg: "rgba(234,179,8,.15)",
    };
  }
  return { label: "Algemeen", naam: "—", kleur: "#9ca3af", bg: "rgba(156,163,175,.12)" };
}

function korteDatum(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

// ──────────────────────────────────────────────────────────
// KanbanKaart
// ──────────────────────────────────────────────────────────

function KanbanKaart({
  item,
  onDragStart,
  onKaartKlik,
}: {
  item: KanbanWerkitem;
  onDragStart: (e: React.DragEvent, id: string, vanStatus: string) => void;
  onKaartKlik: (id: string) => void;
}) {
  const entiteit = entiteitInfo(item);
  const prio = PRIORITEIT_BADGE[item.prioriteit] ?? { label: item.prioriteit, kleur: "#9ca3af" };
  const icon = PRIORITEIT_ICON[item.prioriteit] ?? "";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id, item.status)}
      onClick={() => onKaartKlik(item.id)}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Entiteit badge + datum */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 5,
            background: entiteit.bg,
            color: entiteit.kleur,
          }}
        >
          {entiteit.label}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-2, #9ca3af)" }}>
          {korteDatum(item.createdAt)}
        </span>
      </div>

      {/* Entiteitnaam */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-1, #f3f4f6)",
          lineHeight: 1.3,
        }}
      >
        {entiteit.naam}
      </div>

      {/* Beschrijving — max 2 regels */}
      <p
        style={{
          fontSize: 11,
          color: "var(--text-2, #9ca3af)",
          margin: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          lineHeight: 1.45,
        }}
      >
        {item.beschrijving}
      </p>

      {/* Prioriteit */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 10 }}>{icon}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: prio.kleur,
            letterSpacing: "0.4px",
          }}
        >
          {prio.label}
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// KanbanKolom
// ──────────────────────────────────────────────────────────

function KanbanKolom({
  lane,
  items,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  onKaartKlik,
}: {
  lane: Lane;
  items: KanbanWerkitem[];
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, id: string, vanStatus: string) => void;
  onDragOver: (e: React.DragEvent, status: string) => void;
  onDrop: (e: React.DragEvent, naarStatus: string) => void;
  onDragLeave: () => void;
  onKaartKlik: (id: string) => void;
}) {
  return (
    <div
      onDragOver={(e) => onDragOver(e, lane.status)}
      onDrop={(e) => onDrop(e, lane.status)}
      onDragLeave={onDragLeave}
      style={{
        flex: "0 0 220px",
        minHeight: 400,
        borderRadius: 10,
        background: isDragOver ? lane.bg : "rgba(255,255,255,.03)",
        border: `1px solid ${isDragOver ? lane.border : "var(--border-default)"}`,
        transition: "background 0.15s, border-color 0.15s",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Kolomheader */}
      <div
        style={{
          padding: "10px 14px 8px",
          borderBottom: `1px solid var(--border-default)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: lane.bg,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: lane.kleur,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          {lane.label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: lane.kleur,
            background: "rgba(255,255,255,.08)",
            borderRadius: 10,
            padding: "1px 7px",
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {items.length}
        </span>
      </div>

      {/* Kaartjes */}
      <div
        style={{
          flex: 1,
          padding: "10px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
        }}
      >
        {items.map((item) => (
          <KanbanKaart
            key={item.id}
            item={item}
            onDragStart={onDragStart}
            onKaartKlik={onKaartKlik}
          />
        ))}
        {items.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "24px 8px",
              color: "var(--text-2, #6b7280)",
              fontSize: 12,
              opacity: 0.5,
            }}
          >
            Leeg
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// KanbanBord — hoofd client component
// ──────────────────────────────────────────────────────────

export default function KanbanBord({ initialItems }: { initialItems: KanbanWerkitem[] }) {
  const [items, setItems] = useState<KanbanWerkitem[]>(initialItems);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [actieveFilter, setActieveFilter] = useState<FilterType>("alles");
  const [geselecteerdId, setGeselecteerdId] = useState<string | null>(null);
  const { data: session } = useSession();
  const gebruikerNaam = (session?.user?.name ?? session?.user?.email ?? "Onbekend") as string;

  function leidEntiteitAf(item: KanbanWerkitem): DrawerWerkitem["entiteitType"] {
    if (item.teamId) return "team";
    if (item.spelerId) return "speler";
    if (item.doelgroep && item.doelgroep !== "ALLE") return "doelgroep";
    return "tc";
  }

  function leidEntiteitNaamAf(item: KanbanWerkitem): string {
    if (item.team) return item.team.naam;
    if (item.speler) return `${item.speler.roepnaam} ${item.speler.achternaam}`;
    if (item.doelgroep && item.doelgroep !== "ALLE") {
      const LABELS: Record<string, string> = {
        KWEEKVIJVER: "Kweekvijver",
        ONTWIKKELHART: "Opleidingshart",
        TOP: "Topsport",
        WEDSTRIJDSPORT: "Wedstrijdsport",
        KORFBALPLEZIER: "Korfbalplezier",
      };
      return LABELS[item.doelgroep] ?? item.doelgroep;
    }
    return "TC — Algemeen";
  }

  const geselecteerdItem = items.find((i) => i.id === geselecteerdId) ?? null;
  const drawerWerkitem: DrawerWerkitem | null = geselecteerdItem
    ? {
        id: geselecteerdItem.id,
        beschrijving: geselecteerdItem.beschrijving,
        status: geselecteerdItem.status,
        prioriteit: geselecteerdItem.prioriteit,
        resolutie: geselecteerdItem.resolutie,
        entiteitType: leidEntiteitAf(geselecteerdItem),
        entiteitNaam: leidEntiteitNaamAf(geselecteerdItem),
        toelichtingen: geselecteerdItem.toelichtingen.map((t) => ({
          ...t,
          type: "toelichting" as const,
        })),
        activiteiten: geselecteerdItem.activiteiten.map((a) => ({ ...a, type: "log" as const })),
      }
    : null;

  const handleDragStart = useCallback((e: React.DragEvent, id: string, vanStatus: string) => {
    e.dataTransfer.setData("werkitemId", id);
    e.dataTransfer.setData("vanStatus", vanStatus);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStatus(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, naarStatus: string) => {
    e.preventDefault();
    setDragOverStatus(null);

    const id = e.dataTransfer.getData("werkitemId");
    const vanStatus = e.dataTransfer.getData("vanStatus");

    if (!id) return;

    if (vanStatus !== naarStatus) {
      // Status wijzigen — optimistisch updaten
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: naarStatus } : item))
      );

      const result = await updateWerkitemStatus(id, naarStatus);
      if (!result.ok) {
        // Rollback bij fout
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: vanStatus } : item))
        );
      }
    } else {
      // Zelfde kolom — volgorde aanpassen (naar achteraan in de lane)
      setItems((prev) => {
        const laneItems = prev.filter((i) => i.status === naarStatus);
        const overige = prev.filter((i) => i.status !== naarStatus);
        const gesleept = laneItems.find((i) => i.id === id);
        if (!gesleept) return prev;
        const rest = laneItems.filter((i) => i.id !== id);
        const nieuw = [...rest, gesleept].map((item, idx) => ({ ...item, volgorde: idx }));
        const samengevoegd = [...overige, ...nieuw];

        // Vuur async af zonder te awaiten (optimistisch)
        updateWerkitemVolgorde(nieuw.map((i) => ({ id: i.id, volgorde: i.volgorde }))).catch(() => {
          // stille fout — reorder is niet kritisch
        });

        return samengevoegd;
      });
    }
  }, []);

  // Groepeer per status met filter
  const gefilterdeItems = filterWerkitems(items, actieveFilter);
  const itemsPerStatus = (status: string) =>
    gefilterdeItems.filter((i) => i.status === status).sort((a, b) => a.volgorde - b.volgorde);
  const totaal = gefilterdeItems.length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header + filter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>
            Memo&apos;s
          </h2>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>{totaal} werkitems</span>
        </div>
        {/* Filter chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["alles", "team", "speler", "doelgroep", "tc-algemeen"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setActieveFilter(f)}
              style={{
                background: actieveFilter === f ? "rgba(249,115,22,.12)" : "rgba(255,255,255,.04)",
                border: `1px solid ${actieveFilter === f ? "rgba(249,115,22,.4)" : "var(--border-0)"}`,
                borderRadius: 20,
                color: actieveFilter === f ? "var(--accent)" : "var(--text-3)",
                fontSize: 11,
                fontWeight: actieveFilter === f ? 600 : 400,
                padding: "3px 10px",
                cursor: "pointer",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {f === "alles"
                ? "Alles"
                : f === "team"
                  ? "Team"
                  : f === "speler"
                    ? "Speler"
                    : f === "doelgroep"
                      ? "Doelgroep"
                      : "TC-algemeen"}
            </button>
          ))}
        </div>
      </div>

      {/* Bord — horizontaal scrollbaar */}
      <div
        style={{
          overflowX: "auto",
          overflowY: "visible",
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            minWidth: "max-content",
          }}
        >
          {LANES.map((lane) => (
            <KanbanKolom
              key={lane.status}
              lane={lane}
              items={itemsPerStatus(lane.status)}
              isDragOver={dragOverStatus === lane.status}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragLeave={handleDragLeave}
              onKaartKlik={(id) => setGeselecteerdId(id)}
            />
          ))}
        </div>
      </div>

      {totaal === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--text-2, #9ca3af)",
            fontSize: 13,
          }}
        >
          Geen memo-werkitems gevonden
        </div>
      )}

      <MemoDrawer
        werkitem={drawerWerkitem}
        onSluiten={() => setGeselecteerdId(null)}
        onVerwijderd={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        onBijgewerkt={(id, w) =>
          setItems((prev) =>
            prev.map((i) => (i.id === id ? ({ ...i, ...w } as KanbanWerkitem) : i))
          )
        }
        huidigeGebruikerNaam={gebruikerNaam}
      />
    </div>
  );
}
