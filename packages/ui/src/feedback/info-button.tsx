"use client";

interface InfoButtonProps {
  onClick: () => void;
}

export function InfoButton({ onClick }: InfoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="hover:border-ow-oranje hover:text-ow-oranje inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-400 transition-colors"
      aria-label="Pagina-informatie"
      title="Informatie over deze pagina"
    >
      i
    </button>
  );
}
