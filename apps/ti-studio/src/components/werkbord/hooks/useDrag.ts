// apps/web/src/components/ti-studio/werkbord/hooks/useDrag.ts
"use client";
import { useState, useCallback } from "react";

export interface DragItem {
  spelerId: string;
  spelerNaam: string;
  vanTeamId: string | null; // null = vanuit pool
}

export interface DragState {
  actief: boolean;
  item: DragItem | null;
  overTeamId: string | null;
}

export function useDrag() {
  const [dragState, setDragState] = useState<DragState>({
    actief: false,
    item: null,
    overTeamId: null,
  });

  const startDrag = useCallback((item: DragItem) => {
    setDragState({ actief: true, item, overTeamId: null });
  }, []);

  const updateOver = useCallback((teamId: string | null) => {
    setDragState((prev) => ({ ...prev, overTeamId: teamId }));
  }, []);

  const endDrag = useCallback(() => {
    setDragState({ actief: false, item: null, overTeamId: null });
  }, []);

  return { dragState, startDrag, updateOver, endDrag };
}
