import { getOpenVerzoeken, type HubVerzoek } from "@/lib/hub/queries";

function verzoekTypeLabel(type: string) {
  switch (type) {
    case "GENERIEK":
      return "Team beoordelen";
    case "SPECIFIEK":
      return "Speler beoordelen";
    case "VERGELIJKING":
      return "Vergelijking";
    default:
      return type;
  }
}

function deadlineIndicator(deadline: Date | null) {
  if (!deadline) return null;
  const nu = new Date();
  const verschilMs = deadline.getTime() - nu.getTime();
  const verschilDagen = Math.ceil(verschilMs / (1000 * 60 * 60 * 24));

  if (verschilDagen < 0) {
    return { label: "Verlopen", kleur: "#ef4444" };
  }
  if (verschilDagen <= 3) {
    return { label: `Nog ${verschilDagen}d`, kleur: "#f59e0b" };
  }
  return {
    label: deadline.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
    kleur: "var(--text-tertiary)",
  };
}

function VerzoekKaart({ toewijzing }: { toewijzing: HubVerzoek }) {
  const verzoek = toewijzing.verzoek;
  const deadline = verzoek.deadline ? deadlineIndicator(new Date(verzoek.deadline)) : null;
  const statusLabel = toewijzing.status === "UITGENODIGD" ? "Nieuw" : "Bezig";
  const statusKleur =
    toewijzing.status === "UITGENODIGD"
      ? { bg: "rgba(255, 107, 0, 0.12)", tekst: "var(--ow-oranje-400)" }
      : { bg: "rgba(59, 130, 246, 0.12)", tekst: "#60a5fa" };

  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-3"
      style={{
        backgroundColor: "rgba(255, 107, 0, 0.04)",
        border: "1px solid rgba(255, 107, 0, 0.12)",
      }}
    >
      {/* Icoon */}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
        style={{
          background: "linear-gradient(135deg, rgba(255, 107, 0, 0.2), rgba(255, 107, 0, 0.05))",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--ow-oranje-500)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Tekst */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {verzoekTypeLabel(verzoek.type)}
        </p>
        {verzoek.toelichting && (
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {verzoek.toelichting.length > 60
              ? verzoek.toelichting.slice(0, 60) + "..."
              : verzoek.toelichting}
          </p>
        )}
      </div>

      {/* Status */}
      <span
        className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: statusKleur.bg, color: statusKleur.tekst }}
      >
        {statusLabel}
      </span>

      {/* Deadline */}
      {deadline && (
        <span className="flex-shrink-0 text-xs font-medium" style={{ color: deadline.kleur }}>
          {deadline.label}
        </span>
      )}
    </div>
  );
}

export async function HubScouting({ email }: { email: string }) {
  const toewijzingen = await getOpenVerzoeken(email);

  if (toewijzingen.length === 0) return null;

  return (
    <section>
      <h2
        className="mb-3 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Scouting
      </h2>

      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Scouting-opdrachten
          </h3>
          <a
            href="/scouting"
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--ow-oranje-500)" }}
          >
            Open scouting →
          </a>
        </div>

        <div className="space-y-2">
          {toewijzingen.map((t) => (
            <VerzoekKaart key={t.id} toewijzing={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
