"use server";

import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/db/prisma";
import { logger, type ActionResult } from "@oranje-wit/types";
import { revalidatePath } from "next/cache";

// ── Queries ─────────────────────────────────────────────────────

export async function getInstellingen() {
  await requireTC();
  const rijen = await prisma.instelling.findMany({
    orderBy: { sleutel: "asc" },
  });
  // Masker geheime waarden
  return rijen.map((r) => ({
    ...r,
    waarde: r.geheim ? maskeer(r.waarde) : r.waarde,
  }));
}

function maskeer(waarde: string): string {
  if (waarde.length <= 8) return "••••••••";
  return waarde.slice(0, 4) + "••••" + waarde.slice(-4);
}

// ── Mutations ───────────────────────────────────────────────────

export async function saveInstelling(sleutel: string, waarde: string): Promise<ActionResult> {
  const session = await requireTC();
  const email = session?.user?.email ?? "onbekend";

  try {
    await prisma.instelling.upsert({
      where: { sleutel },
      create: {
        sleutel,
        waarde,
        geheim: sleutel.includes("KEY") || sleutel.includes("SECRET"),
        updatedBy: email,
      },
      update: {
        waarde,
        updatedBy: email,
      },
    });

    logger.info(`Instelling ${sleutel} bijgewerkt door ${email}`);
    revalidatePath("/beheer/systeem/instellingen");
    return { ok: true, data: undefined };
  } catch (error) {
    logger.warn("saveInstelling mislukt:", error);
    return { ok: false, error: "Kon instelling niet opslaan" };
  }
}

// ── Test AI-key ─────────────────────────────────────────────────

export async function testAiKey(
  sleutel: string
): Promise<ActionResult<{ model: string; antwoord: string }>> {
  await requireTC();

  try {
    // Haal de key op uit de database
    const instelling = await prisma.instelling.findUnique({
      where: { sleutel },
    });

    if (!instelling) {
      return { ok: false, error: "Geen key gevonden. Sla eerst een key op." };
    }

    if (sleutel === "GOOGLE_GENERATIVE_AI_API_KEY") {
      // Directe Gemini API test (zonder AI SDK, simpelst mogelijk)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${instelling.waarde}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: "Zeg precies: Hoi, ik ben Daisy!" }],
              },
            ],
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        logger.warn("Gemini API test mislukt:", body);
        return {
          ok: false,
          error: `API fout (${res.status}): ${body.slice(0, 200)}`,
        };
      }

      const data = await res.json();
      const antwoord = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Geen antwoord";

      return {
        ok: true,
        data: { model: "gemini-2.0-flash", antwoord },
      };
    }

    return { ok: false, error: `Onbekende provider: ${sleutel}` };
  } catch (error) {
    logger.warn("testAiKey mislukt:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Onbekende fout",
    };
  }
}
