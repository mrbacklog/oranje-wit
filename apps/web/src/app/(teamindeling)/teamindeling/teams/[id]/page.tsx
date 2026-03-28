export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/teamindeling/db/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TeamDetail({ params }: Props) {
  const { id } = await params;

  const team = await prisma.oWTeam.findUnique({
    where: { id: Number(id) },
  });

  if (!team) notFound();

  return (
    <div style={{ padding: "1rem" }}>
      <Link
        href="/teamindeling/teams"
        style={{ color: "var(--text-secondary)", fontSize: "0.875rem", textDecoration: "none" }}
      >
        &larr; Terug naar teams
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
        {team.naam ?? team.owCode}
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--text-secondary)",
          marginBottom: "1.5rem",
        }}
      >
        {team.kleur && (
          <div
            style={{
              width: "0.75rem",
              height: "0.75rem",
              borderRadius: "50%",
              backgroundColor: team.kleur,
            }}
          />
        )}
        <span>Categorie {team.categorie.toUpperCase()}</span>
        {team.leeftijdsgroep && <span>&middot; {team.leeftijdsgroep}</span>}
        {team.spelvorm && <span>&middot; {team.spelvorm}</span>}
      </div>

      <div
        style={{
          padding: "1rem",
          backgroundColor: "var(--surface-raised)",
          borderRadius: "0.5rem",
        }}
      >
        <p style={{ color: "var(--text-tertiary)" }}>
          Teamdetails en spelersoverzicht worden hier toegevoegd.
        </p>
      </div>
    </div>
  );
}
