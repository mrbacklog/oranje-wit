// Card size constanten voor AABB collision detection en auto-grid layout

export const CARD_WIDTH_SINGLE = 220; // viertal
export const CARD_GAP = 16;
export const CARD_WIDTH_DOUBLE = 2 * CARD_WIDTH_SINGLE + CARD_GAP; // achtal/selectie
export const CARD_HEIGHT = 80; // overzicht compacte hoogte
export const COLLISION_PADDING = 8;
export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 3000;

export function getCardSize(teamType: string, isSelectie: boolean): { w: number; h: number } {
  const w = isSelectie || teamType !== "VIERTAL" ? CARD_WIDTH_DOUBLE : CARD_WIDTH_SINGLE;
  return { w, h: CARD_HEIGHT };
}
