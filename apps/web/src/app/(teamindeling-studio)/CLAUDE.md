# (teamindeling-studio) — TI Studio domein

## Wat
Drag-drop teamindeling editor voor de TC. Desktop-only, dark mode.

## Styling
- Dark mode via CSS variabelen — geen hardcoded kleuren of Tailwind dark-klassen
- Geen mobile layout nodig (desktop-only per `rules/teamindeling-scheiding.md`)
- TI-specifieke CSS staat in `src/app/(teamindeling-studio)/teamindeling.css`

## State management
- Zustand stores in `apps/web/src/lib/teamindeling/`
- Geen lokale React state voor domein-brede toestand
- Server state (fetch/revalidate) via Server Actions of SWR

## Domeinmodel
- Gebruikers werken met **Versies**, niet rechtstreeks in **Scenario's**
- Scenario = concrete teamopstelling; Versie = snapshot van een scenario
- `rel_code` is enige stabiele speler-identifier

## Submappen
| Map | Inhoud |
|---|---|
| `ti-studio/indeling/` | Hoofd-editor (spelerlijst + werkbord) |
| `ti-studio/kader/` | Kaderpagina (alle spelers) |
| `ti-studio/memo/` | Memo's op team/speler |

## Relevante rules
- `rules/teamindeling-scheiding.md` — Desktop/mobile scheiding
- `rules/ow-voorkeuren.md` — OW indelingsfilosofie
- `rules/score-model.md` — USS score formules
