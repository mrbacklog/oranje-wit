"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { drawerSlide, overlayBackdrop } from "@oranje-wit/ui/motion";
import { ChatBericht } from "./chat-bericht";
import { ChatInput } from "./chat-input";

// ─── Types ──────────────────────────────────────────────────────

export type ActieveProvider = "claude" | "gemini" | "niet-beschikbaar" | null;

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  providerInfo?: ActieveProvider;
}

// ─── Provider badge stijlen ───────────────────────────────────────

function getProviderBadgeStijl(provider: ActieveProvider): {
  label: string;
  bg: string;
  kleur: string;
} {
  switch (provider) {
    case "claude":
      return { label: "Claude", bg: "rgba(168,85,247,0.12)", kleur: "#c084fc" };
    case "gemini":
      return { label: "Gemini", bg: "rgba(59,130,246,0.12)", kleur: "#60a5fa" };
    case "niet-beschikbaar":
      return { label: "Niet beschikbaar", bg: "rgba(239,68,68,0.1)", kleur: "#f87171" };
    default:
      return { label: "Auto", bg: "var(--surface-raised)", kleur: "var(--text-muted)" };
  }
}

// ─── Transport ──────────────────────────────────────────────────
// Geen singleton — wordt aangemaakt per instantie zodat we de
// X-Ai-Provider header kunnen doorgeven via onResponse callback.
function maakTransport(onProvider: (p: ActieveProvider) => void) {
  return new TextStreamChatTransport({
    api: "/api/ai/chat",
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      const provider = response.headers.get("X-Ai-Provider");
      if (provider === "claude" || provider === "gemini") {
        onProvider(provider);
      }
      return response;
    },
  });
}

// ─── Component ──────────────────────────────────────────────────

export function ChatPanel({ open, onClose, providerInfo }: ChatPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [actieveProvider, setActieveProvider] = useState<ActieveProvider>(providerInfo ?? null);

  const transport = useRef(maakTransport(setActieveProvider));
  const { messages, sendMessage, status, error } = useChat({ transport: transport.current });

  const isLoading = status === "submitted" || status === "streaming";

  // Escape, focus, scroll lock
  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      closeRef.current?.focus();
    });

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  // Auto-scroll bij nieuwe berichten
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage({ text: trimmed });
  };

  const variants = drawerSlide("right");
  const lastMessageIsUser = messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-80">
          {/* Backdrop */}
          <motion.div
            variants={overlayBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0"
            style={{ backgroundColor: "var(--surface-scrim)" }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-0 right-0 flex h-full w-full flex-col sm:w-[380px]"
            style={{
              backgroundColor: "rgba(26, 29, 35, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderLeft: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-modal)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Daisy chat"
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-default)" }}
            >
              {/* Avatar */}
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: "var(--ow-oranje-500)", color: "#ffffff" }}
              >
                D
              </div>

              {/* Naam + status */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    Daisy
                  </p>
                  {actieveProvider !== null &&
                    (() => {
                      const stijl = getProviderBadgeStijl(actieveProvider);
                      return (
                        <span
                          className="rounded px-1.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: stijl.bg, color: stijl.kleur }}
                        >
                          {stijl.label}
                        </span>
                      );
                    })()}
                </div>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {isLoading ? "TC-lid \u00b7 denkt na..." : "TC-lid \u00b7 online"}
                </p>
              </div>

              {/* Sluit-knop */}
              <motion.button
                ref={closeRef}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "var(--surface-raised)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                }}
                aria-label="Sluiten"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Berichten */}
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                /* Lege staat */
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold"
                    style={{
                      backgroundColor: "var(--ow-oranje-500)",
                      color: "#ffffff",
                    }}
                  >
                    D
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    Hoi! Ik ben Daisy.
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Vraag me iets over de planning, teams of leden.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((m) => (
                    <ChatBericht key={m.id} bericht={m} />
                  ))}

                  {/* Loading indicator */}
                  {isLoading && lastMessageIsUser && (
                    <div className="flex justify-start">
                      <div
                        className="rounded-xl rounded-bl-sm px-3.5 py-2.5 text-sm"
                        style={{
                          backgroundColor: "var(--surface-raised)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        &hellip;
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Error state */}
              {error && (
                <div
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "var(--semantic-error)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  {error.message || "Er ging iets mis. Probeer het opnieuw."}
                </div>
              )}
            </div>

            {/* Input */}
            <ChatInput
              input={input}
              onChange={(e) => setInput(e.target.value)}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
