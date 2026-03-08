"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "@oranje-wit/types";

import {
  CARD_GAP,
  CARD_HEIGHT,
  CARD_WIDTH_DOUBLE,
  CARD_WIDTH_SINGLE,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLLISION_PADDING,
  getCardSize,
} from "../editor/cardSizes";

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
  let row = 0;

  for (const card of cards) {
    const size = getCardSize(card.teamType, card.isSelectie);
    const span = size.w === CARD_WIDTH_DOUBLE ? 2 : 1;

    // If this card doesn't fit on the current row, move to next row
    if (col + span > GRID_COLS) {
      row++;
      col = 0;
    }

    const x = col * colUnit;
    const y = row * (CARD_HEIGHT + CARD_GAP);
    positions[card.id] = { x, y };

    col += span;

    // If we've filled the row, advance
    if (col >= GRID_COLS) {
      col = 0;
      row++;
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
// localStorage helpers
// ---------------------------------------------------------------------------

function storageKey(scenarioId: string): string {
  return `ow-card-positions-${scenarioId}`;
}

function loadPositions(scenarioId: string): PositionMap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(scenarioId));
    if (!raw) return null;
    return JSON.parse(raw) as PositionMap;
  } catch (error) {
    logger.warn("Kon posities niet laden uit localStorage:", error);
    return null;
  }
}

function savePositions(scenarioId: string, positions: PositionMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(scenarioId), JSON.stringify(positions));
  } catch (error) {
    logger.warn("Kon posities niet opslaan in localStorage:", error);
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCardPositions(
  scenarioId: string,
  cards: CardInfo[]
): {
  positions: PositionMap;
  updatePosition: (id: string, deltaX: number, deltaY: number) => void;
  resetPositions: () => void;
} {
  const [positions, setPositions] = useState<PositionMap>({});
  const cardsRef = useRef<CardInfo[]>(cards);
  cardsRef.current = cards;

  // Build initial positions on mount or when scenarioId/cards change
  useEffect(() => {
    const sizes = buildSizeMap(cards);
    const stored = loadPositions(scenarioId);
    const cardIds = new Set(cards.map((c) => c.id));

    if (stored) {
      // Start with stored positions for cards that still exist
      const merged: PositionMap = {};
      for (const id of cardIds) {
        if (stored[id]) {
          merged[id] = stored[id];
        }
      }

      // Calculate positions for any new cards not in storage
      const missingCards = cards.filter((c) => !stored[c.id]);
      if (missingCards.length > 0) {
        const autoPositions = calculateAutoGrid(missingCards);
        // Offset new cards so they don't overlap with existing ones
        for (const [id, pos] of Object.entries(autoPositions)) {
          merged[id] = pos;
        }
        // Resolve any collisions from merging
        const allResolved = resolveCollisions(merged, sizes, missingCards[0].id);
        setPositions(allResolved);
        savePositions(scenarioId, allResolved);
      } else {
        setPositions(merged);
      }
    } else {
      // No stored positions — calculate from scratch
      const auto = calculateAutoGrid(cards);
      setPositions(auto);
      savePositions(scenarioId, auto);
    }
  }, [scenarioId, cards]);

  const updatePosition = useCallback(
    (id: string, deltaX: number, deltaY: number) => {
      setPositions((prev) => {
        const current = prev[id];
        if (!current) return prev;

        const updated: PositionMap = {
          ...prev,
          [id]: { x: current.x + deltaX, y: current.y + deltaY },
        };

        const sizes = buildSizeMap(cardsRef.current);
        const resolved = resolveCollisions(updated, sizes, id);
        savePositions(scenarioId, resolved);
        return resolved;
      });
    },
    [scenarioId]
  );

  const resetPositions = useCallback(() => {
    const auto = calculateAutoGrid(cardsRef.current);
    setPositions(auto);
    savePositions(scenarioId, auto);
  }, [scenarioId]);

  return { positions, updatePosition, resetPositions };
}
