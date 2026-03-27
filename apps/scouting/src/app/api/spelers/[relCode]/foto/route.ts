import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getFoto } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

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

    const imageData = await getFoto(prisma, relCode);

    if (!imageData) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(new Uint8Array(imageData), {
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
