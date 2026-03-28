import { getSeizoenen } from "./actions";
import { SeizoenenLijst } from "./seizoenen-lijst";

export const dynamic = "force-dynamic";

export default async function JaarkalenderPage() {
  const seizoenen = await getSeizoenen();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Jaarkalender
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Seizoenen en hun status
        </p>
      </div>

      <SeizoenenLijst initialData={seizoenen} />
    </div>
  );
}
