/**
 * Sportlink Discovery — Deep dive: alle 24 endpoints volledig uitdiepen
 *
 * Per endpoint: volledige response loggen, alle velden documenteren,
 * en waar mogelijk paginatie/filtering proberen.
 */

import crypto from "crypto";
import { writeFileSync } from "fs";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";
const CLUB_ID = "NCX19J3";

// ─── Auth ────────────────────────────────────────────────────────────────────

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

// ─── API ─────────────────────────────────────────────────────────────────────

function hdrs(entity, token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": "KNKV",
    "X-Navajo-Locale": "nl",
  };
}

async function apiGet(entity, token) {
  const res = await fetch(`${NAVAJO_BASE}/${entity}`, { headers: hdrs(entity, token) });
  return res.json();
}

async function apiPost(entity, token, body) {
  const res = await fetch(`${NAVAJO_BASE}/${entity}`, {
    method: "POST",
    headers: hdrs(entity, token),
    body: JSON.stringify(body),
  });
  return res.json();
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Deep Dive ───────────────────────────────────────────────────────────────

async function main(token) {
  const report = {};

  async function investigate(name, fn) {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`  ${name}`);
    console.log(`${"═".repeat(70)}\n`);
    try {
      const data = await fn();
      report[name] = { status: "ok", data };
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      report[name] = { status: "error", error: e.message };
      console.log(`FOUT: ${e.message}`);
    }
    await delay(300);
  }

  // ── 1. Dashboard widgets ───────────────────────────────────────────────────

  await investigate("1. DashboardPersonChanges — Ledenwijzigingen", () =>
    apiGet("user/dashboard/DashboardPersonChanges", token)
  );

  await investigate("2. DashboardPersonNewRegistrations — Nieuwe aanmeldingen", () =>
    apiGet("user/dashboard/DashboardPersonNewRegistrations", token)
  );

  await investigate("3. DashboardOpenTransfers — Open overschrijvingen", () =>
    apiGet("user/dashboard/DashboardOpenTransfers", token)
  );

  await investigate("4. DashboardMatchChangeRequests — Wedstrijdwijzigingen", () =>
    apiGet("user/dashboard/DashboardMatchChangeRequests", token)
  );

  await investigate("5. DashboardMatchWidget — Wedstrijdoverzicht", () =>
    apiGet("user/dashboard/DashboardMatchWidget", token)
  );

  await investigate("6. DashboardMatchResults — Wedstrijduitslagen", () =>
    apiGet("user/dashboard/DashboardMatchResults", token)
  );

  await investigate("7. DashboardVSKTasks — VSK taken", () =>
    apiGet("user/dashboard/DashboardVSKTasks", token)
  );

  // ── 2. Notifications — de wijzigingshistorie ──────────────────────────────

  await investigate("8. Notifications — Alle notificaties (volledige response)", () =>
    apiGet("member/notifications/Notifications", token)
  );

  // ── 3. Teams ───────────────────────────────────────────────────────────────

  await investigate("9. UnionTeams — Alle bondsteams (volledig)", async () => {
    const data = await apiGet("team/UnionTeams", token);
    // Log eerste 3 teams volledig, rest alleen naam
    const result = {
      aantalTeams: data.Team?.length ?? 0,
      eersteTeamsVolledig: data.Team?.slice(0, 3),
      alleTeamnamen: data.Team?.map(
        (t) =>
          `${t.TeamName} [${t.GameActivityDescription}] — ${t.PlayerCount} spelers, ${t.TeamMemberCount} leden`
      ),
    };
    return result;
  });

  await investigate("10. ClubTeams — Lokale teams", () => apiGet("team/ClubTeams", token));

  // Probeer spelers per team op te halen (eerste union team)
  await investigate("11. UnionTeamPlayers — Spelers per bondsteam", async () => {
    const teams = await apiGet("team/UnionTeams", token);
    const firstTeam = teams.Team?.[0];
    if (!firstTeam) return { error: "Geen teams" };

    // Probeer verschillende body-formaten
    const formats = [
      { TeamId: firstTeam.PublicTeamId },
      { PublicTeamId: firstTeam.PublicTeamId },
      { Id: firstTeam.PublicTeamId },
      { TeamId: firstTeam.PublicTeamId, GameActivityIdTag: firstTeam.GameActivityIdTag },
    ];

    for (const body of formats) {
      try {
        const data = await apiPost("team/teamperson/ClubTeamPlayers", token, body);
        if (!data.Error) return { bodyUsed: body, response: data };
      } catch {}
      try {
        const data = await apiPost("team/teamperson/UnionTeamPlayers", token, body);
        if (!data.Error) return { bodyUsed: body, response: data };
      } catch {}
    }
    return { error: "Geen werkend body-formaat gevonden", triedTeam: firstTeam.PublicTeamId };
  });

  // Niet-ingedeelde spelers
  await investigate("12. UnassignedPlayers filters", () =>
    apiGet("team/unassignedplayers/FiltersUnassignedPlayers", token)
  );

  await investigate("13. UnassignedPlayers zoeken", async () => {
    const filters = await apiGet("team/unassignedplayers/FiltersUnassignedPlayers", token);
    // Probeer POST met de filters
    try {
      const data = await apiPost("team/unassignedplayers/SearchUnassignedPlayers", token, filters);
      if (!data.Error)
        return { aantalSpelers: data.Items?.length ?? data.Members?.length ?? "?", response: data };
    } catch {}
    // Probeer GET
    try {
      const data = await apiGet("team/unassignedplayers/SearchUnassignedPlayers", token);
      if (!data.Error) return data;
    } catch {}
    return { error: "Niet gelukt" };
  });

  // ── 4. Teamspeler-statistieken ─────────────────────────────────────────────

  await investigate("14. TeamPlayerStatistics", () =>
    apiGet("team/teamplayerstatistics/TeamPlayerStatistics", token)
  );

  await investigate("15. TeamPlayerStatisticsFilters", async () => {
    try {
      return await apiGet("team/teamplayerstatistics/TeamPlayerStatisticsFilters", token);
    } catch {
      return { error: "Niet beschikbaar" };
    }
  });

  // ── 5. Search endpoints ────────────────────────────────────────────────────

  await investigate("16. SearchTeams — Teams zoeken", async () => {
    const extFilters = await apiGet("member/search/FilterTeamsExtended", token);
    const simpleFilters = await apiGet("member/search/FilterTeamsSimple", token);
    const data = await apiPost("member/search/SearchTeams", token, {
      Filters: { InputExtended: extFilters, InputSimple: simpleFilters },
    });
    return {
      aantalTeams: data.Teams?.length ?? data.Members?.length ?? "?",
      eersteItems: Array.isArray(data.Teams)
        ? data.Teams.slice(0, 3)
        : Array.isArray(data.Members)
          ? data.Members.slice(0, 3)
          : data,
      alleKeys: data.Teams?.[0]
        ? Object.keys(data.Teams[0])
        : data.Members?.[0]
          ? Object.keys(data.Members[0])
          : Object.keys(data),
    };
  });

  // ── 6. Activity History ────────────────────────────────────────────────────

  await investigate("17. ActivityHistory filters", () =>
    apiGet("member/activityHistory/SearchPersonActivityTransfersFilters", token)
  );

  await investigate("18. ActivityHistory zoeken", async () => {
    const filters = await apiGet(
      "member/activityHistory/SearchPersonActivityTransfersFilters",
      token
    );
    try {
      const data = await apiPost("member/activityHistory/SearchPersonActivityTransfers", token, {
        Filters: filters,
      });
      if (!data.Error)
        return {
          aantalItems: data.Items?.length ?? data.Members?.length ?? "?",
          eersteItems: (data.Items || data.Members || []).slice(0, 5),
          alleKeys:
            data.Items?.[0] || data.Members?.[0]
              ? Object.keys(data.Items?.[0] || data.Members?.[0])
              : [],
        };
    } catch {}
    // Probeer direct met filters als body
    try {
      const data = await apiPost(
        "member/activityHistory/SearchPersonActivityTransfers",
        token,
        filters
      );
      if (!data.Error)
        return {
          aantalItems: data.Items?.length ?? data.Members?.length ?? "?",
          eersteItems: (data.Items || data.Members || []).slice(0, 5),
        };
    } catch {}
    return { error: "Niet gelukt" };
  });

  // ── 7. Training ────────────────────────────────────────────────────────────

  await investigate("19. TrainingReportFilters", () =>
    apiGet("activity/training/TrainingReportFilters", token)
  );

  await investigate("20. TrainingReport zoeken", async () => {
    const filters = await apiGet("activity/training/TrainingReportFilters", token);
    try {
      const data = await apiPost("activity/training/TrainingReport", token, filters);
      if (!data.Error) return data;
    } catch {}
    return { error: "Niet gelukt" };
  });

  // ── 8. Member-specifieke endpoints (met een bekend lid) ────────────────────

  // Probeer lid-specifieke endpoints met POST
  const testIds = ["NJF95S5", "NMV77N3", "NNJ35T4"]; // Bob Mans, Lara Mans, Moos Muller

  for (const testId of testIds) {
    const lidEndpoints = [
      "member/MemberHeader",
      "member/MemberPhoto",
      "member/activity/MemberGameActivities",
      "member/team/MemberTeams",
      "member/membership/MemberUnionMemberships",
      "member/history/MemberPlayerHistory",
      "member/history/MemberTeamHistory",
      "member/history/MemberMatchHistory",
      "member/history/MemberDisciplineHistory",
      "member/persondata/MemberPersonData",
      "member/remarks/MemberFreeFields",
      "member/function/MemberFunctions",
      "member/function/MemberCommittees",
      "member/certificate/MemberCertificates",
      "member/registrations/PersonClubHistory",
      "member/registrations/AvailableGameActivitiesForMember",
      "member/document/MemberDocuments",
    ];

    for (const ep of lidEndpoints) {
      // Probeer met verschillende body-formaten en methoden
      const attempts = [
        { method: "POST", body: { PublicPersonId: testId } },
        { method: "POST", body: { PersonId: testId } },
        { method: "POST", body: { Id: testId } },
        { method: "PUT", body: { PublicPersonId: testId } },
      ];

      for (const attempt of attempts) {
        try {
          const res = await fetch(`${NAVAJO_BASE}/${ep}`, {
            method: attempt.method,
            headers: hdrs(ep, token),
            body: JSON.stringify(attempt.body),
          });
          const data = await res.json();
          if (!data.Error && res.status < 400) {
            const label = `21+. ${ep} (${attempt.method} ${Object.keys(attempt.body)[0]}=${testId})`;
            console.log(`\n${"═".repeat(70)}`);
            console.log(`  ${label}`);
            console.log(`${"═".repeat(70)}\n`);
            console.log(JSON.stringify(data, null, 2).slice(0, 2000));
            report[label] = { status: "ok", data };
            break;
          }
        } catch {}
        await delay(100);
      }
      await delay(150);
    }
    // Als we hits hebben voor dit lid, hoeven we niet meer te proberen
    break;
  }

  // ── 9. Overige ─────────────────────────────────────────────────────────────

  await investigate("22. MemberPhotoPeriodConfiguration", () =>
    apiGet("member/MemberPhotoPeriodConfiguration", token)
  );

  await investigate("23. AssociatedClubPlayers", () =>
    apiGet("member/clubplayers/AssociatedClubPlayers", token)
  );

  await investigate("24. Anniversaries — Jubilea", () =>
    apiGet("member/anniversary/Anniversaries", token)
  );

  await investigate("25. UserTableColumnDefinitions — Kolominstellingen", () =>
    apiGet("user/UserTableColumnDefinitions", token)
  );

  await investigate("26. UserInfo", async () => {
    try {
      return await apiGet("user/UserInfo", token);
    } catch {}
    try {
      return await apiGet("club/Club", token);
    } catch {}
    return { error: "Niet beschikbaar" };
  });

  await investigate("27. ClubWebsiteUrl", async () => {
    try {
      return await apiGet("club/ClubWebsiteUrl", token);
    } catch {
      return { error: "Niet beschikbaar" };
    }
  });

  // ── Opslaan ────────────────────────────────────────────────────────────────

  writeFileSync("scripts/sportlink-discovery-deep-results.json", JSON.stringify(report, null, 2));
  console.log("\n\n✓ Volledig rapport opgeslagen in scripts/sportlink-discovery-deep-results.json");
}

// ─── Main ────────────────────────────────────────────────────────────────────

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-discovery-deep.mjs <email> <password>");
  process.exit(1);
}

try {
  const token = await login(email, password);
  console.log("✓ Ingelogd\n");
  await main(token);
  console.log("\n✓ Deep discovery compleet");
} catch (e) {
  console.error("✗ Fout:", e.message);
  process.exit(1);
}
