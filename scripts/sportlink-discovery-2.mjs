/**
 * Sportlink API Discovery — Fase 2
 *
 * Diepere verkenning: meer paden, PUT/POST variaties, andere base URLs,
 * en proberen om de clubweb frontend endpoints te reverse-engineeren.
 */

import crypto from "crypto";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";
const CLUB_ID = "NCX19J3";

// ─── Auth (compact) ─────────────────────────────────────────────────────────

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
  return { navajoToken: ld.TokenObject.accessToken, keycloakToken: td.access_token };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hdrs(entity, token, instance = "KNKV") {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": instance,
    "X-Navajo-Locale": "nl",
  };
}

async function probe(method, entity, token, body = null, instance = "KNKV") {
  try {
    const opts = { method, headers: hdrs(entity, token, instance) };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${NAVAJO_BASE}/${entity}`, opts);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text.slice(0, 500);
    }
    const isError = data?.Error || res.status >= 400;
    return { ok: !isError, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}

function logResult(method, entity, result, extra = "") {
  const icon = result.ok ? "✓" : "✗";
  const msg = result.ok
    ? truncSummary(result.data)
    : result.data?.Message || result.error || `HTTP ${result.status}`;
  console.log(`${icon} ${method} ${entity}${extra}`);
  if (result.ok) console.log(`  ${msg}`);
  console.log();
}

function truncSummary(data) {
  if (!data || typeof data !== "object") return String(data).slice(0, 200);
  const keys = Object.keys(data);
  if (keys.length === 0) return "{}";
  return `{${keys.length} keys: ${keys.slice(0, 20).join(", ")}${keys.length > 20 ? " ..." : ""}}`;
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Discovery ───────────────────────────────────────────────────────────────

async function discover(tokens) {
  const { navajoToken: token } = tokens;
  const found = [];

  // ── 1: Brute-force meer member/ sub-paden ──────────────────────────────────
  console.log("═══ 1: member/* variaties ═══\n");

  const memberPrefixes = [
    "member",
    "member/search",
    "member/detail",
    "member/overview",
    "member/card",
    "member/profile",
    "member/photo",
    "member/image",
    "member/edit",
    "member/create",
    "member/delete",
    "member/export",
    "member/import",
    "member/report",
    "member/list",
    "member/filter",
    "member/mutation",
    "member/change",
    "member/log",
    "member/audit",
  ];
  const memberActions = [
    "Overview",
    "Detail",
    "List",
    "Search",
    "Filter",
    "Export",
    "Import",
    "Card",
    "Photo",
    "Image",
    "Profile",
    "Mutations",
    "Changes",
    "History",
    "Log",
    "Audit",
    "Teams",
    "Activities",
    "GameActivities",
    "Memberships",
    "ContactInfo",
    "Address",
    "Parents",
    "Communication",
    "Registration",
    "Deregistration",
    "Transfer",
    "PersonImage",
    "PersonPhoto",
    "MemberCard",
    "SearchMembersExtended",
    "SearchMembersSimple",
    "FilterMembers",
    "MemberList",
    "MemberExport",
    "GetMember",
    "GetMemberDetail",
    "GetPerson",
    "MemberMutations",
    "MemberChanges",
    "MemberTeams",
    "MemberActivities",
  ];

  for (const prefix of memberPrefixes) {
    for (const action of memberActions) {
      const entity = `${prefix}/${action}`;
      if (
        entity === "member/search/FilterMembersExtended" ||
        entity === "member/search/FilterMembersSimple"
      )
        continue;
      const result = await probe("GET", entity, token);
      if (result.ok) {
        logResult("GET", entity, result);
        found.push({ method: "GET", entity, data: result.data });
      }
      await delay(100);
    }
  }

  // ── 2: Andere top-level domeinen ───────────────────────────────────────────
  console.log("═══ 2: Andere domeinen ═══\n");

  const domains = [
    "team",
    "club",
    "competition",
    "game",
    "match",
    "schedule",
    "activity",
    "registration",
    "deregistration",
    "mutation",
    "report",
    "export",
    "document",
    "message",
    "notification",
    "finance",
    "payment",
    "invoice",
    "setting",
    "config",
    "calendar",
    "event",
    "training",
    "field",
    "location",
    "person",
    "contact",
    "address",
    "photo",
    "image",
    "news",
    "article",
    "page",
    "dashboard",
    "statistic",
    "standing",
    "ranking",
    "score",
    "result",
    "penalty",
    "transfer",
    "loan",
    "card",
    "suspension",
    "appeal",
    "volunteer",
    "official",
    "referee",
    "coach",
    "trainer",
    "season",
    "period",
    "round",
    "pool",
    "group",
    "division",
  ];
  const actions = [
    "Overview",
    "Detail",
    "List",
    "Search",
    "Filter",
    "Get",
    "Export",
    "Teams",
    "Members",
    "Activities",
    "History",
    "Mutations",
    "Current",
    "Active",
  ];

  for (const domain of domains) {
    for (const action of actions) {
      const entity = `${domain}/${action}`;
      const result = await probe("GET", entity, token);
      if (result.ok) {
        logResult("GET", entity, result);
        found.push({ method: "GET", entity, data: result.data });
      }
      await delay(50);
    }
  }

  // ── 3: user/ endpoints ─────────────────────────────────────────────────────
  console.log("═══ 3: user/* endpoints ═══\n");

  const userActions = [
    "LinkToPerson",
    "UserDetail",
    "UserProfile",
    "UserPermissions",
    "UserRoles",
    "UserSettings",
    "CurrentUser",
    "GetUser",
    "ClubInfo",
    "ClubDetail",
    "ClubSettings",
    "Clubs",
    "Persons",
    "PersonDetail",
    "PersonSearch",
    "Menu",
    "Navigation",
    "Modules",
    "Features",
    "Capabilities",
  ];

  for (const action of userActions) {
    for (const method of ["GET", "PUT", "POST"]) {
      const entity = `user/${action}`;
      if (entity === "user/LinkToPerson" && method === "PUT") continue;
      const result = await probe(method, entity, token);
      if (result.ok) {
        logResult(method, entity, result);
        found.push({ method, entity, data: result.data });
      }
      await delay(100);
    }
  }

  // ── 4: Probeer andere base URLs ────────────────────────────────────────────
  console.log("═══ 4: Alternatieve base URLs ═══\n");

  const altBases = [
    "https://clubweb.sportlink.com/navajo/entity/common",
    "https://clubweb.sportlink.com/navajo/entity",
    "https://clubweb.sportlink.com/navajo",
    "https://clubweb.sportlink.com/api",
  ];

  for (const base of altBases) {
    for (const path of [
      "clubweb",
      "member/search/SearchMembers",
      "club",
      "version",
      "health",
      "info",
      "swagger",
      "openapi",
    ]) {
      try {
        const url = `${base}/${path}`;
        const res = await fetch(url, { headers: hdrs(path, token) });
        const text = await res.text();
        if (res.status < 400 && !text.includes("Entity not found") && !text.includes("<!DOCTYPE")) {
          console.log(`✓ ${url} (${res.status})`);
          console.log(`  ${text.slice(0, 300)}\n`);
          found.push({ method: "GET", entity: url, data: text.slice(0, 500) });
        }
      } catch {}
      await delay(50);
    }
  }

  // ── 5: Probeer Generic instance i.p.v. KNKV ───────────────────────────────
  console.log("═══ 5: Generic instance endpoints ═══\n");

  const genericEndpoints = [
    "user/UserDetail",
    "user/CurrentUser",
    "user/ClubInfo",
    "user/Menu",
    "user/Persons",
    "user/Capabilities",
    "user/Modules",
    "member/search/SearchMembers",
    "member/overview/Overview",
    "club/Detail",
    "club/Teams",
    "club/Members",
  ];

  for (const ep of genericEndpoints) {
    const result = await probe("GET", ep, token, null, "Generic");
    if (result.ok) {
      logResult("GET", ep, result, " [Generic]");
      found.push({ method: "GET", entity: ep + " [Generic]", data: result.data });
    }
    await delay(100);
  }

  // ── 6: Probeer met een specifiek lid in de URL/body ────────────────────────
  console.log("═══ 6: Lid-specifieke endpoints ═══\n");

  // Probeer een bekend actief lid (Bob Mans, NJF95S5 — lang lid)
  const testId = "NJF95S5";
  const lidPaths = [
    `member/${testId}`,
    `member/detail/${testId}`,
    `member/profile/${testId}`,
    `member/card/${testId}`,
    `person/${testId}`,
    `member/search/MemberDetail`,
    `member/search/MemberProfile`,
    `member/search/PersonDetail`,
    `member/search/GetMember`,
    `member/search/MemberCard`,
    `member/search/MemberTeams`,
    `member/search/MemberActivities`,
    `member/search/MemberHistory`,
    `member/search/MemberMutations`,
    `member/search/MemberOverview`,
    `member/search/MemberExport`,
    `member/search/MemberPhoto`,
    `member/search/PersonImage`,
  ];

  for (const ep of lidPaths) {
    // GET
    let result = await probe("GET", ep, token);
    if (result.ok) {
      logResult("GET", ep, result);
      found.push({ method: "GET", entity: ep, data: result.data });
    }
    // POST met body
    result = await probe("POST", ep, token, {
      PersonId: testId,
      PublicPersonId: testId,
      Id: testId,
    });
    if (result.ok) {
      logResult("POST", ep, result, ` (Id: ${testId})`);
      found.push({ method: "POST", entity: ep, data: result.data });
    }
    await delay(100);
  }

  // ── 7: Foto/image endpoint ─────────────────────────────────────────────────
  console.log("═══ 7: Foto endpoints ═══\n");

  const photoPaths = [
    `member/photo/PersonImage`,
    `member/photo/MemberPhoto`,
    `member/image/PersonImage`,
    `photo/PersonImage`,
    `image/PersonImage`,
    `person/photo/Get`,
    `person/image/Get`,
  ];

  for (const ep of photoPaths) {
    for (const method of ["GET", "POST"]) {
      const body = method === "POST" ? { PersonId: "NJF95S5", PublicPersonId: "NJF95S5" } : null;
      const result = await probe(method, ep, token, body);
      if (result.ok) {
        logResult(method, ep, result);
        found.push({ method, entity: ep, data: result.data });
      }
    }
    await delay(100);
  }

  // ── Samenvatting ───────────────────────────────────────────────────────────
  console.log("\n═══ SAMENVATTING: Gevonden endpoints ═══\n");
  if (found.length === 0) {
    console.log("Geen nieuwe endpoints gevonden buiten SearchMembers.");
  } else {
    for (const f of found) {
      console.log(`✓ ${f.method} ${f.entity}`);
    }
  }

  return found;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Gebruik: node scripts/sportlink-discovery-2.mjs <email> <password>");
  process.exit(1);
}

try {
  const tokens = await login(email, password);
  await discover(tokens);
  console.log("\n✓ Discovery fase 2 compleet");
} catch (e) {
  console.error("✗ Fout:", e.message);
  process.exit(1);
}
