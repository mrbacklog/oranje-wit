/**
 * Gedeelde Sportlink auth-module voor OW-scripts.
 * Gebruik: import { sportlinkLogin, navajoHeaders, NAVAJO_BASE } from './sportlink-auth.mjs'
 */
import crypto from "crypto";

const EMAIL = "antjanlaban@gmail.com";
const PASSWORD = "in02l7!!";
export const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";

function extractCookies(headers) {
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers.get("set-cookie");
  if (!raw) return [];
  return raw.split(/,\s*(?=[A-Z_]+=)/i).filter(Boolean);
}

function cookieString(cookies) {
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

export async function sportlinkLogin() {
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
    body: new URLSearchParams({ username: EMAIL, password: PASSWORD }),
    redirect: "manual",
  });

  let redirectUrl = loginRes.headers.get("location");

  if (!redirectUrl) {
    const loginHtml = await loginRes.text();
    if (loginHtml.includes("kc-feedback-text")) {
      const errorMatch = loginHtml.match(/kc-feedback-text">\s*([^<]+)/);
      throw new Error(errorMatch?.[1]?.trim() ?? "Onjuiste inloggegevens");
    }
    const otpMatch = loginHtml.match(/action="([^"]+)"/);
    if (!otpMatch) throw new Error("Onverwachte pagina na login");
    const otpAction = otpMatch[1].replace(/&amp;/g, "&");
    const loginCookies = extractCookies(loginRes.headers);
    const allCookies = cookieString([...cookies, ...loginCookies]);
    const otpRes = await fetch(otpAction, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: allCookies },
      body: new URLSearchParams({ "setup-otp": "false" }),
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
  if (!tokenData.access_token) throw new Error("Token exchange mislukt");

  const linkRes = await fetch(`${NAVAJO_BASE}/user/LinkToPerson`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "Content-Type": "text/plain;charset=UTF-8",
      "X-Navajo-Entity": "user/LinkToPerson",
      "X-Navajo-Instance": "Generic",
      "X-Navajo-Locale": "nl",
    },
    body: JSON.stringify({ ClubId: "NCX19J3", UnionId: "KNKV" }),
  });
  const linkData = await linkRes.json();
  if (!linkData.TokenObject?.accessToken)
    throw new Error(`LinkToPerson mislukt: ${JSON.stringify(linkData)}`);

  return linkData.TokenObject.accessToken;
}

export function navajoHeaders(entity, token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": "KNKV",
    "X-Navajo-Locale": "nl",
  };
}
