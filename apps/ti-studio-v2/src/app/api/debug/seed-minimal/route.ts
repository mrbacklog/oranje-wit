// apps/ti-studio-v2/src/app/api/debug/seed-minimal/route.ts
// Tijdelijk seed-endpoint voor v2-test dummy-data.
// Beveiligd door basic-auth-middleware + x-seed-secret header.
// Verwijderen zodra v2 stabiel is.

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@oranje-wit/types";
import {
  Geslacht,
  SpelerStatus,
  GezienStatus,
  SeizoenStatus,
  TeamCategorie,
  TeamType,
  Kleur,
  WerkitemType,
  WerkitemPrioriteit,
  WerkitemStatus,
  Doelgroep,
  WerkindelingStatus,
} from "@oranje-wit/database";
import { TC_DEFAULTS } from "@/lib/kader-mapping";

const SEIZOEN = "2025-2026";

// Seed-auteur voor Versie.auteur (plain string, geen FK)
const SEED_AUTEUR = "seed-minimal";

// Vaste User-id voor verplichte FK-velden (auteur op Werkitem).
// Aangemaakt als onderdeel van de seed wanneer niet aanwezig.
const SEED_USER_EMAIL = "seed@ckvoranjewit.app";

const NAMEN_M = [
  ["Daan", "Visser"],
  ["Luca", "de Vries"],
  ["Noah", "Janssen"],
  ["Lars", "Smit"],
  ["Tom", "Meijer"],
  ["Finn", "Bakker"],
  ["Bram", "Mulder"],
  ["Jesse", "Peters"],
  ["Milan", "Hendriks"],
  ["Sven", "Dekker"],
  ["Cas", "Vermeer"],
  ["Ruben", "van Dam"],
  ["Max", "Wolters"],
  ["Tim", "Brouwer"],
  ["Joep", "Linden"],
];

const NAMEN_V = [
  ["Sara", "de Boer"],
  ["Emma", "Willems"],
  ["Fleur", "Jacobs"],
  ["Lisa", "Huisman"],
  ["Anna", "Bosman"],
  ["Julia", "Kleijn"],
  ["Noor", "Kok"],
  ["Eva", "Evers"],
  ["Lotte", "Vogel"],
  ["Ines", "Steen"],
  ["Mila", "de Groot"],
  ["Zoë", "van Berg"],
  ["Sophie", "Hoek"],
  ["Roos", "Timmerman"],
  ["Amber", "Blom"],
];

const GEBOORTEJAREN = [
  2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2008, 2009, 2010, 2011, 2012,
  2013, 2014, 2015, 2016, 2017, 2018, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015,
];

export async function POST(request: NextRequest) {
  // Extra secret-check naast basic-auth middleware
  const seedSecret = request.headers.get("x-seed-secret");
  if (!seedSecret || seedSecret !== process.env.AGENT_SECRET) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const counts = {
      seizoen: 0,
      kaders: 0,
      werkindeling: 0,
      versie: 0,
      teams: 0,
      spelers: 0,
      kadersSpelers: 0,
      staf: 0,
      werkitems: 0,
      seedUser: 0,
    };

    // 1. Seed-user voor verplichte FK (auteurId op Werkitem)
    const seedUser = await db.user.upsert({
      where: { email: SEED_USER_EMAIL },
      create: { email: SEED_USER_EMAIL, naam: "Seed Script" },
      update: {},
    });
    if (seedUser) counts.seedUser = 1;

    // 2. Seizoen 2025-2026
    const seizoen = await db.seizoen.upsert({
      where: { seizoen: SEIZOEN },
      create: {
        seizoen: SEIZOEN,
        startJaar: 2025,
        eindJaar: 2026,
        startDatum: new Date("2025-08-01"),
        eindDatum: new Date("2026-06-30"),
        peildatum: new Date("2025-12-31"),
        status: SeizoenStatus.ACTIEF,
      },
      update: { status: SeizoenStatus.ACTIEF },
    });
    counts.seizoen = seizoen ? 1 : 0;

    // 3. Kaders voor 2025-2026
    let kaders = await db.kaders.findFirst({ where: { seizoen: SEIZOEN } });
    if (!kaders) {
      kaders = await db.kaders.create({
        data: {
          seizoen: SEIZOEN,
          isWerkseizoen: true,
          kaders: {
            teamtypeKaders: TC_DEFAULTS,
            versie: "1.0",
          },
          speerpunten: [
            "Doorstroom kweekvijver naar opleidingshart",
            "Behoud seniorenkader",
            "Versterken selectie U15/U17",
          ],
        },
      });
      counts.kaders = 1;
    }

    // 4. Werkindeling
    let werkindeling = await db.werkindeling.findFirst({
      where: { kadersId: kaders.id, naam: "Werkindeling 2025-2026" },
    });
    if (!werkindeling) {
      werkindeling = await db.werkindeling.create({
        data: {
          kadersId: kaders.id,
          naam: "Werkindeling 2025-2026",
          status: WerkindelingStatus.ACTIEF,
        },
      });
      counts.werkindeling = 1;
    }

    // 5. Versie 1
    let versie = await db.versie.findFirst({
      where: { werkindelingId: werkindeling.id, nummer: 1 },
    });
    if (!versie) {
      versie = await db.versie.create({
        data: {
          werkindelingId: werkindeling.id,
          nummer: 1,
          naam: "Initiële indeling",
          auteur: SEED_AUTEUR,
        },
      });
      counts.versie = 1;
    }

    // 6. 5 Teams
    const teamDefs: Array<{
      naam: string;
      kleur: Kleur;
      categorie: TeamCategorie;
      teamType: TeamType;
      volgorde: number;
    }> = [
      {
        naam: "Senioren 1",
        kleur: Kleur.ROOD,
        categorie: TeamCategorie.SENIOREN,
        teamType: TeamType.ACHTTAL,
        volgorde: 1,
      },
      {
        naam: "Senioren 2",
        kleur: Kleur.ORANJE,
        categorie: TeamCategorie.SENIOREN,
        teamType: TeamType.ACHTTAL,
        volgorde: 2,
      },
      {
        naam: "A1",
        kleur: Kleur.GEEL,
        categorie: TeamCategorie.A_CATEGORIE,
        teamType: TeamType.ACHTTAL,
        volgorde: 3,
      },
      {
        naam: "B1",
        kleur: Kleur.GROEN,
        categorie: TeamCategorie.B_CATEGORIE,
        teamType: TeamType.ACHTTAL,
        volgorde: 4,
      },
      {
        naam: "F1",
        kleur: Kleur.BLAUW,
        categorie: TeamCategorie.B_CATEGORIE,
        teamType: TeamType.VIERTAL,
        volgorde: 5,
      },
    ];

    const teams: Array<{ id: string; naam: string }> = [];
    for (const def of teamDefs) {
      let team = await db.team.findFirst({
        where: { versieId: versie.id, naam: def.naam },
      });
      if (!team) {
        team = await db.team.create({
          data: {
            versieId: versie.id,
            naam: def.naam,
            kleur: def.kleur,
            categorie: def.categorie,
            teamType: def.teamType,
            volgorde: def.volgorde,
          },
        });
        counts.teams++;
      }
      teams.push({ id: team.id, naam: team.naam });
    }

    // 7. 30 Spelers (15M + 15V)
    const spelerIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const [roepnaam, achternaam] = NAMEN_M[i];
      const spelerId = `OW-SEED-M-${String(i + 1).padStart(3, "0")}`;
      const teamNaam = teams[i % teams.length].naam;
      let speler = await db.speler.findUnique({ where: { id: spelerId } });
      if (!speler) {
        speler = await db.speler.create({
          data: {
            id: spelerId,
            roepnaam,
            achternaam,
            geboortejaar: GEBOORTEJAREN[i],
            geslacht: Geslacht.M,
            status: SpelerStatus.BESCHIKBAAR,
            huidig: { team: teamNaam, categorie: "B-8-tal" },
          },
        });
        counts.spelers++;
      }
      spelerIds.push(spelerId);
    }
    for (let i = 0; i < 15; i++) {
      const [roepnaam, achternaam] = NAMEN_V[i];
      const spelerId = `OW-SEED-V-${String(i + 1).padStart(3, "0")}`;
      const teamNaam = teams[i % teams.length].naam;
      let speler = await db.speler.findUnique({ where: { id: spelerId } });
      if (!speler) {
        speler = await db.speler.create({
          data: {
            id: spelerId,
            roepnaam,
            achternaam,
            geboortejaar: GEBOORTEJAREN[i + 15],
            geslacht: Geslacht.V,
            status: SpelerStatus.BESCHIKBAAR,
            huidig: { team: teamNaam, categorie: "B-8-tal" },
          },
        });
        counts.spelers++;
      }
      spelerIds.push(spelerId);
    }

    // 8. 15 KadersSpeler records
    const gezienStatussen: GezienStatus[] = [
      GezienStatus.GROEN,
      GezienStatus.GEEL,
      GezienStatus.ORANJE,
      GezienStatus.GROEN,
      GezienStatus.GROEN,
    ];
    for (let i = 0; i < 15; i++) {
      const spelerId = spelerIds[i];
      const bestaand = await db.kadersSpeler.findUnique({
        where: { kadersId_spelerId: { kadersId: kaders.id, spelerId } },
      });
      if (!bestaand) {
        await db.kadersSpeler.create({
          data: {
            kadersId: kaders.id,
            spelerId,
            gezienStatus: gezienStatussen[i % gezienStatussen.length],
          },
        });
        counts.kadersSpelers++;
      }
    }

    // 9. 10 Staf records
    const stafDefs = [
      { id: "STAF-001", naam: "Peter Verhoeven", rollen: ["hoofdtrainer"] },
      { id: "STAF-002", naam: "Karin de Leeuw", rollen: ["assistent"] },
      { id: "STAF-003", naam: "Marco Vos", rollen: ["coach"] },
      { id: "STAF-004", naam: "Anke Bos", rollen: ["trainer"] },
      { id: "STAF-005", naam: "Rick Stam", rollen: ["manager"] },
      { id: "STAF-006", naam: "Hilde Kort", rollen: ["trainer", "assistent"] },
      { id: "STAF-007", naam: "Joost van Dijk", rollen: ["coach"] },
      { id: "STAF-008", naam: "Sandra Pols", rollen: ["coordinator"] },
      { id: "STAF-009", naam: "Boris Maas", rollen: ["trainer"] },
      { id: "STAF-010", naam: "Vera Oud", rollen: ["assistent"] },
    ];
    for (const s of stafDefs) {
      const bestaand = await db.staf.findUnique({ where: { id: s.id } });
      if (!bestaand) {
        await db.staf.create({
          data: {
            id: s.id,
            naam: s.naam,
            rollen: s.rollen,
            actief: true,
          },
        });
        counts.staf++;
      }
    }

    // 10. 8 Werkitems type MEMO
    const werkitemDefs: Array<{
      titel: string;
      beschrijving: string;
      prioriteit: WerkitemPrioriteit;
      status: WerkitemStatus;
      doelgroep?: Doelgroep;
      spelerId?: string;
      teamId?: string;
    }> = [
      {
        titel: "Spelersgesprek plannen",
        beschrijving: "Voer gesprek over doorstroom naar senioren.",
        prioriteit: WerkitemPrioriteit.HOOG,
        status: WerkitemStatus.OPEN,
        spelerId: spelerIds[0],
      },
      {
        titel: "Trainerswissel B1 bespreken",
        beschrijving: "Huidige trainer stopt einde seizoen, opvolger zoeken.",
        prioriteit: WerkitemPrioriteit.BLOCKER,
        status: WerkitemStatus.IN_BESPREKING,
        teamId: teams[3].id,
      },
      {
        titel: "Kadersgesprek kweekvijver",
        beschrijving: "Jaarlijks overleg over doorstroom F/Groen.",
        prioriteit: WerkitemPrioriteit.MIDDEL,
        status: WerkitemStatus.OPEN,
        doelgroep: Doelgroep.KWEEKVIJVER,
      },
      {
        titel: "Evaluatie seizoensstart Senioren 1",
        beschrijving: "Eerste indrukken en aandachtspunten na trainingsopstart.",
        prioriteit: WerkitemPrioriteit.MIDDEL,
        status: WerkitemStatus.OPGELOST,
        teamId: teams[0].id,
      },
      {
        titel: "Blessure follow-up",
        beschrijving: "Voortgang revalidatie bijhouden en terugkeermoment bepalen.",
        prioriteit: WerkitemPrioriteit.HOOG,
        status: WerkitemStatus.IN_BESPREKING,
        spelerId: spelerIds[5],
      },
      {
        titel: "Doorstroomadvies opleidingshart",
        beschrijving: "Twee spelers kandidaat voor A1, bespreek met coördinator.",
        prioriteit: WerkitemPrioriteit.MIDDEL,
        status: WerkitemStatus.OPEN,
        doelgroep: Doelgroep.ONTWIKKELHART,
      },
      {
        titel: "Aandacht retentie senioren",
        beschrijving: "Signaal: 3 spelers twijfelen over volgend seizoen.",
        prioriteit: WerkitemPrioriteit.HOOG,
        status: WerkitemStatus.OPEN,
        doelgroep: Doelgroep.WEDSTRIJDSPORT,
      },
      {
        titel: "Indeling F1 controleren",
        beschrijving: "Leeftijdsbandbreedte F1 checken op KNKV-regels.",
        prioriteit: WerkitemPrioriteit.LAAG,
        status: WerkitemStatus.OPGELOST,
        teamId: teams[4].id,
      },
    ];

    for (const def of werkitemDefs) {
      const bestaand = await db.werkitem.findFirst({
        where: {
          kadersId: kaders.id,
          titel: def.titel,
        },
      });
      if (!bestaand) {
        await db.werkitem.create({
          data: {
            kadersId: kaders.id,
            titel: def.titel,
            beschrijving: def.beschrijving,
            type: WerkitemType.MEMO,
            prioriteit: def.prioriteit,
            status: def.status,
            doelgroep: def.doelgroep,
            spelerId: def.spelerId,
            teamId: def.teamId,
            auteurId: seedUser.id,
          },
        });
        counts.werkitems++;
      }
    }

    logger.info("seed-minimal voltooid:", counts);

    return NextResponse.json({ ok: true, counts });
  } catch (error) {
    logger.warn("seed-minimal fout:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
