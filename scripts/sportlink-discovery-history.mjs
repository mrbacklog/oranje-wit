/**
 * Sportlink Discovery — Spelerhistorie: waar hebben spelers gespeeld?
 *
 * Diep graven in alle mogelijke historische endpoints.
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

function hdrs(entity, token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": "KNKV",
    "X-Navajo-Locale": "nl",
  };
}

async function tryRequest(method, entity, token, paramsOrBody = null) {
  try {
    let url = `${NAVAJO_BASE}/${entity}`;
    const opts = { method, headers: hdrs(entity, token) };

    if (method === "GET" && paramsOrBody) {
      url += "?" + new URLSearchParams(paramsOrBody).toString();
    } else if (paramsOrBody) {
      opts.body = JSON.stringify(paramsOrBody);
    }

    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (data?.Error || res.status >= 400) return null;
    return { status: res.status, data, size: text.length };
  } catch {
    return null;
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function main(token) {
  const results = [];

  function log(label, result) {
    if (result) {
      console.log(`✓ ${label} (${result.size} bytes)`);
      const preview =
        typeof result.data === "object"
          ? JSON.stringify(result.data, null, 2).slice(0, 1500)
          : String(result.data).slice(0, 1500);
      console.log(preview);
      console.log();
      results.push({ label, data: result.data, size: result.size });
    }
  }

  // Test-personen: lang lid, veel historie
  const testPersons = [
    { id: "NFW92M3", name: "Antjan Laban" }, // Jij, lang lid
    { id: "NJF95S5", name: "Bob Mans" }, // Actief senior
    { id: "NMV77N3", name: "Lara Mans" }, // Jeugd
    { id: "NFW26D7", name: "Arthijn Muller" }, // Senior, lang lid
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // 1. Lid-specifieke history endpoints — alle parameter-varianten
  // ═══════════════════════════════════════════════════════════════════════

  console.log("═══ 1. Member history endpoints — per persoon ═══\n");

  const historyEndpoints = [
    "member/history/MemberTeamHistory",
    "member/history/MemberPlayerHistory",
    "member/history/MemberMatchHistory",
    "member/history/MemberDisciplineHistory",
    "member/team/MemberTeams",
    "member/team/MemberClubTeam",
    "member/team/MemberUnionTeam",
    "member/membership/MemberUnionMemberships",
    "member/membership/MemberUnionSpecialMemberships",
    "member/activity/MemberGameActivities",
    "member/MemberHeader",
    "member/registrations/PersonClubHistory",
    "member/registrations/AvailableGameActivitiesForMember",
    "member/registrations/PersonRegistrations",
  ];

  for (const person of testPersons) {
    console.log(`\n─── ${person.name} (${person.id}) ───\n`);

    for (const ep of historyEndpoints) {
      // Strategie 1: GET met query params
      for (const params of [
        { PublicPersonId: person.id },
        { PersonId: person.id },
        { Id: person.id },
        { PublicPersonId: person.id, NotificationId: -1 },
      ]) {
        const r = await tryRequest("GET", ep, token, params);
        if (r) {
          log(
            `GET ${ep} ?${Object.entries(params)
              .map(([k, v]) => `${k}=${v}`)
              .join("&")}`,
            r
          );
          break;
        }
        await delay(50);
      }

      // Strategie 2: POST met body
      for (const body of [
        { PublicPersonId: person.id },
        { PersonId: person.id },
        { PublicPersonId: person.id, NotificationId: -1 },
      ]) {
        const r = await tryRequest("POST", ep, token, body);
        if (r) {
          log(`POST ${ep} body=${JSON.stringify(body)}`, r);
          break;
        }
        await delay(50);
      }

      // Strategie 3: PUT met body
      for (const body of [
        { PublicPersonId: person.id },
        { PublicPersonId: person.id, NotificationId: -1 },
      ]) {
        const r = await tryRequest("PUT", ep, token, body);
        if (r) {
          log(`PUT ${ep} body=${JSON.stringify(body)}`, r);
          break;
        }
        await delay(50);
      }

      await delay(100);
    }

    // Als we hits hebben voor de eerste persoon, is dat genoeg patroon
    if (results.length > 0) break;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Team-specifieke historie — RelationStart/End per seizoen
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n═══ 2. Team-historie via UnionTeamPlayers met datumfilters ═══\n");

  // Haal eerste team op
  const teamsData = await tryRequest("GET", "team/UnionTeams", token);
  const firstTeam = teamsData?.data?.Team?.[0];

  if (firstTeam) {
    console.log(`Team: ${firstTeam.TeamName} (${firstTeam.PublicTeamId})\n`);

    // De UnionTeamPlayers response heeft RelationStart/End per speler
    // Probeer met datum-filters om historische data te krijgen
    const dateParams = [
      { PublicTeamId: firstTeam.PublicTeamId },
      { PublicTeamId: firstTeam.PublicTeamId, DateFrom: "2020-01-01" },
      { PublicTeamId: firstTeam.PublicTeamId, Season: "2024-2025" },
      { PublicTeamId: firstTeam.PublicTeamId, SeasonId: "2024;01-07-2024;30-06-2025;31-12-2024" },
      { PublicTeamId: firstTeam.PublicTeamId, IncludeHistory: "true" },
      { PublicTeamId: firstTeam.PublicTeamId, IncludeFormer: "true" },
      { PublicTeamId: firstTeam.PublicTeamId, ShowAll: "true" },
    ];

    for (const params of dateParams) {
      const r = await tryRequest("GET", "team/teamperson/UnionTeamPlayers", token, params);
      if (r) {
        const persons = r.data?.Person || [];
        const qs = new URLSearchParams(params).toString();
        console.log(`GET ?${qs} → ${persons.length} personen`);
        if (persons.length > 0) {
          // Check of RelationStart/End historische data bevat
          const withEnd = persons.filter((p) => p.RelationEnd);
          console.log(`  Met RelationEnd: ${withEnd.length}`);
          for (const p of persons.slice(0, 3)) {
            console.log(
              `  ${p.FullName} — ${p.RoleDescription} — van ${p.RelationStart} tot ${p.RelationEnd || "heden"}`
            );
          }
        }
        console.log();
      }
      await delay(200);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Zoek in de JS bundle hoe history-tabs worden geladen
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n═══ 3. JS bundle analyse — history calls ═══\n");

  const jsRes = await fetch("https://clubweb.sportlink.com/assets/main-BMLctghz.js");
  const jsText = await jsRes.text();

  // Zoek specifiek naar hoe MemberTeamHistory wordt aangeroepen
  const patterns = [
    /MemberTeamHistory[^}]{0,500}/g,
    /MemberPlayerHistory[^}]{0,500}/g,
    /PersonClubHistory[^}]{0,500}/g,
    /MemberTeams[^}]{0,300}/g,
    /MemberUnionMemberships[^}]{0,300}/g,
    /MemberGameActivities[^}]{0,300}/g,
    /tabTeamHistory[^}]{0,300}/g,
    /tabPlayerHistory[^}]{0,300}/g,
    /RESET_PLAYER_HISTORY[^}]{0,200}/g,
    /RESET_TEAM_HISTORY[^}]{0,200}/g,
  ];

  for (const pattern of patterns) {
    const matches = [...jsText.matchAll(pattern)];
    if (matches.length > 0) {
      console.log(`\nPattern: ${pattern.source.slice(0, 40)}`);
      for (const m of matches.slice(0, 3)) {
        // Clean up and show relevant context
        const clean = m[0].replace(/\s+/g, " ").trim();
        console.log(`  ${clean.slice(0, 300)}`);
      }
    }
  }

  // Zoek hoe entity calls worden opgebouwd met parameters
  const entityCallPattern =
    /entity:"member\/(?:history|team|membership|activity)\/[^"]+",\s*(?:method:"[^"]+",\s*)?parameters:\{[^}]+\}/g;
  const entityCalls = [...jsText.matchAll(entityCallPattern)];
  console.log(`\n\nEntity calls met parameters (${entityCalls.length}):`);
  for (const m of entityCalls) {
    console.log(`  ${m[0]}`);
  }

  // Zoek ook naar fetch/query patterns die PublicPersonId gebruiken
  const fetchPattern = /entity:"member\/[^"]+",(?:[^}]*?)PublicPersonId[^}]*/g;
  const fetchMatches = [...jsText.matchAll(fetchPattern)];
  console.log(`\nFetch patterns met PublicPersonId (${fetchMatches.length}):`);
  for (const m of fetchMatches.slice(0, 15)) {
    console.log(`  ${m[0].slice(0, 200)}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Probeer de exacte parameternamen uit de JS
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n═══ 4. Exacte JS-patronen uitproberen ═══\n");

  const person = testPersons[0]; // Antjan

  // Uit de JS: parameters:{PublicPersonId:e,NotificationId:s||-1}
  // Dit is het patroon voor MemberHeader en MemberPhoto
  // Laten we dit proberen voor alle history endpoints

  const exactParams = [{ PublicPersonId: person.id, NotificationId: -1 }];

  const historyEps = [
    "member/history/MemberTeamHistory",
    "member/history/MemberPlayerHistory",
    "member/history/MemberMatchHistory",
    "member/team/MemberTeams",
    "member/membership/MemberUnionMemberships",
    "member/activity/MemberGameActivities",
    "member/registrations/PersonClubHistory",
  ];

  for (const ep of historyEps) {
    for (const params of exactParams) {
      // GET met query params (zoals de frontend doet)
      const r = await tryRequest("GET", ep, token, params);
      if (r) {
        log(`GET ${ep} ?PublicPersonId=${person.id}&NotificationId=-1`, r);
      }
      await delay(150);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Check of de MemberHeader extra info geeft (teams, etc.)
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n═══ 5. MemberHeader per persoon ═══\n");

  for (const person of testPersons) {
    const r = await tryRequest("GET", "member/MemberHeader", token, {
      PublicPersonId: person.id,
      NotificationId: -1,
    });
    if (r) {
      console.log(`${person.name}:`);
      console.log(JSON.stringify(r.data, null, 2).slice(0, 1000));
      console.log();
    }
    await delay(200);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. Probeer WorkingSet endpoints (uit JS)
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n═══ 6. WorkingSet en andere team-endpoints ═══\n");

  const wsEndpoints = [
    "team/teamperson/WorkingSetKernelTeamPersons",
    "team/teamperson/WorkingSetKernelTeamPerson",
    "team/teamplayerstatistics/TeamPlayerStatistics",
    "team/teamplayerstatistics/TeamPlayerStatisticsFilters",
  ];

  for (const ep of wsEndpoints) {
    for (const params of [
      {},
      { PublicTeamId: firstTeam?.PublicTeamId },
      { PublicPersonId: testPersons[0].id },
    ]) {
      const r = await tryRequest("GET", ep, token, params);
      if (r && r.size > 20) {
        log(`GET ${ep} ?${new URLSearchParams(params)}`, r);
        break;
      }
      await delay(100);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. Notifications filteren op entity=player en entity=membership
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n═══ 7. Notifications — player & membership events als historie-bron ═══\n");

  const notifData = await tryRequest("GET", "member/notifications/Notifications", token, {
    DateFrom: "2015-01-01",
  });
  if (notifData) {
    const items = notifData.data.Items || [];

    // Filter op player events (spelactiviteit wijzigingen)
    const playerEvents = items.filter((i) => i.Entity === "player");
    console.log(`Player events: ${playerEvents.length}`);
    console.log("Eerste 10:");
    for (const e of playerEvents.slice(0, 10)) {
      console.log(
        `  ${e.DateOfChange} | ${e.PersonFullName.padEnd(30)} | ${e.TypeOfActionDescription.padEnd(12)} | ${e.Description}`
      );
    }

    // Filter op membership events
    const membershipEvents = items.filter((i) => i.Entity === "membership");
    console.log(`\nMembership events: ${membershipEvents.length}`);
    console.log("Eerste 10:");
    for (const e of membershipEvents.slice(0, 10)) {
      console.log(
        `  ${e.DateOfChange} | ${e.PersonFullName.padEnd(30)} | ${e.TypeOfActionDescription.padEnd(12)} | ${e.Description}`
      );
    }

    // Zoek specifiek naar team-gerelateerde events
    const teamEvents = items.filter(
      (i) =>
        i.Description.includes("bij Oranje Wit") ||
        i.Description.includes("Veld") ||
        i.Description.includes("Zaal") ||
        i.Description.includes("team")
    );
    console.log(`\nTeam-gerelateerde events: ${teamEvents.length}`);
    for (const e of teamEvents.slice(0, 20)) {
      console.log(
        `  ${e.DateOfChange} | ${e.PersonFullName.padEnd(30)} | ${e.TypeOfActionDescription.padEnd(12)} | ${e.Entity.padEnd(12)} | ${e.Description}`
      );
    }

    // Per persoon: alle events groeperen
    console.log("\n\nPer persoon — volledige historie:");
    const perPerson = {};
    for (const e of items) {
      if (!perPerson[e.PublicPersonId])
        perPerson[e.PublicPersonId] = { name: e.PersonFullName, events: [] };
      perPerson[e.PublicPersonId].events.push(e);
    }

    // Toon personen met meeste events
    const sorted = Object.entries(perPerson).sort(
      (a, b) => b[1].events.length - a[1].events.length
    );
    for (const [id, { name, events }] of sorted.slice(0, 5)) {
      console.log(`\n  ${name} (${id}) — ${events.length} events:`);
      for (const e of events) {
        console.log(
          `    ${e.DateOfChange.slice(0, 10)} | ${e.Entity.padEnd(12)} | ${e.TypeOfActionDescription.padEnd(12)} | ${e.Description}`
        );
      }
    }
  }

  // Opslaan
  writeFileSync("scripts/sportlink-discovery-history.json", JSON.stringify(results, null, 2));
  console.log("\n\n✓ Rapport opgeslagen in scripts/sportlink-discovery-history.json");
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-discovery-history.mjs <email> <password>");
  process.exit(1);
}
try {
  const token = await login(email, password);
  console.log("✓ Ingelogd\n");
  await main(token);
  console.log("\n✓ History discovery compleet");
} catch (e) {
  console.error("✗ Fout:", e.message);
  process.exit(1);
}
