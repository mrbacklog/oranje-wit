"use client";

interface InfoButtonProps {
  onClick: () => void;
}

export function InfoButton({ onClick }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="hover:border-ow-oranje hover:text-ow-oranje inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-colors"
      style={{
        borderColor: "var(--border-strong)",
        color: "var(--text-tertiary)",
      }}
      aria-label="Pagina-informatie"
      title="Informatie over deze pagina"
    >
      i
    </button>
  );
}
