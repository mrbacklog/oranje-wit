import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@oranje-wit/teamindeling-shared/seizoen";
import { logger, berekenKorfbalLeeftijd, korfbalPeildatum, type Seizoen } from "@oranje-wit/types";
import type { TekstBlok } from "@/app/(protected)/presentatie/preseason-pdf-data";
import { DEFAULT_BLOKKEN } from "@/app/(protected)/presentatie/preseason-pdf-data";

export type { TekstBlok };

// ── Types ────────────────────────────────────────────────────────────────────

export type PubliekeSpeler = {
  roepnaam: string;
  tussenvoegsel: string | null;
  achternaam: string;
  geslacht: "V" | "M";
};

export type PubliekeStaf = {
  naam: string;
  rol: string;
  rolLabel?: string | null;
};

export type KennismakingItem = {
  teamnaam: string;
  datum: string; // bijv. "za 23 augustus 2026"
  tijd: string; // bijv. "10:00–12:00"
  locatie: string; // bijv. "Sporthal De Hollandse IJssel"
  cancelled?: boolean;
  cancelledNote?: string;
};

export type BelangrijkeDatumItem = {
  datum: string; // bijv. "za 16 augustus 2026"
  omschrijving: string; // bijv. "Eerste training senioren"
};

export type PubliekTeam = {
  id: string;
  naam: string;
  volgorde: number;
  soort: "team" | "selectie";
  gebundeld: boolean;
  dames: PubliekeSpeler[];
  heren: PubliekeSpeler[];
  jNummer: string | null;
  /** Alleen gevuld als soort=selectie en gebundeld=false */
  subteams: {
    naam: string;
    jNummer: string | null;
    dames: PubliekeSpeler[];
    heren: PubliekeSpeler[];
    staf: PubliekeStaf[];
  }[];
  /** Teamnamen die uit deze selectie-pool voortkomen (gebundeld=true) */
  uitkomstTeams: string[];
  staf: PubliekeStaf[];
  kennismakingstraining: KennismakingItem | null;
};

export type PubliekeToelichtingData = {
  titel: string;
  seizoenLabel: string;
  statusBanner: string | null;
  tcOndertekening: string | null;
  toelichtingBlokken: TekstBlok[];
  kalenderBlokken: TekstBlok[];
  kennismakingBlokken: TekstBlok[];
  tcOproepBlokken: TekstBlok[];
  vragenBlokken: TekstBlok[];
  belangrijkeData: BelangrijkeDatumItem[];
  kennismakingstrainingen: KennismakingItem[];
};

export type PubliekeTeamindelingData = {
  toelichting: PubliekeToelichtingData;
  teams: PubliekTeam[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function normaliseerNaam(naam: string): string {
  return naam
    .toLowerCase()
    .replace(/[-\s]+/g, " ")
    .trim();
}

/** Bouw een genormaliseerde lookup-map uit de DB-kennismakingData. */
function bouwKennismakingLookup(items: KennismakingItem[]): Map<string, KennismakingItem> {
  const map = new Map<string, KennismakingItem>();
  for (const item of items) {
    map.set(normaliseerNaam(item.teamnaam), item);
  }
  return map;
}

function bouwSpeler(r: {
  roepnaam: string;
  achternaam: string;
  geslacht: string;
  tussenvoegsel?: string | null;
}): PubliekeSpeler {
  return {
    roepnaam: r.roepnaam,
    achternaam: r.achternaam,
    tussenvoegsel: r.tussenvoegsel ?? null,
    geslacht: r.geslacht === "V" ? "V" : "M",
  };
}

/** Berekent J-nummers server-side op basis van gemiddelde korfballeeftijd per B-categorie team. */
function berekenJNummersPubliek(
  teams: {
    id: string;
    categorie: string | null;
    volgorde: number;
    spelers: { speler: { geboortedatum: Date | null; geboortejaar: number | null } }[];
  }[],
  peildatum: Date
): Map<string, string> {
  const bTeams = teams.filter((t) => t.categorie === "B_CATEGORIE");

  const metLeeftijd = bTeams.map((t) => {
    const leeftijden = t.spelers
      .filter((ts) => ts.speler.geboortejaar !== null)
      .map((ts) =>
        berekenKorfbalLeeftijd(ts.speler.geboortedatum, ts.speler.geboortejaar!, peildatum)
      )
      .filter((l) => l > 0);
    const gem =
      leeftijden.length > 0 ? leeftijden.reduce((a, b) => a + b, 0) / leeftijden.length : null;
    return { id: t.id, leeftijd: gem, volgorde: t.volgorde };
  });

  metLeeftijd.sort((a, b) => {
    if (a.leeftijd !== null && b.leeftijd !== null) return b.leeftijd - a.leeftijd;
    if (a.leeftijd !== null) return -1;
    if (b.leeftijd !== null) return 1;
    return a.volgorde - b.volgorde;
  });

  const result = new Map<string, string>();
  metLeeftijd.forEach((t, i) => result.set(t.id, `J${i + 1}`));
  return result;
}

// ── Hoofdfunctie ─────────────────────────────────────────────────────────────

export async function getPubliekeTeamindelingData(): Promise<PubliekeTeamindelingData> {
  const seizoen = await getActiefSeizoen();

  const kaders = await prisma.kaders.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  if (!kaders) return { toelichting: mapToelichting(null, seizoen), teams: [] };

  // Haal publicatie-toelichting en werkindeling parallel op
  const [publicatie, werkindeling] = await Promise.all([
    prisma.teamindelingPublicatie.findUnique({
      where: { kadersId: kaders.id },
      select: {
        titel: true,
        seizoenLabel: true,
        statusBanner: true,
        tcOndertekening: true,
        toelichtingBlokken: true,
        kalenderBlokken: true,
        kennismakingBlokken: true,
        tcOproepBlokken: true,
        vragenBlokken: true,
        belangrijkeData: true,
        kennismakingData: true,
      },
    }),
    prisma.werkindeling.findFirst({
      where: { kadersId: kaders.id, verwijderdOp: null },
      select: { id: true },
    }),
  ]);

  if (!werkindeling) return { toelichting: mapToelichting(publicatie, seizoen), teams: [] };

  // Meest recente versie ophalen
  const versie = await prisma.versie.findFirst({
    where: { werkindelingId: werkindeling.id },
    orderBy: { nummer: "desc" },
    select: {
      id: true,
      selectieGroepen: {
        include: {
          spelers: { include: { speler: true } },
          staf: { include: { staf: true } },
          teams: { select: { id: true } },
        },
      },
      teams: {
        orderBy: { volgorde: "asc" },
        include: {
          spelers: { include: { speler: true } },
          staf: { include: { staf: true } },
        },
      },
    },
  });

  if (!versie) return { toelichting: mapToelichting(publicatie, seizoen), teams: [] };

  const peildatum = korfbalPeildatum(seizoen as Seizoen);
  const jNummersMap = berekenJNummersPubliek(versie.teams, peildatum);

  // Kennismakingstraining lookup uit DB — TC beheert namen, geen hardcoding
  const dbKennismaking = mapToelichting(publicatie, seizoen).kennismakingstrainingen;
  const kennismakingLookup = bouwKennismakingLookup(dbKennismaking);

  type VersieTeam = (typeof versie.teams)[number];

  // Bepaal welke teamIds bij een selectiegroep horen (nooit als losse kaart tonen)
  const selectieTeamIds = new Set<string>(
    versie.teams.filter((t: VersieTeam) => t.selectieGroepId != null).map((t: VersieTeam) => t.id)
  );

  // Lookup: selectieGroepId → lidteams
  const teamsPerSelectieGroep = new Map<string, VersieTeam[]>();
  for (const team of versie.teams) {
    if (!team.selectieGroepId) continue;
    const arr = teamsPerSelectieGroep.get(team.selectieGroepId) ?? [];
    arr.push(team);
    teamsPerSelectieGroep.set(team.selectieGroepId, arr);
  }

  const kaarten: PubliekTeam[] = [];

  // 1. Losse teams (geen selectieGroepId)
  for (const team of versie.teams) {
    if (selectieTeamIds.has(team.id)) continue;

    const dames: PubliekeSpeler[] = [];
    const heren: PubliekeSpeler[] = [];

    for (const ts of team.spelers) {
      const speler = bouwSpeler({ ...ts.speler, tussenvoegsel: null });
      if (ts.speler.geslacht === "V") dames.push(speler);
      else heren.push(speler);
    }

    kaarten.push({
      id: team.id,
      naam: team.naam,
      volgorde: team.volgorde,
      soort: "team",
      gebundeld: false,
      jNummer: jNummersMap.get(team.id) ?? null,
      dames,
      heren,
      subteams: [],
      uitkomstTeams: [],
      staf: team.staf.map((ts: VersieTeam["staf"][number]) => ({
        naam:
          ts.staf?.naam ??
          (logger.warn("publieke-presentatie: staf zonder naam", { stafId: ts.stafId }), "?"),
        rol: ts.rol ?? "",
        rolLabel: ts.rolLabel ?? null,
      })),
      kennismakingstraining: kennismakingLookup.get(normaliseerNaam(team.naam)) ?? null,
    });
  }

  // 2. Eén kaart per selectiegroep
  for (const sg of versie.selectieGroepen) {
    const groepTeams: VersieTeam[] = teamsPerSelectieGroep.get(sg.id) ?? [];
    const minVolgorde =
      groepTeams.length > 0
        ? groepTeams.reduce((m, t) => Math.min(m, t.volgorde ?? 0), Infinity)
        : 0;
    const groepNaam =
      (typeof sg.naam === "string" && sg.naam.trim()) ||
      groepTeams.map((t) => t.naam).join(" / ") ||
      "Selectie";

    if (sg.gebundeld) {
      const dames: PubliekeSpeler[] = [];
      const heren: PubliekeSpeler[] = [];

      for (const ss of sg.spelers) {
        const speler = bouwSpeler({ ...ss.speler, tussenvoegsel: null });
        if (ss.speler.geslacht === "V") dames.push(speler);
        else heren.push(speler);
      }

      const stafGezien = new Set<string>();
      const staf: PubliekeStaf[] = [];
      for (const ss of sg.staf) {
        if (stafGezien.has(ss.stafId)) continue;
        stafGezien.add(ss.stafId);
        staf.push({
          naam:
            ss.staf?.naam ??
            (logger.warn("publieke-presentatie: staf zonder naam", { stafId: ss.stafId }), "?"),
          rol: ss.rol ?? "",
          rolLabel: ss.rolLabel ?? null,
        });
      }

      kaarten.push({
        id: sg.id,
        naam: groepNaam,
        volgorde: minVolgorde,
        soort: "selectie",
        gebundeld: true,
        jNummer: null,
        dames,
        heren,
        subteams: [],
        uitkomstTeams: groepTeams.map((t) => t.naam),
        staf,
        kennismakingstraining: kennismakingLookup.get(normaliseerNaam(groepNaam)) ?? null,
      });
    } else {
      const alleDames: PubliekeSpeler[] = [];
      const alleHeren: PubliekeSpeler[] = [];
      const subteams: PubliekTeam["subteams"] = [];
      const stafGezien = new Set<string>();
      const staf: PubliekeStaf[] = [];

      for (const team of groepTeams) {
        const teamDames: PubliekeSpeler[] = [];
        const teamHeren: PubliekeSpeler[] = [];

        for (const ts of team.spelers) {
          const speler = bouwSpeler({ ...ts.speler, tussenvoegsel: null });
          if (ts.speler.geslacht === "V") teamDames.push(speler);
          else teamHeren.push(speler);
        }

        alleDames.push(...teamDames);
        alleHeren.push(...teamHeren);

        const teamStaf: PubliekeStaf[] = [];
        for (const ts of team.staf) {
          // Eerste voorkomen per stafId wint — persoon kan in meerdere subteams zitten
          if (!stafGezien.has(ts.stafId)) {
            stafGezien.add(ts.stafId);
            staf.push({
              naam:
                ts.staf?.naam ??
                (logger.warn("publieke-presentatie: staf zonder naam", { stafId: ts.stafId }), "?"),
              rol: ts.rol ?? "",
              rolLabel: ts.rolLabel ?? null,
            });
          }
          teamStaf.push({
            naam:
              ts.staf?.naam ??
              (logger.warn("publieke-presentatie: staf zonder naam", { stafId: ts.stafId }), "?"),
            rol: ts.rol ?? "",
            rolLabel: ts.rolLabel ?? null,
          });
        }

        subteams.push({
          naam: team.naam,
          jNummer: jNummersMap.get(team.id) ?? null,
          dames: teamDames,
          heren: teamHeren,
          staf: teamStaf,
        });
      }

      kaarten.push({
        id: sg.id,
        naam: groepNaam,
        volgorde: minVolgorde,
        soort: "selectie",
        gebundeld: false,
        jNummer: null,
        dames: alleDames,
        heren: alleHeren,
        subteams,
        uitkomstTeams: [],
        staf,
        kennismakingstraining: kennismakingLookup.get(normaliseerNaam(groepNaam)) ?? null,
      });
    }
  }

  kaarten.sort((a, b) => {
    if (a.volgorde !== b.volgorde) return b.volgorde - a.volgorde;
    return b.naam.localeCompare(a.naam, "nl", { numeric: true, sensitivity: "base" });
  });

  const gevuldeKaarten = kaarten.filter((k) => {
    if (k.soort === "team") return k.dames.length > 0 || k.heren.length > 0;
    if (k.gebundeld) return k.dames.length > 0 || k.heren.length > 0;
    return k.subteams.some((s) => s.dames.length > 0 || s.heren.length > 0);
  });

  return { toelichting: mapToelichting(publicatie, seizoen), teams: gevuldeKaarten };
}

const DEFAULT_INTRO_TEKST = `<p>Hier is de voorlopige teamindeling voor het seizoen 2026-2027.</p>
<p>Het samenstellen van teams is ieder jaar een uitdaging, maar samen met de trainers en coördinatoren hebben we opnieuw een goed en evenwichtig resultaat weten te bereiken.</p>
<p>Ook dit jaar zullen er weer blije verrassingen en teleurstellingen in de indelingen zijn. Korfbal blijft een teamsport en soms zijn er minder plaatsen dan er gegadigden zijn. Wij staan altijd klaar om de gemaakte keuzes toe te lichten.</p>`;

const DEFAULT_TC_TEKST = `<p>De Technische Commissie (TC) vormt het sportieve hart van de vereniging. Samen met coördinatoren, trainersbegeleiders en trainers zorgen we voor een goede doorstroming, passende teamindelingen en aandacht voor ontwikkeling en plezier op elk niveau.</p>
<p>Coördinatoren ondersteunen de TC het hele seizoen door en zijn het eerste aanspreekpunt voor trainers, spelers en ouders. Trainersbegeleiders bieden pedagogische en didactische ondersteuning, zodat trainers met vertrouwen en voldoening hun rol kunnen vervullen. Zo bouwen we met elkaar aan een sportieve en betrokken korfbalomgeving.</p>`;

function normaliseerBelangrijkeData(value: unknown): BelangrijkeDatumItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is BelangrijkeDatumItem =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).datum === "string" &&
      typeof (item as Record<string, unknown>).omschrijving === "string"
  );
}

function normaliseerKennismakingData(value: unknown): KennismakingItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is KennismakingItem =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as Record<string, unknown>).teamnaam === "string" &&
      typeof (item as Record<string, unknown>).datum === "string" &&
      typeof (item as Record<string, unknown>).tijd === "string" &&
      typeof (item as Record<string, unknown>).locatie === "string"
  );
}

function normaliseerBlokken(value: unknown, defaults: TekstBlok[]): TekstBlok[] {
  if (!Array.isArray(value) || value.length === 0) return defaults;
  const blokken = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const r = item as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.subtitle !== "string" || typeof r.tekst !== "string")
        return null;
      return {
        id: r.id,
        subtitle: r.subtitle,
        tekst: r.tekst,
        ...(typeof r.label === "string" && r.label ? { label: r.label } : {}),
      };
    })
    .filter(Boolean) as TekstBlok[];
  return blokken.length > 0 ? blokken : defaults;
}

function mapToelichting(
  p: {
    titel: string;
    seizoenLabel: string;
    statusBanner?: string | null;
    tcOndertekening?: string | null;
    toelichtingBlokken?: unknown;
    kalenderBlokken?: unknown;
    kennismakingBlokken?: unknown;
    tcOproepBlokken?: unknown;
    vragenBlokken?: unknown;
    belangrijkeData?: unknown;
    kennismakingData?: unknown;
  } | null,
  seizoen?: string
): PubliekeToelichtingData {
  return {
    titel: p?.titel ?? "Voorlopige Teamindeling 2026-2027",
    seizoenLabel: p?.seizoenLabel ?? seizoen ?? "2026-2027",
    statusBanner: p?.statusBanner ?? null,
    tcOndertekening: p?.tcOndertekening ?? null,
    toelichtingBlokken: normaliseerBlokken(
      p?.toelichtingBlokken,
      DEFAULT_BLOKKEN.toelichtingBlokken
    ),
    kalenderBlokken: normaliseerBlokken(p?.kalenderBlokken, DEFAULT_BLOKKEN.kalenderBlokken),
    kennismakingBlokken: normaliseerBlokken(
      p?.kennismakingBlokken,
      DEFAULT_BLOKKEN.kennismakingBlokken
    ),
    tcOproepBlokken: normaliseerBlokken(p?.tcOproepBlokken, DEFAULT_BLOKKEN.tcOproepBlokken),
    vragenBlokken: normaliseerBlokken(p?.vragenBlokken, DEFAULT_BLOKKEN.vragenBlokken),
    belangrijkeData: normaliseerBelangrijkeData(p?.belangrijkeData),
    kennismakingstrainingen: normaliseerKennismakingData(p?.kennismakingData),
  };
}
