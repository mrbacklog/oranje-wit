# UX-Spec: TC-Beleid Presentatie — "Een leven lang!"

**Ontworpen door**: UX-designer, c.k.v. Oranje Wit
**Datum**: 30 maart 2026
**Status**: Design document (geen implementatie)
**Doelgroep**: TC-leden, trainers, ouders, leden — iedereen die wil begrijpen hoe OW werkt

---

## 1. Design-uitgangspunten

### Visuele taal
De presentatie volgt exact dezelfde visuele taal als de bestaande jeugdontwikkelings-presentatie (toelichtingspaginas.md), uitgebreid naar het volledige ledenbestand. Dark-first, warm, beeldend, toegankelijk.

### Twee-lagen architectuur
Dit is de kernvernieuwing ten opzichte van de jeugdpresentatie:

| Laag | Naam | Karakter | Publiek |
|---|---|---|---|
| **Laag 1** | De presentatie | Warm, visueel, verhalend, zonder jargon | Iedereen |
| **Laag 2** | (i)-dialogen | Wetenschappelijk, onderbouwd, met bronnen | Wie dieper wil graven |

Laag 1 is wat je **ziet**. Laag 2 is wat je **kunt opvragen**. Je hoeft nooit de (i)-dialoog te openen om de presentatie te begrijpen. Maar als je wilt weten *waarom* iets zo is, staat het er.

### Toon en stijl
- **Laag 1**: Dezelfde warmte als de jeugdpresentatie. Korte zinnen. Herkenbare situaties. Metaforen. Persoonlijk aanspreken. Geen "de speler" maar "je kind", "jij", "we".
- **Laag 2**: Zakelijker, maar niet droog. Helder taalgebruik. Bronvermelding. Data waar relevant. SDT-koppelingen. Vergelijkbare clubs als referentie.

---

## 2. Globale structuur

### Tab-navigatie

```
┌─────────────────────────────────────────────────────────────────┐
│  Een leven lang!  │  Jeugd  │  Overgang  │  Senioren  │  Rec  │  Binden  │
│  ════════════════                                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Gedrag**:
- Horizontale pill-strip, sticky bovenaan het scherm
- Actieve tab: gevulde achtergrond in de tab-kleur (zie hieronder), witte tekst
- Inactieve tabs: transparante achtergrond, `--text-secondary` kleur
- Op mobile: horizontaal scrollbaar als niet alles past, actieve tab altijd zichtbaar
- Swipe-navigatie tussen tabs (links/rechts)
- Subtiele slide-animatie bij tab-wissel (content schuift horizontaal, 300ms ease-out)

### Tab-kleuren
Elke tab heeft een subtiele kleurvariatie die door de hele tab-content schemerT. Niet als achtergrondkleur, maar als accentkleur voor headings, dividers, en de (i)-iconen.

| Tab | Kleur | Token | Rationale |
|---|---|---|---|
| 1. Een leven lang! | OW Oranje `#FF6B00` | `--ow-accent` | De verenigingskleur. Het geheel. |
| 2. Jeugd | Groen `#22C55E` | `--ow-success` | Groei, ontwikkeling, plezier |
| 3. Overgang | Amber `#F59E0B` | — | Waarschuwing, aandacht, transitie |
| 4. Senioren | Blauw `#3B82F6` | `--ow-cat-blauw` | Stabiliteit, volwassenheid |
| 5. Recreatief | Teal `#14B8A6` | — | Ontspanning, balans, vangnet |
| 6. Binden | Warm rood `#EF4444` | `--ow-danger` | Passie, hart, verbondenheid |

De kleur wordt toegepast op:
- De actieve tab-indicator (pill-achtergrond)
- Section dividers (subtiele gradient-lijn)
- (i)-icoon ring (in de tab-kleur)
- Pull quotes en highlight-teksten
- Visual accent-elementen

### Scroll-gedrag
- Elke tab scrollt verticaal, onafhankelijk van andere tabs
- De tab-strip blijft altijd zichtbaar (sticky)
- Bij lange tabs: zachte scroll-indicator (fade-out aan de onderkant)
- Terugkeer naar een tab herstelt de scroll-positie

---

## 3. Het (i)-dialoog patroon

### Het icoon

```
    ┌───┐
    │ i │   <-- 28px cirkel
    └───┘
```

- **Afmeting**: 28px diameter cirkel
- **Stijl**: 2px ring in de actieve tab-kleur, transparante achtergrond, wit "i" (font-weight 600, 14px, Inter)
- **Positie**: inline naast de sectie-titel, of rechts-boven bij een visual/kaart
- **Touch target**: 44px (onzichtbare hit-area rondom het 28px icoon)
- **Hover/active**: ring wordt gevuld met de tab-kleur, "i" wordt zwart
- **Animatie**: zachte pulse bij eerste keer zichtbaar worden (1x, 400ms, dan stoppen)

### De dialoog (overlay)

**Trigger**: tik/klik op (i)-icoon

**Verschijning**:
1. Achtergrond dimt (overlay `rgba(0,0,0,0.6)`, fade-in 200ms)
2. Dialoog schuift omhoog vanaf de onderkant (slide-up, 300ms, cubic-bezier)
3. Op desktop: dialoog verschijnt als centered modal (max-width 560px)

**Dialoog styling**:
- **Achtergrond**: glassmorphism — `backdrop-filter: blur(16px); background: rgba(20,20,20,0.92)`
- **Border**: 1px `rgba(255,255,255,0.08)`
- **Border-radius**: 20px (top-left, top-right), 0 (bottom) op mobile; 20px alle hoeken op desktop
- **Max-height**: 70vh op mobile, 60vh op desktop
- **Scrollbaar**: als content langer is dan de dialoog
- **Shadow**: `0 -4px 30px rgba(0,0,0,0.5)`

**Dialoog structuur**:

```
┌──────────────────────────────────────────┐
│  ─── (drag handle, 40px, grijs)          │
│                                          │
│  TITEL                                   │
│  In de tab-accentkleur, 20px, semi-bold  │
│                                          │
│  Lopende tekst                           │
│  --text-primary, 15px, regelmatige       │
│  regelafstand (1.6). Helder en zakelijk  │
│  maar niet droog.                        │
│                                          │
│  ┌─ BRON ──────────────────────────────┐ │
│  │  Icoon + "Nature/Scientific Reports │ │
│  │  2024" — klikbare link              │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─ OW-DATA ──────────────────────────┐  │
│  │  Relevante OW-specifieke data of   │  │
│  │  vergelijking met landelijk gemid.  │  │
│  └─────────────────────────────────────┘  │
│                                          │
│  ┌─ SDT-KOPPELING ───────────────────┐   │
│  │  Welke basisbehoeften (autonomie,  │   │
│  │  competentie, verbondenheid) hier  │   │
│  │  relevant zijn en waarom.          │   │
│  └────────────────────────────────────┘   │
│                                          │
└──────────────────────────────────────────┘
```

**Bron-tags styling**:
- Kleine kaartjes (`--surface-card` achtergrond, `--border-default` border)
- Label linksboven in de tag: "BRON", "OW-DATA", "SDT", "BEST PRACTICE"
- Label kleur: tab-accentkleur, 11px, uppercase, letter-spacing 0.5px
- Content: `--text-primary`, 14px

**Sluiten**:
- Swipe-down op de drag handle
- Tik op de gedimde achtergrond
- Escape-toets op desktop
- Animatie: slide-down 250ms + fade-out achtergrond

---

## 4. Tab 1 — "Een leven lang!" — Wie we zijn

### Kleur-accent: OW Oranje (`#FF6B00`)

### Sectie 1.1: Opening

**Tekst (Laag 1)**:
> Bij c.k.v. Oranje Wit geloven we dat sport niet stopt bij je achttiende verjaardag. Niet bij je dertigste. Niet bij je vijftigste. Korfbal bij Oranje Wit is voor altijd — als je dat wilt.
>
> Of je nu 5 bent en voor het eerst een bal gooit. Of 17 en droomt van het eerste team. Of 35 en op dinsdag even lekker wilt bewegen. Of 55 en elke zaterdag langs de lijn staat om daarna samen een biertje te doen.
>
> Er is altijd een plek.

**Geen visual hier** — de tekst IS de visual. Wit op donker, groot, ademend. De woorden moeten het doen.

### Sectie 1.2: De Oranje Draad

[VISUAL: Dezelfde drie overlappende cirkels als in de jeugdpresentatie — PLEZIER (warm groen), ONTWIKKELING (wit/lichtblauw), PRESTATIE (diep oranje). In het midden: DUURZAAMHEID. Maar nu met een toevoeging: onder de cirkels staan vijf kleine silhouetten in oplopende grootte (kind, puber, jongvolwassene, volwassene, 50-plusser). Elk silhouet heeft een dunne lijn naar de cirkels, maar de lijn raakt bij elk silhouet een ander zwaartepunt van de overlapping. Het kleinste figuur raakt "plezier", het grootste raakt het midden. Onderschrift: "Dezelfde drie pijlers. Voor iedereen. De mix verschuift, het fundament blijft."]

**Tekst**:
> Alles wat we doen draait om drie dingen: **Plezier**, **Ontwikkeling** en **Prestatie**. Samen noemen we dat de **Oranje Draad** — de rode draad door alles wat we doen.
>
> Het bijzondere: de verhouding verschuift per levensfase. Bij de jongsten is plezier koning. Bij senioren weegt prestatie zwaarder. Bij recreatief korfbal draait het weer meer om plezier en samen zijn.
>
> Maar alle drie zijn er altijd. Prestatie zonder plezier leidt tot afhakers. Plezier zonder ontwikkeling leidt tot verveling. Ontwikkeling zonder prestatie mist een kompas.

**(i)-dialoog: "De Oranje Draad en SDT"**
- **Titel**: De wetenschap achter de drie pijlers
- **Tekst**: Self-Determination Theory (Deci & Ryan, 1985) onderscheidt drie psychologische basisbehoeften: autonomie, competentie en verbondenheid. De Oranje Draad van OW mapt hier opmerkelijk goed op: Plezier correspondeert met verbondenheid en autonomie ("ik heb het naar mijn zin, ik voel me thuis"). Ontwikkeling correspondeert met competentie ("ik word beter, ik groei"). Prestatie correspondeert met competentie en autonomie ("ik kan laten zien wat ik kan"). De formule Plezier + Ontwikkeling + Prestatie = Duurzaamheid is daarmee wetenschappelijk robuust: wanneer alle drie de basisbehoeften vervuld worden, is de motivatie zelfonderhoudend.
- **Bron**: Nature/Scientific Reports 2024: "Competence, autonomy, and relatedness play mediating roles in activating and maintaining sports participation"
- **SDT-koppeling**: Alle drie de basisbehoeften

### Sectie 1.3: Vijf doelgroepen

[VISUAL: Vijf verticale kaarten naast elkaar (op mobile: horizontaal scrollbaar carousel). Elke kaart heeft een kleur-accent aan de bovenkant, een icoon, een naam en een korte tagline. De kaarten zijn in dark glassmorphism-stijl.

Kaart 1 — Jeugd (groen accent):
- Icoon: spelend kind met bal
- "Jeugd (5-18)"
- "Groeien in veiligheid"

Kaart 2 — Overgang (amber accent):
- Icoon: twee pijlen die samenkomen (jeugd-naar-senioren)
- "De overgang (16-22)"
- "Het gevaarlijkste moment"

Kaart 3 — Selectie (blauw accent):
- Icoon: podium / vlaggenschip
- "Senioren selectie"
- "Vlaggenschip en verbinder"

Kaart 4 — Breedte (blauw-licht accent):
- Icoon: groep mensen
- "Senioren breedte"
- "De ruggengraat"

Kaart 5 — Recreatief (teal accent):
- Icoon: hartje met bal
- "Recreatief & midweek"
- "Altijd een plek"

Elke kaart is tappable en springt naar de bijbehorende tab.]

**Tekst**:
> Vijf doelgroepen. Elk met eigen behoeften, eigen dynamiek, eigen uitdagingen. De TC houdt ze allemaal in balans — want wat je voor de een doet, raakt de ander.

### Sectie 1.4: De levenslijn

[VISUAL: Een horizontale tijdlijn die het hele scherm beslaat (op mobile: horizontaal scrollbaar). Van links naar rechts:

**5** -------- **12** -------- **18** -------- **25** -------- **35** -------- **50+**

De lijn is een zachte gradient in OW-oranje. Boven de lijn staan op elke leeftijdsmarker kleine illustraties:
- 5: kind dat bal gooit
- 12: kind dat doorloopbal maakt ("DE GROTE STAP" label)
- 18: jongere in tweesplitsing (jeugd-pad en senioren-pad splitsen)
- 25: volwassene op het veld, klein kindje aan de zijlijn
- 35: persoon met aktetas die rent naar een veld
- 50+: twee personen die samen lopen (OldStars-stijl)

Onder de lijn een dunne POP-balk die geleidelijk verschuift: groen dominant links, oranje dominant in het midden, groen weer dominant rechts.

Op de 18-marker een subtiele "gevaar"-indicator: een amber pulse.

Onderschrift: "Een leven lang korfbal. Van de eerste bal tot de laatste walking korfbal."]

**(i)-dialoog: "Retentie over de levenslijn"**
- **Titel**: Wanneer haken sporters af?
- **Tekst**: Er zijn vier kritieke momenten in een sportcarriere. Bij 6-7 jaar stopt 16-18% per jaar ("het is niet leuk genoeg"). Bij 12-13 jaar stopt 8-10% per jaar (team-ontevredenheid, andere hobby's). Bij 16-18 jaar stopt 13-18% per jaar (studie, werk, tijdsdruk). Bij 25-35 jaar zijn levensgebeurtenissen de trigger (verhuizing, gezin, carriere). OW presteert beter dan het landelijke gemiddelde bij 10-15 jaar (92-95% retentie vs. 82-86% landelijk). De "senior-cliff" bij 17 jaar (82% retentie) is het grootste pijnpunt.
- **Bron**: OW eigen data (1246 spelers, 16 seizoenen); KNHB Uitstroomonderzoek 2024 (n=6000)
- **OW-data**: Retentie per leeftijd uit jeugdmodel.yaml
- **SDT-koppeling**: Bij elk afhaalmoment is minstens een van de drie basisbehoeften niet vervuld

### Sectie 1.5: Afsluiting tab 1

**Tekst**:
> Elke doelgroep krijgt wat het nodig heeft. Niet meer, niet minder. In de volgende tabs laten we zien hoe dat eruitziet — van de jongste speler tot de oudste.

---

## 5. Tab 2 — "Jeugdontwikkeling" — Groeien in veiligheid

### Kleur-accent: Groen (`#22C55E`)

### Inhoud
Dit IS de bestaande presentatie uit `docs/jeugdontwikkeling/toelichtingspaginas.md`. De volledige inhoud van pagina 1, 2 en 3 wordt hier opgenomen, met de volgende aanpassingen:

1. **Alle visuals blijven identiek** — dezelfde [VISUAL: ...] tags, dezelfde stijl
2. **Elke sectie krijgt een (i)-icoon** met wetenschappelijke onderbouwing
3. **De tab-kleur is groen** (in plaats van OW-oranje), passend bij de jeugdthematiek

### Toegevoegde (i)-dialogen

**(i) bij "De Oranje Draad" (sectie over POP-ratio's)**:
- **Titel**: Waarom verschuift de nadruk?
- **Tekst**: De POP-ratio's van OW zijn niet willekeurig gekozen. Bij kinderen tot 12 is plezier de sterkste voorspeller van blijven (KNHB 2024: 35% van kinderen die stoppen zegt "ik vond het niet meer leuk"). Deliberate play is effectiever dan deliberate practice op jonge leeftijd. Naarmate kinderen ouder worden, verschuift de motivatie naar competentie en autonomie — ze willen beter worden en zelf keuzes maken.
- **Bron**: KNHB Uitstroomonderzoek 2024; Sport Vlaanderen 2022
- **SDT-koppeling**: Verbondenheid domineert bij jongsten, competentie en autonomie groeien met leeftijd

**(i) bij "De plezier-cocktail"**:
- **Titel**: Plezier is meetbaar
- **Tekst**: "Plezier" klinkt vaag, maar is wetenschappelijk goed te operationaliseren. Het omvat sociale cohesie (vrienden in het team), gevoel van competentie (ik word beter), autonomie (ik mag meedoen op mijn manier) en variatie (het is niet elke keer hetzelfde). De "plezier-cocktail" van OW beschrijft precies deze vier SDT-gerelateerde componenten.
- **Bron**: Frontiers in Sports and Active Living 2025: "Team sport athletes reported higher relatedness satisfaction"

**(i) bij "Inside Out: het groeit mee" (pijlerevolutie)**:
- **Titel**: Cognitieve ontwikkeling en sportbeoordeling
- **Tekst**: De pijlerevolutie is gebaseerd op de cognitieve ontwikkeling van kinderen. Een 6-jarige denkt concreet: "bal", "rennen". Een 12-jarige kan abstract denken: "aanvallen" vs. "verdedigen". Dit sluit aan bij Piaget's stadia van cognitieve ontwikkeling. Het KNKV bevestigt: "Voor 12 jaar is het vrijwel onmogelijk om te identificeren wie de getalenteerde spelers zijn." De timing van DE GROTE STAP bij Geel (10-12) is daarom zowel cognitief als sportief onderbouwd.
- **Bron**: KNKV vaardigheidsraamwerk; Piaget's ontwikkelingsstadia

**(i) bij "Biologische rijping" (Oranje-sectie)**:
- **Titel**: Early en late maturers in de sport
- **Tekst**: Bij 13-15 jaar zijn de fysieke verschillen door biologische rijping enorm. Onderzoek toont dat vroeg-rijpe spelers systematisch worden overgeselecteerd in jeugdsport, terwijl late rijpers op langere termijn vaak minstens zo goed presteren. Door het fysiek profiel als context te registreren (niet als score), voorkomt OW deze selectiebias. Dit is een van de redenen waarom OW presteert boven het landelijke gemiddelde bij 10-15 jaar.
- **Bron**: Systematische review late-adolescence dropout, Frontiers in Public Health 2024

**(i) bij "Plezier meten is geen luxe" (Oranje-sectie)**:
- **Titel**: De kritieke leeftijd voor uitval
- **Tekst**: De KNHB rapporteert dat "vanwege mijn team" de nummer-1 reden is om te stoppen bij 12-18 jarigen (36%). Teamsamenstelling bij de A-categorie is letterlijk de belangrijkste retentiefactor. Door plezier expliciet te meten bij Oranje (13-15), detecteert OW vroegtijdig signalen die anders pas zichtbaar worden als het te laat is — namelijk wanneer een speler opzegt.
- **Bron**: KNHB Uitstroomonderzoek 2024: "vanwege mijn team" (25% totaal, 36% bij 12-18)

**(i) bij "KERN vs. ONDERSCHEIDEND" (Rood-sectie)**:
- **Titel**: Selectie en ontwikkeling in balans
- **Tekst**: De KERN/ONDERSCHEIDEND-classificatie voorkomt dat trainers alleen naar topvaardigheden kijken. Een speler die alle KERN-items beheerst, kan op niveau spelen — ongeacht de ONDERSCHEIDEND-scores. Dit is een bewuste keuze: we willen brede ontwikkeling stimuleren (competentie-breed), niet smalle selectie (alleen de uitblinkers zien).
- **SDT-koppeling**: Competentie — breedte boven diepte in de formatieve jaren

---

## 6. Tab 3 — "De overgang" — Het gevaarlijkste moment

### Kleur-accent: Amber (`#F59E0B`)

### Sectie 3.1: De cliff

[VISUAL: Een grafiek die eruitziet als een wandelpad langs een klif. Links een groen, geleidelijk stijgend pad (jeugd, 92-95% retentie). In het midden een scherpe daling — de klif — met het getal "82%" erbij (retentie bij 17 jaar). Rechts het pad dat weer geleidelijk stijgt (senioren). Op de rand van de klif staat een figuurtje dat naar beneden kijkt. Een hand reikt omhoog. De klif is amber/oranje gekleurd. Onderschrift: "Bij 17 jaar verliezen we bijna 1 op de 5 spelers. Dat hoeft niet."]

**Tekst**:
> Dit is het moment waar we de meeste spelers verliezen.
>
> De overstap van jeugd naar senioren. Je bent 16, 17, 18. Je hele leven verandert: studie, bijbaan, uitgaan, relaties. En dan moet je ook nog van je vertrouwde jeugdteam naar een seniorenteam waar je niemand kent.
>
> Bij 17 jaar zakt de retentie naar 82%. Bijna 1 op de 5 spelers haakt af. Niet omdat ze geen zin meer hebben in korfbal — maar omdat de overgang te groot voelt.

**(i)-dialoog: "De senior-cliff in data"**
- **Titel**: Waarom haken 16-18 jarigen af?
- **Tekst**: De oorzaken zijn multifactorieel. Studie (34%), andere prioriteiten (22%), "niet meer bij leeftijdsgenoten" (18%), tijdsdruk (15%). Landelijk is de uitval bij 16-17 jarigen in sommige sporten 30% per jaar (Athletics Weekly 2024). OW zit met 18% per jaar onder het landelijke gemiddelde, maar het is nog steeds het grootste pijnpunt. De beschermfactoren die onderzoek noemt — sense of belonging, geleidelijke transitie, flexibiliteit — zijn precies wat OW probeert te organiseren.
- **Bron**: OW eigen data; Frontiers in Public Health 2024: systematische review late-adolescence dropout (11 studies)
- **OW-data**: 82% retentie bij 17 jaar, doelstelling 88%
- **SDT-koppeling**: Alle drie de basisbehoeften staan onder druk: verbondenheid (nieuw team), competentie (ander niveau), autonomie (geen keuze in de overgang)

### Sectie 3.2: Vijf vangnetten

[VISUAL: Vijf horizontale kaarten, gestapeld, elk met een icoon links en tekst rechts. Elke kaart heeft een subtiele amber glow aan de linkerkant.

Kaart 1: Icoon van twee personen (groot + klein).
"Buddy-systeem" — Elke overgangsspeler wordt gekoppeld aan een senioren-mentor.

Kaart 2: Icoon van twee overlappende cirkels.
"Mixtrainingen" — Aan het einde van het seizoen trainen jeugd en senioren samen.

Kaart 3: Icoon van een flexibele pijl.
"Flexibel meetrainen" — U19-spelers draaien al mee met Sen 3-4.

Kaart 4: Icoon van drie figuurtjes samen.
"Sociaal vangnet" — Minimaal 2-3 bekenden in het nieuwe team.

Kaart 5: Icoon van een kalender met wisselende blokken.
"Studentenschema" — Wisselende beschikbaarheid is oké. Niet straffen voor afwezigheid.]

**Tekst**:
> We laten nooit een speler alleen overstappen. Vijf vangnetten:
>
> **Een buddy** die je wegwijs maakt. Iemand die je al kent, of die speciaal aan jou wordt gekoppeld. Niet je trainer, niet je ouder — iemand die het zelf heeft meegemaakt.
>
> **Mixtrainingen** aan het einde van het seizoen. Zodat de eerste training bij senioren niet de eerste keer is dat je die gezichten ziet.
>
> **Flexibel meetrainen**. Je hoeft niet te kiezen: jeugd of senioren. Je kunt meedraaien, proeven, wennen. Op jouw tempo.
>
> **Bekenden in je team**. De TC houdt hier actief rekening mee. Je hoeft niet in je eentje een nieuw sociaal netwerk op te bouwen.
>
> **Ruimte voor je leven**. Studie, bijbaan, stage — we snappen het. Wisselende beschikbaarheid is geen probleem. We vragen inzet, geen opoffering.

**(i)-dialoog: "Het buddy-systeem"**
- **Titel**: Waarom een buddy en niet een coach?
- **Tekst**: Onderzoek naar mentoring in de sport toont dat peer-mentoring (leeftijdsgenoten of iets ouder) effectiever is dan top-down begeleiding bij adolescenten. De reden: autonomie. Een buddy geeft advies zonder autoriteit. De overgangsspeler voelt zich vrij om vragen te stellen die ze aan een coach niet zouden stellen. Het GAA-model (Ierland) laat zien dat dit type intergenerationeel contact de sterkste bindingsfactor is voor sportverenigingen.
- **Bron**: GAA — Sport as Catalyst for Social Justice 2024
- **SDT-koppeling**: Autonomie (geen verplichting, wel steun) + verbondenheid (herkenning, "ik ben niet de enige")

### Sectie 3.3: Quote

> *"De overgang is niet het moment waarop een speler moet bewijzen dat hij goed genoeg is voor senioren. Het is het moment waarop de club moet bewijzen dat ze goed genoeg is voor de speler."*

### Sectie 3.4: Wat als het niet lukt?

**Tekst**:
> Soms lukt het toch niet. Studie in een andere stad. Een blessure op het verkeerde moment. Of gewoon: andere dingen worden belangrijker.
>
> Dat is oké. We houden de deur open. Altijd. Een speler die op zijn 17e stopt, is welkom als herintreder op zijn 25e. Of als midweek-speler op zijn 35e. Of als trainer op zijn 40e.
>
> Het gaat niet om vasthouden. Het gaat om: je weet dat je terug kunt komen.

**(i)-dialoog: "Het welkom-terug-beleid"**
- **Titel**: Herintreders in de sportvereniging
- **Tekst**: NOC*NSF (2023) rapporteert dat verhuizing, kinderen krijgen en carrierewisseling de drie grootste triggers zijn voor sportuitval bij 25-35 jarigen. Maar veel van deze sporters willen later terugkomen. Clubs die actief herintreders verwelkomen — met een persoonlijke benadering, een instapperiode, en geen "je bent te lang weg geweest" — hebben significant hogere ledencijfers bij 30+.
- **Bron**: NOC*NSF Sportgedrag in Nederland 2023
- **Best practice**: Persoonlijke benadering bij herintredend lid, niet alleen administratieve inschrijving

---

## 7. Tab 4 — "Senioren" — Vlaggenschip en ruggengraat

### Kleur-accent: Blauw (`#3B82F6`)

### Sectie 4.1: Twee werelden, een club

**Tekst**:
> Bij de senioren bestaan twee werelden naast elkaar. En allebei zijn ze essentieel.
>
> De **selectie** (Sen 1-4): het vlaggenschip. Hier wordt gepresteerd, hier wordt gestreden, hier staan de toeschouwers langs het veld. Dit is waar de ambitie leeft.
>
> De **breedte** (Sen 5+): de ruggengraat. Hier wordt genoten, hier ontstaan de verhalen, hier zitten de mensen die al 20 jaar elke zaterdagochtend op het veld staan. Dit is waar de club leeft.
>
> De een kan niet zonder de ander.

[VISUAL: Twee glassmorphism-kaarten naast elkaar (op mobile: gestapeld).

Linkerkaart — "Selectie" (blauw accent, iets donkerder):
- Grote kop: "Sen 1-4"
- Subtitel: "Vlaggenschip"
- Drie kenmerken met iconen:
  - Podium-icoon: "Presteren op het hoogste niveau"
  - Hart-icoon: "Trots op de club uitdragen"
  - Pijl-omlaag-icoon: "Terugbetalen aan de jeugd"
- POP-balk onderaan: 20% plezier / 25% ontwikkeling / 55% prestatie

Rechterkaart — "Breedte" (blauw-licht accent, warmer):
- Grote kop: "Sen 5+"
- Subtitel: "Ruggengraat"
- Drie kenmerken met iconen:
  - Groep-icoon: "Eigen identiteit, eigen sfeer"
  - Anker-icoon: "Stabiliteit — elk seizoen weer"
  - Ster-icoon: "Autonomie — op je eigen manier"
- POP-balk onderaan: 50% plezier / 20% ontwikkeling / 30% prestatie]

**(i)-dialoog: "POP-ratio senioren"**
- **Titel**: Waarom verschillende verhoudingen?
- **Tekst**: De motivatie van selectiespelers en breedtesporters verschilt fundamenteel. Bij selectie domineert competentie: ze willen presteren, winnen, beter worden. Bij breedte domineert verbondenheid: gezelligheid, leeftijdsgenoten, "even lekker sporten". Dit is geen waardeoordeel — het is een andere motivatiestructuur die om een ander aanbod vraagt. Een breedteteam runnen als een selectieteam leidt tot afhakers. Een selectieteam runnen als een breedteteam leidt tot frustratie.
- **Bron**: Nature/Scientific Reports 2024; Journal of Park and Recreation Administration 2023
- **SDT-koppeling**: Selectie = competentie + autonomie (presteren, niveau bepalen). Breedte = verbondenheid + autonomie (gezelligheid, eigen tempo)

### Sectie 4.2: Het vlaggenschip-effect

[VISUAL: Een verticale "stroom" visual. Bovenaan het Sen 1-logo (groot, blauw). Daaronder drie pijlen die naar beneden stromen naar drie kleinere elementen:
- Pijl 1 naar een groepje kinderen: "Clinic" (met label "kwartaallijks")
- Pijl 2 naar een jeugdteam: "Hulptrainer" (met label "maandelijks")
- Pijl 3 naar een tribune: "Zichtbaarheid" (met label "wekelijks")
De stroom-pijlen hebben een zachte blauw-naar-groen gradient (senioren die naar jeugd geven).
Onderschrift: "Het vlaggenschip tilt de hele club."]

**Tekst**:
> Een sterk eerste team is leuk voor de buitenwereld. Maar het echte effect zit binnenin de club.
>
> Wanneer Sen 1-spelers een clinic geven aan de jongste jeugd, gebeurt er iets magisch. Een 7-jarige die een doorloopbal leert van "de speler van het eerste" — dat vergeet je niet. Dat is het verhaal dat je aan je klasgenoten vertelt. Dat is waarom je volgend seizoen ook weer komt.
>
> Het werkt niet automatisch. Een goed eerste team levert niet automatisch meer leden op. Maar als je het organiseert — clinics, hulptrainers, wedstrijden op dezelfde dag — dan versterkt het de hele club.

**(i)-dialoog: "Het trickle-down effect"**
- **Titel**: Werkt het vlaggenschip-effect echt?
- **Tekst**: Het wetenschappelijke bewijs voor een automatisch "trickle-down" effect van topsport naar breedtesport is zwak. Sheffield Hallam University (2021) vond een causaal maar beperkt verband dat 3-4 jaar duurt na een succes. Een umbrella review (Frontiers in Sports and Active Living 2026, 52 studies) vindt dat de meerderheid geen of negatief effect vindt. Maar: wanneer clubs het actief organiseren — clinics, rolmodellen, gezamenlijke programmering — werkt het wel. Het GAA-model (Ierland) is het sterkste voorbeeld: clubs waar "het moeilijk is om te bepalen waar de gemeenschap eindigt en de club begint."
- **Bron**: Sheffield Hallam University 2021; Frontiers in Sports and Active Living 2026 (52 studies); GAA 2024
- **OW-data**: OW heeft al een augustusclinic-traditie. Aanbeveling: uitbreiden naar elk kwartaal
- **Best practice**: GAA (Ierland) — "The volunteer ethos remains one of the most important aspects"

### Sectie 4.3: De terugbetaalcultuur (preview)

**Tekst**:
> Bij Oranje Wit verwachten we van selectiespelers dat ze iets terugdoen voor de club. Niet als verplichting — als cultuur. Een clinic geven, een jeugdtraining draaien, scheidsrechteren bij de jongsten, mentor zijn voor een overgangsspeler.
>
> Niet omdat het moet. Maar omdat je het vanzelfsprekend vindt. Omdat iemand het ook voor jou deed.

**(i)-dialoog: "Vrijwilligersbereidheid"**
- **Titel**: Terugbetalen als culturele norm
- **Tekst**: Onderzoek toont dat vrijwilligersbereidheid het hoogst is wanneer het als culturele norm wordt ervaren, niet als verplichting. De GAA (Ierland) is hier het sterkste voorbeeld: "It is difficult to determine where the community ends and the GAA club starts." Het werkt het best als het zichtbaar, laagdrempelig en sociaal beloond wordt. Niet: "je moet 10 uur per seizoen." Wel: "het is gewoon wat je doet bij OW."
- **Bron**: PowerUp Sports 2024; GAA 2023
- **SDT-koppeling**: Autonomie — het moet een keuze voelen, geen verplichting

### Sectie 4.4: Breedte is geen restcategorie

**Tekst**:
> Sen 5, 6, 7. De teams waar niemand naar vraagt op de ALV. De teams zonder fans op de tribune. De teams die gewoon elke zaterdag opdraven, winnen of verliezen, en daarna met z'n allen naar de kantine.
>
> Dit zijn de teams waar de club op draait. De ouders die als kind begonnen en nu hun eigen kinderen langs de lijn zien staan. De terugkomers die na tien jaar weer een balletje willen trappen. De stille kracht.
>
> Deze teams verdienen net zoveel aandacht als het eerste. Niet in de vorm van videoanalyse en tactiekborden — maar in de vorm van: "Hoe is het met jullie? Hebben jullie genoeg spelers? Is de sfeer goed?"

**(i)-dialoog: "De onzichtbare ruggengraat"**
- **Titel**: Wat maakt breedteteams bijzonder?
- **Tekst**: University of Bath (2024) vond dat 74% van clubleden een sterk gevoel van verbondenheid ervaart, en 68% een emotionele connectie met hun sportclub. De sterkste voorspeller is niet sportief succes, maar "erkenning en gezien worden" — participants feel part of a group and noticed by peers and coaches. Voor breedteteams betekent dit: een TC-lid dat langskomt bij de training, een eindeseizoensgesprek, het gevoel dat je er niet "bij hangt" maar er echt bij hoort.
- **Bron**: University of Bath 2024: Grassroots sports clubs belonging
- **SDT-koppeling**: Verbondenheid als dominante behoefte. "Gezien worden" is de sterkste retentiefactor

---

## 8. Tab 5 — "Recreatief" — Altijd een plek

### Kleur-accent: Teal (`#14B8A6`)

### Sectie 5.1: Het vangnet

[VISUAL: Een groot, warm beeld van een korfbalveld in de avondzon. Geen wedstrijd, geen toeschouwers. Een groep van verschillende leeftijden (20-60) die samen speelt. Relaxte houding, lachende gezichten. Geen wedstrijdtenue maar gewone sportkleding. Onderschrift: "Dinsdag 20:00. Geen score, geen stress. Gewoon lekker sporten."]

**Tekst**:
> Niet iedereen wil elke zaterdag om 9 uur op het veld staan. Niet iedereen wil in een competitie spelen. Niet iedereen kan twee avonden per week trainen.
>
> En dat is prima.
>
> Recreatief korfbal is het vangnet van de club. Het is er voor de 30-jarige die na tien jaar terugkomt. Voor de ouder die ziet dat zijn kind speelt en denkt: "dat wil ik ook weer." Voor de 50-jarige die fit wil blijven zonder blessures. Voor de student die alleen in de vakanties kan.
>
> Het is "een leven lang!" in de zuiverste vorm.

**(i)-dialoog: "Wat willen recreatieve sporters?"**
- **Titel**: De top-5 behoeften van recreatieve volwassenen
- **Tekst**: Onderzoek (Journal of Park and Recreation Administration 2023; Sport England 2022) toont dat de top-5 behoeften van recreatieve volwassen sporters zijn: (1) gezondheid en fitheid, (2) sociaal contact, (3) plezier en ontspanning, (4) gevoel van gemeenschap, (5) prestatie op eigen niveau. Opvallend: competitie staat niet in de top-5. Prestatie is persoonlijk, niet relatief. Dit heeft directe implicaties voor hoe OW het recreatieve aanbod positioneert: de kantine na afloop is minstens zo belangrijk als de training zelf.
- **Bron**: Journal of Park and Recreation Administration 2023; Sport England 2022
- **SDT-koppeling**: Autonomie + verbondenheid domineren. Competitie-gedreven competentie is afwezig

### Sectie 5.2: Drie vormen

[VISUAL: Drie horizontale kaarten (op mobile: gestapeld). Elke kaart in dark glassmorphism met teal accent.

Kaart 1 — "Midweek-korfbal":
- Icoon: maan/avond
- "Dinsdag- of donderdagavond"
- "Laagdrempelig, sociaal, iedereen welkom"
- "Geen competitie, wel een wedstrijdje"

Kaart 2 — "RecreStars":
- Icoon: 4 figuurtjes (4-tegen-4)
- "1x per 4 weken, vrijdagavond"
- "KNKV-format: 4v4, 15 min, geen scheids"
- "Perfect voor terugkomers en ouders van jeugdleden"

Kaart 3 — "Walking Korfball":
- Icoon: wandelende figuur met bal
- "65+"
- "Aangepast korfbal op wandeltempo"
- "73% rapporteert meer sociale contacten"]

**Tekst**:
> Drie smaken, een filosofie: sport moet passen in je leven, niet andersom.
>
> **Midweek-korfbal** voor wie doordeweeks een uurtje wil bewegen. Geen verplichtingen, geen schema, geen excuses nodig als je een keer niet kunt.
>
> **RecreStars** voor wie af en toe een wedstrijdgevoel wil, maar zonder de wekelijkse competitiedruk. Vier tegen vier, vijftien minuten, geen scheidsrechter. Puur spel.
>
> **Walking Korfball** voor wie het rustiger aan wil doen maar nog steeds wil meedoen. Op wandeltempo, met bekende gezichten.

**(i)-dialoog: "RecreStars en OldStars"**
- **Titel**: KNKV-formats voor recreatief korfbal
- **Tekst**: RecreStars is een KNKV-initiatief (seizoen 2024-2025) waarbij 45 clubs deelnemen. Het format: 4-tegen-4, 1x per 4 weken, vrijdagavond, 15 minuten per match, in 1 vak (20x20m), zonder scheidsrechter. Doelgroep: 25+ die niet meer in competitieverband spelen, herintreders, ouders van jeugdleden. OldStars Walking Korfball richt zich op 65+ met aangepast korfbal op wandeltempo. 73% rapporteert meer sociale contacten, 62% betere conditie, 55% voelt zich beter.
- **Bron**: KNKV RecreStars 2024-2025; KNKV OldStars Walking Korfball 2023
- **OW-data**: Met ~650 leden is OW een van de grotere clubs. Er is potentieel voor alle drie de formats

### Sectie 5.3: De derde helft

**Tekst**:
> De derde helft is geen bijzaak. Het is onderdeel van het aanbod.
>
> Na de training samen iets drinken in de kantine. Na de wedstrijd napraten over die ene bal. Op zaterdag de kinderen aanmoedigen en daarna zelf het veld op.
>
> Dat is waar de binding ontstaat. Niet op het veld — maar erna. De kantine is de plek waar "sportvereniging" verandert in "gemeenschap."

**(i)-dialoog: "De kantine als retentie-instrument"**
- **Titel**: De sociale functie van de sportvereniging
- **Tekst**: Mulier Instituut (2024) beschrijft dat sportverenigingen die zich als gemeenschap positioneren (niet alleen als sportaanbieder) hogere retentie en meer vrijwilligers hebben. De "derde helft" — het sociale moment na de sportieve activiteit — is een essentieel onderdeel van die gemeenschapsfunctie. Dit is geen luxe: het is meetbaar geassocieerd met hogere lidmaatschapsretentie, hogere vrijwilligersbereidheid en hogere ledentevredenheid.
- **Bron**: Mulier Instituut 2024: Toekomstbestendigheid sportverenigingen

---

## 9. Tab 6 — "Boeien en binden" — Hoe we het waarmaken

### Kleur-accent: Warm rood (`#EF4444`)

### Sectie 6.1: Per doelgroep — wat boeit, wat bindt

[VISUAL: Een grote tabel/matrix, visueel opgemaakt als gestapelde kaarten (niet als droge tabel). Elke kaart representeert een doelgroep. Op mobile verticaal gestapeld, op tablet/desktop als 2x3 grid.

Elke kaart heeft:
- Doelgroep-naam en kleur-accent bovenaan
- Links: "Wat BOEIT" (wat trekt ze aan) — met passend icoon
- Rechts: "Wat BINDT" (wat houdt ze vast) — met passend icoon

Kaart 1 — Jeugd (5-12) — groen:
- Boeit: Vriendjes, variatie, plezier
- Bindt: "Ik heb hier mijn vrienden"

Kaart 2 — Adolescenten (13-18) — oranje:
- Boeit: Uitdaging, serieus genomen worden
- Bindt: "Mijn team is mijn team"

Kaart 3 — Overgang (16-22) — amber:
- Boeit: Flexibiliteit, sociale aansluiting
- Bindt: "Er is plek voor mij, ook als het moeilijk is"

Kaart 4 — Selectie senioren — blauw:
- Boeit: Niveau, competitie, winnen
- Bindt: "Ik kan hier het beste uit mezelf halen"

Kaart 5 — Breedte senioren — blauw-licht:
- Boeit: Gezelligheid, bewegen, leeftijdsgenoten
- Bindt: "Elke zaterdag vertrouwde gezichten"

Kaart 6 — Recreatief — teal:
- Boeit: Laagdrempelig, flexibel, sociaal
- Bindt: "Er wordt niks van me verwacht behalve komen"]

**Tekst**:
> Boeien en binden zijn twee verschillende dingen.
>
> **Boeien** is wat iemand naar de club trekt. Het eerste clinic-dagje. De vriend die zegt: "kom ook eens mee." De website die er professioneel uitziet.
>
> **Binden** is wat iemand doet blijven. De trainer die je naam kent. De teamgenoten die vragen waar je was. De club die voelt als een tweede thuis.
>
> Het eerste is marketing. Het tweede is cultuur.

### Sectie 6.2: De terugbetaalcultuur

[VISUAL: Een circulair diagram — niet een vicieuze cirkel, maar een positieve spiraal. In het midden het OW-logo. Rondom drie verbonden elementen in een oneindige lus:

Element 1 (boven): "Jeugd groeit op bij OW" — icoon van groeiend kind
Pijl naar rechts-onder:
Element 2 (rechts-onder): "Senioren geven terug" — icoon van hand die reikt
Pijl naar links-onder:
Element 3 (links-onder): "Cultuur versterkt zich" — icoon van gemeenschap
Pijl terug naar boven.

De pijlen zijn in OW-oranje gradient. Het geheel draait langzaam (zeer subtiele CSS-animatie, 60 seconden per rotatie, nauwelijks merkbaar maar het leeft).

Onderschrift: "Geen verplichting. Een cultuur."]

**Tekst**:
> De terugbetaalcultuur is geen beleid. Het is een gevoel.
>
> Het begint bij een 7-jarige die een clinic krijgt van een Sen 1-speler. Die 7-jarige is nu 17 en geeft zelf een clinic. Over tien jaar is die 17-jarige trainer van een jeugdteam. En vertelt het verhaal van die eerste clinic.
>
> Dat is terugbetalen. Niet omdat iemand het vraagt. Maar omdat het vanzelfsprekend is.

**(i)-dialoog: "Intergenerationele binding"**
- **Titel**: Waarom jong en oud samen?
- **Tekst**: Clubs waar verschillende generaties elkaar tegenkomen hebben sterkere sociale cohesie en lagere dropout (GAA 2024). Het mechanisme: jonge spelers zien rolmodellen. Oudere spelers zien "de toekomst van de club." Er ontstaan verhalen die generaties overspannen. Concrete activiteiten: clubdagen 2x per seizoen (alle teams samen), seniorenwedstrijden + jeugdwedstrijden op dezelfde dag, gemengde toernooien (oud+jong door elkaar), selectiespelers maandelijks bij jeugdtraining.
- **Bron**: GAA 2024; University of Bath 2024
- **SDT-koppeling**: Verbondenheid (generatie-overstijgend) + competentie (rolmodel-inspiratie)

### Sectie 6.3: "Elke speler wordt gezien"

[VISUAL: Vijf kleine portretten (silhouetten) in een rij. Onder elk portret een kort citaat in handschrift-stijl:
- "Hoe gaat het met je?" (kind, 8 jaar)
- "Waar wil jij naartoe?" (tiener, 14 jaar)
- "Hoe kunnen we helpen?" (overgangsspeler, 17 jaar)
- "Heb je het nog naar je zin?" (senior, 32 jaar)
- "Welkom terug." (herintreder, 38 jaar)
Onder de rij: "Vijf vragen. Vijf levensfasen. Dezelfde intentie: we zien je."]

**Tekst**:
> "Elke speler wordt gezien." Dat is geen slogan. Dat is een operationeel principe.
>
> Het betekent: evaluatiegesprekken voor alle teams, niet alleen jeugd. Een persoonlijke benadering bij opzegverzoeken — een telefoontje, geen mail. Een welkom-terug-beleid voor herintreders.
>
> Het is de sterkste retentiefactor die er is. Niet het sportieve niveau. Niet de faciliteiten. Niet het competitieformat. Maar het gevoel: hier word ik gezien.

**(i)-dialoog: "Gezien worden als retentiefactor"**
- **Titel**: De wetenschap van "erbij horen"
- **Tekst**: University of Bath (2024) identificeert "erkenning en gezien worden" als de sterkste voorspeller van verbondenheid in sportverenigingen: "participants feel part of a group and noticed by peers and coaches." Dit gaat verder dan sociaal contact — het gaat om actieve erkenning. Een coach die vraagt hoe het gaat. Een TC-lid dat langskomt bij de training. Een clubblad dat niet alleen over het eerste team schrijft. Bij OW vertaalt dit zich naar: evaluatiegesprekken voor ALLE spelers, persoonlijke opzeg-benadering, en een NPS-achtige meting ("Zou je OW aanraden aan een vriend?").
- **Bron**: University of Bath 2024: 74% ervaart sterk verbondenheidsgevoel, 68% emotionele connectie
- **SDT-koppeling**: Verbondenheid als primaire behoefte — "gezien worden" is de operationalisering

### Sectie 6.4: Afsluiting

[VISUAL: Terugkeer naar de levenslijn-visual uit Tab 1, maar nu met alle vijf de vangnetten zichtbaar als lichtpunten langs de lijn. Bij 5 jaar: "groeien". Bij 12: "DE GROTE STAP". Bij 17: "de overgang" (met buddy-icoon). Bij 25: "het vlaggenschip". Bij 35: "altijd een plek". Bij 50+: "een leven lang". De lijn is nu een volledig OW-oranje gradient, zonder de scherpe klif. De vangnetten hebben de klif gladgestreken.

Onderschrift: "Van 5 tot 55+. Dezelfde club. Dezelfde warmte. Altijd een plek."]

**Tekst (groot, centraal)**:
> Een leven lang korfbal bij Oranje Wit.
>
> Niet omdat je moet. Omdat je wilt.

---

## 10. Componentenlijst

### Nieuwe componenten nodig

| Component | Type | Beschrijving |
|---|---|---|
| `PresentationTabs` | Navigation | Horizontale tab-strip met kleur-per-tab, sticky, swipeable |
| `PresentationTab` | Container | Individuele tab-content met scroll-state, kleur-context |
| `InfoDialogTrigger` | Interactive | Het (i)-icoon met pulse-animatie en touch target |
| `InfoDialog` | Overlay | Glassmorphism bottom-sheet/modal met drag-to-close |
| `InfoDialogSection` | Layout | Bron-tag, OW-data, SDT-koppeling als labeled kaartjes |
| `LifelineDiagram` | Visual | Horizontale tijdlijn met markers, POP-balk, illustraties |
| `DoelgroepCarousel` | Layout | Horizontaal scrollbare kaarten-rij (5 doelgroepen) |
| `DoelgroepCard` | Data display | Glassmorphism-kaart met kleur-accent, icoon, tagline |
| `POPBar` | Data display | Horizontale gestapelde balk (plezier/ontwikkeling/prestatie) |
| `SafetyNetCard` | Data display | Horizontale kaart met icoon links, tekst rechts, glow |
| `BoeiBindMatrix` | Layout | Grid/stack van doelgroep-kaarten met boei/bind-kolommen |
| `ReturnCultureSpiral` | Visual | Circulaire spiraal met drie elementen, subtiele rotatie |
| `PullQuote` | Typography | Groot citaat in cursief, tab-accentkleur links-border |
| `VisualPlaceholder` | Dev utility | [VISUAL: ...]-tag renderer voor prototyping (toont beschrijving) |

### Bestaande componenten herbruiken

| Component | Uit | Aanpassing |
|---|---|---|
| `SpelersKaart` | `packages/ui/` | Geen — als referentie-visual in de jeugd-tab |
| `Pills` | `packages/ui/` | Aangepast voor tab-kleuren en sticky-gedrag |
| Glassmorphism tokens | Design system | Hergebruik bestaande backdrop-filter en shadow tokens |

---

## 11. Interactiepatronen

### Tab-navigatie
| Actie | Gedrag |
|---|---|
| Tik op tab | Content slide-animatie naar links/rechts (300ms). Tab-kleur update. Scroll naar top. |
| Swipe links/rechts | Wisselt naar volgende/vorige tab. Momentum-based. |
| Tab overschrijdt scherm | Horizontaal scrollbaar. Actieve tab scrollt altijd in beeld. |
| Terugkeer naar tab | Scroll-positie hersteld (per tab opgeslagen). |

### (i)-dialoog interactie
| Actie | Gedrag |
|---|---|
| Tik op (i) | Achtergrond dimt (200ms). Dialoog slide-up (300ms cubic-bezier). |
| Scroll in dialoog | Normaal scroll-gedrag, bouncing aan top/bottom. |
| Swipe-down op drag handle | Dialoog slide-down + achtergrond fade-out. |
| Tik op gedimde achtergrond | Dialoog sluit. |
| Escape (desktop) | Dialoog sluit. |
| Tik op bron-link | Opent externe bron in nieuwe tab/browser. |

### Scroll-gedrag
| Element | Gedrag |
|---|---|
| Tab-content | Vrij verticaal scrollen. |
| Tab-strip | Sticky top. Geen mee-scrollen. |
| Levenslijn-visual | Horizontaal scrollbaar binnen tab-content. Snap-to-marker. |
| Doelgroep-carousel | Horizontaal scrollbaar. Snap-to-card. |
| Visuele fade-out | Onder aan lange secties: subtiele fade naar `--surface-page`. |

### Animaties
| Element | Animatie | Timing |
|---|---|---|
| Tab-switch content | Slide horizontaal | 300ms ease-out |
| (i)-icoon pulse | Scale 1.0 -> 1.15 -> 1.0 | 400ms, 1x bij eerste zichtbaarheid |
| Dialoog open | Slide-up + background dim | 300ms cubic-bezier(0.4, 0, 0.2, 1) |
| Dialoog close | Slide-down + background fade | 250ms ease-in |
| Terugbetaal-spiraal | Rotatie | 60s linear, continu, nauwelijks merkbaar |
| POP-balk fill | Breedte-animatie van 0 naar waarde | 600ms ease-out, bij scroll-into-view |
| Kaart hover (desktop) | Subtiele lift + shadow verdieping | 200ms ease |

---

## 12. Responsief gedrag

### Mobile-first (430px) — primaire viewport

Dit is de hoofdervaring. Alles is ontworpen voor eenhandig gebruik op een telefoon.

- Tab-strip: horizontaal scrollbaar, 44px hoog
- Content: volledige breedte, 16px padding links/rechts
- Kaarten: volledige breedte, 16px radius
- Visuals: volledige breedte, horizontaal scrollbaar waar nodig
- (i)-dialoog: bottom-sheet, 70vh max-height
- Typografie: Hero 36px, Heading 22px, Body 16px, Caption 13px

### Tablet (768px+)

- Tab-strip: alle tabs zichtbaar, centered
- Content: max-width 680px, centered
- Kaarten: 2-koloms grid waar zinvol
- Visuals: volledige breedte content-area
- (i)-dialoog: centered modal, max-width 560px, 60vh

### Desktop (1024px+)

- Tab-strip: alle tabs zichtbaar, centered, met extra spacing
- Content: max-width 760px, centered
- Kaarten: 2-3 koloms grid
- Levenslijn: volledig zichtbaar zonder scroll
- (i)-dialoog: centered modal met backdrop-blur

---

## 13. Toegankelijkheid

| Aspect | Implementatie |
|---|---|
| Toetsenbordnavigatie | Tabs via pijltjestoetsen, (i) via Enter/Space, dialoog via Escape |
| Screen reader | `role="tablist"`, `role="tabpanel"`, `aria-selected`, `aria-expanded` op (i) |
| Contrast | Alle tekst voldoet aan WCAG AA op donkere achtergronden |
| Touch targets | Minimaal 44px op alle interactieve elementen |
| Reduced motion | `prefers-reduced-motion`: geen slide-animaties, geen spiraal-rotatie, instant transitions |
| Focus visible | Duidelijke focus-ring (2px, tab-accentkleur) op alle interactieve elementen |

---

## 14. Content-architectuur: alle (i)-dialogen

Overzicht van alle geplande (i)-dialogen per tab:

### Tab 1: Een leven lang!
| Sectie | (i)-dialoog titel | Primaire bron |
|---|---|---|
| De Oranje Draad | De wetenschap achter de drie pijlers | Nature/Scientific Reports 2024 |
| De levenslijn | Retentie over de levenslijn | OW data + KNHB 2024 |

### Tab 2: Jeugdontwikkeling
| Sectie | (i)-dialoog titel | Primaire bron |
|---|---|---|
| POP-ratio's | Waarom verschuift de nadruk? | KNHB 2024; Sport Vlaanderen 2022 |
| De plezier-cocktail | Plezier is meetbaar | Frontiers in Sports 2025 |
| Pijlerevolutie (Inside Out) | Cognitieve ontwikkeling en sportbeoordeling | KNKV; Piaget |
| Biologische rijping | Early en late maturers in de sport | Frontiers in Public Health 2024 |
| Plezier meten (Oranje) | De kritieke leeftijd voor uitval | KNHB 2024 |
| KERN vs. ONDERSCHEIDEND | Selectie en ontwikkeling in balans | SDT-theorie |

### Tab 3: De overgang
| Sectie | (i)-dialoog titel | Primaire bron |
|---|---|---|
| De cliff | De senior-cliff in data | OW data + Frontiers 2024 |
| Buddy-systeem | Waarom een buddy en niet een coach? | GAA 2024 |
| Welkom-terug | Het welkom-terug-beleid | NOC*NSF 2023 |

### Tab 4: Senioren
| Sectie | (i)-dialoog titel | Primaire bron |
|---|---|---|
| Selectie vs. breedte | POP-ratio senioren | Nature/SR 2024; JPRA 2023 |
| Vlaggenschip-effect | Werkt het vlaggenschip-effect echt? | Sheffield Hallam 2021; GAA 2024 |
| Terugbetaalcultuur | Terugbetalen als culturele norm | PowerUp Sports 2024; GAA 2023 |
| Breedte | De onzichtbare ruggengraat | University of Bath 2024 |

### Tab 5: Recreatief
| Sectie | (i)-dialoog titel | Primaire bron |
|---|---|---|
| Het vangnet | Wat willen recreatieve sporters? | JPRA 2023; Sport England 2022 |
| RecreStars/OldStars | KNKV-formats voor recreatief korfbal | KNKV 2024-2025 |
| De derde helft | De kantine als retentie-instrument | Mulier Instituut 2024 |

### Tab 6: Boeien en binden
| Sectie | (i)-dialoog titel | Primaire bron |
|---|---|---|
| Terugbetaalspiraal | Intergenerationele binding | GAA 2024; University of Bath 2024 |
| Gezien worden | Gezien worden als retentiefactor | University of Bath 2024 |

**Totaal: 18 (i)-dialogen** verspreid over 6 tabs.

---

## 15. Samenvatting ontwerpbeslissingen

| Beslissing | Rationale |
|---|---|
| Dark-first | Consistent met alle OW-apps. Premium feel. Foto's en visuals komen beter uit |
| Twee lagen (presentatie + (i)) | Niet iedereen wil de wetenschap. Maar wie het wil, moet het kunnen vinden |
| Tab-kleuren per sectie | Locatiebewustzijn. Je weet altijd waar je bent. Subtiel, niet schreeuwerig |
| Bottom-sheet voor (i) op mobile | Natuurlijk iOS/Android patroon. Drag-to-close voelt native |
| Centered modal op desktop | Meer ruimte, minder context-switch dan een sidebar |
| Levenslijn als verbindend element | Terugkeer in Tab 1 en Tab 6. Het verhaal begint en eindigt met dezelfde visual |
| Geen percentages in visuals | De jeugdpresentatie vermijdt cijfers in de POP-balk. We volgen dat patroon |
| Spiraal-animatie bijna onmerkbaar | Het moet leven, niet afleiden. 60 seconden per rotatie is zo langzaam dat je het alleen ziet als je ernaar kijkt |
| Bestaande jeugdpresentatie ongewijzigd | Tab 2 IS de bestaande presentatie. Geen herschrijving. Alleen (i)-dialogen toevoegen |

---

*Dit document is de single source of truth voor het ontwerp van de TC-beleidspresentatie. Implementatie volgt na goedkeuring.*
