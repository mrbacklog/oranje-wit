import { PageHeader, KpiCard, SignalBadge } from "@oranje-wit/ui";
import {
  getSignaleringen,
  getSignaleringSamenvatting,
  type SignaleringRow,
} from "@/lib/queries/signalering";
import { getSeizoen } from "@/lib/utils/seizoen";

export default async function SignaleringPage({
  searchParams,
}: {
  searchParams: Promise<{ seizoen?: string }>;
}) {
  const params = await searchParams;
  const seizoen = getSeizoen(params);

  const [signaleringen, samenvatting] = await Promise.all([
    getSignaleringen(seizoen),
    getSignaleringSamenvatting(seizoen),
  ]);

  const opKoers =
    samenvatting.totaal - samenvatting.kritiek - samenvatting.aandacht;

  // Sorteer: kritiek eerst, dan aandacht, dan rest
  const ernstVolgorde: Record<string, number> = {
    kritiek: 0,
    aandacht: 1,
    opkoers: 2,
  };
  const gesorteerd = [...signaleringen].sort(
    (a, b) =>
      (ernstVolgorde[a.ernst] ?? 3) - (ernstVolgorde[b.ernst] ?? 3)
  );

  return (
    <>
      <PageHeader
        title="Signalering"
        subtitle="Waar moeten we op letten? Acties en aandachtspunten."
      />

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <KpiCard
          label="Kritiek"
          value={samenvatting.kritiek}
          signal="rood"
        />
        <KpiCard
          label="Aandacht"
          value={samenvatting.aandacht}
          signal="geel"
        />
        <KpiCard
          label="Op koers"
          value={opKoers}
          signal="groen"
        />
      </div>

      {/* Alert list */}
      {gesorteerd.length === 0 ? (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">
            Geen signaleringen voor seizoen {seizoen}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gesorteerd.map((s) => (
            <SignaleringCard key={s.id} signalering={s} />
          ))}
        </div>
      )}
    </>
  );
}

function SignaleringCard({ signalering }: { signalering: SignaleringRow }) {
  const ernst = signalering.ernst as "kritiek" | "aandacht" | "opkoers";

  const borderColor =
    ernst === "kritiek"
      ? "border-l-signal-rood"
      : ernst === "aandacht"
        ? "border-l-signal-geel"
        : "border-l-signal-groen";

  return (
    <div
      className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${borderColor}`}
    >
      <div className="flex items-start gap-3">
        <SignalBadge ernst={ernst}>{ernst}</SignalBadge>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {signalering.type}
          </p>
          {signalering.beschrijving && (
            <p className="mt-1 text-sm text-gray-600">
              {signalering.beschrijving}
            </p>
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
                {signalering.geslacht === "M" ? "Jongens" : "Meisjes"}
              </span>
            )}
            {signalering.waarde !== null && (
              <span>
                <span className="font-medium text-gray-500">Waarde:</span>{" "}
                {signalering.waarde}
              </span>
            )}
            {signalering.drempel !== null && (
              <span>
                <span className="font-medium text-gray-500">Drempel:</span>{" "}
                {signalering.drempel}
              </span>
            )}
            {signalering.streef !== null && (
              <span>
                <span className="font-medium text-gray-500">Streef:</span>{" "}
                {signalering.streef}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
