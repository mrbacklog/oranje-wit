# OW Scout — Animatie-specificatie

> Versie 1.0 — 2026-03-25
> Auteur: Motion Design / Claude
> Implementatie: Framer Motion 11+ / CSS Custom Properties / Web Animations API

---

## Inhoudsopgave

1. [Ontwerpprincipes](#1-ontwerpprincipes)
2. [Gedeelde tokens & easing-curves](#2-gedeelde-tokens--easing-curves)
3. [Kaart-onthulling ("Pack Opening")](#3-kaart-onthulling-pack-opening)
4. [Score-invoer feedback](#4-score-invoer-feedback)
5. [Kaart-update](#5-kaart-update)
6. [XP & Level-up](#6-xp--level-up)
7. [Badge unlock](#7-badge-unlock)
8. [Celebration (rapport indienen)](#8-celebration-rapport-indienen)
9. [Navigatie-transities](#9-navigatie-transities)
10. [Micro-interacties](#10-micro-interacties)
11. [Accessibility & Reduced Motion](#11-accessibility--reduced-motion)
12. [Performance-richtlijnen](#12-performance-richtlijnen)

---

## 1. Ontwerpprincipes

| Principe | Regel |
|---|---|
| **60fps** | Animeer uitsluitend `transform` en `opacity`. Nooit `width`, `height`, `top`, `left`, `margin`, `padding`. |
| **Mobile-first** | Target: mid-range Android (Samsung A34). Alle timings en particle counts zijn hierop afgestemd. |
| **Betekenisvol** | Elke animatie communiceert status, beloning of richting. Geen decoratie zonder functie. |
| **Respectvol** | `prefers-reduced-motion: reduce` schakelt alle animaties terug tot instant state-changes of minimale crossfades. |
| **Gelaagd** | Combineer maximaal 3 gelijktijdige animatie-lagen. Meer = jank op budget-devices. |

---

## 2. Gedeelde tokens & easing-curves

### 2.1 Duur-tokens

```css
:root {
  --duration-instant: 50ms;
  --duration-micro: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-dramatic: 600ms;
  --duration-reveal: 3500ms;   /* pack opening totaal */
}
```

### 2.2 Easing-curves

```css
:root {
  /* Standaard UI */
  --ease-out:        cubic-bezier(0.16, 1, 0.3, 1);       /* decelerate — voor elementen die binnenkomen */
  --ease-in:         cubic-bezier(0.55, 0, 1, 0.45);       /* accelerate — voor elementen die vertrekken */
  --ease-in-out:     cubic-bezier(0.45, 0, 0.55, 1);       /* symmetrisch — voor loops en toggles */

  /* Bounce & overshoot */
  --ease-bounce:     cubic-bezier(0.34, 1.56, 0.64, 1);    /* overshoot + settle */
  --ease-soft-bounce: cubic-bezier(0.22, 1.2, 0.36, 1);    /* mildere overshoot */

  /* Dramatisch (pack opening) */
  --ease-dramatic-in: cubic-bezier(0.7, 0, 0.84, 0);       /* trage start, snelle versnelling */
  --ease-dramatic-out: cubic-bezier(0.16, 1, 0.3, 1);      /* snelle start, zachte landing */

  /* Spring-equivalent voor Framer Motion */
  --spring-snappy:   { type: "spring", stiffness: 400, damping: 25, mass: 0.8 };
  --spring-bouncy:   { type: "spring", stiffness: 300, damping: 15, mass: 1 };
  --spring-gentle:   { type: "spring", stiffness: 200, damping: 20, mass: 1.2 };
  --spring-dramatic: { type: "spring", stiffness: 150, damping: 12, mass: 1.5 };
}
```

### 2.3 Framer Motion spring presets (TypeScript)

```typescript
export const springs = {
  snappy:   { type: "spring", stiffness: 400, damping: 25, mass: 0.8 } as const,
  bouncy:   { type: "spring", stiffness: 300, damping: 15, mass: 1 } as const,
  gentle:   { type: "spring", stiffness: 200, damping: 20, mass: 1.2 } as const,
  dramatic: { type: "spring", stiffness: 150, damping: 12, mass: 1.5 } as const,
} satisfies Record<string, { type: "spring"; stiffness: number; damping: number; mass: number }>;
```

### 2.4 OW Kleur-tokens (uit `packages/ui/tokens/globals.css`)

```css
:root {
  --color-ow-oranje: #ff6b00;
  --color-ow-oranje-light: #ff8c33;
  --color-ow-oranje-bg: #fff3e8;

  /* Tier-kleuren */
  --color-tier-brons: #cd7f32;
  --color-tier-brons-glow: #cd7f3266;
  --color-tier-zilver: #c0c0c0;
  --color-tier-zilver-glow: #c0c0c066;
  --color-tier-goud: #ffd700;
  --color-tier-goud-glow: #ffd70066;

  /* Stat feedback */
  --color-stat-up: #4caf50;
  --color-stat-up-glow: #4caf5044;
  --color-stat-down: #f44336;
  --color-stat-down-glow: #f4433644;

  /* Leeftijdsgroep-kleuren (confetti) */
  --color-band-blauw: #4a90d9;
  --color-band-groen: #52b788;
  --color-band-geel: #f4d35e;
  --color-band-oranje: #f28c28;
  --color-band-rood: #d62828;

  /* XP */
  --color-xp-fill: #ff6b00;
  --color-xp-glow: #ff6b0088;
  --color-xp-text: #ff8c33;
}
```

---

## 3. Kaart-onthulling ("Pack Opening")

**Totale duur:** 3500ms
**Trigger:** Scout dient een rapport in en de spelerskaart wordt voor het eerst onthuld.
**Context:** Fullscreen overlay, donkere achtergrond. Dit is het beloningsmoment van de app.

### Overzicht fases

| Fase | Naam | Start | Eind | Duur |
|---|---|---|---|---|
| 1 | Envelop verschijnt | 0ms | 500ms | 500ms |
| 2 | Envelop opent | 500ms | 1000ms | 500ms |
| 3 | Kaart verschijnt | 1000ms | 1500ms | 500ms |
| 4 | Stats reveal | 1500ms | 2500ms | 1000ms |
| 5 | Tier reveal | 2500ms | 3000ms | 500ms |
| 6 | Settle | 3000ms | 3500ms | 500ms |

---

### Fase 1: Envelop verschijnt (0–500ms)

**Beschrijving:** Een gesloten kaart-envelop materialiseert vanuit het niets in het midden van het scherm. De envelop is een rechthoekige vorm met een V-vormige flap bovenaan, in de OW-oranje kleur.

- **Trigger:** Rapport succesvol opgeslagen → overlay mount
- **Duration:** 500ms
- **Easing:** `var(--ease-dramatic-out)` / `cubic-bezier(0.16, 1, 0.3, 1)`

**Keyframes:**

| Tijd | `opacity` | `scale` | `translateY` | `filter` | Beschrijving |
|---|---|---|---|---|---|
| 0ms (0%) | 0 | 0.3 | 40px | `blur(12px)` | Onzichtbaar, klein, wazig, iets onder midden |
| 250ms (50%) | 0.8 | 1.05 | -5px | `blur(2px)` | Bijna zichtbaar, lichte overshoot naar boven |
| 500ms (100%) | 1 | 1 | 0px | `blur(0)` | Volledig zichtbaar, scherp, op positie |

**Achtergrond-effect:**
- Donkere backdrop fades in: `opacity 0 → 0.85`, duur 300ms, `ease-out`
- Subtiele radiale gradient achter de envelop (OW-oranje glow, 60% transparant)

**Framer Motion:**

```tsx
// Backdrop
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 0.85 }}
  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
  className="fixed inset-0 bg-black"
/>

// Envelop container
<motion.div
  initial={{
    opacity: 0,
    scale: 0.3,
    y: 40,
    filter: "blur(12px)",
  }}
  animate={{
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
  }}
  transition={{
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1],
  }}
>
  {/* Envelop SVG/component */}
</motion.div>
```

**CSS fallback:**

```css
@keyframes envelope-appear {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(40px);
    filter: blur(12px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05) translateY(-5px);
    filter: blur(2px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}

.envelope-enter {
  animation: envelope-appear 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

**Reduced motion:** Envelop verschijnt instant (`opacity 0 → 1`, 150ms, geen transform/blur).

**Sound cue:** Zacht "whoosh" geluid (100ms, low-mid frequency, fade-in), gevolgd door een subtiele "thud" bij 500ms.

**Haptic:** Medium impact bij 500ms (envelop landt).

---

### Fase 2: Envelop opent (500–1000ms)

**Beschrijving:** De V-vormige flap van de envelop klapt naar achteren open. Vanuit de opening schijnt een warm licht naar buiten — de kleur van het licht hint naar de tier (oranje voor standaard, zilver-wit voor zilver, goud voor goud).

- **Trigger:** Automatisch na fase 1
- **Duration:** 500ms
- **Easing flap:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce, de flap schiet iets voorbij 180deg)
- **Easing licht:** `cubic-bezier(0.16, 1, 0.3, 1)` (snelle burst)

**Keyframes — Envelop flap:**

| Tijd | `rotateX` | `transform-origin` | Beschrijving |
|---|---|---|---|
| 500ms (0%) | 0deg | bottom center | Flap gesloten |
| 700ms (40%) | -170deg | bottom center | Bijna helemaal open |
| 850ms (70%) | -185deg | bottom center | Overshoot voorbij plat |
| 1000ms (100%) | -180deg | bottom center | Plat open, rust |

**Keyframes — Licht-effect:**

| Tijd | `opacity` | `scaleY` | `filter` | Beschrijving |
|---|---|---|---|---|
| 500ms (0%) | 0 | 0 | — | Geen licht |
| 650ms (30%) | 0.4 | 0.3 | `blur(20px)` | Eerste gloed |
| 800ms (60%) | 0.9 | 1 | `blur(40px)` | Volle lichtbundel omhoog |
| 1000ms (100%) | 0.6 | 1.2 | `blur(60px)` | Licht spreidt, wordt zachter |

Het licht is een verticale gradient-strip (`120px breed`, vanuit de opening omhoog), met kleur gebaseerd op tier:
- Standaard: `#ff6b00` → `#ff6b0000` (OW-oranje)
- Brons: `#cd7f32` → `#cd7f3200`
- Zilver: `#e8e8e8` → `#e8e8e800`
- Goud: `#ffd700` → `#ffd70000`

**Framer Motion:**

```tsx
// Envelop flap (3D perspective vereist op parent)
<motion.div
  style={{ transformOrigin: "bottom center", perspective: 800 }}
  initial={{ rotateX: 0 }}
  animate={{ rotateX: -180 }}
  transition={{
    duration: 0.5,
    ease: [0.34, 1.56, 0.64, 1],
    delay: 0.5,
  }}
>
  {/* Flap SVG */}
</motion.div>

// Lichtbundel
<motion.div
  className="absolute left-1/2 -translate-x-1/2 w-[120px] origin-bottom"
  style={{
    background: `linear-gradient(to top, ${tierColor}, transparent)`,
  }}
  initial={{ opacity: 0, scaleY: 0 }}
  animate={{ opacity: 0.6, scaleY: 1.2 }}
  transition={{
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1],
    delay: 0.5,
  }}
/>
```

**CSS fallback:**

```css
@keyframes flap-open {
  0%   { transform: rotateX(0deg); }
  40%  { transform: rotateX(-170deg); }
  70%  { transform: rotateX(-185deg); }
  100% { transform: rotateX(-180deg); }
}

.envelope-flap {
  transform-origin: bottom center;
  animation: flap-open 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 500ms forwards;
}

@keyframes light-burst {
  0%   { opacity: 0; transform: scaleY(0); filter: blur(0px); }
  30%  { opacity: 0.4; transform: scaleY(0.3); filter: blur(20px); }
  60%  { opacity: 0.9; transform: scaleY(1); filter: blur(40px); }
  100% { opacity: 0.6; transform: scaleY(1.2); filter: blur(60px); }
}

.envelope-light {
  transform-origin: bottom center;
  animation: light-burst 500ms cubic-bezier(0.16, 1, 0.3, 1) 500ms forwards;
}
```

**Reduced motion:** Flap verdwijnt via crossfade (200ms). Licht-effect als eenvoudige opacity fade (geen scale/blur).

**Sound cue:** Papier-scheuren/openen geluid (150ms) bij 500ms. Bij de lichtburst een zacht "shimmer" geluid (hoge frequentie, 200ms, reverb).

**Haptic:** Light impact bij 500ms (flap begint), medium impact bij 750ms (licht op volle sterkte).

---

### Fase 3: Kaart verschijnt (1000–1500ms)

**Beschrijving:** De spelerskaart rijst vanuit de geopende envelop omhoog en draait van een platte "rug-aanzicht" (90deg) naar face-up (0deg). Tegelijkertijd verdwijnt de envelop naar achteren. De kaart toont op dit moment alleen de achtergrond, foto en naam — de stats zijn nog leeg/verborgen.

- **Trigger:** Automatisch na fase 2
- **Duration:** 500ms
- **Easing:** `springs.dramatic` = `{ type: "spring", stiffness: 150, damping: 12, mass: 1.5 }`

**Keyframes — Kaart:**

| Tijd | `translateY` | `rotateY` | `scale` | `opacity` | Beschrijving |
|---|---|---|---|---|---|
| 1000ms (0%) | 0px | 90deg | 0.6 | 0 | In de envelop, zijkant, klein |
| 1100ms (20%) | -60px | 60deg | 0.8 | 1 | Rijst, begint te draaien |
| 1300ms (60%) | -180px | 10deg | 1.05 | 1 | Bijna face-up, lichte overshoot in grootte |
| 1500ms (100%) | -200px | 0deg | 1 | 1 | Volledig face-up, eindpositie boven envelop |

**Keyframes — Envelop verdwijnt:**

| Tijd | `opacity` | `scale` | `translateY` | Beschrijving |
|---|---|---|---|---|
| 1000ms (0%) | 1 | 1 | 0 | Nog zichtbaar |
| 1500ms (100%) | 0 | 0.8 | 30px | Verdwenen naar achteren/beneden |

**3D-configuratie:**
- Parent container: `perspective: 1200px`
- Kaart: `transform-style: preserve-3d`
- Kaart-rug: `backface-visibility: hidden` op het front-face element

**Framer Motion:**

```tsx
// Parent met perspective
<motion.div style={{ perspective: 1200 }}>

  {/* Kaart */}
  <motion.div
    style={{ transformStyle: "preserve-3d" }}
    initial={{
      y: 0,
      rotateY: 90,
      scale: 0.6,
      opacity: 0,
    }}
    animate={{
      y: -200,
      rotateY: 0,
      scale: 1,
      opacity: 1,
    }}
    transition={{
      type: "spring",
      stiffness: 150,
      damping: 12,
      mass: 1.5,
      delay: 1.0,
    }}
  >
    <PlayerCard showStats={false} />
  </motion.div>

  {/* Envelop fade-out */}
  <motion.div
    initial={{ opacity: 1, scale: 1, y: 0 }}
    animate={{ opacity: 0, scale: 0.8, y: 30 }}
    transition={{
      duration: 0.5,
      ease: [0.55, 0, 1, 0.45],
      delay: 1.0,
    }}
  >
    <Envelope open />
  </motion.div>

</motion.div>
```

**CSS fallback:**

```css
@keyframes card-rise {
  0%   { opacity: 0; transform: translateY(0) rotateY(90deg) scale(0.6); }
  20%  { opacity: 1; transform: translateY(-60px) rotateY(60deg) scale(0.8); }
  60%  { opacity: 1; transform: translateY(-180px) rotateY(10deg) scale(1.05); }
  100% { opacity: 1; transform: translateY(-200px) rotateY(0deg) scale(1); }
}

.card-reveal {
  transform-style: preserve-3d;
  animation: card-rise 500ms cubic-bezier(0.34, 1.56, 0.64, 1) 1000ms forwards;
}

@keyframes envelope-exit {
  0%   { opacity: 1; transform: scale(1) translateY(0); }
  100% { opacity: 0; transform: scale(0.8) translateY(30px); }
}

.envelope-exit {
  animation: envelope-exit 500ms cubic-bezier(0.55, 0, 1, 0.45) 1000ms forwards;
}
```

**Reduced motion:** Kaart fades in op eindpositie (200ms crossfade). Geen 3D rotatie, geen Y-movement.

**Sound cue:** "Swoosh" met stijgende pitch (300ms) bij 1000ms. Subtiele "kling" bij 1500ms als de kaart face-up is.

**Haptic:** Medium impact bij 1000ms (kaart begint), heavy impact bij 1500ms (kaart is face-up — dit is het grote moment).

---

### Fase 4: Stats reveal (1500–2500ms)

**Beschrijving:** De 6 stats op de kaart verschijnen sequentieel, van boven naar beneden. Elke stat heeft een label (bijv. "Techniek") en een numerieke waarde. De waarde telt op van 0 naar de eindwaarde in een counter-animatie. De stats-bar vult zich tegelijkertijd.

**6 stats** (voorbeeld): Techniek, Inzet, Samenspel, Verdedigen, Aanvallen, Spelvisie.

- **Trigger:** Automatisch na fase 3
- **Duration totaal:** 1000ms
- **Stagger per stat:** 120ms (6 stats x 120ms = 720ms, laatste stat is klaar bij ~2400ms)
- **Counter duration per stat:** 400ms
- **Easing counter:** `cubic-bezier(0.16, 1, 0.3, 1)` (snelle start, zachte afronding)
- **Easing bar fill:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (lichte overshoot)

**Keyframes per stat-rij:**

| Relatieve tijd | `opacity` | `translateX` | Bar `scaleX` | Counter | Beschrijving |
|---|---|---|---|---|---|
| 0ms | 0 | -20px | 0 | 0 | Onzichtbaar, links |
| 100ms | 1 | 0 | 0 | 0 | Label zichtbaar, op positie |
| 100-500ms | 1 | 0 | 0 → eindwaarde | 0 → eindwaarde | Bar vult, counter telt |
| 500ms | 1 | 0 | eindwaarde | eindwaarde | Klaar |

**Stagger-schema:**

| Stat # | Start (absoluut) | Label zichtbaar | Counter klaar |
|---|---|---|---|
| 1 | 1500ms | 1600ms | 1900ms |
| 2 | 1620ms | 1720ms | 2020ms |
| 3 | 1740ms | 1840ms | 2140ms |
| 4 | 1860ms | 1960ms | 2260ms |
| 5 | 1980ms | 2080ms | 2380ms |
| 6 | 2100ms | 2200ms | 2500ms |

**Counter-animatie implementatie:**

```typescript
// useAnimatedCounter hook
function useAnimatedCounter(
  target: number,
  duration: number = 400,
  delay: number = 0,
) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = performance.now();
      const easing = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic

      function tick(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);
        setValue(Math.round(easedProgress * target));

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      }

      requestAnimationFrame(tick);
    }, delay);

    return () => clearTimeout(timeout);
  }, [target, duration, delay]);

  return value;
}
```

**Framer Motion:**

```tsx
<motion.div
  variants={{
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 1.5,
      },
    },
  }}
  initial="hidden"
  animate="visible"
>
  {stats.map((stat) => (
    <motion.div
      key={stat.label}
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.1,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
    >
      <span className="stat-label">{stat.label}</span>

      {/* Bar fill */}
      <motion.div
        className="stat-bar-fill"
        variants={{
          hidden: { scaleX: 0 },
          visible: {
            scaleX: stat.value / stat.max,
            transition: {
              duration: 0.4,
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.1, /* na label verschijnt */
            },
          },
        }}
        style={{ transformOrigin: "left center" }}
      />

      {/* Counter */}
      <AnimatedCounter target={stat.value} duration={400} />
    </motion.div>
  ))}
</motion.div>
```

**CSS fallback:**

```css
@keyframes stat-slide-in {
  0%   { opacity: 0; transform: translateX(-20px); }
  100% { opacity: 1; transform: translateX(0); }
}

@keyframes stat-bar-fill {
  0%   { transform: scaleX(0); }
  100% { transform: scaleX(var(--stat-fill)); }
}

.stat-row {
  animation: stat-slide-in 100ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.stat-row:nth-child(1) { animation-delay: 1500ms; }
.stat-row:nth-child(2) { animation-delay: 1620ms; }
.stat-row:nth-child(3) { animation-delay: 1740ms; }
.stat-row:nth-child(4) { animation-delay: 1860ms; }
.stat-row:nth-child(5) { animation-delay: 1980ms; }
.stat-row:nth-child(6) { animation-delay: 2100ms; }

.stat-bar-fill {
  transform-origin: left center;
  animation: stat-bar-fill 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.stat-row:nth-child(1) .stat-bar-fill { animation-delay: 1600ms; }
.stat-row:nth-child(2) .stat-bar-fill { animation-delay: 1720ms; }
.stat-row:nth-child(3) .stat-bar-fill { animation-delay: 1840ms; }
.stat-row:nth-child(4) .stat-bar-fill { animation-delay: 1960ms; }
.stat-row:nth-child(5) .stat-bar-fill { animation-delay: 2080ms; }
.stat-row:nth-child(6) .stat-bar-fill { animation-delay: 2200ms; }
```

**Reduced motion:** Alle stats verschijnen tegelijk via `opacity 0 → 1` (200ms). Counters tonen direct eindwaarde. Bars op eindpositie.

**Sound cue:** Per stat een kort "tick" geluid (30ms, toonhoogte stijgt per stat). Na de laatste stat een zacht "complete" chime (200ms).

**Haptic:** Light impact per stat-verschijning (6x).

---

### Fase 5: Tier reveal (2500–3000ms)

**Beschrijving:** Als de kaart een brons-, zilver- of goud-tier heeft, flitst de kaartrand op in de tier-kleur. Een shimmer-effect loopt over de hele kaart. Bij standaard-tier (geen bijzondere tier) wordt deze fase overgeslagen.

- **Trigger:** Automatisch na fase 4 (alleen als tier > standaard)
- **Duration:** 500ms
- **Easing shimmer:** lineair (constante snelheid over de kaart)
- **Easing glow:** `cubic-bezier(0.16, 1, 0.3, 1)`

**Keyframes — Rand-glow:**

| Tijd | `box-shadow` | `border-color` | Beschrijving |
|---|---|---|---|
| 2500ms (0%) | `0 0 0 0 transparent` | `transparent` | Geen glow |
| 2600ms (20%) | `0 0 30px 8px ${tierGlow}` | `${tierColor}` | Flash op volle sterkte |
| 2750ms (50%) | `0 0 20px 4px ${tierGlow}` | `${tierColor}` | Iets zachter |
| 3000ms (100%) | `0 0 12px 2px ${tierGlow}` | `${tierColor}` | Subtiele permanente glow |

**Keyframes — Shimmer sweep:**

Een diagonale highlight-band (45deg, 60px breed, wit 30% opacity) beweegt van links-onder naar rechts-boven over de kaart:

| Tijd | `translateX` | `translateY` | Beschrijving |
|---|---|---|---|
| 2500ms (0%) | -100% | 100% | Onder links, buiten kaart |
| 3000ms (100%) | 100% | -100% | Boven rechts, buiten kaart |

**Shimmer CSS:**

```css
.tier-shimmer {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}

.tier-shimmer::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 40%,
    rgba(255, 255, 255, 0.3) 48%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.3) 52%,
    transparent 60%
  );
  transform: translateX(-100%) translateY(100%);
  animation: shimmer-sweep 500ms linear 2500ms forwards;
}

@keyframes shimmer-sweep {
  0%   { transform: translateX(-100%) translateY(100%); }
  100% { transform: translateX(100%) translateY(-100%); }
}
```

**Framer Motion:**

```tsx
{tier !== "standaard" && (
  <>
    {/* Rand glow */}
    <motion.div
      className="absolute inset-0 rounded-2xl pointer-events-none"
      initial={{
        boxShadow: "0 0 0 0 transparent",
        borderColor: "transparent",
      }}
      animate={{
        boxShadow: [
          "0 0 0 0 transparent",
          `0 0 30px 8px ${tierGlowColor}`,
          `0 0 20px 4px ${tierGlowColor}`,
          `0 0 12px 2px ${tierGlowColor}`,
        ],
        borderColor: tierColor,
      }}
      transition={{
        duration: 0.5,
        delay: 2.5,
        times: [0, 0.2, 0.5, 1],
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ border: "2px solid transparent" }}
    />

    {/* Shimmer */}
    <motion.div
      className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2.5, duration: 0.05 }}
    >
      <motion.div
        className="absolute -inset-1/2 w-[200%] h-[200%]"
        style={{
          background:
            "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.3) 48%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 52%, transparent 60%)",
        }}
        initial={{ x: "-100%", y: "100%" }}
        animate={{ x: "100%", y: "-100%" }}
        transition={{
          duration: 0.5,
          delay: 2.5,
          ease: "linear",
        }}
      />
    </motion.div>
  </>
)}
```

**Tier-kleur mapping:**

```typescript
const tierColors = {
  brons:  { color: "#cd7f32", glow: "rgba(205, 127, 50, 0.4)" },
  zilver: { color: "#c0c0c0", glow: "rgba(192, 192, 192, 0.4)" },
  goud:   { color: "#ffd700", glow: "rgba(255, 215, 0, 0.4)" },
} as const;
```

**Reduced motion:** Rand verandert direct naar tier-kleur (geen glow-animatie). Shimmer overgeslagen.

**Sound cue:** Per tier verschilt het geluid:
- Brons: kort metaalachtig "ting" (150ms, mid frequency)
- Zilver: helder "kling" (200ms, hogere frequency, lichte reverb)
- Goud: rijke "resonant chime" (400ms, hoog + reverb + sustain)

**Haptic:**
- Brons: medium impact
- Zilver: heavy impact
- Goud: heavy impact + 100ms pauze + medium impact (dubbele tap)

---

### Fase 6: Settle (3000–3500ms)

**Beschrijving:** De kaart zakt subtiel naar beneden naar zijn definitieve rustpositie en schuift van het midden van het scherm naar de uiteindelijke positie in de UI. Een zachte schaduw verschijnt onder de kaart.

- **Trigger:** Automatisch na fase 5 (of fase 4 als tier = standaard)
- **Duration:** 500ms
- **Easing:** `springs.bouncy` = `{ type: "spring", stiffness: 300, damping: 15, mass: 1 }`

**Keyframes:**

| Tijd | `translateY` | `scale` | `box-shadow` | Beschrijving |
|---|---|---|---|---|
| 3000ms (0%) | -200px (van fase 3) | 1 | `0 2px 4px rgba(0,0,0,0.1)` | Kaart boven |
| 3200ms (40%) | finale + 8px | 0.98 | `0 8px 24px rgba(0,0,0,0.15)` | Iets voorbij eindpositie, lichte squeeze |
| 3350ms (70%) | finale - 3px | 1.01 | `0 4px 12px rgba(0,0,0,0.12)` | Bounce terug, lichte stretch |
| 3500ms (100%) | finale | 1 | `0 4px 16px rgba(0,0,0,0.12)` | Rustpositie |

**Parallel: backdrop verwijderen:**

| Tijd | Backdrop `opacity` | Beschrijving |
|---|---|---|
| 3000ms | 0.85 | Nog donker |
| 3500ms | 0 | Volledig verdwenen |

**Framer Motion:**

```tsx
// Kaart settle
<motion.div
  animate={{
    y: finalPosition,
    scale: 1,
  }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 15,
    mass: 1,
    delay: 3.0,
  }}
/>

// Backdrop verdwijnt
<motion.div
  animate={{ opacity: 0 }}
  transition={{
    duration: 0.5,
    delay: 3.0,
    ease: [0.55, 0, 1, 0.45],
  }}
/>
```

**Reduced motion:** Kaart verplaatst naar eindpositie via `opacity 1 → 0 → 1` crossfade (150ms). Geen bounce.

**Sound cue:** Zachte "land" thud (80ms, lage frequentie) bij 3200ms.

**Haptic:** Light impact bij 3200ms (landing).

---

### Pack Opening: volledige orchestratie

```tsx
// PackOpeningOverlay.tsx — Orchestrator component

import { AnimatePresence, motion } from "framer-motion";

type Phase = "envelope" | "opening" | "card" | "stats" | "tier" | "settle";

export function PackOpeningOverlay({
  player,
  tier,
  stats,
  onComplete,
}: PackOpeningProps) {
  const [phase, setPhase] = useState<Phase>("envelope");

  // Fase-volgorde met delays
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("opening"), 500),
      setTimeout(() => setPhase("card"), 1000),
      setTimeout(() => setPhase("stats"), 1500),
      setTimeout(() => setPhase("tier"), 2500),
      setTimeout(() => setPhase("settle"), 3000),
      setTimeout(() => onComplete(), 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Haptic feedback per fase
  useEffect(() => {
    const haptics: Record<Phase, HapticPattern> = {
      envelope: "medium",
      opening:  "light",
      card:     "heavy",
      stats:    "light",
      tier:     tier === "goud" ? "double-heavy" : "medium",
      settle:   "light",
    };
    triggerHaptic(haptics[phase]);
  }, [phase, tier]);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        {/* Envelope */}
        {/* Light burst */}
        {/* Card */}
        {/* Stats */}
        {/* Tier effects */}
        {/* ... zie individuele fase-specs hierboven */}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 4. Score-invoer feedback

### 4.1 Smiley selecteren

- **Trigger:** Gebruiker tikt op een smiley-icoon (1 van 5) bij een evaluatievraag
- **Duration:** 250ms
- **Easing:** `springs.snappy` = `{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }`

**Keyframes:**

| Tijd | `scale` | `opacity` (kleurvlak) | `background-color` | Beschrijving |
|---|---|---|---|---|
| 0ms | 1 | 0 | huidige kleur | Rusttoestand |
| 80ms | 1.3 | 0.5 | nieuwe kleur | Pop omhoog, kleur begint |
| 160ms | 0.95 | 0.9 | nieuwe kleur | Squeeze terug |
| 250ms | 1 | 1 | nieuwe kleur | Settle op nieuwe kleur |

**Kleur per smiley:**

| Smiley | Kleur | Hex |
|---|---|---|
| 1 (slecht) | Rood | `#f44336` |
| 2 (matig) | Oranje-rood | `#ff7043` |
| 3 (gemiddeld) | Geel | `#ffc107` |
| 4 (goed) | Lichtgroen | `#8bc34a` |
| 5 (uitstekend) | Groen | `#4caf50` |

**Deselect vorige smiley** (parallel):
- `scale: 1 → 0.9 → 1`, `opacity: 1 → 0.5`, duur 150ms

**Framer Motion:**

```tsx
<motion.button
  whileTap={{ scale: 0.9 }}
  animate={
    isSelected
      ? { scale: [1, 1.3, 0.95, 1], backgroundColor: smileyColor }
      : { scale: [1, 0.9, 1], opacity: 0.5 }
  }
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  }}
>
  <SmileyIcon level={level} />
</motion.button>
```

**Reduced motion:** Directe kleurswitch (geen scale). `transition: background-color 150ms ease`.

**Sound cue:** Zacht "pop" geluid (50ms). Pitch stijgt per smiley-level (1=laag, 5=hoog).

**Haptic:** Light impact bij selectie. Bij smiley 5 (uitstekend): medium impact.

---

### 4.2 Ster invullen (rating)

- **Trigger:** Gebruiker tikt op een ster in een 5-sterren rating
- **Duration:** 400ms totaal (trail-effect)
- **Easing per ster:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (bounce)
- **Stagger:** 60ms per ster (van links naar rechts)

**Keyframes per ster (wanneer deze ingevuld wordt):**

| Relatieve tijd | `scale` | `opacity` | `color` | `filter` | Beschrijving |
|---|---|---|---|---|---|
| 0ms | 0.5 | 0.3 | `#d1d5db` (grijs) | — | Leeg |
| 60ms | 1.4 | 1 | `#ffd700` (goud) | `drop-shadow(0 0 6px #ffd70088)` | Pop + glow |
| 150ms | 0.9 | 1 | `#ffd700` | `drop-shadow(0 0 3px #ffd70066)` | Squeeze |
| 250ms | 1 | 1 | `#ffd700` | `drop-shadow(0 0 2px #ffd70044)` | Settle |

**Trail-effect:** Wanneer ster 4 getikt wordt, animeren sterren 1-4 sequentieel:
- Ster 1: start 0ms
- Ster 2: start 60ms
- Ster 3: start 120ms
- Ster 4: start 180ms (de getapte ster)

**Sterren die leeg worden** (bijv. van 4 naar 2):
- Sterren 3-4: `scale 1 → 0.8 → 1`, `color #ffd700 → #d1d5db`, `filter drop-shadow → none`, 150ms

**Framer Motion:**

```tsx
{stars.map((star, index) => (
  <motion.div
    key={index}
    animate={
      index < selectedRating
        ? {
            scale: [0.5, 1.4, 0.9, 1],
            color: "#ffd700",
            filter: [
              "drop-shadow(0 0 0 transparent)",
              "drop-shadow(0 0 6px rgba(255,215,0,0.53))",
              "drop-shadow(0 0 3px rgba(255,215,0,0.4))",
              "drop-shadow(0 0 2px rgba(255,215,0,0.27))",
            ],
          }
        : {
            scale: [1, 0.8, 1],
            color: "#d1d5db",
            filter: "none",
          }
    }
    transition={{
      duration: 0.25,
      ease: [0.34, 1.56, 0.64, 1],
      delay: index * 0.06,
    }}
  >
    <StarIcon />
  </motion.div>
))}
```

**CSS fallback:**

```css
@keyframes star-fill {
  0%   { transform: scale(0.5); color: #d1d5db; filter: none; }
  25%  { transform: scale(1.4); color: #ffd700; filter: drop-shadow(0 0 6px rgba(255,215,0,0.53)); }
  60%  { transform: scale(0.9); color: #ffd700; filter: drop-shadow(0 0 3px rgba(255,215,0,0.4)); }
  100% { transform: scale(1);   color: #ffd700; filter: drop-shadow(0 0 2px rgba(255,215,0,0.27)); }
}

.star-fill {
  animation: star-fill 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.star-fill:nth-child(1) { animation-delay: 0ms; }
.star-fill:nth-child(2) { animation-delay: 60ms; }
.star-fill:nth-child(3) { animation-delay: 120ms; }
.star-fill:nth-child(4) { animation-delay: 180ms; }
.star-fill:nth-child(5) { animation-delay: 240ms; }
```

**Reduced motion:** Sterren kleuren direct in (geen scale, geen glow). 100ms color transition.

**Sound cue:** Oplopend "pling" per ster (frequentie +50Hz per ster). Duur 40ms per pling.

**Haptic:** Light impact per ster die ingevuld wordt.

---

### 4.3 Slider bewegen

- **Trigger:** Gebruiker sleept een slider (bijv. score 1-10)
- **Duration:** Continu (realtime bij slepen)
- **Easing counter:** `springs.snappy` voor de numerieke waarde-weergave

**Visueel gedrag:**

1. **Slider thumb:** Vergroot bij touch-start (`scale 1 → 1.2`, 100ms, `ease-out`)
2. **Numerieke waarde boven thumb:** Zweeft boven de slider, update realtime
3. **Track kleur-shift:** De gevulde track verandert van kleur op basis van range:

| Range | Kleur | Hex |
|---|---|---|
| 1-3 | Rood → Oranje | `#f44336` → `#ff7043` |
| 4-6 | Oranje → Geel | `#ff7043` → `#ffc107` |
| 7-8 | Geel → Lichtgroen | `#ffc107` → `#8bc34a` |
| 9-10 | Lichtgroen → Groen | `#8bc34a` → `#4caf50` |

4. **Counter boven slider:** Getal "rolt" mee (counter-animatie, 60fps via `requestAnimationFrame`), schaalt licht op bij verandering (`scale 1 → 1.15 → 1`, 100ms)

**Framer Motion:**

```tsx
// Slider thumb
<motion.div
  animate={{
    scale: isDragging ? 1.2 : 1,
    boxShadow: isDragging
      ? "0 0 12px rgba(255,107,0,0.4)"
      : "0 2px 4px rgba(0,0,0,0.1)",
  }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  }}
/>

// Floating value label
<motion.span
  key={currentValue} // re-mount triggert animatie
  initial={{ scale: 1.15, y: -2 }}
  animate={{ scale: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
  style={{ color: getColorForValue(currentValue) }}
>
  {currentValue}
</motion.span>
```

**Track kleur-implementatie:**

```css
.slider-track-fill {
  background: linear-gradient(
    to right,
    #f44336 0%,
    #ff7043 30%,
    #ffc107 50%,
    #8bc34a 75%,
    #4caf50 100%
  );
  /* Clip naar huidige waarde met scaleX */
  transform-origin: left center;
  transform: scaleX(var(--slider-progress));
  transition: transform 16ms linear; /* 60fps */
}
```

**Reduced motion:** Thumb vergroot niet. Counter toont direct waarde (geen roll-animatie). Kleur-shift blijft (is informatief, niet decoratief).

**Sound cue:** Zachte ticks bij hele getallen (zoals een Geiger-counter), volume 20%. Optioneel, standaard uit.

**Haptic:** Light impact bij elke hele getal-overgang tijdens slepen.

---

## 5. Kaart-update

### 5.1 Overall-getal update

- **Trigger:** Nieuwe evaluatie verwerkt, overall score verandert
- **Duration:** 600ms
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`

**Counter-animatie:**

Het overall-getal (bijv. "7.2") telt op of af naar de nieuwe waarde in stappen van 0.1. De kleur flasht kort groen (stijging) of rood (daling).

**Keyframes:**

| Tijd | Counter | `color` | `scale` | Beschrijving |
|---|---|---|---|---|
| 0ms | oude waarde | standaard | 1 | Start |
| 50ms | — | groen/rood flash | 1.15 | Kleur-hint + pop |
| 50-500ms | telt op/af | groen/rood | 1.15 → 1.05 | Counter loopt |
| 500ms | nieuwe waarde | groen/rood | 1.05 | Eindwaarde bereikt |
| 600ms | nieuwe waarde | standaard | 1 | Terug naar normaal |

**Framer Motion:**

```tsx
<motion.span
  key={`overall-${overallScore}`}
  initial={{ scale: 1, color: "var(--color-text)" }}
  animate={{
    scale: [1, 1.15, 1.05, 1],
    color: [
      "var(--color-text)",
      direction === "up" ? "#4caf50" : "#f44336",
      direction === "up" ? "#4caf50" : "#f44336",
      "var(--color-text)",
    ],
  }}
  transition={{
    duration: 0.6,
    times: [0, 0.08, 0.83, 1],
    ease: [0.16, 1, 0.3, 1],
  }}
>
  <AnimatedCounter
    from={previousScore}
    to={overallScore}
    decimals={1}
    duration={450}
    delay={50}
  />
</motion.span>
```

**Reduced motion:** Getal springt direct naar nieuwe waarde. Subtiele kleur-flash (200ms) is toegestaan (informatief).

**Sound cue:** Oplopende/aflopende toon-reeks (arpeggio, 300ms). Omhoog = stijgende noten. Omlaag = dalende noten.

**Haptic:** Medium impact bij start van de update.

---

### 5.2 Stat glow pulse (stijging/daling)

- **Trigger:** Individuele stat stijgt of daalt bij update
- **Duration:** 800ms
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`

**Stijging (groen pulse):**

| Tijd | `box-shadow` | `background-color` | Beschrijving |
|---|---|---|---|
| 0ms | none | standaard | Rusttoestand |
| 100ms | `0 0 12px 4px rgba(76,175,80,0.3)` | `rgba(76,175,80,0.08)` | Groene glow piek |
| 400ms | `0 0 8px 2px rgba(76,175,80,0.15)` | `rgba(76,175,80,0.04)` | Glow neemt af |
| 800ms | none | standaard | Terug naar normaal |

**Daling (rode pulse):**

| Tijd | `box-shadow` | `background-color` | Beschrijving |
|---|---|---|---|
| 0ms | none | standaard | Rusttoestand |
| 100ms | `0 0 12px 4px rgba(244,67,54,0.3)` | `rgba(244,67,54,0.08)` | Rode glow piek |
| 400ms | `0 0 8px 2px rgba(244,67,54,0.15)` | `rgba(244,67,54,0.04)` | Glow neemt af |
| 800ms | none | standaard | Terug naar normaal |

**Framer Motion:**

```tsx
<motion.div
  animate={
    delta > 0
      ? {
          boxShadow: [
            "0 0 0 0 transparent",
            "0 0 12px 4px rgba(76,175,80,0.3)",
            "0 0 8px 2px rgba(76,175,80,0.15)",
            "0 0 0 0 transparent",
          ],
          backgroundColor: [
            "transparent",
            "rgba(76,175,80,0.08)",
            "rgba(76,175,80,0.04)",
            "transparent",
          ],
        }
      : delta < 0
        ? {
            boxShadow: [
              "0 0 0 0 transparent",
              "0 0 12px 4px rgba(244,67,54,0.3)",
              "0 0 8px 2px rgba(244,67,54,0.15)",
              "0 0 0 0 transparent",
            ],
            backgroundColor: [
              "transparent",
              "rgba(244,67,54,0.08)",
              "rgba(244,67,54,0.04)",
              "transparent",
            ],
          }
        : {}
  }
  transition={{
    duration: 0.8,
    times: [0, 0.125, 0.5, 1],
    ease: [0.16, 1, 0.3, 1],
  }}
/>
```

**CSS fallback:**

```css
@keyframes stat-glow-up {
  0%    { box-shadow: 0 0 0 0 transparent; background-color: transparent; }
  12.5% { box-shadow: 0 0 12px 4px rgba(76,175,80,0.3); background-color: rgba(76,175,80,0.08); }
  50%   { box-shadow: 0 0 8px 2px rgba(76,175,80,0.15); background-color: rgba(76,175,80,0.04); }
  100%  { box-shadow: 0 0 0 0 transparent; background-color: transparent; }
}

@keyframes stat-glow-down {
  0%    { box-shadow: 0 0 0 0 transparent; background-color: transparent; }
  12.5% { box-shadow: 0 0 12px 4px rgba(244,67,54,0.3); background-color: rgba(244,67,54,0.08); }
  50%   { box-shadow: 0 0 8px 2px rgba(244,67,54,0.15); background-color: rgba(244,67,54,0.04); }
  100%  { box-shadow: 0 0 0 0 transparent; background-color: transparent; }
}

.stat-up   { animation: stat-glow-up 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.stat-down { animation: stat-glow-down 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
```

**Reduced motion:** Geen glow. Stat-rij toont een klein pijltje-icoon (omhoog groen / omlaag rood) gedurende 2 seconden.

**Sound cue:** Geen (te veel stats tegelijk zou chaotisch klinken).

**Haptic:** Geen (onderdeel van grotere kaart-update flow).

---

### 5.3 Tier-verandering (3D flip met shimmer)

- **Trigger:** Overall-score passeert een tier-grens (bijv. brons → zilver)
- **Duration:** 1200ms
- **Easing flip:** `springs.dramatic` = `{ stiffness: 150, damping: 12, mass: 1.5 }`

**Beschrijving:** De kaart flipt 180deg om zijn Y-as. Halverwege de flip (bij 90deg, wanneer de kaart "op zijn kant" staat) wisselt de tier-styling. Na de flip volgt een shimmer-burst.

**Keyframes:**

| Tijd | `rotateY` | `scale` | Visueel | Beschrijving |
|---|---|---|---|---|
| 0ms | 0deg | 1 | Oude tier | Start |
| 300ms | 85deg | 1.05 | Oude tier (bijna op kant) | Opbouw spanning |
| 350ms | 90deg | 1.08 | — | Kaart op kant, tier-swap |
| 400ms | 95deg | 1.05 | Nieuwe tier | Net voorbij halverwege |
| 700ms | 175deg | 1.02 | Nieuwe tier | Bijna face-up |
| 900ms | 183deg | 1 | Nieuwe tier | Lichte overshoot |
| 1200ms | 180deg | 1 | Nieuwe tier + shimmer | Settle + shimmer-burst |

**Shimmer-burst bij 900ms:**
- Identiek aan tier-reveal shimmer uit sectie 3.5
- Extra: 8-12 kleine "sparkle" particles vanuit het midden van de kaart, radiaal naar buiten
- Particle specs: `4px` cirkel, `opacity 1 → 0`, `scale 0 → 1`, `translateX/Y: random 40-120px`, `rotation: random 0-360deg`, duur 600ms, `ease-out`

**Framer Motion:**

```tsx
<motion.div
  style={{ perspective: 1200, transformStyle: "preserve-3d" }}
  animate={{ rotateY: 180 }}
  transition={{
    type: "spring",
    stiffness: 150,
    damping: 12,
    mass: 1.5,
  }}
  onUpdate={(latest) => {
    // Swap tier styling bij 90deg
    const rotation = parseFloat(String(latest.rotateY));
    if (rotation >= 90 && !tierSwapped) {
      setTierSwapped(true);
    }
  }}
>
  <PlayerCard tier={tierSwapped ? newTier : oldTier} />
</motion.div>

{/* Sparkle particles */}
{tierSwapped && (
  <SparkleParticles
    count={10}
    colors={[tierColors[newTier].color, "#ffffff"]}
    radius={{ min: 40, max: 120 }}
    duration={600}
  />
)}
```

**Sparkle particle component:**

```tsx
function SparkleParticles({
  count,
  colors,
  radius,
  duration,
}: SparkleProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        angle: (360 / count) * i + Math.random() * 30,
        distance: radius.min + Math.random() * (radius.max - radius.min),
        size: 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
      })),
    [count, colors, radius],
  );

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: "50%",
            top: "50%",
          }}
          initial={{
            opacity: 1,
            scale: 0,
            x: 0,
            y: 0,
            rotate: 0,
          }}
          animate={{
            opacity: 0,
            scale: 1,
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            rotate: p.rotation,
          }}
          transition={{
            duration: duration / 1000,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </>
  );
}
```

**Reduced motion:** Geen 3D flip. Kaart crossfades (300ms) van oude naar nieuwe tier-styling. Geen particles.

**Sound cue:** "Woosh" bij start flip (200ms), "kling" bij tier-swap (150ms, pitch op basis van tier), shimmer sound bij 900ms (300ms, hoge frequentie).

**Haptic:** Medium impact bij start, heavy impact bij tier-swap (350ms), medium impact bij settle.

---

## 6. XP & Level-up

### 6.1 XP-balk fill

- **Trigger:** Speler ontvangt XP (na rapport, badge, etc.)
- **Duration:** 800ms
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`

**Beschrijving:** De XP-balk vult van links naar rechts. Aan de voorste rand (leading edge) brandt een glow-effect.

**Keyframes — Bar fill:**

| Tijd | `scaleX` | Leading edge glow | Beschrijving |
|---|---|---|---|
| 0ms | `var(--xp-old)` | — | Oude XP stand |
| 100ms | `var(--xp-old) + 0.01` | Verschijnt | Start fill |
| 700ms | `var(--xp-new)` | Op eindpositie | Fill compleet |
| 800ms | `var(--xp-new)` | Verdwijnt (200ms fade) | Glow dooft |

**Leading edge glow:**
- Positie: altijd aan de rechterrand van de gevulde bar
- Grootte: `12px breed`, `100% hoog`
- Kleur: `radial-gradient(ellipse, #ff6b0088, transparent)`
- Beweegt mee met de fill

**Framer Motion:**

```tsx
// XP bar container
<div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
  {/* Fill */}
  <motion.div
    className="absolute inset-y-0 left-0 rounded-full"
    style={{
      backgroundColor: "var(--color-xp-fill)",
      transformOrigin: "left center",
    }}
    initial={{ scaleX: oldXpFraction }}
    animate={{ scaleX: newXpFraction }}
    transition={{
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    }}
  />

  {/* Leading edge glow */}
  <motion.div
    className="absolute inset-y-0 w-3 rounded-full pointer-events-none"
    style={{
      background: "radial-gradient(ellipse at center, rgba(255,107,0,0.5), transparent)",
      filter: "blur(4px)",
    }}
    initial={{ left: `${oldXpFraction * 100}%`, opacity: 0 }}
    animate={{
      left: `${newXpFraction * 100}%`,
      opacity: [0, 1, 1, 0],
    }}
    transition={{
      left: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.8, times: [0, 0.1, 0.85, 1] },
    }}
  />
</div>
```

**CSS fallback:**

```css
@keyframes xp-fill {
  0%   { transform: scaleX(var(--xp-old)); }
  100% { transform: scaleX(var(--xp-new)); }
}

.xp-bar-fill {
  transform-origin: left center;
  animation: xp-fill 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

**Reduced motion:** Bar springt direct naar nieuwe waarde. Geen glow.

**Sound cue:** Zacht stijgend "whoosh" dat meespeelt met de fill (600ms, pitch stijgt van laag naar mid).

**Haptic:** Light impact bij start, light impact bij einde.

---

### 6.2 "+15 XP" float-up tekst

- **Trigger:** XP ontvangen (tegelijk met bar fill)
- **Duration:** 1200ms
- **Easing Y:** `cubic-bezier(0.16, 1, 0.3, 1)` (snelle stijging, vertraagt)
- **Easing opacity:** lineair (fade-out in laatste 30%)

**Keyframes:**

| Tijd | `translateY` | `opacity` | `scale` | Beschrijving |
|---|---|---|---|---|
| 0ms | 0px | 0 | 0.8 | Positie: net boven de actie die XP gaf |
| 100ms | -10px | 1 | 1.1 | Verschijnt, pop |
| 400ms | -40px | 1 | 1 | Stijgt, settle |
| 800ms | -60px | 1 | 1 | Nog zichtbaar |
| 1200ms | -80px | 0 | 0.9 | Verdwijnt naar boven |

**Framer Motion:**

```tsx
<motion.span
  className="absolute text-sm font-bold pointer-events-none"
  style={{ color: "var(--color-xp-text)" }}
  initial={{ y: 0, opacity: 0, scale: 0.8 }}
  animate={{ y: -80, opacity: [0, 1, 1, 0], scale: [0.8, 1.1, 1, 0.9] }}
  transition={{
    y: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
    opacity: { duration: 1.2, times: [0, 0.08, 0.67, 1] },
    scale: { duration: 1.2, times: [0, 0.08, 0.33, 1] },
  }}
  onAnimationComplete={() => unmount()}
>
  +{xpAmount} XP
</motion.span>
```

**Reduced motion:** Tekst verschijnt op positie, blijft 1s staan, verdwijnt. Geen movement.

**Sound cue:** Geen (valt samen met XP-balk sound).

**Haptic:** Geen (valt samen met XP-balk haptic).

---

### 6.3 Level-up

- **Trigger:** XP-balk bereikt 100% en reset naar 0%
- **Duration:** 2000ms (hele sequence)
- **Context:** Overlay/fullscreen moment

**Sub-animaties:**

#### a) XP-balk overloop (0–400ms)
- Bar vult naar 100%, flitst wit (`background-color: white`, 100ms), reset naar `scaleX(0)`
- Level-nummer begint te counteren

#### b) Burst-effect (200–800ms)
- 20-30 radiale particles vanuit het midden van het scherm
- Particle specs:
  - Vorm: mix van cirkels (3-6px) en sterren (8-12px)
  - Kleuren: OW-oranje, wit, goud
  - Richting: radiaal, random hoeken (0-360deg)
  - Afstand: 80-200px
  - Duur: 600ms
  - `opacity: 1 → 0`, `scale: 0 → 1.5 → 0.5`
  - Easing: `ease-out`

#### c) Level-nummer counter (200–800ms)
- Groot nummer in het midden van het scherm
- Telt van oud level naar nieuw level
- `scale: 0.5 → 1.2 → 1`, `opacity: 0 → 1`
- Font: bold, 72px
- Kleur: OW-oranje

#### d) Achievement toast (800–2000ms)
- Schuift in van boven: `translateY: -100px → 0`, `opacity: 0 → 1`
- Tekst: "Level {n} bereikt!"
- Achtergrond: OW-oranje met witte tekst
- Easing: `springs.bouncy`
- Verdwijnt bij 1800ms: `translateY: 0 → -100px`, `opacity: 1 → 0`

**Framer Motion:**

```tsx
// Level-up overlay orchestrator
function LevelUpCelebration({ oldLevel, newLevel }: LevelUpProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Burst particles */}
      <BurstParticles
        count={25}
        colors={["#ff6b00", "#ffffff", "#ffd700"]}
        radius={{ min: 80, max: 200 }}
        duration={600}
        delay={200}
        shapes={["circle", "star"]}
      />

      {/* Level nummer */}
      <motion.div
        className="text-7xl font-bold text-ow-oranje"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 1] }}
        transition={{
          duration: 0.6,
          delay: 0.2,
          ease: [0.34, 1.56, 0.64, 1],
          times: [0, 0.6, 1],
        }}
      >
        <AnimatedCounter from={oldLevel} to={newLevel} duration={600} />
      </motion.div>

      {/* Achievement toast */}
      <motion.div
        className="absolute top-8 bg-ow-oranje text-white px-6 py-3 rounded-xl shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 15,
          mass: 1,
          delay: 0.8,
        }}
      >
        Level {newLevel} bereikt!
      </motion.div>
    </motion.div>
  );
}
```

**Reduced motion:** Level-nummer verschijnt direct (crossfade 200ms). Geen particles. Toast fades in (200ms). Totale duur 600ms.

**Sound cue:** Fanfare-achtig geluid (800ms): snelle oplopende noten gevolgd door een akkoord. Volume: 80%.

**Haptic:** Heavy impact bij 200ms (burst). Medium impact bij 800ms (toast). Pattern: `[200, heavy], [400, pause], [800, medium]`.

---

## 7. Badge unlock

- **Trigger:** Scout ontgrendelt een nieuwe badge (na specifieke achievement)
- **Duration:** 2500ms (hele sequence)
- **Context:** Centered overlay met donkere achtergrond

### Sub-animaties:

#### a) Badge fly-in (0–600ms)

**Keyframes:**

| Tijd | `translateY` | `scale` | `rotate` | `opacity` | Beschrijving |
|---|---|---|---|---|---|
| 0ms | 300px | 0.3 | -180deg | 0 | Onder scherm, klein, ondersteboven |
| 200ms | 50px | 0.8 | -90deg | 0.8 | Stijgt snel |
| 400ms | -20px | 1.2 | -10deg | 1 | Overshoot boven midden |
| 600ms | 0px | 1 | 0deg | 1 | Settle op midden, face-up |

**Easing:** `springs.dramatic` = `{ stiffness: 150, damping: 12, mass: 1.5 }`

#### b) Badge spin & grow (200–600ms)

Geintegreerd in fly-in: badge draait 360deg (volledige rotatie) terwijl het groter wordt. De `rotate` in de tabel hierboven is de netto-rotatie; de werkelijke path is -180deg → +180deg = 360deg totaal.

#### c) Flash/glow bij landing (500–900ms)

| Tijd | `box-shadow` | `filter` | Beschrijving |
|---|---|---|---|
| 500ms | none | none | Net voor landing |
| 600ms | `0 0 40px 12px rgba(255,107,0,0.5)` | `brightness(1.5)` | Flash bij landing |
| 750ms | `0 0 20px 6px rgba(255,107,0,0.3)` | `brightness(1.2)` | Glow neemt af |
| 900ms | `0 0 8px 2px rgba(255,107,0,0.1)` | `brightness(1)` | Subtle restglow |

#### d) Confetti-burst (600–1600ms)

- **Start:** direct bij landing (600ms)
- **Particle count:** 40-60
- **Spread:** volle cirkel (360deg) vanuit badge-midden
- **Afstand:** 60-250px
- **Particle grootte:** 4-8px
- **Vormen:** rechthoeken (3:1 ratio), cirkels, driehoeken
- **Kleuren:** OW-oranje (#ff6b00), wit (#ffffff), goud (#ffd700), de band-kleur van de leeftijdsgroep
- **Physics:**
  - Initieel: radiale velocity
  - Gravity: `+0.5px/frame` (lichte val)
  - Rotation: random spin `±720deg/s`
  - `opacity: 1 → 0` over 1000ms
  - `scale: 1 → 0.5` over 1000ms
- **Easing:** lineair (physics-based)

```typescript
// Confetti particle generator
function generateConfettiParticles(count: number, colors: string[]) {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 150 + Math.random() * 250; // px/s
    const spin = (Math.random() - 0.5) * 1440; // deg/s

    return {
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity - 100, // upward bias
      gravity: 300, // px/s^2
      rotation: spin,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 4,
      shape: ["rect", "circle", "triangle"][Math.floor(Math.random() * 3)] as Shape,
      aspectRatio: 0.3 + Math.random() * 0.4,
    };
  });
}
```

#### e) Toast notification (800–2500ms)

- **Trigger:** 200ms na confetti start
- **Direction:** schuift in van boven
- **Duration in:** 400ms
- **Easing in:** `springs.bouncy`
- **Content:** Badge-icoon + naam + beschrijving
- **Stay:** 1000ms
- **Duration out:** 300ms
- **Easing out:** `ease-in`

**Keyframes in:**

| Tijd | `translateY` | `opacity` | Beschrijving |
|---|---|---|---|
| 800ms | -80px | 0 | Boven scherm |
| 1200ms | 0px | 1 | Op positie (spring bounce) |

**Keyframes uit:**

| Tijd | `translateY` | `opacity` | Beschrijving |
|---|---|---|---|
| 2200ms | 0px | 1 | Nog zichtbaar |
| 2500ms | -80px | 0 | Verdwenen |

**Framer Motion (volledige badge unlock):**

```tsx
function BadgeUnlockOverlay({ badge, bandColor }: BadgeUnlockProps) {
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Badge */}
        <motion.div
          className="relative z-10"
          initial={{
            y: 300,
            scale: 0.3,
            rotate: -180,
            opacity: 0,
          }}
          animate={{
            y: 0,
            scale: 1,
            rotate: 0,
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 12,
            mass: 1.5,
          }}
        >
          {/* Glow ring */}
          <motion.div
            className="absolute inset-[-20px] rounded-full pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.8, 0.3, 0.1],
              scale: [0.8, 1.2, 1.1, 1],
              boxShadow: [
                "0 0 0 0 transparent",
                "0 0 40px 12px rgba(255,107,0,0.5)",
                "0 0 20px 6px rgba(255,107,0,0.3)",
                "0 0 8px 2px rgba(255,107,0,0.1)",
              ],
            }}
            transition={{
              duration: 0.4,
              delay: 0.5,
              times: [0, 0.25, 0.63, 1],
            }}
          />

          <BadgeIcon badge={badge} size={96} />
        </motion.div>

        {/* Confetti */}
        <ConfettiBurst
          count={50}
          colors={["#ff6b00", "#ffffff", "#ffd700", bandColor]}
          delay={600}
          duration={1000}
          gravity={300}
        />

        {/* Toast */}
        <motion.div
          className="absolute top-12 bg-white rounded-2xl shadow-xl px-6 py-4 flex items-center gap-3 max-w-[90vw]"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 15,
            mass: 1,
            delay: 0.8,
          }}
        >
          <BadgeIcon badge={badge} size={32} />
          <div>
            <p className="font-bold text-gray-900">{badge.naam}</p>
            <p className="text-sm text-gray-500">{badge.beschrijving}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Reduced motion:** Badge verschijnt direct op positie (crossfade 200ms). Geen spin, geen fly-in. Glow is een subtiele border-color change. Geen confetti. Toast fades in (200ms).

**Sound cue:** "Achievement unlocked" geluid: korte fanfare (500ms) met een "kling" bij landing (200ms, hoge frequentie). Confetti: zacht "whoosh" (300ms).

**Haptic:** Heavy impact bij landing (600ms). Medium impact bij toast (800ms). Pattern: `[0, medium], [600, heavy], [800, medium]`.

---

## 8. Celebration (rapport indienen)

- **Trigger:** Scout drukt op "Verstuur" en het rapport wordt succesvol opgeslagen
- **Duration:** 3500ms+ (afhankelijk van sub-animaties)
- **Context:** In-page celebration, niet fullscreen

### Orchestratie

| Stap | Start | Animatie | Duur | Beschrijving |
|---|---|---|---|---|
| 1 | 0ms | Button success state | 400ms | Knop wordt groen met checkmark |
| 2 | 200ms | Confetti regen | 2000ms | Confetti valt van boven |
| 3 | 400ms | Kaart-flip (als update) | 1200ms | Oude kaart → nieuwe kaart |
| 4 | 600ms | XP counter | 800ms | "+15 XP" float + balk fill |
| 5 | 1600ms | Badge unlock (optioneel) | 2500ms | Als er een badge verdiend is |
| 6 | 3000ms | Pack opening redirect | 500ms | Navigeer naar pack opening als het een nieuwe kaart is |

### 8.1 Button success state

**Keyframes:**

| Tijd | `width` | `background-color` | Content | `scale` | Beschrijving |
|---|---|---|---|---|---|
| 0ms | 100% | OW-oranje | "Verstuur" | 1 | Normaal |
| 50ms | 100% | OW-oranje | "Verstuur" | 0.95 | Press down |
| 200ms | 48px (cirkel) | `#4caf50` | Spinner | 1 | Loading cirkel |
| 350ms | 48px | `#4caf50` | Checkmark | 1.1 | Succes! Pop |
| 400ms | 48px | `#4caf50` | Checkmark | 1 | Settle |

**Checkmark tekenen:**
- SVG path animatie: `stroke-dashoffset 100% → 0%` over 150ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`

**Framer Motion:**

```tsx
<motion.button
  animate={
    state === "success"
      ? { width: 48, backgroundColor: "#4caf50", scale: [1, 0.95, 1, 1.1, 1] }
      : { width: "100%", backgroundColor: "#ff6b00" }
  }
  transition={{
    width: { duration: 0.15, ease: [0.55, 0, 1, 0.45] },
    backgroundColor: { duration: 0.15 },
    scale: { duration: 0.4, times: [0, 0.13, 0.5, 0.88, 1] },
  }}
>
  {state === "success" ? (
    <motion.svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
      <motion.path
        d="M5 12l5 5L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.15, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    </motion.svg>
  ) : (
    "Verstuur"
  )}
</motion.button>
```

### 8.2 Confetti regen

- **Start:** 200ms na button success
- **Particle count:** 30-50
- **Spawn positie:** random over de volle breedte, boven het scherm (y = -20px)
- **Fall:** `translateY: -20px → viewport-hoogte + 20px`
- **Duration per particle:** 1500-2500ms (random)
- **Sway:** sinusvormige horizontale beweging, `amplitude: 20-40px`, `frequency: 2-3Hz`
- **Rotation:** continu draaien `0 → ±720deg`
- **Opacity:** `1 → 0` in laatste 20% van de fall
- **Kleuren:** Gebaseerd op de leeftijdsgroep van de speler:

| Leeftijdsgroep | Confetti kleuren |
|---|---|
| Mini's (blauw) | `#4a90d9`, `#ffffff`, `#ff6b00` |
| Jeugd (groen) | `#52b788`, `#ffffff`, `#ff6b00` |
| Aspiranten (geel) | `#f4d35e`, `#ffffff`, `#ff6b00` |
| Junioren (oranje) | `#f28c28`, `#ffffff`, `#ffd700` |
| Senioren (rood) | `#d62828`, `#ffffff`, `#ff6b00` |

**Implementatie met CSS Houdini / canvas fallback:**

```typescript
// Confetti rain — canvas-based voor performance
class ConfettiRain {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: ConfettiParticle[] = [];
  private animationId: number = 0;
  private startTime: number = 0;

  constructor(canvas: HTMLCanvasElement, colors: string[], count: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.particles = this.createParticles(colors, count);
  }

  private createParticles(colors: string[], count: number): ConfettiParticle[] {
    return Array.from({ length: count }, () => ({
      x: Math.random() * this.canvas.width,
      y: -20 - Math.random() * 100, // staggered start boven scherm
      vx: 0,
      vy: 200 + Math.random() * 150, // val-snelheid px/s
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 720, // deg/s
      swayAmplitude: 20 + Math.random() * 20,
      swayFrequency: 2 + Math.random(),
      swayOffset: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      width: 6 + Math.random() * 4,
      height: 3 + Math.random() * 2,
      opacity: 1,
      lifetime: 1500 + Math.random() * 1000, // ms
      age: 0,
    }));
  }

  start() {
    this.startTime = performance.now();
    this.tick(this.startTime);
  }

  private tick(now: number) {
    const dt = (now - this.startTime) / 1000;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let alive = 0;
    for (const p of this.particles) {
      p.age = (now - this.startTime);
      if (p.age > p.lifetime) continue;
      alive++;

      const progress = p.age / p.lifetime;
      p.y += p.vy * (1 / 60); // ~60fps step
      p.x += Math.sin(dt * p.swayFrequency * Math.PI * 2 + p.swayOffset) * p.swayAmplitude * (1 / 60);
      p.rotation += p.rotationSpeed * (1 / 60);
      p.opacity = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      this.ctx.restore();
    }

    if (alive > 0) {
      this.animationId = requestAnimationFrame((t) => this.tick(t));
    }
  }

  stop() {
    cancelAnimationFrame(this.animationId);
  }
}
```

### 8.3 Kaart-flip (update)

Als de speler al een kaart had, wordt de oude kaart geflipped naar de nieuwe kaart. Identiek aan sectie 5.3 (Tier-verandering 3D flip), maar zonder tier-afhankelijke effecten als de tier niet verandert.

### 8.4 XP counter

Combinatie van sectie 6.1 (XP-balk fill) en 6.2 (+XP float-up tekst). Beide starten bij 600ms.

### 8.5 Badge unlock (optioneel)

Als de scout door dit rapport een badge verdient, wordt de volledige badge-unlock animatie uit sectie 7 afgespeeld, startend bij 1600ms.

**Reduced motion (hele celebration):** Button toont checkmark (crossfade). Geen confetti. Kaart crossfade naar nieuwe state. XP-balk springt. Toast voor badge.

**Sound cue:** Celebration jingle (1000ms): oplopende noten, eindigend met een akkoord. Overlay met confetti "whoosh".

**Haptic pattern:**
```
0ms:    medium  (button press)
200ms:  light   (success)
400ms:  medium  (card flip start)
600ms:  light   (XP)
1600ms: heavy   (badge, als van toepassing)
```

---

## 9. Navigatie-transities

### 9.1 Tab-switch (crossfade)

- **Trigger:** Gebruiker tikt op een tab in de bottom navigation
- **Duration:** 150ms
- **Easing:** `ease-in-out` = `cubic-bezier(0.45, 0, 0.55, 1)`

**Keyframes — Uitgaande tab:**

| Tijd | `opacity` | Beschrijving |
|---|---|---|
| 0ms | 1 | Zichtbaar |
| 150ms | 0 | Verdwenen |

**Keyframes — Inkomende tab:**

| Tijd | `opacity` | Beschrijving |
|---|---|---|
| 0ms | 0 | Onzichtbaar |
| 150ms | 1 | Zichtbaar |

**Framer Motion:**

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15, ease: [0.45, 0, 0.55, 1] }}
  >
    {tabContent}
  </motion.div>
</AnimatePresence>
```

**Tab indicator (onderstreep):**
- `layout` animatie op de indicator bar
- Schuift horizontaal mee met de actieve tab
- `springs.snappy` = `{ stiffness: 400, damping: 25, mass: 0.8 }`

```tsx
<motion.div
  className="absolute bottom-0 h-0.5 bg-ow-oranje rounded-full"
  layoutId="tab-indicator"
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  }}
/>
```

**Reduced motion:** Instant switch, geen crossfade. Tab indicator springt direct.

**Sound cue:** Geen.

**Haptic:** Light impact bij tab-switch.

---

### 9.2 Push navigatie (slide-in)

- **Trigger:** Navigeren naar een nieuw scherm (bijv. speler-detail)
- **Duration:** 250ms
- **Easing:** `var(--ease-out)` = `cubic-bezier(0.16, 1, 0.3, 1)`

**Keyframes — Inkomend scherm:**

| Tijd | `translateX` | `opacity` | Beschrijving |
|---|---|---|---|
| 0ms | 30% viewport | 0.5 | Rechts buiten beeld |
| 250ms | 0% | 1 | Op positie |

**Keyframes — Uitgaand scherm:**

| Tijd | `translateX` | `opacity` | `scale` | Beschrijving |
|---|---|---|---|---|
| 0ms | 0% | 1 | 1 | Op positie |
| 250ms | -10% | 0.5 | 0.95 | Iets naar links, vervaagt, kleiner |

**Framer Motion (met Next.js App Router):**

```tsx
// layout.tsx met AnimatePresence
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ x: "30%", opacity: 0.5 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: "-10%", opacity: 0.5, scale: 0.95 }}
    transition={{
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**Back navigatie (slide-out):** Spiegelt de richting:
- Inkomend: van links (`x: -30%`)
- Uitgaand: naar rechts (`x: 10%`)

**Reduced motion:** Crossfade (150ms) in plaats van slide.

**Sound cue:** Geen.

**Haptic:** Geen.

---

### 9.3 Modal/sheet (slide-up)

- **Trigger:** Modal of bottom sheet openen
- **Duration:** 200ms
- **Easing:** `var(--ease-out)` = `cubic-bezier(0.16, 1, 0.3, 1)`

**Keyframes — Sheet:**

| Tijd | `translateY` | `opacity` | Beschrijving |
|---|---|---|---|
| 0ms | 100% | 0.8 | Onder scherm |
| 200ms | 0% | 1 | Op positie |

**Keyframes — Backdrop:**

| Tijd | `opacity` | Beschrijving |
|---|---|---|
| 0ms | 0 | Transparant |
| 200ms | 0.5 | Half-transparant zwart |

**Sluiten (reverse):**
- Duration: 150ms (iets sneller dan openen — voelt responsiever)
- Easing: `var(--ease-in)` = `cubic-bezier(0.55, 0, 1, 0.45)`

**Framer Motion:**

```tsx
// Bottom sheet
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="fixed inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 inset-x-0 bg-white rounded-t-2xl"
        initial={{ y: "100%", opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0.8 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
          mass: 1,
        }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
          }
        }}
      >
        {/* Sheet content */}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

**Drag-to-dismiss:**
- Gebruiker kan de sheet naar beneden slepen
- Threshold: `100px offset` OF `500px/s velocity`
- Elasticiteit: `0.2` (lichte weerstand boven de top)
- Rubber-band effect bij oversleep naar boven

**Reduced motion:** Sheet verschijnt/verdwijnt via crossfade (150ms). Geen slide.

**Sound cue:** Geen.

**Haptic:** Light impact bij openen. Light impact bij sluiten.

---

### 9.4 Shared element transitie (kaart)

- **Trigger:** Tik op een spelerskaart in een lijst → navigeer naar detail
- **Duration:** 300ms
- **Easing:** `springs.gentle` = `{ stiffness: 200, damping: 20, mass: 1.2 }`

**Beschrijving:** De spelerskaart "reist mee" van zijn positie in de lijst naar de prominente positie op het detailscherm. Dit wordt geimplementeerd met Framer Motion `layoutId`.

**Implementatie:**

```tsx
// In lijst
<motion.div layoutId={`player-card-${speler.id}`}>
  <PlayerCardSmall speler={speler} />
</motion.div>

// In detail
<motion.div layoutId={`player-card-${speler.id}`}>
  <PlayerCardLarge speler={speler} />
</motion.div>

// Layout transitie configuratie (in parent)
<LayoutGroup>
  <AnimatePresence mode="wait">
    <motion.div
      key={pathname}
      layout
      transition={{
        layout: {
          type: "spring",
          stiffness: 200,
          damping: 20,
          mass: 1.2,
        },
      }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
</LayoutGroup>
```

**Gedrag:**
- Kaart beweegt van bron-positie naar doel-positie
- Grootte interpoleert vloeiend (van compact naar groot)
- Achtergrond-content crossfades tegelijk
- Kaartinhoud (foto, naam, stats) morpht mee

**Reduced motion:** Crossfade (200ms) in plaats van layout-animatie. Kaart verschijnt direct op doel-grootte.

**Sound cue:** Geen.

**Haptic:** Geen.

---

## 10. Micro-interacties

### 10.1 Button press

- **Trigger:** Gebruiker drukt op een button (touch-start)
- **Duration:** 50ms in, 100ms uit
- **Easing:** `ease-out`

**Keyframes:**

| Event | `scale` | Beschrijving |
|---|---|---|
| Touch start | 0.97 | Iets kleiner |
| Touch end | 1 | Terug normaal |

**Framer Motion:**

```tsx
<motion.button
  whileTap={{ scale: 0.97 }}
  transition={{ duration: 0.05, ease: "easeOut" }}
>
  {children}
</motion.button>
```

**CSS fallback:**

```css
.btn:active {
  transform: scale(0.97);
  transition: transform 50ms ease-out;
}

.btn {
  transition: transform 100ms ease-out;
}
```

**Reduced motion:** Geen scale. `opacity: 0.7` bij active state als alternatief.

**Sound cue:** Geen (tenzij het een primaire actie-button is: dan een zacht "click", 30ms).

**Haptic:** Light impact bij touch-start.

---

### 10.2 Card hover/touch (3D tilt)

- **Trigger:** Gebruiker raakt een spelerskaart aan (of hover op desktop)
- **Duration:** Continu (volgt touch/cursor positie)
- **Easing:** `springs.snappy` (voor de tilt-interpolatie)

**Beschrijving:** De kaart tilt subtiel in 3D, alsof je een fysieke kaart vashoudt. Het tilt-punt volgt de vinger/cursor.

**Maximale rotatie:** ±8deg op beide assen.
**Perspective:** `800px` op de parent.

**Implementatie:**

```typescript
function useCardTilt(maxRotation: number = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normalize to -1..1
      const normalX = (clientX - centerX) / (rect.width / 2);
      const normalY = (clientY - centerY) / (rect.height / 2);

      // Clamp
      const clampedX = Math.max(-1, Math.min(1, normalX));
      const clampedY = Math.max(-1, Math.min(1, normalY));

      setTilt({
        rotateY: clampedX * maxRotation,    // links-rechts
        rotateX: -clampedY * maxRotation,   // boven-onder (geïnverteerd)
      });
    },
    [maxRotation],
  );

  const handleLeave = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0 });
  }, []);

  return { ref, tilt, handleMove, handleLeave };
}
```

**Framer Motion:**

```tsx
function TiltCard({ children }: { children: React.ReactNode }) {
  const { ref, tilt, handleMove, handleLeave } = useCardTilt(8);

  return (
    <div style={{ perspective: 800 }}>
      <motion.div
        ref={ref}
        animate={tilt}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.8,
        }}
        onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
        onPointerLeave={handleLeave}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </div>
  );
}
```

**Glare-effect (optioneel):**
Een subtiele lichtreflectie die meebeweegt met de tilt:

```css
.card-glare {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: radial-gradient(
    circle at var(--glare-x, 50%) var(--glare-y, 50%),
    rgba(255, 255, 255, 0.15) 0%,
    transparent 60%
  );
  opacity: 0;
  transition: opacity 200ms ease;
}

.card:hover .card-glare,
.card:active .card-glare {
  opacity: 1;
}
```

**Reduced motion:** Geen tilt. Subtiele `scale: 1.02` bij hover/touch als alternatief (200ms).

**Sound cue:** Geen.

**Haptic:** Geen (continue haptic zou vervelend zijn).

---

### 10.3 Pull-to-refresh

- **Trigger:** Gebruiker sleept de pagina naar beneden voorbij de top
- **Duration:** Variabel (afhankelijk van sleep-afstand)
- **Easing release:** `springs.bouncy`

**Fasen:**

| Fase | Gedrag | Visueel |
|---|---|---|
| **Idle** | Geen pull | Spinner verborgen |
| **Pulling** | Sleep 0-80px | Spinner draait proportioneel, rubber-band effect |
| **Threshold** | Sleep > 80px | Spinner vol, "loslaten om te vernieuwen" |
| **Loading** | Losgelaten | Content schuift 60px naar beneden, spinner draait continu |
| **Complete** | Data geladen | Spinner wordt checkmark, content schuift terug |

**Rubber-band formule:**

```typescript
// Geeft een "afnemende meeropbrengst" curve
function rubberBand(distance: number, dimension: number, coefficient: number = 0.55): number {
  return (1 - 1 / ((distance * coefficient) / dimension + 1)) * dimension;
}

// Gebruik: als je 120px sleept bij een max van 80px
const visualDistance = rubberBand(120, 80); // ≈ 58px (afgevlakt)
```

**Spinner:**

```tsx
// Spinner die proportioneel draait met pull-afstand
<motion.div
  className="w-8 h-8"
  style={{
    rotate: `${pullProgress * 360}deg`, // 0-100% → 0-360deg
    opacity: Math.min(pullProgress, 1),
    scale: Math.min(pullProgress, 1),
  }}
>
  {isLoading ? (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
    >
      <SpinnerIcon color="var(--color-ow-oranje)" />
    </motion.div>
  ) : (
    <SpinnerIcon
      color="var(--color-ow-oranje)"
      progress={pullProgress} // voor partieel getekende spinner-arc
    />
  )}
</motion.div>

// Content offset
<motion.div
  animate={{
    y: isLoading ? 60 : 0,
  }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 15,
    mass: 1,
  }}
>
  {pageContent}
</motion.div>
```

**Spinner kleur:** OW-oranje (`#ff6b00`).

**Reduced motion:** Geen rubber-band. Simpele loading-indicator (static spinner of progress bar) bij pull-threshold.

**Sound cue:** Geen.

**Haptic:** Light impact bij threshold bereiken. Medium impact bij release (start laden). Light impact bij complete.

---

### 10.4 Skeleton loading (shimmer)

- **Trigger:** Content wordt geladen
- **Duration:** 1500ms per sweep (herhaalt)
- **Easing:** lineair

**Beschrijving:** Een diagonale lichtstrook beweegt van links naar rechts over de skeleton-placeholder. De basiskleur is lichtgrijs, de shimmer is een subtiele OW-oranje tint.

**CSS implementatie:**

```css
.skeleton {
  position: relative;
  overflow: hidden;
  background-color: #e5e7eb; /* gray-200 */
  border-radius: 8px;
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 107, 0, 0.04) 20%,  /* OW-oranje, zeer subtiel */
    rgba(255, 107, 0, 0.08) 50%,
    rgba(255, 107, 0, 0.04) 80%,
    transparent 100%
  );
  animation: skeleton-shimmer 1500ms linear infinite;
}

@keyframes skeleton-shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

**Framer Motion (alternatief):**

```tsx
<motion.div
  className="bg-gray-200 rounded-lg overflow-hidden relative"
  style={{ width, height }}
>
  <motion.div
    className="absolute inset-0"
    style={{
      background:
        "linear-gradient(90deg, transparent 0%, rgba(255,107,0,0.04) 20%, rgba(255,107,0,0.08) 50%, rgba(255,107,0,0.04) 80%, transparent 100%)",
    }}
    animate={{ x: ["- 100%", "100%"] }}
    transition={{
      duration: 1.5,
      ease: "linear",
      repeat: Infinity,
    }}
  />
</motion.div>
```

**Skeleton vormen:** Gebruik specifieke shapes voor kaarten, stats, lijstitems:

```tsx
function PlayerCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden">
      {/* Foto placeholder */}
      <div className="skeleton w-full aspect-[3/4]" />
      {/* Naam */}
      <div className="skeleton h-5 w-3/4 mt-3 rounded" />
      {/* Stats */}
      <div className="space-y-2 mt-3">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
        <div className="skeleton h-3 w-4/6 rounded" />
      </div>
    </div>
  );
}
```

**Reduced motion:** Geen shimmer. Skeleton toont een statische pulserende opacity (`opacity: 0.5 → 0.8 → 0.5`, duur 2000ms, ease-in-out). Dit is toegestaan omdat het een loading-state communiceert.

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton::after {
    animation: none;
  }
  .skeleton {
    animation: skeleton-pulse 2000ms ease-in-out infinite;
  }
  @keyframes skeleton-pulse {
    0%, 100% { opacity: 0.5; }
    50%      { opacity: 0.8; }
  }
}
```

**Sound cue:** Geen.

**Haptic:** Geen.

---

### 10.5 Toggle/switch

- **Trigger:** Gebruiker tikt op een toggle (bijv. notificaties aan/uit)
- **Duration:** 200ms
- **Easing:** `springs.snappy` = `{ stiffness: 400, damping: 25, mass: 0.8 }`

**Keyframes — Thumb:**

| Staat | `translateX` | `background-color` | `scale` (mid) | Beschrijving |
|---|---|---|---|---|
| Off | 0px | `#d1d5db` (grijs) | — | Links |
| Mid-transition | — | interpolatie | 0.9 (squeeze) | Onderweg |
| On | 20px | `#ff6b00` (OW-oranje) | — | Rechts |

**Keyframes — Track:**

| Staat | `background-color` | Beschrijving |
|---|---|---|
| Off | `#e5e7eb` | Lichtgrijs |
| On | `#ff6b0033` | OW-oranje, 20% opacity |

**Framer Motion:**

```tsx
<motion.button
  className="relative w-12 h-7 rounded-full p-1"
  animate={{
    backgroundColor: isOn ? "rgba(255,107,0,0.2)" : "#e5e7eb",
  }}
  transition={{ duration: 0.2 }}
  onClick={() => setIsOn(!isOn)}
>
  <motion.div
    className="w-5 h-5 rounded-full shadow-sm"
    animate={{
      x: isOn ? 20 : 0,
      backgroundColor: isOn ? "#ff6b00" : "#d1d5db",
    }}
    transition={{
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    }}
  />
</motion.button>
```

**CSS fallback:**

```css
.toggle-track {
  transition: background-color 200ms ease;
}

.toggle-thumb {
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
              background-color 200ms ease;
}

.toggle--on .toggle-thumb {
  transform: translateX(20px);
  background-color: #ff6b00;
}
```

**Reduced motion:** Instant switch (geen slide, 100ms kleurovergang).

**Sound cue:** Zacht "click" bij toggle (40ms). Iets hogere pitch bij "on" dan bij "off".

**Haptic:** Light impact bij toggle.

---

## 11. Accessibility & Reduced Motion

### 11.1 Beleid

Alle animaties respecteren `prefers-reduced-motion: reduce`. De implementatie is als volgt:

```typescript
// Hook: useReducedMotion
import { useReducedMotion } from "framer-motion";

function useAnimationConfig() {
  const prefersReducedMotion = useReducedMotion();

  return {
    // Vervang alle springs door instant transitions
    transition: prefersReducedMotion
      ? { duration: 0 }
      : undefined,

    // Vervang alle animaties door crossfades
    enterAnimation: prefersReducedMotion
      ? { opacity: [0, 1] }
      : undefined,

    // Geen particles/confetti
    showParticles: !prefersReducedMotion,

    // Counters tonen direct eindwaarde
    animateCounters: !prefersReducedMotion,
  };
}
```

### 11.2 Fallback-strategie per categorie

| Categorie | Normaal | Reduced Motion |
|---|---|---|
| **Entrance** (fade, slide, scale) | Volledige animatie | `opacity 0 → 1`, 150ms |
| **Exit** (fade, slide) | Volledige animatie | `opacity 1 → 0`, 100ms |
| **Emphasis** (bounce, glow, pulse) | Volledige animatie | Geen, of subtiele opacity pulse |
| **Counter** (tellen) | Animated counting | Direct eindwaarde |
| **Particles** (confetti, sparkle) | Canvas/DOM particles | Geen |
| **3D** (flip, tilt, rotate) | 3D transforms | Crossfade |
| **Continuous** (shimmer, spinner) | Loop-animatie | Statische of opacity-pulse variant |
| **Layout** (shared element) | Position/size interpolatie | Crossfade |
| **Haptic** | Per animatie | Alleen bij kritieke feedback (errors) |
| **Sound** | Per animatie | Alleen bij kritieke feedback (errors) |

### 11.3 Globale CSS fallback

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 150ms !important; /* snelle crossfade */
    scroll-behavior: auto !important;
  }

  /* Specifieke overrides voor essentiële animaties */
  .skeleton {
    animation: skeleton-pulse 2000ms ease-in-out infinite !important;
  }

  /* Loading spinners mogen draaien */
  .spinner {
    animation-duration: 800ms !important;
    animation-iteration-count: infinite !important;
  }
}
```

### 11.4 Framer Motion globale config

```tsx
// _app.tsx of layout.tsx
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
```

`reducedMotion="user"` laat Framer Motion automatisch `prefers-reduced-motion` respecteren. Alle `animate` props worden instant transitions wanneer de gebruiker dit heeft ingeschakeld.

---

## 12. Performance-richtlijnen

### 12.1 Regels

| Regel | Detail |
|---|---|
| **Alleen transform + opacity** | Animeer nooit `width`, `height`, `top`, `left`, `margin`, `padding`, `border-width`, `font-size`. Gebruik `scale`, `translate`, `rotate`, `opacity`. |
| **will-change spaarzaam** | Alleen toevoegen op elementen die daadwerkelijk animeren, en verwijder na afloop. Nooit `will-change: transform` op >10 elementen tegelijk. |
| **Canvas voor particles** | Confetti en particle-systemen altijd via `<canvas>`, nooit DOM-elementen. Max 60 particles tegelijk. |
| **requestAnimationFrame** | Alle custom animaties (counters, physics) via `requestAnimationFrame`, nooit `setInterval`/`setTimeout`. |
| **Layout thrashing** | Lees nooit layout properties (offsetWidth, getBoundingClientRect) in een animatie-loop. Cache waardes voor de animatie start. |
| **Lazy Framer Motion** | Gebruik `LazyMotion` + `domAnimation` (niet `domMax`) om bundle size te beperken (~17KB vs ~34KB). |
| **Unmount na animatie** | Particles, floats, overlays: unmount na `onAnimationComplete`. Geen verborgen DOM-elementen laten staan. |
| **GPU compositing** | Voeg `transform: translateZ(0)` of `will-change: transform` toe om GPU-compositing te forceren op animerende elementen. |

### 12.2 Performance-budget

| Metric | Budget | Beschrijving |
|---|---|---|
| **Frame rate** | 60fps (16.7ms/frame) | Op Samsung A34 of equivalent |
| **JS execution per frame** | < 8ms | Laat 8ms over voor rendering |
| **Total animating elements** | < 20 | Gelijktijdig animerende DOM-elementen |
| **Canvas particles** | < 60 | Gelijktijdige particles |
| **Framer Motion bundle** | < 20KB gzipped | Via `LazyMotion` + `domAnimation` |
| **Animation JS overhead** | < 5KB gzipped | Custom hooks, utilities |
| **First contentful paint** | Geen animatie-blocking | Alle animaties starten na mount |

### 12.3 Testing-checklist

- [ ] Draai alle animaties op Samsung A34 (of Chrome DevTools CPU 4x slowdown)
- [ ] Verifieer 60fps met Chrome Performance tab
- [ ] Test `prefers-reduced-motion: reduce` in Chrome DevTools (Rendering tab)
- [ ] Test met schermlezer (VoiceOver / TalkBack) — animaties mogen niet interfereren
- [ ] Test haptic feedback op fysiek iOS en Android device
- [ ] Verifieer `will-change` cleanup na animatie
- [ ] Verifieer particle cleanup (geen memory leaks na unmount)
- [ ] Check bundle size impact van Framer Motion imports

### 12.4 Aanbevolen imports

```typescript
// Alleen importeren wat je nodig hebt
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// NIET: import { motion } from "framer-motion"
// WEL: via LazyMotion in de provider, dan:
import { m, LazyMotion, domAnimation } from "framer-motion";

// m is de lazy variant van motion — kleiner in bundle
// Gebruik m.div in plaats van motion.div binnen LazyMotion
```

---

## Appendix A: Haptic patterns referentie

| Naam | iOS (UIImpactFeedbackGenerator) | Android (HapticFeedbackConstants) | Gebruik |
|---|---|---|---|
| **light** | `.light` | `CLOCK_TICK` | Subtiele bevestiging (tab switch, toggle) |
| **medium** | `.medium` | `CONTEXT_CLICK` | Standaard feedback (button press, selectie) |
| **heavy** | `.heavy` | `LONG_PRESS` | Belangrijk moment (tier reveal, level-up) |
| **double-heavy** | `.heavy` + 100ms + `.medium` | `LONG_PRESS` + 100ms + `CONTEXT_CLICK` | Goud-tier onthulling |
| **success** | `.success` (UINotificationFeedbackGenerator) | `CONFIRM` | Rapport verstuurd, badge unlock |
| **error** | `.error` (UINotificationFeedbackGenerator) | `REJECT` | Fout bij versturen |

**Implementatie:**

```typescript
type HapticStyle = "light" | "medium" | "heavy" | "success" | "error";

async function triggerHaptic(style: HapticStyle): Promise<void> {
  // Check of de Vibration API beschikbaar is
  if (!("vibrate" in navigator)) return;

  // Check reduced motion preference
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const patterns: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [20, 50, 20],
    error: [40, 50, 40, 50, 40],
  };

  navigator.vibrate(patterns[style]);
}
```

---

## Appendix B: Sound design richtlijnen

### Principes
1. **Optioneel:** Geluid staat standaard uit. De gebruiker kan het aanzetten in instellingen.
2. **Kort:** Geen geluid langer dan 1 seconde (behalve level-up fanfare: max 1.5s).
3. **Consistent:** Gebruik dezelfde sound-bank voor dezelfde actie-types.
4. **Niet-intrusief:** Volume nooit boven 60% van systeemvolume.

### Sound-map

| Sound ID | Beschrijving | Duur | Frequentie-range | Gebruik |
|---|---|---|---|---|
| `whoosh-in` | Zacht luchtig geluid | 100-200ms | Low-mid | Elementen die verschijnen |
| `whoosh-out` | Omgekeerd luchtig geluid | 100ms | Low-mid | Elementen die verdwijnen |
| `pop` | Kort knalletje | 50ms | Mid | Smiley selectie, bubble |
| `click` | Mechanisch klikje | 30ms | Mid-high | Button press, toggle |
| `kling` | Metaalachtig belletje | 150-200ms | High | Kaart face-up, tier reveal |
| `tick` | Kort tikje | 20ms | Mid | Counter stap, stat reveal |
| `shimmer` | Hoge glitterklanken | 200-300ms | High + reverb | Shimmer effects, glow |
| `chime-brons` | Laag metalen geluid | 150ms | Mid | Brons-tier |
| `chime-zilver` | Helder belletje | 200ms | Mid-high | Zilver-tier |
| `chime-goud` | Rijk resonerend | 400ms | High + sustain | Goud-tier |
| `fanfare` | Oplopende noten + akkoord | 800-1000ms | Full range | Level-up |
| `confetti` | Zacht ruis-whoosh | 300ms | High | Confetti burst |
| `success` | Twee oplopende tonen | 200ms | Mid-high | Rapport verstuurd |
| `counter-up` | Stijgend arpeggio | 300ms | Mid | Score stijgt |
| `counter-down` | Dalend arpeggio | 300ms | Mid | Score daalt |

### Implementatie

```typescript
class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private enabled: boolean = false;
  private volume: number = 0.4; // 40% standaard

  async init() {
    this.audioContext = new AudioContext();
    // Pre-load alle sounds
    await Promise.all(
      SOUND_IDS.map(async (id) => {
        const response = await fetch(`/sounds/${id}.mp3`);
        const buffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(buffer);
        this.sounds.set(id, audioBuffer);
      }),
    );
  }

  play(id: string, options?: { volume?: number; playbackRate?: number }) {
    if (!this.enabled || !this.audioContext) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const buffer = this.sounds.get(id);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();

    source.buffer = buffer;
    source.playbackRate.value = options?.playbackRate ?? 1;
    gain.gain.value = (options?.volume ?? 1) * this.volume;

    source.connect(gain);
    gain.connect(this.audioContext.destination);
    source.start();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

export const soundManager = new SoundManager();
```

---

## Appendix C: Timing cheatsheet

Snelle referentie voor alle animatie-duraties:

| Animatie | Duur | Easing |
|---|---|---|
| Button press | 50ms | ease-out |
| Toggle switch | 200ms | spring (snappy) |
| Tab crossfade | 150ms | ease-in-out |
| Modal open | 200ms | ease-out |
| Modal close | 150ms | ease-in |
| Push navigatie | 250ms | ease-out |
| Shared element | 300ms | spring (gentle) |
| Smiley select | 250ms | spring (snappy) |
| Star trail (per ster) | 250ms + 60ms stagger | bounce |
| Stat glow pulse | 800ms | ease-out |
| Counter (score) | 400-600ms | ease-out |
| XP bar fill | 800ms | ease-out |
| Float-up tekst | 1200ms | ease-out + linear fade |
| Skeleton shimmer | 1500ms loop | linear |
| Card tilt | continuous | spring (snappy) |
| Pull-to-refresh release | spring | spring (bouncy) |
| Kaart-update counter | 600ms | ease-out |
| Tier flip | 1200ms | spring (dramatic) |
| Level-up sequence | 2000ms | mixed |
| Badge unlock | 2500ms | mixed |
| Celebration | 3500ms+ | mixed |
| Pack opening | 3500ms | mixed (6 fases) |
