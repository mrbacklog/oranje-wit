import { SectieVisie } from "./sectie-visie";
import { SectieSysteem } from "./sectie-systeem";
import { SectieLeeftijdsgroepen } from "./sectie-leeftijdsgroepen";
import { SectiePlatform } from "./sectie-platform";

export const metadata = {
  title: "Jeugdontwikkeling — Presentatie | TC Beheer",
  description: "Visuele presentatie van het vaardigheidsraamwerk v3.0 van c.k.v. Oranje Wit",
};

export default function PresentatiePage() {
  return (
    <div className="mx-auto max-w-5xl pb-24">
      {/* Sectie 1: Onze visie */}
      <SectieVisie />

      {/* Scheidingslijn */}
      <div className="my-16" style={{ borderTop: "1px solid var(--border-default)" }} />

      {/* Sectie 2: Hoe werkt het systeem */}
      <SectieSysteem />

      {/* Scheidingslijn */}
      <div className="my-16" style={{ borderTop: "1px solid var(--border-default)" }} />

      {/* Sectie 3: Per leeftijdsgroep */}
      <SectieLeeftijdsgroepen />

      {/* Scheidingslijn */}
      <div className="my-16" style={{ borderTop: "1px solid var(--border-default)" }} />

      {/* Sectie 4: Ons Platform */}
      <SectiePlatform />
    </div>
  );
}
