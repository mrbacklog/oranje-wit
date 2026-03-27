import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getFoto } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";

/**
 * Serveert een spelerfoto (webp) op basis van speler-ID (= Lid.relCode).
 * Cached voor 1 uur in de browser.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const imageData = await getFoto(prisma, id);

    if (!imageData) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(new Uint8Array(imageData), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    logger.error("Foto ophalen mislukt voor", id, error);
    return new NextResponse(null, { status: 500 });
  }
}
