"use client";

import {
  DndContext as DndKitContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState, useMemo, type ReactNode } from "react";
import type { SpelerData } from "./types";
import { STATUS_KLEUREN, kleurIndicatie, KLEUR_DOT, korfbalLeeftijd } from "./types";
import { useZoomScale } from "./editor/ZoomScaleContext";

interface DndProviderProps {
  children: ReactNode;
  spelers: SpelerData[];
  onPoolToTeam: (spelerId: string, teamId: string) => void;
  onTeamToTeam: (spelerId: string, vanTeamId: string, naarTeamId: string) => void;
  onTeamToPool: (spelerId: string, teamId: string) => void;
  onRepositionCard?: (cardId: string, deltaX: number, deltaY: number) => void;
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
  onRepositionCard,
}: DndProviderProps) {
  const [activeSpeler, setActiveSpeler] = useState<SpelerData | null>(null);
  const zoomScale = useZoomScale();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Compenseer voor CSS scale transform zodat drag-overlay de cursor volgt
  const adjustScaleModifier: Modifier = useMemo(
    () =>
      ({ transform: t }) => ({
        ...t,
        x: t.x / zoomScale,
        y: t.y / zoomScale,
      }),
    [zoomScale]
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData | undefined;
    if (!data) return;
    const speler = spelers.find((s) => s.id === data.spelerId);
    setActiveSpeler(speler ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveSpeler(null);

    const { active, over, delta } = event;

    const activeData = active.data.current as
      | DragData
      | { type: "team-kaart" | "selectie-blok" }
      | undefined;
    if (!activeData) return;

    // Vrije herpositionering van kaarten
    const isCardDrag = activeData.type === "team-kaart" || activeData.type === "selectie-blok";

    if (isCardDrag && onRepositionCard) {
      const scaledDeltaX = delta.x / zoomScale;
      const scaledDeltaY = delta.y / zoomScale;
      onRepositionCard(String(active.id), scaledDeltaX, scaledDeltaY);
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
      collisionDetection={closestCenter}
      modifiers={[adjustScaleModifier]}
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
    <div className="flex cursor-grabbing items-center gap-2 rounded-md border border-orange-300 bg-white px-3 py-2 shadow-lg">
      <span className={`h-2 w-2 rounded-full ${STATUS_KLEUREN[speler.status]}`} />
      <span className="text-sm text-gray-800">
        {speler.roepnaam} {speler.achternaam}
      </span>
      <span className="inline-flex items-center gap-0.5">
        {kleur && <span className={`h-1.5 w-1.5 rounded-full ${KLEUR_DOT[kleur]}`} />}
        <span className="text-xs text-gray-400">{leeftijd.toFixed(2)}</span>
      </span>
      <span className="text-xs">{speler.geslacht === "M" ? "\u2642" : "\u2640"}</span>
    </div>
  );
}
