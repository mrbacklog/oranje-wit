import { NextResponse } from "next/server";
import { getTeamsVoorPresentatie } from "../../../(protected)/presentatie/actions";
import { getPublicatieInstellingen } from "../../../(protected)/presentatie/publicatie-actions";
import { bouwPreseasonPdfSecties } from "../../../(protected)/presentatie/preseason-pdf-data";
import { genereerPreseasonPdf } from "../../../(protected)/presentatie/preseason-pdf-renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [teamsResult, instellingenResult] = await Promise.all([
    getTeamsVoorPresentatie(),
    getPublicatieInstellingen(),
  ]);

  if (!teamsResult.ok) {
    return NextResponse.json({ error: teamsResult.error }, { status: 500 });
  }

  if (!instellingenResult.ok) {
    return NextResponse.json({ error: instellingenResult.error }, { status: 500 });
  }

  const instellingen = instellingenResult.data;
  const secties = bouwPreseasonPdfSecties(teamsResult.data.teams, instellingen.sectieVolgorde);
  const pdf = await genereerPreseasonPdf({ instellingen, secties });
  const bestandsnaam = `pre-season-teamindeling-${slug(instellingen.seizoenLabel)}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${bestandsnaam}"`,
      "Cache-Control": "no-store",
    },
  });
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
