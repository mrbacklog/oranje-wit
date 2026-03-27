import { getOpenEvaluaties, type HubEvaluatie } from "@/lib/hub/queries";

function deadlineIndicator(deadline: Date) {
  const nu = new Date();
  const verschilMs = deadline.getTime() - nu.getTime();
  const verschilDagen = Math.ceil(verschilMs / (1000 * 60 * 60 * 24));

  if (verschilDagen < 0) {
    return { label: "Verlopen", kleur: "#ef4444" };
  }
  if (verschilDagen <= 3) {
    return {
      label: `Nog ${verschilDagen} dag${verschilDagen !== 1 ? "en" : ""}`,
      kleur: "#f59e0b",
    };
  }
  return {
    label: deadline.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }),
    kleur: "var(--text-tertiary)",
  };
}

function EvaluatieKaart({ uitnodiging }: { uitnodiging: HubEvaluatie }) {
  const teamNaam = uitnodiging.owTeam?.naam ?? "Onbekend team";
  const rondeNaam = uitnodiging.ronde.naam;
  const deadline = uitnodiging.ronde.deadline
    ? deadlineIndicator(new Date(uitnodiging.ronde.deadline))
    : null;

  // Link naar de evaluatie-app met het token
  const href = `/evaluatie/invullen?token=${uitnodiging.token}`;

  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:scale-[1.01]"
      style={{
        backgroundColor: "rgba(234, 179, 8, 0.06)",
        border: "1px solid rgba(234, 179, 8, 0.15)",
      }}
    >
      {/* Icoon */}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-lg"
        style={{
          background: "linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.05))",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#eab308"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>

      {/* Tekst */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Evaluatie invullen: {teamNaam}
        </p>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {rondeNaam}
        </p>
      </div>

      {/* Deadline */}
      {deadline && (
        <span className="flex-shrink-0 text-xs font-medium" style={{ color: deadline.kleur }}>
          {deadline.label}
        </span>
      )}

      {/* Pijl */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-tertiary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}

export async function HubEvaluatie({ email }: { email: string }) {
  const uitnodigingen = await getOpenEvaluaties(email);

  if (uitnodigingen.length === 0) return null;

  return (
    <section>
      <h2
        className="mb-3 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Evaluaties
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
            Vul je evaluaties in
          </h3>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: "rgba(234, 179, 8, 0.15)",
              color: "#eab308",
            }}
          >
            {uitnodigingen.length} openstaand
          </span>
        </div>

        <div className="space-y-2">
          {uitnodigingen.map((u) => (
            <EvaluatieKaart key={u.id} uitnodiging={u} />
          ))}
        </div>
      </div>
    </section>
  );
}
