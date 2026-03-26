import { NextRequest, NextResponse } from "next/server";
import { logger } from "@oranje-wit/types";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/spelers/[relCode]/foto
 * Retourneert de webp foto uit LidFoto
 * Content-Type: image/webp
 * Cache-Control: public, max-age=86400
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ relCode: string }> }
) {
  try {
    const { relCode } = await params;

    const foto = await (
      prisma.lidFoto as unknown as {
        findFirst: (args: {
          where: { relCode: string };
          select: { imageWebp: true };
        }) => Promise<{ imageWebp: Buffer } | null>;
      }
    ).findFirst({
      where: { relCode },
      select: { imageWebp: true },
    });

    if (!foto) {
      return new NextResponse(null, { status: 404 });
    }

    const imageData = new Uint8Array(foto.imageWebp);

    return new NextResponse(imageData, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    logger.error("[foto] Fout bij ophalen:", error);
    return new NextResponse(null, { status: 500 });
  }
}
