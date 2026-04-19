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

async function apiGet(entity, token, params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${NAVAJO_BASE}/${entity}?${qs}`, { headers: hdrs(entity, token) });
  return res.json();
}

const token = await login("antjanlaban@gmail.com", "in02l7!!");
const id = "NLV80M3";
const params = { PublicPersonId: id };

console.log("═══ FREEK LABAN (NLV80M3) — Volledige Sportlink historie ═══\n");

console.log("─── Profiel ───");
console.log(JSON.stringify(await apiGet("member/MemberHeader", token, params), null, 2));

console.log("\n─── Lidmaatschappen ───");
console.log(
  JSON.stringify(await apiGet("member/membership/MemberUnionMemberships", token, params), null, 2)
);

console.log("\n─── Clubhistorie ───");
console.log(
  JSON.stringify(await apiGet("member/registrations/PersonClubHistory", token, params), null, 2)
);

console.log("\n─── Spelactiviteiten ───");
console.log(
  JSON.stringify(await apiGet("member/activity/MemberGameActivities", token, params), null, 2)
);

console.log("\n─── Teams (huidig + inactief) ───");
console.log(
  JSON.stringify(
    await apiGet("member/team/MemberTeams", token, { ...params, ShowInactive: true }),
    null,
    2
  )
);

console.log("\n─── Spelershistorie (in welke teams gespeeld) ───");
console.log(
  JSON.stringify(await apiGet("member/history/MemberPlayerHistory", token, params), null, 2)
);

console.log("\n─── Teamhistorie ───");
console.log(
  JSON.stringify(await apiGet("member/history/MemberTeamHistory", token, params), null, 2)
);

console.log("\n─── Wedstrijdhistorie ───");
console.log(
  JSON.stringify(await apiGet("member/history/MemberMatchHistory", token, params), null, 2)
);

console.log("\n─── Tuchthistorie ───");
console.log(
  JSON.stringify(await apiGet("member/history/MemberDisciplineHistory", token, params), null, 2)
);

console.log("\n─── Notifications over Freek ───");
const notifs = await apiGet("member/notifications/Notifications", token, {
  DateFrom: "2015-01-01",
});
const freekNotifs = (notifs.Items || []).filter((i) => i.PublicPersonId === id);
console.log(JSON.stringify(freekNotifs, null, 2));
