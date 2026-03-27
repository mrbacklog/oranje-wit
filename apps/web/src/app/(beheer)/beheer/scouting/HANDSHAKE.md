# Scouting-domein -- HANDSHAKE

> Contract tussen Scouting-domein (beheer-app) en de scouting-app.

---

## 1. Server Actions

### `/scouting/scouts/actions.ts`

| Functie | Parameters | Return | Beschrijving |
|---|---|---|---|
| `getScouts()` | - | `ScoutRow[]` | Alle scouts met XP, level, rol, counts |

---

## 2. Data-bronnen

Dit domein leest bestaande scouting-tabellen:

| Tabel | Gebruik |
|---|---|
| `Scout` (`scouts`) | Scout-accounts met XP, level, rol |
| `ScoutingRapport` (`scouting_rapporten`) | Count rapporten per scout |
| `ScoutBadge` (`scout_badges`) | Count badges per scout |
| `ScoutToewijzing` (`scout_toewijzingen`) | Count toewijzingen per scout |

---

## 3. Pagina's

| Route | Functie | Data |
|---|---|---|
| `/scouting/scouts` | Scout-overzicht | Tabel: naam, email, rol-badge, level, XP, rapporten, badges |

---

## 4. ScoutRow type

```ts
interface ScoutRow {
  id: string;
  naam: string;
  email: string;
  xp: number;
  level: number;
  rol: "SCOUT" | "TC";
  vrijScouten: boolean;
  aantalRapporten: number;
  aantalBadges: number;
  aantalToewijzingen: number;
  createdAt: Date;
}
```

---

## 5. Synergie

| Wie leest/schrijft | Wat | Waarvoor |
|---|---|---|
| Scouting-app | `Scout` | Login, profiel, rapporten indienen |
| Beheer (dit domein) | `Scout` (read-only) | Overzicht scout-accounts |
| Systeem (gebruikers) | `Gebruiker.scoutRol` | Scout-rol toekennen via gebruikersbeheer |

---

## 6. Toekomstige uitbreidingen

- Scout aanmaken/deactiveren via beheer
- XP reset
- Rol wijzigen (SCOUT <-> TC)
- Badge-overzicht per scout
