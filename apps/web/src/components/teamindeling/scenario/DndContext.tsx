"use client";

import {
  DndContext as DndKitContext,
  DragOverlay,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState, type ReactNode } from "react";
import type { SpelerData } from "./types";
import { STATUS_KLEUREN, kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";

interface DndProviderProps {
  children: ReactNode;
  spelers: SpelerData[];
  onPoolToTeam: (spelerId: string, teamId: string) => void;
  onTeamToTeam: (spelerId: string, vanTeamId: string, naarTeamId: string) => void;
  onTeamToPool: (spelerId: string, teamId: string) => void;
}

interface DragData {
  type: "pool-speler" | "team-speler";
  spelerId: string;
  teamId?: string;
}

export default function DndProvider({
  children,
  spelers,
  onPoolToTeam,
  onTeamToTeam,
  onTeamToPool,
}: DndProviderProps) {
  const [activeSpeler, setActiveSpeler] = useState<SpelerData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined;
    if (!data) return;
    const speler = spelers.find((s) => s.id === data.spelerId);
    setActiveSpeler(speler ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveSpeler(null);

    const { active, over } = event;

    const activeData = active.data.current as DragData | undefined;
    if (!activeData) return;

    // Drop op leeg gebied (buiten teamkaart/pool) → terug naar pool
    if (!over && activeData.type === "team-speler" && activeData.teamId) {
      onTeamToPool(activeData.spelerId, activeData.teamId);
      return;
    }

    if (!over || active.id === over.id) return;

    const overData = over.data.current as
      | { type: "team"; teamId: string }
      | { type: "pool" }
      | undefined;

    if (!overData) return;

    // Pool -> Team
    if (activeData.type === "pool-speler" && overData.type === "team") {
      onPoolToTeam((activeData as DragData).spelerId, overData.teamId);
    }

    // Team -> Team
    if (activeData.type === "team-speler" && overData.type === "team") {
      const ad = activeData as DragData;
      if (ad.teamId && ad.teamId !== overData.teamId) {
        onTeamToTeam(ad.spelerId, ad.teamId, overData.teamId);
      }
    }

    // Team -> Pool
    if (activeData.type === "team-speler" && overData.type === "pool") {
      const ad = activeData as DragData;
      if (ad.teamId) {
        onTeamToPool(ad.spelerId, ad.teamId);
      }
    }
  }

  return (
    <DndKitContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}

      <DragOverlay>{activeSpeler ? <DragOverlayKaart speler={activeSpeler} /> : null}</DragOverlay>
    </DndKitContext>
  );
}

function DragOverlayKaart({ speler }: { speler: SpelerData }) {
  const leeftijd = korfbalLeeftijd(speler.geboortedatum, speler.geboortejaar);
  const kleur = kleurIndicatie(leeftijd);
  return (
    <div className="flex cursor-grabbing items-center gap-2 rounded-md border border-orange-300 px-3 py-2 shadow-lg" style={{ background: "var(--surface-card)" }}>
      <span className={`h-2 w-2 rounded-full ${STATUS_KLEUREN[speler.status]}`} />
      <span className="text-sm text-[var(--text-primary)]">
        {speler.roepnaam} {speler.achternaam}
      </span>
      <span className="inline-flex items-center gap-0.5">
        {kleur && <span className={`h-1.5 w-1.5 rounded-full ${KLEUR_DOT[kleur]}`} />}
        <span className="text-xs text-[var(--text-secondary)]">{leeftijd.toFixed(2)}</span>
      </span>
      <span className="text-xs">{speler.geslacht === "M" ? "\u2642" : "\u2640"}</span>
    </div>
  );
}
