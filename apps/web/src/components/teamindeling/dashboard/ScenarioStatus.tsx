import { Badge } from "@oranje-wit/ui";
import Link from "next/link";

interface ScenarioInfo {
  id: string;
  naam: string;
  status: string;
  updatedAt: Date;
  _count: { versies: number };
}

interface Props {
  scenarios: ScenarioInfo[];
}

const statusKleur: Record<string, "green" | "blue" | "gray" | "orange"> = {
  ACTIEF: "blue",
  DEFINITIEF: "green",
  GEARCHIVEERD: "gray",
};

export function ScenarioStatus({ scenarios }: Props) {
  if (scenarios.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        Nog geen scenario&apos;s.{" "}
        <Link href="/ti-studio/indeling" className="text-ow-oranje hover:underline">
          Maak een scenario &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium tracking-wide text-gray-500 uppercase">Scenario&apos;s</h3>
      {scenarios.map((s) => (
        <Link
          key={s.id}
          href={`/ti-studio/indeling`}
          className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <span className="font-medium text-gray-900">{s.naam}</span>
          <Badge color={statusKleur[s.status] || "gray"}>{s.status.toLowerCase()}</Badge>
        </Link>
      ))}
    </div>
  );
}
