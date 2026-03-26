import { prisma } from "@/lib/db/prisma";
import { ok, fail } from "@/lib/api";
import { requireEditor } from "@oranje-wit/auth/checks";
import { renderTemplate, verstuurEmail } from "@/lib/mail";
import { logger } from "@oranje-wit/types";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;

    // Prisma 7 type recursie workaround (TS2321)
    const ronde = await (prisma.evaluatieRonde.findUnique as Function)({
      where: { id },
    });
    if (!ronde) return fail("Ronde niet gevonden", 404, "NOT_FOUND");
    if (ronde.status !== "actief") return fail("Ronde is niet actief", 400, "RONDE_NIET_ACTIEF");

    // Haal uitnodigingen op die nog geen evaluatie hebben
    // Prisma 7 type recursie workaround (TS2321)
    const uitnodigingen = await (prisma.evaluatieUitnodiging.findMany as Function)({
      where: {
        rondeId: id,
        type: "trainer",
      },
      include: {
        owTeam: { select: { naam: true } },
      },
    });

    // Filter: alleen uitnodigingen waarvoor geen ingediende evaluatie bestaat
    // Prisma 7 type recursie workaround (TS2321)
    const ingediend = await (prisma.evaluatie.findMany as Function)({
      where: { rondeId: id, status: "ingediend" },
      select: { coach: true, teamNaam: true },
    });
    const ingediendSet = new Set(
      ingediend.map(
        (e: { coach: string | null; teamNaam: string | null }) => `${e.coach}|${e.teamNaam}`
      )
    );

    const teHerinneren = uitnodigingen.filter(
      (u: { naam: string; owTeam?: { naam: string | null } | null }) =>
        !ingediendSet.has(`${u.naam}|${u.owTeam?.naam}`)
    );

    // Prisma 7 type recursie workaround (TS2321)
    const template = await (prisma.emailTemplate.findUnique as Function)({
      where: { sleutel: "trainer_herinnering" },
    });
    if (!template)
      return fail("E-mail template 'trainer_herinnering' niet gevonden", 500, "TEMPLATE_MISSING");

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:4104";
    let verstuurd = 0;

    for (const u of teHerinneren) {
      const deadlineStr = ronde.deadline.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const html = renderTemplate(template.inhoudHtml, {
        trainer_naam: u.naam,
        team_naam: u.owTeam?.naam ?? "Onbekend team",
        deadline: deadlineStr,
        link: `${baseUrl}/invullen?token=${u.token}`,
      });

      const onderwerp = renderTemplate(template.onderwerp, {
        team_naam: u.owTeam?.naam ?? "",
        deadline: deadlineStr,
      });

      try {
        await verstuurEmail({ aan: u.email, onderwerp, html });
        // Prisma 7 type recursie workaround (TS2321)
        await (prisma.evaluatieUitnodiging.update as Function)({
          where: { id: u.id },
          data: {
            reminderVerstuurd: new Date(),
            reminderAantal: { increment: 1 },
          },
        });
        verstuurd++;
      } catch (emailError) {
        logger.warn(`Herinnering naar ${u.email} mislukt:`, emailError);
      }
    }

    return ok({ verstuurd, totaal: teHerinneren.length });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
