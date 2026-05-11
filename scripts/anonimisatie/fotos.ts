/**
 * Foto-URL generator (Optie A uit spec: randomuser.me).
 *
 * randomuser.me biedt portretten op:
 *   https://randomuser.me/api/portraits/men/{0..99}.jpg
 *   https://randomuser.me/api/portraits/women/{0..99}.jpg
 *
 * We mappen rel_code → 0..99 zodat dezelfde speler altijd dezelfde foto
 * krijgt in de test-database.
 */

import { deterministicIndex } from "./hash";

const PORTRAIT_COUNT = 100; // randomuser.me biedt 0..99 per geslacht

export function fotoUrl(geslacht: "M" | "V", relCode: string, salt: string): string {
  const folder = geslacht === "V" ? "women" : "men";
  const idx = deterministicIndex(relCode, salt, [0, 8], PORTRAIT_COUNT);
  return `https://randomuser.me/api/portraits/${folder}/${idx}.jpg`;
}
