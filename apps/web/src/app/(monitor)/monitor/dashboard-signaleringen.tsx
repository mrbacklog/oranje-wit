import Link from "next/link";
import { Card, CardHeader, CardBody } from "@oranje-wit/ui";
import { getSignaleringen } from "@/lib/monitor/queries/signalering";
import { SignaleringCard } from "@/components/monitor/signalering/SignaleringCard";

export async function DashboardSignaleringen({ seizoen }: { seizoen: string }) {
  const signaleringen = await getSignaleringen(seizoen);
  const topSignaleringen = signaleringen.slice(0, 3);

  if (topSignaleringen.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: "var(--text-secondary)" }}
        >
          Signaleringen
        </h3>
        <Link
          href="/monitor/signalering"
          className="text-ow-oranje hover:text-ow-oranje/80 text-sm font-medium"
        >
          Toon alle ({signaleringen.length}) →
        </Link>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {topSignaleringen.map((s) => (
            <SignaleringCard key={s.id} signalering={s} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
