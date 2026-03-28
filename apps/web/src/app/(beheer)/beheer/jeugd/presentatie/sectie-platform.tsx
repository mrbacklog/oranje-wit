"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger } from "./platform-app-mockups";
import { AppShowcase } from "./platform-app-mockups";
import { ZoomTeamIndeling, ZoomScouting, SpelersKaartShowcase } from "./platform-zoom-secties";

// ─── Subsecties ───

function PlatformHeader() {
  return (
    <motion.div variants={fadeUp} className="mb-12 text-center">
      <h2
        className="mb-3 text-3xl font-black tracking-tight sm:text-4xl"
        style={{ color: "var(--text-primary)" }}
      >
        Ons Platform
      </h2>
      <p className="mx-auto max-w-xl text-lg" style={{ color: "var(--text-secondary)" }}>
        Zes apps. Een systeem. Van monitor tot spelerskaart.
      </p>
    </motion.div>
  );
}

function SlotQuote() {
  return (
    <motion.div variants={fadeUp} className="flex justify-center">
      <div
        className="rounded-xl px-8 py-6 text-center"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <p className="text-lg font-semibold italic" style={{ color: "var(--text-primary)" }}>
          &ldquo;Een platform dat meegroeit met je vereniging.&rdquo;
        </p>
      </div>
    </motion.div>
  );
}

// ─── Hoofdcomponent ───

export function SectiePlatform() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={stagger}
      aria-labelledby="sectie-platform-titel"
    >
      <span id="sectie-platform-titel" className="sr-only">
        Ons Platform
      </span>
      <PlatformHeader />
      <AppShowcase />
      <ZoomTeamIndeling />
      <ZoomScouting />
      <SpelersKaartShowcase />
      <SlotQuote />
    </motion.section>
  );
}
