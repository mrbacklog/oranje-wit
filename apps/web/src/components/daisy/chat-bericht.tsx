"use client";

import type { UIMessage } from "ai";
import Markdown from "react-markdown";

// ─── Types ──────────────────────────────────────────────────────

interface ChatBerichtProps {
  bericht: UIMessage;
}

// ─── Helpers ────────────────────────────────────────────────────

/** Extract plain text from UIMessage parts */
function getTextContent(bericht: UIMessage): string {
  return bericht.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

// ─── Component ──────────────────────────────────────────────────

export function ChatBericht({ bericht }: ChatBerichtProps) {
  const isUser = bericht.role === "user";
  const text = getTextContent(bericht);

  if (!text) return null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={{
          backgroundColor: isUser ? "var(--ow-oranje-500)" : "var(--surface-raised)",
          color: isUser ? "#ffffff" : "var(--text-primary)",
        }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none">
            <Markdown>{text}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
