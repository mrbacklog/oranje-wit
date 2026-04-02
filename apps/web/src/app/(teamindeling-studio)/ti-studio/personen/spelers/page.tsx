import { getBlauwdruk } from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/actions";
import {
  getBlauwdrukSpelers,
  getGezienVoortgang,
} from "@/app/(teamindeling-studio)/ti-studio/blauwdruk/gezien-actions";
import GezienOverzicht from "@/components/teamindeling/blauwdruk/GezienOverzicht";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { prisma } from "@/lib/teamindeling/db/prisma";

export const dynamic = "force-dynamic";

export default async function PersonenSpelersPage() {
  const seizoen = await getActiefSeizoen();
  const blauwdruk = await getBlauwdruk(seizoen);

  const [gezienRecords, gezienVoortgang, gezienUsers] = await Promise.all([
    getBlauwdrukSpelers(blauwdruk.id),
    getGezienVoortgang(blauwdruk.id),
    prisma.user.findMany({ select: { id: true, naam: true }, orderBy: { naam: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Spelers
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Spelersoverzicht en gezien-status voor seizoen {seizoen}
        </p>
      </div>

      <GezienOverzicht
        blauwdrukId={blauwdruk.id}
        initialRecords={gezienRecords}
        initialVoortgang={gezienVoortgang}
        users={gezienUsers}
      />
    </div>
  );
}
