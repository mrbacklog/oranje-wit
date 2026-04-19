/**
 * Sportlink — Diep graven naar historische teamdata
 *
 * Strategie:
 * 1. TeamPlayerStatistics bevatte 412KB — daar zit mogelijk seizoensdata in
 * 2. MemberTeams met ShowInactive=true en seizoensparameters
 * 3. Historische team-IDs — teams hebben per seizoen een ander PublicTeamId?
 * 4. Competition endpoints met seizoensfilters
 * 5. Probeer alle parameters uit de JS bundle
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

async function apiGet(entity, token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${NAVAJO_BASE}/${entity}?${qs}` : `${NAVAJO_BASE}/${entity}`;
  const res = await fetch(url, { headers: hdrs(entity, token) });
  return { status: res.status, data: await res.json() };
}

async function apiPost(entity, token, body = {}) {
  const res = await fetch(`${NAVAJO_BASE}/${entity}`, {
    method: "POST",
    headers: hdrs(entity, token),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const FREEK = "NLV80M3";
const ANTJAN = "NFW92M3";

function section(title) {
  console.log(`\n${"═".repeat(70)}\n  ${title}\n${"═".repeat(70)}\n`);
}

async function main(token) {
  // ═══════════════════════════════════════════════════════════════════════
  // 1. TeamPlayerStatistics — 412KB aan data, bevat dit historische info?
  // ═══════════════════════════════════════════════════════════════════════

  section("1. TeamPlayerStatistics — analyseer seizoensdata");

  // Haal de teams op
  const { data: teamsData } = await apiGet("team/UnionTeams", token);
  const teams = teamsData.Team || [];

  // Pak een team waar Freek in zat (U15-1 Veld)
  const u15Veld = teams.find(
    (t) => t.TeamName.includes("U15-1") && t.GameActivityDescription === "Veld"
  );
  if (u15Veld) {
    const { data: stats } = await apiGet("team/teamplayerstatistics/TeamPlayerStatistics", token, {
      PublicTeamId: u15Veld.PublicTeamId,
    });
    const items = stats.Items || [];
    console.log(`U15-1 Veld (${u15Veld.PublicTeamId}): ${items.length} spelers in statistieken`);

    // Zoek Freek
    const freekStats = items.find((i) => i.PersonId === FREEK);
    if (freekStats) {
      console.log("\nFreek in TeamPlayerStatistics:");
      console.log(JSON.stringify(freekStats, null, 2));
    }

    // Check of er spelers in staan die NIET in het huidige team zitten
    // (dat zou historische data zijn)
    const { data: currentPlayers } = await apiGet("team/teamperson/UnionTeamPlayers", token, {
      PublicTeamId: u15Veld.PublicTeamId,
    });
    const currentIds = new Set((currentPlayers.Person || []).map((p) => p.PublicPersonId));
    const historische = items.filter((i) => !currentIds.has(i.PersonId));
    console.log(`\nSpelers in statistieken maar NIET in huidig team: ${historische.length}`);
    for (const h of historische.slice(0, 10)) {
      console.log(
        `  ${h.FullName} — ${h.TotalMatches} wedstrijden, ${h.DisciplineTypeDescription}`
      );
    }

    // Bekijk of DisciplineTypeDescription seizoensinfo bevat
    const disciplines = [...new Set(items.map((i) => i.DisciplineTypeDescription))];
    console.log(`\nDisciplineTypes: ${disciplines.join(", ")}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. MemberTeams met ShowInactive en seizoensparameters
  // ═══════════════════════════════════════════════════════════════════════

  section("2. MemberTeams — alle parameter-variaties voor Freek");

  const memberTeamsParams = [
    { PublicPersonId: FREEK, ShowInactive: "true" },
    { PublicPersonId: FREEK, ShowInactive: "false" },
    { PublicPersonId: FREEK, ShowInactive: true },
    { PublicPersonId: FREEK, IncludeHistory: "true" },
    { PublicPersonId: FREEK, ShowAll: "true" },
    { PublicPersonId: FREEK, All: "true" },
    { PublicPersonId: FREEK, SeasonId: "2024" },
    { PublicPersonId: FREEK, SeasonId: "2023" },
    { PublicPersonId: FREEK, SeasonId: "2022" },
    { PublicPersonId: FREEK, Season: "2024-2025" },
    { PublicPersonId: FREEK, Season: "2023-2024" },
    { PublicPersonId: FREEK, GameActivityIdTag: "KORFBALL-VE-WK/STANDARD" },
  ];

  for (const params of memberTeamsParams) {
    const { data } = await apiGet("member/team/MemberTeams", token, params);
    const teamCount = data.Team?.length ?? 0;
    if (teamCount > 0 || !data.Error) {
      const qs = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
      console.log(`?${qs} → ${teamCount} teams`);
      if (teamCount > 0) {
        for (const t of data.Team) {
          console.log(
            `  ${t.TeamName} ${t.GameTypeDescription} ${t.SeasonDescription} — ${t.RelationStart} tot ${t.RelationEnd || "heden"}`
          );
        }
      }
    }
    await delay(100);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. MemberPlayerHistory en MemberTeamHistory met seizoensparams
  // ═══════════════════════════════════════════════════════════════════════

  section("3. History endpoints met seizoensparameters");

  const historyEndpoints = [
    "member/history/MemberPlayerHistory",
    "member/history/MemberTeamHistory",
    "member/history/MemberMatchHistory",
  ];

  const historyParams = [
    { PublicPersonId: ANTJAN }, // Senior met meer historie
    { PublicPersonId: ANTJAN, SeasonId: "2024" },
    { PublicPersonId: ANTJAN, SeasonId: "2023" },
    { PublicPersonId: ANTJAN, Season: "2024-2025" },
    { PublicPersonId: ANTJAN, DateFrom: "2020-01-01" },
    { PublicPersonId: ANTJAN, ShowAll: "true" },
    { PublicPersonId: ANTJAN, IncludeHistory: "true" },
    { PublicPersonId: ANTJAN, All: "true" },
  ];

  for (const ep of historyEndpoints) {
    console.log(`\n--- ${ep} ---`);
    for (const params of historyParams) {
      const { data } = await apiGet(ep, token, params);
      if (data.Error) continue;
      const key = Object.keys(data).find((k) => Array.isArray(data[k]));
      const items = key ? data[key] : [];
      const qs = Object.entries(params)
        .filter(([k]) => k !== "PublicPersonId")
        .map(([k, v]) => `${k}=${v}`)
        .join("&");
      if (items.length > 0) {
        console.log(`  ?${qs || "(default)"} → ${items.length} items`);
        // Toon unieke teams/seizoenen
        if (items[0].TeamName) {
          const uniqueTeams = [
            ...new Set(
              items.map(
                (i) =>
                  `${i.TeamName} ${i.GameActivityDescription || ""} ${i.CompetitionTypeName || ""}`
              )
            ),
          ];
          for (const t of uniqueTeams) console.log(`    ${t}`);
        }
      }
      await delay(100);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. DisciplineHistory — deze gaat WEL ver terug (seizoensgewijs)
  // ═══════════════════════════════════════════════════════════════════════

  section("4. DisciplineHistory — seizoensoverzicht als proxy voor teamhistorie");

  // Antjan's discipline history ging terug tot 2015-2016
  // Probeer voor meer spelers
  const testSpelers = [
    { id: "NFW26D7", name: "Arthijn Muller" }, // Lang lid
    { id: "NFW28G4", name: "Lieke Bakker" }, // Lang lid
    { id: "NJF95S5", name: "Bob Mans" }, // Senior
    { id: FREEK, name: "Freek Laban" },
  ];

  for (const speler of testSpelers) {
    const { data } = await apiGet("member/history/MemberDisciplineHistory", token, {
      PublicPersonId: speler.id,
    });
    const items = data.Discipline || [];
    if (items.length > 0) {
      console.log(`${speler.name}: ${items.length} seizoenen`);
      for (const d of items) {
        console.log(
          `  ${d.SeasonDescription} — ${d.DisciplineTypeDescription} — ${d.RoleDescription}`
        );
      }
    }
    await delay(200);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Competition endpoints — wedstrijden bevatten teamsamenstelling
  // ═══════════════════════════════════════════════════════════════════════

  section("5. Competition/Match endpoints zoeken");

  const compEndpoints = [
    "competition/match/MatchProgram",
    "competition/match/MatchResults",
    "competition/match/MatchProgramFilters",
    "competition/match/MatchResultFilters",
    "competition/Standing",
    "competition/Standings",
    "competition/CompetitionOverview",
    "competition/match/MatchDateRangeShortcuts",
  ];

  for (const ep of compEndpoints) {
    const { data } = await apiGet(ep, token);
    if (!data.Error) {
      console.log(`✓ GET ${ep} (${JSON.stringify(data).length} bytes)`);
      console.log(`  Keys: ${Object.keys(data).join(", ")}`);
      console.log(`  ${JSON.stringify(data).slice(0, 300)}\n`);
    }
    await delay(150);
  }

  // Probeer MatchResults met historische datums
  console.log("\n--- MatchResults met datumfilters ---");
  const matchDates = [
    { DateFrom: "2024-07-01", DateTo: "2025-06-30" }, // Seizoen 2024-2025
    { DateFrom: "2023-07-01", DateTo: "2024-06-30" }, // Seizoen 2023-2024
  ];

  for (const params of matchDates) {
    const { data } = await apiGet("competition/match/MatchResults", token, params);
    if (!data.Error) {
      const matches = data.Matches || [];
      console.log(`${params.DateFrom} - ${params.DateTo}: ${matches.length} wedstrijden`);
      for (const m of matches.slice(0, 3)) {
        console.log(
          `  ${m.MatchDate || m.Date} — ${m.MatchDescription || m.Description || JSON.stringify(m).slice(0, 100)}`
        );
      }
    }
    await delay(200);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. Probeer team/TeamsForCompetitionTypeSeason met alle paramformaten
  // ═══════════════════════════════════════════════════════════════════════

  section("6. TeamsForCompetitionTypeSeason — alle paramformaten");

  const seasonFormats = [
    { CompetitionType: "VE", Season: "2024" },
    { CompetitionType: "VE", SeasonId: "2024" },
    { CompetitionType: "KORFBALL-VE-WK", Season: "2024-2025" },
    { GameActivityId: "KORFBALL-VE-WK", SeasonId: "2024" },
    { GameActivityIdTag: "KORFBALL-VE-WK/STANDARD", SeasonId: "2024" },
    { GameActivityIdTag: "KORFBALL-VE-WK/STANDARD" },
    {},
  ];

  for (const params of seasonFormats) {
    for (const method of ["GET", "POST"]) {
      const result =
        method === "GET"
          ? await apiGet(
              "team/teamsforcompetitiontypeseason/TeamsForCompetitionTypeSeason",
              token,
              params
            )
          : await apiPost(
              "team/teamsforcompetitiontypeseason/TeamsForCompetitionTypeSeason",
              token,
              params
            );
      if (!result.data.Error) {
        console.log(
          `✓ ${method} ?${new URLSearchParams(params)} → ${JSON.stringify(result.data).length} bytes`
        );
        console.log(`  ${JSON.stringify(result.data).slice(0, 400)}\n`);
      }
      await delay(100);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. Probeer WorkingSet — misschien bevat dit seizoenshistorie
  // ═══════════════════════════════════════════════════════════════════════

  section("7. WorkingSet endpoints");

  if (u15Veld) {
    for (const ep of [
      "team/teamperson/WorkingSetKernelTeamPersons",
      "team/teamperson/WorkingSetKernelTeamPerson",
    ]) {
      for (const params of [
        { PublicTeamId: u15Veld.PublicTeamId },
        { PublicTeamId: u15Veld.PublicTeamId, ShowAll: "true" },
        { PublicTeamId: u15Veld.PublicTeamId, IncludeHistory: "true" },
      ]) {
        const { data } = await apiGet(ep, token, params);
        if (!data.Error && JSON.stringify(data).length > 30) {
          console.log(`✓ GET ${ep} ?${new URLSearchParams(params)}`);
          console.log(`  ${JSON.stringify(data).slice(0, 500)}\n`);
        }
        await delay(100);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 8. Probeer de SearchTeams met team-specifieke filters per seizoen
  // ═══════════════════════════════════════════════════════════════════════

  section("8. SearchTeams met seizoensfilters");

  const { data: teamFiltersExt } = await apiGet("member/search/FilterTeamsExtended", token);
  const { data: teamFiltersSim } = await apiGet("member/search/FilterTeamsSimple", token);

  // Selecteer een specifiek team in de filter
  if (teamFiltersSim.UnionTeam?.Options?.length > 0) {
    // Selecteer U15-1 Veld
    const u15Option = teamFiltersSim.UnionTeam.Options.find(
      (o) => o.Description.includes("U15-1") && o.Description.includes("Veld")
    );
    if (u15Option) {
      const modifiedSimple = JSON.parse(JSON.stringify(teamFiltersSim));
      for (const opt of modifiedSimple.UnionTeam.Options) {
        opt.IsSelected = opt.Id === u15Option.Id;
      }

      const { data: searchResult } = await apiPost("member/search/SearchTeams", token, {
        Filters: { InputExtended: teamFiltersExt, InputSimple: modifiedSimple },
      });

      if (!searchResult.Error) {
        console.log(`SearchTeams voor U15-1 Veld:`);
        console.log(`  Keys: ${Object.keys(searchResult).join(", ")}`);
        const members = searchResult.Members || searchResult.Teams || searchResult.Items || [];
        console.log(`  Resultaten: ${members.length}`);
        if (members.length > 0) {
          console.log(`  Velden eerste item: ${Object.keys(members[0]).join(", ")}`);
          for (const m of members.slice(0, 5)) {
            console.log(`  ${m.FullName || m.TeamName || JSON.stringify(m).slice(0, 100)}`);
          }
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 9. ActivityHistory — seizoensoverzicht met filters
  // ═══════════════════════════════════════════════════════════════════════

  section("9. ActivityHistory — spelactiviteit-wijzigingen per seizoen");

  const { data: actFilters } = await apiGet(
    "member/activityHistory/SearchPersonActivityTransfersFilters",
    token
  );

  // Probeer met verschillende filter-combinaties
  const actSearchBodies = [
    actFilters,
    {
      ...actFilters,
      RelationType: actFilters.RelationType?.map((r) => ({
        ...r,
        IsSelected: r.Id === "KERNELMEMBER",
      })),
    },
  ];

  for (const body of actSearchBodies) {
    const { data } = await apiPost(
      "member/activityHistory/SearchPersonActivityTransfers",
      token,
      body
    );
    if (!data.Error) {
      const items = data.Items || data.Members || data.Transfers || [];
      console.log(`POST SearchPersonActivityTransfers → ${items.length} items`);
      if (items.length > 0) {
        console.log(`Velden: ${Object.keys(items[0]).join(", ")}`);
        for (const i of items.slice(0, 5)) {
          console.log(`  ${JSON.stringify(i).slice(0, 200)}`);
        }
      }
    }
    await delay(200);
  }

  // Probeer ook met Filters wrapper (zoals SearchMembers)
  const { data: actSearch2 } = await apiPost(
    "member/activityHistory/SearchPersonActivityTransfers",
    token,
    { Filters: actFilters }
  );
  if (!actSearch2.Error) {
    const items = actSearch2.Items || actSearch2.Members || [];
    console.log(`\nMet Filters wrapper: ${items.length} items`);
  }

  console.log("\n\n✓ Diep graven compleet");
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-history-deep.mjs <email> <password>");
  process.exit(1);
}
try {
  const token = await login(email, password);
  console.log("✓ Ingelogd");
  await main(token);
} catch (e) {
  console.error("✗ Fout:", e.message);
  process.exit(1);
}
