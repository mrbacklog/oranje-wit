"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TeamKaart from "../TeamKaart";
import type { TeamKaartProps } from "../TeamKaart";

interface SortableTeamKaartProps extends TeamKaartProps {
  sortId: string;
}

export default function SortableTeamKaart({ sortId, ...kaartProps }: SortableTeamKaartProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortId,
    data: { type: "team-kaart", teamId: kaartProps.team.id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        e.stopPropagation();
        listeners?.onPointerDown?.(e);
      }}
    >
      <TeamKaart {...kaartProps} />
    </div>
  );
}
