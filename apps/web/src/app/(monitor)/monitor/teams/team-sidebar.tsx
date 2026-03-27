"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TeamData } from "./teams-types";
import { BAND_DOT } from "./teams-types";

// ---------------------------------------------------------------------------
// TeamButton (sidebar)
// ---------------------------------------------------------------------------

export function TeamButton({
  code,
  team,
  isSelected,
  jCode,
  naam,
  onSelect,
  indent,
}: {
  code: string;
  team: TeamData;
  isSelected: boolean;
  jCode: string | null;
  naam: string;
  onSelect: (code: string) => void;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(code)}
      className={`mx-0 flex w-full cursor-pointer items-center gap-2 rounded-md py-1.5 text-left text-[13px] transition-colors ${indent ? "pr-3 pl-5" : "px-3"} ${
        isSelected ? "bg-ow-oranje text-white" : "text-text-primary hover:bg-surface-raised"
      } `}
    >
      {team.kleur && (
        <span
          className={`inline-block h-2 w-2 shrink-0 rounded-full ${
            isSelected ? "bg-white/50" : BAND_DOT[team.kleur] || "bg-border-strong"
          }`}
        />
      )}
      <span className="flex-1 truncate font-medium">{naam}</span>
      {jCode && (
        <span
          className={`shrink-0 text-[11px] tabular-nums ${isSelected ? "text-white/60" : "text-text-muted"}`}
        >
          {jCode}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// DragHandle
// ---------------------------------------------------------------------------

function DragHandle({ isSelected }: { isSelected: boolean }) {
  return (
    <span
      className={`flex cursor-grab touch-none flex-col gap-[2px] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing ${
        isSelected ? "opacity-100" : ""
      }`}
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span key={i} className={`flex gap-[2px]`}>
          <span
            className={`block h-[3px] w-[3px] rounded-full ${isSelected ? "bg-white/40" : "bg-border-strong"}`}
          />
          <span
            className={`block h-[3px] w-[3px] rounded-full ${isSelected ? "bg-white/40" : "bg-border-strong"}`}
          />
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SortableTeamButton (drag-and-drop wrapper)
// ---------------------------------------------------------------------------

export function SortableTeamButton({
  code,
  team,
  isSelected,
  jCode,
  naam,
  onSelect,
}: {
  code: string;
  team: TeamData;
  isSelected: boolean;
  jCode: string | null;
  naam: string;
  onSelect: (code: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: code,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() => onSelect(code)}
        className={`mx-0 flex w-full cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1.5 text-left text-[13px] transition-colors ${
          isSelected ? "bg-ow-oranje text-white" : "text-text-primary hover:bg-surface-raised"
        }`}
      >
        <span {...attributes} {...listeners}>
          <DragHandle isSelected={isSelected} />
        </span>
        {team.kleur && (
          <span
            className={`inline-block h-2 w-2 shrink-0 rounded-full ${
              isSelected ? "bg-white/50" : BAND_DOT[team.kleur] || "bg-border-strong"
            }`}
          />
        )}
        <span className="flex-1 truncate font-medium">{naam}</span>
        {jCode && (
          <span
            className={`shrink-0 text-[11px] tabular-nums ${isSelected ? "text-white/60" : "text-text-muted"}`}
          >
            {jCode}
          </span>
        )}
      </button>
    </div>
  );
}
