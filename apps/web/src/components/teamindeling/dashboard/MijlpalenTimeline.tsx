import Link from "next/link";
import type { Mijlpaal } from "@oranje-wit/database";

interface Props {
  mijlpalen: Mijlpaal[];
}

export function MijlpalenTimeline({ mijlpalen }: Props) {
  if (mijlpalen.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        Nog geen mijlpalen ingesteld.{" "}
        <Link href="/ti-studio/instellingen" className="text-ow-oranje hover:underline">
          Configureer mijlpalen &rarr;
        </Link>
      </div>
    );
  }

  const nu = new Date();

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium tracking-wide text-gray-500 uppercase">
        Komende mijlpalen
      </h3>
      {mijlpalen.map((m) => {
        const isPast = new Date(m.datum) < nu;
        const isAfgerond = m.afgerond;
        return (
          <div
            key={m.id}
            className={`flex items-start gap-3 border-l-2 pl-3 ${
              isAfgerond
                ? "border-green-400 text-gray-400"
                : isPast
                  ? "border-red-400"
                  : "border-blue-400"
            }`}
          >
            <div>
              <div className="text-xs text-gray-500">
                {new Date(m.datum).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
              <div className={`text-sm font-medium ${isAfgerond ? "line-through" : ""}`}>
                {m.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
