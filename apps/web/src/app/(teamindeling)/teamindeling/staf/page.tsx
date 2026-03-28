export const dynamic = "force-dynamic";

import { prisma } from "@/lib/teamindeling/db/prisma";

export default async function StafOverview() {
  const stafleden = await prisma.staf.findMany({
    orderBy: { naam: "asc" },
    select: {
      id: true,
      naam: true,
      rollen: true,
      email: true,
    },
  });

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "0.25rem",
        }}
      >
        Staf
      </h1>
      <p style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }}>
        {stafleden.length} stafleden
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {stafleden.map(
          (staf: { id: string; naam: string; rollen: string[]; email: string | null }) => (
            <div
              key={staf.id}
              style={{
                padding: "0.75rem 1rem",
                backgroundColor: "var(--surface-raised)",
                borderRadius: "0.5rem",
              }}
            >
              <div style={{ color: "var(--text-primary)", fontWeight: 600 }}>{staf.naam}</div>
              {staf.rollen.length > 0 && (
                <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  {staf.rollen.join(", ")}
                </div>
              )}
            </div>
          )
        )}

        {stafleden.length === 0 && (
          <p style={{ color: "var(--text-tertiary)" }}>Geen stafleden gevonden.</p>
        )}
      </div>
    </div>
  );
}
