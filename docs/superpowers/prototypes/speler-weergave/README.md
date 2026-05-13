# Speler-weergave · Design prototypes

Unificatie van alle spelerweergaven in TI Studio naar één consistent visueel systeem met 6 contexten.

## Spec

[`docs/superpowers/specs/2026-04-15-speler-weergave-unificatie.md`](../../specs/2026-04-15-speler-weergave-unificatie.md)

## Bestanden

| Bestand | Beschrijving |
|---|---|
| [`tokens.css`](./tokens.css) | Alle design-tokens als CSS custom properties (kleuren, sizes, gradients, shared primitives) |
| [`index.html`](./index.html) | **Catalogus** — overzicht van alle prototypes met links |
| [`compact-chip.html`](./compact-chip.html) | Context 1 · dense chip in werkbord-dropzone |
| [`rijke-rij.html`](./rijke-rij.html) | Context 2 · pool-drawer + zoom-detail + drag-image |
| [`speler-dialog.html`](./speler-dialog.html) | Context 4 · volledige spelerdialoog (hero-header + tabs) |
| [`spelerpool-drawer.html`](./spelerpool-drawer.html) | Spelerpool-drawer voor het werkbord |
| [`hover-kaart.html`](./hover-kaart.html) | Context 5 · zwevende FIFA-kaart bij hover |
| [`tabel-rij.html`](./tabel-rij.html) | Context 6 · dense tabel op /personen |

## Hoe te gebruiken

### Als designer / product-owner
Open `index.html` in je browser — vanaf daar kun je doorklikken naar elke context. Elk prototype toont alle states (status, memo, geblesseerd, nieuw-lid, USS, etc.) in één file.

### Als developer (naar React code)
1. Kopieer de tokens uit `tokens.css` naar `packages/ui/src/tokens/speler-weergave.css`
2. Gebruik elke prototype-file als pixel-referentie voor je component
3. De gedeelde primitives (`.sq-av`, `.memo-*`, `.uss-hex`) zijn al in tokens.css uitgewerkt — kun je letterlijk overnemen
4. Per context bouw je één React component met props voor de states

### Iteratie
- **Kleur aanpassen?** → alleen `tokens.css` editen, alle prototypes updaten automatisch
- **Layout één context?** → alleen dat ene prototype-bestand editen
- **Nieuwe regel / signaal?** → eerst spec.md bijwerken, dan prototype(s)

## Bouwblokken

Alle contexten delen deze bouwblokken (gedefinieerd in `tokens.css`):

- **`.sq-av`** — vierkante foto met gender-L in linker-onder hoek
- **`.sq-av .blessure`** — wit-transparante badge rechts-onder met rood kruis (geblesseerd)
- **`.sq-av .nieuw-sparkle`** — wit-transparante badge rechts-boven met oranje sparkle (nieuw lid)
- **`.memo-open`** / `.memo-bespreking` / `.memo-risico` / `.memo-opgelost` — diagonale post-it hoek linksboven
- **`.uss-hex`** — hexagon met tier-kleur (goud / zilver / brons / geen) voor USS-score

## Legacy

De volledige brainstorm-preview is `fundament-v22.html` in de brainstorm-sessie. Gebruik als historische referentie — niet voor productie.
