---
paths:
  - "apps/**/actions/**"
  - "apps/**/*action*.ts"
  - "apps/**/*actions*.ts"
---

# Server Action Rules

- Return type altijd ActionResult<T> uit @oranje-wit/types
- { ok: true, data: T } of { ok: false, error: string }
- Gebruik requireTC() (throwt) — niet guardTC() (returnt Result)
- Nooit console.log — gebruik logger
