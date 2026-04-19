const PROJECT_ID = "aa87602d-316d-4d3e-8860-f75d352fae27";
const ENV_ID = "1751fe16-20bf-4a6a-a5f6-b46ea0f4cfb1";

const SERVICES = {
  web: {
    id: "46a4f38c-eff1-4140-ad07-f12be057ef30",
    name: "ckvoranjewit.app",
  },
  "ti-studio": {
    id: "4feb4549-cafb-433c-89fb-505aeb05ae44",
    name: "ti-studio",
  },
  database: {
    id: "e7486b49-dba3-4e0a-8709-a501cea860ae",
    name: "Postgres",
  },
};

const API_URL = "https://backboard.railway.com/graphql/v2";

function resolveService(alias) {
  const svc = SERVICES[alias];
  if (!svc) {
    const beschikbaar = Object.keys(SERVICES).join(", ");
    throw new Error(`Onbekende service '${alias}', beschikbaar: ${beschikbaar}`);
  }
  return svc;
}

module.exports = { PROJECT_ID, ENV_ID, SERVICES, API_URL, resolveService };
