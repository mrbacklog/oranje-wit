/**
 * SearchTeams — zoek naar historische opties
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
  const extFilters = await apiGet("member/search/FilterTeamsExtended", token);
  const simpleFilters = await apiGet("member/search/FilterTeamsSimple", token);

  // OW 1 Veld als testteam
  const teamId = "18955";

  const modifiedSimple = JSON.parse(JSON.stringify(simpleFilters));
  for (const opt of modifiedSimple.UnionTeam.Options) {
    opt.IsSelected = opt.Id === teamId;
  }

  const baseBody = { Filters: { InputExtended: extFilters, InputSimple: modifiedSimple } };

  console.log("═══ SearchTeams met historische parameters ═══\n");
  console.log("Test team: OW 1 Veld (18955)\n");

  // 1. Probeer query params op de POST
  const queryParams = [
    {},
    { ShowInactive: "true" },
    { IncludeHistory: "true" },
    { ShowAll: "true" },
    { DateFrom: "2020-01-01" },
    { DateFrom: "2024-07-01" },
    { SeasonId: "2024" },
    { SeasonId: "2023" },
    { Season: "2024-2025" },
    { Season: "2023-2024" },
    { IncludeFormerMembers: "true" },
    { IncludeInactive: "true" },
    { All: "true" },
  ];

  for (const params of queryParams) {
    const qs = new URLSearchParams(params).toString();
    try {
      const url = qs
        ? `${NAVAJO_BASE}/member/search/SearchTeams?${qs}`
        : `${NAVAJO_BASE}/member/search/SearchTeams`;
      const res = await fetch(url, {
        method: "POST",
        headers: hdrs("member/search/SearchTeams", token),
        body: JSON.stringify(baseBody),
      });
      const data = await res.json();
      if (!data.Error) {
        const members = data.Members || [];
        console.log(`POST ?${qs || "(geen)"} → ${members.length} leden`);
        if (members.length > 0) {
          // Check of er leden met TeamPersonEndDate bij zitten
          const withEnd = members.filter((m) => m.TeamPersonEndDate);
          const inactive = members.filter((m) => m.Status !== "ACTIVE");
          if (withEnd.length > 0 || inactive.length > 0) {
            console.log(`  ▲ Met TeamPersonEndDate: ${withEnd.length}`);
            console.log(`  ▲ Niet-actief: ${inactive.length}`);
            for (const m of withEnd) {
              console.log(
                `    ${m.FullName} — ${m.TeamPersonStartDate} tot ${m.TeamPersonEndDate}`
              );
            }
          }
        }
      }
    } catch {}
    await delay(150);
  }

  // 2. Probeer extra velden in het filter-object
  console.log("\n═══ Met aangepaste filter-body ═══\n");

  const extVariations = [
    {
      label: "ShowInactive in ext",
      mod: () => {
        const e = JSON.parse(JSON.stringify(extFilters));
        e.ShowInactive = true;
        return e;
      },
    },
    {
      label: "IncludeHistory in ext",
      mod: () => {
        const e = JSON.parse(JSON.stringify(extFilters));
        e.IncludeHistory = true;
        return e;
      },
    },
    {
      label: "IncludeFormer in ext",
      mod: () => {
        const e = JSON.parse(JSON.stringify(extFilters));
        e.IncludeFormer = true;
        return e;
      },
    },
    {
      label: "OnMatchForm=false",
      mod: () => {
        const e = JSON.parse(JSON.stringify(extFilters));
        if (e.OnMatchForm?.Options) {
          for (const opt of e.OnMatchForm.Options) opt.IsSelected = false;
        }
        return e;
      },
    },
  ];

  for (const { label, mod } of extVariations) {
    try {
      const body = { Filters: { InputExtended: mod(), InputSimple: modifiedSimple } };
      const data = await apiPost("member/search/SearchTeams", token, body);
      if (!data.Error) {
        const members = data.Members || [];
        console.log(`${label} → ${members.length} leden`);
      }
    } catch {}
    await delay(150);
  }

  // 3. Probeer ALLE teams tegelijk selecteren
  console.log("\n═══ Alle teams tegelijk selecteren ═══\n");

  const allSelected = JSON.parse(JSON.stringify(simpleFilters));
  if (allSelected.UnionTeam?.Options) {
    for (const opt of allSelected.UnionTeam.Options) {
      opt.IsSelected = true;
    }
  }

  try {
    const data = await apiPost("member/search/SearchTeams", token, {
      Filters: { InputExtended: extFilters, InputSimple: allSelected },
    });
    if (!data.Error) {
      const members = data.Members || [];
      console.log(`Alle 59 teams geselecteerd → ${members.length} leden`);

      if (members.length > 0) {
        // Groepeer per team
        const perTeam = {};
        for (const m of members) {
          const key = `${m.TeamName} [${m.GameTypeDescription}]`;
          if (!perTeam[key]) perTeam[key] = [];
          perTeam[key].push(m);
        }
        console.log(`Unieke teams: ${Object.keys(perTeam).length}`);
        for (const [team, ms] of Object.entries(perTeam)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(0, 10)) {
          console.log(`  ${team}: ${ms.length} leden`);
        }
        if (Object.keys(perTeam).length > 10) {
          console.log(`  ... +${Object.keys(perTeam).length - 10} teams`);
        }

        // Totaal unieke personen
        const uniquePersons = new Set(members.map((m) => m.PublicPersonId));
        console.log(`\nUnieke personen: ${uniquePersons.size}`);
        console.log(`Totale rijen (persoon kan in meerdere teams): ${members.length}`);

        // Check dubbelen (zelfde persoon in Veld + Zaal)
        const personTeams = {};
        for (const m of members) {
          if (!personTeams[m.PublicPersonId]) personTeams[m.PublicPersonId] = [];
          personTeams[m.PublicPersonId].push(`${m.TeamName} [${m.GameTypeDescription}]`);
        }
        const multiTeam = Object.entries(personTeams).filter(([, teams]) => teams.length > 1);
        console.log(`Personen in meerdere teams: ${multiTeam.length}`);
        for (const [id, teams] of multiTeam.slice(0, 5)) {
          const name = members.find((m) => m.PublicPersonId === id)?.FullName;
          console.log(`  ${name}: ${teams.join(", ")}`);
        }
      }
    }
  } catch (e) {
    console.log(`Fout: ${e.message}`);
  }

  // 4. Probeer alleen Veld-teams
  console.log("\n═══ Alleen Veld-teams ═══\n");

  const veldOnly = JSON.parse(JSON.stringify(allSelected));
  // Filter op alleen Veld in extended
  const modExt = JSON.parse(JSON.stringify(extFilters));
  if (modExt.Activity?.Options) {
    for (const opt of modExt.Activity.Options) {
      opt.IsSelected = opt.Id === "KORFBALL-VE-WK/STANDARD";
    }
  }

  try {
    const data = await apiPost("member/search/SearchTeams", token, {
      Filters: { InputExtended: modExt, InputSimple: allSelected },
    });
    if (!data.Error) {
      const members = data.Members || [];
      console.log(`Alle teams + Veld filter → ${members.length} leden`);
      const uniqueTeams = [...new Set(members.map((m) => m.TeamName))];
      console.log(`Teams: ${uniqueTeams.join(", ")}`);
    }
  } catch {}

  console.log("\n✓ Compleet");
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-searchteams-history.mjs <email> <password>");
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
