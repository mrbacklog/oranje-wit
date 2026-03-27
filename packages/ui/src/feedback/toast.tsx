"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toastSlide } from "../motion/variants";

// ─── Types ──────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  action?: ToastAction;
}

interface ToastContextValue {
  toast: (
    message: string,
    options?: { type?: ToastType; duration?: number; action?: ToastAction }
  ) => void;
  dismiss: (id: string) => void;
}

// ─── Accent kleuren per type ────────────────────────────────────

const accentColors: Record<ToastType, string> = {
  success: "#22c55e",
  error: "#ef4444",
  warning: "#eab308",
  info: "#3b82f6",
};

const iconPaths: Record<ToastType, string> = {
  success: "M5 13l4 4L19 7",
  error: "M6 18L18 6M6 6l12 12",
  warning: "M12 9v4m0 4h.01M12 3L2 21h20L12 3z",
  info: "M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z",
};

// ─── Context ────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast moet binnen een <ToastProvider> worden gebruikt");
  }
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options?: { type?: ToastType; duration?: number; action?: ToastAction }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const type = options?.type ?? "info";
      const duration = options?.duration ?? 8000;

      setToasts((prev) => [...prev, { id, message, type, duration, action: options?.action }]);

      // Auto-dismiss
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}

      {/* Toast container — fixed bovenaan */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Toast item ─────────────────────────────────────────────────

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      variants={toastSlide}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="pointer-events-auto relative w-full max-w-[420px] overflow-hidden rounded-xl"
      style={{
        backgroundColor: "rgba(34, 38, 46, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-modal)",
      }}
    >
      {/* Accent lijn links */}
      <div
        className="absolute top-0 left-0 h-full w-[3px]"
        style={{ backgroundColor: accentColors[t.type] }}
      />

      <div className="flex items-start gap-3 py-3 pr-3 pl-5">
        {/* Icon */}
        <div
          className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center"
          style={{ color: accentColors[t.type] }}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={iconPaths[t.type]} />
          </svg>
        </div>

        {/* Bericht */}
        <p
          className="flex-1 text-sm leading-snug font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {t.message}
        </p>

        {/* Actie-knop */}
        {t.action && (
          <button
            onClick={() => {
              t.action?.onClick();
              onDismiss();
            }}
            className="flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors"
            style={{
              color: "var(--ow-oranje-500)",
              backgroundColor: "rgba(255, 133, 51, 0.1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255, 133, 51, 0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255, 133, 51, 0.1)";
            }}
          >
            {t.action.label}
          </button>
        )}

        {/* Sluiten */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded p-0.5 transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
          }}
          aria-label="Sluiten"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Progress bar — aftellend */}
      {t.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-[2px]"
          style={{ backgroundColor: accentColors[t.type], opacity: 0.5 }}
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: t.duration / 1000, ease: "linear" }}
        />
      )}
    </motion.div>
  );
}
