/**
 * Haal alle 732 notifications op met volledige JSON, analyseer alle velden
 */
import crypto from "crypto";
import { writeFileSync } from "fs";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";
const CLUB_ID = "NCX19J3";
function extractCookies(h) {
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const r = h.get("set-cookie");
  return r ? r.split(/,\s*(?=[A-Z_]+=)/i).filter(Boolean) : [];
}
async function login(email, password) {
  const cv = crypto.randomBytes(32).toString("base64url");
  const cc = crypto.createHash("sha256").update(cv).digest("base64url");
  const st = crypto.randomBytes(16).toString("hex");
  const authUrl =
    `${KEYCLOAK_BASE}/protocol/openid-connect/auth?` +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid",
      state: st,
      code_challenge: cc,
      code_challenge_method: "S256",
    });
  const ar = await fetch(authUrl, { redirect: "manual" });
  const ah = await ar.text();
  const ck = extractCookies(ar.headers);
  const cs = ck.map((c) => c.split(";")[0]).join("; ");
  const am = ah.match(/action="([^"]+)"/);
  if (!am) throw new Error("Geen form action");
  const lr = await fetch(am[1].replace(/&amp;/g, "&"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cs },
    body: new URLSearchParams({ username: email, password }),
    redirect: "manual",
  });
  let ru = lr.headers.get("location");
  if (!ru) {
    const lh = await lr.text();
    const om = lh.match(/action="([^"]+)"/);
    if (!om) throw new Error("Onverwacht");
    const lc = extractCookies(lr.headers);
    const ac = [...ck, ...lc].map((c) => c.split(";")[0]).join("; ");
    const or = await fetch(om[1].replace(/&amp;/g, "&"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: ac },
      body: new URLSearchParams({}),
      redirect: "manual",
    });
    ru = or.headers.get("location");
  }
  if (!ru?.includes("code=")) throw new Error("Geen code");
  const tr = await fetch(`${KEYCLOAK_BASE}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code: new URL(ru).searchParams.get("code"),
      redirect_uri: REDIRECT_URI,
      code_verifier: cv,
    }),
  });
  const td = await tr.json();
  const ll = await fetch(`${NAVAJO_BASE}/user/LinkToPerson`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${td.access_token}`,
      "Content-Type": "text/plain;charset=UTF-8",
      "X-Navajo-Entity": "user/LinkToPerson",
      "X-Navajo-Instance": "Generic",
      "X-Navajo-Locale": "nl",
    },
    body: JSON.stringify({ ClubId: CLUB_ID, UnionId: "KNKV" }),
  });
  const ld = await ll.json();
  if (!ld.TokenObject?.accessToken) throw new Error("Geen sessie");
  return ld.TokenObject.accessToken;
}

async function main(token) {
  const url = `${NAVAJO_BASE}/member/notifications/Notifications?DateFrom=2015-01-01`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain;charset=UTF-8",
      "X-Navajo-Entity": "member/notifications/Notifications",
      "X-Navajo-Instance": "KNKV",
      "X-Navajo-Locale": "nl",
    },
  });
  const data = await res.json();
  const items = data.Items || [];
  console.log(`Totaal: ${items.length} notifications\n`);

  // Sla volledige JSON op
  writeFileSync("scripts/sportlink-notifications-all.json", JSON.stringify(items, null, 2));
  console.log("✓ Opgeslagen in scripts/sportlink-notifications-all.json\n");

  // Analyseer ChangeVector waarden
  const changeVectors = items
    .filter((i) => i.ChangeVector)
    .map((i) => ({
      vector: i.ChangeVector,
      description: i.Description,
      action: i.TypeOfActionDescription,
      person: i.PersonFullName,
      date: i.DateOfChange,
    }));
  console.log(`═══ Items met ChangeVector: ${changeVectors.length} van ${items.length} ═══\n`);
  const uniqueVectors = [...new Set(changeVectors.map((c) => c.vector))];
  console.log("Unieke ChangeVectors:");
  for (const v of uniqueVectors) {
    const count = changeVectors.filter((c) => c.vector === v).length;
    console.log(`  ${count}x "${v}"`);
  }

  // Analyseer ChangedBy
  console.log("\n═══ ChangedBy waarden ═══\n");
  const changedByCount = {};
  for (const item of items) {
    changedByCount[item.ChangedBy] = (changedByCount[item.ChangedBy] || 0) + 1;
  }
  for (const [key, count] of Object.entries(changedByCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}x "${key}"`);
  }

  // Analyseer Entity waarden
  console.log("\n═══ Entity waarden ═══\n");
  const entityCount = {};
  for (const item of items) {
    entityCount[item.Entity] = (entityCount[item.Entity] || 0) + 1;
  }
  for (const [key, count] of Object.entries(entityCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}x "${key}"`);
  }

  // Categorieën per actie
  console.log("\n═══ Per beschrijvingstype: categorieën en acties ═══\n");
  const descMap = {};
  for (const item of items) {
    const key = item.Description;
    if (!descMap[key])
      descMap[key] = { categories: new Set(), actions: new Set(), count: 0, examples: [] };
    descMap[key].categories.add(item.Category);
    descMap[key].actions.add(item.TypeOfActionDescription);
    descMap[key].count++;
    if (descMap[key].examples.length < 2) descMap[key].examples.push(item);
  }
  for (const [desc, info] of Object.entries(descMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)) {
    console.log(`"${desc}" (${info.count}x)`);
    console.log(`  Acties: ${[...info.actions].join(", ")}`);
    console.log(`  Categorieën: ${[...info.categories].join(", ")}`);
    console.log(
      `  Voorbeeld: ${info.examples[0].PersonFullName} op ${info.examples[0].DateOfChange}`
    );
    if (info.examples[0].ChangeVector)
      console.log(`  ChangeVector: ${info.examples[0].ChangeVector}`);
    console.log();
  }

  // Toon per jaar hoeveel items
  console.log("═══ Items per jaar ═══\n");
  const perYear = {};
  for (const item of items) {
    const year = item.DateOfChange.slice(0, 4);
    perYear[year] = (perYear[year] || 0) + 1;
  }
  for (const [year, count] of Object.entries(perYear).sort()) {
    console.log(`  ${year}: ${count} items`);
  }
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-notifications-full.mjs <email> <password>");
  process.exit(1);
}
try {
  const token = await login(email, password);
  console.log("✓ Ingelogd\n");
  await main(token);
} catch (e) {
  console.error("✗ Fout:", e.message);
  process.exit(1);
}
