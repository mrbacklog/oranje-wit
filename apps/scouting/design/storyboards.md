# OW Scout — Interactie-storyboards & User Testing Plan

---

## Deel 1: Interactie-storyboards

---

### Storyboard 1: "De Eerste Keer"

**Persona**: Trainer Hans (45), traint Geel 3. Heeft een Samsung Galaxy A54. Gebruikt WhatsApp en Sportlink, verder weinig apps. Kent "zijn" 10 spelers door en door, maar heeft weinig zicht op andere teams.

---

**Panel 1 — De link in de groepsapp**

*Scherm*: WhatsApp-groep "TC Jeugd OW". Bericht van TC-lid Marieke: "Hi allemaal! Hier de link naar OW Scout, de nieuwe scouting-app. Vul na elke wedstrijd even een kort rapport in. Duurt 2 minuten!"

*Hans denkt*: "Weer een app... Maar goed, als de TC het vraagt."

*Hans doet*: Tikt op de link.

---

**Panel 2 — De app opent: splash screen**

*Scherm*: Wit scherm met het OW-logo (oranje-wit). Daaronder een subtiele laadindicator. De tekst "OW Scout" verschijnt met een kort fade-in.

*Hans denkt*: "Ziet er clean uit. Geen gedoe."

*Hans doet*: Wacht 1,5 seconde. De app laadt.

---

**Panel 3 — Onboarding slide 1 van 3**

*Scherm*: Grote illustratie van een korfbalveld met een verrekijker-icoon. Kop: **"Jij kent je spelers het best"**. Body: "Met OW Scout deel je wat jij ziet langs het veld. Geen cijfers, geen ingewikkelde formulieren. Gewoon jouw observatie." CTA-knop onderaan: "Volgende".

*Hans denkt*: "Oké, klinkt simpel."

*Hans doet*: Leest de tekst. Tikt op "Volgende".

---

**Panel 4 — Onboarding slide 2 van 3**

*Scherm*: Illustratie van drie gekleurde cirkels (oranje = Plezier, blauw = Ontwikkeling, groen = Prestatie). Kop: **"Drie pijlers, drie vragen"**. Body: "Elke scouting draait om plezier, ontwikkeling en prestatie. Je beantwoordt per pijler een simpele vraag. Klaar in 2 minuten." CTA: "Volgende".

*Hans denkt*: "De Oranje Draad, die kennen we van de TC-avond. Handig."

*Hans doet*: Tikt op "Volgende".

---

**Panel 5 — Onboarding slide 3 van 3**

*Scherm*: Illustratie van een spelerskaart met een gouden gloed. Kop: **"Verdien kaarten en badges"**. Body: "Elke scouting levert een spelerskaart op. Hoe vaker je scout, hoe meer je ontgrendelt. Kun jij de gouden kaart vinden?" CTA: "Start met scouten".

*Hans denkt*: "Haha, kaarten. Net als die Pokemon-kaarten van m'n zoon. Leuk."

*Hans doet*: Tikt op "Start met scouten". Korte confetti-burst animatie (300ms).

---

**Panel 6 — Home screen**

*Scherm*: Bovenaan: "Goedemiddag Hans" met een scout-level badge "Starter" (level 1, 0/50 XP). Daaronder een prominente oranje knop: "Scout een speler". Daaronder: "Jouw rapporten: 0" en "Ontdekte kaarten: 0/0". Onderaan een tab-bar: Home | Kaarten | Profiel.

*Hans denkt*: "Overzichtelijk. Die grote knop is duidelijk."

*Hans doet*: Tikt op "Scout een speler".

---

**Panel 7 — Speler zoeken**

*Scherm*: Zoekbalk bovenaan met placeholder: "Zoek op naam of team...". Daaronder een lijst met suggesties: recent bekeken spelers (leeg) en "Alle teams" als snelkeuze. Hans typt "Soph".

*Scherm update*: Autocomplete toont "Sophie van der Berg — Geel 3" en "Sophie Jansen — Groen 2". Elke suggestie toont naam, team, en leeftijd.

*Hans denkt*: "Ah, hij vindt ze meteen. Ik zoek Sophie van der Berg."

*Hans doet*: Tikt op "Sophie van der Berg — Geel 3".

---

**Panel 8 — Context kiezen**

*Scherm*: Sophies naam en team staan bovenaan. Daaronder: "Wanneer heb je Sophie gezien?" met drie opties als kaarten: "Wedstrijd" (met wedstrijd-icoon), "Training" (met pilon-icoon), "Overig" (met oog-icoon). De huidige datum staat voorgevuld.

*Hans denkt*: "Het was bij de wedstrijd van afgelopen zaterdag."

*Hans doet*: Tikt op "Wedstrijd". Het kaartje krijgt een oranje rand en een vinkje. Onderaan verschijnt "Volgende".

---

**Panel 9 — Beoordeling: Plezier (pijler 1)**

*Scherm*: Bovenaan een voortgangsbalk: stap 1 van 3, "Plezier" in het oranje. De vraag: "Hoe zag je Sophie genieten?" met een 5-punts smiley-schaal (van verdrietig gezicht tot stralend gezicht). Geen cijfers, alleen smileys. Daaronder een optioneel tekstveld: "Opmerking (optioneel)" met suggestie-chips: "Enthousiast", "Stil vandaag", "Goede sfeermaker", "Gefrustreerd".

*Hans denkt*: "Sophie was vandaag echt blij op het veld. Die tweede smiley van rechts past."

*Hans doet*: Tikt op de vierde smiley (blij gezicht). Het smiley groeit kort (scale 1.0 -> 1.3 -> 1.0, 200ms) en kleurt oranje. Tikt op chip "Goede sfeermaker".

---

**Panel 10 — Beoordeling: Ontwikkeling (pijler 2)**

*Scherm*: Voortgangsbalk: stap 2 van 3, "Ontwikkeling" in het blauw. Vraag: "Hoeveel vooruitgang zie je bij Sophie?" Dezelfde smiley-schaal. Suggestie-chips: "Verbeterd", "Stabiel", "Wil meer uitdaging", "Moeite met techniek".

*Hans denkt*: "Ze ontwikkelt zich goed, haar schot is echt beter geworden."

*Hans doet*: Tikt smiley 4 (blij). Tikt chip "Verbeterd". Scrollt naar het opmerkingenveld en typt: "Schot is echt verbeterd de laatste weken."

---

**Panel 11 — Beoordeling: Prestatie (pijler 3)**

*Scherm*: Voortgangsbalk: stap 3 van 3, "Prestatie" in het groen. Vraag: "Hoe presteerde Sophie in vergelijking met het team?" Smiley-schaal. Suggestie-chips: "Bovengemiddeld", "Gemiddeld", "Uitblinker vandaag", "Wat onzichtbaar".

*Hans denkt*: "Ze was vandaag de beste op het veld. Makkelijk."

*Hans doet*: Tikt smiley 5 (stralend). Tikt chip "Uitblinker vandaag". De voortgangsbalk is nu helemaal vol. Onderaan verschijnt een grote oranje knop: "Rapport indienen".

---

**Panel 12 — Indienen en kaart-reveal (wow-moment)**

*Scherm*: Hans tikt op "Rapport indienen". Het scherm dimt kort (200ms). Dan: een envelop-animatie — de envelop schuift omhoog, opent zich, en er komt een spelerskaart uit tevoorschijn.

*De kaart*: Sophie van der Berg. Bronzen kaart (eerste rapport). Drie POP-balkjes zichtbaar in oranje/blauw/groen. Onderaan: "1e rapport!" met een +25 XP animatie die omhoog floatet.

*Hans denkt*: "Oh wauw, dat is best gaaf! Een kaartje. En XP, haha."

*Feedback*: Subtiele haptic feedback (trilletje). Tekst onderaan: "Netjes! Je eerste scouting-rapport." De knop "Bekijk kaart" en "Nog een speler scouten" verschijnen.

*Hans doet*: Glimlacht. Tikt op "Bekijk kaart" om de kaart van dichtbij te zien. Denkt: "Dit ga ik volgende week weer doen."

---

### Storyboard 2: "Team Scouten op Zaterdag"

**Persona**: TC-lid Marieke (38), coördineert de Geel-teams. Heeft een iPhone 15. Is analytisch en wil graag data om beslissingen te onderbouwen. Staat dit weekend langs het veld bij Geel 2 vs. een uitwedstrijd.

---

**Panel 1 — Langs het veld, voor de wedstrijd**

*Situatie*: Marieke staat met een kop koffie langs het veld. De warming-up is bezig. Ze heeft 10 minuten voor de aftrap.

*Marieke denkt*: "Ik ga vandaag het hele team scouten. Mooi moment om te kijken hoe ze spelen."

*Marieke doet*: Opent OW Scout op haar telefoon.

---

**Panel 2 — Home screen herkenning**

*Scherm*: "Goedemorgen Marieke" met badge "Verkenner" (level 3, 180/250 XP). Snelkoppeling bovenaan: "Je laatste team-scouting: Geel 2 (2 weken geleden)". Grote knop: "Scout een speler". Daarnaast een tweede knop: "Scout een team".

*Marieke denkt*: "Team scouten, dat is sneller als ik iedereen wil doen."

*Marieke doet*: Tikt op "Scout een team".

---

**Panel 3 — Team kiezen**

*Scherm*: Lijst met teams waar Marieke eerder voor heeft gescout, bovenaan "Geel 2" als suggestie. Daaronder alle jeugdteams. Elk team toont: teamnaam, aantal spelers, en het aantal dagen sinds de laatste scouting (groen = recent, oranje = >2 weken, rood = >4 weken).

*Marieke denkt*: "Geel 2, dat klopt. 4 weken geleden, staat rood. Werd tijd."

*Marieke doet*: Tikt op "Geel 2". De teamlijst klapt open naar de context-keuze.

---

**Panel 4 — Context kiezen (wedstrijd)**

*Scherm*: "Geel 2 — Team-scouting". Context: "Wedstrijd" is al geselecteerd (voorgevuld, want het is zaterdag). Datum: vandaag. "Alle 10 spelers worden beoordeeld."

*Marieke denkt*: "Mooi, alles staat al goed."

*Marieke doet*: Tikt op "Start scouting". De wedstrijd begint net.

---

**Panel 5 — Pijler-modus: alle spelers voor Plezier**

*Scherm*: Bovenaan staat "Pijler 1: Plezier" met een oranje accent. Daaronder een verticale lijst van alle 10 spelers met hun naam en foto. Naast elke naam: de 5 smiley-schaal, horizontaal en compact. Alles past op een scherm.

*Marieke denkt*: "Slim, zo kan ik iedereen in een keer doen per pijler."

*Marieke doet*: Terwijl ze de wedstrijd kijkt, tikt ze per speler een smiley aan. Sophie: 4. Daan: 3. Eva: 5. Het kost haar 30 seconden per pijler-ronde.

*Feedback*: Elke aangetikte smiley geeft een subtiel kleurtje en een mini-animatie (bounce). Bovenaan staat "7/10 beoordeeld" als teller.

---

**Panel 6 — Pijler 2: Ontwikkeling**

*Scherm*: Na het invullen van alle 10 spelers op Plezier verschijnt automatisch de volgende pijler: "Pijler 2: Ontwikkeling" in blauw. Dezelfde lijstweergave. Marieke ziet de namen en kan swipen om terug te gaan naar Plezier als ze iets wil aanpassen.

*Marieke denkt*: "Tijdens de rustpauze even de tweede ronde. Eva valt echt op vandaag."

*Marieke doet*: Vult alle 10 spelers in. Eva krijgt een 5. Typt bij Eva: "Geweldige pass vandaag, echt een stap vooruit." Tikt op "Volgende".

---

**Panel 7 — Pijler 3: Prestatie**

*Scherm*: "Pijler 3: Prestatie" in groen. Laatste pijler. Marieke vult snel in. Bovenaan verschijnt een kleine preview: "Wie steekt eruit?" met Eva en Sophie licht opgelicht (hoogste gemiddelden tot nu toe).

*Marieke denkt*: "Klopt precies, Eva en Sophie waren de beste vandaag."

*Marieke doet*: Vult de laatste beoordelingen in. De knop "Alles indienen" verschijnt onderaan met een teller: "10 rapporten klaar".

---

**Panel 8 — Bulk-indienen**

*Scherm*: Marieke tikt op "Alles indienen". Een samenvatting verschijnt: 10 spelers, 30 beoordelingen, gemiddelde scores per pijler als drie cirkeltjes. "Wil je alles indienen?"

*Marieke denkt*: "Even checken... ja, ziet er goed uit."

*Marieke doet*: Tikt op "Indienen". Het scherm wordt een feestje.

---

**Panel 9 — Multi-kaart reveal**

*Scherm*: Een pack-opening animatie. Tien kaartjes vallen als een waaier op het scherm en draaien zich een voor een om (de gebruiker kan tappen om sneller door te gaan). Elke kaart toont de speler met hun bijgewerkte POP-scores. Twee kaarten hebben een gloed: Eva (nieuw rapport, kaart upgradet van brons naar zilver) en Sophie (al zilver, gloeit op met verbeterde scores).

*Feedback*: "+250 XP!" floated groot in beeld. "Bonus: Team-scouting compleet! +50 XP". Mariekes level-balk vult zich en springt van "Verkenner" naar — bijna "Kenner".

*Marieke denkt*: "250 XP! En Eva is zilver nu. Dit is echt leuk."

---

**Panel 10 — Team-overzicht na scouting**

*Scherm*: Na de kaart-reveal verschijnt een team-overzicht: "Geel 2 — Scouting vandaag". Een ranking op basis van de POP-scores van vandaag. Eva staat bovenaan met een kleine ster. Sophie tweede. Onderaan: "Eva scoort significant hoger dan het teamgemiddelde op Ontwikkeling."

*Marieke denkt*: "Dit bevestigt mijn gevoel. Eva is klaar voor een hogere groep."

*Marieke doet*: Tikt op Eva's naam om haar volledige kaart te bekijken.

---

**Panel 11 — Eva's spelerskaart**

*Scherm*: Eva's zilveren kaart in groot formaat. Drie POP-balken: Plezier 4.2 (oranje), Ontwikkeling 4.8 (blauw, opvallend hoog), Prestatie 4.5 (groen). Aantal rapporten: 4. Trend-indicator: pijl omhoog bij Ontwikkeling. Badge: "Stijger" (3 achtereenvolgende verbeteringen).

*Marieke denkt*: "Dit neem ik mee naar de TC-vergadering volgende week."

*Marieke doet*: Tikt op het deel-icoon. Opties: "Deel naar TC" of "Bewaar screenshot".

---

**Panel 12 — Terugkeer naar home**

*Scherm*: Home screen. Mariekes stats zijn bijgewerkt: "Jouw rapporten: 47" (+10), "Ontdekte kaarten: 28". De XP-balk staat op 230/250 — nog 20 XP tot level 4. Een banner onderaan: "Nog 1 team-scouting tot je 'Teamspeler'-badge!"

*Marieke denkt*: "Volgende week weer. Nog even die badge pakken."

*Marieke doet*: Sluit de app. De hele scouting kostte 8 minuten, verspreid over de wedstrijd.

---

### Storyboard 3: "De Gouden Kaart"

**Persona**: Scout Peter (52), oud-speler en trouwe vrijwilliger. Scoort wedstrijden van teams waar hij niet zelf bij betrokken is. Heeft een Pixel 7. Houdt van data en systematiek.

---

**Panel 1 — Peter is een vaste scouter**

*Situatie*: Peter is level 5 ("Kenner") met 520 XP. Hij heeft al 73 rapporten ingediend over 3 maanden. Vandaag is hij bij een wedstrijd van Oranje 1. Hij heeft een favoriet: Jayden, een speler die hij al 5 keer heeft gescout.

*Peter denkt*: "Jayden speelt vandaag weer. Ben benieuwd hoe hij het doet."

*Peter doet*: Opent OW Scout.

---

**Panel 2 — Home screen met hint**

*Scherm*: "Goedemiddag Peter" met badge "Kenner" (level 5). Onder de knop "Scout een speler" staat een subtiele hint: "Je hebt Jayden al 5x gescout. Nog 1 rapport voor een speciale kaart..." De hint gloeit zachtjes.

*Peter denkt*: "Speciale kaart? Wat zou dat zijn?"

*Peter doet*: Grijns. Tikt op "Scout een speler".

---

**Panel 3 — Jayden zoeken**

*Scherm*: Zoekbalk. Onder "Recent gescout" staat Jayden bovenaan met een kleine indicator: "5 rapporten" en een zilveren kaart-miniatuur. Peter tikt op Jayden.

*Feedback*: Een subtiele shimmer over Jaydens naam, als een hint dat er iets speciaals aan zit te komen.

---

**Panel 4 — Context en beoordeling (snel)**

*Scherm*: Peter vult de context in (Wedstrijd) en gaat door de drie pijlers. Hij is ervaren en doet het snel — 90 seconden totaal. Jayden scoort hoog: Plezier 4, Ontwikkeling 5, Prestatie 5.

*Peter denkt*: "Jayden was vandaag uitzonderlijk. Die vrije bal, die pass... echt knap."

*Peter doet*: Typt bij Ontwikkeling: "Leest het spel als een senior. Ongelooflijk spelhervatting." Tikt op "Rapport indienen".

---

**Panel 5 — De spanning bouwt op**

*Scherm*: Het scherm dimt. Maar in plaats van de normale envelop-animatie verschijnt een ander scherm: de achtergrond wordt donkerder, er verschijnen subtiele gouden deeltjes. Tekst: "Dit is rapport #6 voor Jayden..."

*Peter denkt*: "Wat is dit? Dit is anders dan normaal..."

*Feedback*: De telefoon trilt kort. Een dramatische pauze van 2 seconden.

---

**Panel 6 — De upgrade-sequentie begint**

*Scherm*: Jaydens huidige zilveren kaart verschijnt in het midden van het scherm. De kaart draait langzaam. Tekst boven de kaart: "6 rapporten verzameld". De kaart begint te gloeien — eerst zilver, dan geel, dan goud.

*Geluid*: Een opbouwend geluid (als de gebruiker geluid aan heeft), als een zeldzame vondst in een game.

*Peter denkt*: "Oh! De kaart verandert!"

---

**Panel 7 — De gouden kaart onthult**

*Scherm*: De zilveren kaart barst open (shatter-animatie) en daarachter verschijnt de GOUDEN kaart. Jaydens naam in goud. Een holografisch effect op de achtergrond van de kaart. De drie POP-balken zijn nu goud-geaccentueerd. Een gouden ster bovenaan de kaart.

*Tekst*: "GOUDEN KAART ONTGRENDELD! Jayden is een uitzonderlijk talent."

*Feedback*: Confetti-explosie. Haptic feedback (twee korte trillingen). "+100 XP BONUS" floated in beeld.

*Peter denkt*: "Wauw. Dit voelt... speciaal. En terecht, want Jayden IS speciaal."

---

**Panel 8 — De gouden kaart in detail**

*Scherm*: De gouden kaart in volledig formaat. Peter kan er omheen swipen voor een 3D-tilt-effect. De kaart toont:
- Naam: Jayden de Vries
- Team: Oranje 1
- Leeftijd: 13
- POP-scores (gemiddelde over 6 rapporten): Plezier 4.3, Ontwikkeling 4.8, Prestatie 4.7
- Trend: alle drie de pijlers stijgend
- Badge op de kaart: "Allrounder" (alle pijlers boven 4.0)
- Aantal scouts: 3 verschillende scouts hebben Jayden beoordeeld
- Onderaan: "Gouden status: bevestigd door meerdere scouts"

*Peter denkt*: "Prachtig. En drie scouts zien het, niet alleen ik."

---

**Panel 9 — Badge unlock: "Goudzoeker"**

*Scherm*: Direct na de gouden kaart verschijnt een badge-animatie: "BADGE ONTGRENDELD: Goudzoeker". Icoon: een verrekijker met een gouden gloed. Beschrijving: "Ontdek je eerste gouden kaart." "+25 XP".

*Peter denkt*: "Haha, Goudzoeker. Past wel bij me."

*Peter doet*: Tikt op "Deel deze ontdekking". Een share-sheet verschijnt met opties: "Deel kaart als afbeelding" of "Deel naar TC".

---

**Panel 10 — Delen met de TC**

*Scherm*: Peter kiest "Deel naar TC". Een nette afbeelding wordt gegenereerd: Jaydens gouden kaart met de POP-scores, zonder de gamification-elementen (geen XP, geen badges). Professioneel en zakelijk. De afbeelding gaat naar de TC-WhatsApp-groep.

*Peter denkt*: "De TC moet dit weten. Jayden is klaar voor U15-1."

*Peter doet*: Stuurt de afbeelding. Gaat terug naar de app.

---

**Panel 11 — Reflectie op de collectie**

*Scherm*: Peter opent de "Kaarten"-tab. Zijn collectie: 31 kaarten totaal. Verdeling: 18 brons, 11 zilver, 2 goud (Jayden en Fleur). Een filter: "Goud" toont alleen de twee gouden kaarten. Een zoekbalk en sorteeroptie (op POP-score, op team, op leeftijd).

*Peter denkt*: "Twee gouden kaarten. Jayden en Fleur. De TC gaat hier blij mee zijn."

---

**Panel 12 — De missie gaat door**

*Scherm*: Peter sluit de kaarten-tab. Op het home screen ziet hij: Level 5, 645/700 XP. Een nieuwe hint: "3 spelers van Rood 1 zijn nog niet gescout. Ga jij kijken?" En een seizoensoverzicht: "Jouw top-ontdekking dit seizoen: Jayden (Goud)."

*Peter denkt*: "Rood 1, volgende week. Misschien zit daar ook een gouden kaart."

*Peter doet*: Sluit de app met een voldaan gevoel.

---

### Storyboard 4: "Vergaderen met Data"

**Persona**: De TC Jeugd vergadert op woensdagavond. Aanwezig: voorzitter Karin (50), coördinator Marieke (38), trainer Hans (45), en scout Peter (52). Ze bespreken de teamindeling voor de tweede seizoenshelft.

---

**Panel 1 — De vergadertafel**

*Situatie*: Vergaderruimte in de kantine. Laptop op tafel, aangesloten op het TV-scherm. Karin opent de Team-Indeling app in de browser.

*Karin denkt*: "Vandaag moeten we beslissen over de doorstroom van Geel naar Oranje."

---

**Panel 2 — Team-Indeling app met scouting-integratie**

*Scherm (laptop)*: De Team-Indeling app toont het scenario "2e helft 2025-2026". In de zijbalk staan de teams. Karin klikt op "Geel 2". De spelerslijst verschijnt. Nieuw dit seizoen: naast elke speler staat een klein kaart-icoon met een kleur (brons/zilver/goud) als er scouting-data beschikbaar is.

*Karin zegt*: "Kijk, we hebben nu scouting-data voor bijna alle spelers van Geel 2."

---

**Panel 3 — Spelerskaart in de teamindeling**

*Scherm*: Karin klikt op het kaart-icoon naast "Eva Bakker". Een zijpaneel opent met Eva's spelerskaart. De kaart toont:
- Zilveren status (4 rapporten, 2 scouts)
- POP-scores: Plezier 4.2, Ontwikkeling 4.8, Prestatie 4.5
- Trend: Ontwikkeling sterk stijgend (pijl omhoog)
- Opmerkingen van scouts: "Geweldige pass", "Leest het spel goed", "Klaar voor meer uitdaging"
- Aanbeveling (automatisch op basis van scores): "Overweeg doorstroom naar Oranje"

*Marieke zegt*: "Zie je? Dit is wat ik vorige keer ook al zei. Eva is klaar."

---

**Panel 4 — Vergelijken van twee spelers**

*Scherm*: Karin sleept Eva's kaart naar een vergelijkingsvenster. Ze voegt er "Daan Vermeer" (Oranje 2, brons, 2 rapporten) aan toe. Een side-by-side vergelijking verschijnt:

```
Eva Bakker (Geel 2, 11 jr)    vs.    Daan Vermeer (Oranje 2, 13 jr)
Plezier:      4.2  ████████░░         3.5  ███████░░░
Ontwikkeling: 4.8  █████████░         3.8  ███████░░░
Prestatie:    4.5  █████████░         3.6  ███████░░░
Rapporten:    4 (2 scouts)            2 (1 scout)
Trend:        ↑ stijgend             → stabiel
```

*Hans zegt*: "Wacht even... Eva scoort hoger dan Daan? Daan speelt al een jaar in Oranje."

---

**Panel 5 — De eye-opener**

*Scherm*: Karin scrollt door de Oranje 2-spelerslijst. Ze sorteert op POP-gemiddelde. Daan staat op plek 7 van 10. Eva zou op plek 3 staan als ze in dit team zat.

*Peter zegt*: "Ik heb Eva drie keer gezien. Die speelt nu al op Oranje-niveau. Ze verveelt zich in Geel."

*Karin denkt*: "De data bevestigt wat de scouts zien. Dit is niet meer een onderbuikgevoel."

---

**Panel 6 — Historische trend bekijken**

*Scherm*: Karin opent Eva's detailpagina. Een grafiek toont haar POP-scores over tijd (4 datapunten over 2 maanden). Alle drie de lijnen stijgen. De Ontwikkeling-lijn stijgt het steilst. Een annotatie: "Scouts: 'Klaar voor meer uitdaging' (3x genoemd)."

*Marieke zegt*: "De trend is duidelijk. Ze groeit uit haar team."

---

**Panel 7 — Check op de Oranje Draad**

*Scherm*: Karin klikt op "Toets aan Oranje Draad". Een validatiescherm verschijnt:

- Plezier: "Eva's plezier-score is hoog (4.2). Risico: sociale aanpassing in nieuw team. Let op: ze kent Sophie (ook Geel 2 → Oranje-kandidaat)."
- Ontwikkeling: "Doorstroom biedt meer uitdaging. Score 4.8 bevestigt groei-potentieel. Positief."
- Prestatie: "Eva scoort boven Oranje-gemiddelde. Ze kan direct bijdragen."
- Duurzaamheid: "Doorstroom nu voorkomt risico op verveling en retentieverlies."

*Karin zegt*: "Alle pijlers positief. Ik stel voor: Eva door naar Oranje 2."

---

**Panel 8 — Het besluit vastleggen**

*Scherm*: Karin sleept Eva van Geel 2 naar Oranje 2 in de Team-Indeling app. Een bevestigingsdialoog: "Eva Bakker verplaatsen van Geel 2 naar Oranje 2?" met een notitieveld. Karin typt: "TC-besluit 12-03-2026. Scouting-data bevestigt doorstroom-gereedheid."

*Hans zegt*: "En Sophie? Die scoorde toch ook hoog?"

---

**Panel 9 — Sophie's kaart bekijken**

*Scherm*: Karin opent Sophie's kaart. Zilver, 3 rapporten. POP: Plezier 4.5, Ontwikkeling 4.0, Prestatie 3.8. De trend bij Ontwikkeling is vlak, bij Plezier stijgend.

*Peter zegt*: "Sophie is goed, maar ze zit lekker in haar team. Die plezier-score is het hoogst."

*Marieke zegt*: "Ik zou haar nog een halfjaar in Geel houden. Ze heeft het naar haar zin en groeit in haar eigen tempo."

---

**Panel 10 — Karin controleert de teamgrootte**

*Scherm*: Karin bekijkt Oranje 2 na de verplaatsing van Eva. Teamgrootte: 11 (was 10). Gender: 6M + 5V. Leeftijdsspreiding: 11-14 (3 jaar, binnen KNKV-regels). Een groen vinkje bij alle validatieregels.

*Karin zegt*: "Past prima. Gender is in orde, leeftijd ook."

---

**Panel 11 — Overzicht van alle scouting-data**

*Scherm*: Karin opent een overzichtspagina: "Scouting-dekkingsgraad". Een heatmap toont per team hoeveel rapporten er zijn:

```
Geel 1:  ████████░░  80% (8/10 spelers gescout)
Geel 2:  ██████████  100% (10/10)
Oranje 1: ███████░░░  70% (7/10)
Oranje 2: ████░░░░░░  40% (4/10)
```

*Marieke zegt*: "Oranje 2 heeft te weinig data. Peter, kun jij daar volgende week naar kijken?"

*Peter zegt*: "Staat genoteerd. Ik ga zaterdag bij hun wedstrijd kijken."

---

**Panel 12 — Afsluiting: data-gedreven besluitvorming**

*Scherm*: Karin sluit de vergadering af. Op het scherm: het scenario met Eva's verplaatsing. Een tijdlijn aan de zijkant toont: "12-03: Eva Bakker → Oranje 2 (TC-besluit, onderbouwd door scouting-data)."

*Karin denkt*: "Vroeger was dit onderbuikgevoel. Nu hebben we data. De scouting-app maakt ons beter."

*Hans denkt*: "En het kostte me maar 2 minuten per speler. Dat is de moeite waard."

*Peter denkt*: "Mijn gouden kaart voor Jayden komt volgende vergadering op tafel. Ben benieuwd."

---

## Deel 2: Emotie-curves per flow

---

### Flow 1: Individueel scouten

```
Emotie (1-5)
  5 |                                                    *
    |                                               *  ** *
  4 |         *                                   *  **
    |       ** **                              ***
  3 |     **    **       **                 ***
    |   **       **    ** **              **
  2 | **          **  *    **          ***
    |*              **       **     ***
  1 |                          *****
    +----------------------------------------------------------→ Tijd
     App     Zoek   Speler  Pijler  Pijler  Pijler  Indienen
     opent          kiest   1       2       3       + Kaart!

     Neutraal  Lichte    Ritmische     Routine-   Wow-moment:
     start     spanning: beoordeling:  gevoel     kaart-reveal
               "wie?"    flow-state    zakt even  + XP
                                       in         = emotionele
                                                  piek!
```

**Toelichting**: De curve begint neutraal, daalt licht bij het zoeken (cognitieve inspanning), stijgt bij het vinden van de juiste speler, gaat door een ritmische flow tijdens de drie pijlers (licht dalend door herhaling), en explodeert bij het kaart-reveal moment. De eindscore is hoger dan het begin — de gebruiker voelt zich voldaan.

---

### Flow 2: Team scouten

```
Emotie (1-5)
  5 |                                                         ***
    |                                                       **   *
  4 |                                    **               **
    |       *                          ** **            **
  3 |     ** **    **    **    **    **    **         ***
    |   **    **  ** ** ** ** ** ** *        **     **
  2 | **       ****   **   **   **           ** ***
    |*                                         *
  1 |
    +----------------------------------------------------------→ Tijd
     App    Team   Pijler  Pijler  Pijler  Check  Indienen
     opent  kiest  1 (10x) 2 (10x) 3 (10x)        + Pack!

     Snel    Klaar  Ritmisch werk: elke pijler-ronde     Mega-piek:
     start   voor   is een mini-flow. Lichte vermoeidheid 10 kaarten
             actie  na 30 beoordelingen, maar het gaat    + bonus XP
                    snel door de compacte interface.       = feest!
```

**Toelichting**: Team scouten heeft een langere "werk"-fase met meer herhaling. De emotie schommelt per pijler-ronde — begin van elke ronde is even opladen, dan flow. De bulk-indienen met pack-opening is de allergrootste piek: 10 kaarten tegelijk is overweldigend op een goede manier. De bonus-XP voor een compleet team voegt extra voldoening toe.

---

### Flow 3: Kaarten collectie browsen

```
Emotie (1-5)
  5 |          *              *
    |        ** *           ** **
  4 |      **   *         *    **              *
    |    **     **      **       *           ** **
  3 |  **        **   **          **       **    **
    | *           ** *              **   **        *
  2 |*             **                ****           **
    |                                                 **
  1 |                                                   *
    +----------------------------------------------------------→ Tijd
     Open    Scroll   Vind     Filter    Vergelijk   Sluit
     collectie door    gouden   op team   twee        "genoeg
              kaarten  kaart!            spelers      gezien"

     Nieuwsgierig  Trots      Ontdekking  Analytisch  Verzadiging:
     "wat heb ik?" moment:    + filteren  vergelijken geen nieuwe
                   "die is    is leuk     is nuttig   info meer
                   mooi!"
```

**Toelichting**: Browsen is een ontdekkingsflow. De pieken komen bij het vinden van opvallende kaarten (goud, hoge scores). Het dalen aan het eind is natuurlijk — er is geen actie meer, alleen consumptie. Dit is oké en verwacht. De sleutel is dat de pieken hoog genoeg zijn om terug te komen.

---

## Deel 3: Micro-copy guide

---

### Onboarding slides

**Slide 1**
- **Kop**: Jij kent je spelers het best
- **Body**: Met OW Scout deel je wat jij ziet langs het veld. Geen cijfers, geen ingewikkelde formulieren. Gewoon jouw observatie.
- **CTA**: Volgende

**Slide 2**
- **Kop**: Drie pijlers, drie vragen
- **Body**: Elke scouting draait om plezier, ontwikkeling en prestatie. Je beantwoordt per pijler een simpele vraag. Klaar in 2 minuten.
- **CTA**: Volgende

**Slide 3**
- **Kop**: Verdien kaarten en badges
- **Body**: Elke scouting levert een spelerskaart op. Hoe vaker je scout, hoe meer je ontgrendelt. Kun jij de gouden kaart vinden?
- **CTA**: Start met scouten

---

### Home screen begroeting

**Per dagdeel:**
- Ochtend (6:00-12:00): "Goedemorgen [naam]"
- Middag (12:00-18:00): "Goedemiddag [naam]"
- Avond (18:00-23:00): "Goedenavond [naam]"
- Nacht (23:00-6:00): "Hoi [naam]"

**Per level (subtekst onder de begroeting):**
- Level 1 (Starter): "Welkom bij OW Scout! Begin met je eerste scouting."
- Level 2 (Beginner): "Goed bezig! Je bent op weg."
- Level 3 (Verkenner): "Je hebt al aardig wat spelers gezien."
- Level 4 (Kenner): "De TC waardeert je inzichten."
- Level 5 (Expert): "Jouw scoutings maken het verschil."
- Level 6 (Meester): "Je bent een onmisbare scout voor OW."
- Level 7 (Legende): "Niemand kent de spelers beter dan jij."

---

### Zoek-placeholder

- Standaard: "Zoek op naam of team..."
- Na eerste gebruik: "Zoek een speler of team..."
- Bij team-scouting: "Kies een team..."

---

### Context-keuze labels

- **Wedstrijd**: "Wedstrijd" — icoon: twee kruisende korfbalpalen
- **Training**: "Training" — icoon: pilon
- **Overig**: "Overig" — icoon: oog
- **Datum-label**: "Wanneer was dit?"
- **Voorgevulde datum**: "Vandaag, [dag] [datum]"

---

### Beoordelingsvragen per leeftijdsgroep

#### Blauw (5-7 jaar) — 6 vragen

De focus bij Blauw ligt op plezier (70%) en motorische ontwikkeling (25%). De vragen zijn bewust eenvoudig en observatiegericht.

**Plezier (3 vragen):**
1. "Had [voornaam] plezier op het veld?"
2. "Speelde [voornaam] samen met anderen?"
3. "Was [voornaam] enthousiast tijdens het spel?"

**Ontwikkeling (2 vragen):**
4. "Hoe beweegt [voornaam] zich op het veld?" _(motoriek)_
5. "Luistert [voornaam] naar aanwijzingen?" _(coachbaarheid)_

**Prestatie (1 vraag):**
6. "Doet [voornaam] mee met het spel?" _(betrokkenheid)_

#### Groen (8-9 jaar) — 10 vragen

Bij Groen verschuift de focus naar techniek en samenspel, met plezier nog steeds hoog.

**Plezier (4 vragen):**
1. "Had [voornaam] plezier vandaag?"
2. "Hoe ging [voornaam] om met tegenslagen?" _(veerkracht)_
3. "Speelde [voornaam] goed samen met teamgenoten?"
4. "Was [voornaam] positief naar anderen?" _(sociale rol)_

**Ontwikkeling (4 vragen):**
5. "Hoe is de balbehandeling van [voornaam]?" _(techniek)_
6. "Zoekt [voornaam] goede posities op het veld?" _(inzicht)_
7. "Probeert [voornaam] nieuwe dingen uit?" _(lef)_
8. "Hoe snel leert [voornaam] bij?" _(leervermogen)_

**Prestatie (2 vragen):**
9. "Hoe presteerde [voornaam] in vergelijking met het team?"
10. "Droeg [voornaam] bij aan het teamresultaat?"

---

### Opmerking-suggestie chips (10 suggesties)

1. Enthousiast
2. Goede sfeermaker
3. Stil vandaag
4. Verbeterd
5. Wil meer uitdaging
6. Sterk aan de bal
7. Goede samenwerking
8. Moeite met concentratie
9. Uitblinker vandaag
10. Leiderschapskwaliteiten

---

### Indienen-knop tekst

- Individueel, eerste keer: "Rapport indienen"
- Individueel, herhaald: "Rapport indienen"
- Team, alles ingevuld: "Alles indienen (10 rapporten)"
- Team, deels ingevuld: "Indienen (7 van 10 rapporten)"
- Tijdens laden: "Even geduld..."

---

### Celebration-teksten (5 varianten)

Na het indienen van een rapport, wisselend per keer:

1. "Netjes! Weer een scouting erbij."
2. "Top! [Speler] is weer in beeld."
3. "Goed gezien! Jouw observatie telt."
4. "Lekker bezig! De TC dankt je."
5. "Sterk! Weer een kaart in de collectie."

---

### Badge-namen en beschrijvingen (10 badges)

| Badge | Icoon | Voorwaarde | Beschrijving |
|---|---|---|---|
| **Eerste Stap** | Voetafdruk | 1e rapport indienen | "Je bent begonnen! Elke scout start hier." |
| **Vaste Klant** | Klok | 10 rapporten ingediend | "Je bent er regelmatig. Dat maakt het verschil." |
| **Teamspeler** | Groep-icoon | 3 complete team-scoutings | "Je scoort hele teams. Onmisbaar voor de TC." |
| **Goudzoeker** | Verrekijker + goud | 1e gouden kaart ontgrendeld | "Je hebt een uitzonderlijk talent ontdekt." |
| **Allrounder** | Drie-cirkel-icoon | Scout spelers in 3+ leeftijdsgroepen | "Je kijkt breed. Van Blauw tot Rood." |
| **Trouwe Scout** | Kalender | 4 weken achter elkaar gescout | "Elke week langs het veld. Chapeau." |
| **Scherp Oog** | Oog | 5x dezelfde speler gescout | "Jij volgt een speler op de voet." |
| **Datamaster** | Grafiek | 50 rapporten ingediend | "Een halve eeuw aan observaties. Indrukwekkend." |
| **Ontdekker** | Kompas | 20 unieke spelers gescout | "Je kent de halve jeugdafdeling." |
| **Legende** | Ster | Level 7 bereikt | "De ultieme scout. OW is je dankbaar." |

---

### Level-namen (7 levels)

| Level | Naam | XP-drempel | Beschrijving |
|---|---|---|---|
| 1 | **Starter** | 0 XP | "Net begonnen. Welkom!" |
| 2 | **Beginner** | 50 XP | "Je weet hoe het werkt." |
| 3 | **Verkenner** | 150 XP | "Je hebt al flink wat gezien." |
| 4 | **Kenner** | 300 XP | "De TC kent je naam." |
| 5 | **Expert** | 500 XP | "Je scoutings zijn goud waard." |
| 6 | **Meester** | 800 XP | "Weinigen bereiken dit niveau." |
| 7 | **Legende** | 1200 XP | "De ultieme OW Scout." |

**XP-verdeling:**
- Individueel rapport indienen: +25 XP
- Team-scouting compleet (alle spelers): +25 XP per speler + 50 XP bonus
- Gouden kaart ontgrendeld: +100 XP bonus
- Badge ontgrendeld: +25 XP

---

### Lege states

- **Geen rapporten (home)**: "Nog geen rapporten ingediend. Scout je eerste speler en ontdek je eerste kaart!"
- **Geen kaarten (collectie)**: "Je collectie is nog leeg. Dien een rapport in om je eerste spelerskaart te ontvangen."
- **Zoekresultaat leeg**: "Geen spelers gevonden voor '[zoekterm]'. Controleer de naam of probeer een team."
- **Geen recente activiteit**: "Geen recente activiteit. Ga langs het veld en scout!"
- **Team zonder data**: "Dit team heeft nog geen scouting-data. Jij kunt de eerste zijn!"

---

### Error states

- **Algemene fout**: "Oeps, er ging iets mis. Probeer het opnieuw."
- **Geen verbinding**: "Geen internetverbinding. Je rapport wordt bewaard en verstuurd zodra je weer online bent."
- **Rapport opslaan mislukt**: "Het rapport kon niet worden opgeslagen. Je gegevens zijn veilig bewaard op je telefoon."
- **Speler niet gevonden**: "Deze speler kon niet worden geladen. Probeer het later opnieuw."
- **Sessie verlopen**: "Je sessie is verlopen. Log opnieuw in om verder te gaan."

---

### Offline-indicator tekst

- **Banner bovenaan (persistent)**: "Offline — je rapporten worden lokaal bewaard"
- **Bij indienen in offline-modus**: "Opgeslagen op je telefoon. Wordt automatisch verstuurd bij verbinding."
- **Bij terugkeer online**: "Je bent weer online. 2 rapporten worden nu verstuurd..."
- **Na sync**: "Alles is bijgewerkt!"

---

### Toast-meldingen (5 varianten)

1. **Rapport opgeslagen**: "Rapport ingediend! +25 XP" _(groen, 3 sec, onderaan)_
2. **Badge ontgrendeld**: "Badge ontgrendeld: [badge-naam]! +25 XP" _(goud, 4 sec, bovenaan)_
3. **Level up**: "Level up! Je bent nu [level-naam]" _(goud, 5 sec, bovenaan)_
4. **Kaart upgrade**: "[Speler] is nu [zilver/goud]!" _(goud, 4 sec, bovenaan)_
5. **Offline sync**: "2 rapporten succesvol verstuurd" _(blauw, 3 sec, onderaan)_

---

## Deel 4: User Testing Plan

---

### Doel

Valideer of het OW Scout prototype intuïtief, motiverend en bruikbaar is voor trainers, TC-leden en betrokken ouders van c.k.v. Oranje Wit. Test zowel de basis-flow (individueel scouten) als de geavanceerde flows (team scouten, kaarten bekijken).

---

### Deelnemers

**Profiel 1: Trainer — "Hans"**
- Leeftijd: 40-55 jaar
- Relatie met OW: traint een jeugdteam (Geel of Oranje)
- Tech-niveau: basis (WhatsApp, Sportlink, verder weinig apps)
- Motivatie: wil bijdragen aan de club, maar heeft weinig tijd
- Toestel: Android mid-range (Samsung Galaxy A-serie of vergelijkbaar)
- Werving: via de trainersgroep op WhatsApp

**Profiel 2: TC-lid — "Marieke"**
- Leeftijd: 35-50 jaar
- Relatie met OW: coördineert meerdere teams, zit in de TC
- Tech-niveau: gemiddeld tot hoog (gebruikt Excel, apps, is analytisch ingesteld)
- Motivatie: wil data om betere beslissingen te nemen
- Toestel: iPhone (recent model)
- Werving: via de TC-vergadering

**Profiel 3: Betrokken ouder — "Linda"**
- Leeftijd: 35-50 jaar
- Relatie met OW: kind speelt bij OW, helpt regelmatig als vrijwilliger
- Tech-niveau: gemiddeld (gebruikt veel apps, maar niet tech-savvy)
- Motivatie: enthousiast over de club, kent vooral de spelers van het team van haar kind
- Toestel: iPhone of Android
- Werving: via de ouder-WhatsApp-groep van een team

**Aantal deelnemers**: 4-5 (minimaal 1 per profiel, bij voorkeur 2 trainers)

---

### Testopzet

- **Locatie**: kantine van OW of via videocall (Teams/Zoom) met scherm delen
- **Duur**: 45-60 minuten per deelnemer
- **Prototype**: klikbaar Figma-prototype op het eigen toestel van de deelnemer
- **Opname**: schermopname + audio (met toestemming)
- **Moderator**: 1 persoon stelt vragen en observeert
- **Notulist**: 1 persoon noteert observaties, quotes en tijden

---

### Testscenario's

#### Scenario 1: Eerste keer openen en onboarding

**Taak**: "Je hebt een link gekregen naar OW Scout. Open de app en maak jezelf klaar om te beginnen."

**Succescriteria**:
- Deelnemer doorloopt de 3 onboarding-slides zonder hulp
- Deelnemer begrijpt het concept (drie pijlers, kaarten)
- Deelnemer komt op het home screen en herkent de hoofdactie

**Observatiepunten**:
- Leest de deelnemer de onboarding-tekst of skipt deze?
- Begrijpt de deelnemer de drie pijlers (Plezier, Ontwikkeling, Prestatie)?
- Vindt de deelnemer de "Scout een speler"-knop intuïtief?
- Hoe lang duurt het van openen tot home screen?

**Vragen achteraf**:
- "Wat verwacht je dat je met deze app kunt doen?"
- "Was er iets onduidelijk in de uitleg?"

---

#### Scenario 2: Individueel scouten

**Taak**: "Je staat langs het veld en wilt een rapport indienen voor [spelersnaam]. Zoek deze speler op en vul een scouting-rapport in."

**Succescriteria**:
- Deelnemer vindt de speler via de zoekfunctie binnen 15 seconden
- Deelnemer kiest de juiste context (wedstrijd)
- Deelnemer vult alle drie de pijlers in
- Deelnemer dient het rapport in
- Totale doorlooptijd: onder de 3 minuten

**Observatiepunten**:
- Hoe zoekt de deelnemer? (typen vs. browsen)
- Begrijpt de deelnemer de smiley-schaal zonder uitleg?
- Gebruikt de deelnemer de suggestie-chips?
- Typt de deelnemer een opmerking of slaat die over?
- Hoe reageert de deelnemer op de kaart-reveal?
- Verwacht de deelnemer het XP-systeem?

**Vragen achteraf**:
- "Hoe vond je het om het rapport in te vullen?"
- "Waren de vragen duidelijk?"
- "Wat vond je van de kaart die je kreeg?"

---

#### Scenario 3: Team scouten

**Taak**: "Je bent bij een wedstrijd van [teamnaam] en wilt het hele team scouten. Gebruik de team-scouting-functie."

**Succescriteria**:
- Deelnemer vindt de team-scouting-functie zonder hulp
- Deelnemer begrijpt de pijler-per-pijler werkwijze
- Deelnemer beoordeelt minimaal 5 spelers per pijler
- Deelnemer dient de rapporten in
- Totale doorlooptijd: onder de 8 minuten voor 10 spelers

**Observatiepunten**:
- Vindt de deelnemer de "Scout een team"-knop op het home screen?
- Begrijpt de deelnemer dat alle spelers per pijler worden beoordeeld?
- Raakt de deelnemer niet verdwaald bij 30 beoordelingen?
- Hoe reageert de deelnemer op de multi-kaart reveal?
- Voelt de deelnemer zich overweldigd of juist gemotiveerd?

**Vragen achteraf**:
- "Hoe vond je het om een heel team te scouten?"
- "Was het teveel of ging het lekker?"
- "Zou je dit langs het veld doen tijdens een wedstrijd?"

---

#### Scenario 4: Kaarten collectie bekijken

**Taak**: "Je hebt al een paar rapporten ingevuld. Bekijk je kaartencollectie en zoek de speler met de hoogste score."

**Succescriteria**:
- Deelnemer navigeert naar de kaarten-tab
- Deelnemer herkent de brons/zilver/goud-hiërarchie
- Deelnemer vindt de speler met de hoogste POP-score
- Deelnemer kan filteren of sorteren

**Observatiepunten**:
- Vindt de deelnemer de kaarten-tab intuïtief?
- Begrijpt de deelnemer de kaart-niveaus (brons/zilver/goud)?
- Probeert de deelnemer te filteren of sorteren?
- Bekijkt de deelnemer individuele kaarten in detail?
- Hoeveel tijd besteedt de deelnemer aan het browsen?

**Vragen achteraf**:
- "Wat vind je van de spelerskaarten?"
- "Is het duidelijk wat brons, zilver en goud betekenen?"
- "Zou je hier regelmatig in kijken?"

---

#### Scenario 5: Offline scenario

**Taak**: "Je staat langs het veld maar hebt geen bereik. Vul een rapport in en kijk wat er gebeurt."

**Succescriteria**:
- Deelnemer ziet de offline-indicator
- Deelnemer begrijpt dat het rapport lokaal wordt bewaard
- Deelnemer voelt zich niet onzeker over dataverlies
- Deelnemer begrijpt wat er gebeurt als de verbinding terugkomt

**Observatiepunten**:
- Merkt de deelnemer de offline-indicator op?
- Leest de deelnemer de offline-melding bij indienen?
- Maakt de deelnemer zich zorgen over dataverlies?
- Begrijpt de deelnemer de sync-melding bij terugkeer online?

**Vragen achteraf**:
- "Voelde je je comfortabel met het invullen zonder internet?"
- "Vertrouw je erop dat je rapport later wordt verstuurd?"
- "Hoe belangrijk is offline-functionaliteit voor jou?"

---

### Meetpunten

#### Kwantitatief

| Meetpunt | Methode | Doel |
|---|---|---|
| **Time-on-task** | Stopwatch per scenario | Scenario 1: <2 min, Scenario 2: <3 min, Scenario 3: <8 min, Scenario 4: <2 min, Scenario 5: <3 min |
| **Foutfrequentie** | Tellen van verkeerde tikken, back-navigaties, verwarring-momenten | <2 fouten per scenario |
| **Taak-succespercentage** | Binair per scenario: gelukt of niet | >80% eerste poging succes |
| **System Usability Scale (SUS)** | 10 standaard SUS-vragen na alle scenario's | Score >75 (goed), streef naar >80 (excellent) |
| **Net Promoter Score (NPS)** | "Hoe waarschijnlijk beveel je OW Scout aan?" (0-10) | Score >30 (goed), streef naar >50 |

#### Kwalitatief

| Observatie | Wat we zoeken |
|---|---|
| **Emotionele reacties** | Glimlach, frustratie, verrassing bij kaart-reveal |
| **Think-aloud quotes** | Spontane uitspraken tijdens het gebruik |
| **Navigatiepaden** | Waar tikt de deelnemer als eerste? Waar raakt die verdwaald? |
| **Motivatie-indicatoren** | Wil de deelnemer doorgaan? Vraagt die naar meer features? |
| **Weerstand** | "Dit is te veel gedoe", "Ik snap niet wat ik moet doen" |

---

### Interview-vragen (10 stuks)

Na afloop van alle scenario's, open gesprek (15-20 minuten):

1. **"Wat is je eerste indruk van OW Scout?"**
   _Doel: algemeen sentiment peilen, ongebiased eerste reactie._

2. **"Als je denkt aan afgelopen zaterdag langs het veld — zou je dit hebben gebruikt? Waarom wel of niet?"**
   _Doel: realisme toetsen, aansluiting bij de werkelijke situatie._

3. **"Wat vond je van de drie pijlers (plezier, ontwikkeling, prestatie)? Miste je iets?"**
   _Doel: valideren of de Oranje Draad-structuur logisch voelt voor scouts._

4. **"Hoe voelde het om met smileys te beoordelen in plaats van cijfers?"**
   _Doel: valideren of de beoordelingsmethode laagdrempelig genoeg is._

5. **"Wat vond je van de spelerskaarten en het XP-systeem? Is dat motiverend of juist kinderachtig?"**
   _Doel: gamification-acceptatie peilen per profiel (trainer vs. ouder vs. TC-lid)._

6. **"Hoe vaak denk je dat je OW Scout zou gebruiken? Elke wedstrijd? Af en toe?"**
   _Doel: verwachte gebruiksfrequentie inschatten._

7. **"Stel je voor dat de TC jou vraagt om elke week twee spelers te scouten. Zou dat haalbaar zijn?"**
   _Doel: belasting inschatten, bereidheid tot structureel gebruik._

8. **"Was er een moment waarop je vastliep of iets niet begreep?"**
   _Doel: usability-problemen boven water krijgen die niet spontaan gemeld werden._

9. **"Wat zou jij als eerste veranderen aan de app?"**
   _Doel: prioriteiten van de gebruiker begrijpen._

10. **"Als je OW Scout in drie woorden zou moeten beschrijven, welke woorden kies je dan?"**
    _Doel: compact sentiment vastleggen, bruikbaar voor positionering._

---

### Planning en follow-up

**Week 1: Voorbereiding**
- Figma-prototype afronden met alle scenario's
- Deelnemers werven (2 trainers, 1 TC-lid, 1-2 ouders)
- Testscript finaliseren en doorlopen met moderator

**Week 2: Testsessies**
- 4-5 individuele sessies van 45-60 minuten
- Bij voorkeur op locatie (kantine OW) met eigen telefoon
- Schermopname + audio opnemen

**Week 3: Analyse en rapportage**
- Alle sessies terugkijken en coderen
- SUS en NPS berekenen
- Top-5 usability-issues identificeren
- Top-3 positieve reacties vastleggen
- Aanbevelingen formuleren voor iteratie

**Deliverables:**
- Testrapport met bevindingen per scenario
- Video-highlights (2-3 minuten) van key-moments
- Geprioriteerde lijst met verbeterpunten
- Go/no-go advies voor ontwikkeling

---

### Risico's en mitigatie

| Risico | Mitigatie |
|---|---|
| Deelnemers kennen de spelers in het prototype niet | Gebruik echte spelernamen uit de database van OW |
| Prototype te beperkt voor team-scouting flow | Bouw minimaal de happy path volledig uit in Figma |
| Trainers vinden gamification kinderachtig | Observeer reactie en vraag expliciet door; overweeg "zakelijke modus" als dit breed speelt |
| Te weinig deelnemers beschikbaar | Plan 6 sessies in, reken op 1-2 uitvallers |
| Deelnemers gaan vergelijken met Sportlink | Benadruk dat OW Scout een aanvulling is, geen vervanging |
