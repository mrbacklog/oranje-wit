"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-lg rounded-xl border-0 p-0 backdrop:bg-black/50"
      style={{
        backgroundColor: "var(--surface-card)",
        color: "var(--text-primary)",
        boxShadow: "var(--shadow-modal)",
      }}
    >
      <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h2>
      </div>
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div
          className="flex justify-end gap-3 px-6 py-4"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          {footer}
        </div>
      )}
    </dialog>
  );
}
