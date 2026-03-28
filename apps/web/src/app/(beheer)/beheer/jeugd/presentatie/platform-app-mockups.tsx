"use client";

import React from "react";
import { motion } from "framer-motion";

// ─── Animatie-varianten ───

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  },
};

export const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

// ─── App-data ───

interface AppInfo {
  naam: string;
  route: string;
  accent: string;
}

const APPS: AppInfo[] = [
  { naam: "Portaal", route: "/", accent: "var(--ow-oranje-500)" },
  { naam: "Monitor", route: "/monitor", accent: "#22c55e" },
  { naam: "Team-Indeling", route: "/teamindeling", accent: "#3b82f6" },
  { naam: "Evaluatie", route: "/evaluatie", accent: "#eab308" },
  { naam: "Scouting", route: "/scouting", accent: "#ff6b00" },
  { naam: "Beheer", route: "/beheer", accent: "#9ca3af" },
];

// ─── Browser-frame wrapper ───

export function BrowserFrame({
  route,
  accent,
  children,
}: {
  route: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          borderBottom: `2px solid ${accent}`,
          background: "var(--surface-sunken)",
        }}
      >
        <div className="flex gap-1.5">
          <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />
          <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#eab308" }} />
          <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />
        </div>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>
          ckvoranjewit.app{route}
        </span>
      </div>
      <div className="p-3" style={{ minHeight: 120 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Mockup-inhoud per app ───

function MockupPortaal() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-5 w-3/4 rounded" style={{ background: "rgba(255,133,51,0.2)" }} />
      <div className="grid grid-cols-2 gap-1.5">
        <div className="h-10 rounded" style={{ background: "rgba(34,197,94,0.15)" }} />
        <div className="h-10 rounded" style={{ background: "rgba(59,130,246,0.15)" }} />
        <div className="h-10 rounded" style={{ background: "rgba(234,179,8,0.15)" }} />
        <div className="h-10 rounded" style={{ background: "rgba(255,107,0,0.15)" }} />
      </div>
    </div>
  );
}

function MockupMonitor() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {[0.8, 0.6, 0.9].map((w, i) => (
          <div key={i} className="flex-1 rounded" style={{ height: 24 }}>
            <div
              className="h-full rounded"
              style={{ width: `${w * 100}%`, background: "rgba(34,197,94,0.25)" }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1" style={{ height: 56 }}>
        {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3, 0.65].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${h * 100}%`, background: `rgba(34,197,94,${0.2 + i * 0.04})` }}
          />
        ))}
      </div>
    </div>
  );
}

function MockupTeamIndeling() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {["Kaders", "Spelers", "Teams"].map((tab, i) => (
          <div
            key={tab}
            className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
            style={{
              background: i === 0 ? "rgba(59,130,246,0.25)" : "var(--surface-raised)",
              color: i === 0 ? "#3b82f6" : "var(--text-tertiary)",
            }}
          >
            {tab}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        {["D1", "D2"].map((team) => (
          <div
            key={team}
            className="flex-1 rounded-lg p-2"
            style={{ background: "var(--surface-raised)", border: "1px solid var(--border-light)" }}
          >
            <div className="mb-1.5 text-[10px] font-bold" style={{ color: "#3b82f6" }}>
              {team}
            </div>
            <div className="flex flex-wrap gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2.5 w-5 rounded-sm"
                  style={{ background: "rgba(59,130,246,0.18)" }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupEvaluatie() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
          style={{ background: "rgba(234,179,8,0.25)", color: "#eab308" }}
        >
          R1
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
          Voorjaar 2026
        </span>
      </div>
      {["Verstuurd", "Ingevuld", "Open"].map((status) => (
        <div
          key={status}
          className="flex items-center justify-between rounded px-2 py-1.5"
          style={{ background: "var(--surface-raised)" }}
        >
          <div className="h-2 w-16 rounded" style={{ background: "var(--border-default)" }} />
          <span
            className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
            style={{
              background:
                status === "Ingevuld"
                  ? "rgba(34,197,94,0.2)"
                  : status === "Verstuurd"
                    ? "rgba(234,179,8,0.2)"
                    : "var(--surface-sunken)",
              color:
                status === "Ingevuld"
                  ? "#22c55e"
                  : status === "Verstuurd"
                    ? "#eab308"
                    : "var(--text-tertiary)",
            }}
          >
            {status}
          </span>
        </div>
      ))}
    </div>
  );
}

function MockupScouting() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold" style={{ color: "#ff6b00" }}>
          XP
        </span>
        <div
          className="h-2.5 flex-1 overflow-hidden rounded-full"
          style={{ background: "var(--surface-raised)" }}
        >
          <div className="h-full rounded-full" style={{ width: "60%", background: "#ff6b00" }} />
        </div>
        <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>
          60%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { from: "rgba(255,107,0,0.25)", to: "rgba(255,107,0,0.1)" },
          { from: "rgba(234,179,8,0.25)", to: "rgba(234,179,8,0.1)" },
          { from: "rgba(59,130,246,0.2)", to: "rgba(59,130,246,0.08)" },
          { from: "rgba(34,197,94,0.2)", to: "rgba(34,197,94,0.08)" },
        ].map((g, i) => (
          <div
            key={i}
            className="h-12 rounded-lg"
            style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
          />
        ))}
      </div>
    </div>
  );
}

function MockupBeheer() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {[
        "#22c55e",
        "#ff6b00",
        "var(--text-tertiary)",
        "#22c55e",
        "var(--text-tertiary)",
        "#22c55e",
        "#ff6b00",
        "#22c55e",
        "var(--text-tertiary)",
      ].map((dotColor, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 rounded px-2 py-2"
          style={{ background: "var(--surface-raised)" }}
        >
          <span className="block h-2 w-2 shrink-0 rounded-full" style={{ background: dotColor }} />
          <div className="h-1.5 flex-1 rounded" style={{ background: "var(--border-default)" }} />
        </div>
      ))}
    </div>
  );
}

const MOCKUP_RENDERERS: Record<string, () => React.ReactNode> = {
  Portaal: () => <MockupPortaal />,
  Monitor: () => <MockupMonitor />,
  "Team-Indeling": () => <MockupTeamIndeling />,
  Evaluatie: () => <MockupEvaluatie />,
  Scouting: () => <MockupScouting />,
  Beheer: () => <MockupBeheer />,
};

// ─── App Showcase ───

export function AppShowcase() {
  return (
    <motion.div variants={stagger} className="mb-16">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app) => (
          <motion.div key={app.naam} variants={fadeUp}>
            <BrowserFrame route={app.route} accent={app.accent}>
              {MOCKUP_RENDERERS[app.naam]?.()}
            </BrowserFrame>
            <p className="mt-2 text-center text-sm font-semibold" style={{ color: app.accent }}>
              {app.naam}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Feature-badge ───

export function FeatureBadge({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background: `color-mix(in srgb, ${accent} 15%, transparent)`,
        color: accent,
        border: `1px solid color-mix(in srgb, ${accent} 25%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
