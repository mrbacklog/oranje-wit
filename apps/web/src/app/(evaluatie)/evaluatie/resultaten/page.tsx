import { requireTC } from "@oranje-wit/auth/checks";
import { prisma } from "@/lib/db/prisma";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

type PrismaFn = (...args: any[]) => any;

export default async function ResultatenPage() {
  await requireTC();

  const rondes = await (prisma.evaluatieRonde.findMany as PrismaFn)({
    where: { seizoen: HUIDIG_SEIZOEN },
    orderBy: { ronde: "asc" },
    include: {
      _count: {
        select: {
          evaluaties: true,
          uitnodigingen: true,
        },
      },
    },
  });

  const totaalEvaluaties = await (prisma.evaluatie.count as PrismaFn)({
    where: { seizoen: HUIDIG_SEIZOEN, status: "ingediend" },
  });

  const totaalZelfEvaluaties = await (prisma.spelerZelfEvaluatie.count as PrismaFn)({
    where: { seizoen: HUIDIG_SEIZOEN },
  });

  const rondesList = rondes as Array<{
    id: string;
    naam: string;
    ronde: number;
    status: string;
    _count: { evaluaties: number; uitnodigingen: number };
  }>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Resultaten
        </h1>
        <p style={{ color: "var(--text-secondary)" }} className="mt-1">
          Evaluatieresultaten seizoen {HUIDIG_SEIZOEN}
        </p>
      </div>

      {/* Samenvatting */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {totaalEvaluaties as number}
          </p>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Trainerevaluaties ingediend
          </p>
        </div>
        <div
          className="rounded-lg border p-4"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {totaalZelfEvaluaties as number}
          </p>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Zelfevaluaties ingevuld
          </p>
        </div>
      </div>

      {/* Rondes overzicht */}
      {rondesList.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Rondes
          </h2>
          <div className="space-y-3">
            {rondesList.map((ronde) => (
              <div
                key={ronde.id}
                className="flex items-center justify-between rounded-lg border p-4"
                style={{
                  backgroundColor: "var(--surface-card)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {ronde.naam}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {ronde._count.evaluaties} evaluaties ingediend
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    ronde.status === "actief"
                      ? "bg-green-900/30 text-green-400"
                      : ronde.status === "gesloten"
                        ? "bg-red-900/30 text-red-400"
                        : "text-sm"
                  }`}
                  style={
                    ronde.status === "concept"
                      ? {
                          backgroundColor: "var(--surface-sunken)",
                          color: "var(--text-secondary)",
                        }
                      : undefined
                  }
                >
                  {ronde.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In ontwikkeling melding */}
      <div
        className="rounded-lg border p-6 text-center"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        <p className="text-lg font-medium" style={{ color: "var(--text-primary)" }}>
          Detailweergave in ontwikkeling
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
          De volledige resultatenanalyse per speler en per team wordt hier binnenkort beschikbaar.
          Bekijk in de tussentijd individuele evaluaties via het Rondes-overzicht.
        </p>
      </div>
    </main>
  );
}
