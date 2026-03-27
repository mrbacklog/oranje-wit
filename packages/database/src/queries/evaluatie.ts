/**
 * Gedeelde evaluatie queries — gebruikt door beheer-app en evaluatie-app.
 *
 * Elke functie accepteert een db-client als eerste parameter (dependency injection)
 * zodat zowel server actions als API routes hun eigen client/singleton kunnen meegeven.
 *
 * Het db-type is bewust `any` omdat apps de Prisma client casten naar
 * vereenvoudigde types (AnyPrismaClient / PrismaFn) als workaround voor
 * Prisma 7 TS2321 recursie. De queries werken runtime correct ongeacht de cast.
 * Expliciete return types garanderen type-veiligheid voor consumers.
 */

// Prisma client type — bewust ruim getypeerd vanwege Prisma 7 TS2321 workarounds in apps
type DB = any;

// ── Return types (expliciet, niet afgeleid) ───────────────────

export interface EvaluatieRondeMetCounts {
  id: string;
  seizoen: string;
  ronde: number;
  naam: string;
  type: string;
  deadline: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    uitnodigingen: number;
    evaluaties: number;
  };
}

export interface CoordinatorTeamRow {
  id: string;
  coordinatorId: string;
  owTeamId: number;
  seizoen: string;
  owTeam: {
    id: number;
    naam: string;
    seizoen: string;
    owCode: string;
  };
}

export interface CoordinatorMetTeams {
  id: string;
  naam: string;
  email: string;
  createdAt: Date;
  teams: CoordinatorTeamRow[];
}

export interface EmailTemplateRow {
  id: string;
  sleutel: string;
  onderwerp: string;
  inhoudHtml: string;
  updatedAt: Date;
}

// ── Input types ───────────────────────────────────────────────

export interface CreateRondeInput {
  seizoen: string;
  ronde: number;
  naam: string;
  type: string;
  deadline: Date;
}

export interface CreateCoordinatorInput {
  naam: string;
  email: string;
}

export interface UpdateTemplateInput {
  onderwerp?: string;
  inhoudHtml?: string;
}

// ── Result type ───────────────────────────────────────────────

export type QueryResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

// ── Rondes ────────────────────────────────────────────────────

/**
 * Alle evaluatierondes met counts, gesorteerd op seizoen en ronde (nieuwste eerst).
 */
export async function getRondes(db: DB): Promise<EvaluatieRondeMetCounts[]> {
  return db.evaluatieRonde.findMany({
    orderBy: [{ seizoen: "desc" }, { ronde: "desc" }],
    include: {
      _count: {
        select: {
          uitnodigingen: true,
          evaluaties: true,
        },
      },
    },
  });
}

/**
 * Maak een nieuwe evaluatieronde met duplicaat-check.
 */
export async function createRonde(
  db: DB,
  input: CreateRondeInput
): Promise<QueryResult<{ id: string }>> {
  const bestaand = await db.evaluatieRonde.findFirst({
    where: {
      seizoen: input.seizoen,
      ronde: input.ronde,
      type: input.type,
    },
  });
  if (bestaand) {
    return { ok: false, error: "Deze ronde bestaat al voor dit seizoen/type" };
  }

  const ronde = await db.evaluatieRonde.create({
    data: {
      seizoen: input.seizoen,
      ronde: input.ronde,
      naam: input.naam,
      type: input.type,
      deadline: input.deadline,
      status: "concept",
    },
  });

  return { ok: true, data: { id: ronde.id } };
}

/**
 * Wijzig de status van een ronde (concept | actief | gesloten).
 */
export async function updateRondeStatus(
  db: DB,
  id: string,
  status: "concept" | "actief" | "gesloten"
): Promise<QueryResult> {
  await db.evaluatieRonde.update({
    where: { id },
    data: { status },
  });
  return { ok: true, data: undefined };
}

// ── Coordinatoren ─────────────────────────────────────────────

/**
 * Alle coordinatoren met hun teamkoppelingen en OWTeam data.
 */
export async function getCoordinatoren(db: DB): Promise<CoordinatorMetTeams[]> {
  return db.coordinator.findMany({
    orderBy: { naam: "asc" },
    include: {
      teams: {
        include: {
          owTeam: {
            select: { id: true, naam: true, seizoen: true, owCode: true },
          },
        },
        orderBy: { seizoen: "desc" },
      },
    },
  });
}

/**
 * Maak een nieuwe coordinator met duplicaat-check op email.
 */
export async function createCoordinator(
  db: DB,
  input: CreateCoordinatorInput
): Promise<QueryResult<{ id: string }>> {
  const email = input.email.toLowerCase();

  const bestaand = await db.coordinator.findUnique({
    where: { email },
  });
  if (bestaand) {
    return { ok: false, error: "Dit e-mailadres is al in gebruik" };
  }

  const coordinator = await db.coordinator.create({
    data: {
      naam: input.naam,
      email,
    },
  });

  return { ok: true, data: { id: coordinator.id } };
}

/**
 * Update een coordinator (naam en/of email).
 */
export async function updateCoordinator(
  db: DB,
  id: string,
  data: Partial<CreateCoordinatorInput>
): Promise<QueryResult<{ id: string }>> {
  const updateData: Partial<CreateCoordinatorInput> = {};
  if (data.naam !== undefined) updateData.naam = data.naam;
  if (data.email !== undefined) updateData.email = data.email.toLowerCase();

  const coordinator = await db.coordinator.update({
    where: { id },
    data: updateData,
  });

  return { ok: true, data: { id: coordinator.id } };
}

/**
 * Verwijder een coordinator.
 */
export async function deleteCoordinator(db: DB, id: string): Promise<QueryResult> {
  await db.coordinator.delete({ where: { id } });
  return { ok: true, data: undefined };
}

// ── Templates ─────────────────────────────────────────────────

/**
 * Alle e-mail templates, gesorteerd op sleutel.
 */
export async function getTemplates(db: DB): Promise<EmailTemplateRow[]> {
  return db.emailTemplate.findMany({
    orderBy: { sleutel: "asc" },
  });
}

/**
 * Update een bestaand template (onderwerp en/of inhoudHtml).
 */
export async function updateTemplate(
  db: DB,
  id: string,
  data: UpdateTemplateInput
): Promise<QueryResult> {
  await db.emailTemplate.update({
    where: { id },
    data,
  });
  return { ok: true, data: undefined };
}
