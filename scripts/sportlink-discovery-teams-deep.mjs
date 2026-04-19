/**
 * Sportlink Discovery — Deep dive: Teams, UnassignedPlayers, en overige endpoints
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

async function main(token) {
  const report = {};

  function section(title) {
    console.log(`\n${"═".repeat(70)}\n  ${title}\n${"═".repeat(70)}\n`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1. UnionTeams — volledig onderzoek
  // ═══════════════════════════════════════════════════════════════════════

  section("1. UnionTeams — Alle bondsteams volledig");
  const teamsData = await apiGet("team/UnionTeams", token);
  const teams = teamsData.Team || [];
  report.unionTeams = { count: teams.length, allKeys: teams[0] ? Object.keys(teams[0]) : [] };
  console.log(`Aantal teams: ${teams.length}`);
  console.log(`Velden per team: ${report.unionTeams.allKeys.join(", ")}`);

  // Groepeer per spelactiviteit
  const perActivity = {};
  for (const t of teams) {
    const act = t.GameActivityDescription || "Onbekend";
    if (!perActivity[act]) perActivity[act] = [];
    perActivity[act].push(t);
  }
  console.log("\nPer spelactiviteit:");
  for (const [act, ts] of Object.entries(perActivity)) {
    console.log(`  ${act}: ${ts.length} teams`);
    for (const t of ts) {
      console.log(
        `    ${t.TeamName} (${t.TeamCode}) — ${t.PlayerCount} spelers, ${t.TeamMemberCount} leden, ${t.Gender}`
      );
    }
  }

  // Volledig eerste team
  console.log("\nVolledig eerste team:");
  console.log(JSON.stringify(teams[0], null, 2));
  await delay(300);

  // ═══════════════════════════════════════════════════════════════════════
  // 2. Spelers per team ophalen — probeer alle body-formaten
  // ═══════════════════════════════════════════════════════════════════════

  section("2. Spelers per bondsteam ophalen");

  const testTeam = teams[0];
  console.log(`Test team: ${testTeam.TeamName} (${testTeam.PublicTeamId})\n`);

  // Uit de JS: team/teamperson/UnionTeamPlayers, ClubTeamPlayers
  // De JS toont: WorkingSetKernelTeamPerson, WorkingSetKernelTeamPersons
  const teamPlayerEndpoints = [
    "team/teamperson/UnionTeamPlayers",
    "team/teamperson/ClubTeamPlayers",
    "team/teamperson/UnionTeamNonPlayers",
    "team/teamperson/ClubTeamNonPlayers",
    "team/teamperson/WorkingSetKernelTeamPersons",
    "team/teamperson/SearchClubTeamPlayers",
    "team/teamperson/SearchUnionTeamPlayers",
    "team/teamperson/SearchUnionTeamNonPlayers",
    "team/teamperson/AddClubTeamPlayers",
    "team/teamperson/ClubTeamPlayersMultiple",
    "team/teamperson/UnionTeamPlayersMultiple",
    "team/TeamHeader",
    "team/TeamConnected",
  ];

  const bodyFormats = [
    { PublicTeamId: testTeam.PublicTeamId },
    { TeamId: testTeam.PublicTeamId },
    { PublicTeamId: testTeam.PublicTeamId, GameActivityIdTag: testTeam.GameActivityIdTag },
  ];

  for (const ep of teamPlayerEndpoints) {
    // GET met query params
    for (const params of [
      { PublicTeamId: testTeam.PublicTeamId },
      { TeamId: testTeam.PublicTeamId },
      { PublicTeamId: testTeam.PublicTeamId, GameActivityIdTag: testTeam.GameActivityIdTag },
    ]) {
      try {
        const data = await apiGet(ep, token, params);
        if (!data.Error) {
          console.log(`✓ GET ${ep} ?${new URLSearchParams(params)}`);
          console.log(`  ${JSON.stringify(data).slice(0, 500)}\n`);
          report[`GET ${ep}`] = { params, data };
          break;
        }
      } catch {}
      await delay(100);
    }

    // POST met body
    for (const body of bodyFormats) {
      try {
        const data = await apiPost(ep, token, body);
        if (!data.Error) {
          console.log(`✓ POST ${ep} ${JSON.stringify(body)}`);
          console.log(`  ${JSON.stringify(data).slice(0, 500)}\n`);
          report[`POST ${ep}`] = { body, data };
          break;
        }
      } catch {}
      await delay(100);
    }
    await delay(150);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. UnassignedPlayers — volledig onderzoek
  // ═══════════════════════════════════════════════════════════════════════

  section("3. UnassignedPlayers — Niet-ingedeelde spelers");

  // Filters ophalen
  const uaFilters = await apiGet("team/unassignedplayers/FiltersUnassignedPlayers", token);
  console.log("Filters:");
  console.log(JSON.stringify(uaFilters, null, 2));

  // Zoek met verschillende filter-combinaties
  const filterSets = [
    { label: "Default (alle filters)", filters: uaFilters },
    {
      label: "Alleen Veld",
      filters: {
        ...uaFilters,
        UnionActivity: uaFilters.UnionActivity?.map((a) => ({
          ...a,
          IsSelected: a.Id === "KORFBALL-VE-WK",
        })),
      },
    },
    {
      label: "Alleen Kangoeroe",
      filters: {
        ...uaFilters,
        UnionActivity: uaFilters.UnionActivity?.map((a) => ({
          ...a,
          IsSelected: a.Id === "KANGAROO",
        })),
      },
    },
  ];

  for (const { label, filters } of filterSets) {
    console.log(`\n--- ${label} ---`);

    // POST
    try {
      const data = await apiPost("team/unassignedplayers/SearchUnassignedPlayers", token, filters);
      if (!data.Error) {
        const persons = data.AssignablePersons || data.Items || data.Members || [];
        console.log(`POST: ${persons.length} spelers`);
        if (persons.length > 0) {
          console.log(`Velden: ${Object.keys(persons[0]).join(", ")}`);
          console.log(`Eerste 3:`);
          for (const p of persons.slice(0, 3)) {
            console.log(
              `  ${p.FullName} (${p.PublicPersonId}) — ${p.AgeClassDescription}, ${p.GenderCode}, ${p.MemberStatus}`
            );
          }
        }
        report[`UnassignedPlayers ${label}`] = {
          count: persons.length,
          keys: persons[0] ? Object.keys(persons[0]) : [],
        };
      }
    } catch {}

    // GET met params
    try {
      const data = await apiGet("team/unassignedplayers/SearchUnassignedPlayers", token);
      if (!data.Error) {
        const persons = data.AssignablePersons || [];
        console.log(`GET: ${persons.length} spelers`);
      }
    } catch {}

    await delay(300);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. TeamsForCompetitionTypeSeason — historische teams?
  // ═══════════════════════════════════════════════════════════════════════

  section("4. TeamsForCompetitionTypeSeason — historische indelingen?");

  // Uit de training filters weten we de seizoenen
  const seasons = [
    { id: "2025;01-07-2025;30-06-2026;31-12-2025", label: "2025-2026" },
    { id: "2024;01-07-2024;30-06-2025;31-12-2024", label: "2024-2025" },
    { id: "2023;01-07-2023;30-06-2024;31-12-2023", label: "2023-2024" },
  ];

  for (const season of seasons) {
    console.log(`\nSeizoen: ${season.label}`);
    // Probeer GET en POST met seizoen
    for (const params of [
      { SeasonId: season.id },
      { Season: season.label },
      { SeasonId: season.id, GameActivityId: "KORFBALL-VE-WK" },
    ]) {
      try {
        const data = await apiGet(
          "team/teamsforcompetitiontypeseason/TeamsForCompetitionTypeSeason",
          token,
          params
        );
        if (!data.Error) {
          console.log(`  ✓ GET ?${new URLSearchParams(params)}`);
          console.log(`  ${JSON.stringify(data).slice(0, 400)}\n`);
          report[`TeamsForSeason ${season.label}`] = data;
          break;
        }
      } catch {}
      try {
        const data = await apiPost(
          "team/teamsforcompetitiontypeseason/TeamsForCompetitionTypeSeason",
          token,
          params
        );
        if (!data.Error) {
          console.log(`  ✓ POST ${JSON.stringify(params)}`);
          console.log(`  ${JSON.stringify(data).slice(0, 400)}\n`);
          report[`TeamsForSeason ${season.label}`] = data;
          break;
        }
      } catch {}
      await delay(100);
    }
    await delay(200);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. MemberAttrition — verloop/retentie rapport
  // ═══════════════════════════════════════════════════════════════════════

  section("5. MemberProgressReport — Ledenverloop");

  // Probeer verschillende param-combinaties
  const attritionParams = [
    {},
    { Year: 2025 },
    { DateFrom: "2020-01-01" },
    { SeasonId: "2025;01-07-2025;30-06-2026;31-12-2025" },
  ];

  for (const params of attritionParams) {
    try {
      const data = await apiGet("member/attrition/MemberProgressReport", token, params);
      if (!data.Error) {
        console.log(`✓ GET ?${new URLSearchParams(params) || "(geen)"}`);
        console.log(JSON.stringify(data, null, 2).slice(0, 1500));
        report.memberProgressReport = data;
        break;
      }
    } catch {}
    try {
      const data = await apiPost("member/attrition/MemberProgressReport", token, params);
      if (!data.Error) {
        console.log(`✓ POST ${JSON.stringify(params)}`);
        console.log(JSON.stringify(data, null, 2).slice(0, 1500));
        report.memberProgressReport = data;
        break;
      }
    } catch {}
    await delay(200);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. MemberDetailCount — ledenaantallen
  // ═══════════════════════════════════════════════════════════════════════

  section("6. MemberDetailCount — Ledenaantallen");

  for (const params of [{}, { Year: 2025 }, { DateFrom: "2020-01-01" }]) {
    try {
      const data = await apiGet("member/membercount/MemberDetailCount", token, params);
      if (!data.Error) {
        console.log(`✓ GET ?${new URLSearchParams(params) || "(geen)"}`);
        console.log(JSON.stringify(data, null, 2).slice(0, 2000));
        report.memberDetailCount = data;
        break;
      }
    } catch {}
    try {
      const data = await apiPost("member/membercount/MemberDetailCount", token, params);
      if (!data.Error) {
        console.log(`✓ POST ${JSON.stringify(params)}`);
        console.log(JSON.stringify(data, null, 2).slice(0, 2000));
        report.memberDetailCount = data;
        break;
      }
    } catch {}
    await delay(200);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. SearchTeams — teams zoeken met filters
  // ═══════════════════════════════════════════════════════════════════════

  section("7. SearchTeams — Teams zoeken");

  const teamExtFilters = await apiGet("member/search/FilterTeamsExtended", token);
  const teamSimpleFilters = await apiGet("member/search/FilterTeamsSimple", token);

  // Log alle beschikbare union teams uit de simple filter
  console.log("Beschikbare bondsteams in filter:");
  if (teamSimpleFilters.UnionTeam?.Options) {
    for (const opt of teamSimpleFilters.UnionTeam.Options) {
      console.log(`  ${opt.Id}: ${opt.Description}`);
    }
  }

  // Probeer search
  try {
    const data = await apiPost("member/search/SearchTeams", token, {
      Filters: { InputExtended: teamExtFilters, InputSimple: teamSimpleFilters },
    });
    if (!data.Error) {
      const key = Object.keys(data).find((k) => Array.isArray(data[k])) || Object.keys(data)[0];
      console.log(`\nSearchTeams response key: "${key}"`);
      console.log(`Alle keys: ${Object.keys(data).join(", ")}`);
      console.log(JSON.stringify(data).slice(0, 1000));
      report.searchTeams = { keys: Object.keys(data), firstKey: key };
    }
  } catch (e) {
    console.log(`SearchTeams mislukt: ${e.message}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 8. Dashboard details — meer info uit PersonChanges
  // ═══════════════════════════════════════════════════════════════════════

  section("8. Dashboard — DashboardPersonChanges met params");

  for (const params of [
    {},
    { DayRange: 30 },
    { DayRange: 90 },
    { DayRange: 365 },
    { DateFrom: "2025-01-01" },
  ]) {
    try {
      const data = await apiGet("user/dashboard/DashboardPersonChanges", token, params);
      if (!data.Error) {
        console.log(
          `GET ?${new URLSearchParams(params) || "(geen)"}: TotalCount=${data.TotalCount}, UnreadCount=${data.UnreadCount}, DayRange=${data.DayRange}`
        );
      }
    } catch {}
    await delay(100);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 9. Overige endpoints uit de JS die we nog niet geprobeerd hebben
  // ═══════════════════════════════════════════════════════════════════════

  section("9. Extra endpoints uit JS bundle");

  const extraEndpoints = [
    // Competitie
    "competition/match/MatchProgramFilters",
    "competition/match/MatchDateRangeShortcuts",
    "competition/match/MatchResultFilters",
    // Club
    "club/Club",
    "club/addresscontact/AddressContact",
    // Transfers
    "member/transfers/ClubTransfers",
    "member/transfers/TransferUpgradeRequests",
    "member/transfers/GrantedTransfers",
    // Functies
    "member/function/UnionFunctionsLastUpdate",
    // Registraties
    "member/registrations/AddMemberConfig",
    "member/registrations/TransferConfig",
    // Foys (ereleden?)
    "member/foys/FoysMemberList",
  ];

  for (const ep of extraEndpoints) {
    try {
      const data = await apiGet(ep, token);
      if (!data.Error) {
        console.log(`✓ GET ${ep}`);
        console.log(`  ${JSON.stringify(data).slice(0, 400)}\n`);
        report[ep] = data;
      }
    } catch {}
    await delay(150);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Opslaan
  // ═══════════════════════════════════════════════════════════════════════

  writeFileSync("scripts/sportlink-discovery-teams-deep.json", JSON.stringify(report, null, 2));
  console.log("\n✓ Rapport opgeslagen in scripts/sportlink-discovery-teams-deep.json");
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-discovery-teams-deep.mjs <email> <password>");
  process.exit(1);
}
try {
  const token = await login(email, password);
  console.log("✓ Ingelogd\n");
  await main(token);
  console.log("\n✓ Deep dive compleet");
} catch (e) {
  console.error("✗ Fout:", e.message);
  process.exit(1);
}
