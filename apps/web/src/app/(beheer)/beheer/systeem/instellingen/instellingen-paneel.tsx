"use client";

import { useState, useTransition } from "react";
import { saveInstelling, testAiKey } from "./actions";
import type { AiProvider } from "./ai-providers";

interface Props {
  providers: AiProvider[];
  instellingen: Array<{
    sleutel: string;
    waarde: string;
    geheim: boolean;
    updatedBy: string | null;
    updatedAt: Date;
  }>;
}

export function InstellingenPaneel({ providers, instellingen }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {providers.map((provider) => {
        const huidige = instellingen.find((i) => i.sleutel === provider.sleutel);
        return (
          <ProviderKaart
            key={provider.sleutel}
            provider={provider}
            huidigeWaarde={huidige?.waarde}
            updatedBy={huidige?.updatedBy}
          />
        );
      })}
    </div>
  );
}

function ProviderKaart({
  provider,
  huidigeWaarde,
  updatedBy,
}: {
  provider: AiProvider;
  huidigeWaarde?: string;
  updatedBy?: string | null;
}) {
  const [waarde, setWaarde] = useState("");
  const [testResultaat, setTestResultaat] = useState<{
    ok: boolean;
    tekst: string;
  } | null>(null);
  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();

  function handleSave() {
    if (!waarde.trim()) return;
    startSave(async () => {
      const result = await saveInstelling(provider.sleutel, waarde.trim());
      if (result.ok) {
        setWaarde("");
        setTestResultaat(null);
      } else {
        setTestResultaat({ ok: false, tekst: result.error });
      }
    });
  }

  function handleTest() {
    startTest(async () => {
      setTestResultaat(null);
      const result = await testAiKey(provider.sleutel);
      if (result.ok) {
        setTestResultaat({
          ok: true,
          tekst: `${result.data.model}: "${result.data.antwoord}"`,
        });
      } else {
        setTestResultaat({ ok: false, tekst: result.error });
      }
    });
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: "var(--surface-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {provider.label}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {huidigeWaarde ? (
              <>
                Opgeslagen: {huidigeWaarde}
                {updatedBy && <span className="ml-1 opacity-60">({updatedBy})</span>}
              </>
            ) : (
              "Nog niet ingesteld"
            )}
          </p>
        </div>
        <a
          href={provider.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline"
          style={{ color: "var(--ow-oranje-500)" }}
        >
          Key aanmaken
        </a>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="password"
          value={waarde}
          onChange={(e) => setWaarde(e.target.value)}
          placeholder={provider.placeholder}
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--surface-sunken)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
          }}
        />
        <button
          onClick={handleSave}
          disabled={!waarde.trim() || isSaving}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-30"
          style={{ backgroundColor: "var(--ow-oranje-500)", color: "white" }}
        >
          {isSaving ? "..." : "Opslaan"}
        </button>
      </div>

      {/* Test knop */}
      {huidigeWaarde && (
        <div className="mt-3">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--surface-raised)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-default)",
            }}
          >
            {isTesting ? "Testen..." : "Test verbinding"}
          </button>

          {testResultaat && (
            <div
              className="mt-2 rounded-lg px-3 py-2 text-xs"
              style={{
                backgroundColor: "var(--surface-raised)",
                color: testResultaat.ok ? "#22c55e" : "#ef4444",
              }}
            >
              {testResultaat.ok ? "✓ " : "✗ "}
              {testResultaat.tekst}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
