# Research: Spelersbeoordelingen in Games en Analytics

Onderzoek naar hoe basketball games, voetbal games en officiële statistieken spelerskwaliteiten structureren. Deze systemen zijn jarenlang geoptimaliseerd om complexe spelerprestaties samen te vatten in begrijpelijke ratings.

---

## 1. NBA 2K (de grootste basketbal game ter wereld)

### Structuur: Hiërarchisch (Categorieën → Attributen)

NBA 2K gebruikt een **twee-laags systeem**: 6 hoofdcategorieën met elk 2-5 attributen, plus verborgen attributen en tendencies. Schaal: **0-99** per attribuut.

### Volledige Attributenlijst (21 zichtbare attributen)

#### Inside Scoring / Finishing (5)
| Attribuut | Beschrijving |
|---|---|
| Close Shot | Schotvaardigheid binnen 3 meter van de basket (stilstaand) |
| Driving Layup | Lay-up vanuit de drive, inclusief euro steps en floaters |
| Driving Dunk | Dunken vanuit de drive |
| Standing Dunk | Dunken vanuit stilstand (post-ups, put-backs) |
| Post Control | Beheersing in de post: hooks, fades, up-and-unders |

#### Shooting / Ranged Shooting (3)
| Attribuut | Beschrijving |
|---|---|
| Mid-Range Shot | Schoten van 3-7 meter, exclusief driepunters |
| Three-Point Shot | Driepunters, beïnvloedt ook de "green window" van de shot meter |
| Free Throw | Vrije worpen |

#### Playmaking / Handling (3)
| Attribuut | Beschrijving |
|---|---|
| Pass Accuracy | Nauwkeurigheid van alle soorten passes |
| Ball Handle | Dribbelvaardigheid, bepaalt welke moves beschikbaar zijn |
| Speed With Ball | Snelheid tijdens het dribbelen, beïnvloedt dribble launching |

#### Defense (4)
| Attribuut | Beschrijving |
|---|---|
| Interior Defense | Verdediging in de paint, post defense |
| Perimeter Defense | Verdediging aan de buitenkant, on-ball defense |
| Steal | Vermogen om de bal te stelen |
| Block | Vermogen om schoten te blokkeren |

#### Rebounding (2)
| Attribuut | Beschrijving |
|---|---|
| Offensive Rebound | Offensief rebounds pakken |
| Defensive Rebound | Defensief rebounds pakken |

#### Athleticism / Physicals (4)
| Attribuut | Beschrijving |
|---|---|
| Speed | Pure snelheid zonder bal |
| Agility | Versnelling, laterale beweging, richtingsverandering |
| Strength | Lichaamskracht, beïnvloedt alle contactsituaties |
| Vertical | Sprongkracht, beïnvloedt dunks, blocks en rebounds |

### Verborgen Attributen (4-6)

Naast de 21 zichtbare attributen heeft NBA 2K "verborgen" attributen die niet direct te zien zijn in de MyCareer builder maar wel meespelen:

| Attribuut | Beschrijving |
|---|---|
| Intangibles | Algehele impact die niet in cijfers te vangen is: clutch, leiderschap, toughness |
| Hustle | Inzet en doorzettingsvermogen, met name bij loose balls en op defense |
| Offensive Consistency | Vermogen om offensief niveau vast te houden gedurende de wedstrijd |
| Defensive Consistency | Vermogen om defensief niveau vast te houden |
| Shot IQ | Schotselctie: neemt de speler goede of slechte schoten? |

### Tendencies (~50 gedragsparameters)

Naast attributen heeft NBA 2K **tendencies**: frequenties (0-99) die bepalen HOE VAAK een speler een bepaalde actie uitvoert. Dit is geen vaardigheid maar gedragsvoorkeur.

**Shooting Tendencies:**
- Step Through Shot, Shot Close, Shot Close Left/Right
- Shot Mid-Range, Shot Three, Shot Under Basket
- Catch and Shoot, Pull Up Shot

**Driving Tendencies:**
- Drive Right/Left, Driving Layup, Driving Dunk
- Euro Step Layup, Hop Step Layup, Spin Layup
- Driving Half Spin, Driving Behind the Back
- Driving Double Crossover, Driving Crossover
- Driving Step Back

**Post Tendencies:**
- Post Up, Post Drive, Post Face Up
- Post Hook, Post Fade, Post Step Back
- Post Back Down, Post Spin

**Defense Tendencies:**
- On-Ball Steal, Passing Lane Steal
- Contest Shot, Block Shot
- Take Charge, Help Defense

**Passing Tendencies:**
- Dish to Open Man, Flashy Pass, Alley-Oop Pass

### Overall Rating Berekening

De overall rating (OVR) in NBA 2K wordt berekend met een **positie-afhankelijke gewogen formule**:

- Elke positie (PG, SG, SF, PF, C) heeft een eigen weging
- Zelfs binnen posities zijn er subtypes (bv. "defensive point guard" vs "scoring point guard")
- De exacte formule is **niet publiek**, maar community-analyses tonen:
  - Voor een PG wegen Ball Handle en Pass Accuracy zwaarder
  - Voor een C wegen Interior Defense en Rebounding zwaarder
  - Intangibles telt significant mee in de overall berekening
- Resultaat: 0-99 overall rating

### Badges (40 speciale vaardigheden)

Bovenop attributen heeft NBA 2K **badges** — speciale vaardigheden die een speler extra boost geven in specifieke situaties. 5 niveaus: Bronze → Silver → Gold → Hall of Fame → Legend.

Gecategoriseerd als:
- **Finishing Badges** (bv. Acrobat, Posterizer, Pro Touch)
- **Shooting Badges** (bv. Catch & Shoot, Corner Specialist, Deadeye)
- **Playmaking Badges** (bv. Ankle Breaker, Dimer, Floor General)
- **Defense Badges** (bv. Anchor, Challenger, Glove, Interceptor)

### Samenvatting NBA 2K Model

```
OVERALL (0-99, positie-gewogen)
├── Attributen (21, schaal 0-99)
│   ├── Inside Scoring (5)
│   ├── Shooting (3)
│   ├── Playmaking (3)
│   ├── Defense (4)
│   ├── Rebounding (2)
│   └── Athleticism (4)
├── Verborgen Attributen (5)
│   ├── Intangibles, Hustle, Consistency (Off/Def), Shot IQ
├── Tendencies (~50, schaal 0-99, gedragsfrequentie)
│   ├── Shooting, Driving, Post, Defense, Passing
└── Badges (40, 5 niveaus)
    ├── Finishing, Shooting, Playmaking, Defense
```

**Type model**: Hiërarchisch, platte lijst binnen categorieën, GEEN 2D-matrix.

---

## 2. Basketball GM (open-source basketball management game)

### Structuur: Platte lijst van 15 ratings

Basketball GM gebruikt een minimalistischer systeem met slechts 15 attributen. Schaal: **0-100** (normaal verdeeld rond 50).

### Volledige Attributenlijst

#### Fysieke Basis (5)
| Code | Naam | Beschrijving |
|---|---|---|
| `hgt` | Height | Beïnvloedt vrijwel alles (afgeleid van lengte in inches) |
| `stre` | Strength | Verdediging, rebounding, low post scoring |
| `spd` | Speed | Balbehandeling, fast breaks, verdediging |
| `jmp` | Jumping | Afwerken bij de ring, rebounding, blocks |
| `endu` | Endurance | Hoe snel vaardigheden afnemen bij vermoeidheid |

#### Offensieve Vaardigheden (6)
| Code | Naam | Beschrijving |
|---|---|---|
| `ins` | Inside Scoring | Low post scoring, afwerken dichtbij |
| `dnk` | Dunking/Layups | Afwerken aan de ring |
| `ft` | Free Throw | Vrije worpen |
| `fg` | 2-Point Shot | Mid-range jump shots |
| `tp` | 3-Point Shot | Driepunters |
| `drb` | Dribbling | Dribbelvaardigheid |

#### Passing (1)
| Code | Naam | Beschrijving |
|---|---|---|
| `pss` | Passing | Passen en playmaking |

#### Defensief/Rebounds (1)
| Code | Naam | Beschrijving |
|---|---|---|
| `reb` | Rebounding | Offensief en defensief |

#### Basketbal IQ (2)
| Code | Naam | Beschrijving |
|---|---|---|
| `oiq` | Offensive IQ | Beïnvloedt alle offensieve aspecten; jonge spelers scoren hier laag |
| `diq` | Defensive IQ | Beïnvloedt alle defensieve aspecten; groeit met ervaring |

### Aanvullende Spelerseigenschappen

- **Overall (ovr)**: Berekend uit alle ratings, 0-100
- **Potential (pot)**: Schatting van maximale overall (scout-inschatting, niet deterministisch)
- **Skills**: Afgeleide labels (bv. "3" = drievoudige dreiging, "A" = atletisch, "Ps" = passer)

### Samenvatting Basketball GM Model

```
OVERALL (0-100, berekend)
├── Fysiek (5): hgt, stre, spd, jmp, endu
├── Offensief (6): ins, dnk, ft, fg, tp, drb
├── Passing (1): pss
├── Rebounding (1): reb
└── IQ (2): oiq, diq
```

**Type model**: Platte lijst, 15 attributen, simpel en transparant.

---

## 3. NBA Officiële Advanced Statistics

### Structuur: Meerdere onafhankelijke metrics

De NBA gebruikt geen enkel ratingsysteem maar meerdere complementaire statistieken, vaak opgesplitst in **offense** en **defense**.

### Traditionele Box Score Stats

| Categorie | Stats |
|---|---|
| Scoring | PTS, FGM, FGA, FG%, 3PM, 3PA, 3P%, FTM, FTA, FT% |
| Rebounds | OREB, DREB, REB |
| Assists/Turnovers | AST, TOV, AST/TO ratio |
| Defense | STL, BLK |
| Overig | PF, MIN |

### Advanced Metrics (One-Number Metrics)

#### PER — Player Efficiency Rating
- **Ontwikkelaar**: John Hollinger
- **Schaal**: Liga-gemiddelde = 15.0
- **Formule**: Gewogen combinatie van alle box score stats, genormaliseerd per minuut en per tempo
- **Sterkte**: Eén getal dat alles samenvat
- **Zwakte**: Overwaardeert usage/volume, onderwaardeert defense

#### BPM — Box Plus/Minus
- **Schaal**: 0 = league average, positief = boven gemiddeld
- **Opsplitsing**: OBPM (offense) + DBPM (defense) = BPM
- **Formule**: Regressiemodel op box score stats met RAPM als afhankelijke variabele
- **Sterkte**: Expliciet offense/defense split

#### Win Shares
- **Ontwikkelaar**: Gebaseerd op Bill James (honkbal)
- **Schaal**: Absoluut aantal "gewonnen wedstrijden" bijgedragen
- **Opsplitsing**: OWS (Offensive Win Shares) + DWS (Defensive Win Shares) = WS
- **Per 48 min**: WS/48 voor vergelijkbaarheid

#### RAPTOR — Robust Algorithm (using) Player Tracking (and) On/Off Ratings
- **Ontwikkelaar**: FiveThirtyEight
- **Schaal**: Punten boven/onder gemiddelde per 100 possessions
- **Componenten**:
  - **Box component**: Individuele stats uit player tracking en play-by-play
  - **On/Off component**: Teamprestatie met/zonder speler
- **Opsplitsing**: RAPTOR Offense + RAPTOR Defense = RAPTOR Total
- **Sterkte**: Combineert tracking data met team-impact

#### EPM — Estimated Plus-Minus
- **Ontwikkelaar**: Dunks & Threes
- **Schaal**: Punten boven/onder gemiddelde per 100 possessions
- **Opsplitsing**: O-EPM + D-EPM = EPM

### Patroon in NBA Analytics

Alle serieuze NBA-metrics splitsen uiteindelijk op in **twee dimensies**:

```
TOTAAL IMPACT
├── OFFENSE (aanvallende bijdrage)
└── DEFENSE (verdedigende bijdrage)
```

Dit is de meest fundamentele as in basketbal-analytics. Binnen offense en defense wordt verder niet formeel gecategoriseerd — het zijn geïntegreerde metrics.

---

## 4. EA Sports FC / FIFA (voetbal, ter vergelijking)

### Structuur: Hiërarchisch (6 Hoofdstats → 29 Substats)

EA Sports FC gebruikt het bekendste ratingsysteem in gaming: 6 zichtbare hoofdcategorieën die elk een gewogen gemiddelde zijn van 4-6 onderliggende attributen. Schaal: **0-99**.

### Volledige Attributenlijst

#### PAC — Pace (2 substats)
| Attribuut | Gewicht | Beschrijving |
|---|---|---|
| Acceleration | 45% | Hoe snel een speler topsnelheid bereikt |
| Sprint Speed | 55% | Maximale snelheid |

#### SHO — Shooting (5 substats)
| Attribuut | Beschrijving |
|---|---|
| Finishing | Afwerken dichtbij het doel |
| Long Shots | Schoten van buiten het strafschopgebied |
| Shot Power | Kracht van het schot |
| Volleys | Afwerken uit de lucht |
| Penalties | Penalty-vaardigheid |

#### PAS — Passing (4 substats)
| Attribuut | Beschrijving |
|---|---|
| Short Passing | Korte passes |
| Long Passing | Lange passes |
| Crossing | Voorzetten |
| Vision | Overzicht en creativiteit |

#### DRI — Dribbling (6 substats)
| Attribuut | Gewicht | Beschrijving |
|---|---|---|
| Agility | 25% | Wendbaarheid |
| Balance | 25% | Balans bij contact |
| Reactions | 15% | Reactiesnelheid |
| Ball Control | 20% | Balbeheersing |
| Composure | 10% | Rust aan de bal onder druk |
| Dribbling | 5% | Pure dribbelvaardigheid |

#### DEF — Defending (4 substats)
| Attribuut | Beschrijving |
|---|---|
| Def. Awareness | Positioneel bewustzijn bij verdedigen |
| Standing Tackle | Staande tackle |
| Sliding Tackle | Glijdende tackle |
| Interceptions | Onderscheppen van passes |

#### PHY — Physicality (4 substats)
| Attribuut | Beschrijving |
|---|---|
| Stamina | Uithoudingsvermogen |
| Strength | Lichaamskracht |
| Jumping | Sprongkracht |
| Aggression | Agressiviteit / duelkracht |

#### Aanvullende attributen (buiten de 6 hoofdcategorieën)
| Attribuut | Beschrijving |
|---|---|
| Heading Accuracy | Kopvaardigheid |
| Free Kick Accuracy | Vrije trappen |
| Curve | Effect op de bal |
| Positioning / Att. Position | Aanvallende positionering |

### Overall Rating Berekening

De overall rating in EA Sports FC is **positie-afhankelijk gewogen**:

- Elke positie (ST, CAM, CM, CDM, CB, LB/RB, GK) heeft eigen gewichten
- Voor een **spits (ST)**: Finishing en Positioning wegen het zwaarst
- Voor een **verdediger (CB)**: Def. Awareness en Standing Tackle wegen het zwaarst
- Een speler kan **verschillende OVR-ratings** hebben op verschillende posities
- Multi-positionele spelers krijgen positie-modificatoren

### Samenvatting EA Sports FC Model

```
OVERALL (0-99, positie-gewogen)
├── PAC — Pace (2 substats)
├── SHO — Shooting (5 substats)
├── PAS — Passing (4 substats)
├── DRI — Dribbling (6 substats)
├── DEF — Defending (4 substats)
└── PHY — Physicality (4 substats)
    + ~4 losse attributen (Heading, FK, Curve, Positioning)
```

**Type model**: Hiërarchisch, 6+1 categorieën met gewogen substats.

---

## 5. Football Manager (ter vergelijking — de deepest simulation)

### Structuur: ECHTE 2D-MATRIX (3 dimensies × vaardigheden)

Football Manager is het enige grote spel dat een **echte dimensionale structuur** gebruikt. Alle spelersattributen zijn ingedeeld langs drie dimensies die dwars door alle vaardigheden lopen.

### De Drie Dimensies

| Dimensie | Beschrijving | Aantal attributen |
|---|---|---|
| **Technical** | Uitvoering: hoe goed kan je het? | 14 |
| **Mental** | Besluitvorming: wanneer en waarom? | 13 |
| **Physical** | Lichaam: wat kan je fysiek? | 8 |

### Volledige Attributenlijst (35 attributen, schaal 1-20)

#### Technical (14) — "Wat kan je uitvoeren?"
| Attribuut | Beschrijving |
|---|---|
| Corners | Corners nemen |
| Crossing | Voorzetten geven |
| Dribbling | Dribbelen |
| Finishing | Afwerken |
| First Touch | Eerste aanname |
| Free Kick Taking | Vrije trappen |
| Heading | Koppen |
| Long Shots | Afstandsschoten |
| Long Throws | Lange inworp |
| Marking | Dekken van tegenstander |
| Passing | Passen |
| Penalty Taking | Penalty's nemen |
| Tackling | Tackelen |
| Technique | Algehele technische uitvoering |

#### Mental (13) — "Hoe denk je over het spel?"
| Attribuut | Beschrijving |
|---|---|
| Aggression | Agressiviteit en duelbereidheid |
| Anticipation | Spelherkenning en vooruitdenken |
| Bravery | Moed, bereidheid om risico te nemen |
| Composure | Rust onder druk |
| Concentration | Concentratie gedurende de wedstrijd |
| Decisions | Kwaliteit van beslissingen |
| Determination | Doorzettingsvermogen en motivatie |
| Flair | Creativiteit en onvoorspelbaarheid |
| Off the Ball | Bewegen zonder bal |
| Positioning | Defensieve positionering |
| Teamwork | Samenwerking en teamgerichtheid |
| Vision | Overzicht en passing-creativiteit |
| Work Rate | Werkethiek en inzet |

#### Physical (8) — "Wat kan je lichaam?"
| Attribuut | Beschrijving |
|---|---|
| Acceleration | Versnelling |
| Agility | Wendbaarheid |
| Balance | Balans |
| Jumping Reach | Sprongkracht |
| Natural Fitness | Natuurlijke fitheid (herstel, blessure-resistentie) |
| Pace | Topsnelheid |
| Stamina | Uithoudingsvermogen |
| Strength | Kracht |

#### Goalkeeping (13) — Speciale keeperattributen
| Attribuut | Beschrijving |
|---|---|
| Aerial Reach | Bereik in de lucht |
| Command of Area | Dominantie in het strafschopgebied |
| Communication | Communicatie met verdedigers |
| Eccentricity | Onvoorspelbaarheid in gedrag |
| First Touch | Eerste aanname |
| Handling | Bal vasthouden |
| Kicking | Uittrap |
| One On Ones | Één-op-één situaties |
| Passing | Meetrappen |
| Punching | Wegstompen vs vangen (tendency) |
| Reflexes | Reflexen |
| Rushing Out | Uitkomen (tendency) |
| Throwing | Uitgooien |

### Het 2D-Principe van Football Manager

Football Manager benadert de **matrix-vraag** het dichtst. Neem "passing" als voorbeeld:

| Dimensie | Relevant attribuut | Vraag |
|---|---|---|
| **Technical** | Passing | Kan je de bal technisch goed trappen? |
| **Mental** | Vision | Zie je de juiste pass? |
| **Mental** | Decisions | Kies je het juiste moment? |
| **Mental** | Composure | Doe je het ook onder druk? |
| **Physical** | Strength | Kan je de bal ver genoeg trappen? |

Eén spelactie (passen) wordt dus bepaald door attributen uit **alle drie dimensies**.

### Samenvatting Football Manager Model

```
GEEN OVERALL RATING (expliciet afwezig!)
├── Technical (14) — uitvoering
├── Mental (13) — besluitvorming en karakter
├── Physical (8) — lichaam
└── Goalkeeping (13) — specialistisch
```

**Type model**: Quasi-matrix. Formeel een platte lijst van 35 attributen, maar georganiseerd langs drie dimensies die dwars door vaardigheden snijden. Geen overall rating — de game berekent prestaties dynamisch.

---

## 6. De Matrix-Vraag: Platte Lijst of 2D?

### Analyse per systeem

| Systeem | Structuur | AS 1 (Wat?) | AS 2 (Hoe goed?) | Echt 2D? |
|---|---|---|---|---|
| **NBA 2K** | Hiërarchisch (6 cat.) | Ja (scoring/defense/etc.) | Nee (alles is "technisch") | **Nee** |
| **Basketball GM** | Platte lijst (15) | Deels (shooting/defense) | Deels (IQ vs skill) | **Nee** |
| **NBA Analytics** | Twee-assig | Ja (alle spelaspecten) | Altijd Offense vs Defense | **Deels** |
| **EA Sports FC** | Hiërarchisch (6 cat.) | Ja (schieten/passen/etc.) | Nee (alles is vaardigheid) | **Nee** |
| **Football Manager** | 3 dimensies | Via Technical attributen | Technical / Mental / Physical | **JA** |

### Conclusie

**Vrijwel geen enkel systeem gebruikt een echte 2D-matrix.**

De meeste systemen gebruiken een **hiërarchische platte lijst**:
- Hoofdcategorieën = "wat doe je" (schieten, verdedigen, etc.)
- Elke categorie heeft attributen die impliciet techniek meten
- Er is geen expliciete tweede as voor "hoe goed" (technisch/tactisch/fysiek/mentaal)

**Football Manager is de uitzondering**:
- Drie expliciete dimensies (Technical, Mental, Physical) die dwars door alle vaardigheden snijden
- Een speler met hoge Technical Passing maar lage Mental Vision is een andere speler dan andersom
- Dit maakt Football Manager het meest genuanceerde systeem

**Basketball GM hint naar 2D** met zijn IQ-ratings:
- `oiq` (Offensive IQ) en `diq` (Defensive IQ) zijn een ruwe mentale dimensie
- Maar het is niet consistent doorgevoerd — er is geen "technical shooting" vs "mental shooting"

### Wat betekent dit voor een korfbal-ratingsysteem?

De game-industrie leert ons:

1. **Eén overall nummer is onvermijdelijk** — gebruikers willen vergelijken (NBA 2K, FIFA)
2. **6-8 hoofdcategorieën is de sweet spot** — genoeg detail, niet overweldigend (FIFA's hexagoon)
3. **Positie-afhankelijke weging maakt overall eerlijk** — een aanvaller hoeft niet te verdedigen voor een hoge score
4. **De Technical/Mental/Physical driehoek is krachtig** — Football Manager bewijst dat dit werkt
5. **Tendencies (gedrag) ≠ Ability (vaardigheid)** — NBA 2K's scheiding is briljant: een speler KAN driepunters maken (attribuut hoog) maar KIEST dat nooit te doen (tendency laag)
6. **Badges/speciale vaardigheden** voegen een kwalitatieve laag toe die cijfers niet vangen

### Een mogelijke 2D-matrix voor korfbal

Geïnspireerd door Football Manager's aanpak:

```
              │ Technisch    │ Tactisch     │ Fysiek       │ Mentaal      │
              │ (uitvoering) │ (beslissing) │ (lichaam)    │ (karakter)   │
──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
Schieten      │ Schottechniek│ Schotselctie │ Armkracht    │ Clutch       │
Aanvallen     │ Aannemen     │ Vrijlopen    │ Snelheid     │ Durf         │
Samenspel     │ Passtechniek │ Overzicht    │ Uithoud.     │ Teamwork     │
Verdedigen    │ Onderschepp. │ Positiespel  │ Kracht       │ Concentratie │
Rebounding    │ Timing       │ Anticipatie  │ Sprongkracht │ Werklust     │
```

Dit zou een **5×4 = 20 cellen matrix** opleveren, vergelijkbaar met NBA 2K's 21 attributen maar met een expliciete tweede dimensie die Football Manager's kracht benut.

---

## Bronnen

### NBA 2K
- [NBA 2K26: All Attributes, Explained — Game Rant](https://gamerant.com/nba-2k26-all-attributes-explained/)
- [NBA 2K26 Attributes — NBA 2KW](https://nba2kw.com/nba2k-attributes)
- [NBA 2K26 Attributes Definitions — 2K Ratings](https://www.2kratings.com/nba-2k-attributes-definitions)
- [NBA 2K26 Attribute Calculated Weights — NBA 2KLab](https://www.nba2klab.com/nba2k-attribute-calculated-weights-heat)
- [Overall Rating — NBA 2K Wiki](https://nba2k.fandom.com/wiki/Overall_Rating)
- [How NBA 2K Determines Player Rankings — Complex](https://www.complex.com/sports/a/kevin-wong/how-nba-2k-determines-player-rankings)
- [NBA 2K Ratings: How They Are Determined — HoopsHype](https://eu.hoopshype.com/story/sports/nba/2017/08/20/nba-2k-ratings-how-they-are-determined-and-why-players-care-so-much-about-them/82932001007/)

### Basketball GM
- [Basketball GM Manual](https://basketball-gm.com/manual/)
- [Players Customization — Basketball GM](https://basketball-gm.com/manual/customization/players/)
- [Player Ratings Development — ZenGM Blog](https://zengm.com/blog/2018/02/player-ratings-and-development-beta/)

### NBA Analytics
- [Players Advanced Stats — NBA.com](https://www.nba.com/stats/players/advanced)
- [Introducing RAPTOR — FiveThirtyEight](https://fivethirtyeight.com/features/introducing-raptor-our-new-metric-for-the-modern-nba/)
- [Advanced Basketball Statistics Explained — Data4Basket](https://data4basket.com/en/advanced-basketball-statistics-the-data-revolution-in-the-game)
- [What is the best advanced statistic? NBA executives weigh in — HoopsHype](https://hoopshype.com/lists/advanced-stats-nba-real-plus-minus-rapm-win-shares-analytics/)

### EA Sports FC / FIFA
- [Player Attributes — FIFPlay](https://www.fifplay.com/encyclopedia/player-attributes/)
- [FC 26 Player Ratings — EA.com](https://www.ea.com/games/ea-sports-fc/ratings)
- [EAFC 26 Questions Answered by Data — Medium](https://medium.com/@Bajooo/my-eafc-26-questions-answered-by-data-d43f20a54d64)

### Football Manager
- [Football Manager 2025 Player Attributes — FIFPlay](https://www.fifplay.com/football-manager-2025-player-attributes/)
- [FM24 Guide: Player Attributes Explained — SortItOutSI](https://sortitoutsi.net/content/67538/fm24-guide-players-attributes-explained)
- [Football Manager Player Attributes — Passion4FM](https://www.passion4fm.com/football-manager-player-attributes/)
