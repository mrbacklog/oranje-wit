import {
  getBlauwdruk,
  getSpelersUitgebreid,
  getLedenStatistieken,
  getPinsVoorBlauwdruk,
} from "./actions";
import { getBlauwdrukSpelers, getGezienVoortgang } from "./gezien-actions";
import { getBesluiten, getBesluitStats } from "./besluit-actions";
import type { CategorieKaders } from "./categorie-kaders";
import BlauwdrukTabs from "@/components/teamindeling/blauwdruk/BlauwdrukTabs";
import { getActiefSeizoen, vorigSeizoen } from "@/lib/teamindeling/seizoen";
import { prisma } from "@/lib/teamindeling/db/prisma";
import {
  getWerkitems,
  getWerkitemStats,
} from "@/app/(teamindeling-studio)/ti-studio/werkbord/actions";
import type { WerkitemData } from "@/components/teamindeling/werkbord/WerkitemKaart";

export const dynamic = "force-dynamic";

export default async function BlauwdrukPage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);

  const vorigSzn = vorigSeizoen(seizoen);

  const [
    spelers,
    statistieken,
    werkitems,
    werkitemStats,
    pins,
    gezienRecords,
    gezienVoortgang,
    gezienUsers,
    besluitRecords,
    besluitStats,
    referentieTeams,
    evaluatieRondes,
  ] = await Promise.all([
    getSpelersUitgebreid(),
    getLedenStatistieken(),
    getWerkitems(blauwdruk.id),
    getWerkitemStats(blauwdruk.id),
    getPinsVoorBlauwdruk(blauwdruk.id),
    getBlauwdrukSpelers(blauwdruk.id),
    getGezienVoortgang(blauwdruk.id),
    prisma.user.findMany({ select: { id: true, naam: true }, orderBy: { naam: "asc" } }),
    getBesluiten(blauwdruk.id),
    getBesluitStats(blauwdruk.id),
    prisma.referentieTeam.findMany({
      where: { seizoen: vorigSzn },
      select: {
        id: true,
        naam: true,
        seizoen: true,
        teamType: true,
        niveau: true,
        poolVeld: true,
        teamscore: true,
        spelerIds: true,
      },
      orderBy: { naam: "asc" },
    }),
    prisma.evaluatieRonde.findMany({
      where: { seizoen: vorigSzn, type: "trainer" },
      orderBy: { ronde: "asc" },
      select: { id: true, seizoen: true, ronde: true, naam: true, status: true },
    }),
  ]);

  const blockers = (werkitems as WerkitemData[]).filter(
    (w) => w.prioriteit === "BLOCKER" && w.status !== "OPGELOST" && w.status !== "GEARCHIVEERD"
  );

  const kaders = (blauwdruk.kaders ?? {}) as CategorieKaders;

  async function refreshWerkitems() {
    "use server";
    const [nieuweWerkitems, nieuweStats] = await Promise.all([
      getWerkitems(blauwdruk.id),
      getWerkitemStats(blauwdruk.id),
    ]);
    return { werkitems: nieuweWerkitems, stats: nieuweStats };
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Blauwdruk
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Strategische kaders en speerpunten voor seizoen {seizoen}
        </p>
      </div>

      <BlauwdrukTabs
        statistieken={statistieken}
        kaders={kaders}
        blauwdrukId={blauwdruk.id}
        spelers={spelers}
        toelichting={blauwdruk.toelichting ?? ""}
        blockers={blockers}
        werkitems={werkitems}
        werkitemStats={werkitemStats}
        refreshWerkitems={refreshWerkitems}
        pins={pins}
        gezienRecords={gezienRecords}
        gezienVoortgang={gezienVoortgang}
        gezienUsers={gezienUsers}
        besluitRecords={besluitRecords}
        besluitStats={besluitStats}
        referentieTeams={referentieTeams}
        seizoen={seizoen}
        evaluatieRondes={evaluatieRondes}
      />
    </div>
  );
}
