"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatPanel } from "./chat-panel";
import { type ActieveProvider } from "./chat-panel";

// ─── Types ──────────────────────────────────────────────────────

interface DaisyChatProps {
  beschikbaar: boolean;
  actieveProvider?: ActieveProvider;
}

// ─── Component ──────────────────────────────────────────────────

export function DaisyChat({ beschikbaar, actieveProvider }: DaisyChatProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.5 }}
            onClick={beschikbaar ? () => setOpen(true) : undefined}
            className="fixed right-5 bottom-20 z-70 flex h-12 w-12 items-center justify-center rounded-full text-base font-bold shadow-lg sm:bottom-6"
            style={{
              backgroundColor: beschikbaar ? "var(--ow-oranje-500)" : "var(--surface-raised)",
              color: beschikbaar ? "#ffffff" : "var(--text-muted)",
              boxShadow: "var(--shadow-modal)",
              cursor: beschikbaar ? "pointer" : "default",
            }}
            aria-label={beschikbaar ? "Open Daisy chat" : "Daisy niet beschikbaar"}
            title={beschikbaar ? undefined : "Daisy niet beschikbaar \u2014 stel een API key in"}
          >
            D
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <ChatPanel open={open} onClose={() => setOpen(false)} providerInfo={actieveProvider} />
    </>
  );
}
