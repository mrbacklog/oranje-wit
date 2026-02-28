const XLSX = require("xlsx");

// Telling 2019-2020
const telWb = XLSX.readFile("docs/Telling spelers per seizoen.xlsx");
const telData = XLSX.utils.sheet_to_json(telWb.Sheets["2019-2020"], { header: 1 }).slice(1);
const telMap = new Map();
for (const r of telData) {
  const naam = String(r[0]).trim();
  const team = String(r[2] || "").trim();
  if (naam) telMap.set(naam, team);
}

// Opstelling 20182019 — verzamel naam→team
const opWb = XLSX.readFile("docs/teamindelingen/Opstelling 20182019.xlsx");
const opMap = new Map();
for (const sh of opWb.SheetNames) {
  const data = XLSX.utils.sheet_to_json(opWb.Sheets[sh], { header: 1 });
  let huidigTeam = null;
  for (const rij of data) {
    const cel0 = String(rij[0] || "").trim();
    if (
      cel0.match(
        /^(Oranje Wit|Senioren|Junioren|[A-F]-aspiranten|Midweek|Jong Oranje|Algemeen|Reserves)/i
      )
    ) {
      if (cel0.match(/Algemeen|Reserves|Recreant/i)) {
        huidigTeam = null;
        continue;
      }
      const m = cel0.match(/\(([^)]+)\)/);
      if (m) huidigTeam = m[1];
      else if (cel0.match(/Midweek/i)) huidigTeam = "MW1";
      else if (cel0.match(/Jong Oranje/i)) huidigTeam = "S5/S6";
      else {
        const m2 = cel0.match(/Oranje Wit\s+(.+)/i);
        if (m2) huidigTeam = m2[1].trim();
      }
      continue;
    }
    if (!huidigTeam) continue;
    for (const col of [1, 5]) {
      const n = String(rij[col] || "").trim();
      if (n && n !== "Naam" && n !== "Dames" && n !== "Heren" && !n.startsWith("~")) {
        opMap.set(n, huidigTeam);
      }
    }
  }
}

// Vergelijk teams
let match = 0,
  mismatch = 0;
const mismatches = [];
for (const [naam, telTeam] of telMap) {
  const opTeam = opMap.get(naam);
  if (!opTeam) continue;
  const normTel = telTeam.replace(/\//g, "");
  const normOp = opTeam.replace(/\//g, "");
  if (normTel === normOp) match++;
  else {
    mismatch++;
    mismatches.push({ naam, telTeam, opTeam });
  }
}

console.log("Teams vergelijking Telling 2019-2020 vs Opstelling 20182019:");
console.log("Match:", match);
console.log("Mismatch:", mismatch);
if (mismatches.length > 0) {
  console.log("\nMismatches:");
  for (const m of mismatches) {
    console.log(
      "  " + m.naam.padEnd(30) + "Telling: " + m.telTeam.padEnd(10) + "Opstelling: " + m.opTeam
    );
  }
}
