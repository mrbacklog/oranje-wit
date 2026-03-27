import { getOpenZelfevaluaties } from "@/lib/hub/queries";

export async function HubZelf({ email }: { email: string }) {
  const uitnodigingen = await getOpenZelfevaluaties(email);

  if (uitnodigingen.length === 0) return null;

  return (
    <section>
      <h2
        className="mb-3 text-xs font-semibold tracking-wider uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        Zelfevaluatie
      </h2>

      <div
        className="rounded-2xl p-4"
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Vul je zelfevaluatie in
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
            Hoe ervaar jij het seizoen? Jouw mening telt!
          </p>
        </div>

        <div className="space-y-2">
          {uitnodigingen.map((u) => {
            const deadline = u.ronde.deadline
              ? new Date(u.ronde.deadline).toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "short",
                })
              : null;

            return (
              <a
                key={u.id}
                href={`/evaluatie/zelf?token=${u.token}`}
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:scale-[1.01]"
                style={{
                  backgroundColor: "rgba(139, 92, 246, 0.06)",
                  border: "1px solid rgba(139, 92, 246, 0.15)",
                }}
              >
                {/* Icoon */}
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                {/* Tekst */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {u.ronde.naam}
                  </p>
                  {deadline && (
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      Deadline: {deadline}
                    </p>
                  )}
                </div>

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
          })}
        </div>
      </div>
    </section>
  );
}
