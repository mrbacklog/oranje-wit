import { getCapabilities, ADMIN_EMAIL } from "./allowlist";

interface AgentCredentials {
  secret?: string;
}

interface AgentUser {
  id: string;
  email: string;
  name: string;
  isTC: boolean;
  agentRunId: string;
}

/**
 * Valideer agent-credentials en retourneer een TC-gebruiker.
 * Geëxporteerd als losse functie zodat hij testbaar is.
 */
export async function authorizeAgent(credentials: AgentCredentials): Promise<AgentUser | null> {
  const secret = credentials?.secret;
  const agentSecret = process.env.AGENT_SECRET;

  if (!secret || !agentSecret || agentSecret.length < 32) return null;
  if (secret !== agentSecret) return null;

  const cap = await getCapabilities(ADMIN_EMAIL);
  if (!cap?.isTC) return null;

  const agentRunId = crypto.randomUUID();

  return {
    id: `agent-${agentRunId}`,
    email: `agent+${agentRunId.slice(0, 8)}@ckvoranjewit.app`,
    name: "Agent",
    isTC: true,
    agentRunId,
  };
}
