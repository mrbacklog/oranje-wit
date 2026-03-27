export const dynamic = "force-dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { KpiCard, PageContainer } from "@oranje-wit/ui";
import { InfoPageHeader } from "@/components/info/InfoPageHeader";
import { getSignaleringen } from "@/lib/queries/signalering";
import { HUIDIG_SEIZOEN } from "@/lib/utils/seizoen";
import { SignaleringCard } from "@/components/signalering/SignaleringCard";
import { SignaleringTabs } from "./signalering-tabs";
import type { SignaleringRow } from "@/lib/queries/signalering";

const THEMA_TYPES: Record<string, string[]> = {
  Werving: ["instroom", "pijplijn_vulgraad"],
  Retentie: ["retentie", "trendbreuk"],
  Pijplijn: ["forward_projectie", "genderdisbalans"],
};

const THEMA_LINKS: Record<string, string> = {
  Werving: "/retentie?tab=instroom",
  Retentie: "/retentie",
  Pijplijn: "/projecties",
};

function sorteerOpErnst(items: SignaleringRow[]): SignaleringRow[] {
  const volgorde: Record<string, number> = { kritiek: 0, aandacht: 1, opkoers: 2 };
  return [...items].sort((a, b) => (volgorde[a.ernst] ?? 3) - (volgorde[b.ernst] ?? 3));
}

function SignaleringLijst({ items, seizoen }: { items: SignaleringRow[]; seizoen: string }) {
  const gesorteerd = sorteerOpErnst(items);
  if (gesorteerd.length === 0) {
    return (
      <div className="bg-surface-card rounded-xl p-6 shadow-sm">
        <p className="text-text-muted">
          Geen signaleringen in deze categorie voor seizoen {seizoen}.
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

export default async function SignaleringPage() {
  const seizoen = HUIDIG_SEIZOEN;

  const signaleringen = await getSignaleringen(seizoen);

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

  const werving = signaleringen.filter((s) => THEMA_TYPES.Werving.includes(s.type));
  const retentie = signaleringen.filter((s) => THEMA_TYPES.Retentie.includes(s.type));
  const pijplijn = signaleringen.filter((s) => THEMA_TYPES.Pijplijn.includes(s.type));

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
              Tabs
            </h4>
            <p>
              <strong>Overzicht</strong> toont de samenvatting en strategisch advies.{" "}
              <strong>Werving</strong>, <strong>Retentie</strong> en <strong>Pijplijn</strong> tonen
              signaleringen per thema.
            </p>
          </section>
        </div>
      </InfoPageHeader>

      <SignaleringTabs
        overzichtContent={
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard label="Kritiek" value={kritiek} signal="rood" />
              <KpiCard label="Aandacht" value={aandacht} signal="geel" />
              <KpiCard label="Op koers" value={opKoers} signal="groen" />
            </div>

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
                            {thema.signalen.length}{" "}
                            {thema.signalen.length === 1 ? "signaal" : "signalen"}
                          </span>
                        </div>
                        {topAdvies && (
                          <p className="text-text-secondary mb-2 text-xs">{topAdvies}</p>
                        )}
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

            <SignaleringLijst items={signaleringen} seizoen={seizoen} />
          </>
        }
        wervingContent={<SignaleringLijst items={werving} seizoen={seizoen} />}
        retentieContent={<SignaleringLijst items={retentie} seizoen={seizoen} />}
        pijplijnContent={<SignaleringLijst items={pijplijn} seizoen={seizoen} />}
      />
    </PageContainer>
  );
}
