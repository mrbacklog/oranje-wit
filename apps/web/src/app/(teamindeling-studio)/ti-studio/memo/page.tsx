export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import KanbanBord, { type KanbanWerkitem } from "./KanbanBord";

// ──────────────────────────────────────────────────────────
// Page — Server Component
// ──────────────────────────────────────────────────────────

export default async function MemoKanbanPage() {
  const kaders = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true },
  });

  if (!kaders) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "var(--text-2, #9ca3af)",
          fontSize: 13,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Geen actief werkseizoen gevonden.
      </div>
    );
  }

  const werkitems = await prisma.werkitem.findMany({
    where: {
      kadersId: kaders.id,
      type: "MEMO",
    },
    include: {
      team: { select: { naam: true, categorie: true } },
      speler: { select: { roepnaam: true, achternaam: true } },
      staf: { select: { naam: true } },
    },
    orderBy: { volgorde: "asc" },
  });

  // Serialiseer Date → ISO string voor client component
  const geserialiseerd: KanbanWerkitem[] = werkitems.map((w) => ({
    id: w.id,
    status: String(w.status),
    prioriteit: String(w.prioriteit),
    beschrijving: w.beschrijving,
    volgorde: w.volgorde,
    createdAt: w.createdAt.toISOString(),
    teamId: w.teamId,
    spelerId: w.spelerId,
    stafId: w.stafId,
    team: w.team ? { naam: w.team.naam, categorie: String(w.team.categorie) } : null,
    speler: w.speler ? { roepnaam: w.speler.roepnaam, achternaam: w.speler.achternaam } : null,
    staf: w.staf ? { naam: w.staf.naam } : null,
  }));

  return <KanbanBord initialItems={geserialiseerd} />;
}
