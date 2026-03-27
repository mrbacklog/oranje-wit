import { prisma } from "@/lib/db/prisma";

// Prisma 7 type recursie workaround (TS2321)
type PrismaFn = (...args: any[]) => any;
import { ok, fail } from "@/lib/api/response";
import { requireEditor } from "@oranje-wit/auth/checks";
import { renderTemplate, verstuurEmail } from "@/lib/evaluatie/mail";
import { logger } from "@oranje-wit/types";

// Categorieen die zelfevaluatie krijgen (geen jongste jeugd)
const ELIGIBLE_CATEGORIES = ["Senioren", "A-jeugd", "B-jeugd"];

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireEditor();
    const { id } = await params;

    // Prisma 7 type recursie workaround (TS2321)
    const ronde = await (prisma.evaluatieRonde.findUnique as PrismaFn)({
      where: { id },
    });
    if (!ronde) return fail("Ronde niet gevonden", 404, "NOT_FOUND");
    if (ronde.type !== "speler") return fail("Ronde is niet van type 'speler'", 400, "WRONG_TYPE");
    if (ronde.status !== "actief") return fail("Ronde is niet actief", 400, "RONDE_NIET_ACTIEF");

    // Haal eligible teams op
    // Prisma 7 type recursie workaround (TS2321)
    const teams = await (prisma.oWTeam.findMany as PrismaFn)({
      where: {
        seizoen: ronde.seizoen,
        categorie: { in: ELIGIBLE_CATEGORIES },
      },
      select: { id: true, naam: true, categorie: true },
    });

    const teamNamen = teams.map(
      (t: { id: number; naam: string | null; categorie: string | null }) => t.naam
    );

    // Haal spelers op met e-mailadres
    // Prisma 7 type recursie workaround (TS2321)
    const spelers = await (prisma.competitieSpeler.findMany as PrismaFn)({
      where: {
        seizoen: ronde.seizoen,
        team: { in: teamNamen.filter((n: string | null): n is string => n !== null) },
      },
      select: {
        relCode: true,
        team: true,
        lid: {
          select: {
            roepnaam: true,
            tussenvoegsel: true,
            achternaam: true,
            email: true,
          },
        },
      },
    });

    // Filter spelers met e-mailadres
    const metEmail = spelers.filter(
      (s: {
        relCode: string;
        team: string;
        lid: {
          roepnaam: string;
          tussenvoegsel: string | null;
          achternaam: string;
          email: string | null;
        } | null;
      }) => s.lid?.email
    );

    // Prisma 7 type recursie workaround (TS2321)
    const template = await (prisma.emailTemplate.findUnique as PrismaFn)({
      where: { sleutel: "speler_uitnodiging" },
    });
    if (!template)
      return fail("Template 'speler_uitnodiging' niet gevonden", 500, "TEMPLATE_MISSING");

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:4104";
    const deadlineStr = ronde.deadline.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let verstuurd = 0;

    // Find team id mapping
    const teamIdMap = new Map(
      teams.map((t: { id: number; naam: string | null }) => [t.naam, t.id])
    );

    for (const s of metEmail) {
      const naam = s.lid
        ? `${s.lid.roepnaam} ${s.lid.tussenvoegsel ? s.lid.tussenvoegsel + " " : ""}${s.lid.achternaam}`
        : s.relCode;
      const email = s.lid!.email!;
      const owTeamId = teamIdMap.get(s.team) ?? null;

      // Upsert uitnodiging
      // Prisma 7 type recursie workaround (TS2321)
      const uitnodiging = await (prisma.evaluatieUitnodiging.upsert as PrismaFn)({
        where: {
          rondeId_email_owTeamId: {
            rondeId: id,
            email,
            owTeamId: owTeamId ?? 0,
          },
        },
        update: {},
        create: {
          rondeId: id,
          type: "speler",
          email,
          naam,
          owTeamId,
          spelerId: s.relCode,
        },
      });

      const html = renderTemplate(template.inhoudHtml, {
        speler_naam: naam,
        deadline: deadlineStr,
        ronde_naam: ronde.naam,
        link: `${baseUrl}/zelf?token=${uitnodiging.token}`,
      });

      const onderwerp = renderTemplate(template.onderwerp, {
        ronde_naam: ronde.naam,
        deadline: deadlineStr,
      });

      try {
        await verstuurEmail({ aan: email, onderwerp, html });
        // Prisma 7 type recursie workaround (TS2321)
        await (prisma.evaluatieUitnodiging.update as PrismaFn)({
          where: { id: uitnodiging.id },
          data: { emailVerstuurd: new Date() },
        });
        verstuurd++;
      } catch (emailError) {
        logger.warn(`E-mail naar ${email} mislukt:`, emailError);
      }
    }

    return ok({ verstuurd, totaal: metEmail.length });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
