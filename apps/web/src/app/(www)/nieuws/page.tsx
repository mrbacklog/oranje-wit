import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nieuws | Mijn Oranje Wit",
};

export default function NieuwsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
        Nieuws
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
        Hier komen updates en berichten van de TC.
      </p>
    </div>
  );
}
