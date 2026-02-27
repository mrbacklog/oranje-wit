import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Serveert een spelerfoto (webp) op basis van speler-ID (= Lid.relCode).
 * Cached voor 1 uur in de browser.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const foto = await prisma.lidFoto.findUnique({
    where: { relCode: id },
    select: { imageWebp: true },
  });

  if (!foto) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(foto.imageWebp, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
