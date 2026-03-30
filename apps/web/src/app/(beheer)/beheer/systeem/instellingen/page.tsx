import { requireTC } from "@oranje-wit/auth/checks";
import { InstellingenPaneel } from "./instellingen-paneel";
import { getInstellingen, AI_PROVIDERS } from "./actions";

export default async function InstellingenPage() {
  await requireTC();
  const instellingen = await getInstellingen();

  return (
    <div className="mx-auto max-w-2xl px-5 py-6">
      <h1 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
        AI-instellingen
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-tertiary)" }}>
        API keys voor Daisy en andere AI-functies. Keys worden versleuteld opgeslagen.
      </p>

      <InstellingenPaneel providers={AI_PROVIDERS} instellingen={instellingen} />
    </div>
  );
}
