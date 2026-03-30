# UX-Spec: Beleid-domein — "Een leven lang!"

**Ontworpen door**: UX-designer, c.k.v. Oranje Wit
**Datum**: 30 maart 2026
**Status**: Design beslissingen (geen implementatie)
**Doelgroep primair**: TC-leden (3 personen, Google login)
**Route**: `/beleid/*`

---

## 1. Accentkleur: Paars `#A855F7`

### De keuze

| Domein | Accent | Associatie |
|---|---|---|
| Monitor | `#22c55e` groen | Data, groei, gezondheid |
| Team-Indeling | `#3b82f6` blauw | Structuur, planning |
| Evaluatie | `#eab308` geel | Aandacht, beoordeling |
| Scouting | `#ff6b00` oranje | Energie, actie |
| Beheer | `#9ca3af` grijs | Systeem, configuratie |
| **Beleid** | **`#A855F7` paars** | **Visie, fundament, wijsheid** |

### Onderbouwing

Paars is de enige kleur in het warme-koele spectrum die nog niet bezet is. De bestaande domeinen dekken groen, blauw, geel, oranje en grijs. Paars vult het kleurenpalet aan zonder te botsen.

Inhoudelijk past het: paars wordt universeel geassocieerd met visie, strategie en diepgang. Het is de kleur van "het grotere verhaal" -- precies wat dit domein is. Niet de operatie (dat is Beheer), niet de data (dat is Monitor), maar de **waarom** achter alles.

Op donkere achtergronden werkt `#A855F7` uitstekend: voldoende contrast, herkenbaar als eigen kleur, warm genoeg om niet kil te voelen. In de TopBar accent-lijn en actieve navigatie-items is het direct onderscheidend van alle andere domeinen.

**Token**: `--ow-accent-beleid: #A855F7`
**Hover**: `#C084FC`

---

## 2. BottomNav: 4+1

De presentatie heeft 6 tabs. Die worden als volgt geherstructureerd:

```
┌────────────────────────────────────────────────────┐
│  Verhaal     Doelgroepen     Bronnen     Delen     │
│   [1]          [2]            [3]        [4]  [Apps]│
└────────────────────────────────────────────────────┘
```

| Pos | Label | Icon-concept | Wat het bevat |
|---|---|---|---|
| 1 | **Verhaal** | BookOpen | De presentatie zelf -- het hart van het domein |
| 2 | **Doelgroepen** | People/Users | Vijf doelgroep-profielen als standalone kaarten |
| 3 | **Bronnen** | Library/BookStack | Wetenschappelijke onderbouwing, beleidsdocumenten |
| 4 | **Delen** | Share/Link | Smartlinks genereren om presentatie te delen |
| 5 | Apps | Grid | Standaard AppSwitcher |

### Rationale per positie

**Pos 1 -- Verhaal**: De presentatie is het hoofdonderdeel. Hier lees je het verhaal van "Een leven lang!" van begin tot eind. Dit is waar 90% van de tijd doorgebracht wordt. Positie 1 is altijd de landingspagina.

**Pos 2 -- Doelgroepen**: De vijf doelgroepen (Jeugd, Overgang, Selectie, Breedte, Recreatief) als afzonderlijke profielpagina's. Waar de presentatie het verhaal vertelt, biedt Doelgroepen directe toegang tot "alles over doelgroep X" -- inclusief retentiecijfers, POP-ratio's en beleidskaders. Dit is de referentiemodus: TC-leden die snel iets willen opzoeken over een specifieke doelgroep.

**Pos 3 -- Bronnen**: Alle (i)-dialoog-content gebundeld als doorzoekbare kennisbank. Wetenschappelijke bronnen, OW-data, SDT-koppelingen, beleidsdocumenten. Dit is de verdiepingslaag die los van de presentatie toegankelijk is.

**Pos 4 -- Delen**: TC-only functionaliteit om de presentatie (of delen ervan) te delen via smartlinks. Trainers, ouders of het bestuur krijgen dan een read-only versie zonder de TC-navigatie. Dit maakt het domein operationeel -- het is niet alleen een interne tool maar ook een communicatiemiddel.

---

## 3. Pills (sub-navigatie)

### Pos 1: Verhaal

De 6 presentatie-tabs worden pills binnen de Verhaal-sectie:

| Pill | Oorspronkelijke tab | Kleur-accent in content |
|---|---|---|
| Een leven lang! | Tab 1 | OW Oranje `#FF6B00` |
| Jeugd | Tab 2 | Groen `#22C55E` |
| Overgang | Tab 3 | Amber `#F59E0B` |
| Senioren | Tab 4 | Blauw `#3B82F6` |
| Recreatief | Tab 5 | Teal `#14B8A6` |
| Binden | Tab 6 | Warm rood `#EF4444` |

**Aandachtspunt**: dit zijn 6 pills, wat 1 meer is dan de max-5 richtlijn. Dit is acceptabel omdat:
- De presentatie IS de kern van het domein -- het is niet "een van de secties", het IS de inhoud
- De 6 tabs corresponderen met 6 inhoudelijke hoofdstukken die niet verder samengevouwen kunnen worden zonder de verhaallijn te breken
- Op mobile scrollen de pills horizontaal, dus 6 is visueel hanteerbaar
- Alternatieven (samenvouwen Senioren+Recreatief, of Overgang+Binden) zijn inhoudelijk onlogisch

**Actieve pill-stijl**: De pill neemt de **content-kleur** aan van het bijbehorende hoofdstuk (niet de domein-accentkleur paars). Dus de Jeugd-pill is groen, de Overgang-pill is amber, etc. Dit is consistent met het presentatie-ontwerp waar elke tab zijn eigen kleurvariatie heeft. De BottomNav actieve state en TopBar accent-lijn blijven paars -- de pills zijn de uitzondering die het verhaal kleurt.

### Pos 2: Doelgroepen

| Pill | Inhoud |
|---|---|
| Jeugd | Profiel jeugd (5-18), POP-ratio's, retentiecijfers |
| Overgang | Profiel overgang (16-22), vangnetten, cliff-data |
| Selectie | Profiel senioren selectie, vlaggenschip-effect |
| Breedte | Profiel senioren breedte, ruggengraat-rol |
| Recreatief | Profiel recreatief, drie formats, derde helft |

### Pos 3: Bronnen

| Pill | Inhoud |
|---|---|
| Wetenschap | Alle (i)-dialogen als artikelen, doorzoekbaar |
| Beleid | Beleidsdocumenten (Oranje Draad, TC-beleid, etc.) |
| Data | OW-specifieke cijfers, retentiegrafieken, vergelijkingen |

### Pos 4: Delen

Geen pills. Eenvoudige pagina met deelmogelijkheden.

---

## 4. Hoe de presentatie leeft binnen het domein

### Het model: "Verhaal centraal, referentie eromheen"

```
                    ┌─────────────┐
                    │   VERHAAL   │  ← De presentatie (emotioneel, verhalend)
                    │  6 pills    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
     ┌────────┴───┐  ┌────┴────┐  ┌────┴────┐
     │ DOELGROEPEN │  │ BRONNEN │  │  DELEN  │
     │ 5 profielen │  │ kennis  │  │ smart-  │
     │ (referentie)│  │ bank    │  │ links   │
     └─────────────┘  └─────────┘  └─────────┘
```

**Verhaal** is waar je begint, waar je iemand naartoe stuurt, waar het beleid tot leven komt. Het is een leeservaring.

**Doelgroepen** is waar je naartoe gaat als je iets wilt opzoeken. "Hoe zat het ook alweer met de POP-ratio voor adolescenten?" Je hoeft niet door de hele presentatie te scrollen.

**Bronnen** is waar de (i)-dialogen een tweede leven krijgen. In de presentatie zijn het verdiepingen die je optioneel opent. In Bronnen zijn het zelfstandig leesbare artikelen, doorzoekbaar en categoriseerbaar. Dit is ook de plek voor beleidsdocumenten die niet in de presentatie voorkomen maar wel relevant zijn (bijv. het volledige TC-beleidsdocument, de Oranje Draad als los document).

**Delen** maakt het domein operationeel. Een TC-lid kan:
- De volledige presentatie delen als read-only smartlink
- Een specifieke tab delen (bijv. alleen "De overgang" voor ouders van 16-jarigen)
- Een specifiek doelgroepprofiel delen
- Een tijdslimiet instellen (bijv. "geldig tot einde seizoen")

---

## 5. Mobile-first layout: veel tekst prettig maken

Beleid is tekst-zwaar. Dat is onvermijdelijk -- het is een presentatie, geen dashboard. De uitdaging: hoe maak je lange tekst prettig op een telefoon?

### Vijf principes

**A. Ademruimte**
- Grote regelafstand: `line-height: 1.75` voor lopende tekst (vs. 1.5 standaard)
- Ruime margins tussen secties: `48px` minimum
- Geen muur-van-tekst: maximaal 3-4 alinea's voordat er een visual of quote tussenstaat
- Body tekst `17px` (iets groter dan standaard 16px) voor leescomfort

**B. Visuele onderbrekingen**
De presentatie is specifiek ontworpen met visuals, quotes, en kaarten die de tekst breken. Dit moet strikt gehandhaafd worden. De volgorde is altijd:
```
Tekst (2-3 alinea's max)
→ Visual / Kaart / Quote
→ Tekst (2-3 alinea's max)
→ (i)-trigger bij de sectie-titel
→ Volgende sectie
```

**C. Progressie-indicatie**
- Subtiele voortgangsbalk bovenaan elke pill (onder de pill-strip)
- Toont hoever je bent in het hoofdstuk (scroll-based, dun, in de content-kleur)
- Geeft het gevoel van "ik ben ergens" en "er is een einde"

**D. Typografische hierarchie**
| Element | Grootte | Gewicht | Kleur |
|---|---|---|---|
| Sectie-titel | 24px | 600 | `--text-primary` |
| Pull quote | 22px | 400 italic | Content-kleur (tab-kleur) |
| Body | 17px | 400 | `--text-primary` |
| Visual caption | 14px | 400 | `--text-secondary` |
| (i)-label | 13px | 500 | Content-kleur |

**E. Swipe-navigatie**
De 6 hoofdstukken (pills) zijn swipeable links/rechts. Dit maakt het een natuurlijke leeservaring -- je "bladert" door het verhaal. Bij het einde van een hoofdstuk verschijnt een subtiele hint: "Volgende: [naam volgende tab]" met een pijl naar rechts.

### Doelgroepen-pagina layout

Elke doelgroep als een "profielkaart" -- een full-width card met:
- Kleur-accent header (doelgroep-kleur)
- Grote titel + tagline
- POP-balk met ratio
- Key metrics (retentie, aantallen)
- Kernbeleid in bullet-punten
- Link naar het bijbehorende verhaal-hoofdstuk

Op mobile zijn de 5 doelgroepen gestapeld. De pills bovenaan bieden directe toegang.

### Bronnen-pagina layout

Artikelen-lijst, vergelijkbaar met een blog/kennisbank:
- Zoekbalk bovenaan
- Elke bron als een compact kaartje: titel, categorie-badge (Wetenschap / OW Data / SDT / Best Practice), korte preview
- Tik opent het volledige artikel
- De inhoud komt 1-op-1 uit de (i)-dialogen, maar dan als zelfstandig leesbaar artikel geformateerd

---

## 6. Icon concept: Kompas

**Concept**: Een kompas -- een cirkel met een richtingwijzer/naald.

**Waarom**:
- Een kompas geeft richting, net als beleid. Het bepaalt niet de exacte route (dat doen de andere domeinen) maar geeft het noorden aan
- Het past bij "de Oranje Draad" als rode draad: het kompas wijst de weg die de draad volgt
- Visueel onderscheidend van de andere iconen (Monitor = grafiek, Teams = raster, Evaluatie = ster/formulier, Scouting = verrekijker, Beheer = tandwiel)
- Simpel genoeg voor een 24px stroke-based icoon in de bestaande stijl
- De naald kan subtiel in de accentkleur (paars) worden weergegeven bij de actieve state

**Alternatief overwogen en afgewezen**:
- *Boek/document*: te generiek, te veel overlap met "Bronnen" pill
- *Schild/wapen*: te formeel, past niet bij de warme toon van het domein
- *Vlag*: verwarrend met een start/finish concept
- *Vuurtoren*: te complex voor een klein icoon

---

## 7. Manifest-entry (referentie)

```
BELEID: AppManifest = {
  id: "beleid",
  name: "TC Beleid",
  shortName: "Beleid",
  description: "Visie, beleid en de Oranje Draad",
  baseUrl: "/beleid",
  accent: "#A855F7",
  sections: [
    {
      nav: { label: "Verhaal", href: "/beleid", icon: "BookOpenIcon" },
      pills: [
        { label: "Een leven lang!", href: "/beleid" },
        { label: "Jeugd", href: "/beleid?tab=jeugd" },
        { label: "Overgang", href: "/beleid?tab=overgang" },
        { label: "Senioren", href: "/beleid?tab=senioren" },
        { label: "Recreatief", href: "/beleid?tab=recreatief" },
        { label: "Binden", href: "/beleid?tab=binden" },
      ],
    },
    {
      nav: { label: "Doelgroepen", href: "/beleid/doelgroepen", icon: "PeopleIcon" },
      pills: [
        { label: "Jeugd", href: "/beleid/doelgroepen?groep=jeugd" },
        { label: "Overgang", href: "/beleid/doelgroepen?groep=overgang" },
        { label: "Selectie", href: "/beleid/doelgroepen?groep=selectie" },
        { label: "Breedte", href: "/beleid/doelgroepen?groep=breedte" },
        { label: "Recreatief", href: "/beleid/doelgroepen?groep=recreatief" },
      ],
    },
    {
      nav: { label: "Bronnen", href: "/beleid/bronnen", icon: "LibraryIcon" },
      pills: [
        { label: "Wetenschap", href: "/beleid/bronnen?cat=wetenschap" },
        { label: "Beleid", href: "/beleid/bronnen?cat=beleid" },
        { label: "Data", href: "/beleid/bronnen?cat=data" },
      ],
    },
    {
      nav: { label: "Delen", href: "/beleid/delen", icon: "ShareIcon" },
    },
  ],
  skipRoutes: [],
  visibility: { requireTC: true },
}
```

**Opmerking**: Verhaal en Doelgroepen hebben 6 resp. 5 pills. Verhaal overschrijdt de richtlijn van max 5 met 1 -- dit is bewust en onderbouwd (zie sectie 3). Doelgroepen zit op de grens.

---

## 8. Verhouding tot Beheer

Beleid en Beheer zijn **complementair, niet overlappend**:

| Aspect | Beleid | Beheer |
|---|---|---|
| **Vraag** | Waarom doen we dit? | Hoe richten we het in? |
| **Inhoud** | Visie, filosofie, onderbouwing | Configuratie, data, gebruikers |
| **Modus** | Lezen, begrijpen, delen | Instellen, importeren, beheren |
| **Publiek** | TC + gedeeld met trainers/bestuur | Alleen TC |
| **Veranderfrequentie** | Zelden (seizoensmatig) | Dagelijks/wekelijks |

Beleid is het "handboek". Beheer is het "bedieningspaneel". Een TC-lid leest Beleid om te herinneren waarom iets zo is, en gaat naar Beheer om het daadwerkelijk in te stellen.

---

## 9. Toekomstige uitbreidingen (niet in scope, wel bedacht)

- **Versioning**: Beleidsdocumenten krijgen een seizoenslabel. Volgend seizoen kan het beleid aangepast worden, terwijl het oude bewaard blijft
- **Annotaties**: TC-leden kunnen interne notities toevoegen bij secties ("dit moeten we herzien in mei")
- **Feedback-loop**: Trainers die via een smartlink lezen, kunnen een reactie achterlaten ("dit herken ik" / "hier heb ik een vraag over")
- **Print/PDF**: Exporteer de volledige presentatie als geprint document voor ALV of sponsorgesprekken

---

## 10. Samenvatting beslissingen

| Beslissing | Keuze |
|---|---|
| Accentkleur | Paars `#A855F7` |
| BottomNav 1 | Verhaal (presentatie, 6 pills) |
| BottomNav 2 | Doelgroepen (5 profielen, 5 pills) |
| BottomNav 3 | Bronnen (kennisbank, 3 pills) |
| BottomNav 4 | Delen (smartlinks) |
| Icon | Kompas (cirkel + naald, stroke-based) |
| Pill-kleuren Verhaal | Per-hoofdstuk kleur (niet domein-paars) |
| Tekst-aanpak mobile | Ademruimte, visuele onderbrekingen, 17px body, voortgangsbalk |
| Verhouding Beheer | Complementair: waarom (Beleid) vs. hoe (Beheer) |
| Auth | TC-only (requireTC: true), deelbaar via smartlinks |
