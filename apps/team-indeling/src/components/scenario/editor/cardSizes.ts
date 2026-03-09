// Vaste kaartafmetingen — collision detection EN rendering gebruiken dezelfde waardes
// Breedte: viertal 1×, achtal/selectie 2×
// Hoogte: vast, max 8 spelerrijen

export const CARD_WIDTH_SINGLE = 168; // basisbreedte (viertal) — was 140, +20%
export const CARD_GAP = 12;
export const CARD_WIDTH_DOUBLE = 2 * CARD_WIDTH_SINGLE + CARD_GAP; // achtal/selectie = 348
export const COLLISION_PADDING = 8;
export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 3000;

// Hoogte-componenten
const HEADER_H = 24;
const FOOTER_H = 20;
const COL_HEADER_H = 16;
const ROW_H = 20;
const MAX_ROWS = 8;

export const CARD_HEIGHT = HEADER_H + COL_HEADER_H + MAX_ROWS * ROW_H + FOOTER_H; // 220px

export function getCardSize(teamType: string, isSelectie: boolean): { w: number; h: number } {
  const isDouble = teamType !== "VIERTAL";
  return {
    w: isDouble || isSelectie ? CARD_WIDTH_DOUBLE : CARD_WIDTH_SINGLE,
    h: CARD_HEIGHT,
  };
}
