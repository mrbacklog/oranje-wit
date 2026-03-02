import { getSignaleringen } from "@/lib/queries/signalering";
import { SignaleringCard } from "@/components/signalering/SignaleringCard";

export async function DashboardSignaleringen({ seizoen }: { seizoen: string }) {
  const signaleringen = await getSignaleringen(seizoen);
  const topSignaleringen = signaleringen.slice(0, 3);

  if (topSignaleringen.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold tracking-wide text-gray-700 uppercase">
        Signaleringen
      </h3>
      <div className="space-y-3">
        {topSignaleringen.map((s) => (
          <SignaleringCard key={s.id} signalering={s} />
        ))}
      </div>
    </div>
  );
}
