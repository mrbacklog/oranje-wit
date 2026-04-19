/**
 * Sportlink Notifications — Hoe ver gaat de historie terug?
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
  // Stap 1: Haal standaard notifications op
  console.log("═══ Standaard Notifications ═══\n");
  const std = await fetch(`${NAVAJO_BASE}/member/notifications/Notifications`, {
    headers: hdrs("member/notifications/Notifications", token),
  });
  const stdData = await std.json();
  console.log(`Aantal items: ${stdData.Items?.length ?? 0}`);
  if (stdData.Items?.length > 0) {
    const oudste = stdData.Items[stdData.Items.length - 1];
    const nieuwste = stdData.Items[0];
    console.log(
      `Nieuwste: ${nieuwste.DateOfChange} — ${nieuwste.PersonFullName} (${nieuwste.TypeOfActionDescription})`
    );
    console.log(
      `Oudste:   ${oudste.DateOfChange} — ${oudste.PersonFullName} (${oudste.TypeOfActionDescription})`
    );
  }

  // Stap 2: Probeer met paginatie / datum-filters
  console.log("\n═══ Probeer paginatie/filters ═══\n");

  const bodies = [
    { label: "Page 0, size 100", body: { Page: 0, PageSize: 100 } },
    { label: "Page 1, size 100", body: { Page: 1, PageSize: 100 } },
    { label: "Page 0, size 1000", body: { Page: 0, PageSize: 1000 } },
    { label: "Offset 0, Limit 500", body: { Offset: 0, Limit: 500 } },
    { label: "Skip 0, Take 500", body: { Skip: 0, Take: 500 } },
    { label: "StartIndex 0, Count 500", body: { StartIndex: 0, Count: 500 } },
    { label: "DayRange 365", body: { DayRange: 365 } },
    { label: "DayRange 3650 (10 jaar)", body: { DayRange: 3650 } },
    { label: "DayRange 7300 (20 jaar)", body: { DayRange: 7300 } },
    { label: "DateFrom 2010-01-01", body: { DateFrom: "2010-01-01" } },
    { label: "DateFrom 2020-01-01", body: { DateFrom: "2020-01-01" } },
    { label: "From 2010-01-01", body: { From: "2010-01-01" } },
    { label: "StartDate 2010-01-01", body: { StartDate: "2010-01-01" } },
    { label: "BeginDate 2010-01-01", body: { BeginDate: "2010-01-01" } },
    { label: "All true", body: { All: true } },
    { label: "ShowAll true", body: { ShowAll: true } },
    { label: "IncludeRead true", body: { IncludeRead: true } },
    { label: "IncludeAll true, DayRange 3650", body: { IncludeAll: true, DayRange: 3650 } },
    { label: "ReadStatus all", body: { ReadStatus: "all" } },
    { label: "Category all", body: { Category: "all" } },
    { label: "Empty POST", body: {} },
  ];

  for (const { label, body } of bodies) {
    try {
      const res = await fetch(`${NAVAJO_BASE}/member/notifications/Notifications`, {
        method: "POST",
        headers: hdrs("member/notifications/Notifications", token),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.Error) {
        // skip
        continue;
      }
      const count = data.Items?.length ?? 0;
      if (count > 0) {
        const oudste = data.Items[data.Items.length - 1];
        const nieuwste = data.Items[0];
        console.log(`✓ POST "${label}" → ${count} items`);
        console.log(`  Nieuwste: ${nieuwste.DateOfChange}`);
        console.log(`  Oudste:   ${oudste.DateOfChange}\n`);

        // Als we meer dan de standaard 3 items krijgen, log alles
        if (count > 3) {
          console.log("  Alle items:");
          for (const item of data.Items) {
            console.log(
              `    ${item.DateOfChange} | ${item.PersonFullName} | ${item.TypeOfActionDescription} | ${item.Description} | ${item.Category}`
            );
          }
          console.log();
        }
      } else {
        console.log(`  POST "${label}" → 0 items`);
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  // Stap 3: Probeer PUT
  console.log("\n═══ Probeer PUT ═══\n");
  for (const body of [{ DayRange: 3650 }, { All: true }, {}]) {
    try {
      const res = await fetch(`${NAVAJO_BASE}/member/notifications/Notifications`, {
        method: "PUT",
        headers: hdrs("member/notifications/Notifications", token),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.Error && data.Items?.length > 0) {
        console.log(`✓ PUT ${JSON.stringify(body)} → ${data.Items.length} items`);
        const oudste = data.Items[data.Items.length - 1];
        console.log(`  Oudste: ${oudste.DateOfChange} — ${oudste.PersonFullName}`);
      }
    } catch {}
  }

  // Stap 4: Check DashboardPersonChanges met grotere DayRange
  console.log("\n═══ DashboardPersonChanges met grotere DayRange ═══\n");
  for (const dayRange of [14, 30, 90, 365, 3650]) {
    try {
      const res = await fetch(`${NAVAJO_BASE}/user/dashboard/DashboardPersonChanges`, {
        method: "POST",
        headers: hdrs("user/dashboard/DashboardPersonChanges", token),
        body: JSON.stringify({ DayRange: dayRange }),
      });
      const data = await res.json();
      if (!data.Error) {
        console.log(
          `DayRange ${dayRange}: TotalCount=${data.TotalCount}, UnreadCount=${data.UnreadCount}, DayRange=${data.DayRange}`
        );
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  // Stap 5: Volledige output van alle 3 standaard notifications
  console.log("\n═══ Alle notificatie-velden (volledig) ═══\n");
  if (stdData.Items) {
    console.log(JSON.stringify(stdData.Items, null, 2));
  }
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-notifications-history.mjs <email> <password>");
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
