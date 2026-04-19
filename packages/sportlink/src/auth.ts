import crypto from "crypto";
import { logger } from "@oranje-wit/types";
import type { SportlinkToken } from "./types";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";
const CLUB_ID = "NCX19J3";

/**
 * Haal set-cookie headers op — met fallback voor oudere Node.js versies
 * waar getSetCookie() niet beschikbaar is.
 */
function extractCookies(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  // Fallback: parse raw set-cookie header
  const raw = headers.get("set-cookie");
  if (!raw) return [];
  // Meerdere set-cookie headers worden door sommige runtimes als komma-gescheiden string geleverd
  // Maar cookies bevatten ook komma's in expires — split op ", " gevolgd door een cookie-naam
  return raw.split(/,\s*(?=[A-Z_]+=)/i).filter(Boolean);
}

function cookieString(cookies: string[]): string {
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

export async function sportlinkLogin(email: string, password: string): Promise<SportlinkToken> {
  // Step 1: PKCE
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  const state = crypto.randomBytes(16).toString("hex");

  // Step 2: Get auth page
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
  if (!actionMatch) {
    logger.error("[sportlink] Geen form action gevonden in auth-pagina, status:", authRes.status);
    throw new Error("Kan Sportlink login-pagina niet laden");
  }
  const formAction = actionMatch[1].replace(/&amp;/g, "&");

  // Step 3: POST credentials
  const loginRes = await fetch(formAction, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookieStr },
    body: new URLSearchParams({ username: email, password }),
    redirect: "manual",
  });

  let redirectUrl = loginRes.headers.get("location");

  if (!redirectUrl) {
    // Step 4: Skip OTP
    const loginHtml = await loginRes.text();
    if (loginHtml.includes("kc-feedback-text")) {
      const errorMatch = loginHtml.match(/kc-feedback-text">\s*([^<]+)/);
      throw new Error(errorMatch?.[1]?.trim() ?? "Onjuiste inloggegevens");
    }
    const otpMatch = loginHtml.match(/action="([^"]+)"/);
    if (!otpMatch) {
      logger.error("[sportlink] Geen OTP form action, login status:", loginRes.status);
      throw new Error("Onverwachte Sportlink-pagina na login");
    }
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

  if (!redirectUrl?.includes("code="))
    throw new Error("Sportlink login mislukt — geen autorisatiecode ontvangen");

  // Step 5: Token exchange
  const authCode = new URL(redirectUrl).searchParams.get("code")!;
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
  if (!tokenData.access_token) throw new Error("Kan geen Keycloak-token verkrijgen");

  // Step 6: LinkToPerson — PUT met ClubId/UnionId in body
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
  if (!linkData.TokenObject?.accessToken) throw new Error("Kan geen Sportlink-sessie starten");

  logger.info("[sportlink] Login geslaagd voor", email);
  return {
    navajoToken: linkData.TokenObject.accessToken,
    clubId: linkData.ClubId,
    userName: email,
  };
}
