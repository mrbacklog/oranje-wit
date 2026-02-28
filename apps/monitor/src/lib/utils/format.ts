export function formatNaam(speler: {
  roepnaam?: string | null;
  tussenvoegsel?: string | null;
  achternaam?: string | null;
}): string {
  return [speler.roepnaam, speler.tussenvoegsel, speler.achternaam].filter(Boolean).join(" ");
}
