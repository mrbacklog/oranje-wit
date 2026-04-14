/**
 * scripts/daisy-cli.ts
 *
 * Praat met Daisy vanuit de terminal (Claude Code / CI).
 * Vereist: DAISY_SERVICE_KEY en DAISY_URL in .env
 *
 * Gebruik:
 *   node -r dotenv/config --loader ts-node/esm scripts/daisy-cli.ts "Zet Jan de Vries in Senioren 1"
 *   node -r dotenv/config --loader ts-node/esm scripts/daisy-cli.ts
 *     → interactieve modus: type berichten, ctrl+c om te stoppen
 */

import * as readline from "readline";

const DAISY_URL = process.env.DAISY_URL ?? "https://teamindeling.ckvoranjewit.app/api/ai/chat";
const SERVICE_KEY = process.env.DAISY_SERVICE_KEY;
const WERKINDELING_ID = process.env.DAISY_WERKINDELING_ID;
const VERSIE_ID = process.env.DAISY_VERSIE_ID;

if (!SERVICE_KEY) {
  console.error("❌  DAISY_SERVICE_KEY niet ingesteld in .env");
  process.exit(1);
}

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
};

const history: UiMessage[] = [];
let msgId = 0;

function maakId() {
  return `msg-${++msgId}-${Date.now()}`;
}

async function stuurBerichtNaarDaisy(tekst: string): Promise<string> {
  history.push({
    id: maakId(),
    role: "user",
    parts: [{ type: "text", text: tekst }],
  });

  const body: Record<string, unknown> = {
    messages: history.slice(-10),
  };
  if (WERKINDELING_ID) body.werkindelingId = WERKINDELING_ID;
  if (VERSIE_ID) body.versieId = VERSIE_ID;

  const res = await fetch(DAISY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Daisy-Service-Key": SERVICE_KEY!,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const fout = await res.text();
    throw new Error(`HTTP ${res.status}: ${fout}`);
  }

  // Streaming text response verwerken
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let antwoord = "";
  let chunk: ReadableStreamReadResult<Uint8Array>;

  process.stdout.write("\n🤖 Daisy: ");

  while (!(chunk = await reader.read()).done) {
    const text = decoder.decode(chunk.value, { stream: true });
    // Vercel AI SDK data stream: lijnen beginnen met "0:" voor tekst, "8:" voor errors
    for (const line of text.split("\n")) {
      if (line.startsWith("0:")) {
        // JSON-encoded tekst chunk
        try {
          const stuk = JSON.parse(line.slice(2));
          process.stdout.write(stuk);
          antwoord += stuk;
        } catch {
          // ignore malformed
        }
      } else if (line.startsWith("3:")) {
        // Error
        console.error("\n❌  Daisy-fout:", line.slice(2));
      }
    }
  }

  process.stdout.write("\n");

  history.push({
    id: maakId(),
    role: "assistant",
    parts: [{ type: "text", text: antwoord }],
  });

  return antwoord;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Enkelvoudige vraag
    const vraag = args.join(" ");
    console.log(`\n👤 Jij: ${vraag}`);
    try {
      await stuurBerichtNaarDaisy(vraag);
    } catch (err) {
      console.error("❌  Fout:", err);
      process.exit(1);
    }
    return;
  }

  // Interactieve modus
  console.log("💬  Daisy CLI — typ een bericht, ctrl+c om te stoppen");
  console.log(`📡  Endpoint: ${DAISY_URL}`);
  if (WERKINDELING_ID) console.log(`📋  Werkindeling: ${WERKINDELING_ID}`);
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "👤 Jij: ",
  });

  rl.prompt();

  rl.on("line", async (invoer) => {
    const tekst = invoer.trim();
    if (!tekst) {
      rl.prompt();
      return;
    }
    try {
      await stuurBerichtNaarDaisy(tekst);
    } catch (err) {
      console.error("❌  Fout:", err);
    }
    rl.prompt();
  });

  rl.on("close", () => {
    console.log("\nTot ziens!");
    process.exit(0);
  });
}

main();
