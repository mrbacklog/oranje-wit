"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatPanel } from "./chat-panel";

// ─── Component ──────────────────────────────────────────────────

export function DaisyChat() {
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
            onClick={() => setOpen(true)}
            className="fixed right-5 bottom-20 z-[70] flex h-12 w-12 items-center justify-center rounded-full text-base font-bold shadow-lg sm:bottom-6"
            style={{
              backgroundColor: "var(--ow-oranje-500)",
              color: "#ffffff",
              boxShadow: "var(--shadow-modal)",
            }}
            aria-label="Open Daisy chat"
          >
            D
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <ChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
