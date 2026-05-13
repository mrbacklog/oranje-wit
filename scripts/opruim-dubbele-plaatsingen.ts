/**
 * Opruimscript voor spelers die per ongeluk dubbel ingedeeld zijn in
 * dezelfde versie: zowel een TeamSpeler-record als een SelectieSpeler-record,
 * of meerdere TeamSpeler-records, of meerdere SelectieSpeler-records.
 *
 * Oorzaak van de dubbelen: oude versie van `voegSelectieSpelerToe` ruimde
 * TeamSpeler-records alleen op binnen de doel-selectiegroep. Records in andere
 * teams van dezelfde versie bleven staan. Gefixt in deze patch.
 *
 * Beleid bij dubbele plaatsing (volgt invariant uit zetSpelerIndeling):
 *   - Als er een SelectieSpeler-record bestaat → dat is de "gewenste" eindplek.
 *     Alle TeamSpeler-records voor dezelfde speler+versie worden verwijderd.
 *   - Bij meerdere SelectieSpeler-records voor dezelfde speler+versie: behoud
 *     de oudste (laagste `id` lexicografisch), verwijder de rest.
 *   - Bij meerdere TeamSpeler-records (zonder SelectieSpeler): behoud de
 *     oudste, verwijder de rest. Dit is conservatief — de TC moet daarna
 *     handmatig herindelen.
 *
 * Gebruik:
 *   npx tsx -r dotenv/config scripts/opruim-dubbele-plaatsingen.ts          # dry-run (default)
 *   npx tsx -r dotenv/config scripts/opruim-dubbele-plaatsingen.ts --apply  # echt verwijderen
 *
 * Het script leest DATABASE_URL uit .env. Zet die op productie-URL voor
 * productie-opschoning:
 *   DATABASE_URL=postgresql://... npx tsx scripts/opruim-dubbele-plaatsingen.ts
 */

import "dotenv/config";
import { prisma } from "../packages/database/src/index";
import { logger } from "@oranje-wit/types";

type DubbelRapport = {
  versieId: string;
  versieNummer: number;
  seizoen: string;
  spelerId: string;
  spelerNaam: string;
  teamPlaatsingen: { teamSpelerId: string; teamId: string; teamNaam: string }[];
  selectiePlaatsingen: {
    selectieSpelerId: string;
    selectieGroepId: string;
    selectieGroepNaam: string | null;
  }[];
};

async function bouwRapport(): Promise<DubbelRapport[]> {
  // Alle versies die hangen onder een niet-verwijderde werkindeling.
  const versies = await prisma.versie.findMany({
    where: { werkindeling: { verwijderdOp: null } },
    select: {
      id: true,
      nummer: true,
      werkindeling: { select: { kaders: { select: { seizoen: true } } } },
      teams: {
        select: {
          id: true,
          naam: true,
          spelers: { select: { id: true, spelerId: true } },
        },
      },
      selectieGroepen: {
        select: {
          id: true,
          naam: true,
          spelers: { select: { id: true, spelerId: true } },
        },
      },
    },
  });

  const rapporten: DubbelRapport[] = [];

  for (const versie of versies) {
    // Bouw per speler de lijst plaatsingen
    type Acc = {
      teams: { teamSpelerId: string; teamId: string; teamNaam: string }[];
      selecties: {
        selectieSpelerId: string;
        selectieGroepId: string;
        selectieGroepNaam: string | null;
      }[];
    };
    const perSpeler = new Map<string, Acc>();

    for (const team of versie.teams) {
      for (const ts of team.spelers) {
        const acc = perSpeler.get(ts.spelerId) ?? { teams: [], selecties: [] };
        acc.teams.push({ teamSpelerId: ts.id, teamId: team.id, teamNaam: team.naam });
        perSpeler.set(ts.spelerId, acc);
      }
    }
    for (const sg of versie.selectieGroepen) {
      for (const ss of sg.spelers) {
        const acc = perSpeler.get(ss.spelerId) ?? { teams: [], selecties: [] };
        acc.selecties.push({
          selectieSpelerId: ss.id,
          selectieGroepId: sg.id,
          selectieGroepNaam: sg.naam,
        });
        perSpeler.set(ss.spelerId, acc);
      }
    }

    const dubbele = [...perSpeler.entries()].filter(
      ([, a]) => a.teams.length + a.selecties.length > 1
    );
    if (dubbele.length === 0) continue;

    const spelerIds = dubbele.map(([id]) => id);
    const spelers = await prisma.speler.findMany({
      where: { id: { in: spelerIds } },
      select: { id: true, roepnaam: true, achternaam: true },
    });
    const naamVan = new Map(spelers.map((s) => [s.id, `${s.roepnaam} ${s.achternaam}`]));

    for (const [spelerId, acc] of dubbele) {
      rapporten.push({
        versieId: versie.id,
        versieNummer: versie.nummer,
        seizoen: versie.werkindeling.kaders.seizoen,
        spelerId,
        spelerNaam: naamVan.get(spelerId) ?? spelerId,
        teamPlaatsingen: acc.teams,
        selectiePlaatsingen: acc.selecties,
      });
    }
  }

  return rapporten;
}

function bepaalOpschoning(r: DubbelRapport): {
  teamSpelerIdsTeVerwijderen: string[];
  selectieSpelerIdsTeVerwijderen: string[];
  reden: string;
} {
  if (r.selectiePlaatsingen.length >= 1) {
    // Selectie wint. Behoud oudste selectie, verwijder rest + alle team-records.
    const sorted = [...r.selectiePlaatsingen].sort((a, b) =>
      a.selectieSpelerId.localeCompare(b.selectieSpelerId)
    );
    const teVerwijderenSel = sorted.slice(1).map((s) => s.selectieSpelerId);
    return {
      teamSpelerIdsTeVerwijderen: r.teamPlaatsingen.map((t) => t.teamSpelerId),
      selectieSpelerIdsTeVerwijderen: teVerwijderenSel,
      reden: "selectie wint van team",
    };
  }
  // Alleen meerdere TeamSpeler-records — behoud oudste, verwijder rest.
  const sorted = [...r.teamPlaatsingen].sort((a, b) =>
    a.teamSpelerId.localeCompare(b.teamSpelerId)
  );
  return {
    teamSpelerIdsTeVerwijderen: sorted.slice(1).map((t) => t.teamSpelerId),
    selectieSpelerIdsTeVerwijderen: [],
    reden: "behoud oudste TeamSpeler",
  };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isLokaal = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

  logger.info(
    `Database: ${isLokaal ? "LOKAAL" : "REMOTE"} (${dbUrl.replace(/:[^:@/]+@/, ":***@")})`
  );
  logger.info(`Modus: ${apply ? "APPLY (verwijdert records)" : "DRY-RUN (alleen rapport)"}`);

  const rapporten = await bouwRapport();
  logger.info(`Spelers met dubbele plaatsing: ${rapporten.length}`);

  if (rapporten.length === 0) {
    logger.info("Geen opschoning nodig. Klaar.");
    await prisma.$disconnect();
    return;
  }

  // Groepeer per versie voor leesbaarheid
  const perVersie = new Map<string, DubbelRapport[]>();
  for (const r of rapporten) {
    const key = `${r.seizoen} v${r.versieNummer} (${r.versieId})`;
    const arr = perVersie.get(key) ?? [];
    arr.push(r);
    perVersie.set(key, arr);
  }

  let totaalTeamDelete = 0;
  let totaalSelectieDelete = 0;

  for (const [versieLabel, lijst] of perVersie) {
    logger.info(`\n=== ${versieLabel} — ${lijst.length} spelers ===`);
    for (const r of lijst) {
      const plan = bepaalOpschoning(r);
      const teams = r.teamPlaatsingen.map((t) => t.teamNaam).join(", ") || "—";
      const selecties =
        r.selectiePlaatsingen.map((s) => s.selectieGroepNaam ?? s.selectieGroepId).join(", ") ||
        "—";
      logger.info(
        `  [${r.spelerId}] ${r.spelerNaam}\n` +
          `    teams=[${teams}] selecties=[${selecties}]\n` +
          `    → ${plan.reden}: -${plan.teamSpelerIdsTeVerwijderen.length} TeamSpeler, -${plan.selectieSpelerIdsTeVerwijderen.length} SelectieSpeler`
      );
      totaalTeamDelete += plan.teamSpelerIdsTeVerwijderen.length;
      totaalSelectieDelete += plan.selectieSpelerIdsTeVerwijderen.length;

      if (apply) {
        await prisma.$transaction([
          ...(plan.teamSpelerIdsTeVerwijderen.length
            ? [
                prisma.teamSpeler.deleteMany({
                  where: { id: { in: plan.teamSpelerIdsTeVerwijderen } },
                }),
              ]
            : []),
          ...(plan.selectieSpelerIdsTeVerwijderen.length
            ? [
                prisma.selectieSpeler.deleteMany({
                  where: { id: { in: plan.selectieSpelerIdsTeVerwijderen } },
                }),
              ]
            : []),
        ]);
      }
    }
  }

  logger.info(
    `\n=== Totaal ===\n  TeamSpeler te verwijderen: ${totaalTeamDelete}\n  SelectieSpeler te verwijderen: ${totaalSelectieDelete}`
  );
  if (!apply) {
    logger.info("\nDry-run klaar. Run met --apply om daadwerkelijk op te schonen.");
  } else {
    logger.info("\nOpschoning voltooid.");
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  logger.error("Opruim mislukt:", err);
  await prisma.$disconnect();
  process.exit(1);
});
