/**
 * Monitor-specifieke seed functies: verloop, cohorten, signaleringen.
 */
import type { PrismaClient } from "@oranje-wit/database";
import { SEIZOEN_HUIDIG, TEAMS, type TeamDef } from "./dataset";

interface SpelerRecord {
  relCode: string;
  roepnaam: string;
  achternaam: string;
  geslacht: "M" | "V";
  geboortejaar: number;
  geboortedatum: Date;
  team: TeamDef;
}

export async function seedLedenverloop(prisma: PrismaClient, spelers: SpelerRecord[]) {
  for (const s of spelers) {
    if (!s.team) {
      await prisma.ledenverloop.upsert({
        where: { seizoen_relCode: { seizoen: SEIZOEN_HUIDIG, relCode: s.relCode } },
        update: {},
        create: {
          seizoen: SEIZOEN_HUIDIG,
          relCode: s.relCode,
          status: "uitgestroomd",
          geboortejaar: s.geboortejaar,
          geslacht: s.geslacht,
          teamVorig: TEAMS[0].naam,
        },
      });
    } else {
      await prisma.ledenverloop.upsert({
        where: { seizoen_relCode: { seizoen: SEIZOEN_HUIDIG, relCode: s.relCode } },
        update: {},
        create: {
          seizoen: SEIZOEN_HUIDIG,
          relCode: s.relCode,
          status: "behouden",
          geboortejaar: s.geboortejaar,
          geslacht: s.geslacht,
          teamVorig: s.team.naam,
          teamNieuw: s.team.naam,
        },
      });
    }
  }
}

export async function seedCohorten(prisma: PrismaClient, spelers: SpelerRecord[]) {
  const cohorten = new Map<
    string,
    {
      jaar: number;
      geslacht: string;
      actief: number;
      behouden: number;
      uitgestroomd: number;
    }
  >();

  for (const s of spelers) {
    const key = `${s.geboortejaar}-${s.geslacht}`;
    const existing = cohorten.get(key) ?? {
      jaar: s.geboortejaar,
      geslacht: s.geslacht,
      actief: 0,
      behouden: 0,
      uitgestroomd: 0,
    };
    if (s.team) {
      existing.actief++;
      existing.behouden++;
    } else {
      existing.uitgestroomd++;
    }
    cohorten.set(key, existing);
  }

  for (const c of cohorten.values()) {
    const leeftijd = 2025 - c.jaar;
    const band =
      leeftijd >= 18
        ? "S"
        : leeftijd >= 16
          ? "A"
          : leeftijd >= 14
            ? "B"
            : leeftijd >= 12
              ? "C"
              : "D";
    const totaal = c.actief + c.uitgestroomd;
    const retentiePct = totaal > 0 ? Math.round((c.behouden / totaal) * 100) : null;

    await prisma.cohortSeizoen.upsert({
      where: {
        geboortejaar_geslacht_seizoen: {
          geboortejaar: c.jaar,
          geslacht: c.geslacht,
          seizoen: SEIZOEN_HUIDIG,
        },
      },
      update: {},
      create: {
        geboortejaar: c.jaar,
        geslacht: c.geslacht,
        seizoen: SEIZOEN_HUIDIG,
        leeftijd,
        band,
        actief: c.actief,
        behouden: c.behouden,
        nieuw: 0,
        herinschrijver: 0,
        uitgestroomd: c.uitgestroomd,
        retentiePct,
      },
    });
  }
}

export async function seedSignaleringen(prisma: PrismaClient) {
  const signaleringen = [
    {
      type: "retentie_laag",
      ernst: "kritiek",
      leeftijdsgroep: "U15",
      geslacht: "V",
      waarde: 65,
      drempel: 70,
      streef: 85,
      beschrijving: "Retentie meisjes U15 onder drempel",
      advies: "Extra aandacht voor plezier en teamgevoel",
    },
    {
      type: "retentie_dalend",
      ernst: "aandacht",
      leeftijdsgroep: "U17",
      geslacht: null,
      waarde: 78,
      drempel: 75,
      streef: 85,
      beschrijving: "Retentie U17 dalend t.o.v. vorig seizoen",
      advies: "Monitor ontwikkeling en evalueer teamsamenstelling",
    },
    {
      type: "instroom_laag",
      ernst: "aandacht",
      leeftijdsgroep: "U15",
      geslacht: "M",
      waarde: 2,
      drempel: 3,
      streef: 5,
      beschrijving: "Lage instroom jongens U15",
      advies: "Wervingsactie plannen",
    },
    {
      type: "bezetting_goed",
      ernst: "op_koers",
      leeftijdsgroep: "senioren",
      geslacht: null,
      waarde: 46,
      drempel: 40,
      streef: 50,
      beschrijving: "Seniorenbezetting op koers",
      advies: null,
    },
  ];
  for (const s of signaleringen) {
    await prisma.signalering.create({ data: { seizoen: SEIZOEN_HUIDIG, ...s } });
  }
}
