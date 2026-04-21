import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getFoto } from "@oranje-wit/database";
import { logger } from "@oranje-wit/types";
import { guardAuth } from "@oranje-wit/auth/checks";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await guardAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const staf = await prisma.staf.findUnique({
      where: { id },
      select: { relCode: true },
    });

    if (!staf?.relCode) {
      return new NextResponse(null, { status: 404 });
    }

    const imageData = await getFoto(prisma, staf.relCode);

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
    logger.error("[staf-foto] Fout bij ophalen:", error);
    return new NextResponse(null, { status: 500 });
  }
}
