"use client";

import { useState, useCallback } from "react";
import type { LedenStatistieken, CategorieStats } from "@/app/blauwdruk/actions";
import { updateCategorieKaders } from "@/app/blauwdruk/actions";
import {
  CATEGORIEEN,
  CATEGORIE_DEFAULTS,
  getMergedSettings,
  PRIORITEIT_OPTIES,
  KORFHOOGTE_OPTIES,
  BALMAAT_OPTIES,
  VAKWISSEL_OPTIES,
  type CategorieDefinitie,
  type CategorieSettings,
  type CategorieKaders,
} from "@/app/blauwdruk/categorie-kaders";

// ============================================================
// Props
// ============================================================

interface CategoriePanelProps {
  statistieken: LedenStatistieken;
  kaders: CategorieKaders;
  blauwdrukId: string;
}

// ============================================================
// Kleur-mapping voor top-bar
// ============================================================

const KLEUR_ACCENT: Record<string, string> = {
  SENIOREN_A: "bg-gray-600",
  SENIOREN_B: "bg-gray-400",
  JEUGD_A: "bg-rose-600",
  ROOD: "bg-red-500",
  ORANJE: "bg-orange-500",
  GEEL: "bg-yellow-500",
  GROEN: "bg-green-500",
  BLAUW: "bg-blue-500",
  KANGOEROES: "bg-purple-400",
};

// ============================================================
// Mapping: categorie-sleutel → statistieken
// ============================================================

function getStats(statistieken: LedenStatistieken, sleutel: string): CategorieStats | null {
  // B-kleuren zitten in perCategorie
  const kleurMatch = statistieken.perCategorie.find((c) => c.kleur === sleutel);
  if (kleurMatch) return kleurMatch;

  // Senioren
  if (sleutel === "SENIOREN_A" || sleutel === "SENIOREN_B") {
    return {
      kleur: sleutel,
      label: sleutel === "SENIOREN_A" ? "Senioren A" : "Senioren B",
      ...statistieken.senioren,
      streefPerTeam: sleutel === "SENIOREN_A" ? 10 : 10,
      minTeams: 0,
      maxTeams: 0,
    };
  }

  // Jeugd A deelt spelerspool met Rood + Oranje (13-18 jaar)
  if (sleutel === "JEUGD_A") {
    const rood = statistieken.perCategorie.find((c) => c.kleur === "ROOD");
    const oranje = statistieken.perCategorie.find((c) => c.kleur === "ORANJE");
    if (rood || oranje) {
      return {
        kleur: "JEUGD_A",
        label: "Jeugd A (U-teams)",
        totaal: (rood?.totaal ?? 0) + (oranje?.totaal ?? 0),
        beschikbaar: (rood?.beschikbaar ?? 0) + (oranje?.beschikbaar ?? 0),
        twijfelt: (rood?.twijfelt ?? 0) + (oranje?.twijfelt ?? 0),
        gaatStoppen: (rood?.gaatStoppen ?? 0) + (oranje?.gaatStoppen ?? 0),
        nieuwPotentieel: (rood?.nieuwPotentieel ?? 0) + (oranje?.nieuwPotentieel ?? 0),
        nieuwDefinitief: (rood?.nieuwDefinitief ?? 0) + (oranje?.nieuwDefinitief ?? 0),
        mannen: (rood?.mannen ?? 0) + (oranje?.mannen ?? 0),
        vrouwen: (rood?.vrouwen ?? 0) + (oranje?.vrouwen ?? 0),
        streefPerTeam: 10,
        minTeams: 0,
        maxTeams: 0,
      };
    }
  }

  return null;
}

// ============================================================
// Hoofdcomponent
// ============================================================

export default function CategoriePanel({
  statistieken,
  kaders: initieleKaders,
  blauwdrukId,
}: CategoriePanelProps) {
  const [kaders, setKaders] = useState<CategorieKaders>(initieleKaders);
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const handleSave = useCallback(
    async (categorie: string, settings: Partial<CategorieSettings>) => {
      setKaders((prev) => ({
        ...prev,
        [categorie]: { ...prev[categorie], ...settings },
      }));
      // Server-side opslaan via queueMicrotask (non-blocking)
      queueMicrotask(() => {
        updateCategorieKaders(blauwdrukId, categorie, settings);
      });
    },
    [blauwdrukId]
  );

  return (
    <div className="space-y-4">
      {/* Categorie-kaarten grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CATEGORIEEN.map((cat) => {
          const stats = getStats(statistieken, cat.sleutel);
          const settings = getMergedSettings(cat.sleutel, kaders);
          return (
            <CategorieKaart
              key={cat.sleutel}
              definitie={cat}
              stats={stats}
              settings={settings}
              onOpenSettings={() => setOpenDialog(cat.sleutel)}
            />
          );
        })}
      </div>

      {/* Settings Dialog */}
      {openDialog && (
        <SettingsDialog
          sleutel={openDialog}
          settings={getMergedSettings(openDialog, kaders)}
          onSave={(s) => handleSave(openDialog, s)}
          onClose={() => setOpenDialog(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// CategorieKaart
// ============================================================

interface CategorieKaartProps {
  definitie: CategorieDefinitie;
  stats: CategorieStats | null;
  settings: CategorieSettings;
  onOpenSettings: () => void;
}

function CategorieKaart({ definitie, stats, settings, onOpenSettings }: CategorieKaartProps) {
  const maxSpelers = Math.ceil(
    settings.optimaalSpelers * (1 + settings.maxAfwijkingPercentage / 100)
  );

  return (
    <div className="card overflow-hidden">
      {/* Gekleurde top-bar */}
      <div className={`h-1.5 ${KLEUR_ACCENT[definitie.sleutel] ?? "bg-gray-500"}`} />
      <div className="card-body space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">{definitie.label}</h3>
            <p className="text-xs text-gray-500">
              {definitie.leeftijdRange} · {definitie.spelvorm}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats && <span className="text-lg font-bold text-gray-700">{stats.totaal}</span>}
            <button
              onClick={onOpenSettings}
              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Instellingen"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Leden-blok */}
        {stats && (
          <div className="flex flex-wrap gap-1.5">
            <span className="badge-green">{stats.beschikbaar} beschikbaar</span>
            {stats.twijfelt > 0 && <span className="badge-orange">{stats.twijfelt} twijfelt</span>}
            {stats.gaatStoppen > 0 && <span className="badge-red">{stats.gaatStoppen} stopt</span>}
            {stats.nieuwPotentieel > 0 && (
              <span className="badge-blue">{stats.nieuwPotentieel} potentieel</span>
            )}
            {stats.nieuwDefinitief > 0 && (
              <span className="badge-blue">{stats.nieuwDefinitief} definitief</span>
            )}
          </div>
        )}

        {/* Gender + teams */}
        {stats && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {stats.mannen}♂ {stats.vrouwen}♀
            </span>
            {stats.minTeams > 0 && (
              <span>
                {stats.minTeams === stats.maxTeams
                  ? `${stats.minTeams} team${stats.minTeams !== 1 ? "s" : ""}`
                  : `${stats.minTeams}–${stats.maxTeams} teams`}{" "}
                mogelijk
              </span>
            )}
          </div>
        )}

        {/* Key-stats als chips */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {(settings.minSpelers > 0 || settings.optimaalSpelers > 0) && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              {settings.minSpelers}–{maxSpelers} spelers
            </span>
          )}
          {settings.gemiddeldeLeeftijdKernMin != null &&
            settings.gemiddeldeLeeftijdKernMax != null && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-blue-700">
                kern {settings.gemiddeldeLeeftijdKernMin}–{settings.gemiddeldeLeeftijdKernMax}
              </span>
            )}
          {settings.gemiddeldeLeeftijdOverlapMin != null &&
            settings.gemiddeldeLeeftijdOverlapMax != null &&
            (settings.gemiddeldeLeeftijdOverlapMin !== settings.gemiddeldeLeeftijdKernMin ||
              settings.gemiddeldeLeeftijdOverlapMax !== settings.gemiddeldeLeeftijdKernMax) && (
              <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-500">
                overlap {settings.gemiddeldeLeeftijdOverlapMin}–
                {settings.gemiddeldeLeeftijdOverlapMax}
              </span>
            )}
          {settings.scoreDrempel != null && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              score &lt;{settings.scoreDrempel}
            </span>
          )}
          {settings.bandbreedteLeeftijd != null && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              max {settings.bandbreedteLeeftijd} jr spreiding
            </span>
          )}
          {settings.maxLeeftijd != null && (
            <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-gray-600">
              max {settings.maxLeeftijd} jr
            </span>
          )}
          {settings.prioriteiten.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-orange-700">
              {settings.prioriteiten.join(" · ")}
            </span>
          )}
        </div>

        {/* Spelvorm footer (niet voor Kangoeroes) */}
        {definitie.type !== "kangoeroes" && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-gray-100 pt-2 text-xs text-gray-400">
            <span>Paal {settings.korfhoogte}m</span>
            <span>Bal {settings.balMaat}</span>
            <span>
              Wissels {settings.wisselsAantal == null ? "onbeperkt" : settings.wisselsAantal}
            </span>
            {settings.vakwisselType !== "nvt" && (
              <span>
                Vakwissel {settings.vakwisselType === "doelpunten" ? "na 2 goals" : "op tijd"}
              </span>
            )}
            <span>{settings.speeltijdMinuten > 0 ? `2×${settings.speeltijdMinuten}m` : "–"}</span>
          </div>
        )}
        {definitie.type === "kangoeroes" && (
          <div className="border-t border-gray-100 pt-2 text-xs text-gray-400 italic">
            Geen competitie — spelenderwijs kennismaken
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SettingsDialog
// ============================================================

interface SettingsDialogProps {
  sleutel: string;
  settings: CategorieSettings;
  onSave: (settings: Partial<CategorieSettings>) => void;
  onClose: () => void;
}

function SettingsDialog({ sleutel, settings, onSave, onClose }: SettingsDialogProps) {
  const [form, setForm] = useState<CategorieSettings>({ ...settings });
  const definitie = CATEGORIEEN.find((c) => c.sleutel === sleutel)!;

  function update<K extends keyof CategorieSettings>(key: K, value: CategorieSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    // Bereken welke velden afwijken van de defaults
    const defaults = CATEGORIE_DEFAULTS[sleutel];
    const diff: Partial<CategorieSettings> = {};
    for (const key of Object.keys(form) as (keyof CategorieSettings)[]) {
      const fVal = form[key];
      const dVal = defaults[key];
      if (JSON.stringify(fVal) !== JSON.stringify(dVal)) {
        (diff as Record<string, unknown>)[key] = fVal;
      }
    }
    onSave(Object.keys(diff).length > 0 ? diff : {});
    onClose();
  }

  function handleReset() {
    setForm({ ...CATEGORIE_DEFAULTS[sleutel] });
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-panel flex max-h-[85vh] w-full max-w-lg flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="dialog-header flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {definitie.label} — Instellingen
            </h3>
            <p className="text-sm text-gray-500">
              {definitie.leeftijdRange} · {definitie.spelvorm}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="dialog-body space-y-5 overflow-y-auto">
          {/* Teamsamenstelling */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">Teamsamenstelling</legend>
            <div className="grid grid-cols-3 gap-3">
              <NumberField
                label="Min. spelers *"
                value={form.minSpelers}
                onChange={(v) => update("minSpelers", v ?? 0)}
              />
              <NumberField
                label="Optimaal *"
                value={form.optimaalSpelers}
                onChange={(v) => update("optimaalSpelers", v ?? 0)}
              />
              <NumberField
                label="Max afwijking %"
                value={form.maxAfwijkingPercentage}
                onChange={(v) => update("maxAfwijkingPercentage", v ?? 20)}
              />
            </div>
          </fieldset>

          {/* Gender */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">Gender</legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Verplicht min. V"
                value={form.verplichtMinV}
                onChange={(v) => update("verplichtMinV", v ?? 0)}
              />
              <NumberField
                label="Verplicht min. M"
                value={form.verplichtMinM}
                onChange={(v) => update("verplichtMinM", v ?? 0)}
              />
              <NumberField
                label="Gewenst min. V"
                value={form.gewenstMinV}
                onChange={(v) => update("gewenstMinV", v ?? 0)}
              />
              <NumberField
                label="Gewenst min. M"
                value={form.gewenstMinM}
                onChange={(v) => update("gewenstMinM", v ?? 0)}
              />
            </div>
            <ToggleField
              label="Monogender toestaan"
              value={form.monogenderToestaan}
              onChange={(v) => update("monogenderToestaan", v)}
            />
          </fieldset>

          {/* Leeftijdsgrenzen — Kern */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">
              Leeftijdsgrenzen — Kern (ideaal)
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Kern van"
                value={form.gemiddeldeLeeftijdKernMin}
                onChange={(v) => update("gemiddeldeLeeftijdKernMin", v)}
                step={0.1}
                nullable
              />
              <NumberField
                label="Kern tot"
                value={form.gemiddeldeLeeftijdKernMax}
                onChange={(v) => update("gemiddeldeLeeftijdKernMax", v)}
                step={0.1}
                nullable
              />
            </div>
          </fieldset>

          {/* Leeftijdsgrenzen — Overlap */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">
              Leeftijdsgrenzen — Overlap (KNKV acceptabel)
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Overlap van"
                value={form.gemiddeldeLeeftijdOverlapMin}
                onChange={(v) => update("gemiddeldeLeeftijdOverlapMin", v)}
                step={0.1}
                nullable
              />
              <NumberField
                label="Overlap tot"
                value={form.gemiddeldeLeeftijdOverlapMax}
                onChange={(v) => update("gemiddeldeLeeftijdOverlapMax", v)}
                step={0.1}
                nullable
              />
              <NumberField
                label="Max korfballeeftijd"
                value={form.maxLeeftijd}
                onChange={(v) => update("maxLeeftijd", v)}
                step={0.01}
                nullable
              />
              <NumberField
                label="Max spreiding"
                value={form.bandbreedteLeeftijd}
                onChange={(v) => update("bandbreedteLeeftijd", v)}
                step={0.1}
                nullable
              />
            </div>
          </fieldset>

          {/* KNKV Score-drempel */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">KNKV Score-drempel</legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Score-drempel"
                value={form.scoreDrempel}
                onChange={(v) => update("scoreDrempel", v)}
                nullable
              />
              <div className="flex items-end pb-1">
                <span className="text-xs text-gray-400">
                  Punten die bepalen of team in deze kleur valt
                </span>
              </div>
            </div>
          </fieldset>

          {/* Speeltijd */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">Speeltijd</legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Minuten *"
                value={form.speeltijdMinuten}
                onChange={(v) => update("speeltijdMinuten", v ?? 0)}
              />
              <div>
                <ToggleField
                  label="Zuivere speeltijd"
                  value={form.speeltijdZuiver}
                  onChange={(v) => update("speeltijdZuiver", v)}
                />
              </div>
            </div>
          </fieldset>

          {/* Spelvorm */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">Spelvorm</legend>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Korfhoogte (m) *"
                value={String(form.korfhoogte)}
                options={KORFHOOGTE_OPTIES.map((v) => ({
                  value: String(v),
                  label: `${v} m`,
                }))}
                onChange={(v) => update("korfhoogte", parseFloat(v))}
              />
              <SelectField
                label="Balmaat *"
                value={String(form.balMaat)}
                options={BALMAAT_OPTIES.map((v) => ({
                  value: String(v),
                  label: `Maat ${v}`,
                }))}
                onChange={(v) => update("balMaat", parseInt(v))}
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Spelerswissels
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input w-20"
                    value={form.wisselsAantal ?? ""}
                    placeholder="∞"
                    min={0}
                    onChange={(e) =>
                      update(
                        "wisselsAantal",
                        e.target.value === "" ? null : parseInt(e.target.value)
                      )
                    }
                  />
                  <span className="text-xs text-gray-500">leeg = onbeperkt</span>
                </div>
              </div>
              <SelectField
                label="Vakwissel"
                value={form.vakwisselType}
                options={VAKWISSEL_OPTIES.map((v) => ({
                  value: v.value,
                  label: v.label,
                }))}
                onChange={(v) => update("vakwisselType", v as CategorieSettings["vakwisselType"])}
              />
            </div>
          </fieldset>

          {/* Prioriteit */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">
              Prioriteiten (max 3)
            </legend>
            <div className="flex flex-wrap gap-2">
              {PRIORITEIT_OPTIES.map((optie) => {
                const selected = form.prioriteiten.includes(optie);
                return (
                  <button
                    key={optie}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        update(
                          "prioriteiten",
                          form.prioriteiten.filter((p) => p !== optie)
                        );
                      } else if (form.prioriteiten.length < 3) {
                        update("prioriteiten", [...form.prioriteiten, optie]);
                      }
                    }}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selected
                        ? "border-orange-300 bg-orange-100 text-orange-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                    } ${!selected && form.prioriteiten.length >= 3 ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {optie}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="dialog-footer">
          <button onClick={handleReset} className="btn-ghost text-xs">
            Herstel defaults
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="btn-secondary btn-sm">
            Annuleren
          </button>
          <button onClick={handleSave} className="btn-primary btn-sm">
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Form-helpers
// ============================================================

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  nullable = false,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  nullable?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <input
        type="number"
        className="input"
        value={value ?? ""}
        placeholder={nullable ? "–" : "0"}
        step={step}
        min={0}
        onChange={(e) => {
          if (e.target.value === "" && nullable) {
            onChange(null);
          } else {
            const parsed = step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value);
            if (!isNaN(parsed)) onChange(parsed);
          }
        }}
      />
    </div>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="mt-2 flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${
          value ? "bg-orange-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-xs text-gray-600">{label}</span>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
