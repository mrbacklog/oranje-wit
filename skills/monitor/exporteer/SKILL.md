---
name: exporteer
description: Exporteert alle Verenigingsmonitor-data als één JSON-bestand voor de Team-Indeling tool. Bevat spelers, staf, retentie, streefmodel, signalering en verloop.
user-invocable: true
allowed-tools: Read, Write, Glob, Bash
argument-hint: "[optioneel: seizoen, bijv. 2026-2027]"
---

# Export voor Team-Indeling

Genereer één JSON-exportbestand met alle data die de Team-Indeling tool nodig heeft voor een nieuw seizoen.

## Gebruik

```
/oranje-wit:exporteer
/oranje-wit:exporteer 2026-2027
```

## Wat het doet

Het export-script (`scripts/export-voor-teamindeling.js`) leest alle relevante bronbestanden en genereert een gecombineerd JSON-bestand met 9 secties:

| Sectie | Inhoud |
|---|---|
| `meta` | Export-herkomst, datums, totalen |
| `spelers` | Alle actieve spelers met profiel, volgend seizoen, retentie, spelerspad, teamgenoten |
| `staf` | Trainers en staf per team (uit Sportlink teams CSV) |
| `teams_huidig` | Huidige teamstructuur met bezetting en statistieken |
| `verloop` | Instroom/uitstroom huidig seizoen (nieuw, herinschrijver, uitgestroomd) |
| `retentiemodel` | Retentiekansen per leeftijd/geslacht uit jeugdmodel |
| `streefmodel` | Streef-ledenboog per band en A-categorie |
| `signalering` | Aandachtspunten en alerts met impact op teamindeling |
| `instroom_profiel` | Verwachte instroom volgend seizoen (leeftijdsverdeling, M/V-ratio) |

## Stappen

1. **Draai het export-script**
   ```bash
   node scripts/export-voor-teamindeling.js $ARGUMENTS
   ```
   Zonder argument wordt het eerstvolgende seizoen bepaald.

2. **Valideer de output**
   Lees het gegenereerde bestand `data/export/export-YYYY-YYYY.json` en controleer:
   - Alle 9 secties aanwezig
   - Spelers: verwacht ~250 actieve spelers, elk met `volgend_seizoen` en `retentie`
   - Staf: verwacht ~45-55 stafrecords met team-koppelingen
   - Teams: verwacht ~25-30 teams met speler_ids en staf_ids
   - Spelerspaden: max 5 seizoenen per speler
   - Retentie: risico-labels kloppen (17j = hoog, 10j = laag)
   - Verloop: samenvatting bevat behouden, nieuw, herinschrijver, uitgestroomd
   - Signalering: alerts met ernst en impact_teamindeling

3. **Rapporteer samenvatting**
   Geef een overzicht van de export:
   - Totaal spelers (jeugd / senioren)
   - Totaal staf
   - Aantal teams
   - Aantal signaleringen per ernst
   - Verloop-samenvatting
   - Bestandspad en grootte

## Bronbestanden (worden gelezen, niet aangepast)

| Bestand | Wat |
|---|---|
| `data/leden/snapshots/YYYY-MM-DD.json` | Meest recente ledensnapshot |
| `data/leden/snapshots/raw/YYYY-MM-DD-sportlink-teams.csv` | Staf/trainers |
| `data/spelers/spelerspaden.json` | Spelerspaden (16 seizoenen) |
| `model/jeugdmodel.yaml` | Retentiemodel per leeftijd/geslacht |
| `data/modellen/streef-ledenboog.json` | Streefmodel per band |
| `data/ledenverloop/signalering/YYYY-YYYY-alerts.json` | Signalering |
| `data/ledenverloop/individueel/YYYY-YYYY-verloop.json` | Verloop huidig seizoen |
| `data/seizoenen/YYYY-YYYY/teams-knkv.json` | KNKV teamregistraties |
| `data/aggregaties/YYYY-MM-DD-per-team.json` | Team-statistieken |

## Output

- Bestand: `data/export/export-YYYY-YYYY.json`
- Formaat: JSON met 9 secties (zie tabel hierboven)
- Doel: Input voor de `oranje-wit-team-indeling` tool (import-script)
