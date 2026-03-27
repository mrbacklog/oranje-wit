"use client";

import { useState } from "react";
import {
  CATEGORIEEN,
  CATEGORIE_DEFAULTS,
  PRIORITEIT_OPTIES,
  KORFHOOGTE_OPTIES,
  BALMAAT_OPTIES,
  VAKWISSEL_OPTIES,
  type CategorieSettings,
} from "@/app/blauwdruk/categorie-kaders";
import { NumberField, ToggleField, SelectField } from "./categorie-form-fields";

// ============================================================
// SettingsDialog
// ============================================================

interface SettingsDialogProps {
  sleutel: string;
  settings: CategorieSettings;
  onSave: (settings: Partial<CategorieSettings>) => void;
  onClose: () => void;
}

export function SettingsDialog({ sleutel, settings, onSave, onClose }: SettingsDialogProps) {
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

          {/* KNKV Promotie-grens */}
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-gray-700">
              KNKV Promotie-grens
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Promotie-grens"
                value={form.scorePromotieGrens}
                onChange={(v) => update("scorePromotieGrens", v)}
                nullable
              />
              <div className="flex items-end pb-1">
                <span className="text-xs text-gray-400">
                  Score waarboven team doorstroomt naar hogere kleur
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
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
