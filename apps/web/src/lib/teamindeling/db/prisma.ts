/**
 * Prisma client wrapper voor team-indeling.
 *
 * Probleem: Prisma 7.x genereert op Linux (CI) type-definities die TypeScript's
 * recursielimiet overschrijden (TS2321 "Excessive stack depth"). Oplossing: cast
 * de client naar AnyPrismaClient met vereenvoudigde any-return types per model.
 * Dit voorkomt zowel TS2321 als cascaderende TS7006 (implicit any) fouten.
 */
import { prisma as _prisma } from "@oranje-wit/database";

// Vereenvoudigd model-type: alle methoden accepteren any en retourneren any
type AnyModel = {
  findMany(args?: any): Promise<any[]>;
  findFirst(args?: any): Promise<any | null>;
  findUnique(args?: any): Promise<any | null>;
  findUniqueOrThrow(args?: any): Promise<any>;
  findFirstOrThrow(args?: any): Promise<any>;
  create(args?: any): Promise<any>;
  createMany(args?: any): Promise<{ count: number }>;
  update(args?: any): Promise<any>;
  updateMany(args?: any): Promise<{ count: number }>;
  upsert(args?: any): Promise<any>;
  delete(args?: any): Promise<any>;
  deleteMany(args?: any): Promise<{ count: number }>;
  count(args?: any): Promise<number>;
  aggregate(args?: any): Promise<any>;
  groupBy(args?: any): Promise<any[]>;
};

type AnyPrismaModels = {
  // Competitie-data
  competitieSpeler: AnyModel;
  competitieRonde: AnyModel;
  // Verenigingsmonitor
  lid: AnyModel;
  lidFoto: AnyModel;
  seizoen: AnyModel;
  oWTeam: AnyModel;
  teamPeriode: AnyModel;
  ledenverloop: AnyModel;
  cohortSeizoen: AnyModel;
  signalering: AnyModel;
  streefmodel: AnyModel;
  poolStand: AnyModel;
  poolStandRegel: AnyModel;
  // Team-Indeling
  user: AnyModel;
  speler: AnyModel;
  staf: AnyModel;
  kaders: AnyModel;
  werkindeling: AnyModel;
  pin: AnyModel;
  versie: AnyModel;
  team: AnyModel;
  teamSpeler: AnyModel;
  teamStaf: AnyModel;
  evaluatie: AnyModel;
  logEntry: AnyModel;
  import: AnyModel;
  referentieTeam: AnyModel;
  selectieGroep: AnyModel;
  selectieSpeler: AnyModel;
  selectieStaf: AnyModel;
  kadersSpeler: AnyModel;
  kadersBesluit: AnyModel;
  standaardVraag: AnyModel;
  stafToewijzing: AnyModel;
  // Evaluatie-app
  evaluatieRonde: AnyModel;
  coordinator: AnyModel;
  coordinatorTeam: AnyModel;
  coordinatorVoorstel: AnyModel;
  evaluatieUitnodiging: AnyModel;
  spelerZelfEvaluatie: AnyModel;
  emailTemplate: AnyModel;
  // Werkbord & Activiteiten
  werkitem: AnyModel;
  actiepunt: AnyModel;
  activiteit: AnyModel;
  // Mijlpalen
  mijlpaal: AnyModel;
  // Snapshots
  werkindelingSnapshot: AnyModel;
  // Daisy
  daisyActie: AnyModel;
  plaatsreservering: AnyModel;
  // What-if
  whatIf: AnyModel;
  whatIfTeam: AnyModel;
  whatIfTeamSpeler: AnyModel;
  whatIfTeamStaf: AnyModel;
};

type AnyPrismaClient = AnyPrismaModels & {
  $transaction(fn: (tx: AnyPrismaModels) => Promise<any>, options?: any): Promise<any>;
  $transaction(promises: Promise<any>[], options?: any): Promise<any[]>;
  $queryRaw<T = any>(query: TemplateStringsArray | any, ...values: any[]): Promise<T>;
  $executeRaw(query: TemplateStringsArray | any, ...values: any[]): Promise<number>;
  $executeRawUnsafe(query: string, ...values: any[]): Promise<number>;
  $disconnect(): Promise<void>;
  $connect(): Promise<void>;
};

export const prisma = _prisma as unknown as AnyPrismaClient;

// anyTeam: behouden voor backward compatibility met bestaande imports
export const anyTeam = _prisma.team as unknown as AnyModel;
