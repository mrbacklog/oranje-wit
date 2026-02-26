"use client";

interface KadersEditorProps {
  kaders: Record<string, unknown>;
}

/**
 * Toont KNKV-regels en OW-voorkeuren als read-only referentie.
 * De kaders komen uit de import en zijn niet bewerkbaar.
 */
export default function KadersEditor({ kaders }: KadersEditorProps) {
  const knkv = kaders.knkv as Record<string, unknown> | undefined;
  const ow = kaders.ow as Record<string, unknown> | undefined;

  const heeftKaders = knkv || ow;

  if (!heeftKaders) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-sm text-gray-500">
          Nog geen kaders geimporteerd. Voer eerst een import uit om
          KNKV-regels en OW-voorkeuren te laden.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {knkv && (
        <KaderSectie
          titel="KNKV-regels"
          beschrijving="Competitieregels van de KNKV die gelden voor dit seizoen"
          data={knkv}
        />
      )}
      {ow && (
        <KaderSectie
          titel="OW-voorkeuren"
          beschrijving="Clubvoorkeuren van c.k.v. Oranje Wit"
          data={ow}
        />
      )}
    </div>
  );
}

function KaderSectie({
  titel,
  beschrijving,
  data,
}: {
  titel: string;
  beschrijving: string;
  data: Record<string, unknown>;
}) {
  const entries = Object.entries(data);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 text-sm">{titel}</h4>
      <p className="text-xs text-gray-500 mb-3">{beschrijving}</p>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Geen regels gevonden</p>
      ) : (
        <ul className="space-y-1.5">
          {entries.map(([sleutel, waarde]) => (
            <li
              key={sleutel}
              className="flex items-start gap-2 text-sm text-gray-700"
            >
              <span className="font-medium text-gray-600 min-w-[140px] shrink-0">
                {formatSleutel(sleutel)}
              </span>
              <span className="text-gray-800">{formatWaarde(waarde)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatSleutel(sleutel: string): string {
  return sleutel
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatWaarde(waarde: unknown): string {
  if (waarde === null || waarde === undefined) return "—";
  if (typeof waarde === "boolean") return waarde ? "Ja" : "Nee";
  if (typeof waarde === "number") return String(waarde);
  if (typeof waarde === "string") return waarde;
  if (Array.isArray(waarde)) return waarde.join(", ");
  if (typeof waarde === "object") return JSON.stringify(waarde);
  return String(waarde);
}
