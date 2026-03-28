import "dotenv/config";
import { prisma as p } from "../packages/database/src/index";

async function main() {
  const [dl, tl, dc, tc, dscout, dteams] = await Promise.all([
    p.lid.count({ where: { relCode: { startsWith: "TSTN" } } }),
    p.lid.count(),
    p.competitieSpeler.count({ where: { relCode: { startsWith: "TSTN" } } }),
    p.competitieSpeler.count(),
    p.scout.count({ where: { email: { contains: "demo" } } }).catch(() => 0),
    p.oWTeam.count({ where: { teamNaam: { contains: "DEMO" } } }).catch(() => 0),
  ]);

  console.log("=== DEMO DATA CHECK ===");
  console.log(`Leden met TSTN prefix:        ${dl} / ${tl} totaal`);
  console.log(`CompSpelers met TSTN prefix:   ${dc} / ${tc} totaal`);
  console.log(`Demo scouts:                   ${dscout}`);
  console.log(`Demo teams:                    ${dteams}`);

  if (dl > 0) {
    console.log(`\n⚠ DEMO DATA GEVONDEN: ${dl} demo-leden in de database`);
    console.log(`  Percentage van totaal: ${((dl / tl) * 100).toFixed(1)}%`);

    // Voorbeeld records
    const voorbeelden = await p.lid.findMany({
      where: { relCode: { startsWith: "TSTN" } },
      take: 5,
      select: { relCode: true, roepnaam: true, achternaam: true },
    });
    console.log("\n  Voorbeelden:");
    for (const v of voorbeelden) {
      console.log(`    ${v.relCode} — ${v.roepnaam} ${v.achternaam}`);
    }
  } else {
    console.log("\n✓ Geen demo-data gevonden in de database.");
  }

  await p.$disconnect();
}

main().catch((e) => {
  console.error("Fout:", e);
  process.exit(1);
});
