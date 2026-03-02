import { cookies } from "next/headers";
import { prisma } from "./db/prisma";

const COOKIE_NAME = "actief-seizoen";
const SEIZOEN_REGEX = /^\d{4}-\d{4}$/;

/**
 * Haal het actieve seizoen op uit de cookie, of val terug op het nieuwste seizoen.
 */
export async function getActiefSeizoen(): Promise<string> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;

  if (cookie && SEIZOEN_REGEX.test(cookie)) {
    // Controleer of dit seizoen ook echt bestaat
    const bestaat = await prisma.blauwdruk.findUnique({
      where: { seizoen: cookie },
      select: { seizoen: true },
    });
    if (bestaat) return cookie;
  }

  // Fallback: nieuwste seizoen
  const laatste = await prisma.blauwdruk.findFirst({
    orderBy: { seizoen: "desc" },
    select: { seizoen: true },
  });

  return laatste?.seizoen ?? "2026-2027";
}

/**
 * Alle beschikbare seizoenen (nieuwste eerst).
 */
export async function getAlleSeizoenen(): Promise<string[]> {
  const blauwdrukken = await prisma.blauwdruk.findMany({
    select: { seizoen: true },
    orderBy: { seizoen: "desc" },
  });
  return blauwdrukken.map((b) => b.seizoen);
}

/**
 * Is dit het nieuwste (en dus bewerkbare) seizoen?
 */
export async function isHuidigSeizoen(seizoen: string): Promise<boolean> {
  const laatste = await prisma.blauwdruk.findFirst({
    orderBy: { seizoen: "desc" },
    select: { seizoen: true },
  });
  return laatste?.seizoen === seizoen;
}

/**
 * Guard: gooi een fout als het seizoen niet bewerkbaar is.
 */
export async function assertBewerkbaar(seizoen: string): Promise<void> {
  const huidig = await isHuidigSeizoen(seizoen);
  if (!huidig) {
    throw new Error(`Seizoen ${seizoen} is alleen-lezen`);
  }
}

/**
 * Bereken het volgende seizoen: "2026-2027" → "2027-2028"
 */
export function volgendSeizoen(seizoen: string): string {
  const [start] = seizoen.split("-").map(Number);
  return `${start + 1}-${start + 2}`;
}
