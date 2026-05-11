/**
 * Deterministische HMAC-SHA256 helpers voor anonimisatie.
 *
 * Cruciaal: alle rel_code-referenties (Lid.relCode, Speler.id, Staf.relCode,
 * CompetitieSpeler.relCode, Ledenverloop.relCode, LidFoto.relCode,
 * SportlinkNotificatie.relCode, etc.) gaan door `hashRelCode()` zodat
 * referentie-integriteit behouden blijft.
 */

import { createHmac } from "crypto";

/**
 * Maak een deterministische digest van een waarde met de gegeven salt.
 * Returnt het volledige 64-char hex digest (kan via .slice() worden afgekapt).
 */
export function hmacDigest(value: string, salt: string): string {
  return createHmac("sha256", salt).update(value).digest("hex");
}

/**
 * Hash een rel_code naar een 12-char numerieke string (zelfde lengte/vorm
 * als productie rel_codes, blijft bruikbaar in queries en logs).
 *
 * We mappen het hex digest naar decimale cijfers zodat het op een
 * Sportlink-relatienummer lijkt.
 */
export function hashRelCode(relCode: string, salt: string): string {
  const digest = hmacDigest(relCode, salt);
  // Pak de eerste 12 hex chars, converteer naar bigint, modulo 10^12,
  // en pad met nullen tot 12 cijfers.
  const slice = digest.slice(0, 12);
  const asBig = BigInt("0x" + slice);
  const mod = asBig % BigInt(1_000_000_000_000); // 10^12
  return mod.toString().padStart(12, "0");
}

/**
 * Hash een email naar een test-domein adres. Geen omkeerbaarheid mogelijk.
 */
export function hashEmail(email: string | null | undefined, salt: string): string | null {
  if (!email) return null;
  const digest = hmacDigest(email.toLowerCase(), salt);
  return digest.slice(0, 12) + "@test.local";
}

/**
 * Generieke deterministische index in een array, op basis van een seed.
 * Gebruik dit voor naam-, foto-, en placeholder-keuzes.
 */
export function deterministicIndex(
  seed: string,
  salt: string,
  slice: [number, number],
  modulo: number
): number {
  const digest = hmacDigest(seed, salt);
  const hex = digest.slice(slice[0], slice[1]);
  const n = parseInt(hex, 16);
  if (Number.isNaN(n) || modulo <= 0) return 0;
  return n % modulo;
}
