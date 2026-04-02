export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KpiCard, PageContainer } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/monitor/info/InfoPageHeader";
import { getSignaleringen } from "@/lib/monitor/queries/signalering";
import { HUIDIG_SEIZOEN } from "@/lib/monitor/utils/seizoen";
import { SignaleringCard } from "@/components/monitor/signalering/SignaleringCard";
import { SignaleringFilter } from "./signalering-filter";
import type { SignaleringRow } from "@/lib/monitor/queries/signalering";

const THEMA_TYPES: Record<string, string[]> = {
  Werving: ["instroom", "pijplijn_vulgraad"],
  Retentie: ["retentie", "trendbreuk"],
  Pijplijn: ["forward_projectie", "genderdisbalans"],
};

const FILTER_TO_TYPES: Record<string, string[]> = {
  werving: THEMA_TYPES.Werving,
  retentie: THEMA_TYPES.Retentie,
  pijplijn: THEMA_TYPES.Pijplijn,
};

const THEMA_LINKS: Record<string, string> = {
  Werving: "/monitor/retentie?tab=verloop",
  Retentie: "/monitor/retentie",
  Pijplijn: "/monitor/samenstelling",
};

function normalizeFilter(raw: string | undefined): keyof typeof FILTER_TO_TYPES | "alles" {
  const f = (raw ?? "alles").toLowerCase();
  if (f === "werving" || f === "retentie" || f === "pijplijn") return f;
  return "alles";
}

function sorteerOpErnst(items: SignaleringRow[]): SignaleringRow[] {
  const volgorde: Record<string, number> = {
    kritiek: 0,
    aandacht: 1,
    op_koers: 2,
    opkoers: 2,
  };
  return [...items].sort((a, b) => (volgorde[a.ernst] ?? 3) - (volgorde[b.ernst] ?? 3));
}

function filterSignaleringen(
  items: SignaleringRow[],
  filter: ReturnType<typeof normalizeFilter>
): SignaleringRow[] {
  if (filter === "alles") return items;
  const types = FILTER_TO_TYPES[filter];
  return items.filter((s) => types.includes(s.type));
}

function SignaleringLijst({ items, seizoen }: { items: SignaleringRow[]; seizoen: string }) {
  const gesorteerd = sorteerOpErnst(items);
  if (gesorteerd.length === 0) {
    return (
      <div className="bg-surface-card rounded-xl p-6 shadow-sm">
        <p className="text-text-muted">
          Geen signaleringen in deze selectie voor seizoen {seizoen}.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {gesorteerd.map((s) => (
        <SignaleringCard key={s.id} signalering={s} />
      ))}
    </div>
  );
}

type PageProps = {
  searchParams: Promise<{ filter?: string; tab?: string }>;
};

export default async function SignaleringPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (params.tab && !params.filter) {
    const t = String(params.tab).toLowerCase();
    if (t === "overzicht") {
      redirect("/monitor/signalering");
    }
    if (t === "werving" || t === "retentie" || t === "pijplijn") {
      redirect(`/monitor/signalering?filter=${t}`);
    }
  }

  const seizoen = HUIDIG_SEIZOEN;
  const filter = normalizeFilter(params.filter);

  const signaleringen = await getSignaleringen(seizoen);
  const gefilterd = filterSignaleringen(signaleringen, filter);

  const kritiek = signaleringen.filter((s) => s.ernst === "kritiek").length;
  const aandacht = signaleringen.filter((s) => s.ernst === "aandacht").length;
  const opKoers = signaleringen.length - kritiek - aandacht;

  const actief = signaleringen.filter((s) => s.ernst === "kritiek" || s.ernst === "aandacht");

  const themaGroepen = Object.entries(THEMA_TYPES)
    .map(([titel, types]) => ({
      titel,
      signalen: actief.filter((s) => types.includes(s.type)),
      link: THEMA_LINKS[titel],
    }))
    .filter((t) => t.signalen.length > 0);

  return (
    <PageContainer animated>
      <InfoPageHeader
        title="Signalering"
        subtitle="Waar moeten we op letten? Acties en aandachtspunten."
        infoTitle="Over Signalering"
      >
        <div className="space-y-4">
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Wat zie je?
            </h4>
            <p>Automatische signaleringen en gerichte adviezen voor het geselecteerde seizoen.</p>
          </section>
          <section>
            <h4 className="text-text-muted mb-1 text-xs font-semibold tracking-wide uppercase">
              Filter
            </h4>
            <p>
              Gebruik <strong>Alles</strong>, <strong>Werving</strong>, <strong>Retentie</strong> of{" "}
              <strong>Pijplijn</strong> om de lijst te filteren. De URL is deelbaar (
              <code className="text-text-secondary text-xs">?filter=</code>
              ).
            </p>
          </section>
        </div>
      </InfoPageHeader>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Kritiek" value={kritiek} signal="rood" />
        <KpiCard label="Aandacht" value={aandacht} signal="geel" />
        <KpiCard label="Op koers" value={opKoers} signal="groen" />
      </div>

      <Suspense fallback={<div className="mb-6 flex min-h-11 flex-wrap gap-2" aria-hidden />}>
        <SignaleringFilter />
      </Suspense>

      {themaGroepen.length > 0 && (
        <div className="bg-surface-card mb-8 rounded-xl p-6 shadow-sm">
          <h3 className="text-text-secondary mb-4 text-sm font-semibold tracking-wide uppercase">
            Strategisch advies
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {themaGroepen.map((thema) => {
              const heeftKritiek = thema.signalen.some((s) => s.ernst === "kritiek");
              const topAdvies = thema.signalen.find((s) => s.advies)?.advies;
              return (
                <div
                  key={thema.titel}
                  className="rounded-lg border p-4"
                  style={
                    heeftKritiek
                      ? {
                          borderColor: "var(--color-error-100)",
                          backgroundColor: "var(--color-error-50)",
                        }
                      : {
                          borderColor: "var(--color-warning-100)",
                          backgroundColor: "var(--color-warning-50)",
                        }
                  }
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-text-primary text-sm font-semibold">{thema.titel}</h4>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        heeftKritiek ? "text-signal-rood" : "text-signal-geel"
                      }`}
                      style={
                        heeftKritiek
                          ? { backgroundColor: "var(--color-error-100)" }
                          : { backgroundColor: "var(--color-warning-100)" }
                      }
                    >
                      {thema.signalen.length} {thema.signalen.length === 1 ? "signaal" : "signalen"}
                    </span>
                  </div>
                  {topAdvies && <p className="text-text-secondary mb-2 text-xs">{topAdvies}</p>}
                  <Link
                    href={thema.link}
                    className="text-ow-oranje hover:text-ow-oranje/80 text-xs font-medium"
                  >
                    Bekijk details &rarr;
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SignaleringLijst items={gefilterd} seizoen={seizoen} />
    </PageContainer>
  );
}
