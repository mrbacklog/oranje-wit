# Setup nieuwe machine — Claude Code gebruikersinstellingen

Plak dit bericht in Claude Code op de nieuwe machine:

---

Stel mijn Claude Code gebruikersinstellingen in door het bestand `C:\Users\Antjan\.claude\settings.json` aan te maken. Maak de map aan als die nog niet bestaat.

Gebruik deze inhoud:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "RAILWAY_API_TOKEN": "89acc3ac-df58-4622-89ff-6dca3fca6af2"
  },
  "permissions": {
    "allow": [
      "Bash",
      "Read",
      "Write",
      "Edit",
      "Grep",
      "Glob",
      "Monitor",
      "Skill",
      "WebSearch",
      "WebFetch",
      "mcp__plugin_playwright_playwright",
      "Bash(git *)",
      "Bash(npm run *)",
      "Bash(npm install *)",
      "Bash(npx *)",
      "Bash(bun run *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(rm -fr *)",
      "Bash(rm -rf /*)",
      "Bash(git push --force*)",
      "Bash(git push -f *)",
      "Bash(git reset --hard*)",
      "Bash(git clean -f*)",
      "Bash(git clean -fd*)",
      "Bash(git branch -D *)",
      "Bash(npm publish*)",
      "Bash(bun publish*)",
      "Bash(sudo *)",
      "Write(**/.env)",
      "Write(**/.env.*)",
      "Edit(**/.env)",
      "Edit(**/.env.*)"
    ]
  },
  "model": "opusplan",
  "enabledPlugins": {
    "frontend-design@claude-plugins-official": true,
    "code-review@claude-plugins-official": true,
    "github@claude-plugins-official": true,
    "feature-dev@claude-plugins-official": true,
    "typescript-lsp@claude-plugins-official": true,
    "playwright@claude-plugins-official": true,
    "superpowers@claude-plugins-official": true,
    "figma@claude-plugins-official": true,
    "code-simplifier@claude-plugins-official": true,
    "skill-creator@claude-plugins-official": true,
    "pr-review-toolkit@claude-plugins-official": true,
    "context7@claude-plugins-official": true,
    "claude-code-setup@claude-plugins-official": true,
    "plugin-dev@claude-plugins-official": true,
    "playground@claude-plugins-official": true,
    "ralph-loop@claude-plugins-official": true
  },
  "language": "Nederlands",
  "effortLevel": "low",
  "theme": "light",
  "switchModelsOnFlag": true
}
```
