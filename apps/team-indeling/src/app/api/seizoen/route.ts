import { cookies } from "next/headers";
import { ok, fail } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const { seizoen } = await request.json();

    if (!/^\d{4}-\d{4}$/.test(seizoen)) {
      return fail("Ongeldig seizoensformaat", 400, "VALIDATION_ERROR");
    }

    const bestaat = await prisma.blauwdruk.findUnique({
      where: { seizoen },
      select: { seizoen: true },
    });
    if (!bestaat) {
      return fail(`Seizoen ${seizoen} bestaat niet`, 404, "NOT_FOUND");
    }

    const cookieStore = await cookies();
    cookieStore.set("actief-seizoen", seizoen, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return ok({ seizoen });
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}
