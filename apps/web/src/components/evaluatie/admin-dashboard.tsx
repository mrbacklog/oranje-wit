"use client";

import Link from "next/link";
import { Card, CardBody, Badge, StatCard, ProgressBar } from "@oranje-wit/ui";

interface Ronde {
  id: string;
  seizoen: string;
  ronde: number;
  naam: string;
  type: string;
  deadline: string;
  status: string;
  _count: { uitnodigingen: number; evaluaties: number };
}

interface AdminDashboardProps {
  rondes: Ronde[];
  totaalIngediend: number;
  totaalUitnodigingen: number;
}

const statusKleur: Record<string, "gray" | "green" | "orange" | "red"> = {
  concept: "gray",
  actief: "green",
  gesloten: "red",
};

export function AdminDashboard({
  rondes,
  totaalIngediend,
  totaalUitnodigingen,
}: AdminDashboardProps) {
  return (
    <main
      className="min-h-screen px-5 pt-10 pb-20"
      style={{ backgroundColor: "var(--surface-page)" }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: "var(--text-primary)" }}
            >
              Evaluaties
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-tertiary)" }}>
              Beheer evaluatierondes en bekijk voortgang
            </p>
          </div>
          <Link
            href="/beheer/evaluatie"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{
              background: "linear-gradient(135deg, var(--ow-oranje-500), var(--ow-oranje-600))",
              boxShadow: "0 0 12px rgba(255, 133, 51, 0.15)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Beheer
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-3">
          <StatCard label="Rondes" value={rondes.length} color="default" />
          <StatCard label="Ingediend" value={totaalIngediend} color="green" />
          <StatCard label="Uitnodigingen" value={totaalUitnodigingen} color="orange" />
        </div>

        {rondes.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-tertiary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-3"
                aria-hidden="true"
              >
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
              </svg>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Nog geen evaluatierondes aangemaakt.
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Maak een ronde aan via Beheer.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {rondes.map((ronde) => {
              const voortgang =
                ronde._count.uitnodigingen > 0
                  ? Math.round((ronde._count.evaluaties / ronde._count.uitnodigingen) * 100)
                  : 0;

              return <RondeKaart key={ronde.id} ronde={ronde} voortgang={voortgang} />;
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function RondeKaart({ ronde, voortgang }: { ronde: Ronde; voortgang: number }) {
  const deadlineDate = new Date(ronde.deadline);
  const deadlineStr = deadlineDate.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isVerlopen = deadlineDate < new Date() && ronde.status === "actief";

  return (
    <Link href={`/beheer/evaluatie/${ronde.id}`}>
      <Card className="transition-colors hover:border-[var(--border-strong)]">
        <CardBody>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className="truncate text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {ronde.naam}
                </h3>
                <Badge color={statusKleur[ronde.status] ?? "gray"}>{ronde.status}</Badge>
              </div>
              <div
                className="mt-1 flex items-center gap-3 text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                <span>{ronde.seizoen}</span>
                <span className="capitalize">{ronde.type}</span>
                <span className={isVerlopen ? "text-[#ef4444]" : ""}>{deadlineStr}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
                {ronde._count.uitnodigingen}
              </div>
              <div
                className="flex items-center gap-1 text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m9 11 3 3L22 4" />
                </svg>
                {ronde._count.evaluaties}
              </div>
            </div>
          </div>

          {ronde._count.uitnodigingen > 0 && (
            <div className="mt-3">
              <ProgressBar
                value={ronde._count.evaluaties}
                max={ronde._count.uitnodigingen}
                showValue
                valueFormat="absolute"
                size="sm"
                color={
                  voortgang === 100
                    ? { from: "#16a34a", to: "#22c55e" }
                    : { from: "var(--ow-oranje-500)", to: "var(--ow-oranje-400)" }
                }
              />
            </div>
          )}
        </CardBody>
      </Card>
    </Link>
  );
}
