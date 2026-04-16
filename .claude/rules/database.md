---
paths:
  - "packages/database/**"
  - "**/*.prisma"
---

# Database Rules

- rel_code (Sportlink relatienummer) is de ENIGE stabiele identifier — NOOIT naam-matching
- NOOIT pnpm db:push — dropt VIEW speler_seizoenen
- Gebruik pnpm db:migrate voor schema-wijzigingen
- VIEW speler_seizoenen is kritiek — controleer na elke migratie met pnpm db:ensure-views
- Schema in packages/database/prisma/schema.prisma is de enige source of truth
