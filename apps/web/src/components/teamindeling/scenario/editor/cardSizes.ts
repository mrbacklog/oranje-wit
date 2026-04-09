// Vaste kaartafmetingen — collision detection EN rendering gebruiken dezelfde waardes
// Eenheid: U = 70px
// Viertal:  140 × 210px (2U breed, 3U hoog)
// Achtal:   280 × 210px (4U breed, 3U hoog)
// Selectie: 560 × 210px (8U breed, 3U hoog)

export const CARD_WIDTH_SINGLE = 140; // viertal: 2U
export const CARD_GAP = 12; // tussenruimte op canvas
export const CARD_WIDTH_DOUBLE = 280; // achtal: 4U (2 × 140)
export const CARD_WIDTH_QUAD = 560; // selectie: 8U (4 × 140)
export const COLLISION_PADDING = 8;
export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 3000;
export const GRID_SNAP = 20;

// Hoogte-componenten (vaste kaarthoogte = 210px)
export const HEADER_H = 36;
export const FOOTER_H = 28;
export const BODY_H = 210 - HEADER_H - FOOTER_H; // 146px voor 7 rijen
export const ROW_H = Math.floor(BODY_H / 7); // ≈ 20px per rij

export const CARD_HEIGHT = 210; // altijd 210px

export function getCardSize(teamType: string, isSelectie: boolean): { w: number; h: number } {
  if (isSelectie) return { w: CARD_WIDTH_QUAD, h: CARD_HEIGHT };
  const isDouble = teamType !== "VIERTAL";
  return {
    w: isDouble ? CARD_WIDTH_DOUBLE : CARD_WIDTH_SINGLE,
    h: CARD_HEIGHT,
  };
}
