import { getSignaleringen, getOpenActiepunten } from "@/lib/hub/queries";

// ── Ernst-volgorde (kritiek eerst) ───────────────────────────────

const ERNST_VOLGORDE: Record<string, number> = {
  kritiek: 0,
  aandacht: 1,
  op_koers: 2,
};

function ernstKleur(ernst: string) {
  switch (ernst) {
    case "kritiek":
      return { bg: "rgba(239, 68, 68, 0.12)", tekst: "#f87171", dot: "#ef4444" };
    case "aandacht":
      return { bg: "rgba(245, 158, 11, 0.12)", tekst: "#fbbf24", dot: "#f59e0b" };
    case "op_koers":
      return { bg: "rgba(34, 197, 94, 0.12)", tekst: "#4ade80", dot: "#22c55e" };
    default:
      return {
        bg: "rgba(107, 114, 128, 0.12)",
        tekst: "var(--text-tertiary)",
        dot: "var(--text-tertiary)",
      };
  }
}

function ernstLabel(ernst: string) {
  switch (ernst) {
    case "kritiek":
      return "Kritiek";
    case "aandacht":
      return "Aandacht";
    case "op_koers":
      return "Op koers";
    default:
      return ernst;
  }
}

// ── Actiepunt status kleur ───────────────────────────────────────

function actiepuntKleur(status: string) {
  switch (status) {
    case "OPEN":
      return { bg: "rgba(245, 158, 11, 0.12)", tekst: "#fbbf24" };
    case "BEZIG":
      return { bg: "rgba(59, 130, 246, 0.12)", tekst: "#60a5fa" };
    default:
      return { bg: "rgba(107, 114, 128, 0.12)", tekst: "var(--text-tertiary)" };
  }
}

// ── Component ────────────────────────────────────────────────────

export async function HubTC() {
  const [signaleringen, actiepunten] = await Promise.all([
    getSignaleringen(),
    getOpenActiepunten(),
  ]);

  const gesorteerd = [...signaleringen].sort(
    (a, b) => (ERNST_VOLGORDE[a.ernst] ?? 99) - (ERNST_VOLGORDE[b.ernst] ?? 99)
  );

  const heeftSignaleringen = gesorteerd.length > 0;
  const heeftActiepunten = actiepunten.length > 0;

  if (!heeftSignaleringen && !heeftActiepunten) return null;

  return (
    <section>
      <h2
        className="mb-3 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        TC Overzicht
      </h2>

      <div className="space-y-3">
        {/* Signaleringen */}
        {heeftSignaleringen && (
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Signaleringen
              </h3>
              <a
                href="/monitor"
                className="text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--ow-oranje-500)" }}
              >
                Bekijk alle →
              </a>
            </div>

            <div className="space-y-2">
              {gesorteerd.map((s) => {
                const kleur = ernstKleur(s.ernst);
                return (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 rounded-xl px-3 py-2"
                    style={{ backgroundColor: kleur.bg }}
                  >
                    <span
                      className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: kleur.dot }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm" style={{ color: kleur.tekst }}>
                        {s.beschrijving ?? `${s.type}: ${ernstLabel(s.ernst)}`}
                      </p>
                      {s.leeftijdsgroep && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                          {s.leeftijdsgroep}
                          {s.geslacht ? ` (${s.geslacht === "M" ? "jongens" : "meisjes"})` : ""}
                        </p>
                      )}
                    </div>
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: kleur.bg, color: kleur.tekst }}
                    >
                      {ernstLabel(s.ernst)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actiepunten */}
        {heeftActiepunten && (
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Openstaande actiepunten
              </h3>
              <a
                href="/ti-studio"
                className="text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--ow-oranje-500)" }}
              >
                Bekijk alle →
              </a>
            </div>

            <div className="space-y-2">
              {actiepunten.map((ap) => {
                const kleur = actiepuntKleur(ap.status);
                return (
                  <div
                    key={ap.id}
                    className="flex items-start gap-3 rounded-xl px-3 py-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                  >
                    <span
                      className="mt-1 h-2 w-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: kleur.tekst }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {ap.beschrijving.length > 80
                          ? ap.beschrijving.slice(0, 80) + "..."
                          : ap.beschrijving}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                        {ap.toegewezenAan.naam}
                        {ap.deadline
                          ? ` — deadline ${new Date(ap.deadline).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`
                          : ""}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: kleur.bg, color: kleur.tekst }}
                    >
                      {ap.status === "OPEN" ? "Open" : "Bezig"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Monitor", href: "/monitor", kleur: "#22c55e" },
            { label: "Teamindeling", href: "/ti-studio", kleur: "#3b82f6" },
            { label: "Beheer", href: "/beheer", kleur: "#9ca3af" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center justify-center rounded-xl py-2.5 text-xs font-semibold transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: `color-mix(in srgb, ${link.kleur} 10%, transparent)`,
                color: link.kleur,
                border: `1px solid color-mix(in srgb, ${link.kleur} 20%, transparent)`,
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
