# Roostering-domein -- HANDSHAKE

> Contract tussen Roostering-domein (beheer-app) en toekomstige roostering-module.

---

## 1. Server Actions

### `/roostering/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getTeamsVoorRoostering()` | - | `RoosterTeamRow[]` | Teams voor het huidige seizoen |

---

## 2. Huidige staat

Roostering is een **verbeterde placeholder**. Er zijn nog geen eigen database-modellen.
De pagina's tonen:
- Lijst van beschikbare teams (uit `OWTeam`)
- Beschrijving van wat er komt (trainingen, wedstrijden)

---

## 3. Pagina's

| Route | Functie | Staat |
|---|---|---|
| `/roostering/trainingen` | Trainingsplanning | Placeholder + teamlijst |
| `/roostering/wedstrijden` | Wedstrijdprogramma | Placeholder + teamlijst |

---

## 4. Toekomstige modellen

Wanneer dit domein volledig wordt uitgebouwd:

```prisma
model TrainingsSlot {
  id        String   @id @default(cuid())
  teamId    Int      // -> OWTeam.id
  seizoen   String
  dag       String   // "maandag" | "dinsdag" | etc.
  startTijd String   // "18:00"
  eindTijd  String   // "19:30"
  locatie   String   // "Veld 1" | "Zaal Sporthal"
}

model Wedstrijd {
  id        String   @id @default(cuid())
  teamId    Int      // -> OWTeam.id
  seizoen   String
  datum     DateTime
  tegenstander String
  thuis     Boolean
  locatie   String?
  resultaat String?  // "12-8"
}
```

---

## 5. Scheiding met Jaarplanning

| Jaarplanning (strategisch) | Roostering (operationeel) |
|---|---|
| Wanneer begint de competitie? | Welk team speelt waar om hoe laat? |
| Evaluatiemomenten plannen | Trainingsrooster per week |
| Seizoensmijlpalen | Wedstrijdschema |
