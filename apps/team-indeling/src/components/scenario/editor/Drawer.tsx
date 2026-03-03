"use client";

import { useEffect, useCallback } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  width?: "w-64" | "w-72" | "w-80" | "w-96";
  title?: string;
  children: React.ReactNode;
}

export default function Drawer({
  open,
  onClose,
  side,
  width = "w-80",
  title,
  children,
}: DrawerProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleEscape]);

  if (!open) return null;

  // Statische klassen per side (Tailwind CSS 4: geen interpolatie)
  const isLeft = side === "left";
  const panelPositie = isLeft ? "left-0" : "right-0";
  const animatie = isLeft ? "animate-slide-in-left" : "animate-slide-in-right";

  // Width classes zijn statisch — we kiezen via conditional
  const widthClass =
    width === "w-64" ? "w-64" : width === "w-72" ? "w-72" : width === "w-96" ? "w-96" : "w-80";

  return (
    <>
      {/* Backdrop */}
      <div
        className="animate-fade-in fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 ${panelPositie} z-40 flex flex-col bg-white shadow-xl ${widthClass} ${animatie}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
            <button
              onClick={onClose}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
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
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
