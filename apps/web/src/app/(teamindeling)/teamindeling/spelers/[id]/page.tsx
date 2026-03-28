export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { PEILJAAR } from "@oranje-wit/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SpelerDetail({ params }: Props) {
  const { id } = await params;

  const speler = await prisma.speler.findUnique({
    where: { id },
  });

  if (!speler) notFound();

  const korfbalLeeftijd = PEILJAAR - speler.geboortejaar;

  return (
    <div style={{ padding: "1rem" }}>
      <Link
        href="/teamindeling/spelers"
        style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none" }}
      >
        &larr; Terug naar spelers
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
        {speler.roepnaam} {speler.achternaam}
      </h1>

      <div style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        {speler.geslacht} &middot; Korfballeeftijd {korfbalLeeftijd} &middot; geb.{" "}
        {speler.geboortejaar}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            padding: "1rem",
            backgroundColor: "var(--surface-raised)",
            borderRadius: "0.5rem",
          }}
        >
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              marginBottom: "0.25rem",
            }}
          >
            Status
          </div>
          <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{speler.status}</div>
        </div>

        {speler.lidSinds && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "var(--surface-raised)",
              borderRadius: "0.5rem",
            }}
          >
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
                marginBottom: "0.25rem",
              }}
            >
              Lid sinds
            </div>
            <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{speler.lidSinds}</div>
          </div>
        )}

        {speler.seizoenenActief != null && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "var(--surface-raised)",
              borderRadius: "0.5rem",
            }}
          >
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
                marginBottom: "0.25rem",
              }}
            >
              Seizoenen actief
            </div>
            <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {speler.seizoenenActief}
            </div>
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
            Spelersprofiel, evaluaties en plaatsingshistorie worden hier toegevoegd.
          </p>
        </div>
      </div>
    </div>
  );
}
