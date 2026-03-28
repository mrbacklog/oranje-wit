export const dynamic = "force-dynamic";

import { Badge } from "@oranje-wit/ui";
import { getRaamwerkVersies } from "./actions";
import { NieuwRaamwerkDialoog } from "./nieuw-raamwerk-dialoog";

const STATUS_BADGE: Record<string, { color: "yellow" | "green" | "gray"; label: string }> = {
  CONCEPT: { color: "yellow", label: "Concept" },
  ACTIEF: { color: "green", label: "Actief" },
  GEARCHIVEERD: { color: "gray", label: "Gearchiveerd" },
};

const BAND_VOLGORDE = ["blauw", "groen", "geel", "oranje", "rood"];

export default async function RaamwerkOverzichtPage() {
  const versies = await getRaamwerkVersies();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Vaardigheidsraamwerk
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
            Vaardigheden per leeftijdsgroep en seizoen beheren
          </p>
        </div>
        <NieuwRaamwerkDialoog versies={versies} />
      </div>

      {versies.length === 0 ? (
        <div
          className="overflow-hidden rounded-xl border px-6 py-12 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Nog geen raamwerkversies aangemaakt. Klik op &ldquo;Nieuw seizoen&rdquo; om te beginnen.
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="beheer-table">
              <thead>
                <tr>
                  <th>Seizoen</th>
                  <th>Naam</th>
                  <th>Status</th>
                  <th>Items per band</th>
                  <th className="text-right">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {versies.map((v) => {
                  const badge = STATUS_BADGE[v.status] ?? STATUS_BADGE.CONCEPT;
                  const gesorteerdeItems = BAND_VOLGORDE.map((band) =>
                    v.itemsPerBand.find((i) => i.band === band)
                  ).filter(Boolean);

                  return (
                    <tr key={v.id}>
                      <td>
                        <a
                          href={`/beheer/jeugd/raamwerk/${v.id}`}
                          className="raamwerk-link font-medium"
                        >
                          {v.seizoen}
                        </a>
                      </td>
                      <td className="muted">{v.naam}</td>
                      <td>
                        <Badge color={badge.color}>{badge.label}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {gesorteerdeItems.map((item) =>
                            item ? (
                              <div
                                key={item.band}
                                className="flex items-center gap-1"
                                title={`${item.band}: ${item.items}/${item.doelAantal}`}
                              >
                                <span
                                  className="inline-block h-2.5 w-2.5 rounded-full"
                                  style={{
                                    backgroundColor: `var(--knkv-${item.band}-500)`,
                                  }}
                                />
                                <span
                                  className="text-xs tabular-nums"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {item.items}
                                </span>
                              </div>
                            ) : null
                          )}
                        </div>
                      </td>
                      <td className="muted text-right tabular-nums">{v.totaalItems}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
