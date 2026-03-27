# Portaal — ckvoranjewit.app

> **Status**: Visie (nog niet gebouwd)
> **Doel**: Centraal inlogpunt en app-launcher voor alle c.k.v. Oranje Wit apps

---

## Concept

Elke gebruiker logt in via `ckvoranjewit.app` en navigeert vervolgens naar het juiste onderdeel — zoals Google's app-launcher met iconen per app.

```
ckvoranjewit.app (portaal)
├── /login          → Google OAuth (centraal, deelt sessie met alle apps)
├── /               → App-launcher met iconen per beschikbare app
└── Autorisatie     → Beheer → Systeem → Gebruikers bepaalt zichtbaarheid
```

---

## App-tegels

De tegels die een gebruiker ziet zijn afhankelijk van zijn rol:

| Tegel | URL | Beschrijving |
|---|---|---|
| 📊 Monitor | monitor.ckvoranjewit.app | Dashboards, signalering, ledenverloop |
| 👥 Team-Indeling | teamindeling.ckvoranjewit.app | Seizoensindeling, scenario's, blauwdruk |
| 📝 Evaluatie | evaluatie.ckvoranjewit.app | Spelerevaluaties en zelfevaluaties |
| 🔍 Scouting | scouting.ckvoranjewit.app | Spelers scouten, rapporten, spelerskaart |
| ⚙️ Beheer | beheer.ckvoranjewit.app | TC-beheerpaneel (9 domeinen) |

### Wie ziet wat

| Rol | Monitor | Team-Indeling | Evaluatie | Scouting | Beheer |
|---|---|---|---|---|---|
| EDITOR (TC-lid) | ✓ | ✓ (bewerken) | ✓ (beheren) | ✓ (TC) | ✓ |
| REVIEWER (trainer) | ✓ | ✓ (bekijken) | ✓ (invullen) | ✓ (scout) | - |
| VIEWER (bestuur) | ✓ | ✓ (bekijken) | - | - | - |
| SCOUT | - | - | - | ✓ (scout) | - |

---

## Technisch

- Nieuwe app: `apps/portaal/` (simpel: login + tegel-grid + redirect)
- Deelt `@oranje-wit/auth` (zelfde NextAuth, zelfde sessie)
- Cross-subdomein sessie via shared cookie domain `.ckvoranjewit.app`
- Beheer → Systeem → Gebruikers bepaalt welke tegels iemand ziet
- Toekomstige apps krijgen automatisch een tegel wanneer ze worden toegevoegd

---

## Verhouding tot Beheer

Het portaal is de **voordeur** van het digitale ecosysteem. Beheer is het **bureau van de TC** — een van de apps achter die voordeur. Het portaal is voor iedereen; beheer is exclusief TC.
