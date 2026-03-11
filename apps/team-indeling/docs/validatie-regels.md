# Validatieregels — Team-Indeling

## Wat doet de validatie-engine?

De validatie-engine controleert elke teamindeling automatisch op KNKV-regels (hard, verplicht) en OW-voorkeuren (zacht, gewenst). Validatie draait realtime in de scenario-editor bij elke wijziging. Elk team krijgt een stoplicht-status.

De broncode staat in `src/lib/validatie/regels.ts` (teams) en `src/lib/validatie/selectie-regels.ts` (selecties).

---

## KNKV harde regels

Deze regels komen uit het KNKV Competitie 2.0 reglement. Overtreding levert een **rode** melding op.

### Teamgrootte

| Type | Min | Max |
|---|---|---|
| 4-tal (Blauw, Groen) | 4 | 8 |
| 8-tal (Geel, Oranje, Rood) | 8 | 13 |
| A-categorie (U15/U17/U19) | 8 | 13 |
| Selectie (2 achtallen) | 16 | 26 |

De blauwdruk kan per seizoen afwijkende ideaalwaarden instellen binnen deze grenzen.

### Leeftijdsgrenzen

Peildatum: 31 december van het seizoensjaar.

**B-categorie kleuren:**

| Kleur | Leeftijdsrange | Max spreiding |
|---|---|---|
| Paars | 4-5 jaar | 2 jaar |
| Blauw | 5-7 jaar | 2 jaar |
| Groen | 8-9 jaar | 2 jaar |
| Geel | 10-12 jaar | 3 jaar |
| Oranje | 13-15 jaar | 3 jaar |
| Rood | 16-18 jaar | 3 jaar |

**A-categorie bandbreedtes (2 geboortejaren):**

| Categorie | Geboortejaren |
|---|---|
| U15 | seizoenjaar - 13 t/m seizoenjaar - 14 |
| U17 | seizoenjaar - 15 t/m seizoenjaar - 16 |
| U19 | seizoenjaar - 17 t/m seizoenjaar - 18 |

**8-tallen:** minimale gemiddelde leeftijd van 9.0 jaar.

### Geslachtsregels

- **A-categorie**: verplicht 4 dames + 4 heren op het veld. Ratio moet minimaal 0.75 zijn.
- **Blauw**: geen genderonderscheid.
- **Overige B-categorie**: gender mag afwijken van 4+4, maar gelijke verdeling over vakken.

### Overige harde regels

- **Duplicaten**: een speler mag niet dubbel in hetzelfde team staan.
- **Dubbele plaatsing**: een speler mag niet in meerdere teams tegelijk staan (cross-team check).

---

## OW zachte regels

Deze voorkeuren komen uit het beleid van c.k.v. Oranje Wit. Overtreding levert een **oranje** melding op.

### Streefgroottes per team

| Type | Min | Ideaal | Max |
|---|---|---|---|
| 4-tal (Blauw, Groen) | 5 | 6 | 6 |
| Breedte 8-tal (Geel, Oranje, Rood) | 9 | 10 | 11 |
| A-categorie team | 8 | 10 | 11 |
| A-categorie selectie (2 teams) | 18 | 20 | 22 |

### Gendervoorkeur

- **Nooit 1 kind alleen** van een geslacht in een team (hard: rode melding).
- Minimaal 2 van elk geslacht per team.
- Streven naar gelijke verdeling (4V+4M bij 8-tal, 2V+2M bij 4-tal).
- Bij selecties: ideaal minimaal 8 per geslacht voor 2 achtallen.

### Kleur-grensbewaking

Teams worden gecontroleerd op het risico van herindeling door de KNKV. Als de gemiddelde leeftijd buiten de veilige range valt, krijgt het team een oranje melding.

| Kleur | Veilige gem. leeftijd |
|---|---|
| Paars | 4.0 - 5.5 |
| Blauw | 6.3 - 7.8 |
| Groen | 7.6 - 9.5 |
| Geel | 9.2 - 11.8 |
| Oranje | 11.6 - 13.8 |
| Rood | 13.8 - 18.0 |

### Blauwdruk-kaders

De blauwdruk kan per categorie aanvullende regels instellen:
- **Verplicht minimum M/V**: harde eis op genderaantal (rode melding bij overtreding).
- **Gewenst minimum M/V**: zachte eis (oranje melding).
- **Optimaal spelersaantal**: bepaalt ideale teamgrootte met afwijkingspercentage.

---

## Stoplicht-status

Elk team krijgt een van drie statussen:

| Status | Kleur | Betekenis |
|---|---|---|
| **GROEN** | Groen | Alle regels voldaan. Geen meldingen of alleen informatief. |
| **ORANJE** | Oranje | Een of meer zachte regels overtreden (aandachtspunten). Geen harde overtredingen. |
| **ROOD** | Rood | Een of meer harde regels overtreden (kritieke problemen). Moet opgelost worden. |

De overall status wordt bepaald door de zwaarste melding: een enkele kritieke melding maakt het hele team rood.

---

## Bronverwijzingen

- KNKV Competitie 2.0 reglement: [`rules/knkv-regels.md`](../../../rules/knkv-regels.md)
- OW indelingsvoorkeuren: [`rules/ow-voorkeuren.md`](../../../rules/ow-voorkeuren.md)
- Validatie-engine (code): [`src/lib/validatie/regels.ts`](../src/lib/validatie/regels.ts)
- Selectie-validatie (code): [`src/lib/validatie/selectie-regels.ts`](../src/lib/validatie/selectie-regels.ts)
