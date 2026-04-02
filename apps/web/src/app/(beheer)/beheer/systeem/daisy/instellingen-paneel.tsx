"use client";

import { useState, useTransition, type FormEvent } from "react";
import { logger } from "@oranje-wit/types";
import {
  AI_PROVIDERS,
  CLAUDE_MODELLEN,
  GEMINI_MODELLEN,
  MAX_TOKENS_MIN,
  MAX_TOKENS_MAX,
  MAX_TOKENS_STEP,
  type AiProviderSleutel,
} from "./ai-providers";
import { slaInstellingenOp, type DaisyInstellingenData } from "./actions";

// ─── Types ──────────────────────────────────────────────────────

interface InstellingenPaneelProps {
  initieel: DaisyInstellingenData;
  claudeKeyAanwezig: boolean;
  geminiKeyAanwezig: boolean;
}

// ─── Component ──────────────────────────────────────────────────

export function InstellingenPaneel({
  initieel,
  claudeKeyAanwezig,
  geminiKeyAanwezig,
}: InstellingenPaneelProps) {
  const [provider, setProvider] = useState<AiProviderSleutel>(initieel.provider);
  const [claudeModel, setClaudeModel] = useState(initieel.claudeModel);
  const [geminiModel, setGeminiModel] = useState(initieel.geminiModel);
  const [maxTokens, setMaxTokens] = useState(initieel.maxTokens);
  const [melding, setMelding] = useState<{ type: "succes" | "fout"; tekst: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const keyAanwezig = (sleutel: AiProviderSleutel) => {
    if (sleutel === "claude") return claudeKeyAanwezig;
    if (sleutel === "gemini") return geminiKeyAanwezig;
    return true; // auto
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMelding(null);

    startTransition(async () => {
      try {
        const result = await slaInstellingenOp({ provider, claudeModel, geminiModel, maxTokens });
        if (result.ok) {
          setMelding({ type: "succes", tekst: "Instellingen opgeslagen." });
        } else {
          setMelding({ type: "fout", tekst: result.error ?? "Opslaan mislukt." });
        }
      } catch (error) {
        logger.error("Fout bij opslaan instellingen:", error);
        setMelding({ type: "fout", tekst: "Onverwachte fout bij opslaan." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Provider kaart ── */}
      <div className="card mb-4">
        <div className="card-header">
          <span>AI Provider</span>
        </div>
        <div className="card-body space-y-4">
          {/* Segmented control */}
          <div
            className="flex gap-1 rounded-lg p-1"
            style={{ backgroundColor: "var(--surface-sunken)" }}
          >
            {AI_PROVIDERS.map((opt) => {
              const actief = provider === opt.sleutel;
              const heeftKey = keyAanwezig(opt.sleutel);
              const uitgeschakeld = opt.sleutel !== "auto" && !heeftKey;

              return (
                <button
                  key={opt.sleutel}
                  type="button"
                  onClick={() => !uitgeschakeld && setProvider(opt.sleutel)}
                  className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: actief ? "var(--surface-raised)" : "transparent",
                    color: actief ? "var(--text-primary)" : "var(--text-tertiary)",
                    boxShadow: actief ? "var(--shadow-sm)" : "none",
                    opacity: uitgeschakeld ? 0.35 : 1,
                    cursor: uitgeschakeld ? "not-allowed" : "pointer",
                  }}
                  title={uitgeschakeld ? `${opt.envVar} ontbreekt` : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Model dropdown — Claude */}
          {(provider === "claude" || provider === "auto") && (
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Claude model
              </label>
              <select
                className="input w-full"
                value={claudeModel}
                onChange={(e) => setClaudeModel(e.target.value)}
                disabled={!claudeKeyAanwezig}
              >
                {CLAUDE_MODELLEN.map((m) => (
                  <option key={m.waarde} value={m.waarde}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Model dropdown — Gemini */}
          {(provider === "gemini" || provider === "auto") && (
            <div>
              <label
                className="mb-1 block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Gemini model
              </label>
              <select
                className="input w-full"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                disabled={!geminiKeyAanwezig}
              >
                {GEMINI_MODELLEN.map((m) => (
                  <option key={m.waarde} value={m.waarde}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Max tokens kaart ── */}
      <div className="card mb-4">
        <div className="card-header flex items-center justify-between">
          <span>Maximaal tokens</span>
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {maxTokens}
          </span>
        </div>
        <div className="card-body">
          <input
            type="range"
            min={MAX_TOKENS_MIN}
            max={MAX_TOKENS_MAX}
            step={MAX_TOKENS_STEP}
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--ow-oranje-500)" }}
          />
          <div className="mt-1 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
            <span>{MAX_TOKENS_MIN}</span>
            <span>{MAX_TOKENS_MAX}</span>
          </div>
        </div>
      </div>

      {/* ── Anthropic account ── */}
      <div
        className="mb-4 rounded-xl p-4"
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h3 className="mb-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Anthropic account
        </h3>
        {claudeKeyAanwezig ? (
          <>
            <p className="mb-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Controleer verbruik en resterend tegoed in de Anthropic Console.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="https://console.anthropic.com/settings/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: "var(--surface-raised)",
                  color: "var(--text-primary)",
                }}
              >
                <span>Tegoed en gebruik</span>
                <span style={{ color: "var(--text-muted)" }}>↗</span>
              </a>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: "var(--surface-raised)",
                  color: "var(--text-primary)",
                }}
              >
                <span>API keys beheren</span>
                <span style={{ color: "var(--text-muted)" }}>↗</span>
              </a>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Stel een Anthropic API key in om Daisy te activeren.
            </p>
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
              style={{
                backgroundColor: "var(--surface-raised)",
                color: "var(--text-primary)",
              }}
            >
              <span>API key aanmaken</span>
              <span style={{ color: "var(--text-muted)" }}>↗</span>
            </a>
          </>
        )}
      </div>

      {/* ── Melding ── */}
      {melding && (
        <div
          className="mb-4 rounded-lg px-3 py-2 text-sm"
          style={{
            backgroundColor:
              melding.type === "succes" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            color: melding.type === "succes" ? "var(--semantic-success)" : "var(--semantic-error)",
            border: `1px solid ${melding.type === "succes" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          {melding.tekst}
        </div>
      )}

      {/* ── Opslaan knop ── */}
      <button type="submit" className="btn btn-primary" disabled={isPending}>
        {isPending ? "Opslaan..." : "Opslaan"}
      </button>
    </form>
  );
}
