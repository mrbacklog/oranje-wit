"use client";

import { useEffect, useCallback } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  width?: "w-64" | "w-72" | "w-80" | "w-96";
  title?: string;
  children: React.ReactNode;
  pinnable?: boolean;
  pinned?: boolean;
  onTogglePin?: () => void;
}

export default function Drawer({
  open,
  onClose,
  side,
  width = "w-80",
  title,
  children,
  pinnable = false,
  pinned = false,
  onTogglePin,
}: DrawerProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (!pinned && e.key === "Escape") onClose();
    },
    [onClose, pinned]
  );

  useEffect(() => {
    if (!open || pinned) return;
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, pinned, handleEscape]);

  if (!open) return null;

  // Statische klassen per side (Tailwind CSS 4: geen interpolatie)
  const isLeft = side === "left";

  // Width classes zijn statisch — we kiezen via conditional
  const widthClass =
    width === "w-64" ? "w-64" : width === "w-72" ? "w-72" : width === "w-96" ? "w-96" : "w-80";

  const borderClass = isLeft ? "border-r" : "border-l";

  const headerButtons = (
    <div className="flex items-center gap-1">
      {pinnable && onTogglePin && (
        <button
          onClick={onTogglePin}
          className="rounded p-1 transition-colors"
          style={pinned ? { color: "var(--ow-oranje-500)" } : { color: "var(--text-secondary)" }}
          title={pinned ? "Losmaken" : "Vastzetten"}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {pinned ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                strokeDasharray="4 2"
              />
            )}
          </svg>
        </button>
      )}
      <button
        onClick={onClose}
        className="rounded p-1 transition-colors"
        style={{ color: "var(--text-secondary)" }}
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
  );

  // Gepind: render als inline sidebar (geen fixed, geen backdrop)
  if (pinned) {
    return (
      <aside
        className={`flex h-full flex-col ${widthClass} shrink-0 ${borderClass}`}
        style={{
          background: "var(--surface-card)",
          borderColor: "var(--border-default)",
        }}
      >
        {title && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-default)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            {headerButtons}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    );
  }

  // Niet gepind: render als fixed overlay (origineel gedrag)
  const panelPositie = isLeft ? "left-0" : "right-0";
  const animatie = isLeft ? "animate-slide-in-left" : "animate-slide-in-right";

  return (
    <>
      {/* Backdrop */}
      <div
        className="animate-fade-in fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 ${panelPositie} z-40 flex flex-col shadow-xl ${widthClass} ${animatie}`}
        style={{ background: "var(--surface-card)" }}
      >
        {title && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-default)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {title}
            </h3>
            {headerButtons}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
