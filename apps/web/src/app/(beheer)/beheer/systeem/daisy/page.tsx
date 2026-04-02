import { getDaisyInstellingen, getDaisyBeschikbaarheid } from "./actions";
import { InstellingenPaneel } from "./instellingen-paneel";

export const dynamic = "force-dynamic";

export default async function DaisyInstellingenPage() {
  const [instellingen, beschikbaarheid] = await Promise.all([
    getDaisyInstellingen(),
    getDaisyBeschikbaarheid(),
  ]);

  const claudeKeyAanwezig = !!process.env.ANTHROPIC_API_KEY;
  const geminiKeyAanwezig = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Daisy — AI TC-lid
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Provider-configuratie en token-limieten
        </p>
      </div>

      {/* Status banner */}
      {beschikbaarheid.beschikbaar ? (
        <div
          className="mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(34,197,94,0.1)",
            color: "var(--semantic-success)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--semantic-success)" }}
          />
          Daisy actief via {beschikbaarheid.actieveProvider === "claude" ? "Claude" : "Gemini"}
        </div>
      ) : (
        <div
          className="mb-6 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(245,158,11,0.1)",
            color: "var(--semantic-warning)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--semantic-warning)" }}
          />
          Geen provider ingesteld — voeg een API key toe als omgevingsvariabele
        </div>
      )}

      {/* Instellingen paneel */}
      <InstellingenPaneel
        initieel={instellingen}
        claudeKeyAanwezig={claudeKeyAanwezig}
        geminiKeyAanwezig={geminiKeyAanwezig}
      />
    </div>
  );
}
