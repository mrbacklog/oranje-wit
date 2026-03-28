export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/teamindeling/db/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScenarioDetail({ params }: Props) {
  const { id } = await params;

  const scenario = await prisma.scenario.findUnique({
    where: { id },
    include: {
      concept: {
        select: { naam: true },
      },
    },
  });

  if (!scenario || scenario.verwijderdOp) notFound();

  return (
    <div style={{ padding: "1rem" }}>
      <Link
        href="/teamindeling/scenarios"
        style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none" }}
      >
        &larr; Terug naar scenario&apos;s
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
        {scenario.naam}
      </h1>

      <div style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        {scenario.concept.naam} &middot; {scenario.status}
      </div>

      {scenario.toelichting && (
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
          <div style={{ color: "var(--text-primary)" }}>{scenario.toelichting}</div>
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
          Teamoverzicht (carousel) en spelersplaatsing worden hier toegevoegd.
        </p>
      </div>
    </div>
  );
}
