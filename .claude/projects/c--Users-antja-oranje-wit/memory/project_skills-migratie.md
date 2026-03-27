---
name: Skills migratie naar .claude/skills
description: 23 skills gekopieerd van skills/ naar .claude/skills/ zodat ze als slash commands werken
type: project
---

Op 2026-03-25 alle 23 skills gekopieerd van `skills/{monitor,shared,team-indeling}/*/SKILL.md` naar `.claude/skills/*/SKILL.md` (flat, zonder domein-prefix).

**Why:** Claude Code ontdekt alleen skills in `.claude/skills/`, niet in de custom `skills/` directory. De originele bestanden in `skills/` blijven bestaan als bron; `.claude/skills/` bevat kopieën.

**How to apply:** Bij het toevoegen van nieuwe skills: plaats ze in `.claude/skills/<naam>/SKILL.md`. Update eventueel ook `skills/<domein>/<naam>/SKILL.md` als bronbestand. Let op naamconflicten — de flat structuur heeft geen domein-prefix.
