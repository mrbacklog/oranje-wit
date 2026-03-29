"use client";

import { useRef, useCallback, type ChangeEvent, type KeyboardEvent, type FormEvent } from "react";
import { motion } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────

interface ChatInputProps {
  input: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

// ─── Component ──────────────────────────────────────────────────

export function ChatInput({ input, onChange, onSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    autoResize();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as FormEvent);
      }
    }
  };

  const canSend = input.trim().length > 0 && !isLoading;

  return (
    <form
      onSubmit={onSubmit}
      className="flex items-end gap-2 px-4 py-3"
      style={{ borderTop: "1px solid var(--border-default)" }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Vraag Daisy..."
        rows={1}
        className="flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm leading-relaxed outline-none"
        style={{
          backgroundColor: "var(--surface-sunken)",
          border: "1px solid var(--border-default)",
          color: "var(--text-primary)",
          minHeight: "40px",
          maxHeight: "120px",
        }}
        aria-label="Bericht aan Daisy"
      />
      <motion.button
        type="submit"
        disabled={!canSend}
        whileTap={{ scale: 0.9 }}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-opacity"
        style={{
          backgroundColor: canSend ? "var(--ow-oranje-500)" : "var(--surface-raised)",
          color: canSend ? "#ffffff" : "var(--text-tertiary)",
          opacity: canSend ? 1 : 0.5,
        }}
        aria-label="Verstuur bericht"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </motion.button>
    </form>
  );
}
