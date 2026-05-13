import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { getHomepageStats } from "@/lib/homepage-queries";
import { VoortgangsRing } from "@/components/homepage/VoortgangsRing";
import { WerkbordLeegPlaceholder } from "@/components/homepage/WerkbordLeegPlaceholder";
import { TileSecundair } from "@/components/homepage/TileSecundair";
import { MemoTile } from "@/components/homepage/MemoTile";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!session?.user || user?.isTC !== true) {
    redirect("/login");
  }

  const naam = String(user?.name ?? user?.email ?? "TC-lid").split(" ")[0];
  const stats = await getHomepageStats();

  // Groet op basis van uur
  const uur = new Date().getHours();
  const groet = uur < 12 ? "Goedemorgen" : uur < 18 ? "Goedemiddag" : "Goedenavond";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-0)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Topbar */}
      <header
        style={{
          height: 52,
          borderBottom: "1px solid var(--border-0)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ow-accent)" }}>
          TI Studio v2
        </span>
        <nav style={{ display: "flex", gap: 2, marginLeft: 16 }}>
          <a
            href="/"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-primary)",
              textDecoration: "none",
              borderRadius: 6,
              background: "rgba(255,255,255,.05)",
            }}
          >
            Home
          </a>
          <a
            href="/personen/spelers"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            Personen
          </a>
          <a
            href="/indeling"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            Werkbord
          </a>
          <a
            href="/kader"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            Kader
          </a>
          <a
            href="/memo"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-tertiary)",
              textDecoration: "none",
              borderRadius: 6,
            }}
          >
            Memo&apos;s
          </a>
        </nav>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: "auto" }}>
          {String(user?.name ?? user?.email ?? "")}
        </span>
      </header>

      {/* Pagina-inhoud */}
      <main style={{ flex: 1, padding: "24px 24px", maxWidth: 640 }}>
        {/* Page header */}
        <div style={{ marginBottom: 4 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Home
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              margin: "2px 0 0",
            }}
          >
            TI Studio · c.k.v. Oranje Wit
          </p>
        </div>

        {/* Groet + seizoen-badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-secondary)",
            margin: "20px 0",
          }}
        >
          {groet}, {naam}
          {stats.seizoen && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#22c55e",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {stats.seizoen}
            </span>
          )}
        </div>

        {/* Tiles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Primaire tile: werkbord */}
          {stats.heeftWerkindeling ? (
            <VoortgangsRing
              pct={stats.pct}
              ingedeeld={stats.ingedeeld}
              totaal={stats.aantalSpelers}
            />
          ) : (
            <WerkbordLeegPlaceholder />
          )}

          {/* Secundaire tiles: 2-koloms grid + memo full-width */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {/* Personen */}
            <TileSecundair
              href="/personen/spelers"
              titel="Personen"
              beschrijving="Spelers, staf en reserveringen"
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-secondary)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="7" r="3" />
                  <path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" />
                  <circle cx="17" cy="8" r="2.5" />
                  <path d="M16 20c0-2.5 1.5-4 4-4" />
                </svg>
              }
            />

            {/* Kaders */}
            <TileSecundair
              href="/kader"
              titel="Kaders"
              beschrijving="Seizoenskader per team beheren"
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-secondary)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              }
            />

            {/* Memo tile — full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <MemoTile stats={stats.memos} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
