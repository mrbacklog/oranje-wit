import { getGebruikers } from "./actions";
import { GebruikersLijst } from "./gebruikers-lijst";

export const dynamic = "force-dynamic";

export default async function GebruikersPage() {
  const gebruikers = await getGebruikers();

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Gebruikers
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Gebruikersbeheer en rollentoewijzing
        </p>
      </div>

      <GebruikersLijst initialData={gebruikers} />
    </div>
  );
}
