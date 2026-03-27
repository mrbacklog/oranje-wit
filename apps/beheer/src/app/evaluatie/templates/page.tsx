import { getTemplates } from "./actions";

export const dynamic = "force-dynamic";

const VARIABELEN: Record<string, string[]> = {
  trainer_uitnodiging: ["trainer_naam", "team_naam", "deadline", "ronde_naam", "link"],
  trainer_herinnering: ["trainer_naam", "team_naam", "deadline", "link"],
  trainer_bevestiging: ["trainer_naam", "team_naam"],
  coordinator_notificatie: ["coordinator_naam", "trainer_naam", "team_naam", "link"],
  coordinator_uitnodiging: ["coordinator_naam", "ronde_naam", "team_namen", "link"],
  speler_uitnodiging: ["speler_naam", "deadline", "ronde_naam", "link"],
  speler_herinnering: ["speler_naam", "deadline", "link"],
};

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          E-mail templates
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {templates.length} templates beschikbaar
        </p>
      </div>

      {templates.length === 0 ? (
        <div
          className="overflow-hidden rounded-xl border px-6 py-12 text-center"
          style={{
            backgroundColor: "var(--surface-card)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            Geen e-mail templates gevonden.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="overflow-hidden rounded-xl border"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-default)",
              }}
            >
              <div className="px-5 py-4">
                <div>
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {t.sleutel}
                  </h3>
                  {VARIABELEN[t.sleutel] && (
                    <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Variabelen: {VARIABELEN[t.sleutel].map((v) => `{{${v}}}`).join(", ")}
                    </p>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                    <span style={{ color: "var(--text-tertiary)" }}>Onderwerp: </span>
                    {t.onderwerp}
                  </p>
                  <div
                    className="mt-2 max-h-24 overflow-hidden rounded-lg p-3 text-xs"
                    style={{
                      backgroundColor: "var(--surface-sunken)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: t.inhoudHtml }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
