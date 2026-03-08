"use client";

import { useDraggable } from "@dnd-kit/core";
import SelectieBlok from "../SelectieBlok";
import type { SelectieBlokProps } from "../SelectieBlok";

interface DraggableSelectieBlokProps extends SelectieBlokProps {
  dragId: string;
  position: { x: number; y: number };
}

export default function DraggableSelectieBlok({
  dragId,
  position,
  ...blokProps
}: DraggableSelectieBlokProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: { type: "selectie-blok", teamId: blokProps.teams[0]?.id },
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
      <SelectieBlok
        {...blokProps}
        dragHandleRef={setActivatorNodeRef}
        dragHandleListeners={listeners}
      />
    </div>
  );
}
