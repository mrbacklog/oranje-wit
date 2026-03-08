// Vaste kaartafmetingen — collision detection EN rendering gebruiken dezelfde waardes

export const CARD_WIDTH_SINGLE = 220; // viertal
export const CARD_GAP = 16;
export const CARD_WIDTH_DOUBLE = 2 * CARD_WIDTH_SINGLE + CARD_GAP; // achtal/selectie
export const CARD_HEIGHT_SINGLE = 400; // viertal — ruimte voor 8 spelers + header + footer
export const CARD_HEIGHT_DOUBLE = 800; // achtal/selectie — dubbele hoogte voor 16 spelers
export const COLLISION_PADDING = 8;
export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 3000;

export function getCardSize(teamType: string, isSelectie: boolean): { w: number; h: number } {
  const isDouble = isSelectie || teamType !== "VIERTAL";
  return {
    w: isDouble ? CARD_WIDTH_DOUBLE : CARD_WIDTH_SINGLE,
    h: isDouble ? CARD_HEIGHT_DOUBLE : CARD_HEIGHT_SINGLE,
  };
}
