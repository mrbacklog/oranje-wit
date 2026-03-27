"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logger } from "@oranje-wit/types";

// ============================================================
// Types
// ============================================================

interface GroepSamenvatting {
  id: string;
  band: string;
  schaalType: string;
  kernItemsTarget: number | null;
  aantalPijlers: number;
  totaalItems: number;
  kernItems: number;
}

interface VersieData {
  id: string;
  seizoen: string;
  naam: string;
  status: string;
  opmerking: string | null;
  createdAt: string;
  gepubliceerdOp: string | null;
  groepen: GroepSamenvatting[];
}

// ============================================================
// Constanten
// ============================================================

const BAND_KLEUREN: Record<string, string> = {
  paars: "bg-knkv-paars/20 text-knkv-paars border-knkv-paars/30",
  blauw: "bg-knkv-blauw/20 text-knkv-blauw border-knkv-blauw/30",
  groen: "bg-knkv-groen/20 text-knkv-groen border-knkv-groen/30",
  geel: "bg-knkv-geel/20 text-knkv-geel border-knkv-geel/30",
  oranje: "bg-knkv-oranje/20 text-knkv-oranje border-knkv-oranje/30",
  rood: "bg-knkv-rood/20 text-knkv-rood border-knkv-rood/30",
};

const BAND_LABELS: Record<string, string> = {
  paars: "Paars (4-5)",
  blauw: "Blauw (5-7)",
  groen: "Groen (8-9)",
  geel: "Geel (10-12)",
  oranje: "Oranje (13-15)",
  rood: "Rood (16-18)",
};

const STATUS_KLEUREN: Record<string, string> = {
  CONCEPT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  ACTIEF: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  GEARCHIVEERD: "bg-surface-card/10 text-white/40 border-white/10",
};

// ============================================================
// Component
// ============================================================

export function RaamwerkOverzicht({ versies }: { versies: VersieData[] }) {
  const router = useRouter();
  const [showNieuwForm, setShowNieuwForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [seizoen, setSeizoen] = useState("");
  const [naam, setNaam] = useState("");

  const actieveVersie = versies.find((v) => v.status === "ACTIEF");
  const conceptVersies = versies.filter((v) => v.status === "CONCEPT");
  const archiefVersies = versies.filter((v) => v.status === "GEARCHIVEERD");

  async function maakNieuweVersie() {
    if (!seizoen || !naam) return;
    setLoading(true);
    try {
      const res = await fetch("/api/scouting/admin/raamwerk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seizoen, naam }),
      });
      const json = await res.json();
      if (!json.ok) {
        logger.warn("Fout bij aanmaken versie:", json.error?.message);
        return;
      }
      setShowNieuwForm(false);
      setSeizoen("");
      setNaam("");
      router.refresh();
    } catch (error) {
      logger.warn("Fout bij aanmaken versie:", error);
    } finally {
      setLoading(false);
    }
  }

  async function activeerVersie(id: string) {
    if (
      !confirm(
        "Weet je zeker dat je deze versie wilt activeren? De huidige actieve versie wordt gearchiveerd."
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/scouting/admin/raamwerk/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIEF" }),
      });
      const json = await res.json();
      if (!json.ok) {
        logger.warn("Fout bij activeren:", json.error?.message);
        return;
      }
      router.refresh();
    } catch (error) {
      logger.warn("Fout bij activeren:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Raamwerk beheer</h2>
          <p className="text-text-secondary mt-1">Beheer de itemcatalogus per leeftijdsgroep</p>
        </div>
        <button
          onClick={() => setShowNieuwForm(!showNieuwForm)}
          className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Nieuwe versie
        </button>
      </div>

      {/* Nieuw versie formulier */}
      {showNieuwForm && (
        <div className="bg-surface-card rounded-2xl border border-white/10 p-5">
          <h3 className="mb-4 font-semibold">Nieuwe raamwerkversie aanmaken</h3>
          <p className="text-text-secondary mb-4 text-sm">
            Kopieert alle items van de actieve versie als startpunt.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-text-secondary mb-1 block text-sm">Seizoen</label>
              <input
                type="text"
                value={seizoen}
                onChange={(e) => setSeizoen(e.target.value)}
                placeholder="2026-2027"
                className="bg-surface-elevated focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-text-secondary mb-1 block text-sm">Naam</label>
              <input
                type="text"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                placeholder="Vaardigheidsraamwerk v3.1"
                className="bg-surface-elevated focus:border-ow-oranje w-full rounded-lg border border-white/10 px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={maakNieuweVersie}
              disabled={loading || !seizoen || !naam}
              className="bg-ow-oranje hover:bg-ow-oranje-dark rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {loading ? "Bezig..." : "Aanmaken"}
            </button>
            <button
              onClick={() => setShowNieuwForm(false)}
              className="text-text-secondary hover:text-text-primary rounded-lg px-4 py-2 text-sm transition-colors"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Actieve versie */}
      {actieveVersie && (
        <VersieKaart versie={actieveVersie} onActiveer={activeerVersie} loading={loading} />
      )}

      {/* Concept versies */}
      {conceptVersies.length > 0 && (
        <div>
          <h3 className="text-text-secondary mb-3 text-sm font-medium tracking-wider uppercase">
            Concept
          </h3>
          <div className="space-y-4">
            {conceptVersies.map((v) => (
              <VersieKaart key={v.id} versie={v} onActiveer={activeerVersie} loading={loading} />
            ))}
          </div>
        </div>
      )}

      {/* Gearchiveerde versies */}
      {archiefVersies.length > 0 && (
        <div>
          <h3 className="text-text-secondary mb-3 text-sm font-medium tracking-wider uppercase">
            Archief
          </h3>
          <div className="space-y-4">
            {archiefVersies.map((v) => (
              <VersieKaart key={v.id} versie={v} onActiveer={activeerVersie} loading={loading} />
            ))}
          </div>
        </div>
      )}

      {/* Lege staat */}
      {versies.length === 0 && (
        <div className="bg-surface-card rounded-2xl border border-white/10 p-12 text-center">
          <p className="text-text-secondary">
            Geen raamwerkversies gevonden. Maak een nieuwe versie aan of draai het seed-script.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// VersieKaart sub-component
// ============================================================

function VersieKaart({
  versie,
  onActiveer,
  loading,
}: {
  versie: VersieData;
  onActiveer: (id: string) => void;
  loading: boolean;
}) {
  const statusKleur = STATUS_KLEUREN[versie.status] ?? STATUS_KLEUREN.CONCEPT;
  const isConcept = versie.status === "CONCEPT";
  const isActief = versie.status === "ACTIEF";

  return (
    <div className="bg-surface-card rounded-2xl border border-white/10 p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">{versie.naam}</h3>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusKleur}`}
            >
              {versie.status}
            </span>
          </div>
          <p className="text-text-secondary mt-1 text-sm">
            Seizoen {versie.seizoen}
            {versie.gepubliceerdOp &&
              ` — gepubliceerd ${new Date(versie.gepubliceerdOp).toLocaleDateString("nl-NL")}`}
          </p>
        </div>
        {isConcept && (
          <button
            onClick={() => onActiveer(versie.id)}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            Activeren
          </button>
        )}
      </div>

      {/* Groepen grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {versie.groepen.map((groep) => {
          const bandKleur = BAND_KLEUREN[groep.band] ?? "";
          const label = BAND_LABELS[groep.band] ?? groep.band;
          const isEditable = isConcept || isActief;

          return (
            <Link
              key={groep.id}
              href={
                isEditable
                  ? `/admin/raamwerk/${groep.band}`
                  : `/admin/raamwerk/${groep.band}?versieId=${versie.id}`
              }
              className="bg-surface-elevated group rounded-xl border border-white/5 p-4 transition-all hover:border-white/20"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${bandKleur}`}>
                  {label}
                </span>
                <span className="text-text-muted text-xs">{groep.aantalPijlers} pijlers</span>
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <span className="text-xl font-bold">{groep.kernItems}</span>
                  <span className="text-text-secondary ml-1 text-xs">
                    kern
                    {groep.kernItemsTarget ? ` / ${groep.kernItemsTarget}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary text-sm">{groep.totaalItems} totaal</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {versie.groepen.length === 0 && (
        <p className="text-text-muted text-sm">Geen leeftijdsgroepen. Dit raamwerk is leeg.</p>
      )}
    </div>
  );
}
