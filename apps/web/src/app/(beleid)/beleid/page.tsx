import { PageContainer, PageHeader } from "@oranje-wit/ui";

export default function BeleidPage() {
  return (
    <PageContainer>
      <PageHeader title="Een leven lang!" subtitle="Technisch beleid c.k.v. Oranje Wit" />

      <div className="mt-6 space-y-6">
        {/* Oranje Draad intro */}
        <section className="rounded-2xl bg-[var(--surface-card)] p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">De Oranje Draad</h2>
          <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
            Alles wat we doen bij Oranje Wit is gebouwd op drie pijlers:
            <strong className="text-[#a855f7]"> Plezier</strong>,
            <strong className="text-[#a855f7]"> Ontwikkeling</strong> en
            <strong className="text-[#a855f7]"> Prestatie</strong>. Samen leiden ze tot duurzaamheid
            — beleid dat volhoudbaar is voor spelers en staf.
          </p>
        </section>

        {/* Vijf doelgroepen */}
        <section className="rounded-2xl bg-[var(--surface-card)] p-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Vijf doelgroepen, een vereniging
          </h2>
          <p className="mt-3 leading-relaxed text-[var(--text-secondary)]">
            De TC bedient alle korfbalspelende leden. Van de jongste Blauwe tot de oudste
            midweekspeler. Elke doelgroep krijgt wat het nodig heeft.
          </p>
          <div className="mt-4 grid gap-3">
            {[
              {
                name: "Kweekvijver",
                age: "5-9",
                color: "#22c55e",
                desc: "Spelenderwijs aansteken",
              },
              {
                name: "Opleidingshart",
                age: "10-14",
                color: "#f59e0b",
                desc: "De golden age — breed opleiden",
              },
              {
                name: "Korfbalplezier",
                age: "16+",
                color: "#14b8a6",
                desc: "Verenigingsleven en plezier",
              },
              {
                name: "Wedstrijdsport",
                age: "Sen 3-4",
                color: "#3b82f6",
                desc: "Competitief buiten de top",
              },
              {
                name: "Topsport",
                age: "U15+ / Sen 1-2",
                color: "#a855f7",
                desc: "Hard maar eerlijk",
              },
            ].map((g) => (
              <div
                key={g.name}
                className="flex items-center gap-4 rounded-xl bg-[var(--surface-raised)] p-4"
              >
                <div
                  className="h-10 w-10 shrink-0 rounded-full"
                  style={{ backgroundColor: g.color, opacity: 0.2 }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-[var(--text-primary)]">{g.name}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{g.age}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Placeholder voor uitgebreide presentatie */}
        <section className="rounded-2xl border border-dashed border-[var(--border-default)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            De interactieve presentatie met (i)-dialogen wordt hier uitgebouwd.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
