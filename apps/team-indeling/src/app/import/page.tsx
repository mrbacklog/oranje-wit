import { prisma } from "@/lib/db/prisma";
import { getActiefSeizoen } from "@/lib/seizoen";
import type { ImportDiff } from "@/lib/import";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const seizoen = await getActiefSeizoen();

  const imports = await prisma.import.findMany({
    where: { seizoen },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totaalImports = await prisma.import.count({ where: { seizoen } });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Import</h2>
        <p className="mt-1 text-sm text-gray-500">Ledendata importeren voor seizoen {seizoen}</p>
      </div>

      {/* Instructie */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-700">Data importeren</h3>
        <p className="mt-1 text-sm text-gray-500">
          Gebruik de Verenigingsmonitor om een export te maken en importeer via de API:
        </p>
        <code className="mt-2 block rounded bg-gray-50 px-3 py-2 text-xs text-gray-600">
          POST /api/import {`{ "exportPad": "/pad/naar/export.json" }`}
        </code>
      </div>

      {/* Import historie */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          Laatste imports ({totaalImports} totaal)
        </h3>

        {imports.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            Nog geen imports voor dit seizoen.
          </div>
        ) : (
          <div className="space-y-3">
            {imports.map((imp) => {
              const diff = imp.diff as ImportDiff | null;
              const heeftDiff = diff && (diff.nieuw.length > 0 || diff.weg.length > 0);

              return (
                <div key={imp.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(imp.createdAt).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Export: {imp.exportDatum} &middot; Snapshot: {imp.snapshotDatum}
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>{imp.spelersNieuw} nieuw</span>
                      <span>{imp.spelersBijgewerkt} bijgewerkt</span>
                      <span>{imp.stafNieuw + imp.stafBijgewerkt} staf</span>
                      <span>{imp.teamsGeladen} teams</span>
                    </div>
                  </div>

                  {/* Diff-sectie */}
                  {heeftDiff && (
                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                      <p className="text-xs font-medium text-gray-600">
                        Wijzigingen ten opzichte van vorige import:
                      </p>

                      {diff.nieuw.length > 0 && (
                        <div className="rounded bg-blue-50 px-3 py-2">
                          <p className="text-xs font-medium text-blue-700">
                            {diff.nieuw.length} nieuwe speler(s) gedetecteerd → NIEUW_POTENTIEEL
                          </p>
                          <ul className="mt-1 text-xs text-blue-600">
                            {diff.nieuw.map((s) => (
                              <li key={s.id}>{s.naam}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {diff.weg.length > 0 && (
                        <div className="rounded bg-red-50 px-3 py-2">
                          <p className="text-xs font-medium text-red-700">
                            {diff.weg.length} speler(s) niet meer in export → GAAT_STOPPEN
                          </p>
                          <ul className="mt-1 text-xs text-red-600">
                            {diff.weg.map((s) => (
                              <li key={s.id}>{s.naam}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
