import type { PresentatieSpeler, PresentatieStaf, PresentatieTeam } from "./presentatie-types";
import type {
  BelangrijkeDatumItem,
  KennismakingItem,
} from "@/lib/teamindeling/publieke-presentatie";

export type { BelangrijkeDatumItem, KennismakingItem };

export interface PublicatieInstellingen {
  id: string | null;
  kadersId: string;
  titel: string;
  seizoenLabel: string;
  introTekst: string;
  waaromTekst: string;
  werkwijzeTekst: string;
  competitieTekst: string;
  tcTekst: string;
  kennismakingTekst: string;
  contactTekst: string;
  kangoeroesTekst: string;
  bedankTekst: string;
  sectieVolgorde: PublicatieSectieConfig[];
  belangrijkeData: BelangrijkeDatumItem[];
  kennismakingData: KennismakingItem[];
}

export interface PublicatieSectieConfig {
  key: string;
  titel: string;
}

export interface PreseasonPdfStaf {
  naam: string;
  rol: string;
  rolLabel?: string | null;
}

export interface PreseasonPdfTeam {
  id: string;
  naam: string;
  dames: string[];
  heren: string[];
  staf: PreseasonPdfStaf[];
  leden: {
    teamId: string;
    naam: string;
    dames: string[];
    heren: string[];
  }[];
}

export interface PublicatieSectie {
  key: string;
  titel: string;
  teams: PreseasonPdfTeam[];
}

export const DEFAULT_PUBLICATIE_SECTIES: PublicatieSectieConfig[] = [
  { key: "senioren", titel: "Senioren-teams" },
  { key: "rood", titel: "U-19 / Rood" },
  { key: "oranje", titel: "U-17 / U-15 / Oranje" },
  { key: "geel", titel: "Geel" },
  { key: "groen", titel: "Groen" },
  { key: "blauw", titel: "Blauw" },
];

export const DEFAULT_PUBLICATIE_TEKSTEN = {
  titel: "Pre-season Teamindeling 2026-2027",

  introTekst: `<p>Hier is de pre-season teamindeling voor het seizoen 2026-2027.</p>
<p>Het samenstellen van teams is ieder jaar een uitdaging, maar samen met de trainers en coördinatoren hebben we opnieuw een goed en evenwichtig resultaat weten te bereiken.</p>
<p>Ook dit jaar zullen er weer blije verrassingen en teleurstellingen in de indelingen zijn. Korfbal blijft een teamsport en soms zijn er minder plaatsen dan er gegadigden zijn. Wij staan altijd klaar om de gemaakte keuzes toe te lichten.</p>`,

  waaromTekst: `<p>De pre-season indeling is een voorlopige teamindeling, zodat de teams en de staf plannen kunnen maken voor het komende seizoen. Het kan zijn dat er door aanmeldingen of opzeggingen nog enkele wijzigingen worden doorgevoerd, maar de grote lijnen zullen niet meer veranderen.</p>`,

  werkwijzeTekst: `<p>Vanaf de seizoenstart werkt de Technische Commissie (TC) toe naar de teamindeling voor het nieuwe seizoen. We herzien onze richtlijnen, plannen evaluaties, en spreken gedurende het jaar met trainers, spelers, ouders en coördinatoren — zowel formeel als informeel.</p>
<p>Na de jaarwisseling brengen we de behoeften in kaart: hoeveel teams zijn er nodig, op welk niveau, en welke staf is passend? Op basis daarvan maken we een eerste opzet, die we bespreken met trainers en coördinatoren. Hun inzichten nemen we mee in het verdere proces.</p>
<p>Daarna zoeken we passende trainers, coaches en begeleiders, en maken we definitieve keuzes. Deze lichten we zorgvuldig toe aan de betrokkenen. Richting de deadline blijft het altijd even spannend: onverwachte aan- of afmeldingen kunnen nog tot het laatste moment voor wijzigingen zorgen.</p>`,

  competitieTekst: `<p>De KNKV Competitie 2.0 structuur vormt de basis voor onze indeling. De nadruk ligt op plezier, uitdaging en ontwikkeling per leeftijdscategorie.</p>
<ul>
  <li><strong>B-categorie (breedtesport)</strong> — Rood, Oranje, Geel, Groen, Blauw: soepelere leeftijdsgrenzen, kortere reisafstanden, gelijkwaardigere competities. Teams worden aangeduid met kleuren en genummerd op basis van de gemiddelde teamleeftijd.</li>
  <li><strong>A-categorie (wedstrijdsport)</strong> — U19, U17, U15: vaste leeftijdsgrenzen, zonder leeftijdscompensatie.</li>
  <li>De <strong>superspeler-regel</strong> geldt ook in Groen (vergelijkbaar met de oude E-leeftijd).</li>
</ul>`,

  tcTekst: `<p>De Technische Commissie (TC) vormt het sportieve hart van de vereniging. Samen met coördinatoren, trainersbegeleiders en trainers zorgen we voor een goede doorstroming, passende teamindelingen en aandacht voor ontwikkeling en plezier op elk niveau.</p>
<p>Coördinatoren ondersteunen de TC het hele seizoen door en zijn het eerste aanspreekpunt voor trainers, spelers en ouders. Trainersbegeleiders bieden pedagogische en didactische ondersteuning, zodat trainers met vertrouwen en voldoening hun rol kunnen vervullen. Zo bouwen we met elkaar aan een sportieve en betrokken korfbalomgeving.</p>`,

  kennismakingTekst: `<p>Voor de zomervakantie begint, nodigen we onze oudere jeugd (8-tallen) graag uit voor een training in hun nieuwe samenstelling. Zo leren spelers elkaar alvast kennen, ontstaat er een eerste teamgevoel en kunnen trainers praktische zaken zoals contactgegevens en planningen delen.</p>

<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
  <thead>
    <tr style="background:#f3f4f6;">
      <th style="padding:10px 12px;text-align:left;font-weight:700;border-bottom:2px solid #e5e7eb;">Datum</th>
      <th style="padding:10px 12px;text-align:left;font-weight:700;border-bottom:2px solid #e5e7eb;">Tijd</th>
      <th style="padding:10px 12px;text-align:left;font-weight:700;border-bottom:2px solid #e5e7eb;">Team</th>
      <th style="padding:10px 12px;text-align:left;font-weight:700;border-bottom:2px solid #e5e7eb;">Veld</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;" rowspan="3">Dinsdag 24 juni</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">18:30 – 19:45</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">U15 Selectie</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 2</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">18:30 – 21:00</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">U19 Selectie</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 1</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">19:45 – 21:00</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">U17 Selectie</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 2</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;" rowspan="8">Woensdag 25 juni</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">18:15 – 19:30</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Geel-1</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 1</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">18:15 – 19:30</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Geel-2</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 2</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">18:15 – 19:30</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Geel-3</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 2</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">18:15 – 19:30</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Oranje-3</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 1</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">19:30 – 20:45</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Rood-1</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 1</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">19:30 – 20:45</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Rood-2</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 1</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">19:30 – 20:45</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Oranje-1</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">Veld 2</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;border-bottom:none;font-weight:600;"></td>
      <td style="padding:10px 12px;border-bottom:none;">19:30 – 20:45</td>
      <td style="padding:10px 12px;border-bottom:none;">Oranje-2</td>
      <td style="padding:10px 12px;border-bottom:none;">Veld 2</td>
    </tr>
  </tbody>
</table>

<p><em>Graag 15 minuten van tevoren aanwezig.</em></p>

<h3 style="margin-top:20px;margin-bottom:12px;font-size:15px;font-weight:700;">Belangrijke data na de zomervakantie</h3>
<ul>
  <li><strong>Week vanaf maandag 24 augustus 2026</strong> — Start trainingen voor alle teams</li>
  <li><strong>Zaterdag 29 augustus 2026</strong> — Oefenwedstrijden en/of toernooien</li>
  <li><strong>Zaterdag 5 september 2026</strong> — Start veldcompetitie!</li>
</ul>`,

  contactTekst: `<p>Heb je vragen over de indeling of wil je iets bespreken? Als TC en coördinatoren staan we open voor een gesprek over hoe de indeling tot stand is gekomen en wat dit betekent voor jou of je kind.</p>
<p>Een gesprekje kun je aanvragen via je trainer, coördinator of per mail. Houd er wel rekening mee dat we dit werk als vrijwilligers doen, en in de zomerperiode ook graag even willen opladen. Dringende vragen pakken we uiteraard zo snel mogelijk op — overige gesprekken plannen we liever na de vakantieperiode in.</p>
<p><strong>Technische Commissie</strong><br><a href="mailto:tc@ckvoranjewit.nl">tc@ckvoranjewit.nl</a></p>`,

  kangoeroesTekst: `<p>Ook komend seizoen staat de Kangoeroe-training weer op het programma! Speciaal voor kinderen van 3, 4 en 5 jaar organiseren we wekelijks een speelse training vol leuke en actieve (bal)spelletjes.</p>
<p>De trainingen worden gegeven door een enthousiaste mix van ervaren én jonge trainers. Zo zorgen we voor herkenning, plezier en een veilige sfeer om lekker te bewegen.</p>
<p>Voor kinderen van 3 en 4 jaar is deelname gratis. Kinderen van 5 jaar kunnen drie keer vrijblijvend meetrainen. Daarna bieden we de mogelijkheid tot een kangoeroelidmaatschap. Spelenderwijs kennismaken met korfbal: daar draait het om!</p>`,

  bedankTekst: `<p>Tot slot willen we alle coördinatoren, trainers en begeleiders ontzettend bedanken voor hun inzet, betrokkenheid en samenwerking het afgelopen seizoen.</p>
<p>Het opstellen van deze pre-season teamindeling is geen eenvoudige klus. Het vraagt om tijd, overleg, afstemming én soms lastige keuzes. Dankzij jullie toewijding is het ons opnieuw gelukt om tot een zorgvuldig samengesteld overzicht te komen — met oog voor sportieve ontwikkeling, teamdynamiek en spelplezier.</p>
<p>Samen maken we het verschil. Op naar een mooi nieuw seizoen!</p>`,

  belangrijkeData: [
    { datum: "24 – 25 juni 2026", omschrijving: "Kennismakingstrainingen" },
    { datum: "29 aug 2026", omschrijving: "Start competitieseizoen 2026-2027" },
    { datum: "Sept – okt 2026", omschrijving: "Selectiedagen jeugd" },
  ],

  kennismakingData: [
    { teamnaam: "U19 Selectie", datum: "Di 24 juni", tijd: "18:30–21:00", locatie: "Veld 1" },
    { teamnaam: "U17 Selectie", datum: "Di 24 juni", tijd: "19:45–21:00", locatie: "Veld 2" },
    { teamnaam: "U15 Selectie", datum: "Di 24 juni", tijd: "18:30–19:45", locatie: "Veld 2" },
    { teamnaam: "Geel-1", datum: "Wo 25 juni", tijd: "18:15–19:30", locatie: "Veld 1" },
    { teamnaam: "Geel-2", datum: "Wo 25 juni", tijd: "18:15–19:30", locatie: "Veld 2" },
    { teamnaam: "Geel-3", datum: "Wo 25 juni", tijd: "18:15–19:30", locatie: "Veld 2" },
    { teamnaam: "Oranje-1", datum: "Wo 25 juni", tijd: "19:30–20:45", locatie: "Veld 2" },
    { teamnaam: "Oranje-2", datum: "Wo 25 juni", tijd: "19:30–20:45", locatie: "Veld 2" },
    { teamnaam: "Oranje-3", datum: "Wo 25 juni", tijd: "18:15–19:30", locatie: "Veld 1" },
    { teamnaam: "Rood-1", datum: "Wo 25 juni", tijd: "19:30–20:45", locatie: "Veld 1" },
    { teamnaam: "Rood-2", datum: "Wo 25 juni", tijd: "19:30–20:45", locatie: "Veld 1" },
  ],
} as const;

export function maakDefaultPublicatieInstellingen(
  kadersId: string,
  seizoenLabel: string
): PublicatieInstellingen {
  return {
    id: null,
    kadersId,
    seizoenLabel,
    sectieVolgorde: DEFAULT_PUBLICATIE_SECTIES,
    ...DEFAULT_PUBLICATIE_TEKSTEN,
    belangrijkeData: [...DEFAULT_PUBLICATIE_TEKSTEN.belangrijkeData],
    kennismakingData: [...DEFAULT_PUBLICATIE_TEKSTEN.kennismakingData],
  };
}

export function formatPubliekeSpelerNaam(speler: PresentatieSpeler): string {
  const roepnaam = speler.roepnaam.trim();
  const initiaal = roepnaam[0]?.toUpperCase() ?? "";
  const tussenvoegsel = speler.tussenvoegsel?.trim();
  const achternaam = speler.achternaam.trim();
  const basis = `${achternaam}, ${initiaal}. (${roepnaam})`;
  return tussenvoegsel ? `${basis} ${tussenvoegsel}` : basis;
}

function sorteerOpRoepnaam(namen: PresentatieSpeler[]): PresentatieSpeler[] {
  return [...namen].sort((a, b) => a.roepnaam.localeCompare(b.roepnaam, "nl"));
}

function mapStaf(staf: PresentatieStaf[]): PreseasonPdfStaf[] {
  return staf
    .filter((item) => item.naam.trim().length > 0)
    .map((item) => ({ naam: item.naam, rol: item.rol, rolLabel: item.rolLabel ?? null }));
}

function mapTeam(team: PresentatieTeam): PreseasonPdfTeam {
  return {
    id: team.id,
    naam: team.naam,
    dames: sorteerOpRoepnaam(team.dames).map(formatPubliekeSpelerNaam),
    heren: sorteerOpRoepnaam(team.heren).map(formatPubliekeSpelerNaam),
    staf: mapStaf(team.staf),
    leden: team.leden.map((lid) => ({
      teamId: lid.teamId,
      naam: lid.naam,
      dames: sorteerOpRoepnaam(lid.dames).map(formatPubliekeSpelerNaam),
      heren: sorteerOpRoepnaam(lid.heren).map(formatPubliekeSpelerNaam),
    })),
  };
}

function sectieKeyVoorTeam(team: PresentatieTeam): string | null {
  if (team.teamCategorie === "SENIOREN") return "senioren";
  if (team.kleur === "rood" || /\bU19\b/i.test(team.naam)) return "rood";
  if (team.kleur === "oranje" || /\bU(17|15)\b/i.test(team.naam)) return "oranje";
  if (team.kleur === "geel") return "geel";
  if (team.kleur === "groen") return "groen";
  if (team.kleur === "blauw") return "blauw";
  return null;
}

export function bouwPreseasonPdfSecties(
  teams: PresentatieTeam[],
  sectieVolgorde: PublicatieSectieConfig[] = DEFAULT_PUBLICATIE_SECTIES
): PublicatieSectie[] {
  const teamsOpVolgorde = [...teams].sort((a, b) => a.volgorde - b.volgorde);
  return sectieVolgorde
    .map((config) => ({
      key: config.key,
      titel: config.titel,
      teams: teamsOpVolgorde
        .filter((team) => sectieKeyVoorTeam(team) === config.key)
        .filter((team) => team.dames.length > 0 || team.heren.length > 0 || team.leden.length > 0)
        .map(mapTeam),
    }))
    .filter((sectie) => sectie.teams.length > 0);
}
