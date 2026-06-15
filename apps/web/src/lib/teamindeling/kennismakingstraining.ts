// @ts-expect-error — JSON import zonder typedeclaratie
import rawConfig from "../../../../data/kennismakingstraining.json";

// ── Types ────────────────────────────────────────────────────────────────────

export type KennismakingDag = {
  datum: string;
  label: string;
  velden: string[];
  begin: string;
  eind: string;
};

export type KennismakingTeam = {
  naam: string;
  duurMinuten: number;
};

export type KennismakingConfig = {
  beschikbaarheid: KennismakingDag[];
  teams: KennismakingTeam[];
};

export type KennismakingSlot = {
  begin: string;
  eind: string;
};

export type KennismakingDagSlots = {
  dag: KennismakingDag;
  slots: KennismakingSlot[];
};

// ── Laden ────────────────────────────────────────────────────────────────────

export function laadKennismakingConfig(): KennismakingConfig {
  return rawConfig as KennismakingConfig;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function tijdNaarMinuten(tijd: string): number {
  const [uur, min] = tijd.split(":").map(Number);
  return uur * 60 + min;
}

function minutenNaarTijd(minuten: number): string {
  const uur = Math.floor(minuten / 60);
  const min = minuten % 60;
  return `${String(uur).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Bereken mogelijke starttijden voor een blok van duurMinuten binnen begin-eind. */
export function berekenSlots(dag: KennismakingDag, duurMinuten: number): KennismakingSlot[] {
  const begin = tijdNaarMinuten(dag.begin);
  const eind = tijdNaarMinuten(dag.eind);
  const slots: KennismakingSlot[] = [];
  for (let start = begin; start + duurMinuten <= eind; start += duurMinuten) {
    slots.push({
      begin: minutenNaarTijd(start),
      eind: minutenNaarTijd(start + duurMinuten),
    });
  }
  return slots;
}

/** Geeft per dag de mogelijke slots voor een team met opgegeven duur. */
export function slotsVoorTeam(
  config: KennismakingConfig,
  teamnaam: string
): KennismakingDagSlots[] {
  const team = config.teams.find((t) => t.naam.toLowerCase() === teamnaam.toLowerCase());
  if (!team) return [];
  return config.beschikbaarheid.map((dag) => ({
    dag,
    slots: berekenSlots(dag, team.duurMinuten),
  }));
}
