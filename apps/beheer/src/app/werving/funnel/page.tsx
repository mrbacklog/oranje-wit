import { getFunnelStats } from "../aanmeldingen/actions";

export const dynamic = "force-dynamic";

const FUNNEL_STAPPEN = [
  {
    status: "AANMELDING",
    label: "Aanmelding",
    kleur: "var(--knkv-blauw-500)",
    beschrijving: "Eerste contact",
  },
  {
    status: "PROEFLES",
    label: "Proefles",
    kleur: "var(--knkv-oranje-500)",
    beschrijving: "Proefles ingepland",
  },
  {
    status: "INTAKE",
    label: "Intake",
    kleur: "var(--knkv-geel-500)",
    beschrijving: "Intake gesprek",
  },
  {
    status: "LID",
    label: "Lid",
    kleur: "var(--color-success-500)",
    beschrijving: "Volwaardig lid",
  },
] as const;

export default async function FunnelPage() {
  const stats = await getFunnelStats();

  const totaal = Object.values(stats).reduce((sum, n) => sum + n, 0);
  const afgehaakt = stats.AFGEHAAKT ?? 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Wervingsfunnel
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {totaal} aanmeldingen totaal, {afgehaakt} afgehaakt
        </p>
      </div>

      {/* Funnel-stappen */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FUNNEL_STAPPEN.map((stap) => {
          const aantal = stats[stap.status] ?? 0;
          return (
            <div key={stap.status} className="funnel-step">
              <div className="flex items-center gap-3">
                <div className="funnel-bar" style={{ backgroundColor: stap.kleur }} />
                <div>
                  <p className="funnel-value">{aantal}</p>
                  <p className="funnel-label">{stap.label}</p>
                  <p className="funnel-desc">{stap.beschrijving}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Afgehaakt */}
      <div className="funnel-step">
        <div className="flex items-center gap-3">
          <div className="funnel-bar" style={{ backgroundColor: "var(--color-error-500)" }} />
          <div>
            <p className="funnel-value">{afgehaakt}</p>
            <p className="funnel-label">Afgehaakt</p>
            <p className="funnel-desc">Niet doorgegaan met aanmelding</p>
          </div>
        </div>
      </div>
    </div>
  );
}
