/**
 * Context-functies voor de AI indelingsassistent.
 * Haalt data op en formatteert deze voor Claude tool-responses.
 */

import { prisma } from "@/lib/db/prisma";

const PEILJAAR = 2026;

function korfbalLeeftijd(geboortejaar: number, geboortedatum?: Date | null): number {
  if (geboortedatum) {
    const peildatum = new Date(PEILJAAR, 11, 31);
    const diff = peildatum.getTime() - geboortedatum.getTime();
    return Math.round((diff / (365.25 * 24 * 60 * 60 * 1000)) * 100) / 100;
  }
  return PEILJAAR - geboortejaar;
}

// ---------------------------------------------------------------------------
// Huidige indeling
// ---------------------------------------------------------------------------

export async function getTeamsContext(versieId: string) {
  const teams = await prisma.team.findMany({
    where: { versieId },
    include: {
      spelers: { include: { speler: true } },
      staf: { include: { staf: true } },
    },
    orderBy: { volgorde: "asc" },
  });

  return teams.map((t) => {
    const spelers = t.spelers.map((ts) => ({
      id: ts.speler.id,
      naam: `${ts.speler.roepnaam} ${ts.speler.achternaam}`,
      geboortejaar: ts.speler.geboortejaar,
      leeftijd: korfbalLeeftijd(ts.speler.geboortejaar, ts.speler.geboortedatum),
      geslacht: ts.speler.geslacht,
      status: ts.speler.status,
    }));
    const aantalM = spelers.filter((s) => s.geslacht === "M").length;
    const aantalV = spelers.filter((s) => s.geslacht === "V").length;
    const gemLeeftijd = spelers.length > 0
      ? Math.round((spelers.reduce((sum, s) => sum + s.leeftijd, 0) / spelers.length) * 100) / 100
      : null;

    return {
      id: t.id,
      naam: t.naam,
      categorie: t.categorie,
      kleur: t.kleur,
      aantalSpelers: spelers.length,
      aantalM,
      aantalV,
      gemLeeftijd,
      spelers,
      staf: t.staf.map((ts) => ({ naam: ts.staf.naam, rol: ts.rol })),
    };
  });
}

// ---------------------------------------------------------------------------
// Spelerspool (niet-ingedeelde spelers)
// ---------------------------------------------------------------------------

export async function getSpelersPoolContext(versieId: string) {
  // Alle speler-IDs die al in een team zitten
  const ingedeeld = await prisma.teamSpeler.findMany({
    where: { team: { versieId } },
    select: { spelerId: true },
  });
  const ingedeeldIds = new Set(ingedeeld.map((ts) => ts.spelerId));

  const alleSpelers = await prisma.speler.findMany({
    where: { status: { not: "GAAT_STOPPEN" } },
    select: {
      id: true, roepnaam: true, achternaam: true,
      geboortejaar: true, geboortedatum: true, geslacht: true, status: true,
      huidig: true,
    },
    orderBy: [{ geboortejaar: "asc" }, { achternaam: "asc" }],
  });

  return alleSpelers
    .filter((s) => !ingedeeldIds.has(s.id))
    .map((s) => {
      const huidig = s.huidig as { team?: string; kleur?: string } | null;
      return {
        id: s.id,
        naam: `${s.roepnaam} ${s.achternaam}`,
        geboortejaar: s.geboortejaar,
        leeftijd: korfbalLeeftijd(s.geboortejaar, s.geboortedatum),
        geslacht: s.geslacht,
        status: s.status,
        huidigTeam: huidig?.team ?? null,
        huidigKleur: huidig?.kleur ?? null,
      };
    });
}

// ---------------------------------------------------------------------------
// Speler details
// ---------------------------------------------------------------------------

export async function getSpelerDetails(spelerId: string) {
  const speler = await prisma.speler.findUnique({
    where: { id: spelerId },
    include: {
      evaluaties: { orderBy: { seizoen: "desc" }, take: 3 },
    },
  });
  if (!speler) return null;

  const retentie = speler.retentie as { risico?: string; kans_behoud?: number; factoren?: string[] } | null;
  const teamgenoten = speler.teamgenotenHistorie as { speler_id: string; naam: string; seizoenen_samen: number }[] | null;
  const spelerspad = speler.spelerspad as { seizoen: string; team: string; kleur?: string }[] | null;
  const volgendSeizoen = speler.volgendSeizoen as { leeftijd?: number; opmerking?: string } | null;

  return {
    id: speler.id,
    naam: `${speler.roepnaam} ${speler.achternaam}`,
    geboortejaar: speler.geboortejaar,
    leeftijd: korfbalLeeftijd(speler.geboortejaar, speler.geboortedatum),
    geslacht: speler.geslacht,
    status: speler.status,
    lidSinds: speler.lidSinds,
    seizoenenActief: speler.seizoenenActief,
    notitie: speler.notitie,
    retentie: retentie ? {
      risico: retentie.risico ?? "onbekend",
      kansBehoud: retentie.kans_behoud ?? null,
      factoren: retentie.factoren ?? [],
    } : null,
    spelerspad: spelerspad?.slice(0, 5) ?? [],
    teamgenoten: teamgenoten?.slice(0, 10) ?? [],
    volgendSeizoen,
    evaluaties: speler.evaluaties.map((e) => ({
      seizoen: e.seizoen,
      scores: e.scores,
      opmerking: e.opmerking,
      coach: e.coach,
    })),
  };
}

// ---------------------------------------------------------------------------
// Voorgaande indeling
// ---------------------------------------------------------------------------

export async function getVoorgaandeIndeling(seizoen: string) {
  const rows = await prisma.$queryRaw<{
    rel_code: string;
    team: string;
    geslacht: string;
  }[]>`
    SELECT ss.rel_code, ss.team, ss.geslacht
    FROM speler_seizoenen ss
    WHERE ss.seizoen = ${seizoen}
    ORDER BY ss.team, ss.rel_code
  `;

  // Groepeer per team
  const teamsMap = new Map<string, { relCode: string; geslacht: string }[]>();
  for (const r of rows) {
    if (!teamsMap.has(r.team)) teamsMap.set(r.team, []);
    teamsMap.get(r.team)!.push({ relCode: r.rel_code, geslacht: r.geslacht });
  }

  // Enriche met namen
  const relCodes = rows.map((r) => r.rel_code);
  const spelers = await prisma.speler.findMany({
    where: { id: { in: relCodes } },
    select: { id: true, roepnaam: true, achternaam: true, geboortejaar: true },
  });
  const spelerMap = new Map(spelers.map((s) => [s.id, s]));

  const result: { team: string; spelers: { naam: string; geboortejaar: number; geslacht: string }[] }[] = [];
  for (const [team, leden] of teamsMap) {
    result.push({
      team,
      spelers: leden.map((l) => {
        const s = spelerMap.get(l.relCode);
        return {
          naam: s ? `${s.roepnaam} ${s.achternaam}` : l.relCode,
          geboortejaar: s?.geboortejaar ?? 0,
          geslacht: l.geslacht,
        };
      }),
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Teamsterktes (competitiestanden)
// ---------------------------------------------------------------------------

export async function getTeamsterktes(seizoen: string) {
  const standen = await prisma.poolStand.findMany({
    where: { seizoen },
    include: {
      regels: { orderBy: { positie: "asc" } },
    },
    orderBy: [{ periode: "asc" }, { pool: "asc" }],
  });

  // Filter alleen pools waar OW in speelt
  return standen
    .filter((s) => s.regels.some((r) => r.isOW))
    .map((s) => ({
      pool: s.pool,
      niveau: s.niveau,
      periode: s.periode,
      standDatum: s.standDatum?.toISOString().slice(0, 10) ?? null,
      regels: s.regels.map((r) => ({
        positie: r.positie,
        team: r.teamNaam,
        isOW: r.isOW,
        gespeeld: r.gespeeld,
        gewonnen: r.gewonnen,
        gelijk: r.gelijk,
        verloren: r.verloren,
        punten: r.punten,
        voor: r.doelpuntenVoor,
        tegen: r.doelpuntenTegen,
      })),
    }));
}

// ---------------------------------------------------------------------------
// Evaluaties
// ---------------------------------------------------------------------------

export async function getEvaluaties(spelerIds: string[]) {
  const evaluaties = await prisma.evaluatie.findMany({
    where: { spelerId: { in: spelerIds } },
    include: { speler: { select: { roepnaam: true, achternaam: true } } },
    orderBy: [{ seizoen: "desc" }],
  });

  return evaluaties.map((e) => ({
    spelerId: e.spelerId,
    spelerNaam: `${e.speler.roepnaam} ${e.speler.achternaam}`,
    seizoen: e.seizoen,
    scores: e.scores,
    opmerking: e.opmerking,
    coach: e.coach,
  }));
}

// ---------------------------------------------------------------------------
// Blauwdruk kaders
// ---------------------------------------------------------------------------

export async function getBlauwdrukKaders(scenarioId: string) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: {
      concept: {
        select: {
          blauwdruk: {
            select: { kaders: true, speerpunten: true, toelichting: true },
          },
        },
      },
    },
  });

  return {
    kaders: scenario?.concept.blauwdruk.kaders ?? {},
    speerpunten: scenario?.concept.blauwdruk.speerpunten ?? [],
    toelichting: scenario?.concept.blauwdruk.toelichting ?? null,
  };
}

// ---------------------------------------------------------------------------
// Pins
// ---------------------------------------------------------------------------

export async function getPins(scenarioId: string) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: { concept: { select: { blauwdrukId: true } } },
  });
  if (!scenario) return [];

  const pins = await prisma.pin.findMany({
    where: { blauwdrukId: scenario.concept.blauwdrukId },
    include: {
      speler: { select: { roepnaam: true, achternaam: true } },
      staf: { select: { naam: true } },
    },
  });

  return pins.map((p) => ({
    type: p.type,
    waarde: p.waarde,
    notitie: p.notitie,
    speler: p.speler ? `${p.speler.roepnaam} ${p.speler.achternaam}` : null,
    staf: p.staf?.naam ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Retentie-overzicht
// ---------------------------------------------------------------------------

export async function getRetentieOverzicht() {
  const spelers = await prisma.speler.findMany({
    where: { status: { not: "GAAT_STOPPEN" } },
    select: {
      id: true, roepnaam: true, achternaam: true,
      geboortejaar: true, geslacht: true, retentie: true, status: true,
    },
  });

  return spelers
    .map((s) => {
      const retentie = s.retentie as { risico?: string; kans_behoud?: number; factoren?: string[] } | null;
      if (!retentie?.risico) return null;
      return {
        id: s.id,
        naam: `${s.roepnaam} ${s.achternaam}`,
        leeftijd: PEILJAAR - s.geboortejaar,
        geslacht: s.geslacht,
        status: s.status,
        risico: retentie.risico,
        kansBehoud: retentie.kans_behoud ?? null,
        factoren: retentie.factoren ?? [],
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => (a.kansBehoud ?? 1) - (b.kansBehoud ?? 1));
}

// ---------------------------------------------------------------------------
// Teamgenoten-historie
// ---------------------------------------------------------------------------

export async function getTeamgenoten(spelerId: string) {
  const speler = await prisma.speler.findUnique({
    where: { id: spelerId },
    select: { teamgenotenHistorie: true },
  });

  const historie = speler?.teamgenotenHistorie as { speler_id: string; naam: string; seizoenen_samen: number }[] | null;
  return (historie ?? []).sort((a, b) => b.seizoenen_samen - a.seizoenen_samen);
}
