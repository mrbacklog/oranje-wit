/**
 * Claude tool definities (JSON Schema) voor de AI indelingsassistent.
 *
 * Alle speler-gerelateerde tools gebruiken `speler_id` (= rel_code) als
 * primaire identifier. Naam is alleen een fallback.
 */

import type Anthropic from "@anthropic-ai/sdk";

// === READ-ONLY TOOLS ===

const bekijkHuidigeIndeling: Anthropic.Tool = {
  name: "bekijk_huidige_indeling",
  description:
    "Toon alle teams met hun spelers, leeftijden, geslacht en stats. Gebruik dit als je wilt weten hoe de indeling er nu uitziet.",
  input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

const bekijkSpelerspool: Anthropic.Tool = {
  name: "bekijk_spelerspool",
  description:
    "Toon alle spelers die nog NIET in een team zijn ingedeeld. Inclusief leeftijd, geslacht en huidig team van vorig seizoen.",
  input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

const bekijkSpelerDetails: Anthropic.Tool = {
  name: "bekijk_speler_details",
  description:
    "Uitgebreide informatie over 1 speler: spelerspad (voorgaande teams), evaluaties, retentierisico, teamgenoten-historie, notities.",
  input_schema: {
    type: "object" as const,
    properties: {
      speler_id: {
        type: "string",
        description: "Speler ID (rel_code). Gebruik altijd het id-veld uit de spelersdata.",
      },
      speler_naam: {
        type: "string",
        description: "Naam als fallback (alleen als id niet beschikbaar is)",
      },
    },
    required: ["speler_id"],
  },
};

const bekijkVoorgaandeIndeling: Anthropic.Tool = {
  name: "bekijk_voorgaande_indeling",
  description:
    "Toon de teamindeling van een vorig seizoen. Handig om te zien wie bij welk team speelde.",
  input_schema: {
    type: "object" as const,
    properties: {
      seizoen: { type: "string", description: "Seizoen, bijv. '2024-2025' of '2023-2024'" },
    },
    required: ["seizoen"],
  },
};

const bekijkTeamsterktes: Anthropic.Tool = {
  name: "bekijk_teamsterktes",
  description:
    "Toon de actuele competitiestanden van alle OW-teams. Laat zien hoe sterk teams presteren (punten, gewonnen, verloren, doelsaldo).",
  input_schema: {
    type: "object" as const,
    properties: {
      seizoen: { type: "string", description: "Seizoen voor standen, default '2025-2026'" },
    },
    required: [],
  },
};

const bekijkEvaluaties: Anthropic.Tool = {
  name: "bekijk_evaluaties",
  description:
    "Toon trainer-evaluaties (scores en coach-opmerkingen). Kan voor specifieke spelers, met optioneel filter op seizoen en/of ronde.",
  input_schema: {
    type: "object" as const,
    properties: {
      speler_ids: {
        type: "array",
        items: { type: "string" },
        description: "Speler IDs (rel_codes) om evaluaties voor op te halen",
      },
      seizoen: {
        type: "string",
        description: "Filter op seizoen, bijv. '2025-2026'. Leeg = alle seizoenen.",
      },
      ronde: {
        type: "integer",
        description: "Filter op ronde (1, 2, 3, ...). Leeg = alle rondes.",
      },
    },
    required: ["speler_ids"],
  },
};

const bekijkBlauwdrukKaders: Anthropic.Tool = {
  name: "bekijk_blauwdruk_kaders",
  description:
    "Toon de blauwdruk-kaders: regels per categorie (min/max spelers, leeftijdsgrenzen, genderbalans), speerpunten en toelichting.",
  input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

const bekijkPins: Anthropic.Tool = {
  name: "bekijk_pins",
  description: "Toon vastgepinde spelers/staf: harde constraints die gerespecteerd moeten worden.",
  input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

const bekijkRetentieOverzicht: Anthropic.Tool = {
  name: "bekijk_retentie_overzicht",
  description:
    "Toon retentierisico per speler, gesorteerd van hoogste risico naar laagste. Laat zien wie mogelijk gaat stoppen.",
  input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

const bekijkTeamgenoten: Anthropic.Tool = {
  name: "bekijk_teamgenoten",
  description:
    "Toon met wie een speler eerder in een team heeft gespeeld en hoeveel seizoenen samen.",
  input_schema: {
    type: "object" as const,
    properties: {
      speler_id: { type: "string", description: "Speler ID (rel_code)" },
      speler_naam: { type: "string", description: "Naam als fallback" },
    },
    required: ["speler_id"],
  },
};

const valideerTeams: Anthropic.Tool = {
  name: "valideer_teams",
  description:
    "Valideer alle teams tegen de blauwdruk-kaders en KNKV-regels. Toont per team een stoplicht (GROEN/ORANJE/ROOD) met meldingen over teamgrootte, leeftijd, genderbalans etc. Gebruik dit na mutaties of om de huidige staat te checken.",
  input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

// === MUTATIE TOOLS ===

const verplaatsSpeler: Anthropic.Tool = {
  name: "verplaats_speler",
  description: "Verplaats een speler van het ene team naar het andere team.",
  input_schema: {
    type: "object" as const,
    properties: {
      speler_id: { type: "string", description: "Speler ID (rel_code)" },
      speler_naam: { type: "string", description: "Naam als fallback" },
      van_team: { type: "string", description: "Naam van het huidige team" },
      naar_team: { type: "string", description: "Naam van het nieuwe team" },
    },
    required: ["speler_id", "van_team", "naar_team"],
  },
};

const voegSpelerToe: Anthropic.Tool = {
  name: "voeg_speler_toe",
  description: "Voeg een speler uit de pool toe aan een team.",
  input_schema: {
    type: "object" as const,
    properties: {
      speler_id: { type: "string", description: "Speler ID (rel_code)" },
      speler_naam: { type: "string", description: "Naam als fallback" },
      team_naam: { type: "string", description: "Naam van het team" },
    },
    required: ["speler_id", "team_naam"],
  },
};

const verwijderSpelerUitTeam: Anthropic.Tool = {
  name: "verwijder_speler_uit_team",
  description: "Verwijder een speler uit een team (terug naar de pool).",
  input_schema: {
    type: "object" as const,
    properties: {
      speler_id: { type: "string", description: "Speler ID (rel_code)" },
      speler_naam: { type: "string", description: "Naam als fallback" },
      team_naam: { type: "string", description: "Naam van het team" },
    },
    required: ["speler_id", "team_naam"],
  },
};

const wisselSpelers: Anthropic.Tool = {
  name: "wissel_spelers",
  description: "Wissel twee spelers tussen twee teams.",
  input_schema: {
    type: "object" as const,
    properties: {
      speler_a_id: { type: "string", description: "Speler A ID (rel_code)" },
      speler_a_naam: { type: "string", description: "Naam speler A als fallback" },
      team_a: { type: "string", description: "Team van speler A" },
      speler_b_id: { type: "string", description: "Speler B ID (rel_code)" },
      speler_b_naam: { type: "string", description: "Naam speler B als fallback" },
      team_b: { type: "string", description: "Team van speler B" },
    },
    required: ["speler_a_id", "team_a", "speler_b_id", "team_b"],
  },
};

const batchPlaatsSpelers: Anthropic.Tool = {
  name: "batch_plaats_spelers",
  description:
    "Plaats meerdere spelers tegelijk in een team op basis van filters. Handig om snel een heel team te vullen, bijv. 'alle Groen-spelers geboren in 2016 naar Groen-1'. Filters zijn combineerbaar. Spelers die al ingedeeld zijn worden automatisch overgeslagen.",
  input_schema: {
    type: "object" as const,
    properties: {
      team_naam: {
        type: "string",
        description: "Naam van het doelteam in het scenario, bijv. 'Groen-1' of 'U17-1'",
      },
      huidig_team: {
        type: "string",
        description:
          "Filter op huidig team van vorig seizoen (bevat-match), bijv. 'Groen E3' of 'Blauw'",
      },
      huidig_kleur: {
        type: "string",
        enum: ["BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD"],
        description: "Filter op huidige kleurgroep",
      },
      geslacht: {
        type: "string",
        enum: ["M", "V"],
        description: "Filter op geslacht",
      },
      geboortejaar_van: {
        type: "integer",
        description: "Filter: geboortejaar vanaf (inclusief)",
      },
      geboortejaar_tot: {
        type: "integer",
        description: "Filter: geboortejaar tot en met (inclusief)",
      },
      speler_ids: {
        type: "array",
        items: { type: "string" },
        description: "Specifieke speler-IDs (rel_codes) om te plaatsen",
      },
    },
    required: ["team_naam"],
  },
};

const maakTeamAan: Anthropic.Tool = {
  name: "maak_team_aan",
  description:
    "Maak een nieuw team aan. Vraag de gebruiker om de teamnaam, categorie en kleur als je die niet weet.",
  input_schema: {
    type: "object" as const,
    properties: {
      naam: { type: "string", description: "Naam van het team, bijv. 'Oranje 3' of 'Blauw 1'" },
      categorie: {
        type: "string",
        enum: ["SENIOREN", "A_CATEGORIE", "B_CATEGORIE"],
        description: "Categorie: SENIOREN (18+), A_CATEGORIE (U15/U17/U19), B_CATEGORIE (U7-U13)",
      },
      kleur: {
        type: "string",
        enum: ["BLAUW", "GROEN", "GEEL", "ORANJE", "ROOD"],
        description:
          "Kleur/niveau: BLAUW (jongste jeugd), GROEN (oudere jeugd), GEEL (A-categorie), ORANJE (A-cat/senioren), ROOD (senioren). Leidt af uit de teamnaam als mogelijk.",
      },
    },
    required: ["naam", "categorie", "kleur"],
  },
};

export const TOOLS: Anthropic.Tool[] = [
  bekijkHuidigeIndeling,
  bekijkSpelerspool,
  bekijkSpelerDetails,
  bekijkVoorgaandeIndeling,
  bekijkTeamsterktes,
  bekijkEvaluaties,
  bekijkBlauwdrukKaders,
  bekijkPins,
  bekijkRetentieOverzicht,
  bekijkTeamgenoten,
  valideerTeams,
  verplaatsSpeler,
  voegSpelerToe,
  verwijderSpelerUitTeam,
  wisselSpelers,
  batchPlaatsSpelers,
  maakTeamAan,
];
