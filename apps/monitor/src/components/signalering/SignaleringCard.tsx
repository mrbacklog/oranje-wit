import Link from "next/link";
import { SignalBadge } from "@oranje-wit/ui";
import type { SignaleringRow } from "@/lib/queries/signalering";

function getLinkVoorSignaal(s: SignaleringRow): { href: string; label: string } | null {
  switch (s.type) {
    case "retentie":
    case "trendbreuk":
      return { href: "/retentie", label: "Bekijk retentie →" };
    case "instroom":
      return { href: "/retentie?tab=instroom", label: "Bekijk instroom →" };
    case "genderdisbalans": {
      const match = s.leeftijdsgroep?.match(/geboortejaar (\d+)/);
      if (match) return { href: `/samenstelling/${match[1]}`, label: "Bekijk cohort →" };
      return { href: "/samenstelling", label: "Bekijk samenstelling →" };
    }
    case "pijplijn_vulgraad":
    case "forward_projectie":
      return { href: "/projecties", label: "Bekijk pijplijn →" };
    default:
      return null;
  }
}

const TYPE_LABELS: Record<string, string> = {
  retentie: "Retentie",
  instroom: "Instroom",
  genderdisbalans: "Genderdisbalans",
  trendbreuk: "Trendbreuk",
  pijplijn_vulgraad: "Pijplijn vulgraad",
  forward_projectie: "Forward-projectie",
};

export function SignaleringCard({ signalering }: { signalering: SignaleringRow }) {
  const ernst = signalering.ernst as "kritiek" | "aandacht" | "opkoers";
  const link = getLinkVoorSignaal(signalering);

  const borderColor =
    ernst === "kritiek"
      ? "border-l-signal-rood"
      : ernst === "aandacht"
        ? "border-l-signal-geel"
        : "border-l-signal-groen";

  return (
    <div className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${borderColor}`}>
      <div className="flex items-start gap-3">
        <SignalBadge ernst={ernst}>{ernst}</SignalBadge>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {TYPE_LABELS[signalering.type] || signalering.type}
          </p>
          {signalering.beschrijving && (
            <p className="mt-1 text-sm text-gray-600">{signalering.beschrijving}</p>
          )}
          {signalering.advies && (
            <p
              className={`mt-2 rounded-md px-3 py-2 text-xs ${
                ernst === "kritiek" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {signalering.advies}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-400">
            {signalering.leeftijdsgroep && (
              <span>
                <span className="font-medium text-gray-500">Groep:</span>{" "}
                {signalering.leeftijdsgroep}
              </span>
            )}
            {signalering.geslacht && (
              <span>
                <span className="font-medium text-gray-500">Geslacht:</span>{" "}
                {signalering.geslacht === "M" ? "\u2642 Jongens" : "\u2640 Meisjes"}
              </span>
            )}
            {signalering.waarde !== null && (
              <span>
                <span className="font-medium text-gray-500">Waarde:</span> {signalering.waarde}
              </span>
            )}
            {signalering.drempel !== null && (
              <span>
                <span className="font-medium text-gray-500">Drempel:</span> {signalering.drempel}
              </span>
            )}
            {signalering.streef !== null && (
              <span>
                <span className="font-medium text-gray-500">Streef:</span> {signalering.streef}
              </span>
            )}
            {link && (
              <Link
                href={link.href}
                className="text-ow-oranje hover:text-ow-oranje/80 ml-auto font-medium"
              >
                {link.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
