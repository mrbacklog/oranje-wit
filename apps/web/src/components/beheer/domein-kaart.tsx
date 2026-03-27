"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@oranje-wit/ui";
import type { SVGProps, ComponentType } from "react";

// ── Types ────────────────────────────────────────────────────

export type DomeinStatus = "actief" | "in-opbouw" | "gepland";

export interface DomeinModule {
  titel: string;
  beschrijving: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  status: DomeinStatus;
  accent: string;
}

// ── Status configuratie ──────────────────────────────────────

const statusConfig: Record<
  DomeinStatus,
  {
    accentLijn: string | null;
    badge: { label: string; color: "green" | "yellow" | "gray" };
    opacity: string;
    dotClass: string | null;
    klikbaar: boolean;
  }
> = {
  actief: {
    accentLijn: "var(--ow-oranje-500)",
    badge: { label: "Actief", color: "green" },
    opacity: "opacity-100",
    dotClass: "domein-dot-actief",
    klikbaar: true,
  },
  "in-opbouw": {
    accentLijn: "var(--color-warning-500)",
    badge: { label: "In opbouw", color: "yellow" },
    opacity: "opacity-85",
    dotClass: null,
    klikbaar: true,
  },
  gepland: {
    accentLijn: null,
    badge: { label: "Gepland", color: "gray" },
    opacity: "opacity-50",
    dotClass: null,
    klikbaar: false,
  },
};

// ── Animatie-varianten ───────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

// ── DomeinKaart component ────────────────────────────────────

interface DomeinKaartProps {
  module: DomeinModule;
  index: number;
}

export function DomeinKaart({ module: m, index }: DomeinKaartProps) {
  const config = statusConfig[m.status];

  const kaartContent = (
    <>
      {/* Accent-lijn links */}
      {config.accentLijn && (
        <div
          className="absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full"
          style={{ backgroundColor: config.accentLijn }}
        />
      )}

      <div className="flex items-start gap-3.5">
        {/* Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${m.accent} 12%, transparent)`,
            color: m.accent,
          }}
        >
          <m.Icon className="h-5 w-5" />
        </div>

        {/* Tekst + badge */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="domein-title">{m.titel}</span>
            <Badge color={config.badge.color}>
              {config.dotClass && <span className={config.dotClass} />}
              {config.badge.label}
            </Badge>
          </div>
          <p className="domein-desc">{m.beschrijving}</p>
        </div>
      </div>
    </>
  );

  const sharedClasses = `domein-card domein-card--${m.status} ${config.opacity}`;

  if (!config.klikbaar) {
    return (
      <motion.div
        className={sharedClasses}
        style={{ cursor: "default" }}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        aria-disabled="true"
      >
        {kaartContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ y: -2, boxShadow: "0 8px 25px -5px rgba(0,0,0,0.4)" }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={m.href} className={sharedClasses}>
        {kaartContent}
      </Link>
    </motion.div>
  );
}
