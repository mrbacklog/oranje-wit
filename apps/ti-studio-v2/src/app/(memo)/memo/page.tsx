import { getActiefKadersId, getMemoKaarten } from "@/lib/memo-queries";
import { KanbanBord } from "@/components/memo/KanbanBord";

export default async function MemoPage() {
  const kadersId = await getActiefKadersId();

  if (!kadersId) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontSize: 13,
        }}
      >
        Geen actief werkseizoen gevonden. Activeer eerst een kaders-seizoen.
      </div>
    );
  }

  const memos = await getMemoKaarten(kadersId);

  return <KanbanBord memos={memos} kadersId={kadersId} />;
}
