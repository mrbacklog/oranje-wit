"use client";

import {
  DndContext as DndKitContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState, type ReactNode } from "react";
import type { SpelerData } from "./types";
import { SEIZOEN_JAAR, STATUS_KLEUREN } from "./types";

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
    if (!over) return;

    const activeData = active.data.current as DragData | undefined;
    const overData = over.data.current as
      | { type: "team"; teamId: string }
      | { type: "pool" }
      | undefined;

    if (!activeData || !overData) return;

    // Pool -> Team
    if (activeData.type === "pool-speler" && overData.type === "team") {
      onPoolToTeam(activeData.spelerId, overData.teamId);
    }

    // Team -> Team
    if (activeData.type === "team-speler" && overData.type === "team") {
      if (activeData.teamId && activeData.teamId !== overData.teamId) {
        onTeamToTeam(activeData.spelerId, activeData.teamId, overData.teamId);
      }
    }

    // Team -> Pool
    if (activeData.type === "team-speler" && overData.type === "pool") {
      if (activeData.teamId) {
        onTeamToPool(activeData.spelerId, activeData.teamId);
      }
    }
  }

  return (
    <DndKitContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}

      <DragOverlay>
        {activeSpeler ? (
          <DragOverlayKaart speler={activeSpeler} />
        ) : null}
      </DragOverlay>
    </DndKitContext>
  );
}

function DragOverlayKaart({ speler }: { speler: SpelerData }) {
  const leeftijd = SEIZOEN_JAAR - speler.geboortejaar;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-orange-300 bg-white shadow-lg cursor-grabbing">
      <span
        className={`w-2 h-2 rounded-full ${STATUS_KLEUREN[speler.status]}`}
      />
      <span className="text-sm text-gray-800">
        {speler.roepnaam} {speler.achternaam}
      </span>
      <span className="text-xs text-gray-400">{leeftijd}</span>
      <span className="text-xs">
        {speler.geslacht === "M" ? "\u2642" : "\u2640"}
      </span>
    </div>
  );
}
