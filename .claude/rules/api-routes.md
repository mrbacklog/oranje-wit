---
paths:
  - "apps/web/app/api/**"
  - "apps/ti-studio/app/api/**"
---

# API Route Rules

- Gebruik ok()/fail()/parseBody() uit @/lib/api
- Altijd guardTC() als eerste check
- Body parsen met Zod schema
- Try/catch met fail(error)
- Nooit console.log — gebruik logger uit @oranje-wit/types
