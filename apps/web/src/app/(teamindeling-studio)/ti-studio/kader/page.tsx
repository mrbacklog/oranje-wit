export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getTeamtypeKaders, getKaderMemos } from "./actions";
import { KaderView } from "@/components/ti-studio/kader/KaderView";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

// ──────────────────────────────────────────────────────────
// Page — Server Component
// ──────────────────────────────────────────────────────────

export default async function KaderPage() {
  const seizoen = HUIDIG_SEIZOEN;

  const [opgeslagenKaders, kadersRecord] = await Promise.all([
    getTeamtypeKaders(seizoen),
    prisma.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: { id: true },
    }),
  ]);

  const memos = kadersRecord
    ? await getKaderMemos(kadersRecord.id)
    : { tcAlgemeen: [], perDoelgroep: {} };

  return (
    <KaderView
      seizoen={seizoen}
      opgeslagenKaders={opgeslagenKaders}
      kadersId={kadersRecord?.id ?? ""}
      tcAlgemeenMemos={memos.tcAlgemeen}
      memosPerDoelgroep={memos.perDoelgroep}
    />
  );
}
