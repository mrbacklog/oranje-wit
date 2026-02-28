import { SignalBadge } from "@oranje-wit/ui";
import type { SignaleringRow } from "@/lib/queries/signalering";

export function SignaleringCard({ signalering }: { signalering: SignaleringRow }) {
  const ernst = signalering.ernst as "kritiek" | "aandacht" | "opkoers";

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
          <p className="text-sm font-semibold text-gray-900">{signalering.type}</p>
          {signalering.beschrijving && (
            <p className="mt-1 text-sm text-gray-600">{signalering.beschrijving}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
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
          </div>
        </div>
      </div>
    </div>
  );
}
