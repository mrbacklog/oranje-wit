# Skill: Advies

## Doel
Intelligent advies van Claude over spelersplaatsing, what-if scenario's en Oranje Draad-toetsing.

## Adviestypen

### Startvoorstel
Input: concept (uitgangsprincipe + keuzes) + blauwdruk (kaders + pins)
Output: complete teamindeling voor alle categorieën met onderbouwing per speler

Claude gebruikt:
- Ledenlijst met leeftijd en geslacht
- Spelerspaden (5 seizoenen)
- Evaluaties (indien beschikbaar)
- Retentiemodel (dropout-kans per leeftijd)
- Concept-keuzes en aannames
- Gepinde feiten uit blauwdruk

### Spelersadvies
Input: speler ID
Output: profiel met pad, evaluatie, retentierisico, teamadvies

"Eva (V, 2012) — 4e seizoen. Pad: Groen J12 → Geel J8 → Oranje J3 → U15-2.
Evaluatie: techniek ●●●●○, inzet ●●●●●. Retentie: 95% (laag risico).
3 jaar samen met Kim. Advies: U15-1 als kern, of Oranje J3 als ze meer
plezier-focus nodig heeft."

### What-if analyse
Input: voorgestelde wijziging ("Verplaats Saar van U15-2 naar Oranje J3")
Output: impact op beide teams + alternatieve opties

### Oranje Draad toets
Input: scenario of team
Output: score per pijler + toelichting

### Blauwdruk-advies
Input: huidige ledendata + trends
Output: aanbevolen speerpunten en aandachtspunten voor het seizoen

## Context
- Claude geeft advies, beslist niet — TC maakt de keuzes
- Altijd onderbouwen met data
- Oranje Draad als toetsingskader bij elk advies
