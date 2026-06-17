"use client";

import { Download, FileText, X } from "lucide-react";
import { useState, useTransition } from "react";
import { savePublicatieInstellingen } from "../publicatie-actions";
import type {
  PublicatieInstellingen,
  BelangrijkeDatumItem,
  KennismakingItem,
  TekstBlok,
} from "../preseason-pdf-data";

interface PublicatieToolbarProps {
  instellingen: PublicatieInstellingen;
}

const INPUT_STIJL = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff",
  borderRadius: 4,
  padding: "4px 8px",
  fontSize: 13,
} as const;

const VERWIJDER_STIJL = {
  color: "rgba(255,100,100,0.7)",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
  padding: "0 4px",
} as const;

const SECTIE_KOP_STIJL = {
  color: "rgba(255,165,0,0.8)",
  fontWeight: 700,
  fontSize: 12,
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  margin: "16px 0 8px",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  paddingBottom: 4,
};

function BlokkenEditor({
  label,
  blokken,
  onChange,
}: {
  label: string;
  blokken: TekstBlok[];
  onChange: (blokken: TekstBlok[]) => void;
}) {
  function updateBlok(id: string, field: "subtitle" | "tekst", value: string) {
    onChange(blokken.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  }

  function verwijderBlok(id: string) {
    onChange(blokken.filter((b) => b.id !== id));
  }

  function voegBlokToe() {
    onChange([...blokken, { id: Date.now().toString(), subtitle: "", tekst: "" }]);
  }

  return (
    <div>
      <div style={SECTIE_KOP_STIJL}>{label}</div>
      {blokken.map((blok, index) => (
        <div
          key={blok.id}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
              Blok {index + 1}
            </span>
            <button
              type="button"
              onClick={() => verwijderBlok(blok.id)}
              style={VERWIJDER_STIJL}
              aria-label="Verwijder blok"
            >
              ×
            </button>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>Subtitel</span>
            <input
              type="text"
              value={blok.subtitle}
              onChange={(e) => updateBlok(blok.id, "subtitle", e.target.value)}
              style={{ ...INPUT_STIJL, width: "100%" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)" }}>Tekst</span>
            <textarea
              value={blok.tekst}
              rows={4}
              onChange={(e) => updateBlok(blok.id, "tekst", e.target.value)}
              style={{
                ...INPUT_STIJL,
                width: "100%",
                resize: "vertical",
                lineHeight: 1.45,
                padding: "6px 8px",
              }}
            />
          </label>
        </div>
      ))}
      <button
        type="button"
        onClick={voegBlokToe}
        style={{ ...knopStijl("secondary"), fontSize: 12, minHeight: 28 }}
      >
        + Blok toevoegen
      </button>
    </div>
  );
}

export function PublicatieToolbar({ instellingen }: PublicatieToolbarProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(instellingen);
  const [belangData, setBelangData] = useState<BelangrijkeDatumItem[]>(
    instellingen.belangrijkeData
  );
  const [kennisData, setKennisData] = useState<KennismakingItem[]>(instellingen.kennismakingData);
  const [toelichtingBlokken, setToelichtingBlokken] = useState<TekstBlok[]>(
    instellingen.toelichtingBlokken
  );
  const [kalenderBlokken, setKalenderBlokken] = useState<TekstBlok[]>(instellingen.kalenderBlokken);
  const [kennismakingBlokken, setKennismakingBlokken] = useState<TekstBlok[]>(
    instellingen.kennismakingBlokken
  );
  const [tcOproepBlokken, setTcOproepBlokken] = useState<TekstBlok[]>(instellingen.tcOproepBlokken);
  const [vragenBlokken, setVragenBlokken] = useState<TekstBlok[]>(instellingen.vragenBlokken);
  const [melding, setMelding] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateVeld(key: keyof PublicatieInstellingen, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function opslaan() {
    setMelding(null);
    startTransition(async () => {
      const result = await savePublicatieInstellingen({
        ...form,
        toelichtingBlokken,
        kalenderBlokken,
        kennismakingBlokken,
        tcOproepBlokken,
        vragenBlokken,
        sectieVolgorde: form.sectieVolgorde,
        belangrijkeData: belangData,
        kennismakingData: kennisData,
      });
      if (!result.ok) {
        setMelding(result.error);
        return;
      }
      setForm(result.data);
      setBelangData(result.data.belangrijkeData);
      setKennisData(result.data.kennismakingData);
      setToelichtingBlokken(result.data.toelichtingBlokken);
      setKalenderBlokken(result.data.kalenderBlokken);
      setKennismakingBlokken(result.data.kennismakingBlokken);
      setTcOproepBlokken(result.data.tcOproepBlokken);
      setVragenBlokken(result.data.vragenBlokken);
      setMelding("Opgeslagen");
    });
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 20px",
          borderBottom: "1px solid var(--border-0)",
          background: "var(--bg-0)",
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 700 }}>
            Presentatieteksten
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {form.titel} - {form.seizoenLabel}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={() => setOpen(true)} style={knopStijl("secondary")}>
            <FileText size={15} />
            Presentatieteksten
          </button>
          <a href="/api/presentatie/preseason-pdf" style={knopStijl("primary")}>
            <Download size={15} />
            Download PDF
          </a>
        </div>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Presentatieteksten bewerken"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,.65)",
            padding: 24,
          }}
        >
          <div
            style={{
              width: "min(920px, 100%)",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              background: "var(--bg-1)",
              border: "1px solid var(--border-0)",
              borderRadius: 14,
              boxShadow: "0 24px 80px rgba(0,0,0,.55)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 18px",
                borderBottom: "1px solid var(--border-0)",
              }}
            >
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>
                  Presentatieteksten
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  Deze teksten komen in de pre-season publicatie.
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} style={icoonKnopStijl}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div
              style={{ overflow: "auto", padding: 18, display: "flex", flexDirection: "column" }}
            >
              {/* Sectie: Algemeen */}
              <div style={SECTIE_KOP_STIJL}>Algemeen</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 14,
                  marginBottom: 8,
                }}
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                    Titel
                  </span>
                  <input
                    type="text"
                    value={form.titel}
                    onChange={(e) => updateVeld("titel", e.target.value)}
                    style={{
                      ...INPUT_STIJL,
                      width: "100%",
                      minHeight: 36,
                      borderRadius: 10,
                      border: "1px solid var(--border-0)",
                      background: "var(--bg-0)",
                      color: "var(--text-1)",
                      padding: "8px 12px",
                    }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                    Seizoen
                  </span>
                  <input
                    type="text"
                    value={form.seizoenLabel}
                    onChange={(e) => updateVeld("seizoenLabel", e.target.value)}
                    style={{
                      ...INPUT_STIJL,
                      width: "100%",
                      minHeight: 36,
                      borderRadius: 10,
                      border: "1px solid var(--border-0)",
                      background: "var(--bg-0)",
                      color: "var(--text-1)",
                      padding: "8px 12px",
                    }}
                  />
                </label>
              </div>

              {/* Sectie: Toelichting */}
              <BlokkenEditor
                label="Toelichting"
                blokken={toelichtingBlokken}
                onChange={setToelichtingBlokken}
              />

              {/* Sectie: Kalender */}
              <BlokkenEditor
                label="Kalender"
                blokken={kalenderBlokken}
                onChange={setKalenderBlokken}
              />

              {/* Startdata & planning tabel — onder Kalender */}
              <div style={{ marginTop: 12 }}>
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 8 }}
                >
                  Startdata &amp; planning
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: 11,
                          color: "var(--text-3)",
                          paddingBottom: 6,
                          fontWeight: 600,
                          width: "35%",
                        }}
                      >
                        Datum
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          fontSize: 11,
                          color: "var(--text-3)",
                          paddingBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        Omschrijving
                      </th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {belangData.map((rij, i) => (
                      <tr key={i}>
                        <td style={{ paddingBottom: 6, paddingRight: 8 }}>
                          <input
                            type="text"
                            value={rij.datum}
                            onChange={(e) => {
                              const next = [...belangData];
                              next[i] = { ...next[i], datum: e.target.value };
                              setBelangData(next);
                            }}
                            style={{ ...INPUT_STIJL, width: "100%" }}
                          />
                        </td>
                        <td style={{ paddingBottom: 6, paddingRight: 8 }}>
                          <input
                            type="text"
                            value={rij.omschrijving}
                            onChange={(e) => {
                              const next = [...belangData];
                              next[i] = { ...next[i], omschrijving: e.target.value };
                              setBelangData(next);
                            }}
                            style={{ ...INPUT_STIJL, width: "100%" }}
                          />
                        </td>
                        <td style={{ paddingBottom: 6 }}>
                          <button
                            type="button"
                            onClick={() => setBelangData(belangData.filter((_, j) => j !== i))}
                            style={VERWIJDER_STIJL}
                            aria-label="Verwijder rij"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => setBelangData([...belangData, { datum: "", omschrijving: "" }])}
                  style={{ ...knopStijl("secondary"), fontSize: 12, minHeight: 28, marginTop: 4 }}
                >
                  + Datum toevoegen
                </button>
              </div>

              {/* Sectie: Kennismaking */}
              <BlokkenEditor
                label="Kennismaking"
                blokken={kennismakingBlokken}
                onChange={setKennismakingBlokken}
              />

              {/* Kennismakingstrainingen tabel — onder Kennismaking */}
              <div style={{ marginTop: 12 }}>
                <div
                  style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 8 }}
                >
                  Kennismakingstrainingen
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Team", "Datum", "Tijd", "Locatie", ""].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            textAlign: "left",
                            fontSize: 11,
                            color: "var(--text-3)",
                            paddingBottom: 6,
                            fontWeight: 600,
                            width: i === 4 ? 32 : undefined,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kennisData.map((rij, i) => (
                      <tr key={i}>
                        {(["teamnaam", "datum", "tijd", "locatie"] as const).map((field) => (
                          <td key={field} style={{ paddingBottom: 6, paddingRight: 8 }}>
                            <input
                              type="text"
                              value={rij[field]}
                              onChange={(e) => {
                                const next = [...kennisData];
                                next[i] = { ...next[i], [field]: e.target.value };
                                setKennisData(next);
                              }}
                              style={{ ...INPUT_STIJL, width: "100%" }}
                            />
                          </td>
                        ))}
                        <td style={{ paddingBottom: 6 }}>
                          <button
                            type="button"
                            onClick={() => setKennisData(kennisData.filter((_, j) => j !== i))}
                            style={VERWIJDER_STIJL}
                            aria-label="Verwijder rij"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() =>
                    setKennisData([
                      ...kennisData,
                      { teamnaam: "", datum: "", tijd: "", locatie: "" },
                    ])
                  }
                  style={{ ...knopStijl("secondary"), fontSize: 12, minHeight: 28, marginTop: 4 }}
                >
                  + Training toevoegen
                </button>
              </div>

              {/* Sectie: TC Oproep */}
              <BlokkenEditor
                label="TC Oproep"
                blokken={tcOproepBlokken}
                onChange={setTcOproepBlokken}
              />

              {/* Sectie: Vragen */}
              <BlokkenEditor label="Vragen" blokken={vragenBlokken} onChange={setVragenBlokken} />
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 18px",
                borderTop: "1px solid var(--border-0)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: melding === "Opgeslagen" ? "var(--success)" : "var(--text-3)",
                }}
              >
                {melding}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => setOpen(false)} style={knopStijl("secondary")}>
                  Sluiten
                </button>
                <button
                  type="button"
                  onClick={opslaan}
                  disabled={isPending}
                  style={knopStijl("primary")}
                >
                  {isPending ? "Opslaan..." : "Opslaan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function knopStijl(variant: "primary" | "secondary") {
  const primary = variant === "primary";
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 34,
    padding: "0 13px",
    borderRadius: 9,
    border: primary ? "1px solid var(--accent-h)" : "1px solid var(--border-0)",
    background: primary ? "var(--accent)" : "var(--bg-2)",
    color: primary ? "#ffffff" : "var(--text-2)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
  } as const;
}

const icoonKnopStijl = {
  width: 34,
  height: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 9,
  border: "1px solid var(--border-0)",
  background: "var(--bg-2)",
  color: "var(--text-2)",
  cursor: "pointer",
} as const;
