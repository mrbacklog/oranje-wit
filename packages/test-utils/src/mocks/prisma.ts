import { vi } from "vitest";

/**
 * Maakt een volledig gemockte Prisma client aan.
 * Alle modellen hebben standaard vi.fn() voor elke operatie.
 */
function mockModel() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findUniqueOrThrow: vi.fn().mockRejectedValue(new Error("Record not found")),
    findFirst: vi.fn().mockResolvedValue(null),
    findFirstOrThrow: vi.fn().mockRejectedValue(new Error("Record not found")),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn(),
    groupBy: vi.fn().mockResolvedValue([]),
  };
}

export function createMockPrisma() {
  return {
    // Monitor-domein (snake_case tabellen)
    lid: mockModel(),
    lidFoto: mockModel(),
    seizoen: mockModel(),
    oWTeam: mockModel(),
    teamPeriode: mockModel(),
    teamAlias: mockModel(),
    competitieSpeler: mockModel(),
    competitieRonde: mockModel(),
    ledenverloop: mockModel(),
    cohortSeizoen: mockModel(),
    signalering: mockModel(),
    streefmodel: mockModel(),
    poolStand: mockModel(),
    poolStandRegel: mockModel(),

    // Team-Indeling-domein (PascalCase tabellen)
    user: mockModel(),
    speler: mockModel(),
    staf: mockModel(),
    stafToewijzing: mockModel(),
    blauwdruk: mockModel(),
    werkindeling: mockModel(),
    pin: mockModel(),
    concept: mockModel(),
    scenario: mockModel(),
    versie: mockModel(),
    team: mockModel(),
    selectieGroep: mockModel(),
    selectieSpeler: mockModel(),
    selectieStaf: mockModel(),
    teamSpeler: mockModel(),
    teamStaf: mockModel(),
    evaluatie: mockModel(),
    logEntry: mockModel(),
    import: mockModel(),
    referentieTeam: mockModel(),
    werkitem: mockModel(),
    actiepunt: mockModel(),
    activiteit: mockModel(),

    // Evaluatie-domein
    evaluatieRonde: mockModel(),
    coordinator: mockModel(),
    coordinatorTeam: mockModel(),
    evaluatieUitnodiging: mockModel(),
    spelerZelfEvaluatie: mockModel(),
    emailTemplate: mockModel(),

    // Overig
    mijlpaal: mockModel(),

    // Raw queries
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(0),
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn({})),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
