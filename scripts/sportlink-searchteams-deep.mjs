/**
 * Sportlink SearchTeams — diepgaand onderzoek
 *
 * Wat geeft SearchTeams dat SearchMembers of UnionTeamPlayers niet geeft?
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

async function apiGet(entity, token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${NAVAJO_BASE}/${entity}?${qs}` : `${NAVAJO_BASE}/${entity}`;
  return (await fetch(url, { headers: hdrs(entity, token) })).json();
}

async function apiPost(entity, token, body) {
  return (
    await fetch(`${NAVAJO_BASE}/${entity}`, {
      method: "POST",
      headers: hdrs(entity, token),
      body: JSON.stringify(body),
    })
  ).json();
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function main(token) {
  // Haal filters op
  const extFilters = await apiGet("member/search/FilterTeamsExtended", token);
  const simpleFilters = await apiGet("member/search/FilterTeamsSimple", token);

  console.log("═══ FilterTeamsExtended — beschikbare filters ═══\n");
  for (const [key, val] of Object.entries(extFilters)) {
    if (val && typeof val === "object" && val.Options) {
      console.log(`${key} (${val.Label || ""}):`);
      for (const opt of val.Options) {
        console.log(`  ${opt.Id}: ${opt.Description} (selected: ${opt.IsSelected})`);
      }
      console.log();
    }
  }

  console.log("\n═══ FilterTeamsSimple — beschikbare teams ═══\n");
  for (const [key, val] of Object.entries(simpleFilters)) {
    if (val && typeof val === "object" && val.Options) {
      console.log(`${key} (${val.Label || ""}): ${val.Options.length} opties`);
      if (key === "Role") {
        for (const opt of val.Options) {
          console.log(`  ${opt.Id}: ${opt.Description}`);
        }
      }
      console.log();
    }
  }

  // ═══ Zoek per team — vergelijk een paar teams ═══

  const testTeams = [
    { label: "OW 1 Veld", id: "18955" },
    {
      label: "U15-1 Veld",
      id: simpleFilters.UnionTeam?.Options?.find(
        (o) => o.Description.includes("U15-1") && o.Description.includes("Veld")
      )?.Id,
    },
    {
      label: "J5 Veld",
      id: simpleFilters.UnionTeam?.Options?.find(
        (o) => o.Description.includes("J5") && o.Description.includes("Veld")
      )?.Id,
    },
  ];

  for (const team of testTeams) {
    if (!team.id) continue;

    console.log(`\n═══ SearchTeams: ${team.label} (${team.id}) ═══\n`);

    const modifiedSimple = JSON.parse(JSON.stringify(simpleFilters));
    for (const opt of modifiedSimple.UnionTeam.Options) {
      opt.IsSelected = opt.Id === team.id;
    }

    const result = await apiPost("member/search/SearchTeams", token, {
      Filters: { InputExtended: extFilters, InputSimple: modifiedSimple },
    });

    const members = result.Members || [];
    console.log(`${members.length} leden gevonden\n`);

    if (members.length > 0) {
      // Toon alle velden die SearchTeams heeft maar SearchMembers niet
      // (of die anders gevuld zijn)
      const teamSpecificFields = [
        "TypeOfTeam",
        "TypeOfTeamDescription",
        "TeamId",
        "TeamName",
        "TeamRoleDescription",
        "TeamFunctionDescription",
        "TeamPersonStartDate",
        "TeamPersonEndDate",
        "TeamPersonRemarks",
        "IsPlayer",
        "ShirtNumber",
        "GameTypeDescription",
        "GameDayDescription",
        "IsOnMatchForm",
        "TeamAgeClassDescription",
        "PreferredTasks",
        "Status",
      ];

      console.log("Team-specifieke velden per lid:");
      for (const m of members.slice(0, 5)) {
        console.log(`\n  ${m.FullName} (${m.PublicPersonId}):`);
        for (const field of teamSpecificFields) {
          if (m[field] !== undefined && m[field] !== null && m[field] !== "") {
            console.log(`    ${field}: ${m[field]}`);
          }
        }
        // Ook ClubTeams en KernelGameActivities
        if (m.ClubTeams) console.log(`    ClubTeams: ${m.ClubTeams}`);
        if (m.KernelGameActivities)
          console.log(`    KernelGameActivities: ${m.KernelGameActivities}`);
        if (m.ClubGameActivities) console.log(`    ClubGameActivities: ${m.ClubGameActivities}`);
      }

      // Vergelijk met UnionTeamPlayers
      console.log("\n\n--- Vergelijking met UnionTeamPlayers ---");
      // Zoek het UnionTeam PublicTeamId
      const unionTeams = await apiGet("team/UnionTeams", token);
      const matchingTeam = unionTeams.Team?.find((t) => {
        const desc = `${t.TeamCode} - ${t.Gender.toLowerCase()} [${t.GameActivityDescription}]`;
        const simpleDesc = simpleFilters.UnionTeam.Options.find(
          (o) => o.Id === team.id
        )?.Description;
        return simpleDesc && (desc === simpleDesc || t.TeamName.includes(team.label.split(" ")[1]));
      });

      if (matchingTeam) {
        const unionPlayers = await apiGet("team/teamperson/UnionTeamPlayers", token, {
          PublicTeamId: matchingTeam.PublicTeamId,
        });
        const unionIds = new Set((unionPlayers.Person || []).map((p) => p.PublicPersonId));
        const searchIds = new Set(members.map((m) => m.PublicPersonId));

        const inSearchNotUnion = members.filter((m) => !unionIds.has(m.PublicPersonId));
        const inUnionNotSearch = (unionPlayers.Person || []).filter(
          (p) => !searchIds.has(p.PublicPersonId)
        );

        console.log(`SearchTeams: ${members.length} leden`);
        console.log(`UnionTeamPlayers: ${unionPlayers.Person?.length || 0} personen`);
        console.log(`In SearchTeams maar niet in UnionTeamPlayers: ${inSearchNotUnion.length}`);
        for (const m of inSearchNotUnion) {
          console.log(
            `  ${m.FullName} — rol: ${m.TeamRoleDescription}, functie: ${m.TeamFunctionDescription || "-"}`
          );
        }
        console.log(`In UnionTeamPlayers maar niet in SearchTeams: ${inUnionNotSearch.length}`);
        for (const p of inUnionNotSearch) {
          console.log(`  ${p.FullName} — rol: ${p.RoleDescription}`);
        }
      }
    }

    await delay(500);
  }

  // ═══ Zoek ZONDER team-filter — alle teamleden ═══
  console.log("\n\n═══ SearchTeams zonder team-filter (alle teamleden) ═══\n");

  const noFilterResult = await apiPost("member/search/SearchTeams", token, {
    Filters: { InputExtended: extFilters, InputSimple: simpleFilters },
  });
  const allMembers = noFilterResult.Members || [];
  console.log(`Totaal: ${allMembers.length} leden met teamkoppeling`);

  if (allMembers.length > 0) {
    // Groepeer per team
    const perTeam = {};
    for (const m of allMembers) {
      const key = `${m.TeamName} [${m.GameTypeDescription}]`;
      if (!perTeam[key]) perTeam[key] = [];
      perTeam[key].push(m);
    }

    console.log(`\nPer team:`);
    for (const [team, members] of Object.entries(perTeam).sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      const spelers = members.filter((m) => m.IsPlayer === true || m.IsPlayer === "true");
      const staf = members.filter((m) => m.IsPlayer === false || m.IsPlayer === "false");
      console.log(
        `  ${team}: ${members.length} leden (${spelers.length} spelers, ${staf.length} staf)`
      );
    }

    // Unieke rollen
    const rollen = [...new Set(allMembers.map((m) => m.TeamRoleDescription).filter(Boolean))];
    console.log(`\nUnieke rollen: ${rollen.join(", ")}`);

    // Unieke functies
    const functies = [...new Set(allMembers.map((m) => m.TeamFunctionDescription).filter(Boolean))];
    console.log(`Unieke functies: ${functies.join(", ")}`);
  }

  console.log("\n✓ SearchTeams onderzoek compleet");
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-searchteams-deep.mjs <email> <password>");
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
