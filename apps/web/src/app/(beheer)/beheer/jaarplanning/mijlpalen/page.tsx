import { getMijlpalen, getSeizoenOpties } from "./actions";
import { MijlpalenLijst } from "./mijlpalen-lijst";

export const dynamic = "force-dynamic";

export default async function MijlpalenPage() {
  const [mijlpalen, seizoenOpties] = await Promise.all([getMijlpalen(), getSeizoenOpties()]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Mijlpalen & Checklists
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-tertiary)" }}>
          {seizoenOpties.length} seizoenen, {mijlpalen.length} mijlpalen
        </p>
      </div>

      <MijlpalenLijst initialData={mijlpalen} seizoenOpties={seizoenOpties} />
    </div>
  );
}
