"use client";

import { useDraggable } from "@dnd-kit/core";
import TeamKaart from "../TeamKaart";
import type { TeamKaartProps } from "../TeamKaart";

interface DraggableTeamKaartProps extends TeamKaartProps {
  dragId: string;
  position: { x: number; y: number };
}

export default function DraggableTeamKaart({
  dragId,
  position,
  ...kaartProps
}: DraggableTeamKaartProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: { type: "team-kaart", teamId: kaartProps.team.id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <TeamKaart
        {...kaartProps}
        dragHandleRef={setActivatorNodeRef}
        dragHandleListeners={listeners}
      />
    </div>
  );
}
