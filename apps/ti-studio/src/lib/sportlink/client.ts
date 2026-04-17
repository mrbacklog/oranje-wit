import crypto from "crypto";
import { logger } from "@oranje-wit/types";
import type { SportlinkLid } from "./types";

const KEYCLOAK_BASE = "https://idm.sportlink.com/realms/sportlink";
const NAVAJO_BASE = "https://clubweb.sportlink.com/navajo/entity/common/clubweb";
const CLIENT_ID = "sportlink-club-web";
const REDIRECT_URI = "https://clubweb.sportlink.com";

interface LoginResult {
  navajoToken: string;
  clubId: string;
  userName: string;
}

export async function sportlinkLogin(email: string, password: string): Promise<LoginResult> {
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
  const cookies = authRes.headers.getSetCookie?.() ?? [];
  const cookieStr = cookies.map((c) => c.split(";")[0]).join("; ");
  const actionMatch = authHtml.match(/action="([^"]+)"/);
  if (!actionMatch) throw new Error("Kan Sportlink login-pagina niet laden");
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
    if (!otpMatch) throw new Error("Onverwachte Sportlink-pagina na login");
    const otpAction = otpMatch[1].replace(/&amp;/g, "&");
    const allCookies = [...cookies, ...(loginRes.headers.getSetCookie?.() ?? [])]
      .map((c) => c.split(";")[0])
      .join("; ");
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

  // Step 6: LinkToPerson
  const linkRes = await fetch(`${NAVAJO_BASE}/user/LinkToPerson`, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      "X-Navajo-Entity": "user/LinkToPerson",
      "X-Navajo-Instance": "KNKV",
      "X-Navajo-Locale": "nl",
    },
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

export async function sportlinkZoekLeden(navajoToken: string): Promise<SportlinkLid[]> {
  const res = await fetch(`${NAVAJO_BASE}/member/search/SearchMembers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${navajoToken}`,
      "Content-Type": "text/plain;charset=UTF-8",
      "X-Navajo-Entity": "member/search/SearchMembers",
      "X-Navajo-Instance": "KNKV",
      "X-Navajo-Locale": "nl",
    },
    body: JSON.stringify({
      Filters: {
        InputExtended: {
          TypeOfMember: {
            Type: "MULTISELECT",
            Options: [
              { Id: "KERNELMEMBER", IsSelected: true },
              { Id: "CLUBMEMBER", IsSelected: true },
              { Id: "CLUBRELATION", IsSelected: true },
            ],
          },
          MemberStatus: {
            Type: "MULTISELECT",
            Options: [
              { Id: "ACTIVE", IsSelected: true },
              { Id: "INACTIVE", IsSelected: true },
              { Id: "ELIGABLE_FOR_REMOVE", IsSelected: true },
            ],
          },
        },
        InputSimple: {
          SearchValue: {
            Type: "INPUT",
            Options: [{ Name: "SEARCHVALUE", Type: "TEXT", Value: "" }],
          },
        },
      },
    }),
  });
  const data = await res.json();
  if (data.Error) throw new Error(`Sportlink zoekfout: ${data.Message}`);
  logger.info(`[sportlink] ${data.Members?.length ?? 0} leden opgehaald`);
  return data.Members ?? [];
}
