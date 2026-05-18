"use client";

/**
 * useKaartDraggable — muis-gebaseerde kaart-positionering op het werkbord-canvas
 *
 * Kaart-drag werkt via mouse-events (niet PDND) omdat canvas-positionering
 * pixel-coördinaten vereist die PDND niet levert. Speler-drag blijft PDND
 * (useWerkbordDraggable) en werkt onafhankelijk via stopPropagation op de header.
 *
 * Gebruik:
 *   const { handleMouseDown, isDragging } = useKaartDraggable({
 *     kaartKey: "team-abc",
 *     huidigePos: posities["team-abc"] ?? gridFallback(idx),
 *     schaal,
 *     onDrop: (kaartKey, x, y) => { ... },
 *   });
 *   <div onMouseDown={handleMouseDown} />
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface UseKaartDraggableOptions {
  kaartKey: string;
  huidigePos: { x: number; y: number };
  schaal: number;
  onMove?: (kaartKey: string, x: number, y: number) => void;
  onDrop: (kaartKey: string, x: number, y: number) => void;
}

interface UseKaartDraggableResult {
  handleMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

export function useKaartDraggable({
  kaartKey,
  huidigePos,
  schaal,
  onMove,
  onDrop,
}: UseKaartDraggableOptions): UseKaartDraggableResult {
  const [isDragging, setIsDragging] = useState(false);

  const sleepRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const onMoveRef = useRef(onMove);
  const onDropRef = useRef(onDrop);
  const huidigePoRef = useRef(huidigePos);
  const schaalRef = useRef(schaal);

  // Houd refs in sync om stale-closure te vermijden
  onMoveRef.current = onMove;
  onDropRef.current = onDrop;
  huidigePoRef.current = huidigePos;
  schaalRef.current = schaal;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // voorkomt canvas-pan
      sleepRef.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPosX: huidigePoRef.current.x,
        startPosY: huidigePoRef.current.y,
      };
      setIsDragging(true);
    },
    [] // kaartKey niet nodig — refs bewaken het
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!sleepRef.current) return;
      const s = schaalRef.current;
      const dx = (e.clientX - sleepRef.current.startMouseX) / s;
      const dy = (e.clientY - sleepRef.current.startMouseY) / s;
      const newX = Math.max(0, sleepRef.current.startPosX + dx);
      const newY = Math.max(0, sleepRef.current.startPosY + dy);
      onMoveRef.current?.(kaartKey, Math.round(newX), Math.round(newY));
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!sleepRef.current) return;
      const s = schaalRef.current;
      const dx = (e.clientX - sleepRef.current.startMouseX) / s;
      const dy = (e.clientY - sleepRef.current.startMouseY) / s;
      const newX = Math.max(0, Math.round(sleepRef.current.startPosX + dx));
      const newY = Math.max(0, Math.round(sleepRef.current.startPosY + dy));
      onDropRef.current(kaartKey, newX, newY);
      sleepRef.current = null;
      setIsDragging(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, kaartKey]);

  return { handleMouseDown, isDragging };
}
