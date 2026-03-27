import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { BandItemEditor } from "./band-item-editor";

// Prisma 7 type recursion workaround
const db = prisma as any;

const GELDIGE_BANDEN = ["paars", "blauw", "groen", "geel", "oranje", "rood"];

export default async function BandPage({
  params,
  searchParams,
}: {
  params: Promise<{ band: string }>;
  searchParams: Promise<{ versieId?: string }>;
}) {
  const { band } = await params;
  const { versieId } = await searchParams;

  if (!GELDIGE_BANDEN.includes(band)) {
    notFound();
  }

  // Zoek de versie
  let versie;
  if (versieId) {
    versie = await db.raamwerkVersie.findUnique({ where: { id: versieId } });
  } else {
    // Zoek eerst CONCEPT (bewerkbaar), anders ACTIEF
    versie = await db.raamwerkVersie.findFirst({
      where: { status: "CONCEPT" },
      orderBy: { createdAt: "desc" },
    });
    if (!versie) {
      versie = await db.raamwerkVersie.findFirst({
        where: { status: "ACTIEF" },
      });
    }
  }

  if (!versie) {
    return (
      <div className="bg-surface-card rounded-2xl border border-white/10 p-12 text-center">
        <p className="text-text-secondary">
          Geen raamwerkversie gevonden. Maak eerst een nieuwe versie aan of draai het seed-script.
        </p>
      </div>
    );
  }

  // Haal de leeftijdsgroep op met pijlers en items
  const groep = await db.leeftijdsgroep.findUnique({
    where: {
      versieId_band: {
        versieId: versie.id,
        band,
      },
    },
    include: {
      pijlers: {
        orderBy: { volgorde: "asc" },
        include: {
          items: {
            orderBy: { volgorde: "asc" },
          },
        },
      },
    },
  });

  if (!groep) {
    return (
      <div className="bg-surface-card rounded-2xl border border-white/10 p-12 text-center">
        <p className="text-text-secondary">
          Leeftijdsgroep &quot;{band}&quot; niet gevonden in deze versie.
        </p>
      </div>
    );
  }

  type PijlerRow = {
    id: string;
    code: string;
    naam: string;
    icoon: string | null;
    volgorde: number;
    blok: string | null;
    items: Array<{
      id: string;
      itemCode: string;
      label: string;
      vraagTekst: string;
      isKern: boolean;
      categorie: string | null;
      volgorde: number;
      actief: boolean;
    }>;
  };

  const pijlerData = groep.pijlers.map((p: PijlerRow) => ({
    id: p.id,
    code: p.code,
    naam: p.naam,
    icoon: p.icoon,
    volgorde: p.volgorde,
    blok: p.blok,
    items: p.items.map((i) => ({
      id: i.id,
      itemCode: i.itemCode,
      label: i.label,
      vraagTekst: i.vraagTekst,
      isKern: i.isKern,
      categorie: i.categorie,
      volgorde: i.volgorde,
      actief: i.actief,
    })),
  }));

  return (
    <BandItemEditor
      band={band}
      versie={{
        id: versie.id,
        seizoen: versie.seizoen,
        naam: versie.naam,
        status: versie.status,
      }}
      groep={{
        id: groep.id,
        kernItemsTarget: groep.kernItemsTarget,
        schaalType: groep.schaalType,
      }}
      pijlers={pijlerData}
    />
  );
}
