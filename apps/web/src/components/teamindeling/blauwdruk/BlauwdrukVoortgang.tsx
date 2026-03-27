"use client";

import { motion } from "framer-motion";
import { ProgressBar } from "@oranje-wit/ui";

type TabId = "kaders" | "spelers" | "staf" | "teams" | "scenarios" | "werkbord";

interface VoortgangKpiProps {
  label: string;
  waarde: number;
  totaal: number;
  kleur: string;
  delay?: number;
  onKlik: () => void;
}

function VoortgangKpi({ label, waarde, totaal, kleur, delay = 0, onKlik }: VoortgangKpiProps) {
  const percentage = totaal > 0 ? Math.round((waarde / totaal) * 100) : 0;

  return (
    <motion.button
      onClick={onKlik}
      className="flex flex-col gap-2 rounded-xl p-4 text-left transition-colors"
      style={{
        backgroundColor: "var(--surface-card)",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--border-default)",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{
        scale: 1.02,
        boxShadow: "var(--shadow-card-hover)",
        borderColor: "var(--border-strong)",
      }}
      whileTap={{ scale: 0.98 }}
    >
      <span
        className="text-xs font-medium tracking-wide uppercase"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color: kleur }}>
          {waarde}
        </span>
        <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          / {totaal}
        </span>
      </div>
      <ProgressBar value={waarde} max={totaal || 1} color={kleur} size="sm" delay={delay + 0.2} />
      <span className="text-xs font-medium tabular-nums" style={{ color: "var(--text-secondary)" }}>
        {percentage}%
      </span>
    </motion.button>
  );
}

interface BlauwdrukVoortgangProps {
  besluitStats: {
    totaal: number;
    definitief: number;
    voorlopig: number;
    onduidelijk: number;
  };
  gezienVoortgang: {
    totaal: number;
    gezien: number;
  };
  onNavigeerNaarTab: (tab: TabId) => void;
}

export default function BlauwdrukVoortgang({
  besluitStats,
  gezienVoortgang,
  onNavigeerNaarTab,
}: BlauwdrukVoortgangProps) {
  const kadersTotaal = besluitStats.totaal;
  const kadersKlaar = besluitStats.definitief;

  const spelersTotaal = gezienVoortgang.totaal;
  const spelersGezien = gezienVoortgang.gezien;

  const stafTotaal = 0;
  const stafKlaar = 0;

  const gewogenTotaal = kadersTotaal + spelersTotaal + stafTotaal;
  const gewogenKlaar = kadersKlaar + spelersGezien + stafKlaar;

  const kadersPct = kadersTotaal > 0 ? kadersKlaar / kadersTotaal : 0;
  const spelersPct = spelersTotaal > 0 ? spelersGezien / spelersTotaal : 0;
  const stafPct = 0;

  const totaalPct = Math.round(kadersPct * 30 + spelersPct * 40 + stafPct * 30);

  return (
    <motion.div
      className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-4 md:mx-0 md:px-0"
      style={{ backgroundColor: "var(--surface-page)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <VoortgangKpi
          label="Kaders"
          waarde={kadersKlaar}
          totaal={kadersTotaal}
          kleur="#3B82F6"
          delay={0}
          onKlik={() => onNavigeerNaarTab("kaders")}
        />
        <VoortgangKpi
          label="Spelers"
          waarde={spelersGezien}
          totaal={spelersTotaal}
          kleur="#22C55E"
          delay={0.05}
          onKlik={() => onNavigeerNaarTab("spelers")}
        />
        <VoortgangKpi
          label="Staf"
          waarde={stafKlaar}
          totaal={stafTotaal}
          kleur="#FF6B00"
          delay={0.1}
          onKlik={() => onNavigeerNaarTab("staf")}
        />
        <VoortgangKpi
          label="Totaal"
          waarde={gewogenKlaar}
          totaal={gewogenTotaal}
          kleur="var(--text-primary)"
          delay={0.15}
          onKlik={() => {}}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar
            value={totaalPct}
            max={100}
            color={{ from: "#FF6B00", to: "#FF8533" }}
            size="sm"
            delay={0.3}
          />
        </div>
        <span
          className="text-xs font-semibold tabular-nums"
          style={{ color: "var(--text-secondary)" }}
        >
          {totaalPct}% gereed
        </span>
      </div>
    </motion.div>
  );
}
