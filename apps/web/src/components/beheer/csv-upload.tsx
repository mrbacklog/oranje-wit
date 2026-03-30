"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";

interface CsvUploadProps {
  onUpload: (csvContent: string, bestandsnaam: string) => void;
  bezig?: boolean;
}

export function CsvUpload({ onUpload, bezig }: CsvUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const verwerkBestand = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          onUpload(content, file.name);
        }
      };
      reader.readAsText(file, "utf-8");
    },
    [onUpload]
  );

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) verwerkBestand(file);
    },
    [verwerkBestand]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) verwerkBestand(file);
      // Reset zodat hetzelfde bestand opnieuw gekozen kan worden
      e.target.value = "";
    },
    [verwerkBestand]
  );

  return (
    <div
      className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragActive ? "border-[var(--ow-oranje-500)]" : "border-[var(--border-default)]"
      }`}
      style={{
        backgroundColor: dragActive
          ? "color-mix(in srgb, var(--ow-oranje-500) 5%, var(--surface-card))"
          : "var(--surface-card)",
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !bezig && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
        disabled={bezig}
      />

      <div className="flex flex-col items-center gap-2">
        <svg
          className="h-10 w-10"
          style={{ color: dragActive ? "var(--ow-oranje-500)" : "var(--text-tertiary)" }}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {bezig ? "Bezig met verwerken..." : "Sleep een CSV-bestand hierheen"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          of klik om te selecteren (Sportlink export, semicolon-delimited)
        </p>
      </div>
    </div>
  );
}
