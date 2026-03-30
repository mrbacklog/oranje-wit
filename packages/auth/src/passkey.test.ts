import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  challengeStore,
  generateRegistrationOpts,
  generateAuthenticationOpts,
  verifyAndSaveRegistration,
  verifyAuthentication,
  setPasskeyDb,
  type PasskeyDbOperations,
} from "./passkey";

/**
 * Unit tests voor de passkey service module.
 *
 * Tests controleren:
 * - Challenge generatie en opslag in de in-memory store
 * - Registratie-opties bevatten correcte RP informatie
 * - Authenticatie-opties worden correct gegenereerd
 * - Challenge TTL (verlopen challenges worden afgewezen)
 * - Challenge consumptie (single-use)
 */

// Mock de @simplewebauthn/server functies
vi.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: vi.fn().mockResolvedValue({
    challenge: "test-challenge-registratie",
    rp: { name: "c.k.v. Oranje Wit", id: "localhost" },
    user: { id: "user-id", name: "test@example.com", displayName: "Test" },
    pubKeyCredParams: [],
    timeout: 60000,
    attestation: "none",
    excludeCredentials: [],
  }),
  verifyRegistrationResponse: vi.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credential: {
        id: "cred-123",
        publicKey: new Uint8Array([1, 2, 3]),
        counter: 0,
        transports: ["internal"],
      },
      credentialDeviceType: "singleDevice",
      credentialBackedUp: false,
    },
  }),
  generateAuthenticationOptions: vi.fn().mockResolvedValue({
    challenge: "test-challenge-authenticatie",
    rpId: "localhost",
    allowCredentials: [],
    timeout: 60000,
    userVerification: "preferred",
  }),
  verifyAuthenticationResponse: vi.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: {
      credentialID: "cred-123",
      newCounter: 1,
      userVerified: true,
      credentialDeviceType: "singleDevice",
      credentialBackedUp: false,
    },
  }),
}));

// Mock DB-operaties
const mockDb: PasskeyDbOperations = {
  findByGebruikerId: vi.fn().mockResolvedValue([]),
  findByCredentialId: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue(undefined),
  updateCounterAndLastUsed: vi.fn().mockResolvedValue(undefined),
  findGebruikerByEmail: vi.fn().mockResolvedValue(null),
};

describe("passkey", () => {
  beforeEach(() => {
    vi.stubEnv("NEXTAUTH_URL", "http://localhost:3000");
    challengeStore.clear();
    setPasskeyDb(mockDb);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    challengeStore.clear();
  });

  // ============================================================
  // Challenge store
  // ============================================================

  describe("challenge store", () => {
    it("slaat challenge op bij registratie-opties generatie", async () => {
      await generateRegistrationOpts("user-1", "test@example.com", "Test User");

      expect(challengeStore.size).toBe(1);
      expect(challengeStore.has("user-1")).toBe(true);

      const stored = challengeStore.get("user-1")!;
      expect(stored.challenge).toBe("test-challenge-registratie");
      expect(stored.expiresAt).toBeGreaterThan(Date.now());
    });

    it("slaat challenge op bij authenticatie-opties generatie", async () => {
      await generateAuthenticationOpts("test@example.com");

      expect(challengeStore.size).toBe(1);
    });

    it("consumeert challenge na gebruik (single-use)", async () => {
      await generateRegistrationOpts("user-1", "test@example.com", "Test User");
      expect(challengeStore.size).toBe(1);

      // Eerste verificatie consumeert de challenge
      await verifyAndSaveRegistration("user-1", {} as never);
      expect(challengeStore.size).toBe(0);
    });

    it("weigert verlopen challenge", async () => {
      // Handmatig een verlopen challenge toevoegen
      challengeStore.set("user-expired", {
        challenge: "old-challenge",
        expiresAt: Date.now() - 1000, // 1 seconde geleden verlopen
      });

      const result = await verifyAndSaveRegistration("user-expired", {} as never);
      expect(result.verified).toBe(false);
      expect(result.error).toContain("verlopen");
    });

    it("weigert niet-bestaande challenge", async () => {
      const result = await verifyAndSaveRegistration("nonexistent", {} as never);
      expect(result.verified).toBe(false);
      expect(result.error).toContain("niet gevonden");
    });
  });

  // ============================================================
  // Registratie
  // ============================================================

  describe("generateRegistrationOpts", () => {
    it("bevat correcte RP informatie", async () => {
      const { generateRegistrationOptions } = await import("@simplewebauthn/server");

      await generateRegistrationOpts("user-1", "test@example.com", "Test User");

      expect(generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpName: "c.k.v. Oranje Wit",
          rpID: "localhost",
          userName: "test@example.com",
          userDisplayName: "Test User",
        })
      );
    });

    it("gebruikt hostname uit NEXTAUTH_URL als RP ID", async () => {
      vi.stubEnv("NEXTAUTH_URL", "https://ckvoranjewit.app");

      const { generateRegistrationOptions } = await import("@simplewebauthn/server");

      await generateRegistrationOpts("user-1", "test@example.com", "Test User");

      expect(generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: "ckvoranjewit.app",
        })
      );
    });

    it("sluit bestaande passkeys uit (geen dubbele registratie)", async () => {
      vi.mocked(mockDb.findByGebruikerId).mockResolvedValueOnce([
        {
          credentialId: "existing-cred",
          credentialPublicKey: Buffer.from([1, 2, 3]),
          counter: BigInt(5),
          credentialDeviceType: "singleDevice",
          credentialBackedUp: false,
          transports: ["internal"],
        },
      ]);

      const { generateRegistrationOptions } = await import("@simplewebauthn/server");

      await generateRegistrationOpts("user-1", "test@example.com", "Test User");

      expect(generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          excludeCredentials: [{ id: "existing-cred", transports: ["internal"] }],
        })
      );
    });
  });

  describe("verifyAndSaveRegistration", () => {
    it("slaat passkey op in database bij succesvolle verificatie", async () => {
      // Genereer eerst opties om een challenge te hebben
      await generateRegistrationOpts("user-1", "test@example.com", "Test User");

      const result = await verifyAndSaveRegistration("user-1", {} as never, "iPhone");

      expect(result.verified).toBe(true);
      expect(mockDb.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gebruikerId: "user-1",
          credentialId: "cred-123",
          deviceName: "iPhone",
        })
      );
    });
  });

  // ============================================================
  // Authenticatie
  // ============================================================

  describe("generateAuthenticationOpts", () => {
    it("genereert opties zonder email (discoverable credentials)", async () => {
      const result = await generateAuthenticationOpts();

      expect(result.options).toBeDefined();
      expect(result.challengeKey).toBeDefined();
      expect(challengeStore.size).toBe(1);
    });

    it("zoekt passkeys op bij opgegeven email", async () => {
      vi.mocked(mockDb.findGebruikerByEmail).mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        naam: "Test",
      });
      vi.mocked(mockDb.findByGebruikerId).mockResolvedValueOnce([
        {
          credentialId: "cred-456",
          credentialPublicKey: Buffer.from([4, 5, 6]),
          counter: BigInt(0),
          credentialDeviceType: "singleDevice",
          credentialBackedUp: false,
          transports: ["internal"],
        },
      ]);

      const { generateAuthenticationOptions } = await import("@simplewebauthn/server");

      await generateAuthenticationOpts("test@example.com");

      expect(mockDb.findGebruikerByEmail).toHaveBeenCalledWith("test@example.com");
      expect(generateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: [{ id: "cred-456", transports: ["internal"] }],
        })
      );
    });
  });

  describe("verifyAuthentication", () => {
    it("weigert als passkey niet in database staat", async () => {
      challengeStore.set("test-key", {
        challenge: "challenge-123",
        expiresAt: Date.now() + 60000,
      });

      vi.mocked(mockDb.findByCredentialId).mockResolvedValueOnce(null);

      const result = await verifyAuthentication({ id: "unknown-cred" } as never, "test-key");

      expect(result.verified).toBe(false);
      expect(result.error).toContain("niet gevonden");
    });

    it("update counter en lastUsedAt bij succesvolle authenticatie", async () => {
      challengeStore.set("test-key", {
        challenge: "challenge-123",
        expiresAt: Date.now() + 60000,
      });

      vi.mocked(mockDb.findByCredentialId).mockResolvedValueOnce({
        id: "pk-1",
        gebruikerId: "user-1",
        credentialId: "cred-123",
        credentialPublicKey: Buffer.from([1, 2, 3]),
        counter: BigInt(0),
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
        transports: ["internal"],
        gebruiker: { email: "test@example.com" },
      });

      const result = await verifyAuthentication({ id: "cred-123" } as never, "test-key");

      expect(result.verified).toBe(true);
      if (result.verified) {
        expect(result.gebruiker.email).toBe("test@example.com");
      }
      expect(mockDb.updateCounterAndLastUsed).toHaveBeenCalledWith(
        "pk-1",
        BigInt(1),
        expect.any(Date)
      );
    });

    it("weigert verlopen challenge bij authenticatie", async () => {
      challengeStore.set("expired-key", {
        challenge: "old-challenge",
        expiresAt: Date.now() - 1000,
      });

      const result = await verifyAuthentication({ id: "cred-123" } as never, "expired-key");

      expect(result.verified).toBe(false);
      expect(result.error).toContain("verlopen");
    });
  });
});
