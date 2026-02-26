# Skill: Validatie

## Doel
Teamindelingen valideren op KNKV-regels, OW-voorkeuren en Oranje Draad.

## Validatieniveaus

### Harde regels (KNKV) → 🔴 bij overtreding
- Bandbreedte: speler valt buiten toegestane geboortejaren
- Teamgrootte: onder minimum of boven maximum
- Gemiddelde leeftijd: onder 9.0 bij 8-tal B-categorie
- Dubbele plaatsing: speler in meerdere teams

### Zachte regels (OW) → 🟡 bij afwijking
- Gender: minder dan 2 van één geslacht in een team
- Teamgrootte: buiten ideale range maar binnen toegestane
- Selectiebalans: prestatie/ontwikkelteam verhouding afwijkend
- Eén kind alleen van één geslacht

### Oranje Draad → informatief
- POP-ratio per team vs. verwachting voor die leeftijdsgroep
- Retentierisico: teams met veel twijfelaars of hoog-risico leeftijden
- Duurzaamheid: teams op minimumbezetting

## Output per team
```
Team: U15-1
Status: 🟢
Spelers: 5M + 5V = 10
Meldingen: geen

Team: Geel J8
Status: 🟡
Spelers: 3M + 4V = 7
Meldingen:
  ⚠ Teamgrootte 7: onder ideaal (9-11), maar boven minimum (8)
  ⚠ Gender: 3M + 4V (ongelijk, maar min 2 M/V OK)
```

## Totaaloverzicht
```
Scenario A.2 validatie:
🟢 14 teams OK
🟡 3 teams aandacht
🔴 1 team kritiek

Kritiek:
  Geel J10: gemiddelde leeftijd 8.7 (min 9.0)

Aandacht:
  Geel J8: 7 spelers (ideaal 9-11)
  Oranje J5: 3M + 6V (gender scheef)
  U17-2: 8 spelers (ideaal 10)
```
