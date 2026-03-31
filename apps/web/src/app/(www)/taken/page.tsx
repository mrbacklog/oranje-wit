import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taken | Mijn Oranje Wit",
};

export default function TakenPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
        Taken
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
        Hier komen je openstaande taken en actiepunten.
      </p>
    </div>
  );
}
