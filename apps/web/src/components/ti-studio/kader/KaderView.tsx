"use client";
import { useState } from "react";
import { logger } from "@oranje-wit/types";
import { slaTeamtypeKadersOp } from "@/app/(teamindeling-studio)/ti-studio/kader/actions";
import {
  type TcKader,
  TC_DEFAULTS,
  mergeMetDefaults,
} from "@/app/(teamindeling-studio)/ti-studio/kader/kader-defaults";

// ---------------------------------------------------------------------------
// Teamtype data
// ---------------------------------------------------------------------------

const TEAMTYPES = [
  {
    id: "SEN_A",
    label: "Senioren A",
    categorie: "Senioren",
    kleurCss: "#888",
    leeftijdRange: "19+ jaar",
    spelvorm: "8-tal",
    doelgroep: "Wedstrijdsport",
  },
  {
    id: "SEN_B",
    label: "Senioren B",
    categorie: "Senioren",
    kleurCss: "#666",
    leeftijdRange: "19+ jaar",
    spelvorm: "8-tal",
    doelgroep: "Korfbalplezier",
  },
  {
    id: "U19",
    label: "U19",
    categorie: "A-categorie",
    kleurCss: "#8b5cf6",
    leeftijdRange: "< 19 jaar",
    spelvorm: "8-tal",
    doelgroep: "Topsport",
  },
  {
    id: "U17",
    label: "U17",
    categorie: "A-categorie",
    kleurCss: "#8b5cf6",
    leeftijdRange: "< 17 jaar",
    spelvorm: "8-tal",
    doelgroep: "Topsport",
  },
  {
    id: "U15",
    label: "U15",
    categorie: "A-categorie",
    kleurCss: "#8b5cf6",
    leeftijdRange: "< 15 jaar",
    spelvorm: "8-tal",
    doelgroep: "Topsport",
  },
  {
    id: "ROOD",
    label: "Rood",
    categorie: "B-8-tal",
    kleurCss: "#ef4444",
    leeftijdRange: "13–19 jaar",
    spelvorm: "8-tal",
    doelgroep: "Korfbalplezier",
  },
  {
    id: "ORANJE",
    label: "Oranje",
    categorie: "B-8-tal",
    kleurCss: "#f97316",
    leeftijdRange: "11–14 jaar",
    spelvorm: "8-tal",
    doelgroep: "Opleidingshart",
  },
  {
    id: "GEEL8",
    label: "Geel 8-tal",
    categorie: "B-8-tal",
    kleurCss: "#eab308",
    leeftijdRange: "9–12 jaar",
    spelvorm: "8-tal",
    doelgroep: "Opleidingshart",
  },
  {
    id: "GEEL4",
    label: "Geel 4-tal",
    categorie: "B-4-tal",
    kleurCss: "#eab308",
    leeftijdRange: "9–12 jaar",
    spelvorm: "4-tal",
    doelgroep: "Opleidingshart",
  },
  {
    id: "GROEN",
    label: "Groen",
    categorie: "B-4-tal",
    kleurCss: "#22c55e",
    leeftijdRange: "7–10 jaar",
    spelvorm: "4-tal",
    doelgroep: "Kweekvijver",
  },
  {
    id: "BLAUW",
    label: "Blauw",
    categorie: "B-4-tal",
    kleurCss: "#3b82f6",
    leeftijdRange: "5–8 jaar",
    spelvorm: "4-tal",
    doelgroep: "Kweekvijver",
  },
] as const;

type TeamtypeId = (typeof TEAMTYPES)[number]["id"];

// ---------------------------------------------------------------------------
// KNKV data per teamtype
// ---------------------------------------------------------------------------

const KNKV_DATA: Record<string, Record<string, string>> = {
  SEN_A: {
    Paal: "3,5m",
    Bal: "5",
    Veld: "Heel",
    Speeltijd: "2×30m of 25m zuiver",
    Spelerwissels: "Max 8",
    Vakwissel: "Na 2 doelpunten",
    Gender: "Verplicht 4+4",
    Leeftijdsgrens: "—",
    Bandbreedte: "—",
  },
  SEN_B: {
    Paal: "3,5m",
    Bal: "5",
    Veld: "Heel",
    Speeltijd: "2×30m",
    Spelerwissels: "Onbeperkt",
    Vakwissel: "Na 2 doelpunten",
    Gender: "Vrij",
    Leeftijdsgrens: "—",
    Bandbreedte: "—",
  },
  U19: {
    Paal: "3,5m",
    Bal: "5",
    Veld: "Heel",
    Speeltijd: "2×25m of 25m zuiver",
    Spelerwissels: "Max 8",
    Vakwissel: "Na 2 doelpunten",
    Gender: "Verplicht 4+4",
    Leeftijdsgrens: "Max 19,00",
    Bandbreedte: "—",
  },
  U17: {
    Paal: "3,5m",
    Bal: "5",
    Veld: "Heel",
    Speeltijd: "2×25m of 25m zuiver",
    Spelerwissels: "Max 8",
    Vakwissel: "Na 2 doelpunten",
    Gender: "Verplicht 4+4",
    Leeftijdsgrens: "Max 17,00",
    Bandbreedte: "—",
  },
  U15: {
    Paal: "3,5m",
    Bal: "5",
    Veld: "Heel",
    Speeltijd: "2×25m",
    Spelerwissels: "Max 8",
    Vakwissel: "Na 2 doelpunten",
    Gender: "Verplicht 4+4",
    Leeftijdsgrens: "Max 15,00",
    Bandbreedte: "—",
  },
  ROOD: {
    Paal: "3,5m",
    Bal: "5",
    Veld: "Heel",
    Speeltijd: "2×30m",
    Spelerwissels: "Onbeperkt",
    Vakwissel: "Na 2 doelpunten",
    Gender: "Volledig vrij",
    Leeftijdsgrens: "—",
    Bandbreedte: "Max 3 jaar",
  },
  ORANJE: {
    Paal: "3,5m",
    Bal: "5",
    Veld: "Heel",
    Speeltijd: "2×25m",
    Spelerwissels: "Onbeperkt",
    Vakwissel: "Op tijd",
    Gender: "Volledig vrij",
    Leeftijdsgrens: "—",
    Bandbreedte: "Max 3 jaar",
  },
  GEEL8: {
    Paal: "3,0m",
    Bal: "4",
    Veld: "Heel",
    Speeltijd: "2×25m",
    Spelerwissels: "Onbeperkt",
    Vakwissel: "Op tijd",
    Gender: "Volledig vrij",
    Leeftijdsgrens: "—",
    Bandbreedte: "Max 3 jaar",
  },
  GEEL4: {
    Paal: "3,0m",
    Bal: "4",
    Veld: "4-tal veld",
    Speeltijd: "4×12,5m",
    Spelerwissels: "Onbeperkt",
    Vakwissel: "—",
    Gender: "Volledig vrij",
    Leeftijdsgrens: "—",
    Bandbreedte: "Max 3 jaar",
  },
  GROEN: {
    Paal: "3,0m",
    Bal: "4",
    Veld: "4-tal veld",
    Speeltijd: "4×12,5m",
    Spelerwissels: "Onbeperkt",
    Vakwissel: "—",
    Gender: "2+2 / 4V / 4M",
    Leeftijdsgrens: "—",
    Bandbreedte: "Max 2 jaar",
  },
  BLAUW: {
    Paal: "2,5m",
    Bal: "3",
    Veld: "4-tal veld",
    Speeltijd: "4×10m",
    Spelerwissels: "Onbeperkt",
    Vakwissel: "—",
    Gender: "Geen onderscheid",
    Leeftijdsgrens: "—",
    Bandbreedte: "Max 2 jaar",
  },
};

// B-categorie teamtypes die leeftijdsvelden tonen
const B_CATEGORIE_IDS = new Set(["ROOD", "ORANJE", "GEEL8", "GEEL4", "GROEN", "BLAUW"]);

// U-teams die een max-leeftijd-per-speler veld tonen
const U_TEAM_IDS = new Set(["U19", "U17", "U15"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isGelijk(a: TcKader, b: TcKader): boolean {
  const numVelden: (keyof TcKader)[] = [
    "teamMin",
    "teamIdeaal",
    "teamMax",
    "damesMin",
    "damesIdeaal",
    "damesMax",
    "herenMin",
    "herenIdeaal",
    "herenMax",
    "gemLeeftijdMin",
    "gemLeeftijdMax",
    "bandbreedteMax",
    "maxLeeftijdPerSpeler",
  ];
  return numVelden.every((k) => a[k] === b[k]);
}

// ---------------------------------------------------------------------------
// Sub-component: NumInput
// ---------------------------------------------------------------------------

interface NumInputProps {
  value: number | undefined;
  onChange: (v: number) => void;
  gewijzigd: boolean;
}

function NumInput({ value, onChange, gewijzigd }: NumInputProps) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const parsed = parseFloat(e.target.value);
        if (!isNaN(parsed)) onChange(parsed);
      }}
      style={{
        background: gewijzigd ? "var(--accent-dim)" : "var(--bg-2)",
        border: `1px solid ${gewijzigd ? "var(--accent)" : "var(--border-1)"}`,
        color: "var(--text-1)",
        borderRadius: 5,
        padding: "4px 8px",
        width: 54,
        textAlign: "center",
        fontSize: 12,
        outline: "none",
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = "1px solid var(--accent)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = "none";
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Sub-component: KaderRij (label + drie inputs)
// ---------------------------------------------------------------------------

interface KaderRijProps {
  label: string;
  min: number;
  ideaal: number;
  max: number;
  defaultMin: number;
  defaultIdeaal: number;
  defaultMax: number;
  onMinChange: (v: number) => void;
  onIdeaalChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}

function KaderRij({
  label,
  min,
  ideaal,
  max,
  defaultMin,
  defaultIdeaal,
  defaultMax,
  onMinChange,
  onIdeaalChange,
  onMaxChange,
}: KaderRijProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid var(--border-0)",
      }}
    >
      <span style={{ flex: 1, color: "var(--text-2)", fontSize: 12 }}>{label}</span>
      <NumInput value={min} onChange={onMinChange} gewijzigd={min !== defaultMin} />
      <NumInput value={ideaal} onChange={onIdeaalChange} gewijzigd={ideaal !== defaultIdeaal} />
      <NumInput value={max} onChange={onMaxChange} gewijzigd={max !== defaultMax} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: LeeftijdRij (label + twee inputs)
// ---------------------------------------------------------------------------

interface LeeftijdRijProps {
  label: string;
  min: number | undefined;
  max: number | undefined;
  defaultMin: number | undefined;
  defaultMax: number | undefined;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
}

function LeeftijdRij({
  label,
  min,
  max,
  defaultMin,
  defaultMax,
  onMinChange,
  onMaxChange,
}: LeeftijdRijProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid var(--border-0)",
      }}
    >
      <span style={{ flex: 1, color: "var(--text-2)", fontSize: 12 }}>{label}</span>
      <NumInput value={min} onChange={onMinChange} gewijzigd={min !== defaultMin} />
      <NumInput value={max} onChange={onMaxChange} gewijzigd={max !== defaultMax} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: SingleInput (label + één input)
// ---------------------------------------------------------------------------

interface SingleInputProps {
  label: string;
  value: number | undefined;
  defaultValue: number | undefined;
  onChange: (v: number) => void;
}

function SingleInput({ label, value, defaultValue, onChange }: SingleInputProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid var(--border-0)",
      }}
    >
      <span style={{ flex: 1, color: "var(--text-2)", fontSize: 12 }}>{label}</span>
      <NumInput value={value} onChange={onChange} gewijzigd={value !== defaultValue} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component: KaderView
// ---------------------------------------------------------------------------

type OpslaanStatus = "idle" | "saving" | "ok" | "error";

interface KaderViewProps {
  seizoen: string;
  opgeslagenKaders: Record<string, TcKader> | null;
}

export function KaderView({ seizoen, opgeslagenKaders }: KaderViewProps) {
  const initieleKaders = mergeMetDefaults(opgeslagenKaders);

  const [actieveTab, setActieveTab] = useState<TeamtypeId>("SEN_A");
  const [kaders, setKaders] = useState<Record<string, TcKader>>(initieleKaders);
  const [savedKaders, setSavedKaders] = useState<Record<string, TcKader>>(initieleKaders);
  const [opslaanStatus, setOpslaanStatus] = useState<OpslaanStatus>("idle");

  const actief = TEAMTYPES.find((t) => t.id === actieveTab)!;
  const huidigKader = kaders[actieveTab];
  const savedKader = savedKaders[actieveTab];
  const isDirty = Object.keys(kaders).some((id) => !isGelijk(kaders[id], savedKaders[id]));
  const isSaving = opslaanStatus === "saving";

  function updateVeld<K extends keyof TcKader>(id: string, veld: K, waarde: TcKader[K]) {
    setKaders((prev) => ({
      ...prev,
      [id]: { ...prev[id], [veld]: waarde },
    }));
  }

  async function handleOpslaan() {
    if (!isDirty || isSaving) return;
    setOpslaanStatus("saving");
    try {
      const result = await slaTeamtypeKadersOp(seizoen, kaders);
      if (result.ok) {
        setSavedKaders({ ...kaders });
        setOpslaanStatus("ok");
        setTimeout(() => setOpslaanStatus("idle"), 2000);
      } else {
        logger.warn("Kader opslaan mislukt:", result.error);
        setOpslaanStatus("error");
        setTimeout(() => setOpslaanStatus("idle"), 3000);
      }
    } catch (err) {
      logger.warn("Kader opslaan — onverwachte fout:", err);
      setOpslaanStatus("error");
      setTimeout(() => setOpslaanStatus("idle"), 3000);
    }
  }

  const knkvVelden = KNKV_DATA[actieveTab] ?? {};
  const isBCategorie = B_CATEGORIE_IDS.has(actieveTab);

  function opslaanLabel(): string {
    if (isSaving) return "Opslaan...";
    if (opslaanStatus === "ok") return "Opgeslagen";
    if (opslaanStatus === "error") return "Fout";
    return "Opslaan";
  }

  function opslaanKleur(): string {
    if (opslaanStatus === "ok") return "var(--green, #22c55e)";
    if (opslaanStatus === "error") return "var(--red, #ef4444)";
    if (isDirty) return "var(--accent)";
    return "var(--bg-3)";
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-0)",
        color: "var(--text-1)",
      }}
    >
      {/* Toolbar-balk */}
      <div
        style={{
          height: 40,
          minHeight: 40,
          background: "var(--bg-1)",
          borderBottom: "1px solid var(--border-0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>Kader — Seizoen {seizoen}</span>
        <button
          onClick={handleOpslaan}
          disabled={!isDirty || isSaving}
          style={{
            padding: "5px 14px",
            borderRadius: 6,
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            cursor: isDirty && !isSaving ? "pointer" : "default",
            background: opslaanKleur(),
            color: isDirty || opslaanStatus !== "idle" ? "#fff" : "var(--text-3)",
            transition: "background 120ms, color 120ms",
          }}
        >
          {opslaanLabel()}
        </button>
      </div>

      {/* Tab-rij */}
      <div
        style={{
          height: 40,
          minHeight: 40,
          background: "var(--bg-1)",
          borderBottom: "1px solid var(--border-0)",
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          padding: "0 8px",
          gap: 2,
          flexShrink: 0,
        }}
      >
        {TEAMTYPES.map((tt) => {
          const isActief = tt.id === actieveTab;
          const heeftWijziging = !isGelijk(kaders[tt.id], savedKaders[tt.id]);
          return (
            <button
              key={tt.id}
              onClick={() => setActieveTab(tt.id as TeamtypeId)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                fontWeight: isActief ? 600 : 400,
                cursor: "pointer",
                background: isActief ? "var(--accent-dim)" : "none",
                color: isActief ? "var(--accent)" : "var(--text-2)",
                whiteSpace: "nowrap",
                flexShrink: 0,
                position: "relative",
                transition: "background 120ms, color 120ms",
              }}
            >
              {heeftWijziging && !isActief && (
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
              )}
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: tt.kleurCss,
                  marginRight: 6,
                  flexShrink: 0,
                  verticalAlign: "middle",
                }}
              />
              {tt.label}
            </button>
          );
        })}
      </div>

      {/* Identity Banner */}
      <div
        style={{
          height: 80,
          minHeight: 80,
          background: "var(--bg-1)",
          borderBottom: "1px solid var(--border-0)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 14,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: actief.kleurCss + "22",
            border: `2px solid ${actief.kleurCss}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: actief.kleurCss,
            }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{actief.label}</div>
          <div style={{ color: "var(--text-3)", fontSize: 12, marginTop: 2 }}>
            {actief.leeftijdRange} &middot; {actief.spelvorm}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              background: "var(--bg-3)",
              color: "var(--text-2)",
            }}
          >
            {actief.categorie}
          </span>
          <span
            style={{
              padding: "3px 10px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              background: "var(--accent-dim)",
              color: "var(--accent)",
            }}
          >
            {actief.doelgroep}
          </span>
        </div>
      </div>

      {/* Content: KNKV-kolom + TC-kolom */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "2fr 3fr",
        }}
      >
        {/* KNKV-kolom */}
        <div
          style={{
            background: "var(--bg-1)",
            borderRight: "1px solid var(--border-1)",
            overflowY: "auto",
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {/* Slot icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-3)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-3)" }}>
              KNKV Regels
            </span>
          </div>

          {Object.entries(knkvVelden).map(([veld, waarde]) => (
            <div
              key={veld}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "7px 0",
                borderBottom: "1px solid var(--border-0)",
                gap: 8,
              }}
            >
              <span style={{ flex: 1, color: "var(--text-3)", fontSize: 12 }}>{veld}</span>
              <span style={{ color: "var(--text-2)", fontSize: 12, textAlign: "right" }}>
                {waarde}
              </span>
            </div>
          ))}
        </div>

        {/* TC-kolom */}
        <div
          style={{
            background: "var(--bg-0)",
            overflowY: "auto",
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {/* Pencil icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 12, color: "var(--accent)" }}>OW Kader</span>
          </div>

          {/* Kolomkoppen */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 0 8px 0",
              borderBottom: "1px solid var(--border-1)",
              marginBottom: 4,
            }}
          >
            <span style={{ flex: 1 }} />
            <span style={{ width: 54, textAlign: "center", fontSize: 11, color: "var(--text-3)" }}>
              Min
            </span>
            <span style={{ width: 54, textAlign: "center", fontSize: 11, color: "var(--text-3)" }}>
              Ideaal
            </span>
            <span style={{ width: 54, textAlign: "center", fontSize: 11, color: "var(--text-3)" }}>
              Max
            </span>
          </div>

          <KaderRij
            label="Teamgrootte"
            min={huidigKader.teamMin}
            ideaal={huidigKader.teamIdeaal}
            max={huidigKader.teamMax}
            defaultMin={savedKader.teamMin}
            defaultIdeaal={savedKader.teamIdeaal}
            defaultMax={savedKader.teamMax}
            onMinChange={(v) => updateVeld(actieveTab, "teamMin", v)}
            onIdeaalChange={(v) => updateVeld(actieveTab, "teamIdeaal", v)}
            onMaxChange={(v) => updateVeld(actieveTab, "teamMax", v)}
          />
          <KaderRij
            label="Dames"
            min={huidigKader.damesMin}
            ideaal={huidigKader.damesIdeaal}
            max={huidigKader.damesMax}
            defaultMin={savedKader.damesMin}
            defaultIdeaal={savedKader.damesIdeaal}
            defaultMax={savedKader.damesMax}
            onMinChange={(v) => updateVeld(actieveTab, "damesMin", v)}
            onIdeaalChange={(v) => updateVeld(actieveTab, "damesIdeaal", v)}
            onMaxChange={(v) => updateVeld(actieveTab, "damesMax", v)}
          />
          <KaderRij
            label="Heren"
            min={huidigKader.herenMin}
            ideaal={huidigKader.herenIdeaal}
            max={huidigKader.herenMax}
            defaultMin={savedKader.herenMin}
            defaultIdeaal={savedKader.herenIdeaal}
            defaultMax={savedKader.herenMax}
            onMinChange={(v) => updateVeld(actieveTab, "herenMin", v)}
            onIdeaalChange={(v) => updateVeld(actieveTab, "herenIdeaal", v)}
            onMaxChange={(v) => updateVeld(actieveTab, "herenMax", v)}
          />

          {isBCategorie && (
            <>
              <div
                style={{
                  marginTop: 16,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ flex: 1 }} />
                <span
                  style={{
                    width: 54,
                    textAlign: "center",
                    fontSize: 11,
                    color: "var(--text-3)",
                  }}
                >
                  Min
                </span>
                <span
                  style={{
                    width: 54,
                    textAlign: "center",
                    fontSize: 11,
                    color: "var(--text-3)",
                  }}
                >
                  Max
                </span>
              </div>
              <LeeftijdRij
                label="Gem. leeftijd"
                min={huidigKader.gemLeeftijdMin}
                max={huidigKader.gemLeeftijdMax}
                defaultMin={savedKader.gemLeeftijdMin}
                defaultMax={savedKader.gemLeeftijdMax}
                onMinChange={(v) => updateVeld(actieveTab, "gemLeeftijdMin", v)}
                onMaxChange={(v) => updateVeld(actieveTab, "gemLeeftijdMax", v)}
              />
            </>
          )}

          {isBCategorie && (
            <SingleInput
              label="Max leeftijdsspreiding (jaar)"
              value={huidigKader.bandbreedteMax}
              defaultValue={savedKader.bandbreedteMax}
              onChange={(v) => updateVeld(actieveTab, "bandbreedteMax", v)}
            />
          )}

          {U_TEAM_IDS.has(actieveTab) && (
            <SingleInput
              label="Max leeftijd per speler"
              value={huidigKader.maxLeeftijdPerSpeler}
              defaultValue={savedKader.maxLeeftijdPerSpeler}
              onChange={(v) => updateVeld(actieveTab, "maxLeeftijdPerSpeler", v)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
