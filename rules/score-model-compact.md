---
paths:
  - "apps/web/src/**/*score*"
  - "apps/web/src/**/*uss*"
  - "packages/database/**/*score*"
---

# Score-Model Compact — USS Referentie

> Versie 1.0 — Zie `rules/score-model.md` voor volledige uitleg, TypeScript, kalibratie en voorbeelden.

## USS-schaal

| USS | Niveau |
|-----|--------|
| 0–20 | Net begonnen (jongste Blauw) |
| 20–50 | Blauw/Groen niveau |
| 50–80 | Groen/Geel niveau |
| 80–110 | Geel niveau (gemiddeld tot sterk) |
| 110–130 | Oranje niveau / sterk Geel |
| 130–150 | Rood niveau / A-categorie instap |
| 150–170 | A-categorie (U17-HK, U19) |
| 170–200 | Top jeugd / senioren niveau |

Een speler met USS 115 en een team met USS 115 zijn vergelijkbaar sterk.

## Leeftijdsgrenzen (peildatum 31-12)

| Categorie | Grens | Geboortejaren 2026-2027 |
|-----------|-------|--------------------------|
| U15 | < 15.00 | 2012, 2013 |
| U17 | < 17.00 | 2010, 2011 |
| U19 | < 19.00 | 2008, 2009 |

Exacte leeftijd = (peildatum − geboortedatum in dagen) / 365.25

## Basislijn (verwachte USS per leeftijd)

| Leeftijd | 5 | 7 | 9 | 11 | 13 | 15 | 17 | 18 |
|----------|---|---|---|----|----|----|----|-----|
| USS | 12 | 23 | 41 | 67 | 98 | 127 | 149 | 157 |

Formule: `S(l) = 180 / (1 + e^(-0.35 * (l - 12.5)))`

## Bronnen → USS

| Bron | Formule |
|------|---------|
| KNKV teamrating | USS_team = KNKV_rating (direct, geen transformatie) |
| Scouting spelersscore (0–10) | USS = basislijn(leeftijd) + (score − 5) × schaalFactor(leeftijd) |
| Coach-evaluatie (1–5 per dimensie) | Normaliseer naar 0–10, dan zelfde als scouting |

## Gecombineerde speler-USS

```
USS_speler = gewogen_gemiddelde(scouting_USS, evaluatie_USS)
```

Gewichten: scouting 60% / evaluatie 40% als beide beschikbaar; anders 100% van beschikbare bron.

## Teamsterkte vs speler

```
USS_team ≈ gemiddelde USS van de spelers in dat team
```

Een speler is "op niveau" als zijn USS binnen ±15 van de team-USS ligt.
