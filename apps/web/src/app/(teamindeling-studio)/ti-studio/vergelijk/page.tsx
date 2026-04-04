import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import { getWerkindelingId } from "@/lib/teamindeling/db/werkindeling";
import WhatIfVergelijk from "@/components/teamindeling/vergelijk/WhatIfVergelijk";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function VergelijkPage(props: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const searchParams = await props.searchParams;
  const idA = searchParams.a;
  const idB = searchParams.b;

  const seizoen = await getActiefSeizoen();
  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });
  if (!blauwdruk) return <p>Geen actief seizoen.</p>;

  const werkindelingId = await getWerkindelingId(blauwdruk.id);
  if (!werkindelingId) return <p>Geen werkindeling gevonden.</p>;

  // Haal alle niet-verworpen what-ifs op voor de selector
  const whatIfs = await prisma.whatIf.findMany({
    where: { werkindelingId, status: { not: "VERWORPEN" } },
    select: { id: true, vraag: true },
    orderBy: { createdAt: "desc" },
  });

  const kanVergelijken = Boolean(idA && idB && idA !== idB);
  const [whatIfA, whatIfB] = kanVergelijken
    ? await Promise.all([
        prisma.whatIf.findUnique({
          where: { id: idA! },
          include: {
            teams: {
              include: {
                spelers: {
                  include: { speler: true },
                },
              },
              orderBy: { volgorde: "asc" },
            },
          },
        }),
        prisma.whatIf.findUnique({
          where: { id: idB! },
          include: {
            teams: {
              include: {
                spelers: {
                  include: { speler: true },
                },
              },
              orderBy: { volgorde: "asc" },
            },
          },
        }),
      ])
    : [null, null];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            What-If vergelijking
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Vergelijk twee what-if varianten naast elkaar
          </p>
        </div>
        <Link
          href="/ti-studio/indeling"
          className="text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          ← Terug
        </Link>
      </div>

      {/* What-If selector */}
      <form
        className="flex gap-4 rounded-lg border p-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        {(["a", "b"] as const).map((slot) => (
          <div key={slot} className="flex-1">
            <label
              className="mb-1 block text-xs font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              What-If {slot.toUpperCase()}
            </label>
            <select
              name={slot}
              defaultValue={slot === "a" ? (idA ?? "") : (idB ?? "")}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--surface-raised)",
                color: "var(--text-primary)",
              }}
            >
              <option value="" disabled>
                Selecteer what-if...
              </option>
              {whatIfs.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.vraag}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--ow-oranje-500)" }}
          >
            Vergelijk
          </button>
        </div>
      </form>

      {/* Lege staat: nog geen selectie */}
      {!kanVergelijken && (
        <p className="py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
          Selecteer twee what-if varianten om ze te vergelijken.
        </p>
      )}

      {/* Geen what-ifs beschikbaar */}
      {whatIfs.length === 0 && (
        <p className="py-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
          Er zijn nog geen what-if varianten voor dit seizoen.
        </p>
      )}

      {/* Vergelijking */}
      {whatIfA && whatIfB && <WhatIfVergelijk whatIfA={whatIfA} whatIfB={whatIfB} />}
    </div>
  );
}
