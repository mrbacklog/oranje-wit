/**
 * Sportlink Notifications — met URL query params (zoals de frontend doet)
 */
import crypto from "crypto";

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

function hdrs(entity, token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": "KNKV",
    "X-Navajo-Locale": "nl",
  };
}

async function main(token) {
  const entity = "member/notifications/Notifications";

  // De frontend stuurt params als query string
  const paramSets = [
    {},
    { DateFrom: "2010-01-01" },
    { DateFrom: "2015-01-01" },
    { DateFrom: "2020-01-01" },
    { DateFrom: "2024-01-01" },
    { DateFrom: "2025-01-01" },
    { DateFrom: "2025-07-01" },
    { DateFrom: "2026-01-01" },
    { DateFrom: "2010-01-01", DateTo: "2026-12-31" },
    { DayRange: 365 },
    { DayRange: 3650 },
    { Page: 0, PageSize: 100 },
    { ReadStatus: "all" },
    { All: true },
  ];

  for (const params of paramSets) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${NAVAJO_BASE}/${entity}?${qs}` : `${NAVAJO_BASE}/${entity}`;

    try {
      const res = await fetch(url, { headers: hdrs(entity, token) });
      const data = await res.json();
      const count = data.Items?.length ?? 0;

      if (data.Error) {
        console.log(`✗ GET ?${qs || "(geen)"} → Error: ${data.Message}`);
      } else if (count > 0) {
        const oudste = data.Items[data.Items.length - 1];
        const nieuwste = data.Items[0];
        console.log(`✓ GET ?${qs || "(geen)"} → ${count} items`);
        console.log(`  Nieuwste: ${nieuwste.DateOfChange} — ${nieuwste.PersonFullName}`);
        console.log(`  Oudste:   ${oudste.DateOfChange} — ${oudste.PersonFullName}`);

        // Als meer dan standaard, print alles
        if (count > 3) {
          console.log(`\n  Alle ${count} items:`);
          for (const item of data.Items) {
            console.log(
              `    ${item.DateOfChange} | ${item.PersonFullName.padEnd(30)} | ${item.TypeOfActionDescription.padEnd(12)} | ${item.Category.padEnd(25)} | ${item.Description}`
            );
          }
        }
      } else {
        console.log(`  GET ?${qs || "(geen)"} → 0 items`);
      }
    } catch (e) {
      console.log(`✗ GET ?${qs} → ${e.message}`);
    }
    console.log();
    await new Promise((r) => setTimeout(r, 300));
  }
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-notifications-params.mjs <email> <password>");
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
