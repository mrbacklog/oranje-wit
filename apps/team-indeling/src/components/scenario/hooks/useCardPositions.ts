"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@oranje-wit/types";

import {
  CARD_GAP,
  CARD_WIDTH_DOUBLE,
  CARD_WIDTH_SINGLE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLLISION_PADDING,
  GRID_SNAP,
  getCardSize,
} from "../editor/cardSizes";
import { savePosities } from "@/app/scenarios/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CardPosition {
  x: number;
  y: number;
}

export type PositionMap = Record<string, CardPosition>;

export interface CardInfo {
  id: string;
  teamType: string;
  isSelectie: boolean;
}

type SizeMap = Record<string, { w: number; h: number }>;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const GRID_COLS = 4;

/**
 * Calculate auto-grid positions for a list of cards.
 * Cards are placed left-to-right, top-to-bottom in a 4-column grid.
 * Double-wide cards (achtal/selectie) occupy 2 columns.
 */
export function calculateAutoGrid(cards: CardInfo[]): PositionMap {
  const positions: PositionMap = {};
  const colUnit = CARD_WIDTH_SINGLE + CARD_GAP;

  let col = 0;
  let rowY = 0;
  let rowMaxHeight = 0;

  for (const card of cards) {
    const size = getCardSize(card.teamType, card.isSelectie);
    const span = size.w === CARD_WIDTH_DOUBLE ? 2 : 1;

    if (col + span > GRID_COLS) {
      rowY += rowMaxHeight + CARD_GAP;
      col = 0;
      rowMaxHeight = 0;
    }

    positions[card.id] = { x: col * colUnit, y: rowY };
    rowMaxHeight = Math.max(rowMaxHeight, size.h);
    col += span;

    if (col >= GRID_COLS) {
      rowY += rowMaxHeight + CARD_GAP;
      col = 0;
      rowMaxHeight = 0;
    }
  }

  return positions;
}

/**
 * Build a size map for collision detection from card info.
 */
function buildSizeMap(cards: CardInfo[]): SizeMap {
  const sizes: SizeMap = {};
  for (const card of cards) {
    sizes[card.id] = getCardSize(card.teamType, card.isSelectie);
  }
  return sizes;
}

/**
 * Check if two axis-aligned bounding boxes overlap, with padding.
 */
function aabbOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  padding: number
): { overlapX: number; overlapY: number } | null {
  const left = Math.max(ax - padding, bx - padding);
  const right = Math.min(ax + aw + padding, bx + bw + padding);
  const top = Math.max(ay - padding, by - padding);
  const bottom = Math.min(ay + ah + padding, by + bh + padding);

  const overlapX = right - left;
  const overlapY = bottom - top;

  if (overlapX > 0 && overlapY > 0) {
    return { overlapX, overlapY };
  }
  return null;
}

/**
 * Resolve collisions by pushing overlapping cards apart.
 * This is a pure function: it returns a new PositionMap without mutating the input.
 */
export function resolveCollisions(
  positions: PositionMap,
  sizes: SizeMap,
  movedId: string
): PositionMap {
  const result: PositionMap = {};
  for (const id of Object.keys(positions)) {
    result[id] = { ...positions[id] };
  }

  const ids = Object.keys(result);
  let dirty = new Set<string>([movedId]);
  const MAX_ITERATIONS = 10;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    if (dirty.size === 0) break;
    const nextDirty = new Set<string>();

    for (const dirtyId of dirty) {
      const a = result[dirtyId];
      const sa = sizes[dirtyId];
      if (!a || !sa) continue;

      for (const otherId of ids) {
        if (otherId === dirtyId) continue;
        const b = result[otherId];
        const sb = sizes[otherId];
        if (!b || !sb) continue;

        const overlap = aabbOverlap(a.x, a.y, sa.w, sa.h, b.x, b.y, sb.w, sb.h, COLLISION_PADDING);

        if (!overlap) continue;

        // Push the other card away on the smallest overlap axis
        if (overlap.overlapX < overlap.overlapY) {
          // Push horizontally
          const centerA = a.x + sa.w / 2;
          const centerB = b.x + sb.w / 2;
          if (centerB >= centerA) {
            b.x += overlap.overlapX;
          } else {
            b.x -= overlap.overlapX;
          }
        } else {
          // Push vertically
          const centerA = a.y + sa.h / 2;
          const centerB = b.y + sb.h / 2;
          if (centerB >= centerA) {
            b.y += overlap.overlapY;
          } else {
            b.y -= overlap.overlapY;
          }
        }

        nextDirty.add(otherId);
      }
    }

    dirty = nextDirty;
  }

  // Clamp all positions within canvas bounds
  for (const id of ids) {
    const pos = result[id];
    const size = sizes[id];
    if (!pos || !size) continue;
    pos.x = Math.max(0, Math.min(pos.x, CANVAS_WIDTH - size.w));
    pos.y = Math.max(0, Math.min(pos.y, CANVAS_HEIGHT - size.h));
  }

  return result;
}

// ---------------------------------------------------------------------------
// Debounced server save
// ---------------------------------------------------------------------------

const SAVE_DEBOUNCE_MS = 500;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCardPositions(
  versieId: string | null,
  cards: CardInfo[],
  initialPosities: PositionMap | null
): {
  positions: PositionMap;
  updatePosition: (id: string, deltaX: number, deltaY: number) => void;
  resetPositions: () => void;
} {
  const [positions, setPositions] = useState<PositionMap>({});
  const cardsRef = useRef<CardInfo[]>(cards);
  cardsRef.current = cards;
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versieIdRef = useRef(versieId);
  versieIdRef.current = versieId;

  // Debounced save to server
  const debouncedSave = useCallback((posities: PositionMap) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const vid = versieIdRef.current;
      if (!vid) return;
      savePosities(vid, posities).catch((err) => {
        logger.warn("Kon posities niet opslaan:", err);
      });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Build initial positions on mount or when cards change
  useEffect(() => {
    const sizes = buildSizeMap(cards);
    const cardIds = new Set(cards.map((c) => c.id));

    if (initialPosities) {
      // Start with stored positions for cards that still exist
      const merged: PositionMap = {};
      for (const id of cardIds) {
        if (initialPosities[id]) {
          merged[id] = initialPosities[id];
        }
      }

      // Calculate positions for any new cards not in storage
      const missingCards = cards.filter((c) => !initialPosities[c.id]);
      if (missingCards.length > 0) {
        const autoPositions = calculateAutoGrid(missingCards);
        for (const [id, pos] of Object.entries(autoPositions)) {
          merged[id] = pos;
        }
        // Resolve any collisions from merging
        const allResolved = resolveCollisions(merged, sizes, missingCards[0].id);
        setPositions(allResolved);
        debouncedSave(allResolved);
      } else {
        setPositions(merged);
      }
    } else {
      // No stored positions — calculate from scratch
      const auto = calculateAutoGrid(cards);
      setPositions(auto);
      debouncedSave(auto);
    }
  }, [cards, initialPosities, debouncedSave]);

  const updatePosition = useCallback(
    (id: string, deltaX: number, deltaY: number) => {
      setPositions((prev) => {
        const current = prev[id];
        if (!current) return prev;

        // Snap to grid
        const snappedX = Math.round((current.x + deltaX) / GRID_SNAP) * GRID_SNAP;
        const snappedY = Math.round((current.y + deltaY) / GRID_SNAP) * GRID_SNAP;

        const updated: PositionMap = {
          ...prev,
          [id]: { x: snappedX, y: snappedY },
        };

        const sizes = buildSizeMap(cardsRef.current);
        const resolved = resolveCollisions(updated, sizes, id);
        debouncedSave(resolved);
        return resolved;
      });
    },
    [debouncedSave]
  );

  const resetPositions = useCallback(() => {
    const auto = calculateAutoGrid(cardsRef.current);
    setPositions(auto);
    debouncedSave(auto);
  }, [debouncedSave]);

  return { positions, updatePosition, resetPositions };
}
