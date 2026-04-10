export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";
import Link from "next/link";

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

type MemoItem = {
  id: string;
  type: "team" | "speler" | "kader";
  naam: string;
  sublabel?: string;
  tekst: string | null;
  memoStatus: string;
  besluit: string | null;
  href: string;
};

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

const DOELGROEP_LABELS: Record<string, string> = {
  kweekvijver: "Kweekvijver",
  opleidingshart: "Opleidingshart",
  korfbalplezier: "Korfbalplezier",
  wedstrijdsport: "Wedstrijdsport",
  topsport: "Topsport",
  tc: "TC algemeen",
};

// ──────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────

export default async function MemoOverzichtPage() {
  const seizoen = await getActiefSeizoen();

  // Laad team-memos (actief seizoen via werkindeling)
  const werkindeling = await prisma.werkindeling.findFirst({
    where: {
      kaders: { seizoen },
      verwijderdOp: null,
    },
    select: { id: true },
    orderBy: { aangemaakt: "desc" },
  });

  const teamMemos: MemoItem[] = [];
  if (werkindeling) {
    const versie = await prisma.versie.findFirst({
      where: { werkindelingId: werkindeling.id },
      orderBy: { nummer: "desc" },
      select: {
        teams: {
          where: { verwijderdOp: null },
          select: {
            id: true,
            naam: true,
            notitie: true,
            memoStatus: true,
            besluit: true,
          },
        },
      },
    });

    for (const team of versie?.teams ?? []) {
      if (team.notitie || team.memoStatus === "open") {
        teamMemos.push({
          id: team.id,
          type: "team",
          naam: team.naam,
          tekst: team.notitie,
          memoStatus: team.memoStatus,
          besluit: team.besluit,
          href: "/ti-studio/indeling",
        });
      }
    }
  }

  // Laad speler-memos
  const spelersMetMemo = await prisma.speler.findMany({
    where: {
      huidig: { not: null },
      OR: [{ notitie: { not: null } }, { memoStatus: "open" }],
    },
    select: {
      id: true,
      roepnaam: true,
      achternaam: true,
      notitie: true,
      memoStatus: true,
      besluit: true,
    },
    orderBy: [{ achternaam: "asc" }, { roepnaam: "asc" }],
  });

  const spelerMemos: MemoItem[] = spelersMetMemo.map((sp) => ({
    id: sp.id,
    type: "speler",
    naam: `${sp.roepnaam} ${sp.achternaam}`,
    tekst: sp.notitie,
    memoStatus: sp.memoStatus,
    besluit: sp.besluit,
    href: "/ti-studio/indeling",
  }));

  // Laad kaders-memos (uit kaders JSON)
  const kaderRecord = await prisma.kaders.findFirst({
    where: { isWerkseizoen: true },
    select: { id: true, kaders: true },
  });

  const kaderMemos: MemoItem[] = [];
  if (kaderRecord) {
    const kadersJson = (kaderRecord.kaders ?? {}) as Record<string, unknown>;
    const memos = (kadersJson.memos ?? {}) as Record<
      string,
      { tekst?: string | null; memoStatus?: string; besluit?: string | null } | undefined
    >;
    for (const [sleutel, data] of Object.entries(memos)) {
      if (data && (data.tekst || data.memoStatus === "open")) {
        kaderMemos.push({
          id: `kader-${sleutel}`,
          type: "kader",
          naam: DOELGROEP_LABELS[sleutel] ?? sleutel,
          sublabel: "Kaders",
          tekst: data.tekst ?? null,
          memoStatus: data.memoStatus ?? "gesloten",
          besluit: data.besluit ?? null,
          href: "/ti-studio/kader",
        });
      }
    }
  }

  const alleMemos = [...teamMemos, ...spelerMemos, ...kaderMemos];
  const openMemos = alleMemos.filter((m) => m.memoStatus === "open");
  const geslotenMemos = alleMemos.filter((m) => m.memoStatus === "gesloten");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)", marginBottom: 4 }}>
          Memo&apos;s
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          Overzicht van alle openstaande en afgesloten memo&apos;s
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12 }}>
        <StatBadge
          label="Open"
          aantal={openMemos.length}
          kleur="var(--accent)"
          bg="rgba(255,107,0,.12)"
          border="rgba(255,107,0,.3)"
        />
        <StatBadge
          label="Gesloten"
          aantal={geslotenMemos.length}
          kleur="var(--text-secondary)"
          bg="var(--surface-card)"
          border="var(--border-default)"
        />
        <StatBadge
          label="Totaal"
          aantal={alleMemos.length}
          kleur="var(--text-primary)"
          bg="var(--surface-card)"
          border="var(--border-default)"
        />
      </div>

      {/* Open memo's */}
      {openMemos.length > 0 && (
        <section>
          <SectieHeader label="Open — actie vereist" kleur="var(--accent)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {openMemos.map((m) => (
              <MemoRij key={m.id} item={m} />
            ))}
          </div>
        </section>
      )}

      {/* Gesloten memo's */}
      {geslotenMemos.length > 0 && (
        <section>
          <SectieHeader label="Gesloten — besluit genomen" kleur="var(--text-secondary)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {geslotenMemos.map((m) => (
              <MemoRij key={m.id} item={m} />
            ))}
          </div>
        </section>
      )}

      {alleMemos.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "var(--text-tertiary)",
            fontSize: 14,
          }}
        >
          ✓ Geen memo&apos;s gevonden
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Sub-componenten
// ──────────────────────────────────────────────────────────

function StatBadge({
  label,
  aantal,
  kleur,
  bg,
  border,
}: {
  label: string;
  aantal: number;
  kleur: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        background: bg,
        border: `1px solid ${border}`,
        minWidth: 80,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color: kleur }}>{aantal}</div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SectieHeader({ label, kleur }: { label: string; kleur: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        color: kleur,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {label}
      <span style={{ flex: 1, height: 1, background: "var(--border-default)" }} />
    </div>
  );
}

const TYPE_BADGE: Record<string, { label: string; kleur: string; bg: string }> = {
  team: { label: "Team", kleur: "var(--blue)", bg: "rgba(96,165,250,.12)" },
  speler: { label: "Speler", kleur: "var(--pink)", bg: "rgba(236,72,153,.12)" },
  kader: { label: "Kader", kleur: "var(--warn)", bg: "rgba(234,179,8,.12)" },
};

function MemoRij({ item }: { item: MemoItem }) {
  const badge = TYPE_BADGE[item.type];
  const isOpen = item.memoStatus === "open";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 16px",
        background: "var(--surface-card)",
        border: `1px solid ${isOpen ? "rgba(255,107,0,.3)" : "var(--border-default)"}`,
        borderRadius: 10,
      }}
    >
      {/* Type badge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 7px",
          borderRadius: 5,
          background: badge.bg,
          color: badge.kleur,
          whiteSpace: "nowrap",
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        {badge.label}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Naam + indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {item.naam}
          </span>
          {isOpen && (
            <span style={{ fontSize: 9, color: "var(--accent)" }} title="Open memo">
              ▲
            </span>
          )}
        </div>

        {/* Memo tekst preview */}
        {item.tekst && (
          <p
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              margin: "4px 0 0",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {item.tekst}
          </p>
        )}

        {/* Besluit (gesloten) */}
        {!isOpen && item.besluit && (
          <div
            style={{
              marginTop: 6,
              padding: "5px 8px",
              borderRadius: 6,
              background: "rgba(34,197,94,.08)",
              border: "1px solid rgba(34,197,94,.2)",
              fontSize: 11,
              color: "var(--ok)",
            }}
          >
            <span style={{ fontWeight: 600 }}>Besluit: </span>
            {item.besluit}
          </div>
        )}
      </div>

      {/* Link */}
      <Link
        href={item.href}
        style={{
          fontSize: 11,
          color: "var(--accent)",
          textDecoration: "none",
          fontWeight: 600,
          whiteSpace: "nowrap",
          flexShrink: 0,
          alignSelf: "center",
        }}
      >
        Openen →
      </Link>
    </div>
  );
}
