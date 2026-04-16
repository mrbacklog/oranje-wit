---
paths:
  - "apps/ti-studio/**"
---

# TI Studio Rules

- Team-Indeling code hoort UITSLUITEND in apps/ti-studio — nooit in apps/web terugplaatsen
- apps/web/proxy.ts redirect /ti-studio/* met 308 — niet opnieuw toevoegen aan apps/web
- Gedeelde packages: @oranje-wit/database, @oranje-wit/auth, @oranje-wit/types, @oranje-wit/ui
- Scenario's en what-if horen in apps/ti-studio
