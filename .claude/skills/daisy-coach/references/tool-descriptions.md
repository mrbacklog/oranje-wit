# Tool-descriptions voor Daisy

De `description` van een tool bepaalt wanneer de LLM hem kiest. Als de keuze
fout gaat, is het bijna altijd de description — niet de execute-functie.

## De vier zinnen van een goede description

1. **Intentie** — wat levert de tool op (niet: hoe)
2. **Wanneer wel** — bij welk type vraag moet Daisy dit kiezen
3. **Wanneer niet** — welke alternatief-tool past beter in een grensgeval
4. **Vorm van de output** — alleen vermelden als het de keuze beïnvloedt

### Voorbeeld: `spelersZoeken`

Zwakke description (hoe, geen context):
```
Zoekt spelers op uit de database op basis van filters.
```

Sterke description:
```
Zoek spelers in de werkindeling met filters (status, team, leeftijd, USS,
kleurgroep). Gebruik dit als iemand vraagt "wie zijn beschikbaar", "welke
spelers in Geel" of "wie heeft USS boven 60". Voor wie er daadwerkelijk
speelt in een competitieteam: gebruik `teamSamenstelling`. Retourneert naam,
leeftijd, status, huidig team en USS per speler.
```

De LLM kan nu beslissen zonder naar de execute-functie te kijken.

## `.describe()` per veld

Ieder veld in het `z.object` krijgt een `.describe()`. Regels:

- Begin met wat het veld IS, niet met het type
- Geef een voorbeeld als het veld een specifiek formaat heeft
- Benoem de default als je geen `.optional()` gebruikt of als de default
  niet-triviaal is
- Gebruik de term die jullie in de UI gebruiken — niet de interne kolomnaam

Goed:
```ts
leeftijdVolgendSeizoen: z
  .number()
  .optional()
  .describe("Korfballeeftijd volgend seizoen, peiljaar 2027. Bijvoorbeeld: 15 = speler wordt 15 in het nieuwe seizoen."),
```

Slecht:
```ts
leeftijdVolgendSeizoen: z.number().optional().describe("leeftijd"),
```

## Wanneer je een tool NIET moet laten beschrijven voor Daisy

- De tool is een interne helper die alleen door een andere tool wordt
  aangeroepen — die moet NIET in de Daisy-tool-set
- De tool werkt alleen met interne ID's en levert geen bruikbaar antwoord
  zonder tweede tool-call — combineer ze of hernoem
- De tool is niet safe om in een LLM-flow te draaien (bv. destructive zonder
  confirm) — die hoort hoe dan ook niet bij Daisy

## Overlap vermijden

Twee tools met een overlappende description is de grootste oorzaak van de
"verkeerde tool gekozen" bug. Concreet voorbeeld uit de audit van
2026-04-14:

- `competitieTeamZoeken` — zoek wie speelt in S1, S2, U17 volgens Sportlink
- `teamSamenstelling` — bezetting van een team in de werkindeling

Beide kunnen als antwoord op "wie zit er in S1?". Oplossing: óf één schrappen
(is gebeurd — `competitieTeamZoeken` is weg), óf in de description van beide
een harde grens trekken ("gebruik NOOIT voor <X>").

## Param-validatie is een prompt-instrument

Als een veld maar drie geldige waarden heeft, gebruik `z.enum([...])`. De LLM
ziet die waarden in de schema-beschrijving en raadt er niet omheen. Dat
voorkomt de vraag "welke statussen bestaan" in de prompt.

## Return-shape alleen benoemen als het uitmaakt

Je hoeft niet te beschrijven dat iets een object met velden is. Dat is
default. Benoem het wél als de vorm de keuze tussen twee tools beïnvloedt of
als het afwijkt van wat de LLM zou verwachten.

## Checklist bij een nieuwe of gewijzigde description

- [ ] Eerste zin is intentie, niet implementatie
- [ ] Een grens met minstens één verwante tool is expliciet
- [ ] Elk veld heeft `.describe()` met voorbeeld indien format-specifiek
- [ ] Enums gebruikt waar de waardenruimte klein is
- [ ] Default-gedrag benoemd bij optionele velden met niet-triviale default
- [ ] In een lokale test met reproductie-vraag pakt de LLM de bedoelde tool
