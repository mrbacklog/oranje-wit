// Card size constanten voor AABB collision detection en auto-grid layout

export const CARD_WIDTH_SINGLE = 220; // viertal
export const CARD_GAP = 16;
export const CARD_WIDTH_DOUBLE = 2 * CARD_WIDTH_SINGLE + CARD_GAP; // achtal/selectie
export const CARD_HEIGHT = 80; // overzicht compacte hoogte
export const COLLISION_PADDING = 8;
export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 3000;

/** Schat de kaarthoogte op basis van content */
export function getCardHeight(spelersCount: number, hasStaf: boolean): number {
  const headerHeight = 36;
  const footerHeight = 28;
  const stafHeight = hasStaf ? 24 : 0;
  const spelerRowHeight = 28;
  const padding = 16;
  const contentHeight = spelersCount * spelerRowHeight;
  return headerHeight + stafHeight + contentHeight + footerHeight + padding;
}

export function getCardSize(teamType: string, isSelectie: boolean): { w: number; h: number } {
  const w = isSelectie || teamType !== "VIERTAL" ? CARD_WIDTH_DOUBLE : CARD_WIDTH_SINGLE;
  return { w, h: CARD_HEIGHT };
}
