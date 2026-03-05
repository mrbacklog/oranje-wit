"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SelectieBlok from "../SelectieBlok";
import type { SelectieBlokProps } from "../SelectieBlok";

interface SortableSelectieBlokProps extends SelectieBlokProps {
  sortId: string;
}

export default function SortableSelectieBlok({ sortId, ...blokProps }: SortableSelectieBlokProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortId,
    data: { type: "selectie-blok", teamId: blokProps.teams[0]?.id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} onPointerDown={(e) => e.stopPropagation()}>
      <SelectieBlok
        {...blokProps}
        dragHandleRef={setActivatorNodeRef}
        dragHandleListeners={listeners}
      />
    </div>
  );
}
