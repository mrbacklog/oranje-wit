const { Client } = require("pg");
require("dotenv").config();

async function main() {
  const c = new Client(process.env.DATABASE_URL);
  await c.connect();

  // De 5 die aangemaakt werden voor Sen3
  const namen = [
    ["Bart", "Brugge"],
    ["Freek", "Peuter"],
    ["Hanneke", "Batenburg"],
    ["Mirthe", "Kalkeren-Verweij"],
    ["Renske", "Visser"],
  ];

  for (const [roepnaam, achternaam] of namen) {
    const kern = achternaam.split("-")[0].split(" ").pop();
    const s = await c.query(
      `SELECT id, "roepnaam", "achternaam", "geboortejaar" FROM "Speler" WHERE "achternaam" ILIKE '%' || $1 || '%' ORDER BY "achternaam"`,
      [kern]
    );
    console.log(`${roepnaam} ${achternaam} -> matches op "${kern}":`);
    s.rows.forEach((r) =>
      console.log(`  ${r.id} | ${r.roepnaam} ${r.achternaam} (${r.geboortejaar})`)
    );
  }

  await c.end();
}
main().catch(console.error);
