export default function OverPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Over Team-Indeling</h1>
      <p className="mb-8 text-gray-600">
        De Team-Indeling tool helpt de Technische Commissie van c.k.v. Oranje Wit bij het
        samenstellen van teamindelingen per seizoen.
      </p>

      {/* Procesmodel */}
      <section className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Procesmodel</h2>
        </div>
        <div className="card-body space-y-4">
          <p className="text-sm text-gray-600">
            De teamindeling doorloopt vier fasen, van kaders naar definitieve indeling:
          </p>

          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                1
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Blauwdruk</h3>
                <p className="text-sm text-gray-600">
                  Definieer de kaders: hoeveel teams, welke categorieen, gepinde feiten (bevestigde
                  beslissingen die voor alle scenario&apos;s gelden).
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                2
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Concepten</h3>
                <p className="text-sm text-gray-600">
                  Stel uitgangspunten op: welke aannames maken we, wat zijn de speerpunten voor dit
                  seizoen.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                3
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Scenario&apos;s</h3>
                <p className="text-sm text-gray-600">
                  Bouw concrete teamindelingen: sleep spelers naar teams, bekijk validatie,
                  vergelijk varianten naast elkaar.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                4
              </span>
              <div>
                <h3 className="font-semibold text-gray-900">Definitief</h3>
                <p className="text-sm text-gray-600">
                  Kies het beste scenario en maak het definitief. Vanaf dat moment is de indeling
                  vastgelegd.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Begrippen */}
      <section className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Begrippen</h2>
        </div>
        <div className="card-body">
          <dl className="space-y-3">
            <div>
              <dt className="font-semibold text-gray-900">Pin</dt>
              <dd className="text-sm text-gray-600">
                Een bevestigd feit dat geldt voor alle scenario&apos;s. Bijvoorbeeld: &quot;speler X
                speelt in team Y&quot; of &quot;speler Z stopt&quot;.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Selectiegroep</dt>
              <dd className="text-sm text-gray-600">
                Teams die spelers delen, bijvoorbeeld A1 en A2. Spelers in een selectiegroep kunnen
                in meerdere teams worden ingedeeld.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Spelerstatus</dt>
              <dd className="text-sm text-gray-600">
                De beschikbaarheid van een speler: beschikbaar, twijfelt, gaat stoppen of nieuw.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-900">Rating</dt>
              <dd className="text-sm text-gray-600">
                Een sterkte-inschatting van een speler, gebruikt om teams evenwichtig samen te
                stellen.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* De Oranje Draad */}
      <section className="card mb-6">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">De Oranje Draad</h2>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-600">
            Elke teamindeling wordt getoetst aan drie pijlers: <strong>Plezier</strong>,{" "}
            <strong>Ontwikkeling</strong> en <strong>Prestatie</strong> &mdash; samen zorgen ze voor
            duurzaamheid.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
            <span className="rounded-md bg-green-50 px-3 py-1.5 text-green-700">Plezier</span>
            <span className="text-gray-400">+</span>
            <span className="rounded-md bg-blue-50 px-3 py-1.5 text-blue-700">Ontwikkeling</span>
            <span className="text-gray-400">+</span>
            <span className="rounded-md bg-orange-50 px-3 py-1.5 text-orange-700">Prestatie</span>
            <span className="text-gray-400">=</span>
            <span className="rounded-md bg-gray-100 px-3 py-1.5 font-semibold text-gray-900">
              Duurzaamheid
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 border-t border-gray-200 pt-4 text-sm text-gray-400">
        <p>Versie 1.0 &mdash; Seizoen 2025-2026</p>
        <p className="mt-1">Vragen of suggesties? Neem contact op met de TC.</p>
      </footer>
    </main>
  );
}
