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
    body: JSON.stringify({ ClubId: "NCX19J3", UnionId: "KNKV" }),
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

function navajoHeaders(entity: string, token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "text/plain;charset=UTF-8",
    "X-Navajo-Entity": entity,
    "X-Navajo-Instance": "KNKV",
    "X-Navajo-Locale": "nl",
  };
}

/**
 * Haal alle actieve + afgemelde leden op.
 *
 * De Navajo API verwacht het volledige filter-object (inclusief Labels, IsRequired, etc.)
 * Daarom halen we eerst de filter-definities op via FilterMembersExtended en FilterMembersSimple,
 * zetten de gewenste selecties, en sturen het complete object mee.
 */
export async function sportlinkZoekLeden(navajoToken: string): Promise<SportlinkLid[]> {
  // Stap 1: Haal filter-definities op
  const [extRes, simpleRes] = await Promise.all([
    fetch(`${NAVAJO_BASE}/member/search/FilterMembersExtended`, {
      headers: navajoHeaders("member/search/FilterMembersExtended", navajoToken),
    }),
    fetch(`${NAVAJO_BASE}/member/search/FilterMembersSimple`, {
      headers: navajoHeaders("member/search/FilterMembersSimple", navajoToken),
    }),
  ]);

  const inputExtended = await extRes.json();
  const inputSimple = await simpleRes.json();

  if (inputExtended.Error) {
    throw new Error(`Sportlink filter-fout: ${inputExtended.Message}`);
  }

  // Stap 2: Stel de gewenste selecties in
  // Alleen bondsleden (geen verenigingsleden/relaties)
  selecteerOpties(inputExtended.TypeOfMember, ["KERNELMEMBER"]);
  // Alleen actief + afmelding in de toekomst (geen oud-leden)
  selecteerOpties(inputExtended.MemberStatus, ["ACTIVE", "ELIGABLE_FOR_REMOVE"]);

  // Stap 3: Zoek met het volledige filterobject
  const searchRes = await fetch(`${NAVAJO_BASE}/member/search/SearchMembers`, {
    method: "POST",
    headers: navajoHeaders("member/search/SearchMembers", navajoToken),
    body: JSON.stringify({
      Filters: {
        InputExtended: inputExtended,
        InputSimple: inputSimple,
      },
    }),
  });

  const data = await searchRes.json();
  if (data.Error) throw new Error(`Sportlink zoekfout: ${data.Message}`);

  const alleLeden: SportlinkLid[] = data.Members ?? [];

  // Filter op korfbalspelers: alleen leden met Veld of Zaal spelactiviteit
  // Dit sluit donateurs, bowlers, biljarters, niet-spelende leden etc. uit
  const korfballers = alleLeden.filter((lid) => {
    const act = lid.KernelGameActivities ?? "";
    return act.includes("Veld") || act.includes("Zaal");
  });

  logger.info(
    `[sportlink] ${alleLeden.length} leden opgehaald, ${korfballers.length} korfbalspelers na filter`
  );
  return korfballers;
}

/** Zet IsSelected op true voor de opgegeven IDs in een MULTISELECT filter */
function selecteerOpties(
  filter: { Options?: { Id: string; IsSelected: boolean }[] },
  ids: string[]
) {
  if (!filter?.Options) return;
  const selectSet = new Set(ids);
  for (const opt of filter.Options) {
    opt.IsSelected = selectSet.has(opt.Id);
  }
}
