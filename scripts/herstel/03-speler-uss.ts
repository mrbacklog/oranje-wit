/**
 * Herstel: bereken speler_uss vanuit coach-evaluaties + referentieteams.
 *
 * Logica:
 *  1. Per Speler: haal meest recente evaluatie op (seizoen 2025-2026)
 *  2. Haal teamscore op via ReferentieTeam (of A_CATEGORIE fallback)
 *  3. Bereken uss_coach via coachNaarUSS(teamscore, niveau)
 *  4. Zet uss_overall = uss_coach, betrouwbaarheid = "concept"
 *  5. Upsert in speler_uss
 *
 * Gebruik:
 *   npx tsx scripts/herstel/03-speler-uss.ts
 */

import "dotenv/config";
import { PrismaClient } from "../../packages/database/src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  coachNaarUSS,
  knkvNaarUSS,
  A_CATEGORIE_USS,
  PEILJAAR,
  HUIDIG_SEIZOEN,
  parseACatKey,
} from "@oranje-wit/types";
import type { EvaluatieScore } from "@oranje-wit/types";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SEIZOEN = "2025-2026";

function bepaalLeeftijdsgroep(geboortejaar: number | null): string {
  if (!geboortejaar) return "senior";
  const leeftijd = PEILJAAR - geboortejaar;
  if (leeftijd <= 7) return "kangoeroe";
  if (leeftijd <= 9) return "f-pupil";
  if (leeftijd <= 11) return "e-pupil";
  if (leeftijd <= 13) return "d-pupil";
  if (leeftijd <= 15) return "c-jeugd";
  if (leeftijd <= 17) return "b-jeugd";
  if (leeftijd <= 19) return "a-jeugd";
  return "senior";
}

async function bepaalTeamscore(speler: { id: string; huidig: any }): Promise<number | null> {
  const huidig = speler.huidig as any;
  if (!huidig?.team) return null;

  const refTeam = (await prisma.referentieTeam.findFirst({
    where: { naam: huidig.team, seizoen: SEIZOEN },
  })) as any;
  if (!refTeam) return null;

  // 1. Handmatig gezette teamscore
  if (refTeam.teamscore != null) return refTeam.teamscore;

  const poolVeld: string | null = refTeam.poolVeld ?? null;
  if (!poolVeld) return null;

  // 2. A-categorie selectieteams (U15/U17/U19): "U17-HK-07" → "U17-HK" → USS 160
  if (huidig.a_categorie) {
    const key = parseACatKey(poolVeld);
    if (key && A_CATEGORIE_USS[key] != null) return A_CATEGORIE_USS[key];

    if (refTeam.niveau) {
      const niveauKey =
        refTeam.niveau === "Hoofdklasse" || refTeam.niveau === "Overgangsklasse"
          ? "HK"
          : refTeam.niveau.replace(/e klasse/, "").trim();
      const fallbackKey = `${huidig.a_categorie}-${niveauKey}`;
      if (A_CATEGORIE_USS[fallbackKey] != null) return A_CATEGORIE_USS[fallbackKey];
    }
  }

  // 3. B-categorie jeugdteams: "Gr4-173", "Bl4-084", "Ro-135" → knkvRating → USS
  const bCatMatch = poolVeld.match(/-(\d+)$/);
  if (bCatMatch) {
    const knkvRating = parseInt(bCatMatch[1], 10);
    if (!isNaN(knkvRating)) return knkvNaarUSS(knkvRating);
  }

  return null;
}

async function main() {
  console.log(`\n=== Speler USS herstel (${SEIZOEN}) ===\n`);

  const spelers = await prisma.speler.findMany({
    where: { huidig: { not: null } },
    select: { id: true, huidig: true, geboortejaar: true },
  });

  console.log(`Spelers met huidig team: ${spelers.length}`);

  let bijgewerkt = 0;
  let geenEvaluatie = 0;
  let geenTeam = 0;
  let overgeslagen = 0;
  let fouten = 0;

  for (const speler of spelers) {
    // Senioren (leeftijd > 19) krijgen geen USS
    const leeftijdsgroep = bepaalLeeftijdsgroep(speler.geboortejaar);
    if (leeftijdsgroep === "senior") {
      overgeslagen++;
      continue;
    }

    try {
      // Meest recente evaluatie
      const evaluatie = await prisma.evaluatie.findFirst({
        where: { spelerId: speler.id, seizoen: SEIZOEN, type: "trainer" },
        orderBy: { ronde: "desc" },
        select: { scores: true, ronde: true },
      });

      if (!evaluatie?.scores) {
        geenEvaluatie++;
        continue;
      }

      const scores = evaluatie.scores as EvaluatieScore;
      const niveau = scores.niveau;
      if (niveau == null) {
        geenEvaluatie++;
        continue;
      }

      const teamscore = await bepaalTeamscore(speler);
      if (teamscore == null) {
        geenTeam++;
        continue;
      }

      const ussCoach = coachNaarUSS(teamscore, niveau);

      await (prisma as any).spelerUSS.upsert({
        where: { spelerId_seizoen: { spelerId: speler.id, seizoen: SEIZOEN } },
        create: {
          speler: { connect: { id: speler.id } },
          seizoen: SEIZOEN,
          leeftijdsgroep: bepaalLeeftijdsgroep(speler.geboortejaar),
          ussOverall: ussCoach,
          ussCoach: ussCoach,
          ussTeam: teamscore,
          ussBasislijn: teamscore,
          aantalCoachSessies: 1,
          betrouwbaarheid: "concept",
        },
        update: {
          ussOverall: ussCoach,
          ussCoach: ussCoach,
          ussTeam: teamscore,
          ussBasislijn: teamscore,
          aantalCoachSessies: 1,
          betrouwbaarheid: "concept",
        },
      });

      bijgewerkt++;
    } catch (error) {
      fouten++;
      console.error(`✗ ${speler.id}:`, (error as Error).message);
    }
  }

  console.log(`\nResultaat:`);
  console.log(`  ✅ Bijgewerkt:       ${bijgewerkt}`);
  console.log(`  ⏭️  Senior (skip):   ${overgeslagen}`);
  console.log(`  ⚠️  Geen evaluatie:  ${geenEvaluatie}`);
  console.log(`  ⚠️  Geen team-USS:   ${geenTeam}`);
  console.log(`  ❌ Fouten:           ${fouten}`);

  const totaal = await (prisma as any).spelerUSS.count();
  console.log(`\nTotaal in speler_uss: ${totaal}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("Fout:", err);
  process.exit(1);
});
