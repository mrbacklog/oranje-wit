// Auth
export { sportlinkLogin } from "./auth";

// Endpoints
export { zoekLeden } from "./endpoints/search-members";
export { zoekTeams } from "./endpoints/search-teams";
export { haalNotificatiesOp } from "./endpoints/notifications";
export { haalBondsteamsOp } from "./endpoints/union-teams";

// Sync functies
export { syncLeden } from "./sync/leden-sync";
export { syncNotificaties } from "./sync/notificatie-sync";
export { teamSyncDryRun, syncTeams } from "./sync/team-sync";

// Sync helpers
export { detecteerWijzigingen } from "./sync/wijzigings-detectie";
export type { WijzigingsSignaal } from "./sync/wijzigings-detectie";

// Types
export type {
  SportlinkLid,
  SportlinkTeam,
  SportlinkTeamLid,
  SportlinkNotificatie,
  SportlinkToken,
  LedenSyncResultaat,
  TeamSyncDryRun,
  TeamSyncWijziging,
  TeamSyncTeam,
} from "./types";
