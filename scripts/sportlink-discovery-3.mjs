/**
 * Sportlink Discovery — Fase 3: Alle entities uit de JS bundle testen
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
  console.log("✓ Ingelogd\n");
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

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryEntity(entity, token, method = "GET", body = null) {
  try {
    const opts = { method, headers: hdrs(entity, token) };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${NAVAJO_BASE}/${entity}`, opts);
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

async function main(token) {
  // Alle entities uit de JS bundle
  const entities = [
    // Dashboard (meest interessant voor notifications)
    "user/dashboard/DashboardPersonChanges",
    "user/dashboard/DashboardPersonNewRegistrations",
    "user/dashboard/DashboardOpenTransfers",
    "user/dashboard/DashboardMatchChangeRequests",
    "user/dashboard/DashboardMatchWidget",
    "user/dashboard/DashboardMatchResults",
    "user/dashboard/DashboardVSKTasks",

    // Notifications
    "member/notifications/Notifications",
    "member/notifications/Notification",

    // Member history
    "member/history/MemberPlayerHistory",
    "member/history/MemberTeamHistory",
    "member/history/MemberDisciplineHistory",
    "member/history/MemberMatchHistory",

    // Member activity
    "member/activity/MemberGameActivities",
    "member/activityHistory/SearchPersonActivityTransfers",
    "member/activityHistory/SearchPersonActivityTransfersFilters",

    // Member teams
    "member/team/MemberTeams",
    "member/team/MemberClubTeam",
    "member/team/MemberUnionTeam",

    // Member membership
    "member/membership/MemberUnionMemberships",
    "member/membership/MemberUnionSpecialMemberships",

    // Member header/photo
    "member/MemberHeader",
    "member/MemberPhoto",
    "member/MemberPhotoPeriodConfiguration",
    "member/MemberParentalInfo",

    // Member persondata
    "member/persondata/MemberPersonData",
    "member/persondata/MemberAddresses",
    "member/persondata/MemberCommunication",
    "member/persondata/MemberIdentification",

    // Member remarks/freefields
    "member/remarks/MemberFreeFields",
    "member/remarks/MemberRemarks",
    "member/remarks/MemberRegistrationFields",

    // Member functions
    "member/function/MemberFunctions",
    "member/function/MemberCommittees",
    "member/function/MemberTrainers",

    // Member certificates
    "member/certificate/MemberCertificates",
    "member/certificate/MemberPasses",
    "member/certificate/MemberTrainerLicenses",

    // Member documents
    "member/document/MemberDocuments",
    "member/document/MemberEmails",

    // Member registrations
    "member/registrations/PersonRegistrations",
    "member/registrations/PersonClubHistory",
    "member/registrations/AvailableGameActivitiesForMember",

    // Member search (extra)
    "member/search/SearchTeams",
    "member/search/SearchCommittees",
    "member/search/SearchCertificates",
    "member/search/SearchContribution",
    "member/search/SearchFunctions",
    "member/search/FilterTeamsExtended",
    "member/search/FilterTeamsSimple",

    // Club
    "club/Club",
    "club/ClubWebsiteUrl",
    "club/ClubTeams",

    // Teams
    "team/ClubTeams",
    "team/ClubTeam",
    "team/UnionTeams",
    "team/teamperson/ClubTeamPlayers",
    "team/teamperson/ClubTeamNonPlayers",
    "team/teamperson/UnionTeamPlayers",
    "team/teamperson/UnionTeamNonPlayers",
    "team/teamperson/SearchClubTeamPlayers",
    "team/teamperson/SearchUnionTeamPlayers",
    "team/TeamHeader",
    "team/unassignedplayers/SearchUnassignedPlayers",
    "team/unassignedplayers/FiltersUnassignedPlayers",
    "team/teamplayerstatistics/TeamPlayerStatistics",
    "team/teamplayerstatistics/TeamPlayerStatisticsFilters",
    "team/teamsforcompetitiontypeseason/TeamsForCompetitionTypeSeason",

    // Member attrition (verloop!)
    "member/attrition/MemberProgressReport",
    "member/membercount/MemberDetailCount",

    // Club players
    "member/clubplayers/AssociatedClubPlayers",
    "member/clubplayers/AssociatedClubPlayersFilter",

    // User
    "user/UserInfo",
    "user/settings/UserSettings",
    "user/settings/UserDashboardTasks",
    "user/settings/UserAuthorizationItems",
    "user/UserTableColumnDefinitions",

    // Transfers
    "member/transfers/ClubTransfers",
    "member/transfers/TransferUpgradeRequests",
    "member/transfers/GrantedTransfers",

    // Activity training
    "activity/training/TrainingReport",
    "activity/training/TrainingReportFilters",

    // Foys
    "member/foys/FoysMemberList",
    // Anniversary
    "member/anniversary/Anniversaries",
  ];

  const results = { found: [], notFound: [] };

  for (const entity of entities) {
    const result = await tryEntity(entity, token);
    if (result) {
      console.log(`✓ GET ${entity} (${result.size} bytes)`);
      const preview =
        typeof result.data === "object"
          ? JSON.stringify(result.data, null, 2).slice(0, 600)
          : String(result.data).slice(0, 600);
      console.log(preview);
      console.log();
      results.found.push({
        entity,
        size: result.size,
        keys: typeof result.data === "object" ? Object.keys(result.data) : null,
      });
    } else {
      results.notFound.push(entity);
    }
    await delay(150);
  }

  // Probeer ook POST voor de endpoints die data nodig hebben (met een test-lid)
  console.log("\n═══ POST met test-lid (Bob Mans, NJF95S5) ═══\n");
  const testId = "NJF95S5";
  const postEntities = [
    "member/notifications/Notifications",
    "member/history/MemberPlayerHistory",
    "member/history/MemberTeamHistory",
    "member/history/MemberMatchHistory",
    "member/activity/MemberGameActivities",
    "member/team/MemberTeams",
    "member/membership/MemberUnionMemberships",
    "member/MemberHeader",
    "member/MemberPhoto",
    "member/registrations/PersonRegistrations",
    "member/registrations/PersonClubHistory",
    "member/registrations/AvailableGameActivitiesForMember",
    "member/persondata/MemberPersonData",
    "member/remarks/MemberFreeFields",
    "member/function/MemberFunctions",
    "member/certificate/MemberCertificates",
    "member/attrition/MemberProgressReport",
    "member/membercount/MemberDetailCount",
  ];

  for (const entity of postEntities) {
    // Probeer verschillende body-formaten
    for (const body of [
      { PersonId: testId },
      { PublicPersonId: testId },
      { Id: testId },
      { MemberId: testId },
    ]) {
      const result = await tryEntity(entity, token, "POST", body);
      if (result) {
        const bodyKey = Object.keys(body)[0];
        console.log(`✓ POST ${entity} (${bodyKey}: ${testId}) — ${result.size} bytes`);
        const preview =
          typeof result.data === "object"
            ? JSON.stringify(result.data, null, 2).slice(0, 800)
            : String(result.data).slice(0, 800);
        console.log(preview);
        console.log();
        results.found.push({
          entity: `POST ${entity} (${bodyKey})`,
          size: result.size,
          keys: typeof result.data === "object" ? Object.keys(result.data) : null,
        });
        break; // Gevonden, hoef niet meer te proberen
      }
      await delay(100);
    }
  }

  console.log("\n═══ SAMENVATTING ═══\n");
  console.log(`✓ Gevonden: ${results.found.length} endpoints`);
  for (const f of results.found) {
    console.log(`  - ${f.entity} (${f.size} bytes) keys: ${f.keys?.join(", ") ?? "n/a"}`);
  }
  console.log(`\n✗ Niet gevonden: ${results.notFound.length} endpoints`);
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-discovery-3.mjs <email> <password>");
  process.exit(1);
}
try {
  const token = await login(email, password);
  await main(token);
  console.log("\n✓ Discovery fase 3 compleet");
} catch (e) {
  console.error("✗ Fout:", e.message);
  process.exit(1);
}
