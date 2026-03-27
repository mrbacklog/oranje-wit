export function formatNaam(speler: {
  roepnaam?: string | null;
  tussenvoegsel?: string | null;
  achternaam?: string | null;
}): string {
  let { achternaam, tussenvoegsel } = speler;

  // Sportlink slaat soms "Wit, de" op in achternaam — splits dat op
  if (achternaam && !tussenvoegsel && achternaam.includes(",")) {
    const [naam, tv] = achternaam.split(",", 2).map((s) => s.trim());
    achternaam = naam;
    tussenvoegsel = tv || null;
  }

  return [speler.roepnaam, tussenvoegsel, achternaam].filter(Boolean).join(" ");
}
