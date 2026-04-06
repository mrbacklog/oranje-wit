export const dynamic = "force-dynamic";

import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { getActiefSeizoen } from "@/lib/teamindeling/seizoen";

export default async function OpvolgingPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const userEmail = session.user.email;
  const sessionUser = session.user as Record<string, unknown>;
  const isTC = sessionUser.isTC === true;
  const doelgroepen = Array.isArray(sessionUser.doelgroepen)
    ? (sessionUser.doelgroepen as string[])
    : [];

  const seizoen = await getActiefSeizoen();

  const blauwdruk = await prisma.blauwdruk.findUnique({
    where: { seizoen },
    select: { id: true },
  });

  if (!blauwdruk) {
    return (
      <div style={{ padding: "1rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.5rem",
          }}
        >
          Opvolging
        </h1>
        <p style={{ color: "var(--text-tertiary)" }}>Geen actief seizoen gevonden.</p>
      </div>
    );
  }

  // Actiepunten toegewezen aan de ingelogde gebruiker
  const actiepunten = await prisma.actiepunt.findMany({
    where: {
      blauwdrukId: blauwdruk.id,
      status: { not: "AFGEROND" },
      toegewezenAan: { email: userEmail },
    },
    orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      beschrijving: true,
      status: true,
      deadline: true,
      werkitem: { select: { titel: true, type: true } },
    },
  });

  // Werkitems gefilterd op doelgroep of alles voor TC
  const werkitemWhere = isTC
    ? { blauwdrukId: blauwdruk.id, status: { not: "GEARCHIVEERD" as const } }
    : {
        blauwdrukId: blauwdruk.id,
        status: { not: "GEARCHIVEERD" as const },
        OR: [
          {
            doelgroep: {
              in: doelgroepen as (
                | "KWEEKVIJVER"
                | "ONTWIKKELHART"
                | "TOP"
                | "WEDSTRIJDSPORT"
                | "KORFBALPLEZIER"
                | "ALLE"
              )[],
            },
          },
          { doelgroep: "ALLE" as const },
          { auteur: { email: userEmail } },
        ],
      };

  const werkitems = await prisma.werkitem.findMany({
    where: werkitemWhere,
    orderBy: [{ prioriteit: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      titel: true,
      type: true,
      prioriteit: true,
      status: true,
      doelgroep: true,
    },
  });

  const heeftNiets = actiepunten.length === 0 && werkitems.length === 0;

  return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
        Opvolging
      </h1>

      {heeftNiets && (
        <p style={{ color: "var(--text-tertiary)" }}>
          Geen openstaande actiepunten of werkitems voor jou.
        </p>
      )}

      {actiepunten.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            Jouw actiepunten ({actiepunten.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {actiepunten.map((ap) => (
              <div
                key={ap.id}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--surface-raised)",
                  borderRadius: "0.5rem",
                }}
              >
                {ap.werkitem && (
                  <div
                    style={{
                      color: "var(--text-tertiary)",
                      fontSize: "0.75rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {ap.werkitem.titel}
                  </div>
                )}
                <div style={{ color: "var(--text-primary)", fontSize: "0.9375rem" }}>
                  {ap.beschrijving}
                </div>
                <div
                  style={{
                    marginTop: "0.25rem",
                    display: "flex",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>{ap.status}</span>
                  {ap.deadline && (
                    <span style={{ color: "var(--text-tertiary)" }}>
                      deadline: {new Date(ap.deadline).toLocaleDateString("nl-NL")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {werkitems.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            Werkbord ({werkitems.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {werkitems.map((wi) => (
              <div
                key={wi.id}
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--surface-raised)",
                  borderRadius: "0.5rem",
                }}
              >
                <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{wi.titel}</div>
                <div
                  style={{
                    marginTop: "0.25rem",
                    display: "flex",
                    gap: "0.5rem",
                    fontSize: "0.75rem",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>{wi.type}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{wi.prioriteit}</span>
                  {wi.doelgroep && (
                    <span style={{ color: "var(--text-tertiary)" }}>{wi.doelgroep}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
