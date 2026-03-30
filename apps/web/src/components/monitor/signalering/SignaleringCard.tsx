import Link from "next/link";
import { SignalBadge } from "@oranje-wit/ui";
import type { SignaleringRow } from "@/lib/monitor/queries/signalering";

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
  const ernst = signalering.ernst;
  const link = getLinkVoorSignaal(signalering);

  const borderColor =
    ernst === "kritiek"
      ? "border-l-signal-rood"
      : ernst === "aandacht"
        ? "border-l-signal-geel"
        : "border-l-signal-groen";

  return (
    <div className={`bg-surface-card rounded-xl border-l-4 p-5 shadow-sm ${borderColor}`}>
      <div className="flex items-start gap-3">
        <SignalBadge ernst={ernst}>{ernst}</SignalBadge>
        <div className="min-w-0 flex-1">
          <p className="text-text-primary text-sm font-semibold">
            {TYPE_LABELS[signalering.type] || signalering.type}
          </p>
          {signalering.beschrijving && (
            <p className="text-text-secondary mt-1 text-sm">{signalering.beschrijving}</p>
          )}
          {signalering.advies && (
            <p
              className={`mt-2 rounded-md px-3 py-2 text-xs ${
                ernst === "kritiek" ? "text-signal-rood" : "text-signal-geel"
              }`}
              style={
                ernst === "kritiek"
                  ? { backgroundColor: "var(--color-error-50)" }
                  : { backgroundColor: "var(--color-warning-50)" }
              }
            >
              {signalering.advies}
            </p>
          )}
          <div className="text-text-muted mt-2 flex flex-wrap items-center gap-4 text-xs">
            {signalering.leeftijdsgroep && (
              <span>
                <span className="text-text-secondary font-medium">Groep:</span>{" "}
                {signalering.leeftijdsgroep}
              </span>
            )}
            {signalering.geslacht && (
              <span>
                <span className="text-text-secondary font-medium">Geslacht:</span>{" "}
                {signalering.geslacht === "M" ? "\u2642 Jongens" : "\u2640 Meisjes"}
              </span>
            )}
            {signalering.waarde !== null && (
              <span>
                <span className="text-text-secondary font-medium">Waarde:</span>{" "}
                {signalering.waarde}
              </span>
            )}
            {signalering.drempel !== null && (
              <span>
                <span className="text-text-secondary font-medium">Drempel:</span>{" "}
                {signalering.drempel}
              </span>
            )}
            {signalering.streef !== null && (
              <span>
                <span className="text-text-secondary font-medium">Streef:</span>{" "}
                {signalering.streef}
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
