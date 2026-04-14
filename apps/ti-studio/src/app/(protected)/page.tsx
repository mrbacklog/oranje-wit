export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth } from "@oranje-wit/auth";
import { getActiefSeizoen } from "@oranje-wit/teamindeling-shared/seizoen";
import { prisma } from "@/lib/teamindeling/db/prisma";

function getGroet(): string {
  const uur = new Date().getUTCHours() + 1; // CET (winter), close enough voor serverside
  if (uur < 12) return "Goedemorgen";
  if (uur < 18) return "Goedemiddag";
  return "Goedenavond";
}

async function getVoornaam(email: string | null | undefined): Promise<string> {
  if (!email) return "";
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { naam: true },
    });
    if (user?.naam) return user.naam.split(" ")[0];
  } catch {
    // geen probleem
  }
  return "";
}

// ── Data ophalen ──────────────────────────────────────────────────────────────

async function getVolledigheid() {
  try {
    const kaders = await prisma.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: {
        id: true,
        werkindelingen: {
          where: { verwijderdOp: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            versies: {
              orderBy: { nummer: "desc" },
              take: 1,
              select: {
                id: true,
                _count: { select: { teams: true } },
              },
            },
          },
        },
      },
    });

    const totalSpelers = await prisma.speler.count();

    const latestVersieId = kaders?.werkindelingen[0]?.versies[0]?.id;
    const ingeplandSpelers = latestVersieId
      ? await prisma.teamSpeler.count({
          where: { team: { versieId: latestVersieId } },
        })
      : 0;

    return { totalSpelers, ingeplandSpelers };
  } catch {
    return { totalSpelers: 0, ingeplandSpelers: 0 };
  }
}

async function getMemoStats() {
  try {
    const kaders = await prisma.kaders.findFirst({
      where: { isWerkseizoen: true },
      select: { id: true },
    });
    if (!kaders) return { open: 0, inBespreking: 0, blockerHoog: 0, totaalActief: 0 };

    const rows = await prisma.werkitem.groupBy({
      by: ["status", "prioriteit"],
      where: { kadersId: kaders.id, type: "MEMO" },
      _count: { id: true },
    });

    let open = 0;
    let inBespreking = 0;
    let blockerHoog = 0;

    for (const r of rows) {
      const actief = r.status === "OPEN" || r.status === "IN_BESPREKING";
      if (r.status === "OPEN") open += r._count.id;
      if (r.status === "IN_BESPREKING") inBespreking += r._count.id;
      if (actief && (r.prioriteit === "BLOCKER" || r.prioriteit === "HOOG"))
        blockerHoog += r._count.id;
    }

    return { open, inBespreking, blockerHoog, totaalActief: open + inBespreking };
  } catch {
    return { open: 0, inBespreking: 0, blockerHoog: 0, totaalActief: 0 };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  const [voornaam, seizoen, volledigheid, memo] = await Promise.all([
    getVoornaam(session?.user?.email),
    getActiefSeizoen(),
    getVolledigheid(),
    getMemoStats(),
  ]);

  const groet = getGroet();

  const { totalSpelers, ingeplandSpelers } = volledigheid;
  const pct = totalSpelers > 0 ? Math.round((ingeplandSpelers / totalSpelers) * 100) : 0;
  const circumference = 75.4;
  const offset = circumference - (circumference * pct) / 100;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 100px)",
        padding: "0 8px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 680 }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-1)",
                margin: 0,
              }}
            >
              {groet}
              {voornaam ? `, ${voornaam}` : ""}
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 8px",
                background: "var(--surface-raised, #20203a)",
                border: "1px solid rgba(255,255,255,.10)",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                color: "var(--text-2, #a3a3a3)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--ok, #22c55e)",
                  flexShrink: 0,
                }}
              />
              {seizoen.replace("-", "–")}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-3, #555570)", margin: 0 }}>
            TI Studio · c.k.v. Oranje Wit
          </p>
        </div>

        {/* Tiles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* ── Werkbord (primaire actie + volledigheidsring) ── */}
          <Link
            href="/indeling"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "20px 24px",
              background: "linear-gradient(135deg, #1a1a2e 0%, #1c1c35 100%)",
              border: "1px solid rgba(59,130,246,.35)",
              borderRadius: 16,
              textDecoration: "none",
              color: "inherit",
            }}
            className="ti-dashboard-primary"
          >
            {/* Volledigheidsring */}
            <div
              style={{
                position: "relative",
                width: 52,
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="52"
                height="52"
                viewBox="0 0 52 52"
                style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="26"
                  cy="26"
                  r="22"
                  fill="rgba(59,130,246,.08)"
                  stroke="rgba(59,130,246,.20)"
                  strokeWidth="1"
                />
                <circle
                  cx="26"
                  cy="26"
                  r="12"
                  fill="none"
                  stroke="rgba(59,130,246,.18)"
                  strokeWidth="3"
                />
                <circle
                  cx="26"
                  cy="26"
                  r="12"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#3b82f6",
                  zIndex: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                {pct}%
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--text-1, #f5f5f5)",
                  letterSpacing: "-0.01em",
                  marginBottom: 3,
                }}
              >
                Werkbord
              </div>
              <div style={{ fontSize: 13, color: "var(--text-2, #a3a3a3)" }}>
                Visuele editor voor teamopstelling en spelersverdeling
              </div>
            </div>

            {/* Ingedeeld-teller */}
            <div
              style={{
                textAlign: "right",
                flexShrink: 0,
                marginRight: 4,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: "#3b82f6", lineHeight: 1 }}>
                {ingeplandSpelers}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3, #555570)", marginTop: 2 }}>
                / {totalSpelers} spelers
              </div>
            </div>

            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(59,130,246,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#3b82f6",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </div>
          </Link>

          {/* ── Kader + Personen (gelijke hoogte via grid) ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              alignItems: "stretch",
            }}
          >
            <Link
              href="/kader"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
                padding: "18px 20px",
                background: "var(--surface-card, #1a1a2e)",
                border: "1px solid rgba(255,255,255,.06)",
                borderRadius: 16,
                textDecoration: "none",
                color: "inherit",
              }}
              className="ti-dashboard-secondary"
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--surface-raised, #20203a)",
                  border: "1px solid rgba(255,255,255,.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-2, #a3a3a3)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1.5" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="13" y2="16" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-1, #f5f5f5)",
                    marginBottom: 3,
                  }}
                >
                  Kaders
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2, #a3a3a3)" }}>
                  Seizoenskader per team beheren
                </div>
              </div>
            </Link>

            <Link
              href="/personen"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 12,
                padding: "18px 20px",
                background: "var(--surface-card, #1a1a2e)",
                border: "1px solid rgba(255,255,255,.06)",
                borderRadius: 16,
                textDecoration: "none",
                color: "inherit",
              }}
              className="ti-dashboard-secondary"
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--surface-raised, #20203a)",
                  border: "1px solid rgba(255,255,255,.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-2, #a3a3a3)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="7" r="3" />
                  <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" />
                  <circle cx="17" cy="8" r="2.5" />
                  <path d="M16 20c0-2.5 1.5-4 4-4" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-1, #f5f5f5)",
                    marginBottom: 3,
                  }}
                >
                  Personen
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2, #a3a3a3)" }}>
                  Spelers, staf en reserveringen
                </div>
              </div>
            </Link>
          </div>

          {/* ── Memo (full width, met status/prio counts) ── */}
          <Link
            href="/memo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "18px 24px",
              background: "var(--surface-card, #1a1a2e)",
              border:
                memo.blockerHoog > 0
                  ? "1px solid rgba(239,68,68,.30)"
                  : "1px solid rgba(255,255,255,.06)",
              borderRadius: 16,
              textDecoration: "none",
              color: "inherit",
            }}
            className={memo.blockerHoog > 0 ? "ti-dashboard-memo-urgent" : "ti-dashboard-secondary"}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background:
                  memo.blockerHoog > 0 ? "rgba(239,68,68,.10)" : "var(--surface-raised, #20203a)",
                border:
                  memo.blockerHoog > 0
                    ? "1px solid rgba(239,68,68,.25)"
                    : "1px solid rgba(255,255,255,.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={memo.blockerHoog > 0 ? "#ef4444" : "var(--text-2, #a3a3a3)"}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="13" y2="17" />
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-1, #f5f5f5)",
                  marginBottom: 6,
                }}
              >
                Memo-items
              </div>
              {/* Status badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {memo.totaalActief === 0 ? (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ok, #22c55e)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--ok, #22c55e)",
                        flexShrink: 0,
                      }}
                    />
                    Alles afgehandeld
                  </span>
                ) : (
                  <>
                    {memo.open > 0 && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(251,191,36,.10)",
                          color: "#fbbf24",
                          border: "1px solid rgba(251,191,36,.20)",
                        }}
                      >
                        {memo.open} open
                      </span>
                    )}
                    {memo.inBespreking > 0 && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(96,165,250,.10)",
                          color: "#60a5fa",
                          border: "1px solid rgba(96,165,250,.20)",
                        }}
                      >
                        {memo.inBespreking} in bespreking
                      </span>
                    )}
                    {memo.blockerHoog > 0 && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "rgba(239,68,68,.12)",
                          color: "#ef4444",
                          border: "1px solid rgba(239,68,68,.25)",
                        }}
                      >
                        ▲ {memo.blockerHoog} hoge prio
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--text-3, #555570)",
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
