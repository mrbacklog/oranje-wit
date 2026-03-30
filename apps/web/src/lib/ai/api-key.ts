import { prisma } from "@/lib/db/prisma";

/**
 * Haalt een AI API key op. Eerst uit de database (Beheer → Instellingen),
 * dan uit environment variables als fallback.
 */
export async function getAiApiKey(sleutel: string): Promise<string | undefined> {
  // Database eerst (ingesteld via Beheer → Systeem → Instellingen)
  const instelling = await prisma.instelling.findUnique({ where: { sleutel } }).catch(() => null);

  if (instelling?.waarde) return instelling.waarde;

  // Fallback naar environment variable
  return process.env[sleutel] || undefined;
}
