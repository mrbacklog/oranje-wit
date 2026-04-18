# Sportlink Sync — Design Prototypes

**Spec:** [2026-04-17-sportlink-sync-design.md](../../specs/2026-04-17-sportlink-sync-design.md)

## Prototypes

| Bestand | Wat |
|---|---|
| [sportlink-sync.html](sportlink-sync.html) | Volledige pagina met 4 states: Login → Laden → Diff → Klaar |

## Tokens

[tokens.css](tokens.css) — hergebruikt TI Studio dark tokens + sync-specifieke kleuren.

## States

1. **Login** — Formulier met Sportlink credentials
2. **Laden** — Progress indicator met stappen
3. **Diff** — Resultaten in 3 categorieën (Nieuw / Afgemeld / Fuzzy matches) met checkboxes
4. **Klaar** — Bevestiging met samenvatting
