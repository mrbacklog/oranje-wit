// Vaste kaartafmetingen — collision detection EN rendering gebruiken dezelfde waardes
// Verhoudingen: viertal 1×1, achtal 2×1, selectie 2×2

export const CARD_WIDTH_SINGLE = 170; // basisbreedte (viertal)
export const CARD_GAP = 12;
export const CARD_WIDTH_DOUBLE = 2 * CARD_WIDTH_SINGLE + CARD_GAP; // achtal/selectie
export const CARD_HEIGHT_SINGLE = 240; // basishoogte (viertal/achtal)
export const CARD_HEIGHT_SELECTIE = 2 * CARD_HEIGHT_SINGLE; // selectie = 2× hoogte
export const COLLISION_PADDING = 8;
export const CANVAS_WIDTH = 4000;
export const CANVAS_HEIGHT = 3000;

export function getCardSize(teamType: string, isSelectie: boolean): { w: number; h: number } {
  if (isSelectie) {
    return { w: CARD_WIDTH_DOUBLE, h: CARD_HEIGHT_SELECTIE };
  }
  const isDouble = teamType !== "VIERTAL";
  return {
    w: isDouble ? CARD_WIDTH_DOUBLE : CARD_WIDTH_SINGLE,
    h: CARD_HEIGHT_SINGLE,
  };
}
