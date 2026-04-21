"use server";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { logger, type ActionResult } from "@oranje-wit/types";
import { Prisma } from "@oranje-wit/database";
import { requireTC } from "@/lib/teamindeling/auth-check";
import { revalidatePath } from "next/cache";
import { valideerWhatIfVoorToepassen } from "./whatif-validatie-actions";

// ============================================================
// WHAT-IF TOEPASSEN & VERWERPEN
// ============================================================

type HuidigeVersieTeam = {
  id: string;
  naam: string;
  alias?: string | null;
  categorie: Prisma.TeamCreateInput["categorie"];
  kleur: Prisma.TeamCreateInput["kleur"];
  teamType?: Prisma.TeamCreateInput["teamType"];
  niveau?: string | null;
  volgorde: number;
  selectieGroepId: string | null;
  spelers: {
    spelerId: string;
    statusOverride: Prisma.TeamSpelerCreateInput["statusOverride"];
    notitie: string | null;
  }[];
  staf: { stafId: string; rol: string | null }[];
};

type WhatIfTeamData = {
  id: string;
  bronTeamId: string | null;
  naam: string;
  categorie: Prisma.TeamCreateInput["categorie"];
  kleur: Prisma.TeamCreateInput["kleur"];
  teamType?: Prisma.TeamCreateInput["teamType"];
  niveau: string | null;
  volgorde: number;
  spelers: {
    spelerId: string;
    statusOverride: Prisma.TeamSpelerCreateInput["statusOverride"];
    notitie: string | null;
  }[];
  staf: { stafId: string; rol: string | null }[];
};

/**
 * Pas what-if toe op werkindeling (merge).
 *
 * 1. Draai validatie (KNKV-regels, blauwdruk-kaders)
 * 2. Blokkeer bij harde fouten (ROOD)
 * 3. Blokkeer bij afwijkingen zonder toelichting
 * 4. Verifieer dat what-if OPEN of BESLISBAAR is
 * 5. Stale-check: vergelijk basisVersieNummer met huidige versie
 * 6. Maak een nieuwe versie op de werkindeling
 * 7. Kopieer ongeraakte teams (met hun selectie-bundel) naar de nieuwe versie
 * 8. Kopieer what-if teams als vervanging/toevoeging
 * 9. Voorkom duplicate-spelers door drift tussen werkversie en what-if
 * 10. Neem canvas-posities 1-op-1 over (overschreven teams erven positie van bron-team)
 * 11. Log afwijkingen als KadersBesluit
 * 12. Zet what-if op TOEGEPAST
 */
export async function pasWhatIfToe(
  whatIfId: string,
  toelichtingAfwijking?: string
): Promise<ActionResult<{ nieuweVersieId: string; nieuweVersieNummer: number }>> {
  try {
    const session = await requireTC();

    // --- Validatie vóór de merge ---
    const validatie = await valideerWhatIfVoorToepassen(whatIfId);

    if (validatie.heeftHardefouten) {
      const fouten = [
        ...validatie.crossTeamMeldingen.filter((m) => m.ernst === "kritiek").map((m) => m.bericht),
        ...Object.values(validatie.teamValidaties)
          .flatMap((v) => v.meldingen)
          .filter((m) => m.ernst === "kritiek")
          .map((m) => m.bericht),
      ];
      return {
        ok: false,
        error: `What-if kan niet worden toegepast — harde fouten:\n${fouten.join("\n")}`,
      };
    }

    if (validatie.heeftAfwijkingen && !toelichtingAfwijking?.trim()) {
      const afwijkingen = validatie.kaderAfwijkingen.map(
        (a) =>
          `${a.categorie}: verwacht ${a.verwachtAantal}, werkelijk ${a.werkelijkAantal} (${a.verschil > 0 ? "+" : ""}${a.verschil})`
      );
      return {
        ok: false,
        error: `What-if wijkt af van blauwdruk-kaders. Geef een toelichting mee:\n${afwijkingen.join("\n")}`,
      };
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
      return {
        ok: false,
        error: `What-if heeft status "${whatIf.status}", kan niet worden toegepast`,
      };
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
            posities: true,
            teams: {
              select: {
                id: true,
                naam: true,
                alias: true,
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
            selectieGroepen: {
              select: {
                id: true,
                naam: true,
                gebundeld: true,
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
      return { ok: false, error: "Werkindeling heeft geen versie" };
    }

    if (whatIf.basisVersieNummer < huidigeVersie.nummer) {
      logger.warn(
        `What-if ${whatIfId} is gebaseerd op versie ${whatIf.basisVersieNummer}, ` +
          `huidige versie is ${huidigeVersie.nummer}. Toepassing gaat door.`
      );
    }

    const huidigeTeams = huidigeVersie.teams as HuidigeVersieTeam[];
    const whatIfTeams = whatIf.teams as WhatIfTeamData[];

    const overschrevenTeamIds = new Set(
      whatIfTeams.filter((t) => t.bronTeamId !== null).map((t) => t.bronTeamId as string)
    );

    // Drift-detectie: alle spelers die in what-if-teams voorkomen winnen daar;
    // sla ze over in ongeraakte team-kopieën om duplicaten te voorkomen.
    const spelersInWhatIf = new Set<string>();
    for (const t of whatIfTeams) {
      for (const s of t.spelers) spelersInWhatIf.add(s.spelerId);
    }
    const stafInWhatIf = new Set<string>();
    for (const t of whatIfTeams) {
      for (const s of t.staf) stafInWhatIf.add(s.stafId);
    }

    const driftVerplaatsingen: { spelerId: string; vanTeamNaam: string }[] = [];
    for (const team of huidigeTeams) {
      if (overschrevenTeamIds.has(team.id)) continue;
      for (const s of team.spelers) {
        if (spelersInWhatIf.has(s.spelerId)) {
          driftVerplaatsingen.push({ spelerId: s.spelerId, vanTeamNaam: team.naam });
        }
      }
    }
    if (driftVerplaatsingen.length > 0) {
      logger.info(
        `What-if ${whatIfId} promotie: ${driftVerplaatsingen.length} spelers verplaatst uit ongeraakte teams om duplicaten te voorkomen`
      );
    }

    // Bepaal welke selectiegroepen meegenomen moeten worden:
    // alle groepen die ten minste één ongeraakt team bevatten.
    const ongeraakteTeams = huidigeTeams.filter((t) => !overschrevenTeamIds.has(t.id));
    const actieveSelectieGroepIds = new Set<string>();
    for (const t of ongeraakteTeams) {
      if (t.selectieGroepId) actieveSelectieGroepIds.add(t.selectieGroepId);
    }

    const teamIdMap = new Map<string, string>(); // oudTeamId → nieuwTeamId

    // De prisma-wrapper (apps/ti-studio/src/lib/teamindeling/db/prisma.ts) cast
    // $transaction naar een any-gebaseerde signature om de Prisma 7 recursielimiet
    // (TS2321) te vermijden. We typen `tx` daarom als `any` op aanroep-niveau en
    // casten intern naar Prisma.TransactionClient waar type-veiligheid nuttig is.
    const resultaat: { nieuweVersieId: string; nieuweVersieNummer: number } =
      await prisma.$transaction(async (txRaw: unknown) => {
        const tx = txRaw as Prisma.TransactionClient;
        // 1. Maak nieuwe versie (posities vullen we na team-copy bij)
        const nieuweVersie = await tx.versie.create({
          data: {
            werkindelingId: whatIf.werkindelingId,
            nummer: huidigeVersie.nummer + 1,
            naam: `What-if toegepast: "${whatIf.vraag}"`,
            auteur: "systeem",
          },
        });

        // 2. Kopieer SelectieGroepen (ontdubbeld) en bouw selectieGroepId-map
        const selectieGroepIdMap = new Map<string, string>(); // oudId → nieuwId
        for (const groep of huidigeVersie.selectieGroepen) {
          if (!actieveSelectieGroepIds.has(groep.id)) continue;

          const nieuweGroep = await tx.selectieGroep.create({
            data: {
              versieId: nieuweVersie.id,
              naam: groep.naam,
              gebundeld: groep.gebundeld,
            },
          });
          selectieGroepIdMap.set(groep.id, nieuweGroep.id);

          if (groep.gebundeld) {
            // Gebundelde pools gebruiken SelectieSpeler/SelectieStaf.
            // Geen drift-merge hier: spelers die in what-if-teams verschijnen worden
            // uit de pool gehaald (they zitten daar straks in een overschreven team,
            // óf blijven in een ongeraakt team dat in de what-if vervangen wordt —
            // in dat laatste geval zijn bron-teams sowieso uit de pool verhuisd).
            for (const s of groep.spelers) {
              if (spelersInWhatIf.has(s.spelerId)) continue;
              await tx.selectieSpeler.create({
                data: {
                  selectieGroepId: nieuweGroep.id,
                  spelerId: s.spelerId,
                  statusOverride: s.statusOverride,
                  notitie: s.notitie,
                },
              });
            }
            for (const s of groep.staf) {
              if (stafInWhatIf.has(s.stafId)) continue;
              await tx.selectieStaf.create({
                data: {
                  selectieGroepId: nieuweGroep.id,
                  stafId: s.stafId,
                  rol: s.rol,
                },
              });
            }
          }
        }

        // 3. Kopieer ongeraakte teams (met drift-merge)
        for (const team of ongeraakteTeams) {
          const nieuwTeamId = await kopieerTeamNaarVersie(tx, nieuweVersie.id, {
            naam: team.naam,
            alias: team.alias ?? null,
            categorie: team.categorie,
            kleur: team.kleur,
            teamType: team.teamType ?? null,
            niveau: team.niveau ?? null,
            volgorde: team.volgorde,
            selectieGroepId: team.selectieGroepId
              ? (selectieGroepIdMap.get(team.selectieGroepId) ?? null)
              : null,
            spelers: team.spelers.filter((s) => !spelersInWhatIf.has(s.spelerId)),
            staf: team.staf.filter((s) => !stafInWhatIf.has(s.stafId)),
          });
          teamIdMap.set(team.id, nieuwTeamId);
        }

        // 4. Kopieer what-if teams (als nieuw of als vervanging)
        for (const wiTeam of whatIfTeams) {
          const nieuwTeamId = await kopieerTeamNaarVersie(tx, nieuweVersie.id, {
            naam: wiTeam.naam,
            alias: null,
            categorie: wiTeam.categorie,
            kleur: wiTeam.kleur,
            teamType: wiTeam.teamType ?? null,
            niveau: wiTeam.niveau,
            volgorde: wiTeam.volgorde,
            selectieGroepId: null,
            spelers: wiTeam.spelers,
            staf: wiTeam.staf,
          });
          if (wiTeam.bronTeamId) {
            teamIdMap.set(wiTeam.bronTeamId, nieuwTeamId);
          }
        }

        // 5. Remap canvas-posities naar nieuwe team-ID's
        const oudePosities = (huidigeVersie.posities ?? {}) as Record<
          string,
          { x: number; y: number }
        >;
        const nieuwePosities: Record<string, { x: number; y: number }> = {};
        for (const [oudTeamId, pos] of Object.entries(oudePosities)) {
          const nieuwTeamId = teamIdMap.get(oudTeamId);
          if (nieuwTeamId) {
            nieuwePosities[nieuwTeamId] = pos;
          }
        }
        if (Object.keys(nieuwePosities).length > 0) {
          await tx.versie.update({
            where: { id: nieuweVersie.id },
            data: { posities: nieuwePosities },
          });
        }

        // 6. Zet what-if op TOEGEPAST
        await tx.whatIf.update({
          where: { id: whatIfId },
          data: {
            status: "TOEGEPAST",
            toegepastOp: new Date(),
            toelichtingAfwijking: toelichtingAfwijking ?? null,
          },
        });

        // 7. Log afwijkingen als KadersBesluit (als er afwijkingen waren)
        if (validatie.heeftAfwijkingen && toelichtingAfwijking) {
          const kadersId = werkindeling.kaders?.id;
          if (kadersId && session.user?.email) {
            const user = await tx.user.upsert({
              where: { email: session.user.email },
              create: {
                email: session.user.email,
                naam: session.user.name ?? session.user.email,
                rol: "EDITOR",
              },
              update: {},
              select: { id: true },
            });

            const afwijkingTekst = validatie.kaderAfwijkingen
              .map(
                (a) =>
                  `${a.categorie}: verwacht ${a.verwachtAantal}, werkelijk ${a.werkelijkAantal}`
              )
              .join("; ");

            await tx.kadersBesluit.create({
              data: {
                kadersId,
                vraag: `What-if "${whatIf.vraag}" wijkt af van blauwdruk-kaders: ${afwijkingTekst}`,
                antwoord: toelichtingAfwijking,
                toelichting: `Afwijking geaccepteerd bij toepassen what-if ${whatIfId}`,
                status: "DEFINITIEF",
                auteurId: user.id,
              },
            });
          }
        }

        return { nieuweVersieId: nieuweVersie.id, nieuweVersieNummer: nieuweVersie.nummer };
      });

    logger.info(`What-if "${whatIf.vraag}" (${whatIfId}) toegepast op werkindeling`);

    revalidatePath("/indeling");

    return { ok: true, data: resultaat };
  } catch (error) {
    logger.error("pasWhatIfToe fout:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Verwerp een what-if. Data blijft bewaard voor historie.
 */
export async function verwerpWhatIf(whatIfId: string): Promise<ActionResult<{ whatIfId: string }>> {
  try {
    await requireTC();
    const whatIf = await prisma.whatIf.findUniqueOrThrow({
      where: { id: whatIfId },
      select: { id: true, status: true, vraag: true },
    });

    if (whatIf.status === "TOEGEPAST") {
      return {
        ok: false,
        error: "What-if is al toegepast en kan niet verworpen worden",
      };
    }
    if (whatIf.status === "VERWORPEN") {
      return { ok: false, error: "What-if is al verworpen" };
    }

    await prisma.whatIf.update({
      where: { id: whatIfId },
      data: {
        status: "VERWORPEN",
        verworpenOp: new Date(),
      },
    });

    logger.info(`What-if "${whatIf.vraag}" (${whatIfId}) verworpen`);

    revalidatePath("/indeling");

    return { ok: true, data: { whatIfId } };
  } catch (error) {
    logger.error("verwerpWhatIf fout:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================
// HELPERS
// ============================================================

type TeamKopieData = {
  naam: string;
  alias: string | null;
  categorie: HuidigeVersieTeam["categorie"];
  kleur: HuidigeVersieTeam["kleur"];
  teamType: HuidigeVersieTeam["teamType"] | null;
  niveau: string | null;
  volgorde: number;
  selectieGroepId: string | null;
  spelers: {
    spelerId: string;
    statusOverride: Prisma.TeamSpelerCreateInput["statusOverride"];
    notitie: string | null;
  }[];
  staf: { stafId: string; rol: string | null }[];
};

async function kopieerTeamNaarVersie(
  tx: Prisma.TransactionClient,
  versieId: string,
  team: TeamKopieData
): Promise<string> {
  const created = await tx.team.create({
    data: {
      versieId,
      naam: team.naam,
      alias: team.alias,
      categorie: team.categorie,
      kleur: team.kleur,
      teamType: team.teamType ?? null,
      niveau: team.niveau,
      volgorde: team.volgorde,
      selectieGroepId: team.selectieGroepId,
      spelers: {
        create: team.spelers.map((s) => ({
          spelerId: s.spelerId,
          statusOverride: s.statusOverride ?? null,
          notitie: s.notitie ?? null,
        })),
      },
      staf: {
        create: team.staf.map((s) => ({
          stafId: s.stafId,
          rol: s.rol ?? "",
        })),
      },
    },
    select: { id: true },
  });
  return created.id;
}
