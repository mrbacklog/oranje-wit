export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/teamindeling/db/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WerkindelingDetail({ params }: Props) {
  const { id } = await params;

  const werkindeling = await prisma.werkindeling.findUnique({
    where: { id },
    include: {
      blauwdruk: {
        select: { seizoen: true },
      },
    },
  });

  if (!werkindeling || werkindeling.verwijderdOp) notFound();

  return (
    <div style={{ padding: "1rem" }}>
      <Link
        href="/teamindeling/scenarios"
        style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none" }}
      >
        &larr; Terug naar werkindeling
      </Link>

      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginTop: "0.75rem",
          marginBottom: "0.25rem",
        }}
      >
        {werkindeling.naam}
      </h1>

      <div style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        {werkindeling.blauwdruk.seizoen} &middot; {werkindeling.status}
      </div>

      {werkindeling.toelichting && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--surface-raised)",
            borderRadius: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              marginBottom: "0.25rem",
            }}
          >
            Toelichting
          </div>
          <div style={{ color: "var(--text-primary)" }}>{werkindeling.toelichting}</div>
        </div>
      )}

      <div
        style={{
          padding: "1rem",
          backgroundColor: "var(--surface-raised)",
          borderRadius: "0.5rem",
        }}
      >
        <p style={{ color: "var(--text-tertiary)" }}>
          Teamoverzicht en spelersplaatsing worden hier toegevoegd.
        </p>
      </div>
    </div>
  );
}
