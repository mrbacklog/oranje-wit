import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profiel | Mijn Oranje Wit",
};

export default function ProfielPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
        Profiel
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
        Hier komt je persoonlijke profiel en instellingen.
      </p>
    </div>
  );
}
