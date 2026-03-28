"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { logger } from "@oranje-wit/types";
import { LeeftijdsgroepBadge } from "@/components/scouting/leeftijdsgroep-badge";
import {
  ProfielTab,
  RapportenTab,
  KaartTab,
  type SpelerProfielData,
} from "@/components/scouting/profiel-tabs";

type Tab = "profiel" | "rapporten" | "kaart";

export default function SpelerProfielPage() {
  const params = useParams();
  const router = useRouter();
  const relCode = params.relCode as string;

  const [profiel, setProfiel] = useState<SpelerProfielData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actieveTab, setActieveTab] = useState<Tab>("profiel");

  useEffect(() => {
    async function laad() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/scouting/spelers/${relCode}`);
        const data = await res.json();

        if (data.ok && data.data) {
          setProfiel(data.data);
        } else {
          setError(data.error?.message ?? "Kon speler niet laden");
        }
      } catch (err) {
        logger.warn("[profiel] Fetch fout:", err);
        setError("Verbindingsfout");
      } finally {
        setIsLoading(false);
      }
    }

    if (relCode) {
      laad();
    }
  }, [relCode]);

  if (isLoading) return <ProfielSkeleton />;

  if (error || !profiel) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-20">
        <p className="text-text-muted">{error ?? "Speler niet gevonden"}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-surface-elevated text-text-primary mt-4 rounded-xl px-4 py-2 text-sm font-medium"
        >
          Terug
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      <HeroSection profiel={profiel} onBack={() => router.back()} />

      {/* Tabs */}
      <div className="mt-6 flex border-b border-white/10 px-4">
        {(["profiel", "rapporten", "kaart"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActieveTab(tab)}
            className={`touch-target flex-1 py-3 text-center text-sm font-medium transition-colors ${
              actieveTab === tab ? "border-ow-oranje text-ow-oranje border-b-2" : "text-text-muted"
            }`}
          >
            {tab === "profiel" && "Profiel"}
            {tab === "rapporten" && "Rapporten"}
            {tab === "kaart" && "Kaart"}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {actieveTab === "profiel" && <ProfielTab profiel={profiel} />}
        {actieveTab === "rapporten" && <RapportenTab rapporten={profiel.scoutingRapporten} />}
        {actieveTab === "kaart" && <KaartTab kaart={profiel.spelersKaart} profiel={profiel} />}
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-16 z-40 px-4 pb-4">
        <Link
          href={`/scouting/rapport/nieuw/${profiel.relCode}`}
          className="touch-target bg-ow-oranje active:bg-ow-oranje-dark flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white shadow-lg transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth={2}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeLinecap="round" />
          </svg>
          Scout deze speler
        </Link>
      </div>
    </div>
  );
}

function HeroSection({ profiel, onBack }: { profiel: SpelerProfielData; onBack: () => void }) {
  return (
    <div className="relative flex flex-col items-center px-4 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="bg-surface-elevated/80 absolute top-6 left-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm"
      >
        <svg viewBox="0 0 24 24" fill="none" className="text-text-primary h-5 w-5" strokeWidth={2}>
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="mb-4">
        {profiel.heeftFoto ? (
          <img
            src={profiel.fotoUrl!}
            alt={`${profiel.roepnaam} ${profiel.volleAchternaam}`}
            className="border-surface-elevated h-28 w-28 rounded-full border-4 object-cover"
          />
        ) : (
          <div className="border-surface-elevated bg-surface-card text-text-secondary flex h-28 w-28 items-center justify-center rounded-full border-4 text-3xl font-bold">
            {profiel.roepnaam.charAt(0)}
            {profiel.achternaam.charAt(0)}
          </div>
        )}
      </div>

      <h1 className="text-text-primary text-2xl font-bold">
        {profiel.roepnaam} {profiel.volleAchternaam}
      </h1>

      <div className="mt-2 flex items-center gap-2">
        {profiel.huidig?.team && (
          <span className="text-text-secondary text-sm">{profiel.huidig.team}</span>
        )}
        <LeeftijdsgroepBadge kleur={profiel.kleur} leeftijd={profiel.leeftijd} size="md" />
      </div>

      <div className="text-text-muted mt-1 flex items-center gap-2 text-xs">
        <span>{profiel.geslacht === "M" ? "Jongen" : "Meisje"}</span>
        <span>|</span>
        <span>Geb. {profiel.geboortejaar}</span>
        {profiel.seizoenenActief && (
          <>
            <span>|</span>
            <span>{profiel.seizoenenActief} seizoenen</span>
          </>
        )}
      </div>
    </div>
  );
}

function ProfielSkeleton() {
  return (
    <div className="flex flex-col items-center px-4 pt-6">
      <div className="bg-surface-elevated h-28 w-28 animate-pulse rounded-full" />
      <div className="bg-surface-elevated mt-4 h-7 w-48 animate-pulse rounded" />
      <div className="bg-surface-elevated mt-2 h-5 w-32 animate-pulse rounded" />
      <div className="bg-surface-elevated mt-8 h-10 w-full animate-pulse rounded-xl" />
      <div className="bg-surface-elevated mt-4 h-40 w-full animate-pulse rounded-2xl" />
    </div>
  );
}
