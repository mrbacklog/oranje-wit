import { guardTC } from "@oranje-wit/auth/checks";
import { ok, fail } from "@/lib/teamindeling/api";
import { parseCsvContent } from "@/lib/teamindeling/leden-csv";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { createWerkitem } from "@/app/(teamindeling-studio)/ti-studio/indeling/werkitem-actions";
import { logger } from "@oranje-wit/types";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const SelectieSchema = z.object({
  nieuweLeden: z.array(z.string()),
  vertrokkenSpelers: z.array(z.string()),
  kadersId: z.string().min(1),
});

export async function POST(request: Request) {
  const auth = await guardTC();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("csv");
    if (!file || !(file instanceof File)) {
      return fail("Geen CSV-bestand meegegeven", 400, "MISSING_FILE");
    }

    const selectieRaw = formData.get("selectie");
    if (!selectieRaw || typeof selectieRaw !== "string") {
      return fail("Geen selectie meegegeven", 400, "MISSING_SELECTIE");
    }

    const parsed = SelectieSchema.safeParse(JSON.parse(selectieRaw));
    if (!parsed.success) {
      return fail(`Ongeldige selectie: ${parsed.error.message}`, 400, "INVALID_SELECTIE");
    }
    const selectie = parsed.data;

    const csvContent = await file.text();
    const rijen = parseCsvContent(csvContent);
    const bondsleden = rijen.filter((r) => r.lidsoort === "Bondslid" && !r.afmelddatum);

    // 1. Upsert alle bondsleden in de leden-tabel
    let ledenBijgewerkt = 0;
    for (const rij of bondsleden) {
      await prisma.lid.upsert({
        where: { relCode: rij.relCode },
        update: {
          roepnaam: rij.roepnaam,
          achternaam: rij.achternaam,
          tussenvoegsel: rij.tussenvoegsel,
          voorletters: rij.voorletters,
          geslacht: rij.geslacht,
          geboortejaar: rij.geboortejaar,
          geboortedatum: rij.geboortedatum ? new Date(rij.geboortedatum) : null,
          lidsoort: rij.lidsoort,
          email: rij.email,
          lidSinds: rij.lidSinds ? new Date(rij.lidSinds) : null,
          afmelddatum: rij.afmelddatum ? new Date(rij.afmelddatum) : null,
          registratieDatum: rij.registratieDatum ? new Date(rij.registratieDatum) : null,
        },
        create: {
          relCode: rij.relCode,
          roepnaam: rij.roepnaam,
          achternaam: rij.achternaam,
          tussenvoegsel: rij.tussenvoegsel,
          voorletters: rij.voorletters,
          geslacht: rij.geslacht,
          geboortejaar: rij.geboortejaar,
          geboortedatum: rij.geboortedatum ? new Date(rij.geboortedatum) : null,
          lidsoort: rij.lidsoort,
          email: rij.email,
          lidSinds: rij.lidSinds ? new Date(rij.lidSinds) : null,
          afmelddatum: rij.afmelddatum ? new Date(rij.afmelddatum) : null,
          registratieDatum: rij.registratieDatum ? new Date(rij.registratieDatum) : null,
        },
      });
      ledenBijgewerkt++;
    }

    // 2. Nieuwe Spelers aanmaken
    let spelersAangemaakt = 0;
    const rijMap = new Map(bondsleden.map((r) => [r.relCode, r]));

    for (const relCode of selectie.nieuweLeden) {
      const rij = rijMap.get(relCode);
      if (!rij) continue;

      // Check of Speler al bestaat (voorkom dubbelen)
      const bestaat = await prisma.speler.findUnique({ where: { id: relCode } });
      if (bestaat) continue;

      await prisma.speler.create({
        data: {
          id: relCode,
          roepnaam: rij.roepnaam,
          achternaam: rij.achternaam,
          geboortejaar: rij.geboortejaar,
          geboortedatum: rij.geboortedatum ? new Date(rij.geboortedatum) : null,
          geslacht: rij.geslacht === "M" ? "M" : "V",
          lidSinds: rij.lidSinds ?? null,
          status: "NIEUW_POTENTIEEL",
        },
      });
      spelersAangemaakt++;

      // Werkitem per nieuwe speler
      const naam = [rij.roepnaam, rij.tussenvoegsel, rij.achternaam].filter(Boolean).join(" ");
      await createWerkitem({
        kadersId: selectie.kadersId,
        titel: `Nieuwe aanmelding: ${naam}`,
        beschrijving: `Nieuw lid (${rij.geslacht}, ${rij.geboortejaar}) via leden-sync`,
        type: "SPELER",
        prioriteit: "MIDDEL",
        entiteit: "SPELER",
        spelerId: relCode,
      });
    }

    // 3. Vertrokken spelers markeren als GAAT_STOPPEN
    let spelersGemarkeerd = 0;
    for (const relCode of selectie.vertrokkenSpelers) {
      // Check of er een SPELER_STATUS pin is → skip
      const pin = await prisma.pin.findFirst({
        where: {
          kadersId: selectie.kadersId,
          type: "SPELER_STATUS",
          spelerId: relCode,
        },
      });
      if (pin) continue;

      // Alleen wijzigen als status NIET al handmatig GAAT_STOPPEN is
      const speler = await prisma.speler.findUnique({
        where: { id: relCode },
        select: { status: true, roepnaam: true, achternaam: true },
      });
      if (!speler || speler.status === "GAAT_STOPPEN") continue;

      await prisma.speler.update({
        where: { id: relCode },
        data: { status: "GAAT_STOPPEN" },
      });
      spelersGemarkeerd++;
    }

    // Werkitem voor vertrokken spelers (samenvattend)
    if (spelersGemarkeerd > 0) {
      await createWerkitem({
        kadersId: selectie.kadersId,
        titel: `${spelersGemarkeerd} speler(s) afgemeld`,
        beschrijving: "Automatisch gemarkeerd als 'gaat stoppen' via leden-sync",
        type: "SPELER",
        prioriteit: "HOOG",
        entiteit: "SPELER",
      });
    }

    revalidatePath("/blauwdruk");

    logger.info(
      `[leden-sync] Verwerkt: ${ledenBijgewerkt} leden, ${spelersAangemaakt} spelers aangemaakt, ${spelersGemarkeerd} als stoppend gemarkeerd`
    );

    return ok({
      ledenBijgewerkt,
      spelersAangemaakt,
      spelersGemarkeerd,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[leden-sync] Verwerk fout:", msg);
    return fail(msg);
  }
}
