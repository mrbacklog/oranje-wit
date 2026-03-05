const { Client } = require("pg");
require("dotenv").config();
const teams = require("../data/seizoenen/2025-2026/teams.json");

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  const jtms = ["J7", "J11", "J12", "J13", "J14", "J15", "J16", "J17", "J18"];

  console.log("Nog te plaatsen J-teams (zaal):\n");

  const rows = [];
  for (const jt of jtms) {
    const sp = await c.query(
      `SELECT l.geboortejaar, l.geslacht
       FROM competitie_spelers cp JOIN leden l ON cp.rel_code = l.rel_code
       WHERE cp.seizoen = '2025-2026' AND cp.competitie = 'zaal' AND cp.team = $1
       ORDER BY l.geboortejaar`,
      [jt]
    );
    if (sp.rows.length === 0) continue;

    const jaren = [...new Set(sp.rows.map((r) => r.geboortejaar))].sort();
    const gemLeeftijd = (
      sp.rows.reduce((s, r) => s + (2026 - r.geboortejaar), 0) / sp.rows.length
    ).toFixed(1);
    const m = sp.rows.filter((r) => r.geslacht === "M").length;
    const v = sp.rows.filter((r) => r.geslacht === "V").length;

    const teamInfo = teams.teams.find(
      (t) => t.periodes && t.periodes.zaal_deel1 && t.periodes.zaal_deel1.j_nummer === jt
    );
    const sterkte = teamInfo?.periodes?.zaal_deel1?.sterkte || "-";
    const spelvorm = teamInfo?.spelvorm || "-";
    const kleur = teamInfo?.kleur || "-";

    rows.push({ jt, n: sp.rows.length, m, v, jaren, gemLeeftijd, sterkte, spelvorm, kleur });
  }

  // Print tabel
  console.log("Team  | # | M/V | Geb.jaren    | Gem.lft | Sterkte | Spelvorm | Kleur");
  console.log("------|---|-----|--------------|---------|---------|----------|------");
  for (const r of rows) {
    console.log(
      `${r.jt.padEnd(6)}| ${String(r.n).padEnd(2)}| ${r.m}/${r.v}  | ${r.jaren.join(",").padEnd(13)}| ${r.gemLeeftijd.padStart(5)}   | ${String(r.sterkte).padStart(5)}   | ${r.spelvorm.padEnd(9)}| ${r.kleur}`
    );
  }

  // Analyse: welke 4-tallen kunnen samen een 8-tal vormen?
  console.log("\n\n=== Samenvoeg-analyse (4-tal → 8-tal) ===\n");
  const viertallen = rows.filter((r) => r.spelvorm === "4-tal");
  const achttallen = rows.filter((r) => r.spelvorm === "8-tal");

  console.log(`4-tallen: ${viertallen.map((r) => r.jt).join(", ")}`);
  console.log(`8-tallen: ${achttallen.map((r) => r.jt).join(", ")}\n`);

  // Vergelijk elk paar 4-tallen
  for (let i = 0; i < viertallen.length; i++) {
    for (let j = i + 1; j < viertallen.length; j++) {
      const a = viertallen[i];
      const b = viertallen[j];
      const leeftijdVerschil = Math.abs(parseFloat(a.gemLeeftijd) - parseFloat(b.gemLeeftijd));
      const sterkteVerschil =
        a.sterkte !== "-" && b.sterkte !== "-" ? Math.abs(a.sterkte - b.sterkte) : "?";
      const totaal = a.n + b.n;
      const totM = a.m + b.m;
      const totV = a.v + b.v;
      const jarenCombi = [...new Set([...a.jaren, ...b.jaren])].sort();

      const match =
        leeftijdVerschil < 1.0 ? "GOED" : leeftijdVerschil < 1.5 ? "REDELIJK" : "GROOT VERSCHIL";

      console.log(`${a.jt} + ${b.jt} → ${totaal} spelers (${totM}M/${totV}V)`);
      console.log(
        `  Leeftijd: ${a.gemLeeftijd} vs ${b.gemLeeftijd} (verschil: ${leeftijdVerschil.toFixed(1)}) → ${match}`
      );
      console.log(`  Sterkte: ${a.sterkte} vs ${b.sterkte} (verschil: ${sterkteVerschil})`);
      console.log(`  Geboortejaren: ${jarenCombi.join(", ")}`);
      console.log("");
    }
  }

  await c.end();
}
main().catch(console.error);
