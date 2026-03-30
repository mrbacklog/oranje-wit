/**
 * HMAC-gesignde e-mail links — stateless authenticatie.
 *
 * In tegenstelling tot ToegangsTokens (tokens.ts) die in de database worden
 * opgeslagen, zijn HMAC-links volledig stateless. De link zelf bevat alle
 * informatie en de handtekening garandeert integriteit.
 *
 * Gebruik: langlevende links voor terugkerende gebruikers (coördinatoren,
 * trainers) die zonder database-lookup kunnen inloggen.
 *
 * Flow:
 * 1. TC genereert link via signEmailLink(email, destination)
 * 2. Gebruiker ontvangt link: /auth/email-link/{token}
 * 3. App valideert via verifyEmailLink(token) — geen DB nodig
 * 4. Bij succes: NextAuth sessie via "email-link" credentials provider
 *
 * Beveiliging:
 * - HMAC-SHA256 met server-side secret (EMAIL_LINK_SECRET)
 * - Timing-safe vergelijking (voorkomt timing attacks)
 * - Standaard expiry: 90 dagen
 * - Base64url encoding (URL-safe, geen padding)
 */

import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@oranje-wit/types";

/** Standaard geldigheidsduur in dagen */
const STANDAARD_EXPIRY_DAGEN = 90;

/** Separator tussen payload en signature in het token */
const TOKEN_SEPARATOR = ".";

/** Separator tussen velden in de payload */
const PAYLOAD_SEPARATOR = ":";

/**
 * Haal het HMAC secret op uit de environment.
 * Gooit een duidelijke error als het niet is geconfigureerd.
 */
function getSecret(): string {
  const secret = process.env.EMAIL_LINK_SECRET;
  if (!secret) {
    throw new Error(
      "EMAIL_LINK_SECRET is niet geconfigureerd. " +
        "Stel deze environment variable in met een willekeurige string van minimaal 32 tekens."
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "EMAIL_LINK_SECRET is te kort (minimaal 32 tekens). " +
        "Gebruik een cryptografisch veilige random string."
    );
  }
  return secret;
}

/**
 * Encode een string naar base64url (RFC 4648 sectie 5).
 * Geen padding (=) — is niet nodig voor HMAC-tokens.
 */
function toBase64Url(input: string): string {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Decode een base64url string terug naar UTF-8.
 */
function fromBase64Url(input: string): string {
  // Herstel standaard base64 padding
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf-8");
}

/**
 * Bereken een HMAC-SHA256 signature voor de gegeven data.
 * Retourneert base64url-encoded signature.
 */
function sign(data: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  return hmac.digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Resultaat van link-verificatie */
export interface EmailLinkVerificatie {
  /** E-mailadres uit de link */
  email: string;
  /** Optionele bestemming (bijv. /evaluatie/invullen/abc123) */
  destination?: string;
  /** Link is geldig (correcte signature, niet verlopen) */
  valid: boolean;
  /** Link is verlopen (signature was correct, maar expiresAt is verstreken) */
  expired: boolean;
}

/**
 * Genereer een HMAC-gesignde link.
 *
 * Het token bevat: base64url(email:destination:expiresAt).base64url(hmac-sha256)
 *
 * @param email - E-mailadres van de gebruiker
 * @param destination - Optionele redirect-bestemming na inloggen
 * @param expiryDays - Geldigheid in dagen (default: 90)
 * @returns Het token-gedeelte van de URL (niet de volledige URL)
 */
export function signEmailLink(email: string, destination?: string, expiryDays?: number): string {
  if (!email || !email.includes("@")) {
    throw new Error("Ongeldig e-mailadres");
  }

  const secret = getSecret();
  const dagen = expiryDays ?? STANDAARD_EXPIRY_DAGEN;
  const expiresAt = Math.floor(Date.now() / 1000) + dagen * 24 * 60 * 60;

  // Bouw payload: email:destination:expiresAt
  // Destination kan leeg zijn — dan staat er email::expiresAt
  const payloadRaw = [email.toLowerCase(), destination ?? "", String(expiresAt)].join(
    PAYLOAD_SEPARATOR
  );

  const payloadEncoded = toBase64Url(payloadRaw);
  const signature = sign(payloadEncoded, secret);

  logger.info(
    `HMAC-link gegenereerd voor ${email.toLowerCase()} (geldig tot ${new Date(expiresAt * 1000).toISOString()})`
  );

  return `${payloadEncoded}${TOKEN_SEPARATOR}${signature}`;
}

/**
 * Valideer een HMAC-gesignde link.
 *
 * Controleert:
 * 1. Token-formaat (payload.signature)
 * 2. Payload-structuur (email:destination:expiresAt)
 * 3. HMAC-signature (timing-safe)
 * 4. Expiry (verlopen = expired:true, valid:false)
 *
 * @param token - Het token uit de URL
 * @returns Verificatieresultaat met email, destination, valid en expired flags
 */
export function verifyEmailLink(token: string): EmailLinkVerificatie {
  const ongeldig: EmailLinkVerificatie = {
    email: "",
    valid: false,
    expired: false,
  };

  if (!token || typeof token !== "string") {
    return ongeldig;
  }

  // Splits token in payload en signature
  const separatorIndex = token.lastIndexOf(TOKEN_SEPARATOR);
  if (separatorIndex === -1 || separatorIndex === 0 || separatorIndex === token.length - 1) {
    return ongeldig;
  }

  const payloadEncoded = token.substring(0, separatorIndex);
  const signatureProvided = token.substring(separatorIndex + 1);

  // Verifieer signature (timing-safe)
  let secret: string;
  try {
    secret = getSecret();
  } catch {
    logger.warn("EMAIL_LINK_SECRET niet beschikbaar bij verificatie");
    return ongeldig;
  }

  const expectedSignature = sign(payloadEncoded, secret);

  // Timing-safe vergelijking — voorkomt timing attacks
  const sigBuffer = Buffer.from(signatureProvided, "utf-8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

  if (sigBuffer.length !== expectedBuffer.length) {
    return ongeldig;
  }

  if (!timingSafeEqual(sigBuffer, expectedBuffer)) {
    return ongeldig;
  }

  // Signature is geldig — decodeer payload
  let payloadRaw: string;
  try {
    payloadRaw = fromBase64Url(payloadEncoded);
  } catch {
    return ongeldig;
  }

  const parts = payloadRaw.split(PAYLOAD_SEPARATOR);
  // Verwacht: email, destination, expiresAt (minimaal 3 delen)
  // Email kan : bevatten (theoretisch), maar destination en expiresAt zijn de laatste twee
  // We splitsen van rechts: expiresAt is altijd het laatste, destination het voorlaatste
  if (parts.length < 3) {
    return ongeldig;
  }

  const expiresAtStr = parts[parts.length - 1];
  const destination = parts[parts.length - 2];
  // Email is alles daarvoor (voor het geval email een : bevat, wat onwaarschijnlijk maar veilig)
  const email = parts.slice(0, parts.length - 2).join(PAYLOAD_SEPARATOR);

  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt)) {
    return ongeldig;
  }

  // Check of verlopen
  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt) {
    return {
      email,
      destination: destination || undefined,
      valid: false,
      expired: true,
    };
  }

  return {
    email,
    destination: destination || undefined,
    valid: true,
    expired: false,
  };
}
