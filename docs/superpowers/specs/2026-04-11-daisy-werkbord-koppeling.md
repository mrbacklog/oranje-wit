# Daisy — Werkbord Koppeling (Fase 1: Echte Verbinding)

## Doel

Daisy werkt nu in TI-studio met een hardcoded "Hoi!" demo-panel. Dit spec beschrijft hoe we het echte `/api/ai/chat`-endpoint koppelen aan het DaisyPanel in de werkbord-context, zodat Daisy kan lezen en schrijven in de actieve versie die de TC op dat moment open heeft.

Fase 2 (animaties bij tool-calls) is expliciet buiten scope van dit spec.

---

## Context en aannames

- `DaisyPanel.tsx` zit in `WerkbordCanvas` → `TiStudioShell`
- `TiStudioShell` heeft `initieleState.versieId`, `initieleState.werkindelingId` en `initieleState.naam`
- `/api/ai/chat` streamt al via Vercel AI SDK `useChat` — zie `apps/web/src/components/daisy/chat-panel.tsx` voor het bestaande patroon
- De 17 TI-studio tools staan in `apps/web/src/lib/ai/plugins/ti-studio.ts`; ze roepen `getVersieId(inContext)` aan met "werkindeling" als default — we willen dat ze de actieve versieId gebruiken

---

## Architectuur

```
TiStudioShell
  └── WerkbordCanvas [+versieId, +werkindelingId, +werkindelingNaam]
        └── DaisyPanel [+versieId, +werkindelingId, +werkindelingNaam]
              └── useChat → TextStreamChatTransport
                    └── POST /api/ai/chat
                          body: { messages, gesprekId, versieId, werkindelingId }
                          → buildDaisyPrompt(session, { versieId, werkindelingId, werkindelingNaam })
                          → getDaisyTools({ ..., versieId })
                                → getVersieId("v:<versieId>") → direct return
```

---

## Bestandswijzigingen

### 1. `apps/web/src/lib/ai/plugins/ti-studio.ts`

**Wijziging:** `getVersieId` accepteert ook een directe versieId (prefix `"v:"`).

```typescript
async function getVersieId(inContext: string): Promise<string | null> {
  // Directe versieId doorgeven via prefix "v:"
  if (inContext.startsWith("v:")) {
    const id = inContext.slice(2);
    const versie = await prisma.versie.findUnique({
      where: { id },
      select: { id: true },
    });
    return versie?.id ?? null;
  }
  if (inContext === "werkindeling") {
    const blauwdruk = await getWerkBlauwdruk();
    if (!blauwdruk) return null;
    const wi = await prisma.werkindeling.findFirst({
      where: { kadersId: blauwdruk.id, verwijderdOp: null },
    });
    if (!wi) return null;
    const v = await getLaatsteVersie(wi.id);
    return v?.id ?? null;
  }
  const v = await getLaatsteVersie(inContext);
  return v?.id ?? null;
}
```

De `inContext`-beschrijving in elk tool-schema bijwerken (alle schrijf-tools + leestools):

```
"werkindeling" (standaard), werkindelingId, of "v:<versieId>" voor directe versie
```

Daisy vult `inContext` altijd zelf in via de tool-parameters. De system prompt zegt haar exact welke waarde ze moet gebruiken. Geen aanpassing nodig aan de functie-signaturen van `maakSchrijfToolsSpelers`/`maakSchrijfToolsRest`.

### 2. `apps/web/src/lib/ai/daisy.ts`

**Wijziging:** `buildDaisyPrompt` accepteert optionele werkbord-context.

```typescript
export interface WerkbordContext {
  versieId: string;
  werkindelingId: string;
  werkindelingNaam: string;
}

export function buildDaisyPrompt(
  session: AuthSession,
  werkbordContext?: WerkbordContext
): string {
  const user = session.user;
  const naam = user.name ?? user.email;

  const werkbordBlok = werkbordContext
    ? `\n## Actieve werkindeling\n- Naam: ${werkbordContext.werkindelingNaam}\n- Versie: v:${werkbordContext.versieId}\n- WerkindelingId: ${werkbordContext.werkindelingId}\nGebruik "v:${werkbordContext.versieId}" als inContext voor alle TI-studio tools, tenzij de gebruiker expliciet een andere context vraagt.\n`
    : "";

  return `Je bent Daisy...
  
${werkbordBlok}
## Gedragsregels
...`;
}
```

Volledige `buildDaisyPrompt` behoudt alle bestaande tekst; `werkbordBlok` wordt ingevoegd na het `## Context`-blok.

### 3. `apps/web/src/app/api/ai/chat/route.ts`

**Wijziging:** Body-type uitbreiden en context doorgeven.

```typescript
const body = (await request.json()) as {
  messages?: UIMessage[];
  gesprekId?: string;
  versieId?: string;
  werkindelingId?: string;
  werkindelingNaam?: string;
};

const { messages, gesprekId, versieId, werkindelingId, werkindelingNaam } = body;

// Bouw werkbordContext op als beide velden aanwezig zijn
const werkbordContext =
  versieId && werkindelingId
    ? { versieId, werkindelingId, werkindelingNaam: werkindelingNaam ?? "" }
    : undefined;

// In streamText (getDaisyTools ongewijzigd):
const tools = getDaisyTools({
  clearance: session.user.clearance,
  sessieId: gesprekId ?? gesprek.id,
  gebruikerEmail: session.user.email ?? "onbekend",
}) as unknown as ToolSet;

const result = streamText({
  model,
  system: buildDaisyPrompt(session, werkbordContext),
  messages: modelMessages,
  tools,
  ...
});
```

### 4. `apps/web/src/lib/ai/plugins/registry.ts`

Geen wijziging nodig. `getDaisyTools` en `DaisyContext` blijven ongewijzigd. De versieId zit in de system prompt — Daisy vult `inContext` zelf in bij elke tool-call.

### 5. `apps/web/src/components/ti-studio/werkbord/DaisyPanel.tsx`

**Volledige herschrijving.** Verwijder: hardcoded bericht, quick-prompts, statische textarea.
Behoud: de bestaande visuele layout (floating panel, CSS vars uit `tokens.css`).
Voeg toe: `useChat`-hook, streaming berichten, loading indicator, undo-knop na tool-call.

```typescript
"use client";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import "./tokens.css";

interface DaisyPanelProps {
  versieId: string;
  werkindelingId: string;
  werkindelingNaam: string;
}

export function DaisyPanel({ versieId, werkindelingId, werkindelingNaam }: DaisyPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useRef(
    new TextStreamChatTransport({
      api: "/api/ai/chat",
      body: { versieId, werkindelingId, werkindelingNaam },
    })
  );

  const { messages, sendMessage, status } = useChat({ transport: transport.current });
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage({ text: trimmed });
  };

  const handleOngedaan = () => {
    sendMessage({ text: "Maak de laatste actie ongedaan." });
  };

  // Header, berichten-lijst, input — behoud bestaande layout + CSS vars
  // Na elk assistent-bericht met tool-call: toon undo-knop
  // ...
}
```

Volledig berichtenscherm:
- Lege staat: "Hoi! Ik ben Daisy. Vraag me iets over de teams of spelers."
- Berichten: `role === "user"` rechts uitlijnen, `role === "assistant"` links met avatar
- Na assistent-bericht dat een tool aanriep: kleine "↩ Ongedaan maken" knop
- Loading: `…` bubbel terwijl streaming

Tool-call detectie: een assistent-bericht bevat een tool-call als `message.parts.some(p => p.type === "tool-invocation")`.

### 6. `apps/web/src/components/ti-studio/werkbord/WerkbordCanvas.tsx`

**Wijziging:** Props uitbreiden.

```typescript
interface WerkbordCanvasProps {
  // ...bestaande props...
  versieId: string;
  werkindelingId: string;
  werkindelingNaam: string;
}
```

`<DaisyPanel versieId={versieId} werkindelingId={werkindelingId} werkindelingNaam={werkindelingNaam} />`

### 7. `apps/web/src/components/ti-studio/werkbord/TiStudioShell.tsx`

**Wijziging:** Props doorgeven aan `WerkbordCanvas`.

```typescript
<WerkbordCanvas
  // ...bestaande props...
  versieId={versieId}
  werkindelingId={initieleState.werkindelingId}
  werkindelingNaam={initieleState.naam}
/>
```

---

## Dataflow bevestiging

```
Gebruiker typt vraag in DaisyPanel
  → useChat.sendMessage({ text })
  → TextStreamChatTransport POST /api/ai/chat
      body: { messages, gesprekId, versieId, werkindelingId, werkindelingNaam }
  → guardAuth ✓
  → buildDaisyPrompt(session, { versieId, werkindelingId, werkindelingNaam })
      system prompt bevat: "Actieve werkindeling: Veld Voorjaar 2026, Versie: v:abc123"
  → getDaisyTools({ ..., versieId: "abc123" })
      → getTiStudioTools(sessieId, email, "abc123")
          defaultContext = "v:abc123"
  → streamText → SSE → DaisyPanel toont gestreamde tekst

Daisy roept tool aan (bijv. spelerVerplaatsen):
  → inContext: "v:abc123" (uit system prompt of default)
  → getVersieId("v:abc123") → prisma.versie.findUnique → "abc123" ✓
  → mutatie in DB
  → SSE update werkbord (bestaand mechanisme)
  → DaisyPanel toont resultaat + undo-knop

Gebruiker klikt "Ongedaan maken":
  → sendMessage({ text: "Maak de laatste actie ongedaan." })
  → Daisy roept actieOngedaanMaken aan
```

---

## Bevestigingsflow

De bevestigingsregel staat al in de systeemprompt van `daisy.ts`:

> "Voor elke schrijf-actie geldt: 1. Kondig precies aan wat je gaat doen. 2. Wacht op bevestiging. 3. Voer pas daarna uit via de tool."

Geen extra code nodig.

---

## Niet in scope (Fase 2)

- Animaties bij tool-calls (bijv. highlight van kaart die beweegt)
- Streaming tool-call progress indicator
- Kanban-memo UI
- SSE-verbindingsindicator

---

## Tests

### Unit tests

- `getVersieId("v:<bestaand-uuid>")` → geeft uuid terug
- `getVersieId("v:<onbekend-uuid>")` → geeft null terug
- `getVersieId("werkindeling")` → bestaand gedrag ongewijzigd
- `buildDaisyPrompt(session, werkbordContext)` → prompt bevat versieId en werkindelingNaam
- `buildDaisyPrompt(session)` → prompt bevat géén werkbord-blok

### E2E tests

- Daisy FAB openen → panel zichtbaar
- Vraag stellen → streaming antwoord verschijnt
- Schrijf-actie: Daisy kondigt aan + vraagt bevestiging → gebruiker bevestigt → wijziging in werkbord (SSE update)
- Undo-knop na tool-call → "Gedaan. [actie] is teruggedraaid."
- Panel sluit met ✕ of Escape
