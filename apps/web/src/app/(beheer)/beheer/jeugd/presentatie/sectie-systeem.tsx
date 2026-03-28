"use client";

import { motion } from "framer-motion";
import {
  fadeUp,
  stagger,
  pillPop,
  Pill,
  ArrowDown,
  ArrowRight,
  GroteStapMarker,
  evolutieRijen,
  transformatieRijen,
  aanvallendeActies,
  verdedigendeActies,
  kaartLagen,
  scoutingsMethoden,
  BLAUW,
  GEEL,
  GROEN,
  ROOD,
} from "./systeem-pijlerevolutie";

/* -------------------------------------------------------------------------- */
/*  Subsecties                                                                */
/* -------------------------------------------------------------------------- */

function Header() {
  return (
    <motion.div variants={fadeUp} className="mb-12 space-y-3">
      <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
        Hoe werkt ons scoutingssysteem?
      </h2>
      <p
        className="max-w-2xl text-base leading-relaxed sm:text-lg"
        style={{ color: "var(--text-secondary)" }}
      >
        De pijlers op de spelerskaart veranderen mee met de leeftijd.
      </p>
    </motion.div>
  );
}

function Pijlerevolutie() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="mb-16 space-y-1"
    >
      <motion.h3
        variants={fadeUp}
        className="mb-6 text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Pijlerevolutie per leeftijd
      </motion.h3>
      {evolutieRijen.map((rij, index) => (
        <div key={rij.leeftijd}>
          {index === 1 && <GroteStapMarker />}
          {index > 1 && (
            <motion.div variants={fadeUp} className="flex justify-center py-2">
              <ArrowDown color="var(--text-tertiary)" />
            </motion.div>
          )}
          <motion.div
            variants={fadeUp}
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--surface-card)" }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: rij.color }}
              />
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                {rij.leeftijd}
              </span>
            </div>
            <motion.div variants={stagger} className="flex flex-wrap gap-2">
              {rij.pijlers.map((p) => (
                <Pill key={p.label} label={p.label} color={rij.color} badge={p.badge} />
              ))}
            </motion.div>
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}

function Transformatie() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="mb-16"
    >
      <motion.h3
        variants={fadeUp}
        className="mb-2 text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Transformatie bij De Grote Stap
      </motion.h3>
      <motion.p
        variants={fadeUp}
        className="mb-6 text-sm"
        style={{ color: "var(--text-tertiary)" }}
      >
        Zo veranderen de basispijlers naar korfbalspecifieke pijlers bij 10 jaar.
      </motion.p>
      <div className="space-y-3">
        {transformatieRijen.map((rij) => (
          <motion.div
            key={rij.van}
            variants={fadeUp}
            className="flex items-center gap-3 rounded-xl p-3 sm:gap-4 sm:p-4"
            style={{ backgroundColor: "var(--surface-card)" }}
          >
            <span
              className="inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                color: BLAUW,
                backgroundColor: `color-mix(in srgb, ${BLAUW} 15%, transparent)`,
              }}
            >
              {rij.van}
            </span>
            <span className="shrink-0">
              <ArrowRight color="var(--text-tertiary)" />
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rij.naar.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    color: GEEL,
                    backgroundColor: `color-mix(in srgb, ${GEEL} 15%, transparent)`,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function KnkvActies() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="mb-16"
    >
      <motion.h3
        variants={fadeUp}
        className="mb-6 text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        KNKV Korfbalacties
      </motion.h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <motion.div
          variants={fadeUp}
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--surface-card)", borderLeft: `3px solid ${GROEN}` }}
        >
          <h4 className="mb-4 text-sm font-bold tracking-wider uppercase" style={{ color: GROEN }}>
            Aanvallend
          </h4>
          <ul className="space-y-3" role="list">
            {aanvallendeActies.map((actie, i) => (
              <motion.li key={actie.label} variants={pillPop} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    color: GROEN,
                    backgroundColor: `color-mix(in srgb, ${GROEN} 15%, transparent)`,
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {actie.label}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--surface-card)", borderLeft: `3px solid ${ROOD}` }}
        >
          <h4 className="mb-4 text-sm font-bold tracking-wider uppercase" style={{ color: ROOD }}>
            Verdedigend
          </h4>
          <ul className="space-y-3" role="list">
            {verdedigendeActies.map((actie, i) => (
              <motion.li key={actie.label} variants={pillPop} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    color: ROOD,
                    backgroundColor: `color-mix(in srgb, ${ROOD} 15%, transparent)`,
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {actie.label}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
      <motion.p
        variants={fadeUp}
        className="mt-4 text-center text-xs italic"
        style={{ color: "var(--text-tertiary)" }}
      >
        De 8 acties van het KNKV.
      </motion.p>
    </motion.div>
  );
}

function Kaartstructuur() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className="mb-16"
    >
      <motion.h3
        variants={fadeUp}
        className="mb-6 text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Structuur van de spelerskaart
      </motion.h3>
      <div className="relative space-y-3">
        {kaartLagen.map((laag, i) => (
          <motion.div
            key={laag.titel}
            variants={fadeUp}
            className="rounded-xl p-5"
            style={{
              backgroundColor: "var(--surface-card)",
              borderTop: `2px solid ${laag.color}`,
              marginLeft: i * 8,
              marginRight: i * 8,
            }}
          >
            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-sm font-bold" style={{ color: laag.color }}>
                {laag.titel}
              </span>
              <span
                className="text-xs font-medium tracking-widest uppercase"
                style={{ color: "var(--text-tertiary)" }}
              >
                ({laag.subtitel})
              </span>
            </div>
            <motion.div variants={stagger} className="flex flex-wrap gap-2">
              {laag.pijlers.map((pijler) => (
                <Pill key={pijler} label={pijler} color={laag.color} />
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function Scoutingsmethoden() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.h3
        variants={fadeUp}
        className="mb-6 text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Scoutingsmethoden
      </motion.h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {scoutingsMethoden.map((methode) => (
          <motion.div
            key={methode.titel}
            variants={fadeUp}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-xl p-5"
            style={{ backgroundColor: "var(--surface-card)" }}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                style={{ backgroundColor: "var(--surface-raised)" }}
              >
                {methode.emoji}
              </span>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  {methode.titel}
                </p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {methode.duur}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {methode.beschrijving}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hoofdcomponent                                                            */
/* -------------------------------------------------------------------------- */

export function SectieSysteem() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={stagger}
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6"
      aria-label="Hoe werkt ons scoutingssysteem"
    >
      <Header />
      <Pijlerevolutie />
      <Transformatie />
      <KnkvActies />
      <Kaartstructuur />
      <Scoutingsmethoden />
    </motion.section>
  );
}
