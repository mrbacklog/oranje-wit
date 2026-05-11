"use client";

import { useReadOnly } from "@/lib/read-only";

export default function ReadOnlyBadge() {
  const readOnly = useReadOnly();
  if (!readOnly) return null;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: "999px",
        background: "rgba(255, 107, 0, 0.15)",
        color: "var(--text-primary)",
        border: "1px solid var(--ow-oranje, #ff6b00)",
        fontSize: "0.85rem",
      }}
    >
      Alleen-lezen modus
    </span>
  );
}
