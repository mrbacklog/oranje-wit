// Vaste kaartafmetingen — collision detection EN rendering gebruiken dezelfde waardes
// Breedte: viertal 1×, achtal/selectie 2×
// Hoogte: dynamisch op basis van spelersaantal, minimum 4 rijen

export const CARD_WIDTH_SINGLE = 140; // basisbreedte (viertal)
export const CARD_GAP = 12;
export const CARD_WIDTH_DOUBLE = 2 * CARD_WIDTH_SINGLE + CARD_GAP; // achtal/selectie = 292
export const COLLISION_PADDING = 8;
export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 3000;

// Hoogte-componenten
const HEADER_H = 24;
const FOOTER_H = 20;
const COL_HEADER_H = 16;
const ROW_H = 20;
const MIN_ROWS = 4;

export function getCardHeight(maxColumnPlayers: number): number {
  return HEADER_H + COL_HEADER_H + Math.max(MIN_ROWS, maxColumnPlayers) * ROW_H + FOOTER_H;
}

export function getCardSize(
  teamType: string,
  isSelectie: boolean,
  damesCount: number,
  herenCount: number
): { w: number; h: number } {
  const isDouble = teamType !== "VIERTAL";

  let maxCol: number;
  if (isSelectie) {
    // 4 kolommen: splits dames en heren elk in 2
    maxCol = Math.max(Math.ceil(damesCount / 2), Math.ceil(herenCount / 2));
  } else if (isDouble) {
    // Achtal: 2 kolommen (dames | heren)
    maxCol = Math.max(damesCount, herenCount);
  } else {
    // Viertal: gestapeld (dames boven heren)
    maxCol = damesCount + herenCount;
  }

  return {
    w: isDouble || isSelectie ? CARD_WIDTH_DOUBLE : CARD_WIDTH_SINGLE,
    h: getCardHeight(maxCol),
  };
}
