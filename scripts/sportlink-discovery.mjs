/**
 * Sportlink API Discovery Script
 *
 * Verkent de Navajo API om te ontdekken welke endpoints en data beschikbaar zijn.
 * Gebruik: node scripts/sportlink-discovery.mjs <email> <password>
 */

import crypto from "crypto";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";
const CLUB_ID = "NCX19J3";

// ─── Auth (gekopieerd uit client.ts) ─────────────────────────────────────────

function extractCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  if (!raw) return [];
  return raw.split(/,\s*(?=[A-Z_]+=)/i).filter(Boolean);
}

function cookieString(cookies) {
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

async function login(email, password) {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  const state = crypto.randomBytes(16).toString("hex");

  const authUrl =
    `${KEYCLOAK_BASE}/protocol/openid-connect/auth?` +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

  const authRes = await fetch(authUrl, { redirect: "manual" });
  const authHtml = await authRes.text();
  const cookies = extractCookies(authRes.headers);
  const cookieStr = cookieString(cookies);
  const actionMatch = authHtml.match(/action="([^"]+)"/);
  if (!actionMatch) throw new Error("Geen form action gevonden");
  const formAction = actionMatch[1].replace(/&amp;/g, "&");

  const loginRes = await fetch(formAction, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookieStr },
    body: new URLSearchParams({ username: email, password }),
    redirect: "manual",
  });

  let redirectUrl = loginRes.headers.get("location");
  if (!redirectUrl) {
    const loginHtml = await loginRes.text();
    const otpMatch = loginHtml.match(/action="([^"]+)"/);
    if (!otpMatch) throw new Error("Onverwachte pagina na login");
    const otpAction = otpMatch[1].replace(/&amp;/g, "&");
    const loginCookies = extractCookies(loginRes.headers);
    const allCookies = cookieString([...cookies, ...loginCookies]);
    const otpRes = await fetch(otpAction, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: allCookies },
      body: new URLSearchParams({}),
      redirect: "manual",
    });
    redirectUrl = otpRes.headers.get("location");
  }

  if (!redirectUrl?.includes("code=")) throw new Error("Geen autorisatiecode");

  const authCode = new URL(redirectUrl).searchParams.get("code");
  const tokenRes = await fetch(`${KEYCLOAK_BASE}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code: authCode,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error("Geen Keycloak-token");

  const linkRes = await fetch(`${NAVAJO_BASE}/user/LinkToPerson`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "text/plain;charset=UTF-8",
      "X-Navajo-Entity": "user/LinkToPerson",
      "X-Navajo-Instance": "Generic",
      "X-Navajo-Locale": "nl",
    },
    body: JSON.stringify({ ClubId: CLUB_ID, UnionId: "KNKV" }),
  });
  const linkData = await linkRes.json();
  if (!linkData.TokenObject?.accessToken) throw new Error("Geen Sportlink-sessie");

  console.log("✓ Ingelogd als", email);
  return linkData.TokenObject.accessToken;
}

// ─── API Helpers ─────────────────────────────────────────────────────────────

function headers(entity, token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": "KNKV",
    "X-Navajo-Locale": "nl",
  };
}

async function tryGet(entity, token) {
  try {
    const res = await fetch(`${NAVAJO_BASE}/${entity}`, {
      headers: headers(entity, token),
    });
    const data = await res.json();
    return { status: res.status, data, error: data.Error || false };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function tryPost(entity, token, body = {}) {
  try {
    const res = await fetch(`${NAVAJO_BASE}/${entity}`, {
      method: "POST",
      headers: headers(entity, token),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data, error: data.Error || false };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

function summarize(data, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return "...";
  if (data === null || data === undefined) return String(data);
  if (Array.isArray(data)) {
    if (data.length === 0) return "[]";
    return `Array(${data.length}) [${summarize(data[0], depth + 1, maxDepth)}, ...]`;
  }
  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length === 0) return "{}";
    const entries = keys.slice(0, 15).map((k) => {
      const v = data[k];
      if (typeof v === "string") return `${k}: "${v.length > 60 ? v.slice(0, 60) + "..." : v}"`;
      if (typeof v === "number" || typeof v === "boolean") return `${k}: ${v}`;
      if (v === null) return `${k}: null`;
      if (Array.isArray(v)) return `${k}: Array(${v.length})`;
      if (typeof v === "object")
        return `${k}: {${Object.keys(v).slice(0, 5).join(", ")}${Object.keys(v).length > 5 ? ", ..." : ""}}`;
      return `${k}: ${typeof v}`;
    });
    const more = keys.length > 15 ? `, ... +${keys.length - 15} meer` : "";
    return `{ ${entries.join(", ")}${more} }`;
  }
  return String(data);
}

// ─── Discovery ───────────────────────────────────────────────────────────────

async function discover(token) {
  const results = {};

  // ── Fase 1: Member-gerelateerde endpoints ──────────────────────────────────
  console.log("\n═══ FASE 1: Member endpoints ═══\n");

  const memberEndpoints = [
    // Zoeken & filteren
    "member/search/FilterMembersExtended",
    "member/search/FilterMembersSimple",
    // Detail endpoints
    "member/detail/MemberDetail",
    "member/detail/MemberDetailExtended",
    "member/detail/PersonDetail",
    // Lidmaatschap
    "member/membership/MembershipDetail",
    "member/membership/MembershipHistory",
    "member/membership/MembershipOverview",
    // Teams
    "member/team/TeamOverview",
    "member/team/TeamDetail",
    "member/team/TeamMembers",
    "member/team/ClubTeams",
    "member/team/ClubTeamMembers",
    // Spelactiviteiten
    "member/activity/ActivityOverview",
    "member/activity/GameActivityOverview",
    "member/activity/KernelGameActivities",
    // Historie
    "member/history/MemberHistory",
    "member/history/ActivityHistory",
    "member/history/TeamHistory",
    "member/history/MembershipHistory",
    // Competitie
    "member/competition/CompetitionOverview",
    "member/competition/CompetitionTeams",
    // Overig
    "member/overview/MemberOverview",
    "member/overview/ClubOverview",
    "member/registration/RegistrationOverview",
    "member/category/AgeCategories",
    "member/category/AgeCategoryOverview",
  ];

  for (const ep of memberEndpoints) {
    const result = await tryGet(ep, token);
    const status = result.error ? "✗" : "✓";
    const summary = result.error
      ? `Error: ${typeof result.data?.Message === "string" ? result.data.Message : result.error}`
      : summarize(result.data);
    console.log(`${status} GET ${ep}`);
    console.log(`  ${summary}\n`);
    results[ep] = result;

    // Rate limiting voorkomen
    await new Promise((r) => setTimeout(r, 300));
  }

  // ── Fase 2: Club-gerelateerde endpoints ────────────────────────────────────
  console.log("\n═══ FASE 2: Club endpoints ═══\n");

  const clubEndpoints = [
    "club/ClubDetail",
    "club/ClubOverview",
    "club/ClubTeams",
    "club/ClubMembers",
    "club/team/TeamOverview",
    "club/team/TeamDetail",
    "club/team/Teams",
    "club/activity/ActivityOverview",
    "club/competition/CompetitionOverview",
    "club/competition/CompetitionTeams",
    "club/registration/RegistrationOverview",
    "club/registration/Registrations",
    "club/registration/Deregistrations",
  ];

  for (const ep of clubEndpoints) {
    const result = await tryGet(ep, token);
    const status = result.error ? "✗" : "✓";
    const summary = result.error
      ? `Error: ${typeof result.data?.Message === "string" ? result.data.Message : result.error}`
      : summarize(result.data);
    console.log(`${status} GET ${ep}`);
    console.log(`  ${summary}\n`);
    results[ep] = result;
    await new Promise((r) => setTimeout(r, 300));
  }

  // ── Fase 3: Overige domeinen ───────────────────────────────────────────────
  console.log("\n═══ FASE 3: Overige domeinen ═══\n");

  const overigEndpoints = [
    "user/UserDetail",
    "user/UserPermissions",
    "competition/CompetitionOverview",
    "competition/Standings",
    "competition/Schedule",
    "team/TeamOverview",
    "team/TeamDetail",
    "team/TeamMembers",
    "team/Teams",
    "activity/ActivityOverview",
    "activity/GameActivities",
    "registration/Overview",
    "registration/NewRegistrations",
    "registration/Deregistrations",
    "report/MemberReport",
    "report/TeamReport",
    "report/ActivityReport",
  ];

  for (const ep of overigEndpoints) {
    const result = await tryGet(ep, token);
    const status = result.error ? "✗" : "✓";
    const summary = result.error
      ? `Error: ${typeof result.data?.Message === "string" ? result.data.Message : result.error}`
      : summarize(result.data);
    console.log(`${status} GET ${ep}`);
    console.log(`  ${summary}\n`);
    results[ep] = result;
    await new Promise((r) => setTimeout(r, 300));
  }

  // ── Fase 4: Zoek een specifiek lid op en probeer detail-endpoints ──────────
  console.log("\n═══ FASE 4: Detail per lid (Moos Muller, NNJ35T4) ═══\n");

  const lidId = "NNJ35T4";
  const detailEndpoints = [
    `member/detail/MemberDetail`,
    `member/detail/MemberDetailExtended`,
    `member/detail/PersonDetail`,
    `member/membership/MembershipDetail`,
    `member/membership/MembershipHistory`,
    `member/activity/ActivityOverview`,
    `member/activity/GameActivityOverview`,
    `member/team/TeamOverview`,
    `member/history/MemberHistory`,
    `member/history/ActivityHistory`,
    `member/history/TeamHistory`,
  ];

  for (const ep of detailEndpoints) {
    // Probeer met PersonId in body
    const result = await tryPost(ep, token, {
      PersonId: lidId,
      PublicPersonId: lidId,
      MemberId: lidId,
    });
    const status = result.error ? "✗" : "✓";
    const summary = result.error
      ? `Error: ${typeof result.data?.Message === "string" ? result.data.Message : result.error}`
      : summarize(result.data);
    console.log(`${status} POST ${ep} (PersonId: ${lidId})`);
    console.log(`  ${summary}\n`);
    results[`${ep}__detail`] = result;
    await new Promise((r) => setTimeout(r, 300));
  }

  // ── Fase 5: SearchMembers met ALLE velden loggen ──────────────────────────
  console.log("\n═══ FASE 5: Volledig SearchMembers response (1 lid) ═══\n");

  const [extRes, simpleRes] = await Promise.all([
    fetch(`${NAVAJO_BASE}/member/search/FilterMembersExtended`, {
      headers: headers("member/search/FilterMembersExtended", token),
    }),
    fetch(`${NAVAJO_BASE}/member/search/FilterMembersSimple`, {
      headers: headers("member/search/FilterMembersSimple", token),
    }),
  ]);

  const inputExtended = await extRes.json();
  const inputSimple = await simpleRes.json();

  // Zoek alleen bondsleden + actief
  if (inputExtended.TypeOfMember?.Options) {
    for (const opt of inputExtended.TypeOfMember.Options) {
      opt.IsSelected = opt.Id === "KERNELMEMBER";
    }
  }
  if (inputExtended.MemberStatus?.Options) {
    for (const opt of inputExtended.MemberStatus.Options) {
      opt.IsSelected = opt.Id === "ACTIVE";
    }
  }

  const searchRes = await fetch(`${NAVAJO_BASE}/member/search/SearchMembers`, {
    method: "POST",
    headers: headers("member/search/SearchMembers", token),
    body: JSON.stringify({
      Filters: { InputExtended: inputExtended, InputSimple: inputSimple },
    }),
  });
  const searchData = await searchRes.json();

  if (searchData.Members?.length > 0) {
    const firstMember = searchData.Members[0];
    console.log("Alle velden van het eerste lid:");
    console.log(JSON.stringify(firstMember, null, 2));

    console.log("\n\nAlle veldnamen (keys):");
    console.log(Object.keys(firstMember).join(", "));

    // Log ook de filter-opties zodat we weten wat beschikbaar is
    console.log("\n\n═══ Filter-opties (Extended) ═══\n");
    for (const [key, val] of Object.entries(inputExtended)) {
      if (val && typeof val === "object" && val.Options) {
        console.log(`${key}:`);
        for (const opt of val.Options) {
          console.log(
            `  - ${opt.Id}: ${opt.Labels?.[0]?.Value ?? opt.Description ?? "?"} (selected: ${opt.IsSelected})`
          );
        }
      }
    }
  }

  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-discovery.mjs <email> <password>");
  process.exit(1);
}

try {
  const token = await login(email, password);
  await discover(token);
  console.log("\n✓ Discovery compleet");
} catch (e) {
  console.error("✗ Fout:", e.message);
  process.exit(1);
}
