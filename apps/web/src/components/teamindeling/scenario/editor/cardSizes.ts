// Vaste kaartafmetingen — collision detection EN rendering gebruiken dezelfde waardes
// Breedte: elke kolom in een kaart is exact CARD_WIDTH_SINGLE breed
// Hoogte: vast, max 8 spelerrijen

export const CARD_WIDTH_SINGLE = 168; // basisbreedte (viertal)
export const CARD_GAP = 12; // tussenruimte op canvas
export const CARD_WIDTH_DOUBLE = 2 * CARD_WIDTH_SINGLE + CARD_GAP; // achtal = 348 (2 kolommen)
export const CARD_WIDTH_QUAD = 4 * CARD_WIDTH_SINGLE + 3 * CARD_GAP; // selectie = 708 (4 kolommen)
export const COLLISION_PADDING = 8;
export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 3000;
export const GRID_SNAP = 20;

// Hoogte-componenten
const HEADER_H = 24;
const FOOTER_H = 20;
const COL_HEADER_H = 16;
const ROW_H = 20;
const MAX_ROWS = 9;

export const CARD_HEIGHT = HEADER_H + COL_HEADER_H + MAX_ROWS * ROW_H + FOOTER_H; // 240px

export function getCardSize(teamType: string, isSelectie: boolean): { w: number; h: number } {
  if (isSelectie) return { w: CARD_WIDTH_QUAD, h: CARD_HEIGHT };
  const isDouble = teamType !== "VIERTAL";
  return {
    w: isDouble ? CARD_WIDTH_DOUBLE : CARD_WIDTH_SINGLE,
    h: CARD_HEIGHT,
  };
}
