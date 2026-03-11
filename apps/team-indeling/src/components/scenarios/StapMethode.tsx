"use client";

export type Methode = "blauwdruk" | "kopieer" | "leeg";

const METHODE_BTN =
  "rounded-lg border-2 border-gray-200 p-4 text-left transition-all hover:border-orange-400 hover:bg-orange-50";

export default function StapMethode({
  heeftScenarios,
  onKies,
  onAnnuleer,
}: {
  heeftScenarios: boolean;
  onKies: (m: Methode) => void;
  onAnnuleer: () => void;
}) {
  return (
    <>
      <div className="dialog-header">
        <h3 className="text-lg font-bold text-gray-900">Nieuw scenario</h3>
        <p className="mt-1 text-sm text-gray-500">Hoe wil je beginnen?</p>
      </div>
      <div className="dialog-body">
        <div className="grid gap-3">
          <button onClick={() => onKies("blauwdruk")} className={METHODE_BTN}>
            <div className="font-semibold text-gray-900">Vanuit blauwdruk</div>
            <p className="mt-1 text-sm text-gray-500">
              Configureer senioren, A-categorie en B-teams stap voor stap.
            </p>
          </button>
          <button
            onClick={() => onKies("kopieer")}
            disabled={!heeftScenarios}
            className={`${METHODE_BTN} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <div className="font-semibold text-gray-900">Kopieer bestaand scenario</div>
            <p className="mt-1 text-sm text-gray-500">
              Start met een kopie inclusief teams en spelers.
            </p>
          </button>
          <button onClick={() => onKies("leeg")} className={METHODE_BTN}>
            <div className="font-semibold text-gray-900">Helemaal leeg</div>
            <p className="mt-1 text-sm text-gray-500">
              Begin zonder teams. Voeg later handmatig teams toe.
            </p>
          </button>
        </div>
      </div>
      <div className="dialog-footer">
        <button onClick={onAnnuleer} className="btn-ghost">
          Annuleren
        </button>
      </div>
    </>
  );
}
