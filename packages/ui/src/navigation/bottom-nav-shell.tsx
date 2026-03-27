"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BottomNav, type NavItem, GridIcon } from "./bottom-nav";
import { AppSwitcher, type AppSwitcherProfile } from "./app-switcher";
import { APP_META } from "./app-icons";
import type { AppId } from "./icons/types";
import { easeFast } from "../motion/variants";

export interface BottomNavShellProps {
  /** Navigatie-items (max 4 voor BottomNav + 1 Apps knop) */
  items: NavItem[];
  /** Actief domein — bepaalt highlight in AppSwitcher */
  domain: AppId;
  /** Gebruikersprofiel voor de AppSwitcher */
  profile?: AppSwitcherProfile;
}

export function BottomNavShell({ items, domain, profile }: BottomNavShellProps) {
  const [open, setOpen] = useState(false);
  const meta = APP_META[domain];

  return (
    <>
      <BottomNav items={items}>
        <button
          onClick={() => setOpen(true)}
          className="flex min-h-[2.75rem] min-w-[2.75rem] flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors duration-200"
          style={{ color: open ? "var(--ow-oranje-500)" : "var(--text-tertiary)" }}
          aria-label="Open app switcher"
        >
          <GridIcon active={open} />
          <span className="font-medium">Apps</span>
        </button>
      </BottomNav>

      <AppSwitcher
        open={open}
        onClose={() => setOpen(false)}
        currentUrl={meta.url}
        variant="sheet"
        profile={profile}
      />
    </>
  );
}

// ─── FloatingAppSwitcherFab ───────────────────────────────────

interface FloatingAppSwitcherFabProps {
  domain: AppId;
  profile?: AppSwitcherProfile;
}

export function FloatingAppSwitcherFab({ domain, profile }: FloatingAppSwitcherFabProps) {
  const [open, setOpen] = useState(false);
  const meta = APP_META[domain];

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed right-4 z-30 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg"
        style={{
          bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
          backgroundColor: "var(--surface-raised)",
          border: "1px solid var(--border-default)",
          color: "var(--ow-oranje-500)",
        }}
        whileTap={{ scale: 0.92 }}
        transition={easeFast}
        aria-label="Open app switcher"
      >
        <GridIcon active={open} />
      </motion.button>

      <AppSwitcher
        open={open}
        onClose={() => setOpen(false)}
        currentUrl={meta.url}
        variant="sheet"
        profile={profile}
      />
    </>
  );
}
