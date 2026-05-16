import { type NextRequest } from "next/server";
import { guardTC } from "@oranje-wit/auth/checks";
import { db } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ relCode: string }> }
): Promise<Response> {
  const guard = await guardTC();
  if (!guard.ok) return guard.response;

  const { relCode } = await params;

  try {
    const foto = await db.lidFoto.findUnique({
      where: { relCode },
      select: { imageWebp: true },
    });

    if (!foto?.imageWebp) {
      return new Response(null, { status: 404 });
    }

    return new Response(foto.imageWebp, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    logger.warn("foto route: fout bij ophalen foto", error);
    return new Response(null, { status: 500 });
  }
}
