import { prisma } from "@/lib/db/prisma";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;
import { ok, fail, parseBody } from "@/lib/api/response";
import { requireTC } from "@oranje-wit/auth/checks";
import { renderTemplate, verstuurEmail } from "@/lib/evaluatie/mail";
import { logger } from "@oranje-wit/types";
import { z } from "zod";

const UitnodigingSchema = z.object({
  uitnodigingen: z.array(
    z.object({
      email: z.string().email(),
      naam: z.string().min(1),
      owTeamId: z.number().int().positive(),
    })
  ),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTC();
    const { id } = await params;

    // Prisma 7 type recursie workaround (TS2321)
    const ronde = await (prisma.evaluatieRonde.findUnique as PrismaFn)({
      where: { id },
    });
    if (!ronde) return fail("Ronde niet gevonden", 404, "NOT_FOUND");
    if (ronde.status !== "actief") return fail("Ronde is niet actief", 400, "RONDE_NIET_ACTIEF");

    const parsed = await parseBody(request, UitnodigingSchema);
    if (!parsed.ok) return parsed.response;

    // Haal email template op
    // Prisma 7 type recursie workaround (TS2321)
    const template = await (prisma.emailTemplate.findUnique as PrismaFn)({
      where: { sleutel: "trainer_uitnodiging" },
    });
    if (!template)
      return fail("E-mail template 'trainer_uitnodiging' niet gevonden", 500, "TEMPLATE_MISSING");

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    let verstuurd = 0;

    for (const u of parsed.data.uitnodigingen) {
      // Prisma 7 type recursie workaround (TS2321)
      const team = await (prisma.oWTeam.findUnique as PrismaFn)({
        where: { id: u.owTeamId },
        select: { naam: true },
      });

      // Upsert uitnodiging (unique op rondeId + email + owTeamId)
      // Prisma 7 type recursie workaround (TS2321)
      const uitnodiging = await (prisma.evaluatieUitnodiging.upsert as PrismaFn)({
        where: {
          rondeId_email_owTeamId: {
            rondeId: id,
            email: u.email,
            owTeamId: u.owTeamId,
          },
        },
        update: {},
        create: {
          rondeId: id,
          type: "trainer",
          email: u.email,
          naam: u.naam,
          owTeamId: u.owTeamId,
        },
      });

      const deadlineStr = ronde.deadline.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const html = renderTemplate(template.inhoudHtml, {
        trainer_naam: u.naam,
        team_naam: team?.naam ?? "Onbekend team",
        deadline: deadlineStr,
        ronde_naam: ronde.naam,
        link: `${baseUrl}/invullen?token=${uitnodiging.token}`,
      });

      const onderwerp = renderTemplate(template.onderwerp, {
        ronde_naam: ronde.naam,
        team_naam: team?.naam ?? "",
        deadline: deadlineStr,
      });

      try {
        await verstuurEmail({ aan: u.email, onderwerp, html });
        // Prisma 7 type recursie workaround (TS2321)
        await (prisma.evaluatieUitnodiging.update as PrismaFn)({
          where: { id: uitnodiging.id },
          data: { emailVerstuurd: new Date() },
        });
        verstuurd++;
      } catch (emailError) {
        logger.warn(`E-mail naar ${u.email} mislukt:`, emailError);
      }
    }

    return ok({ verstuurd, totaal: parsed.data.uitnodigingen.length });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
