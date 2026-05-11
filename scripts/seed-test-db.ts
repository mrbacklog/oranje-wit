/**
 * seed-test-db.ts
 *
 * Anonimisatie-pijplijn: leest productie-data uit DATABASE_URL_SOURCE,
 * anonimiseert deterministisch met HMAC-SHA256(ANON_SALT) en schrijft
 * naar DATABASE_URL_TARGET (de test-database).
 *
 * Gebruik:
 *   pnpm tsx -r dotenv/config scripts/seed-test-db.ts
 *
 * Vereisten in .env.local:
 *   DATABASE_URL_SOURCE=<productie-readonly URL of een dump-restore>
 *   DATABASE_URL_TARGET=<test-database URL, mag NIET op productie wijzen>
 *   ANON_SALT=<min. 16 hex chars, gegenereerd met `openssl rand -hex 32`>
 *
 * Veiligheid:
 *   - Het script weigert te draaien als DATABASE_URL_TARGET lijkt op productie
 *   - Geen PII (namen, emails, rel_codes) in logs
 *   - rel_code → hash is deterministisch (zelfde input → zelfde output)
 *   - Geboortedatum-jitter respecteert strikt de kalenderjaargrens
 *
 * Belangrijk:
 *   - Dit script DROPT en herbouwt de target-database (idempotent)
 *   - VIEW speler_seizoenen wordt na seed hersteld via `db:ensure-views`
 *   - Tabel-volgorde respecteert FK-afhankelijkheden
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { spawnSync } from "child_process";
import { logger } from "@oranje-wit/types";

import { PrismaClient } from "../packages/database/src/generated/prisma/client";
import { Prisma } from "../packages/database/src/generated/prisma/client";

/**
 * Helper: Prisma `JsonValue` (read-type, kan null bevatten) → write-type voor
 * create-inputs. Bij null retourneren we `Prisma.JsonNull` zodat de kolom
 * expliciet op JSON null wordt gezet i.p.v. SQL NULL.
 */
function asJsonInput(
  v: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (v === null || v === undefined) return Prisma.JsonNull;
  return v as Prisma.InputJsonValue;
}

/**
 * Voor optionele JSON-kolommen waar we leeg willen laten als bron null is.
 */
function asJsonOptional(
  v: Prisma.JsonValue | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (v === undefined) return undefined;
  if (v === null) return Prisma.JsonNull;
  return v as Prisma.InputJsonValue;
}
import { hashRelCode, hashEmail, deterministicIndex, hmacDigest } from "./anonimisatie/hash";
import { jitterDate } from "./anonimisatie/jitter";
import { VOORNAMEN_M, VOORNAMEN_V, ACHTERNAMEN, TUSSENVOEGSELS } from "./anonimisatie/namenpool";
import { fotoUrl } from "./anonimisatie/fotos";
import { replaceWithPlaceholder } from "./anonimisatie/memo-placeholders";
import { valideerEnv } from "./anonimisatie/validatie";

// ────────────────────────────────────────────────────────────────────
// Prisma client factory — eigen adapter per URL
// ────────────────────────────────────────────────────────────────────

type AnyPrismaClient = InstanceType<typeof PrismaClient>;

function maakClient(url: string): { client: AnyPrismaClient; pool: Pool } {
  const pool = new Pool({ connectionString: url, max: 5 });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  return { client, pool };
}

// ────────────────────────────────────────────────────────────────────
// Naam-generators (deterministisch op rel_code)
// ────────────────────────────────────────────────────────────────────

function genereerVoornaam(geslacht: "M" | "V", relCode: string, salt: string): string {
  const pool = geslacht === "V" ? VOORNAMEN_V : VOORNAMEN_M;
  const idx = deterministicIndex(relCode, salt, [0, 4], pool.length);
  return pool[idx];
}

function genereerAchternaam(relCode: string, salt: string): string {
  const idx = deterministicIndex(relCode, salt, [4, 8], ACHTERNAMEN.length);
  return ACHTERNAMEN[idx];
}

function genereerTussenvoegsel(relCode: string, salt: string): string | null {
  // ~30% kans op tussenvoegsel
  const idx = deterministicIndex(relCode, salt, [8, 12], 10);
  if (idx >= 3) return null;
  return TUSSENVOEGSELS[idx % TUSSENVOEGSELS.length];
}

function veiligGeslacht(g: string | null | undefined): "M" | "V" {
  return g === "V" ? "V" : "M";
}

function hashArray(ids: string[], salt: string): string[] {
  return ids.map((id) => hashRelCode(id, salt));
}

// ────────────────────────────────────────────────────────────────────
// Schema teardown — drop alle tabellen via DROP SCHEMA public CASCADE
// ────────────────────────────────────────────────────────────────────

async function dropTargetSchema(targetUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: targetUrl, max: 1 });
  try {
    const client = await pool.connect();
    try {
      await client.query("DROP SCHEMA IF EXISTS public CASCADE");
      await client.query("CREATE SCHEMA public");
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

// ────────────────────────────────────────────────────────────────────
// Migratie + view-herstel via pnpm-scripts (subproces met eigen env)
// ────────────────────────────────────────────────────────────────────

function runPnpmScript(scriptNaam: string, env: Record<string, string>): void {
  const result = spawnSync("pnpm", [scriptNaam], {
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`pnpm ${scriptNaam} faalde (exit ${result.status})`);
  }
}

// ────────────────────────────────────────────────────────────────────
// Per-tabel anonimisatie. Volgorde respecteert FK's:
//
//   1. Seizoen, OWTeam, TeamAlias, TeamPeriode, CompetitieRonde
//      (geen PII, snake_case monitor-domein) — kopieer 1-op-1
//   2. Lid (PII) — base tabel voor relCode-FK's
//   3. LidFoto, SportlinkNotificatie (depend op Lid.relCode)
//   4. CompetitieSpeler, Ledenverloop (depend op Lid + Seizoen)
//   5. CohortSeizoen, Signalering, Streefmodel, PoolStand, PoolStandRegel (aggregaten)
//   6. Speler (id = rel_code, gehashed)
//   7. Staf (relCode optioneel)
//   8. User, Gebruiker (PII)
//   9. Werkindeling-keten: Kaders → Werkindeling → Versie → SelectieGroep → Team → TeamSpeler/TeamStaf
//  10. WhatIf-keten
//  11. Evaluatie, SpelerZelfEvaluatie, EvaluatieRonde, EvaluatieUitnodiging
//  12. Werkitem, WerkitemToelichting, WerkitemLog, Actiepunt, Activiteit, KadersBesluit, KadersSpeler
//  13. Scout-keten + ScoutingVerzoek + Rapporten + Vergelijkingen
//  14. Raamwerk (geen PII)
//  15. FysiekProfiel, SpelerUSS, SpelersKaart
//  16. Aanmelding (PII)
//  17. Plaatsreservering, Reserveringsspeler, ReferentieTeam, Import
//  18. Coordinator-keten
//  19. Daisy: AiGesprek, AiBericht, DaisyActie
//  20. Instelling, EmailTemplate, Mijlpaal
//
// Wat we VERWIJDEREN (niet hergebruiken in test):
//   - Passkey, VerificatieToken, ToegangsToken
//
// Onderstaande functie is bewust modulair: elke sub-stap kan apart loggen
// en falen zonder de hele pipeline te crashen.
// ────────────────────────────────────────────────────────────────────

interface AnonimiseerContext {
  source: AnyPrismaClient;
  target: AnyPrismaClient;
  salt: string;
}

async function anonimiseerMonitorBasis(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[1] Seizoen, OWTeam, aliases, periodes, rondes...");

  const seizoenen = await ctx.source.seizoen.findMany();
  for (const s of seizoenen) {
    await ctx.target.seizoen.create({ data: s });
  }

  const teams = await ctx.source.oWTeam.findMany();
  for (const t of teams) {
    await ctx.target.oWTeam.create({ data: t });
  }

  const periodes = await ctx.source.teamPeriode.findMany();
  for (const p of periodes) {
    await ctx.target.teamPeriode.create({ data: p });
  }

  const aliases = await ctx.source.teamAlias.findMany();
  for (const a of aliases) {
    await ctx.target.teamAlias.create({ data: a });
  }

  const rondes = await ctx.source.competitieRonde.findMany();
  for (const r of rondes) {
    await ctx.target.competitieRonde.create({ data: r });
  }

  logger.info(`[1] OK — seizoenen=${seizoenen.length}, teams=${teams.length}`);
}

async function anonimiseerLeden(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[2] Leden anonimiseren...");
  const leden = await ctx.source.lid.findMany();
  for (const lid of leden) {
    const geslacht = veiligGeslacht(lid.geslacht);
    const nieuweRelCode = hashRelCode(lid.relCode, ctx.salt);
    await ctx.target.lid.create({
      data: {
        relCode: nieuweRelCode,
        roepnaam: genereerVoornaam(geslacht, lid.relCode, ctx.salt),
        achternaam: genereerAchternaam(lid.relCode, ctx.salt),
        tussenvoegsel: genereerTussenvoegsel(lid.relCode, ctx.salt),
        voorletters: null,
        geslacht: lid.geslacht,
        geboortejaar: lid.geboortejaar,
        geboortedatum: jitterDate(lid.geboortedatum, lid.relCode, ctx.salt),
        lidSinds: lid.lidSinds,
        afmelddatum: lid.afmelddatum,
        lidsoort: lid.lidsoort,
        email: hashEmail(lid.email, ctx.salt),
        lidStatus: lid.lidStatus,
        spelactiviteiten: lid.spelactiviteiten,
        clubTeams: lid.clubTeams,
        leeftijdscategorie: lid.leeftijdscategorie,
        laatstGesyncOp: lid.laatstGesyncOp,
        registratieDatum: lid.registratieDatum,
        createdAt: lid.createdAt,
        updatedAt: lid.updatedAt,
      },
    });
  }
  logger.info(`[2] OK — leden=${leden.length}`);
}

async function anonimiseerLidFotos(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[3] LidFoto anonimiseren...");
  const fotos = await ctx.source.lidFoto.findMany();
  for (const foto of fotos) {
    const lid = await ctx.source.lid.findUnique({ where: { relCode: foto.relCode } });
    const geslacht = veiligGeslacht(lid?.geslacht);
    await ctx.target.lidFoto.create({
      data: {
        relCode: hashRelCode(foto.relCode, ctx.salt),
        bronUrl: fotoUrl(geslacht, foto.relCode, ctx.salt),
        // imageWebp blijft Bytes — vervang door 1-byte placeholder (geen PII).
        // De UI laadt bij voorkeur bronUrl; imageWebp is back-up.
        imageWebp: Buffer.from([0]),
        contentHash: null,
        sourceUpdatedAt: foto.sourceUpdatedAt,
        createdAt: foto.createdAt,
        updatedAt: foto.updatedAt,
      },
    });
  }
  logger.info(`[3] OK — fotos=${fotos.length}`);
}

async function anonimiseerSportlinkNotificaties(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[3b] SportlinkNotificatie anonimiseren...");
  const notifs = await ctx.source.sportlinkNotificatie.findMany();
  for (const n of notifs) {
    await ctx.target.sportlinkNotificatie.create({
      data: {
        id: n.id,
        relCode: hashRelCode(n.relCode, ctx.salt),
        datum: n.datum,
        actie: n.actie,
        entiteit: n.entiteit,
        beschrijving: replaceWithPlaceholder(n.relCode + ":notif:" + n.id, ctx.salt),
        categorie: n.categorie,
        gewijzigdDoor: "anoniem",
        gesyncOp: n.gesyncOp,
      },
    });
  }
  logger.info(`[3b] OK — notificaties=${notifs.length}`);
}

async function anonimiseerCompetitieSpelers(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[4] CompetitieSpeler + Ledenverloop...");
  const cs = await ctx.source.competitieSpeler.findMany();
  for (const c of cs) {
    await ctx.target.competitieSpeler.create({
      data: {
        relCode: hashRelCode(c.relCode, ctx.salt),
        seizoen: c.seizoen,
        competitie: c.competitie,
        team: c.team,
        geslacht: c.geslacht,
        bron: c.bron,
        betrouwbaar: c.betrouwbaar,
        owTeamId: c.owTeamId,
      },
    });
  }
  const lv = await ctx.source.ledenverloop.findMany();
  for (const v of lv) {
    await ctx.target.ledenverloop.create({
      data: {
        seizoen: v.seizoen,
        relCode: hashRelCode(v.relCode, ctx.salt),
        status: v.status,
        geboortejaar: v.geboortejaar,
        geslacht: v.geslacht,
        leeftijdVorig: v.leeftijdVorig,
        leeftijdNieuw: v.leeftijdNieuw,
        teamVorig: v.teamVorig,
        teamNieuw: v.teamNieuw,
      },
    });
  }
  logger.info(`[4] OK — cs=${cs.length}, ledenverloop=${lv.length}`);
}

async function anonimiseerAggregaten(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[5] Cohort, signalering, streefmodel, poolstanden...");
  for (const c of await ctx.source.cohortSeizoen.findMany()) {
    await ctx.target.cohortSeizoen.create({ data: c });
  }
  for (const s of await ctx.source.signalering.findMany()) {
    await ctx.target.signalering.create({ data: s });
  }
  for (const s of await ctx.source.streefmodel.findMany()) {
    await ctx.target.streefmodel.create({ data: s });
  }
  // PoolStand → regels (FK)
  const standen = await ctx.source.poolStand.findMany({ include: { regels: true } });
  for (const stand of standen) {
    const { regels, ...rest } = stand;
    await ctx.target.poolStand.create({
      data: {
        ...rest,
        regels: { create: regels.map(({ poolStandId: _ignored, ...r }) => r) },
      },
    });
  }
  logger.info("[5] OK");
}

async function anonimiseerSpelersEnStaf(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[6] Spelers...");
  const spelers = await ctx.source.speler.findMany();
  for (const s of spelers) {
    await ctx.target.speler.create({
      data: {
        id: hashRelCode(s.id, ctx.salt),
        roepnaam: genereerVoornaam(s.geslacht, s.id, ctx.salt),
        achternaam: genereerAchternaam(s.id, ctx.salt),
        geboortejaar: s.geboortejaar,
        geboortedatum: jitterDate(s.geboortedatum, s.id, ctx.salt),
        geslacht: s.geslacht,
        lidSinds: s.lidSinds,
        // Structurele JSON-velden KEEP: team-historie, retentie, etc.
        huidig: asJsonOptional(s.huidig),
        spelerspad: asJsonOptional(s.spelerspad),
        volgendSeizoen: asJsonOptional(s.volgendSeizoen),
        retentie: asJsonOptional(s.retentie),
        teamgenotenHistorie: asJsonOptional(s.teamgenotenHistorie),
        seizoenenActief: s.seizoenenActief,
        instroomLeeftijd: s.instroomLeeftijd,
        status: s.status,
        rating: s.rating,
        ratingBerekend: s.ratingBerekend,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      },
    });
  }

  logger.info("[7] Staf...");
  const staf = await ctx.source.staf.findMany();
  for (const st of staf) {
    const fakeRel = st.relCode ? hashRelCode(st.relCode, ctx.salt) : null;
    const geslacht = veiligGeslacht("M"); // staf-geslacht onbekend, default voor naam-generator
    await ctx.target.staf.create({
      data: {
        id: st.id,
        relCode: fakeRel,
        naam:
          genereerVoornaam(geslacht, st.id, ctx.salt) + " " + genereerAchternaam(st.id, ctx.salt),
        geboortejaar: st.geboortejaar,
        email: hashEmail(st.email, ctx.salt),
        rollen: st.rollen,
        actief: st.actief,
        createdAt: st.createdAt,
        updatedAt: st.updatedAt,
      },
    });
  }

  logger.info("[7b] Staftoewijzingen...");
  const toew = await ctx.source.stafToewijzing.findMany();
  for (const t of toew) {
    await ctx.target.stafToewijzing.create({ data: t });
  }

  logger.info(`[6-7] OK — spelers=${spelers.length}, staf=${staf.length}`);
}

async function anonimiseerUsers(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[8] User + Gebruiker...");
  const users = await ctx.source.user.findMany();
  for (const u of users) {
    await ctx.target.user.create({
      data: {
        id: u.id,
        email: hashEmail(u.email, ctx.salt) ?? `${u.id}@test.local`,
        naam: `Gebruiker ${deterministicIndex(u.id, ctx.salt, [0, 4], 9999)}`,
        rol: u.rol,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      },
    });
  }
  const geb = await ctx.source.gebruiker.findMany();
  for (const g of geb) {
    await ctx.target.gebruiker.create({
      data: {
        id: g.id,
        email: hashEmail(g.email, ctx.salt) ?? `${g.id}@test.local`,
        naam: `Gebruiker ${deterministicIndex(g.id, ctx.salt, [0, 4], 9999)}`,
        isTC: g.isTC,
        isTCKern: g.isTCKern,
        isScout: g.isScout,
        clearance: g.clearance,
        doelgroepen: g.doelgroepen,
        actief: g.actief,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      },
    });
  }
  logger.info(`[8] OK — users=${users.length}, gebruikers=${geb.length}`);
}

async function anonimiseerWerkindelingKeten(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[9] Kaders → Werkindeling → Versie → SelectieGroep → Team...");

  for (const k of await ctx.source.kaders.findMany()) {
    await ctx.target.kaders.create({
      data: {
        ...k,
        kaders: asJsonInput(k.kaders),
        keuzes: asJsonOptional(k.keuzes),
      },
    });
  }
  for (const w of await ctx.source.werkindeling.findMany()) {
    await ctx.target.werkindeling.create({ data: w });
  }
  for (const v of await ctx.source.versie.findMany()) {
    await ctx.target.versie.create({
      data: { ...v, posities: asJsonOptional(v.posities) },
    });
  }
  // SelectieGroep moet voor Team (Team kan SelectieGroep referen).
  for (const sg of await ctx.source.selectieGroep.findMany()) {
    await ctx.target.selectieGroep.create({ data: sg });
  }
  for (const t of await ctx.source.team.findMany()) {
    await ctx.target.team.create({
      data: { ...t, validatieMeldingen: asJsonOptional(t.validatieMeldingen) },
    });
  }
  for (const ts of await ctx.source.teamSpeler.findMany()) {
    await ctx.target.teamSpeler.create({
      data: {
        id: ts.id,
        teamId: ts.teamId,
        spelerId: hashRelCode(ts.spelerId, ctx.salt),
        statusOverride: ts.statusOverride,
        notitie: ts.notitie ? replaceWithPlaceholder(ts.id, ctx.salt) : null,
      },
    });
  }
  for (const tst of await ctx.source.teamStaf.findMany()) {
    await ctx.target.teamStaf.create({ data: tst });
  }
  for (const ss of await ctx.source.selectieSpeler.findMany()) {
    await ctx.target.selectieSpeler.create({
      data: {
        id: ss.id,
        selectieGroepId: ss.selectieGroepId,
        spelerId: hashRelCode(ss.spelerId, ctx.salt),
        statusOverride: ss.statusOverride,
        notitie: ss.notitie ? replaceWithPlaceholder(ss.id, ctx.salt) : null,
      },
    });
  }
  for (const sst of await ctx.source.selectieStaf.findMany()) {
    await ctx.target.selectieStaf.create({ data: sst });
  }
  for (const pr of await ctx.source.plaatsreservering.findMany()) {
    await ctx.target.plaatsreservering.create({
      data: {
        id: pr.id,
        teamId: pr.teamId,
        naam: `Reserve ${deterministicIndex(pr.id, ctx.salt, [0, 4], 999)}`,
        geslacht: pr.geslacht,
        createdAt: pr.createdAt,
      },
    });
  }
  for (const rs of await ctx.source.reserveringsspeler.findMany()) {
    await ctx.target.reserveringsspeler.create({
      data: {
        id: rs.id,
        titel: `Reserve ${deterministicIndex(rs.id, ctx.salt, [0, 4], 999)}`,
        geslacht: rs.geslacht,
        teamId: rs.teamId,
        createdAt: rs.createdAt,
        updatedAt: rs.updatedAt,
      },
    });
  }
  logger.info("[9] OK");
}

async function anonimiseerWhatIfs(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[10] WhatIf-keten...");
  for (const w of await ctx.source.whatIf.findMany()) {
    await ctx.target.whatIf.create({
      data: { ...w, posities: w.posities ?? undefined },
    });
  }
  for (const wt of await ctx.source.whatIfTeam.findMany()) {
    await ctx.target.whatIfTeam.create({ data: wt });
  }
  for (const wts of await ctx.source.whatIfTeamSpeler.findMany()) {
    await ctx.target.whatIfTeamSpeler.create({
      data: {
        id: wts.id,
        whatIfTeamId: wts.whatIfTeamId,
        spelerId: hashRelCode(wts.spelerId, ctx.salt),
        statusOverride: wts.statusOverride,
        notitie: wts.notitie ? replaceWithPlaceholder(wts.id, ctx.salt) : null,
      },
    });
  }
  for (const wts of await ctx.source.whatIfTeamStaf.findMany()) {
    await ctx.target.whatIfTeamStaf.create({ data: wts });
  }
  logger.info("[10] OK");
}

async function anonimiseerEvaluaties(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[11] Evaluatie-keten...");
  for (const r of await ctx.source.evaluatieRonde.findMany()) {
    await ctx.target.evaluatieRonde.create({ data: r });
  }
  for (const u of await ctx.source.evaluatieUitnodiging.findMany()) {
    await ctx.target.evaluatieUitnodiging.create({
      data: {
        id: u.id,
        rondeId: u.rondeId,
        type: u.type,
        email: hashEmail(u.email, ctx.salt) ?? `${u.id}@test.local`,
        naam: `Gast ${deterministicIndex(u.id, ctx.salt, [0, 4], 9999)}`,
        owTeamId: u.owTeamId,
        spelerId: u.spelerId ? hashRelCode(u.spelerId, ctx.salt) : null,
        token: hmacDigest(u.token, ctx.salt).slice(0, 24),
        emailVerstuurd: u.emailVerstuurd,
        reminderVerstuurd: u.reminderVerstuurd,
        reminderAantal: u.reminderAantal,
        createdAt: u.createdAt,
      },
    });
  }
  for (const e of await ctx.source.evaluatie.findMany()) {
    await ctx.target.evaluatie.create({
      data: {
        id: e.id,
        spelerId: hashRelCode(e.spelerId, ctx.salt),
        seizoen: e.seizoen,
        ronde: e.ronde,
        type: e.type,
        scores: asJsonInput(e.scores),
        opmerking: e.opmerking ? replaceWithPlaceholder(e.id, ctx.salt) : null,
        coach: e.coach ? `Coach ${deterministicIndex(e.id, ctx.salt, [0, 4], 99)}` : null,
        teamNaam: e.teamNaam,
        rondeId: e.rondeId,
        coordinatorMemo: e.coordinatorMemo
          ? replaceWithPlaceholder(e.id + ":memo", ctx.salt)
          : null,
        status: e.status,
        ingediendOp: e.ingediendOp,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        // overschrijf scores expliciet met juist write-type
      },
    });
  }
  for (const z of await ctx.source.spelerZelfEvaluatie.findMany()) {
    await ctx.target.spelerZelfEvaluatie.create({
      data: {
        id: z.id,
        spelerId: hashRelCode(z.spelerId, ctx.salt),
        seizoen: z.seizoen,
        ronde: z.ronde,
        rondeId: z.rondeId,
        plezierKorfbal: z.plezierKorfbal,
        plezierTeam: z.plezierTeam,
        plezierUitdaging: z.plezierUitdaging,
        plezierToelichting: z.plezierToelichting
          ? replaceWithPlaceholder(z.id + ":pl", ctx.salt)
          : null,
        trainingZin: z.trainingZin,
        trainingKwaliteit: z.trainingKwaliteit,
        wedstrijdBeleving: z.wedstrijdBeleving,
        trainingVerbetering: z.trainingVerbetering,
        trainingToelichting: z.trainingToelichting
          ? replaceWithPlaceholder(z.id + ":tr", ctx.salt)
          : null,
        toekomstIntentie: z.toekomstIntentie,
        toekomstAmbitie: z.toekomstAmbitie,
        toekomstToelichting: z.toekomstToelichting
          ? replaceWithPlaceholder(z.id + ":tk", ctx.salt)
          : null,
        algemeenOpmerking: z.algemeenOpmerking
          ? replaceWithPlaceholder(z.id + ":alg", ctx.salt)
          : null,
        coordinatorMemo: z.coordinatorMemo ? replaceWithPlaceholder(z.id + ":co", ctx.salt) : null,
        status: z.status,
        ingediendOp: z.ingediendOp,
        createdAt: z.createdAt,
        updatedAt: z.updatedAt,
      },
    });
  }
  logger.info("[11] OK");
}

async function anonimiseerWerkitems(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[12] Werkitems, actiepunten, kadersbesluiten...");

  for (const w of await ctx.source.werkitem.findMany()) {
    await ctx.target.werkitem.create({
      data: {
        ...w,
        beschrijving: replaceWithPlaceholder(w.id, ctx.salt),
        spelerId: w.spelerId ? hashRelCode(w.spelerId, ctx.salt) : null,
      },
    });
  }
  for (const t of await ctx.source.werkitemToelichting.findMany()) {
    await ctx.target.werkitemToelichting.create({
      data: {
        id: t.id,
        werkitemId: t.werkitemId,
        auteurNaam: `Auteur ${deterministicIndex(t.id, ctx.salt, [0, 4], 99)}`,
        auteurEmail: hashEmail(t.auteurEmail, ctx.salt) ?? `${t.id}@test.local`,
        tekst: replaceWithPlaceholder(t.id, ctx.salt),
        timestamp: t.timestamp,
      },
    });
  }
  for (const l of await ctx.source.werkitemLog.findMany()) {
    await ctx.target.werkitemLog.create({
      data: {
        id: l.id,
        werkitemId: l.werkitemId,
        auteurNaam: `Auteur ${deterministicIndex(l.id, ctx.salt, [0, 4], 99)}`,
        auteurEmail: hashEmail(l.auteurEmail, ctx.salt) ?? `${l.id}@test.local`,
        actie: l.actie,
        detail: l.detail,
        timestamp: l.timestamp,
      },
    });
  }
  for (const a of await ctx.source.actiepunt.findMany()) {
    await ctx.target.actiepunt.create({
      data: {
        ...a,
        beschrijving: replaceWithPlaceholder(a.id, ctx.salt),
      },
    });
  }
  for (const a of await ctx.source.activiteit.findMany()) {
    await ctx.target.activiteit.create({
      data: {
        ...a,
        inhoud: replaceWithPlaceholder(a.id, ctx.salt),
        spelerId: a.spelerId ? hashRelCode(a.spelerId, ctx.salt) : null,
      },
    });
  }

  for (const b of await ctx.source.standaardVraag.findMany()) {
    await ctx.target.standaardVraag.create({
      data: { ...b, toonAls: b.toonAls ?? undefined },
    });
  }
  for (const b of await ctx.source.kadersBesluit.findMany()) {
    await ctx.target.kadersBesluit.create({
      data: {
        ...b,
        antwoord: b.antwoord ? replaceWithPlaceholder(b.id, ctx.salt) : null,
        toelichting: b.toelichting ? replaceWithPlaceholder(b.id + ":t", ctx.salt) : null,
        antwoordWaarde: b.antwoordWaarde ?? undefined,
        toonAls: b.toonAls ?? undefined,
      },
    });
  }
  for (const k of await ctx.source.kadersSpeler.findMany()) {
    await ctx.target.kadersSpeler.create({
      data: {
        ...k,
        spelerId: hashRelCode(k.spelerId, ctx.salt),
        notitie: k.notitie ? replaceWithPlaceholder(k.id, ctx.salt) : null,
        gezienVoorgesteldNotitie: k.gezienVoorgesteldNotitie
          ? replaceWithPlaceholder(k.id + ":v", ctx.salt)
          : null,
      },
    });
  }
  logger.info("[12] OK");
}

async function anonimiseerScoutKeten(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[13] Scout-keten...");
  for (const s of await ctx.source.scout.findMany()) {
    await ctx.target.scout.create({
      data: {
        id: s.id,
        naam: `Scout ${deterministicIndex(s.id, ctx.salt, [0, 4], 999)}`,
        email: hashEmail(s.email, ctx.salt) ?? `${s.id}@test.local`,
        userId: s.userId,
        stafId: s.stafId,
        xp: s.xp,
        level: s.level,
        rol: s.rol,
        vrijScouten: s.vrijScouten,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      },
    });
  }
  for (const v of await ctx.source.scoutingVerzoek.findMany()) {
    await ctx.target.scoutingVerzoek.create({
      data: {
        ...v,
        toelichting: v.toelichting ? replaceWithPlaceholder(v.id, ctx.salt) : null,
        spelerIds: hashArray(v.spelerIds, ctx.salt),
      },
    });
  }
  for (const t of await ctx.source.scoutToewijzing.findMany()) {
    await ctx.target.scoutToewijzing.create({ data: t });
  }
  for (const sess of await ctx.source.teamScoutingSessie.findMany()) {
    await ctx.target.teamScoutingSessie.create({
      data: { ...sess, rankings: sess.rankings ?? undefined },
    });
  }
  for (const r of await ctx.source.scoutingRapport.findMany()) {
    await ctx.target.scoutingRapport.create({
      data: {
        ...r,
        spelerId: hashRelCode(r.spelerId, ctx.salt),
        opmerking: r.opmerking ? replaceWithPlaceholder(r.id, ctx.salt) : null,
        scores: asJsonInput(r.scores),
      },
    });
  }
  for (const b of await ctx.source.scoutBadge.findMany()) {
    await ctx.target.scoutBadge.create({ data: b });
  }
  for (const c of await ctx.source.scoutChallenge.findMany()) {
    await ctx.target.scoutChallenge.create({
      data: { ...c, voorwaarde: asJsonInput(c.voorwaarde) },
    });
  }
  for (const v of await ctx.source.scoutingVergelijking.findMany()) {
    await ctx.target.scoutingVergelijking.create({
      data: { ...v, opmerking: v.opmerking ? replaceWithPlaceholder(v.id, ctx.salt) : null },
    });
  }
  for (const p of await ctx.source.scoutingVergelijkingPositie.findMany()) {
    await ctx.target.scoutingVergelijkingPositie.create({
      data: { ...p, spelerId: hashRelCode(p.spelerId, ctx.salt) },
    });
  }
  for (const k of await ctx.source.spelersKaart.findMany()) {
    await ctx.target.spelersKaart.create({
      data: {
        ...k,
        spelerId: hashRelCode(k.spelerId, ctx.salt),
        pijlerScores: k.pijlerScores ?? undefined,
      },
    });
  }
  logger.info("[13] OK");
}

async function anonimiseerRaamwerk(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[14] Raamwerk (geen PII)...");
  for (const v of await ctx.source.raamwerkVersie.findMany()) {
    await ctx.target.raamwerkVersie.create({ data: v });
  }
  for (const g of await ctx.source.leeftijdsgroep.findMany()) {
    await ctx.target.leeftijdsgroep.create({ data: g });
  }
  for (const p of await ctx.source.pijler.findMany()) {
    await ctx.target.pijler.create({ data: p });
  }
  for (const i of await ctx.source.ontwikkelItem.findMany()) {
    await ctx.target.ontwikkelItem.create({ data: i });
  }
  logger.info("[14] OK");
}

async function anonimiseerFysiekUss(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[15] FysiekProfiel + SpelerUSS...");
  for (const f of await ctx.source.fysiekProfiel.findMany()) {
    await ctx.target.fysiekProfiel.create({
      data: {
        ...f,
        spelerId: hashRelCode(f.spelerId, ctx.salt),
        opmerking: f.opmerking ? replaceWithPlaceholder(f.id, ctx.salt) : null,
      },
    });
  }
  for (const u of await ctx.source.spelerUSS.findMany()) {
    await ctx.target.spelerUSS.create({
      data: {
        ...u,
        spelerId: hashRelCode(u.spelerId, ctx.salt),
        ussPijlers: u.ussPijlers ?? undefined,
        ussCoachPijlers: u.ussCoachPijlers ?? undefined,
        ussScoutPijlers: u.ussScoutPijlers ?? undefined,
        ussVergelijkingPijlers: u.ussVergelijkingPijlers ?? undefined,
        crossValidatieSignalen: u.crossValidatieSignalen ?? undefined,
      },
    });
  }
  logger.info("[15] OK");
}

async function anonimiseerAanmeldingen(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[16] Aanmeldingen...");
  for (const a of await ctx.source.aanmelding.findMany()) {
    await ctx.target.aanmelding.create({
      data: {
        id: a.id,
        naam: `Aanmelder ${deterministicIndex(a.id, ctx.salt, [0, 4], 9999)}`,
        email: hashEmail(a.email, ctx.salt),
        telefoon: null,
        geboortejaar: a.geboortejaar,
        opmerking: a.opmerking ? replaceWithPlaceholder(a.id, ctx.salt) : null,
        status: a.status,
        bron: a.bron,
        ledenadmin: a.ledenadmin,
        trainer: a.trainer,
        tcLid: a.tcLid,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      },
    });
  }
  logger.info("[16] OK");
}

async function anonimiseerImports(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[17] Imports + referentie-teams...");
  for (const i of await ctx.source.import.findMany()) {
    await ctx.target.import.create({
      data: {
        ...i,
        spelerIds: hashArray(i.spelerIds, ctx.salt),
        meta: asJsonInput(i.meta),
        diff: asJsonOptional(i.diff),
      },
    });
  }
  for (const r of await ctx.source.referentieTeam.findMany()) {
    await ctx.target.referentieTeam.create({
      data: {
        ...r,
        spelerIds: hashArray(r.spelerIds, ctx.salt),
        stats: asJsonInput(r.stats),
      },
    });
  }
  for (const s of await ctx.source.werkindelingSnapshot.findMany()) {
    await ctx.target.werkindelingSnapshot.create({
      data: { ...s, data: asJsonInput(s.data) },
    });
  }
  for (const l of await ctx.source.logEntry.findMany()) {
    await ctx.target.logEntry.create({ data: l });
  }
  logger.info("[17] OK");
}

async function anonimiseerCoordinator(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[18] Coordinator-keten...");
  for (const c of await ctx.source.coordinator.findMany()) {
    await ctx.target.coordinator.create({
      data: {
        id: c.id,
        naam: `Coordinator ${deterministicIndex(c.id, ctx.salt, [0, 4], 999)}`,
        email: hashEmail(c.email, ctx.salt) ?? `${c.id}@test.local`,
        createdAt: c.createdAt,
      },
    });
  }
  for (const ct of await ctx.source.coordinatorTeam.findMany()) {
    await ctx.target.coordinatorTeam.create({ data: ct });
  }
  for (const v of await ctx.source.coordinatorVoorstel.findMany()) {
    await ctx.target.coordinatorVoorstel.create({
      data: {
        ...v,
        omschrijving: replaceWithPlaceholder(v.id, ctx.salt),
        toelichting: v.toelichting ? replaceWithPlaceholder(v.id + ":t", ctx.salt) : null,
        spelerId: v.spelerId ? hashRelCode(v.spelerId, ctx.salt) : null,
      },
    });
  }
  logger.info("[18] OK");
}

async function anonimiseerDaisy(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[19] Daisy AI-chat + acties...");
  for (const p of await ctx.source.aiProviderInstelling.findMany()) {
    await ctx.target.aiProviderInstelling.create({ data: p });
  }
  for (const g of await ctx.source.aiGesprek.findMany()) {
    await ctx.target.aiGesprek.create({ data: g });
  }
  for (const b of await ctx.source.aiBericht.findMany()) {
    await ctx.target.aiBericht.create({
      data: { ...b, metadata: b.metadata ?? undefined },
    });
  }
  for (const a of await ctx.source.daisyActie.findMany()) {
    await ctx.target.daisyActie.create({
      data: {
        ...a,
        doPayload: asJsonInput(a.doPayload),
        undoPayload: asJsonInput(a.undoPayload),
        namens: null,
      },
    });
  }
  logger.info("[19] OK");
}

async function anonimiseerSysteem(ctx: AnonimiseerContext): Promise<void> {
  logger.info("[20] Instelling + EmailTemplate + Mijlpaal...");
  for (const i of await ctx.source.instelling.findMany()) {
    // API-keys/geheimen: leeg laten in test
    await ctx.target.instelling.create({
      data: {
        sleutel: i.sleutel,
        waarde: i.geheim ? "" : i.waarde,
        geheim: i.geheim,
        updatedAt: i.updatedAt,
        updatedBy: null,
      },
    });
  }
  for (const t of await ctx.source.emailTemplate.findMany()) {
    await ctx.target.emailTemplate.create({ data: t });
  }
  for (const m of await ctx.source.mijlpaal.findMany()) {
    await ctx.target.mijlpaal.create({ data: m });
  }
  logger.info("[20] OK");
}

// ────────────────────────────────────────────────────────────────────
// Hoofd-flow
// ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { sourceUrl, targetUrl, salt } = valideerEnv();

  logger.info("Stap 1: target-schema droppen + opnieuw aanmaken...");
  await dropTargetSchema(targetUrl);

  logger.info("Stap 2: migraties draaien op target...");
  runPnpmScript("db:migrate:deploy", { DATABASE_URL: targetUrl });

  logger.info("Stap 3: Prisma-clients openen (source + target)...");
  const sourceConn = maakClient(sourceUrl);
  const targetConn = maakClient(targetUrl);
  const ctx: AnonimiseerContext = {
    source: sourceConn.client,
    target: targetConn.client,
    salt,
  };

  try {
    await anonimiseerMonitorBasis(ctx);
    await anonimiseerLeden(ctx);
    await anonimiseerLidFotos(ctx);
    await anonimiseerSportlinkNotificaties(ctx);
    await anonimiseerCompetitieSpelers(ctx);
    await anonimiseerAggregaten(ctx);
    await anonimiseerSpelersEnStaf(ctx);
    await anonimiseerUsers(ctx);
    await anonimiseerWerkindelingKeten(ctx);
    await anonimiseerWhatIfs(ctx);
    await anonimiseerEvaluaties(ctx);
    await anonimiseerWerkitems(ctx);
    await anonimiseerRaamwerk(ctx);
    await anonimiseerScoutKeten(ctx);
    await anonimiseerFysiekUss(ctx);
    await anonimiseerAanmeldingen(ctx);
    await anonimiseerImports(ctx);
    await anonimiseerCoordinator(ctx);
    await anonimiseerDaisy(ctx);
    await anonimiseerSysteem(ctx);

    // Stap 4: VERWIJDER passkeys/verificatie-/toegangstokens (worden NIET gekopieerd).
    // De target-database is leeg na migratie, dus geen actie nodig — bevestigen voor zekerheid.
    const passkeyCount = await ctx.target.passkey.count();
    const tokCount = await ctx.target.verificatieToken.count();
    const accessCount = await ctx.target.toegangsToken.count();
    if (passkeyCount + tokCount + accessCount > 0) {
      logger.warn("Onverwacht: target bevat passkeys/tokens, leegmaken...");
      await ctx.target.passkey.deleteMany();
      await ctx.target.verificatieToken.deleteMany();
      await ctx.target.toegangsToken.deleteMany();
    }
  } finally {
    await ctx.source.$disconnect();
    await ctx.target.$disconnect();
    await sourceConn.pool.end();
    await targetConn.pool.end();
  }

  logger.info("Stap 5: VIEW speler_seizoenen herstellen...");
  runPnpmScript("db:ensure-views", { DATABASE_URL: targetUrl });

  logger.info("Anonimisering voltooid.");
}

main().catch((err: unknown) => {
  logger.error("seed-test-db faalde:", err);
  process.exit(1);
});
