# Skill: Vergelijk

## Doel
Twee scenario's (of versies) naast elkaar vergelijken. Toont verschillen, trade-offs en helpt bij de keuze.

## Vergelijkingsniveaus

### Structureel
- Aantal teams per categorie/kleur
- Totaal spelers ingedeeld vs. niet-ingedeeld
- Validatiestatus vergelijking

### Per team
- Welke spelers zitten in scenario A maar niet in B?
- Welke spelers zijn verplaatst?
- Verschil in teamgrootte en genderbalans

### Kwalitatief (Claude)
- Trade-off analyse: wat win je en wat verlies je?
- Oranje Draad vergelijking: welk scenario scoort beter op de pijlers?
- Retentierisico vergelijking

## Output
```
Vergelijking: Scenario A.2 vs B.1

Structuur:
  A.2: 26 teams, 181 ingedeeld, 6 niet-ingedeeld
  B.1: 24 teams, 178 ingedeeld, 9 niet-ingedeeld

Verschillen:
  Geel: A.2 heeft 5 teams, B.1 heeft 4 teams
  U15: zelfde structuur, 3 spelers anders verdeeld
  Senioren: A.2 mist Sen 6 (samengevoegd met Sen 5)

Verplaatste spelers (8):
  Eva: U15-1 (A.2) → U15-2 (B.1)
  Finn: Rood J2 (A.2) → U17-2 (B.1)
  ...

Trade-offs:
  A.2: meer teams, meer speeltijd, maar 3 teams op minimum
  B.1: minder teams, grotere groepen, stabielere bezetting
```
