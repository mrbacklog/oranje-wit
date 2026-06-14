// Eenmalig: haal veld-staf (voorjaar) + adres uit Sportlink. NIET committen, geen creds hardcoden.
// Gebruik: SPORTLINK_EMAIL=... SPORTLINK_PASSWORD=... node scripts/sportlink-staf-overzicht.mjs
import crypto from "crypto";
import fs from "fs";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";
const CLUB_ID = "NCX19J3";

const EMAIL = process.env.SPORTLINK_EMAIL;
const PASSWORD = process.env.SPORTLINK_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error("Zet SPORTLINK_EMAIL en SPORTLINK_PASSWORD als env-var.");
  process.exit(1);
}

const extractCookies = (h) => (typeof h.getSetCookie === "function" ? h.getSetCookie() : []);
const cookieString = (c) => c.map((x) => x.split(";")[0]).join("; ");

function headers(entity, token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": "KNKV",
    "X-Navajo-Locale": "nl",
  };
}

async function login() {
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
  const formAction = authHtml.match(/action="([^"]+)"/)[1].replace(/&amp;/g, "&");

  const loginRes = await fetch(formAction, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookieString(cookies) },
    body: new URLSearchParams({ username: EMAIL, password: PASSWORD }),
    redirect: "manual",
  });
  let redirectUrl = loginRes.headers.get("location");
  if (!redirectUrl) {
    const loginHtml = await loginRes.text();
    if (loginHtml.includes("kc-feedback-text")) {
      const m = loginHtml.match(/kc-feedback-text">\s*([^<]+)/);
      throw new Error(m?.[1]?.trim() ?? "Onjuiste inloggegevens");
    }
    const otpAction = loginHtml.match(/action="([^"]+)"/)[1].replace(/&amp;/g, "&");
    const allCookies = cookieString([...cookies, ...extractCookies(loginRes.headers)]);
    const otpRes = await fetch(otpAction, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: allCookies },
      body: new URLSearchParams({}),
      redirect: "manual",
    });
    redirectUrl = otpRes.headers.get("location");
  }
  if (!redirectUrl?.includes("code=")) throw new Error("Geen autorisatiecode ontvangen");
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
  if (!linkData.TokenObject?.accessToken) {
    fs.writeFileSync(
      "scripts/.sportlink-link-debug.json",
      JSON.stringify({ status: linkRes.status, linkData }, null, 2)
    );
    throw new Error("Geen Navajo-token (debug weggeschreven)");
  }
  return linkData.TokenObject.accessToken;
}

async function navajoGet(entity, token, params) {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  const res = await fetch(`${NAVAJO_BASE}/${entity}${qs}`, { headers: headers(entity, token) });
  return { status: res.status, data: await res.json().catch(() => null) };
}
async function navajoPost(entity, token, body) {
  const res = await fetch(`${NAVAJO_BASE}/${entity}`, {
    method: "POST",
    headers: headers(entity, token),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function zoekVeldStaf(token) {
  const ext = (await navajoGet("member/search/FilterTeamsExtended", token)).data;
  const simple = (await navajoGet("member/search/FilterTeamsSimple", token)).data;
  for (const opt of simple.UnionTeam?.Options ?? []) opt.IsSelected = true;
  const veldId = "KORFBALL-VE-WK/STANDARD";
  for (const opt of ext.Activity?.Options ?? []) opt.IsSelected = opt.Id === veldId;
  const res = await navajoPost("member/search/SearchTeams", token, {
    Filters: { InputExtended: ext, InputSimple: simple },
  });
  return res.data?.Members ?? [];
}

// Adres + personalia komen uit member/persondata/* (ontdekt via clubweb JS-bundel).
async function haalAdres(token, relCode) {
  const { data } = await navajoGet("member/persondata/MemberAddresses", token, {
    PublicPersonId: relCode,
  });
  const lijst = data?.Address ?? [];
  const a = lijst.find((x) => x.IsDefault) ?? lijst[0];
  if (!a) return null;
  const huisnr = `${a.AddressNumber ?? ""}${a.AddressNumberAppendix ?? ""}`.trim();
  return {
    straat: a.StreetName ?? null,
    huisnummer: huisnr || null,
    postcode: a.ZipCode ?? null,
    plaats: a.City ?? null,
    land: a.CountryCode !== "NL" ? a.CountryName : null,
  };
}

(async () => {
  console.log("Inloggen…");
  const token = await login();
  console.log("Veld-staf ophalen…");
  const teamleden = await zoekVeldStaf(token);

  const nu = new Date();
  const staf = teamleden.filter(
    (t) => !t.IsPlayer && (!t.TeamPersonEndDate || new Date(t.TeamPersonEndDate) >= nu)
  );
  // Uniek per persoon (kan in meerdere teams staan)
  const perPersoon = new Map();
  for (const s of staf) {
    const e = perPersoon.get(s.PublicPersonId) ?? { ...s, teams: [] };
    e.teams.push({
      team: s.TeamName,
      rol: s.TeamRoleDescription,
      functie: s.TeamFunctionDescription,
    });
    perPersoon.set(s.PublicPersonId, e);
  }
  console.log(`${staf.length} staf-toewijzingen, ${perPersoon.size} unieke personen.`);

  // Sample het adres-endpoint op de eerste persoon zodat we de veldnamen zien
  const eerste = [...perPersoon.values()][0];
  const sample = await haalAdres(token, eerste.PublicPersonId);
  fs.writeFileSync("scripts/.sportlink-detail-sample.json", JSON.stringify(sample, null, 2));
  console.log("Adres-sample velden:", Object.keys(sample));

  const rijen = [];
  for (const p of perPersoon.values()) {
    const a = await haalAdres(token, p.PublicPersonId);
    rijen.push({
      relCode: p.PublicPersonId,
      naam: p.FullName,
      email: p.email ?? null,
      teams: p.teams
        .map((t) => `${t.team} (${t.rol}${t.functie ? ": " + t.functie : ""})`)
        .join(" | "),
      adres: a,
    });
  }

  fs.writeFileSync("scripts/.sportlink-staf-overzicht.json", JSON.stringify(rijen, null, 2));
  console.log(
    `\nKlaar: ${rijen.length} personen weggeschreven naar scripts/.sportlink-staf-overzicht.json`
  );
})().catch((e) => {
  console.error("FOUT:", e.message);
  process.exit(1);
});
