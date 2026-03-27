"use client";

import type { ScoutingGroepConfigV3 } from "@/lib/scouting/vragen";

type GroeiIndicator = "geen" | "weinig" | "normaal" | "veel";

const GROEI_OPTIES: { value: GroeiIndicator; label: string }[] = [
  { value: "geen", label: "Geen groei" },
  { value: "weinig", label: "Weinig groei" },
  { value: "normaal", label: "Normaal" },
  { value: "veel", label: "Veel groei" },
];

export function StapExtraVelden({
  groeiIndicator,
  onGroeiChange,
  socialeVeiligheid,
  onSocialeVeiligheidChange,
  config,
  fysiekProfiel,
  onFysiekProfielChange,
  veldZaal,
  onVeldZaalChange,
}: {
  groeiIndicator: GroeiIndicator;
  onGroeiChange: (v: GroeiIndicator) => void;
  socialeVeiligheid: number | boolean | null;
  onSocialeVeiligheidChange: (v: number | boolean | null) => void;
  config: ScoutingGroepConfigV3;
  fysiekProfiel: { lengte: string; lichaamsbouw: string; atletisch: string };
  onFysiekProfielChange: (v: { lengte: string; lichaamsbouw: string; atletisch: string }) => void;
  veldZaal: "veld" | "zaal";
  onVeldZaalChange: (v: "veld" | "zaal") => void;
}) {
  return (
    <div className="flex animate-[fadeIn_300ms_ease] flex-col gap-6">
      <h2 className="text-xl font-bold">Extra observaties</h2>

      {/* Veld/Zaal context */}
      <div>
        <label className="text-text-secondary mb-2 block text-sm font-medium">Context</label>
        <div className="flex gap-2">
          {(["veld", "zaal"] as const).map((optie) => (
            <button
              key={optie}
              type="button"
              onClick={() => onVeldZaalChange(optie)}
              className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold capitalize transition-all ${
                veldZaal === optie
                  ? "border-ow-oranje bg-ow-oranje/10 text-ow-oranje"
                  : "bg-surface-card text-text-secondary border-white/10"
              }`}
            >
              {optie}
            </button>
          ))}
        </div>
      </div>

      {/* Groei-indicator */}
      <div>
        <label className="text-text-secondary mb-2 block text-sm font-medium">
          Groei-indicator
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GROEI_OPTIES.map((optie) => (
            <button
              key={optie.value}
              type="button"
              onClick={() => onGroeiChange(optie.value)}
              className={`rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                groeiIndicator === optie.value
                  ? "border-ow-oranje bg-ow-oranje/10 text-ow-oranje"
                  : "bg-surface-card text-text-secondary border-white/10"
              }`}
            >
              {optie.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sociale veiligheid */}
      {config.heeftSignaalvlag && (
        <SocialeVeiligheidVeld
          config={config}
          socialeVeiligheid={socialeVeiligheid}
          onSocialeVeiligheidChange={onSocialeVeiligheidChange}
        />
      )}

      {/* Fysiek profiel (vanaf Geel) */}
      {config.heeftFysiekProfiel && (
        <FysiekProfielVeld
          fysiekProfiel={fysiekProfiel}
          onFysiekProfielChange={onFysiekProfielChange}
        />
      )}
    </div>
  );
}

// ── Sociale veiligheid sub-component ──

function SocialeVeiligheidVeld({
  config,
  socialeVeiligheid,
  onSocialeVeiligheidChange,
}: {
  config: ScoutingGroepConfigV3;
  socialeVeiligheid: number | boolean | null;
  onSocialeVeiligheidChange: (v: number | boolean | null) => void;
}) {
  return (
    <div>
      <label className="text-text-secondary mb-2 block text-sm font-medium">
        Sociale veiligheid
      </label>
      {config.signaalvlagType === "ja_nee" ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSocialeVeiligheidChange(true)}
            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
              socialeVeiligheid === true
                ? "border-green-500 bg-green-500/10 text-green-400"
                : "bg-surface-card text-text-secondary border-white/10"
            }`}
          >
            Ja, veilig
          </button>
          <button
            type="button"
            onClick={() => onSocialeVeiligheidChange(false)}
            className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${
              socialeVeiligheid === false
                ? "border-red-500 bg-red-500/10 text-red-400"
                : "bg-surface-card text-text-secondary border-white/10"
            }`}
          >
            Nee, signaal
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={config.band === "geel" ? 5 : 10}
            value={(socialeVeiligheid as number) ?? (config.band === "geel" ? 3 : 5)}
            onChange={(e) => onSocialeVeiligheidChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-ow-oranje w-8 text-center text-lg font-bold">
            {(socialeVeiligheid as number) ?? "-"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Fysiek profiel sub-component ──

function FysiekProfielVeld({
  fysiekProfiel,
  onFysiekProfielChange,
}: {
  fysiekProfiel: { lengte: string; lichaamsbouw: string; atletisch: string };
  onFysiekProfielChange: (v: { lengte: string; lichaamsbouw: string; atletisch: string }) => void;
}) {
  return (
    <div className="bg-surface-card rounded-2xl border border-white/10 p-4">
      <h3 className="mb-3 text-sm font-bold">Fysiek profiel</h3>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-text-muted mb-1 block text-xs">Lengte (relatief)</label>
          <select
            value={fysiekProfiel.lengte}
            onChange={(e) => onFysiekProfielChange({ ...fysiekProfiel, lengte: e.target.value })}
            className="bg-surface-elevated text-text-primary w-full rounded-lg border border-white/10 px-3 py-2 text-sm"
          >
            <option value="">Selecteer...</option>
            <option value="onder_gemiddeld">Onder gemiddeld</option>
            <option value="gemiddeld">Gemiddeld</option>
            <option value="bovengemiddeld">Bovengemiddeld</option>
            <option value="uitzonderlijk">Uitzonderlijk</option>
          </select>
        </div>
        <div>
          <label className="text-text-muted mb-1 block text-xs">Lichaamsbouw</label>
          <select
            value={fysiekProfiel.lichaamsbouw}
            onChange={(e) =>
              onFysiekProfielChange({ ...fysiekProfiel, lichaamsbouw: e.target.value })
            }
            className="bg-surface-elevated text-text-primary w-full rounded-lg border border-white/10 px-3 py-2 text-sm"
          >
            <option value="">Selecteer...</option>
            <option value="licht">Licht</option>
            <option value="gemiddeld">Gemiddeld</option>
            <option value="stevig">Stevig</option>
          </select>
        </div>
        <div>
          <label className="text-text-muted mb-1 block text-xs">Atletisch type</label>
          <select
            value={fysiekProfiel.atletisch}
            onChange={(e) => onFysiekProfielChange({ ...fysiekProfiel, atletisch: e.target.value })}
            className="bg-surface-elevated text-text-primary w-full rounded-lg border border-white/10 px-3 py-2 text-sm"
          >
            <option value="">Selecteer...</option>
            <option value="onder_gemiddeld">Onder gemiddeld</option>
            <option value="gemiddeld">Gemiddeld</option>
            <option value="bovengemiddeld">Bovengemiddeld</option>
            <option value="uitzonderlijk">Uitzonderlijk</option>
          </select>
        </div>
      </div>
    </div>
  );
}
