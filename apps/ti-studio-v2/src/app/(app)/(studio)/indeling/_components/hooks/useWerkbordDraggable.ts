"use client";

/**
 * useWerkbordDraggable — wraps PDND draggable()
 *
 * Gebruik:
 *   const { ref, isDragging } = useWerkbordDraggable({ rel_code, bron });
 *   <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }} />
 *
 * Library-wissel: vervang alleen deze hook, niet de consumers.
 */

import { useEffect, useRef, useState } from "react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

export type DragBron = "spelerpool" | `team-${string}`;

export interface WerkbordDragData extends Record<string, unknown> {
  type: "speler";
  rel_code: string;
  bron: DragBron;
}

interface UseWerkbordDraggableOptions {
  rel_code: string;
  bron: DragBron;
  disabled?: boolean;
}

interface UseWerkbordDraggableResult {
  ref: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
}

export function useWerkbordDraggable({
  rel_code,
  bron,
  disabled = false,
}: UseWerkbordDraggableOptions): UseWerkbordDraggableResult {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    return draggable({
      element: el,
      getInitialData: (): WerkbordDragData => ({ type: "speler", rel_code, bron }),
      onDragStart: () => setIsDragging(true),
      onDrop: () => setIsDragging(false),
    });
  }, [rel_code, bron, disabled]);

  return { ref, isDragging };
}
