# Beheer-regels — c.k.v. Oranje Wit

## Ubiquitous language

De naamgeving in code en database moet aansluiten bij wat de TC zegt in vergaderingen. Bij twijfel: vraag "wat zou de TC dit noemen?"

### Verplichte termen

| TC zegt | Code/DB | NIET gebruiken |
|---|---|---|
| "het raamwerk" | `RaamwerkVersie`, `raamwerk_versies` | ~~catalogus~~, ~~itemcatalogus~~ |
| "de items voor Geel" | `Leeftijdsgroep`, `leeftijdsgroepen` | ~~catalogusgroep~~ |
| "pijler Schieten" | `Pijler`, `pijlers` | ~~cataloguspijler~~ |
| "het item afstandsschot" | `OntwikkelItem`, `ontwikkel_items` | ~~catalogusitem~~ |
| "jeugdontwikkeling" | `/jeugd/` | ~~scouting/catalogus~~ |
| "jaarplanning" | `/jaarplanning/` | ~~seizoensbeheer~~ |
| "roostering" | `/roostering/` | ~~competitie & planning~~ |

### Domein-afbakening

- Scouting-items (vragen) horen bij **Jeugdontwikkeling**, niet bij Scouting
- USS-parameters horen bij **Jeugdontwikkeling**, niet bij Systeem
- Sportlink-sync hoort bij **Teams & Leden**, niet bij Import
- Mijlpalen horen bij **Jaarplanning**, niet bij Team-Indeling

## Domeinstructuur

De beheer-app heeft 9 domeinen in vaste volgorde:

1. **Jaarplanning** — `/jaarplanning/`
2. **Roostering** — `/roostering/`
3. **Teams & Leden** — `/teams/`
4. **Jeugdontwikkeling** — `/jeugd/`
5. **Scouting** — `/scouting/`
6. **Evaluatie** — `/evaluatie/`
7. **Werving** — `/werving/`
8. **Systeem** — `/systeem/`
9. **Archivering** — `/archief/`

Nieuw domein toevoegen = nieuwe sidebar-sectie + route-directory. Geen herstructurering van bestaande domeinen.

## Autorisatie

- De gehele beheer-app is alleen toegankelijk voor EDITOR-rol
- Alle routes worden beschermd via middleware
- Autorisatie wordt centraal beheerd in Beheer → Systeem → Gebruikers
- Het portaal (ckvoranjewit.app) bepaalt welke apps zichtbaar zijn per rol

## Temporeel model

- **Afgeronde seizoenen** → frozen/read-only (Archivering)
- **Huidig seizoen** → actief (Teams & Leden is de actuele waarheid)
- **Komend seizoen** → workspace (Team-indeling, Jaarplanning)
- **Evaluaties en scouting** dienen het komende seizoen maar worden uitgevoerd tijdens het huidige
- Historische data verandert niet. Resultaten, teams en evaluaties uit het verleden zijn bevroren.
