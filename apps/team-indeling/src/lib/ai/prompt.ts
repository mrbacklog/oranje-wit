/**
 * Prompt builder voor Claude AI teamindeling-voorstel.
 *
 * Bouwt een gestructureerde prompt met KNKV-regels, OW-voorkeuren,
 * beschikbare teams en spelers.
 */

interface TeamInput {
  naam: string;
  categorie: string;
  kleur: string | null;
}

interface SpelerInput {
  id: string;
  roepnaam: string;
  achternaam: string;
  geboortejaar: number;
  geslacht: string;
  status: string;
  huidigTeam?: string | null;
}

export function buildVoorstelPrompt(
  teams: TeamInput[],
  spelers: SpelerInput[],
  seizoenJaar: number,
  opties?: { teamgroottePrio?: string; prioriteiten?: string }
): string {
  const teamLijst = teams
    .map((t) => {
      const kleurStr = t.kleur ? ` (${t.kleur.toLowerCase()})` : "";
      return `- ${t.naam}: ${categorieLabel(t.categorie)}${kleurStr}`;
    })
    .join("\n");

  const spelerLijst = spelers
    .map((s) => {
      const leeftijd = seizoenJaar - s.geboortejaar;
      const geslacht = s.geslacht === "M" ? "jongen" : "meisje";
      const status = statusLabel(s.status);
      const huidig = s.huidigTeam ? ` | huidig: ${s.huidigTeam}` : "";
      return `- [${s.id}] ${s.roepnaam} ${s.achternaam} | ${s.geboortejaar} (${leeftijd} jr) | ${geslacht} | ${status}${huidig}`;
    })
    .join("\n");

  const teamgrootteTekst = teamgroottePrioTekst(opties?.teamgroottePrio);
  const prioriteitenTekst = opties?.prioriteiten
    ? `\n## Extra prioriteiten van de gebruiker\n${opties.prioriteiten}\n`
    : "";

  return `Je bent een korfbal-expert die helpt bij de jaarlijkse teamindeling van jeugdteams voor c.k.v. Oranje Wit. Seizoen ${seizoenJaar - 1}-${seizoenJaar}.

## KNKV-regels (verplicht)

### B-categorie (jeugd)
- **Viertallen** (blauw, groen): min 4, max 8 spelers. Leeftijdsspreiding max 2 geboortejaren.
- **Achttallen** (geel, oranje, rood): min 8, max 13 spelers. Leeftijdsspreiding max 3 geboortejaren. Gemiddelde leeftijd minimaal 9.0 jaar.

### A-categorie (U15, U17, U19)
- Achttallen: min 8, max 13 spelers. Twee geboortejaren per categorie.

### Senioren
- Achttallen: min 8, max 13 spelers. Geen leeftijdsbeperkingen.

## OW-voorkeuren (zacht, probeer te respecteren)
- **Genderbalans**: streef naar minimaal 2 jongens en 2 meisjes per team. Vermijd dat 1 kind alleen van zijn/haar geslacht in een team zit.
- **Sociale cohesie**: houd vriendengroepjes en kinderen die al samen speelden bij voorkeur samen.
- **Plezier > Prestatie**: de Oranje Draad is Plezier + Ontwikkeling + Prestatie = Duurzaamheid. Plezier staat voorop.
- **Ideale teamgrootte viertallen**: 5-6 spelers.
- **Ideale teamgrootte achttallen**: 9-11 spelers.
${teamgrootteTekst}
${prioriteitenTekst}
## Beschikbare teams

${teamLijst}

## Beschikbare spelers

${spelerLijst}

## Opdracht

Deel ALLE bovenstaande spelers in bij precies 1 team. Elke speler moet in exact 1 team worden geplaatst.

Let op:
- Respecteer de KNKV-regels (leeftijdsspreiding, teamgrootte).
- Spelers met status "GAAT_STOPPEN" mogen worden overgeslagen (niet indelen).
- Spelers met status "NIEUW_POTENTIEEL", "NIEUW_DEFINITIEF" of "BESCHIKBAAR" moeten worden ingedeeld.
- Spelers met status "TWIJFELT" wel indelen, maar noteer dat ze onzeker zijn.
- Gebruik de leeftijd (geboortejaar) om spelers bij het juiste team te plaatsen.
- Zorg voor genderbalans per team.

## Gewenst uitvoerformaat

Antwoord UITSLUITEND met een JSON-array, zonder toelichting of markdown. Het formaat:

[
  { "teamNaam": "Teamnaam", "spelerIds": ["id1", "id2", ...] }
]

Geef ALLEEN de JSON terug, geen andere tekst.`;
}

function categorieLabel(categorie: string): string {
  switch (categorie) {
    case "B_CATEGORIE":
      return "B-categorie";
    case "A_CATEGORIE":
      return "A-categorie";
    case "SENIOREN":
      return "Senioren";
    default:
      return categorie;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "BESCHIKBAAR":
      return "beschikbaar";
    case "TWIJFELT":
      return "twijfelt";
    case "GAAT_STOPPEN":
      return "gaat stoppen";
    case "NIEUW_POTENTIEEL":
      return "nieuw (potentieel)";
    case "NIEUW_DEFINITIEF":
      return "nieuw (definitief)";
    default:
      return status;
  }
}

function teamgroottePrioTekst(prio?: string): string {
  switch (prio) {
    case "compact":
      return "- **Voorkeur**: maak teams liever kleiner (richting minimum). Liever een extra team dan te grote teams.";
    case "ruim":
      return "- **Voorkeur**: maak teams liever groter (richting maximum). Liever minder teams met meer spelers.";
    default:
      return "- **Voorkeur**: standaard teamgrootte (streef naar het midden van de bandbreedte).";
  }
}
