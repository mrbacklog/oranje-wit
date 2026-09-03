# Spelersstromen — feitenbasis

Vastgesteld op eigen data, september 2026. Dit document onderbouwt beleid en de
monitoring van de gezondheid van de vereniging, gemeten in spelende leden.

Elk cijfer hieronder is herleidbaar tot een script in `scripts/`. Wie een uitspraak
wil narekenen of actualiseren, draait dat script opnieuw.

---

## 1. Meetregels — lees dit eerst

Zonder deze regels zijn cijfers tussen seizoenen niet vergelijkbaar. Ze zijn met
schade en schande vastgesteld; drie eerdere analyses gaven verkeerde uitkomsten
doordat ze werden overtreden.

**Vergelijk altijd dezelfde competitiefase met zichzelf.**
Een afgerond seizoen bevat veld_najaar, zaal én veld_voorjaar; een lopend seizoen
alleen het najaar. Wie die twee naast elkaar legt, telt iedereen die vorig jaar
uitsluitend in de zaal of het voorjaar speelde als vertrokken. Dat leverde voor
2026-2027 een gerapporteerde krimp van 321 → 280 op, terwijl het een groei van
266 → 280 was.

De pipeline kiest daarom automatisch de competities die in élk seizoen bestaan.
In de praktijk is dat **veld_najaar**, de enige fase die over alle seizoenen sinds
2010-2011 gemeten is.

**Zaal telt niet mee als grondslag.** Midweekteams spelen geen zaalcompetitie; wie
zaal meeneemt, geeft die spelers een structureel gat dat als uitstroom wordt gelezen.

**Overbrug eenmalige gaten.** Wie één najaar ontbreekt maar er het jaar erna weer is,
of dat seizoen wel veld_voorjaar speelde, is niet vertrokken — die ontbreekt in de
meting. Zonder deze correctie ontstaan 81 valse uitstromers over de hele reeks, plus
evenzoveel valse "herinschrijvers" een jaar later.

**Kijk vijf seizoenen terug voor doorstroomcijfers.** De langjarige gemiddelden
verbloemen een recente verslechtering. Over de hele historie levert een jaargang van
25 elfjarigen er 19 op hun zeventiende; over de laatste vijf jaar zijn het er 15.

**Er zijn twee verenigingen die Oranje Wit heten.** In KNKV-bronnen worden ze
onderscheiden met een achtervoegsel:

- **Oranje Wit (D)** — Dordrecht, club-id `NCX19J3`. Dat zijn wij.
- **Oranje Wit (L)** — Leunen, een veel kleinere vereniging. Niet wij.

Bij elke externe bron — KNKV-ledencijfers, uitslagensites, archieven — moet je
controleren welke van de twee je te pakken hebt. Op bronnen zonder achtervoegsel is
de plaats de enige betrouwbare check.

**Let op links-censuur bij jeugdanalyses.** De reeks begint in 2010-2011. Van wie
vóór ongeveer 2000 geboren is, zijn de jeugdjaren niet gemeten. Analyses over
instroomleeftijd moeten daarom beperkt worden tot jaargangen waarvan de hele jeugd
binnen de meetperiode valt.

Bron: `scripts/js/bereken-verloop.js`, `scripts/js/bereken-cohorten.js`

---

## 1b. Waarschuwing: de historie vóór 2017-2018 is onvolledig

De seizoenen tot en met 2016-2017 zijn gereconstrueerd uit spelerspaden, niet uit een
registratie van dat seizoen zelf. Bij het inladen viel een groot deel weg, en dat deel
is **niet willekeurig**: het zijn juist de mensen die later niet meer traceerbaar waren.

| Seizoen | In de snapshot | In de analyse | Verlies |
|---|---|---|---|
| 2010-2011 | 400 | 176 | **56%** |
| 2011-2012 | 409 | 212 | 48% |
| 2012-2013 | 411 | 243 | 41% |
| 2013-2014 | 359 | 238 | 34% |
| 2015-2016 | 370 | 300 | 19% |
| 2016-2017 | 352 | 322 | 9% |
| 2017-2018 en later | 345 | 344 | **0%** |

**Oorzaak:** 381 personen hebben een rel_code van de vorm `OW-0329` — een verzonnen
code omdat het echte Sportlink-nummer onbekend was. Die zijn uit de `leden`-tabel
verwijderd (`sync-leden-csv.ts` verwijdert leden die niet in het CSV staan, inclusief
`OW-xxxx`), waarna hun competitie-rijen niet meer aangemaakt konden worden.

**Niet herstelbaar.** Van die 381 heeft 1% een geboortejaar. Zonder geboortejaar zijn
ze voor elke leeftijdsanalyse onbruikbaar.

**Wat dit omdraait.** De werkelijke ledenaantallen uit de snapshots: 400 (2010),
411 (2012), 352 (2016), 282 (2018), 243 (2024), 262 (2025). **De vereniging is tussen
2012 en 2024 met veertig procent gekrompen.** Onze eigen reeks liet groei zien van 176
naar 322 — dat was de dekking die verbeterde, niet de club die groeide.

**Regel:** gebruik voor trendanalyses uitsluitend seizoenen vanaf 2017-2018. Alles wat
op de volledige historie leunt is survivorship-biased, met een vertekening die
oploopt naarmate je verder terugkijkt.

Elke sectie hieronder is gelabeld met de periode waarop hij rust.

---

## 1c. Competitieniveaus zijn niet vergelijkbaar over de jaren

**De top van de piramide verschilt tussen veld en zaal.** Dat is geen detail maar
bepaalt of twee niveaus überhaupt vergelijkbaar zijn.

**Zaal, senioren:**
- **Korfbal League** — hoogste niveau, sinds 2005
- **Korfbal League 2** — sinds **2022-2023**, dit is pas het vierde seizoen
- **Hoofdklasse** — daaronder

**Veld, senioren:**
- **Ereklasse** — hoogste niveau
- **Hoofdklasse** — daaronder

Er is dus geen League 1 of 2 op het veld. Wie zaal- en veldniveaus door elkaar haalt,
vergelijkt twee verschillende piramides.

In de zaal betekent dit binnen ons meetvenster: de hoofdklasse was tot en met
2021-2022 het tweede niveau en is sinds 2022-2023 het derde. Een team dat in 2015
zaalhoofdklasse speelde en nu nog steeds, is feitelijk een niveau gezakt zonder ooit
te degraderen.

Daar komt **Competitie 2.0** bij vanaf 2025-2026, met de indeling topkorfbal /
A-categorie / B-categorie.

Bij de **jeugd** is de niveaustructuur ongewijzigd gebleven. Jeugdvergelijkingen over
de jaren zijn dus wél zuiver; seniorenvergelijkingen niet zonder correctie.

**Het niveau van één team verschilt per competitiefase.** Promotie en degradatie lopen
per competitie apart:

- **veld en zaal** kunnen van elkaar afwijken — het zijn aparte piramides met een
  eigen top
- **en sinds 2024 wijkt ook veld-najaar af van veld-voorjaar** — die zijn sindsdien
  twee losse competities met een eigen indeling

"Het niveau van team X in seizoen Y" is dus geen enkele waarde, maar er zijn er drie:
veld_najaar, zaal en veld_voorjaar. Daarom heeft `team_periodes` een rij per periode
met een eigen `pool`.

Wie het niveau van een team over de jaren volgt, moet dezelfde fase met zichzelf
vergelijken — dezelfde regel als bij de ledentellingen in 1a, en om dezelfde reden.

---

## 2. De vereniging is het breedst rond twaalf jaar
*Periode: 2017-2018 en later (schone data)*

Gemiddelde bezetting per leeftijd per seizoen:

| Leeftijd | Gemiddeld per seizoen |
|---|---|
| 8 | 13,7 |
| 10 | 18,5 |
| 11 | 18,8 |
| **12** | **19,5 — piek** |
| 13 | 18,8 |
| 15 | 16,9 |
| 17 | 12,7 (65% van de piek) |
| 18 | 11,3 (58% van de piek) |

Tussen 10 en 13 jaar ligt een plateau van 18,5 tot 19,5 — de piek op 12 is geen
scherpe top. Groep 8 (elf jaar) blijft daarmee een bruikbaar ijkpunt: wat daar staat,
bepaalt grotendeels wat er zes jaar later staat.

> Een eerdere versie noemde 11 jaar als piek met 18,7. Dat was gerekend over alle 16
> seizoenen, inclusief de onvolledige jaren vóór 2017-2018 (zie 1b). De vorm van de
> curve verandert nauwelijks; de niveaus liggen op schone data hoger.

Bron: `scripts/analyse-breedste-leeftijd.mjs`

---

## 3. Van 11 naar 17 blijft 61% over

Een jaargang van 25 spelers op elfjarige leeftijd, gerekend met de laatste vijf
seizoensovergangen:

| Leeftijd | Totaal | Over |
|---|---|---|
| 11 | 25,0 | 100% |
| 13 | 25,1 | 100% |
| 15 | 21,7 | 87% |
| **17** | **15,4** | **61%** |
| 19 | 9,9 | 39% |
| 23 | 6,8 | 27% |

Tot en met dertien jaar houdt de vereniging alles vast: uitval wordt daar nog
opgevangen door zij-instroom.

Bron: `scripts/doorstroom-vanaf-piek.mjs`

---

## 4. De breuklijnen liggen op levensovergangen

Netto factor per leeftijdsovergang, laatste vijf seizoenen:

| Overgang | Jongens | Meisjes | Levensfase |
|---|---|---|---|
| 12 → 13 | 1,03 | 0,98 | basisschool naar middelbaar — **geen verlies** |
| 13 → 14 | 0,92 | 0,91 | eerste jaar brugklas |
| 16 → 17 | 0,85 | **0,73** | bovenbouw, bijbaan, rijbewijs |
| 17 → 18 | **1,00** | **0,77** | examenjaar |
| 18 → 19 | **0,71** | **0,74** | studeren, verhuizen |
| 20 → 21 | 1,00 | 0,96 | rust |
| 21 → 22 | 0,93 | 0,83 | afstuderen, werk |

Drie observaties die tegen de intuïtie ingaan:

- **De overgang naar de middelbare school kost niets.** Het verlies komt een jaar
  later, in de brugklas zelf.
- **18 → 19 is de zwaarste enkele klap**, bijna dertig procent, en de enige waar
  jongens en meisjes even hard vallen.
- **Bij meisjes begint het twee jaar eerder.** Van 16 naar 18 verliezen zij 44%,
  jongens 15%.

Deze drie momenten — brugklas, meisjes van 16 tot 18, en iedereen rond 19 — zijn de
aangrijpingspunten voor retentiebeleid.

---

## 5. Sekseverhouding wordt bij instroom bepaald, niet later

**Instroom is historisch 40% jongens en 60% meisjes**, op vrijwel elke instapleeftijd.
Een korfbalteam heeft vijf heren en vijf dames nodig. Jongens zijn daarmee per
definitie de schaarse helft — niet incidenteel, maar als rekenkundig gevolg van de
eigen instroom.

Binnen een geboortecohort blijft het aandeel jongens vervolgens ruwweg constant.
Jaargang 2002 kwam binnen met ongeveer 20% jongens en stond er tien jaar later nog
steeds zo voor; jaargang 2003 met 45-50% idem. **Een lichting die scheef binnenkomt,
herstelt niet.**

Jongens zijn wel iets loyaler. Cumulatief vanaf leeftijd 8:

| Leeftijd | Jongens over | Meisjes over |
|---|---|---|
| 14 | 79,9% | 73,6% |
| 17 | 64,0% | 56,1% |
| 19 | 53,5% | 40,5% |

Dat verschil is **ongeveer drie tot vier procentpunt waard** in de uiteindelijke
verhouding: een lichting die op haar achtste binnenkomt met 40% jongens, staat er op
haar zeventiende met 43%.

**Om op 50/50 uit te komen op 17-jarige leeftijd moet de instroom rond 46% jongens
liggen.** Nu is dat 43%, met een dip naar 33% bij instroom op 13-15 jaar.

Bronnen: `scripts/analyse-gender-per-leeftijd.mjs`,
`scripts/analyse-loyaliteit-per-geslacht.mjs`,
`scripts/analyse-gender-cohort-longitudinaal.mjs`

> **Vervallen conclusie.** Een eerdere analyse concludeerde dat de verhouding richting
> de senioren vanzelf gelijktrekt doordat volwassen mannen instromen. Dat klopt niet.
> De instroom vanaf 24 jaar bestaat over 17 seizoenen uit 31 mannen en 25 vrouwen —
> ruim twee per jaar, vrijwel gelijk verdeeld, landend in midweek en de lagere
> seniorenteams. De schijnbare stijging van het jongensaandeel met de leeftijd was een
> artefact van het optellen van alle seizoenen in één tabel.

---

## 6. Vroege blootstelling bepaalt de toegang tot wedstrijdkorfbal

Geboortejaren 2002 t/m 2009, hele jeugd binnen de meetperiode:

| | Bereikte wedstrijdkorfbal | Bereikte het niet |
|---|---|---|
| Minstens 2 seizoenen vóór hun 12e | **88%** | 66% |
| Nul seizoenen vóór hun 12e | 11% | 32% |

Wie vóór zijn twaalfde minstens twee jaar korfbalde had **67%** kans om een eerste of
tweede team te bereiken; wie dat niet had **35%**.

**Nuance:** het contrast is gevoelig voor de definitie. Beperkt tot alleen de eerste
teams wordt het 84% tegen 77%. De uitspraak die overeind blijft is niet "vroeg
beginnen maakt je een topper", maar **"vroeg beginnen is bijna een voorwaarde om
überhaupt in het wedstrijdkorfbal te komen"**.

**Onderscheid met de literatuur:** vroege *specialisatie* — één sport kiezen vóór je
twaalfde — is zeldzaam onder elite-atleten en hangt samen met blessures en burn-out.
Vroege *blootstelling* is iets anders en daar wijst het onderzoek de andere kant op.
Een kind kan prima vanaf zijn achtste korfballen én daarnaast een andere sport doen.
Er is geen onderzoek gevonden dat specifiek voor korfbal een minimale aanloopperiode
onderbouwt; de twee jaar is een praktijkoordeel, nu gesteund door eigen cijfers.

Bron: `scripts/analyse-instroomleeftijd-top.mjs`

---

## 7. De deur naar het eerste team loopt via U19-1

Geboortejaren 1992 t/m 2005, iedereen die de oudste jeugd haalde:

| Hoogste jeugdteam | n | S1 | S1 of S2 | S3 of lager | Gestopt vóór 19 |
|---|---|---|---|---|---|
| A1 / U19-1 | 61 | **52%** | 62% | 21% | 16% |
| A2 / U19-2 | 28 | **7%** | 21% | 61% | 18% |
| Overig | 5 | 0% | 0% | 20% | 80% |

Van de 34 spelers uit deze jaargangen die ooit in S1 stonden kwamen er **32 uit A1 of
U19-1 (94%)** en 2 uit A2 of U19-2.

**Eén seizoen U19-1 is daarmee een bruikbare definitie van talent.**

Twee dingen om mee te wegen:

- **Talent lekt net zo hard weg.** Van de A1-groep stopt 16% vóór het negentiende
  jaar, vrijwel gelijk aan de A2-groep. Per plek in S1 zijn ruwweg **twee
  U19-1-spelers** nodig.
- **Er zit een cirkelredenering in.** Dezelfde TC selecteert voor U19-1 en later voor
  S1. Dat de twee overeenkomen bewijst consistentie van het oordeel, niet de
  juistheid ervan. Wat wél vaststaat is dat de route in de praktijk zo loopt.

De zes uitzonderingen (via A2/U19-2 toch S1 of S2) zijn vijf vrouwen en één man. Te
weinig om conclusies aan te verbinden, genoeg om op te letten.

Bron: `scripts/analyse-doorstroom-jeugd-senioren.mjs`

---

## 8. De ambitie: 50 spelers op 17 en 18 jaar

Doel: 50 spelers op korfballeeftijd 17 en 18 samen, 25 jongens en 25 meisjes. Daaruit
komen twee U19-teams plus drie Rood/Oranje-teams, of een U19-3 plus twee. Met vijf
teams van tien in deze leeftijdscategorie is meedoen bovenin de Hoofdklasse U19
realistisch — het langetermijndoel is Ahoy.

De redenering: kwaliteit van de opleiding en het toeval van een talentvolle lichting
blijven bepalend, maar de kans is groter met 50 spelers over twee geboortejaren dan
met 20. En zeker jaar na jaar.

**Wat de ambitie vraagt**, met het behoud van de laatste vijf jaar (61% van 11 naar 17):

| Doel op 17 jaar | Nodig op 11 jaar |
|---|---|
| 20 | 33 |
| **25** | **41** |
| 30 | 49 |

De vereniging zit nu op ongeveer 19 elfjarigen per geboortejaar.

**De goedkoopste weg loopt niet via werven.** Breng het behoud van 16 naar 17 terug
naar het historische niveau — van 0,79 naar 0,89 — en dezelfde 25 elfjarigen leveren
er 17 op in plaats van 15; de lat zakt van 41 naar 36. Werven aan de onderkant duurt
zes jaar voordat het effect zichtbaar is; deze overgang repareren werkt binnen twee.

Bron: `scripts/doelmodel-u19.mjs`

### Breedte-schaal

Werktermen voor de omvang van de U19-groep (17 + 18 jaar samen). Nog niet definitief;
de bedoeling is dat deze termen uiteindelijk overal in de vereniging hetzelfde
betekenen en dan in `rules/oranje-draad.md` thuishoren.

| Aantal | Term |
|---|---|
| 50+ | heel breed |
| 45+ | breed |
| 40+ | ruim |
| 35+ | voldoende |
| 30+ | smal |
| 25+ | heel smal |
| < 25 | te smal |

Lagere waarden zijn een afstand tot een ambitie, geen tekortkoming. Twee teams is
smal maar functioneel.

---

## 9. Breedte en niveau — niet te toetsen met wat we hebben

Het beleid gaat ervan uit dat een breder cohort tot een hoger eindniveau leidt, via
meer onderlinge concurrentie en differentiatie (zie `rules/oranje-draad.md`).

**Die aanname is met de huidige data niet te toetsen, en een voor de hand liggende
toets is misleidend.** Het aandeel van een jaargang dat U19-1 of S1 haalt, daalt
naarmate de jaargang breder is:

| Geboortejaar | Op 11 jaar | Haalde A1/U19-1/S1 |
|---|---|---|
| 1999 | 8 | 7 (88%) |
| 2003 | 23 | 12 (52%) |
| 2005 | 27 | 5 (19%) |
| 2006 | 16 | 2 (13%) |

Dat lijkt tegen het beleid te pleiten, maar het is een noemer-effect: U19-1 heeft
ongeveer tien plekken en S1 acht, ongeacht hoe breed de jaargang is. Bij een smalle
lichting haalt bijna iedereen de top omdat er niemand anders is. De correlatie tussen
breedte en aandeel is dan ook negatief (r = −0,41) en zegt niets.

In absolute aantallen is de samenhang zwak positief (r = 0,25): bredere jaargangen
leveren iets meer topspelers. Dat is consistent met "meer lootjes in dezelfde
trekking", niet met "concurrentie tilt het niveau op".

**Wat een echte toets zou vragen:** het competitieniveau van de teams zelf — speelde
U19-1 hoofdklasse of lager in jaren waarin de onderliggende lichting breed was. Die
data hebben we niet: `team_periodes.pool` is alleen gevuld vanaf 2025-2026 en
`sterkte` is overal leeg.

**Actie:** wil de vereniging deze beleidspijler onderbouwen, dan moet per team per
seizoen het competitieniveau worden vastgelegd. Vanaf nu, want met terugwerkende
kracht kan het niet meer.

Bron: `scripts/analyse-cohortbreedte-versus-niveau.mjs`

---

## 10. Wat nog niet vaststaat

- **Streefaantallen.** In de code staan 24 jongens en 26 meisjes per selectiecategorie
  hardgecodeerd, terwijl `model/jeugdmodel.yaml` een talent-ratio-formule bevat die op
  44 per geslacht uitkomt. Twee modellen, factor 1,4 tot 1,8 verschil, en de formule
  wordt nergens in productiecode gebruikt. Welk model geldt is een openstaande
  beleidskeuze.
- **Gendernorm.** De signalering toetst aan ~50/50, wat een teamvullings-eis is. De
  instroomrealiteit is 40/60. Die botsing wordt nergens benoemd, waardoor structurele
  scheefheid als incident wordt gemeld.
- **KNKV-benchmark.** Het KNKV publiceert geen retentiecijfers per leeftijd, alleen
  kwartaalcijfers per vereniging. Er is dus geen extern ijkpunt voor onze 61%.
- **`data/modellen/streef-ledenboog.json`** is van februari 2026 en beschrijft
  2025-2026 nog als huidig seizoen.
