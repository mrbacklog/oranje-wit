"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useId, useRef } from "react";

interface SearchInputProps {
  /** Huidige zoekwaarde */
  value: string;
  /** Callback bij tekstwijziging */
  onChange: (value: string) => void;
  /** Placeholder tekst */
  placeholder?: string;
  /** Callback voor de clear knop */
  onClear?: () => void;
  /** Extra CSS class */
  className?: string;
  /** Autofocus */
  autoFocus?: boolean;
}

/**
 * SearchInput — Zoekbalk met glassmorphism styling.
 *
 * Features:
 * - Glassmorphism achtergrond met backdrop-blur
 * - Vergrootglas icon links (wordt oranje bij focus)
 * - Clear button rechts met fade animatie (AnimatePresence)
 * - Focus state: oranje border-glow (box-shadow)
 * - Premium feel met subtiele transitions
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Zoeken...",
  onClear,
  className = "",
  autoFocus = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const handleClear = () => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={`group relative ${className}`}>
      <div
        className="relative flex items-center overflow-hidden rounded-xl transition-all duration-200 focus-within:ring-0"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border-default)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        onFocus={(e) => {
          const container = e.currentTarget;
          container.style.borderColor = "rgba(255,133,51,0.4)";
          container.style.boxShadow =
            "0 0 0 3px rgba(255,133,51,0.1), 0 0 20px rgba(255,133,51,0.08)";
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) {
            const container = e.currentTarget;
            container.style.borderColor = "var(--border-default)";
            container.style.boxShadow = "none";
          }
        }}
      >
        {/* Vergrootglas icon */}
        <label htmlFor={id} className="flex shrink-0 pr-1 pl-3.5">
          <svg
            className="transition-colors duration-200 group-focus-within:text-[var(--ow-oranje-500)]"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "inherit" }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </label>

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="min-h-[44px] flex-1 bg-transparent py-2.5 pr-2 text-sm outline-none"
          style={{
            color: "var(--text-primary)",
          }}
          aria-label={placeholder}
        />

        {/* Clear button */}
        <AnimatePresence>
          {value.length > 0 && (
            <motion.button
              type="button"
              onClick={handleClear}
              className="mr-2 flex shrink-0 items-center justify-center rounded-lg p-1.5 transition-colors"
              style={{
                color: "var(--text-tertiary)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              aria-label="Zoekveld wissen"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Subtiele glow onder de search bar */}
      <div
        className="pointer-events-none absolute right-[10%] -bottom-px left-[10%] h-px opacity-0 transition-opacity duration-300 group-focus-within:opacity-100"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,133,51,0.3), transparent)",
        }}
      />
    </div>
  );
}
