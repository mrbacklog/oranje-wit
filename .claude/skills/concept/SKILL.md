---
name: concept
description: Strategisch concept formuleren. Elk concept heeft een uitgangsprincipe dat de richting bepaalt.
user-invocable: false
allowed-tools: Read, Write, Glob
---

# Skill: Concept

## Doel
Een strategisch concept formuleren. Elk concept heeft een uitgangsprincipe dat de richting bepaalt voor de teamindeling.

## Wanneer gebruiken
- Na het bekijken van de kaders
- Wanneer de TC strategische richtingen wil verkennen
- Typisch 2-4 concepten per seizoen

## Inhoud van een concept

### Uitgangsprincipe (verplicht)
Vrije tekst die de strategische lens beschrijft. Voorbeelden:
- "Maximaal ontwikkeling: doorstroming en uitdaging voorop"
- "Stabiliteit en behoud: minimale verschuivingen, retentie centraal"
- "Krimp opvangen: realistisch plannen met minder spelers"

### Keuzes
Concrete beslissingen die uit het uitgangsprincipe volgen:
- Hoeveel teams per kleur/categorie?
- Welke spelers doorschuiven?
- Hoe omgaan met twijfelaars?

### Niet-gepinde aannames
Zaken die nog niet vast staan maar in dit concept als aanname gelden:
- Trainertoewijzingen (nog niet bevestigd)
- Verwachte uitstroom van twijfelaars
- Mogelijke nieuwe aanmeldingen

## Claude-ondersteuning
Claude kan suggesties doen voor concepten op basis van:
- Huidige ledendata en trends
- Retentiemodel en signalering
- Streefmodel afwijkingen
- Seizoensspeerpunten uit de kaders

## Scope Reductie modus

Gebruik wanneer een concept dreigt te groot te worden, of wanneer er meer dan 4 keuzes zijn.

**Triggerzinnen:** "wat kan eruit?", "dit is te veel", "maak het kleiner", "MLC"

### Aanpak

Stel voor elk element van het concept de volgende vraag:

> "Als dit element er **niet** in zit, levert het concept dan nog steeds 80% van de waarde?"

Doorloop elk onderdeel systematisch:

| Element | Vraag |
|---------|-------|
| Uitgangsprincipe | Is dit echt één principe, of zijn het er twee gecombineerd? |
| Elke keuze | Noodzakelijk voor de kern, of nice-to-have? |
| Teams | Kunnen teams worden samengevoegd zonder de strategie te schaden? |
| Aannames | Kunnen aannames worden uitgesteld totdat er meer duidelijkheid is? |

### Output: Minste Levensvatbaar Concept (MLC)

```
Scope Reductie Analyse voor: [concept naam]

Origineel: [X keuzes, Y aannames, Z teams]

Kan eruit (zonder meer dan 20% waardverlies):
- [element]: [reden waarom het kan]
- [element]: [reden waarom het kan]

Minste Levensvatbaar Concept (MLC):
- Uitgangsprincipe: [kern in één zin]
- Kritische keuzes (max 3): [lijst]
- Resterende aannames (max 2): [lijst]

Geschat waardebehoud: ~[X]% van het originele concept
```

### Wanneer gebruiken

- Wanneer het concept meer dan 4 keuzes heeft
- Wanneer de TC aangeeft dat het "te veel" is of "te lang duurt"
- Vóór het uitwerken naar scenario's — scope reductie bespaart veel scenario-werk
- Na een `/retro` waarbij scope creep als probleem naar voren kwam

*Opmerking: deze modus verandert niets aan de `user-invocable` status van de skill.*
