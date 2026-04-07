import { cookies } from "next/headers";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";
import { prisma } from "./db/prisma";

const COOKIE_NAME = "actief-seizoen";
const SEIZOEN_REGEX = /^\d{4}-\d{4}$/;

export interface SeizoenInfo {
  seizoen: string;
  isWerkseizoen: boolean;
}

/**
 * Haal het actieve seizoen op uit de cookie, of val terug op het werkseizoen.
 */
export async function getActiefSeizoen(): Promise<string> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;

  if (cookie && SEIZOEN_REGEX.test(cookie)) {
    const bestaat = await prisma.kaders.findUnique({
      where: { seizoen: cookie },
      select: { seizoen: true },
    });
    if (bestaat) return cookie;
  }

  // Fallback: het werkseizoen
  const werkseizoen = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { seizoen: true },
  });
  if (werkseizoen) return werkseizoen.seizoen;

  // Laatste fallback: nieuwste blauwdruk
  const laatste = await prisma.kaders.findFirst({
    orderBy: { seizoen: "desc" },
    select: { seizoen: true },
  });

  return laatste?.seizoen ?? HUIDIG_SEIZOEN;
}

/**
 * Alle beschikbare seizoenen met werkseizoen-vlag (nieuwste eerst).
 */
export async function getAlleSeizoenen(): Promise<SeizoenInfo[]> {
  const blauwdrukken = await prisma.kaders.findMany({
    select: { seizoen: true, isWerkseizoen: true },
    orderBy: { seizoen: "desc" },
  });
  return blauwdrukken.map((b) => ({ seizoen: b.seizoen, isWerkseizoen: b.isWerkseizoen }));
}

/**
 * Is dit het werkseizoen (het enige bewerkbare seizoen)?
 */
export async function isWerkseizoenCheck(seizoen: string): Promise<boolean> {
  const blauwdruk = await prisma.kaders.findUnique({
    where: { seizoen },
    select: { isWerkseizoen: true },
  });
  return blauwdruk?.isWerkseizoen === true;
}

/**
 * Guard: gooi een fout als het seizoen niet het werkseizoen is.
 */
export async function assertBewerkbaar(seizoen: string): Promise<void> {
  const bewerkbaar = await isWerkseizoenCheck(seizoen);
  if (!bewerkbaar) {
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

/**
 * Bereken het vorige seizoen: "2026-2027" → "2025-2026"
 */
export function vorigSeizoen(seizoen: string): string {
  const [start] = seizoen.split("-").map(Number);
  return `${start - 1}-${start}`;
}
