# Portaal — ckvoranjewit.app

> **Status**: Actief (root van de geconsolideerde app)
> **Doel**: Centraal inlogpunt en app-launcher voor alle c.k.v. Oranje Wit domeinen

---

## Concept

Elke gebruiker logt in via `ckvoranjewit.app` en navigeert vervolgens naar het juiste onderdeel — zoals Google's app-launcher met iconen per domein.

```
ckvoranjewit.app (root)
├── /login          → Google OAuth (centraal)
├── /               → App-launcher met iconen per beschikbaar domein
└── Autorisatie     → Beheer → Systeem → Gebruikers bepaalt zichtbaarheid
```

---

## Domein-tegels

De tegels die een gebruiker ziet zijn afhankelijk van zijn rol:

| Tegel | Route | Beschrijving |
|---|---|---|
| Monitor | /monitor | Dashboards, signalering, ledenverloop |
| Team-Indeling | /teamindeling | Seizoensindeling, scenario's, blauwdruk |
| Evaluatie | /evaluatie | Spelerevaluaties en zelfevaluaties |
| Scouting | /scouting | Spelers scouten, rapporten, spelerskaart |
| Beheer | /beheer | TC-beheerpaneel (9 domeinen) |

### Wie ziet wat

| Rol | Monitor | Team-Indeling | Evaluatie | Scouting | Beheer |
|---|---|---|---|---|---|
| EDITOR (TC-lid) | v | v (bewerken) | v (beheren) | v (TC) | v |
| REVIEWER (trainer) | v | v (bekijken) | v (invullen) | v (scout) | - |
| VIEWER (bestuur) | v | v (bekijken) | - | - | - |
| SCOUT | - | - | - | v (scout) | - |

---

## Technisch

- Root route (`/`) van `apps/web/` — de geconsolideerde Next.js app
- Deelt `@oranje-wit/auth` (NextAuth v5, zelfde sessie voor alle routes)
- Geen subdomeinen, geen cross-subdomein cookies nodig
- Beheer → Systeem → Gebruikers bepaalt welke tegels iemand ziet
- Toekomstige domeinen krijgen automatisch een tegel wanneer ze worden toegevoegd

---

## Verhouding tot Beheer

Het portaal is de **voordeur** van het digitale ecosysteem. Beheer is het **bureau van de TC** — een van de domeinen achter die voordeur. Het portaal is voor iedereen; beheer is exclusief TC.
