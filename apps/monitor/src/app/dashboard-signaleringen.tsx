import Link from "next/link";
import { getSignaleringen } from "@/lib/queries/signalering";
import { SignaleringCard } from "@/components/signalering/SignaleringCard";

export async function DashboardSignaleringen({ seizoen }: { seizoen: string }) {
  const signaleringen = await getSignaleringen(seizoen);
  const topSignaleringen = signaleringen.slice(0, 3);

  if (topSignaleringen.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-gray-700 uppercase">
          Signaleringen
        </h3>
        <Link
          href="/signalering"
          className="text-ow-oranje hover:text-ow-oranje/80 text-sm font-medium"
        >
          Toon alle ({signaleringen.length}) →
        </Link>
      </div>
      <div className="space-y-3">
        {topSignaleringen.map((s) => (
          <SignaleringCard key={s.id} signalering={s} />
        ))}
      </div>
    </div>
  );
}
