"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger } from "@oranje-wit/types";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { valideerWhatIfVoorToepassen } from "./whatif-validatie-actions";

// ============================================================
// WHAT-IF TOEPASSEN & VERWERPEN
// ============================================================

/**
 * Pas what-if toe op werkindeling (merge).
 *
 * 1. Draai validatie (pin-schendingen, KNKV-regels, blauwdruk-kaders)
 * 2. Blokkeer bij harde fouten (ROOD)
 * 3. Blokkeer bij afwijkingen zonder toelichting
 * 4. Verifieer dat what-if OPEN of BESLISBAAR is
 * 5. Stale-check: vergelijk basisVersieNummer met huidige versie
 * 6. Maak een nieuwe versie op de werkindeling
 * 7. Kopieer ongeraakte teams naar de nieuwe versie
 * 8. Kopieer what-if teams als vervanging/toevoeging
 * 9. Log afwijkingen als BlauwdrukBesluit
 * 10. Zet what-if op TOEGEPAST
 */
export async function pasWhatIfToe(whatIfId: string, toelichtingAfwijking?: string): Promise<void> {
  // --- Validatie vóór de merge ---
  const validatie = await valideerWhatIfVoorToepassen(whatIfId);

  if (validatie.heeftHardefouten) {
    const fouten = [
      ...validatie.pinSchendingen.map((p) => p.beschrijving),
      ...validatie.crossTeamMeldingen.filter((m) => m.ernst === "kritiek").map((m) => m.bericht),
      ...Object.values(validatie.teamValidaties)
        .flatMap((v) => v.meldingen)
        .filter((m) => m.ernst === "kritiek")
        .map((m) => m.bericht),
    ];
    throw new Error(`What-if kan niet worden toegepast — harde fouten:\n${fouten.join("\n")}`);
  }

  if (validatie.heeftAfwijkingen && !toelichtingAfwijking) {
    const afwijkingen = validatie.kaderAfwijkingen.map(
      (a) =>
        `${a.categorie}: verwacht ${a.verwachtAantal}, werkelijk ${a.werkelijkAantal} (${a.verschil > 0 ? "+" : ""}${a.verschil})`
    );
    throw new Error(
      `What-if wijkt af van blauwdruk-kaders. Geef een toelichting mee:\n${afwijkingen.join("\n")}`
    );
  }
  // --- Einde validatie ---

  const whatIf = await prisma.whatIf.findUniqueOrThrow({
    where: { id: whatIfId },
    select: {
      id: true,
      status: true,
      werkindelingId: true,
      basisVersieNummer: true,
      vraag: true,
      teams: {
        select: {
          id: true,
          bronTeamId: true,
          naam: true,
          categorie: true,
          kleur: true,
          teamType: true,
          niveau: true,
          volgorde: true,
          spelers: {
            select: { spelerId: true, statusOverride: true, notitie: true },
          },
          staf: {
            select: { stafId: true, rol: true },
          },
        },
      },
    },
  });

  if (whatIf.status !== "OPEN" && whatIf.status !== "BESLISBAAR") {
    throw new Error(`What-if heeft status "${whatIf.status}", kan niet worden toegepast`);
  }

  const werkindeling = await prisma.werkindeling.findUniqueOrThrow({
    where: { id: whatIf.werkindelingId },
    select: {
      id: true,
      kaders: { select: { id: true } },
      versies: {
        orderBy: { nummer: "desc" as const },
        take: 1,
        select: {
          id: true,
          nummer: true,
          teams: {
            select: {
              id: true,
              naam: true,
              categorie: true,
              kleur: true,
              teamType: true,
              niveau: true,
              volgorde: true,
              selectieGroepId: true,
              spelers: {
                select: { spelerId: true, statusOverride: true, notitie: true },
              },
              staf: {
                select: { stafId: true, rol: true },
              },
            },
          },
        },
      },
    },
  });

  const huidigeVersie = werkindeling.versies[0];
  if (!huidigeVersie) {
    throw new Error("Werkindeling heeft geen versie");
  }

  // Stale-check (waarschuwing, geen blokkade in fase 2)
  if (whatIf.basisVersieNummer < huidigeVersie.nummer) {
    logger.warn(
      `What-if ${whatIfId} is gebaseerd op versie ${whatIf.basisVersieNummer}, ` +
        `huidige versie is ${huidigeVersie.nummer}. Toepassing gaat door.`
    );
  }

  const overschrevenTeamIds = new Set(
    whatIf.teams.filter((t: any) => t.bronTeamId !== null).map((t: any) => t.bronTeamId)
  );

  await prisma.$transaction(async (tx: any) => {
    // 1. Maak nieuwe versie
    const nieuweVersie = await tx.versie.create({
      data: {
        werkindelingId: whatIf.werkindelingId,
        nummer: huidigeVersie.nummer + 1,
        naam: `What-if toegepast: "${whatIf.vraag}"`,
        auteur: "systeem",
      },
    });

    // 2. Kopieer ongeraakte teams
    for (const team of huidigeVersie.teams) {
      if (overschrevenTeamIds.has(team.id)) continue;
      await kopieerTeamNaarVersie(tx, nieuweVersie.id, team);
    }

    // 3. Kopieer what-if teams
    for (const wiTeam of whatIf.teams) {
      await kopieerTeamNaarVersie(tx, nieuweVersie.id, wiTeam);
    }

    // 4. Zet what-if op TOEGEPAST
    await tx.whatIf.update({
      where: { id: whatIfId },
      data: {
        status: "TOEGEPAST",
        toegepastOp: new Date(),
        toelichtingAfwijking: toelichtingAfwijking ?? null,
      },
    });

    // 5. Log afwijkingen als BlauwdrukBesluit (als er afwijkingen waren)
    if (validatie.heeftAfwijkingen && toelichtingAfwijking) {
      const kadersId = werkindeling.kaders?.id;
      if (kadersId) {
        const session = await requireTC();
        const user = await tx.user.upsert({
          where: { email: session.user!.email! },
          create: {
            email: session.user!.email!,
            naam: session.user!.name ?? session.user!.email!,
            rol: "EDITOR",
          },
          update: {},
          select: { id: true },
        });

        const afwijkingTekst = validatie.kaderAfwijkingen
          .map(
            (a) => `${a.categorie}: verwacht ${a.verwachtAantal}, werkelijk ${a.werkelijkAantal}`
          )
          .join("; ");

        await tx.kadersBesluit.create({
          data: {
            kadersId,
            vraag: `What-if "${whatIf.vraag}" wijkt af van blauwdruk-kaders: ${afwijkingTekst}`,
            antwoord: toelichtingAfwijking,
            toelichting: `Afwijking geaccepteerd bij toepassen what-if ${whatIfId}`,
            status: "BEANTWOORD",
            auteurId: user.id,
          },
        });
      }
    }
  });

  logger.info(`What-if "${whatIf.vraag}" (${whatIfId}) toegepast op werkindeling`);
}

/**
 * Verwerp een what-if. Data blijft bewaard voor historie.
 */
export async function verwerpWhatIf(whatIfId: string): Promise<void> {
  const whatIf = await prisma.whatIf.findUniqueOrThrow({
    where: { id: whatIfId },
    select: { id: true, status: true, vraag: true },
  });

  if (whatIf.status === "TOEGEPAST") {
    throw new Error("What-if is al toegepast en kan niet verworpen worden");
  }
  if (whatIf.status === "VERWORPEN") {
    throw new Error("What-if is al verworpen");
  }

  await prisma.whatIf.update({
    where: { id: whatIfId },
    data: {
      status: "VERWORPEN",
      verworpenOp: new Date(),
    },
  });

  logger.info(`What-if "${whatIf.vraag}" (${whatIfId}) verworpen`);
}

// ============================================================
// HELPERS
// ============================================================

async function kopieerTeamNaarVersie(
  tx: any,
  versieId: string,
  team: {
    naam: string;
    categorie: any;
    kleur: any;
    teamType?: any;
    niveau?: string | null;
    volgorde: number;
    selectieGroepId?: string | null;
    spelers: { spelerId: string; statusOverride?: any; notitie?: string | null }[];
    staf: { stafId: string; rol?: string | null }[];
  }
): Promise<void> {
  await tx.team.create({
    data: {
      versieId,
      naam: team.naam,
      categorie: team.categorie,
      kleur: team.kleur,
      teamType: team.teamType ?? null,
      niveau: team.niveau ?? null,
      volgorde: team.volgorde,
      selectieGroepId: team.selectieGroepId ?? null,
      spelers: {
        create: team.spelers.map((s: any) => ({
          spelerId: s.spelerId,
          statusOverride: s.statusOverride ?? null,
          notitie: s.notitie ?? null,
        })),
      },
      staf: {
        create: team.staf.map((s: any) => ({
          stafId: s.stafId,
          rol: s.rol ?? null,
        })),
      },
    },
  });
}
