"use client";

/* ================================================================
   SectieVisie — "Onze visie op jeugdontwikkeling"
   5 subsecties: Hero, Oranje Draad, Plezier-cocktail, POP-ratio, Quote
   ================================================================ */

/* -- Data ----------------------------------------------------------------- */

const PIJLERS = [
  {
    label: "PLEZIER",
    color: "var(--ow-oranje-400)",
    beschrijving:
      "Plezier is de basis. Zonder plezier geen motivatie, zonder motivatie geen ontwikkeling.",
  },
  {
    label: "ONTWIKKELING",
    color: "var(--knkv-blauw-400)",
    beschrijving:
      "Elk kind wordt uitgedaagd op zijn eigen niveau. We kijken naar groei, niet naar talent.",
  },
  {
    label: "PRESTATIE",
    color: "var(--knkv-rood-400)",
    beschrijving:
      "Prestatie is een middel, nooit een doel. Competitief zijn als het bijdraagt aan ontwikkeling.",
  },
] as const;

const PLEZIER_KAARTEN = [
  { emoji: "\u{1F46B}", titel: "Vriendschappen", tekst: "Die wil bij Lisa in het team" },
  { emoji: "\u{1F3C6}", titel: "Uitdaging", tekst: "Die wil de strafworp bij 4-4" },
  { emoji: "\u{1F4C8}", titel: "Beter worden", tekst: "Die oefent thuis in de tuin" },
  { emoji: "\u{1F49B}", titel: "Erbij horen", tekst: "Deel zijn van iets" },
] as const;

interface PopRegel {
  knkvKleur: string;
  leeftijdLabel: string;
  plezier: number;
  ontwikkeling: number;
  prestatie: number;
  nadruk: string;
}

const POP_REGELS: PopRegel[] = [
  {
    knkvKleur: "var(--knkv-blauw-500)",
    leeftijdLabel: "5-7 jaar",
    plezier: 70,
    ontwikkeling: 25,
    prestatie: 5,
    nadruk: "Vooral plezier",
  },
  {
    knkvKleur: "var(--knkv-groen-500)",
    leeftijdLabel: "8-9 jaar",
    plezier: 55,
    ontwikkeling: 35,
    prestatie: 10,
    nadruk: "Plezier + leren",
  },
  {
    knkvKleur: "var(--knkv-geel-500)",
    leeftijdLabel: "10-12 jaar",
    plezier: 40,
    ontwikkeling: 40,
    prestatie: 20,
    nadruk: "Balans",
  },
  {
    knkvKleur: "var(--knkv-oranje-500)",
    leeftijdLabel: "13-15 jaar",
    plezier: 30,
    ontwikkeling: 40,
    prestatie: 30,
    nadruk: "Ontwikkeling centraal",
  },
  {
    knkvKleur: "var(--knkv-rood-500)",
    leeftijdLabel: "16-18 jaar",
    plezier: 25,
    ontwikkeling: 35,
    prestatie: 40,
    nadruk: "Prestatie groeit",
  },
];

/* -- Subsectie 1: Hero ---------------------------------------------------- */

function Hero() {
  return (
    <section className="py-16 text-center" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ color: "var(--text-primary)" }}
      >
        Onze visie op jeugdontwikkeling
      </h1>
      <p
        className="mt-4 text-xl font-medium sm:text-2xl"
        style={{ color: "var(--text-secondary)" }}
      >
        Elk kind dat bij ons komt korfballen, verdient het om gezien te worden.
      </p>
      <p className="mt-2 text-base" style={{ color: "var(--text-tertiary)" }}>
        Een systeem dat meegroeit. Van 5-jarige tot 18-jarige.
      </p>
    </section>
  );
}

/* -- Subsectie 2: Oranje Draad -------------------------------------------- */

function OranjeDraad() {
  const DIAMETER = 160;
  const OVERLAP = 40;
  const totalWidth = DIAMETER * 3 - OVERLAP * 2;
  return (
    <section
      className="py-16"
      style={{ maxWidth: "56rem", margin: "0 auto", borderBottom: "1px solid var(--border-light)" }}
    >
      <div
        className="mx-auto"
        style={{ position: "relative", width: `${totalWidth}px`, height: `${DIAMETER}px` }}
      >
        {PIJLERS.map((pijler, i) => (
          <div
            key={pijler.label}
            style={{
              position: "absolute",
              left: `${i * (DIAMETER - OVERLAP)}px`,
              top: 0,
              width: `${DIAMETER}px`,
              height: `${DIAMETER}px`,
              borderRadius: "50%",
              backgroundColor: pijler.color,
              opacity: 0.85,
              mixBlendMode: "screen",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              className="text-sm font-bold tracking-wider"
              style={{ color: "var(--text-primary)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
            >
              {pijler.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PIJLERS.map((pijler) => (
          <div key={pijler.label} className="text-center">
            <p className="mb-1 text-sm font-semibold tracking-wide" style={{ color: pijler.color }}>
              {pijler.label}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {pijler.beschrijving}
            </p>
          </div>
        ))}
      </div>
      <div
        className="mx-auto mt-10 rounded-lg px-6 py-4 text-center"
        style={{
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          maxWidth: "40rem",
        }}
      >
        <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>
          <span style={{ color: "var(--ow-oranje-500)" }}>{"\u2192"}</span>{" "}
          <strong>Duurzaamheid:</strong> Kinderen die blijven. Trainers die het volhouden.
        </p>
      </div>
    </section>
  );
}

/* -- Subsectie 3: Plezier-cocktail ---------------------------------------- */

function PlezierCocktail() {
  return (
    <section
      className="py-16"
      style={{ maxWidth: "56rem", margin: "0 auto", borderBottom: "1px solid var(--border-light)" }}
    >
      <h2 className="mb-2 text-center text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Plezier is voor iedereen anders
      </h2>
      <p className="mb-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Vier vormen van plezier die kinderen bij de sport houden
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLEZIER_KAARTEN.map((kaart) => (
          <div
            key={kaart.titel}
            className="rounded-xl px-6 py-5"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <div className="mb-2 text-2xl" role="img" aria-label={kaart.titel}>
              {kaart.emoji}
            </div>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {kaart.titel}
            </p>
            <p className="mt-1 text-sm italic" style={{ color: "var(--text-secondary)" }}>
              &ldquo;{kaart.tekst}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -- Subsectie 4: POP-ratio ----------------------------------------------- */

const POP_KLEUREN = {
  plezier: "var(--knkv-groen-500)",
  ontwikkeling: "var(--knkv-blauw-500)",
  prestatie: "var(--ow-oranje-500)",
} as const;

function PopRatio() {
  return (
    <section
      className="py-16"
      style={{ maxWidth: "56rem", margin: "0 auto", borderBottom: "1px solid var(--border-light)" }}
    >
      <h2 className="mb-2 text-center text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        POP-ratio per leeftijdsgroep
      </h2>
      <p className="mb-8 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
        Plezier, Ontwikkeling en Prestatie verschuiven naarmate kinderen ouder worden
      </p>
      {/* Legenda */}
      <div className="mb-6 flex items-center justify-center gap-6">
        {(
          [
            { label: "Plezier", kleur: POP_KLEUREN.plezier },
            { label: "Ontwikkeling", kleur: POP_KLEUREN.ontwikkeling },
            { label: "Prestatie", kleur: POP_KLEUREN.prestatie },
          ] as const
        ).map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: item.kleur }}
            />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      {/* Bars */}
      <div className="flex flex-col gap-4">
        {POP_REGELS.map((regel) => (
          <div key={regel.leeftijdLabel} className="flex items-center gap-3">
            <div className="flex w-28 shrink-0 items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: regel.knkvKleur }}
              />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {regel.leeftijdLabel}
              </span>
            </div>
            <div
              className="flex h-8 flex-1 overflow-hidden rounded-md"
              role="img"
              aria-label={`${regel.leeftijdLabel}: ${regel.plezier}% plezier, ${regel.ontwikkeling}% ontwikkeling, ${regel.prestatie}% prestatie`}
            >
              <div
                className="flex items-center justify-center text-xs font-semibold"
                style={{
                  width: `${regel.plezier}%`,
                  backgroundColor: POP_KLEUREN.plezier,
                  color: "var(--text-primary)",
                }}
              >
                {regel.plezier}%
              </div>
              <div
                className="flex items-center justify-center text-xs font-semibold"
                style={{
                  width: `${regel.ontwikkeling}%`,
                  backgroundColor: POP_KLEUREN.ontwikkeling,
                  color: "var(--text-primary)",
                }}
              >
                {regel.ontwikkeling}%
              </div>
              <div
                className="flex items-center justify-center text-xs font-semibold"
                style={{
                  width: `${regel.prestatie}%`,
                  backgroundColor: POP_KLEUREN.prestatie,
                  color: "var(--text-primary)",
                }}
              >
                {regel.prestatie}%
              </div>
            </div>
            <span
              className="hidden w-44 shrink-0 text-right text-sm sm:block"
              style={{ color: "var(--text-tertiary)" }}
            >
              {regel.nadruk}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -- Subsectie 5: Quote --------------------------------------------------- */

function Quote() {
  return (
    <section className="py-16" style={{ maxWidth: "56rem", margin: "0 auto" }}>
      <blockquote
        className="rounded-lg px-8 py-6"
        style={{
          backgroundColor: "var(--surface-card)",
          borderLeft: "4px solid var(--ow-oranje-500)",
          border: "1px solid var(--border-default)",
          borderLeftColor: "var(--ow-oranje-500)",
          borderLeftWidth: "4px",
        }}
      >
        <p className="text-lg leading-relaxed font-medium" style={{ color: "var(--text-primary)" }}>
          &ldquo;We kijken niet naar wie een kind{" "}
          <em style={{ color: "var(--ow-oranje-500)" }}>IS</em>, maar naar wat een kind{" "}
          <em style={{ color: "var(--ow-oranje-500)" }}>DOET</em>.&rdquo;
        </p>
      </blockquote>
    </section>
  );
}

/* -- SectieVisie — samengestelde export ----------------------------------- */

export function SectieVisie() {
  return (
    <div className="mx-auto max-w-4xl">
      <Hero />
      <OranjeDraad />
      <PlezierCocktail />
      <PopRatio />
      <Quote />
    </div>
  );
}
