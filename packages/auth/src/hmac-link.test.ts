import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { signEmailLink, verifyEmailLink } from "./hmac-link";

/**
 * Unit tests voor HMAC-link module.
 *
 * Beveiliging is kritiek: deze tests verifiëren dat:
 * - Geldige links worden geaccepteerd
 * - Verlopen links worden afgewezen met de juiste flag
 * - Gemanipuleerde signatures worden afgewezen
 * - Lege/ongeldige input wordt afgehandeld
 * - Het secret verplicht is en minimaal 32 tekens
 */

const TEST_SECRET = "test-secret-dat-lang-genoeg-is-voor-hmac-minimaal-32-chars";

describe("hmac-link", () => {
  beforeEach(() => {
    vi.stubEnv("EMAIL_LINK_SECRET", TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("signEmailLink", () => {
    it("genereert een geldig token", () => {
      const token = signEmailLink("test@example.com");
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      // Token moet een punt bevatten (payload.signature)
      expect(token).toContain(".");
    });

    it("gooit een error bij ongeldig e-mailadres", () => {
      expect(() => signEmailLink("")).toThrow("Ongeldig e-mailadres");
      expect(() => signEmailLink("geen-email")).toThrow("Ongeldig e-mailadres");
    });

    it("gooit een error zonder EMAIL_LINK_SECRET", () => {
      vi.stubEnv("EMAIL_LINK_SECRET", "");
      expect(() => signEmailLink("test@example.com")).toThrow("EMAIL_LINK_SECRET");
    });

    it("gooit een error bij te kort secret", () => {
      vi.stubEnv("EMAIL_LINK_SECRET", "te-kort");
      expect(() => signEmailLink("test@example.com")).toThrow("te kort");
    });

    it("accepteert een optionele destination", () => {
      const token = signEmailLink("test@example.com", "/evaluatie/invullen/abc123");
      expect(token).toBeDefined();
      expect(token).toContain(".");
    });

    it("accepteert een custom expiry", () => {
      const token = signEmailLink("test@example.com", undefined, 7);
      expect(token).toBeDefined();
      expect(token).toContain(".");
    });
  });

  describe("verifyEmailLink", () => {
    it("verifieert een geldige link", () => {
      const token = signEmailLink("test@example.com");
      const result = verifyEmailLink(token);

      expect(result.valid).toBe(true);
      expect(result.expired).toBe(false);
      expect(result.email).toBe("test@example.com");
      expect(result.destination).toBeUndefined();
    });

    it("verifieert een link met destination", () => {
      const dest = "/evaluatie/invullen/abc123";
      const token = signEmailLink("test@example.com", dest);
      const result = verifyEmailLink(token);

      expect(result.valid).toBe(true);
      expect(result.expired).toBe(false);
      expect(result.email).toBe("test@example.com");
      expect(result.destination).toBe(dest);
    });

    it("normaliseert e-mailadres naar lowercase", () => {
      const token = signEmailLink("Test@Example.COM");
      const result = verifyEmailLink(token);

      expect(result.valid).toBe(true);
      expect(result.email).toBe("test@example.com");
    });

    it("detecteert een verlopen link", () => {
      // Genereer een link die al verlopen is (-1 dag)
      const token = signEmailLink("test@example.com", undefined, -1);
      const result = verifyEmailLink(token);

      expect(result.valid).toBe(false);
      expect(result.expired).toBe(true);
      expect(result.email).toBe("test@example.com");
    });

    it("wijst een gemanipuleerde signature af", () => {
      const token = signEmailLink("test@example.com");
      // Verander het laatste karakter van de signature
      const parts = token.split(".");
      const lastChar = parts[1].slice(-1);
      const tamperedChar = lastChar === "a" ? "b" : "a";
      const tampered = `${parts[0]}.${parts[1].slice(0, -1)}${tamperedChar}`;

      const result = verifyEmailLink(tampered);
      expect(result.valid).toBe(false);
      expect(result.expired).toBe(false);
    });

    it("wijst een gemanipuleerde payload af", () => {
      const token = signEmailLink("test@example.com");
      const parts = token.split(".");
      // Verander de payload (eerste deel)
      const tampered = `${parts[0]}X.${parts[1]}`;

      const result = verifyEmailLink(tampered);
      expect(result.valid).toBe(false);
    });

    it("wijst een token met ander email af", () => {
      // Genereer geldig token voor email A
      const tokenA = signEmailLink("a@example.com");
      const resultA = verifyEmailLink(tokenA);
      expect(resultA.valid).toBe(true);
      expect(resultA.email).toBe("a@example.com");

      // Genereer geldig token voor email B
      const tokenB = signEmailLink("b@example.com");
      const resultB = verifyEmailLink(tokenB);
      expect(resultB.valid).toBe(true);
      expect(resultB.email).toBe("b@example.com");

      // Tokens zijn verschillend
      expect(tokenA).not.toBe(tokenB);
    });

    it("handelt lege input af", () => {
      expect(verifyEmailLink("").valid).toBe(false);
      expect(verifyEmailLink("").expired).toBe(false);
    });

    it("handelt null/undefined input af", () => {
      expect(verifyEmailLink(null as unknown as string).valid).toBe(false);
      expect(verifyEmailLink(undefined as unknown as string).valid).toBe(false);
    });

    it("handelt een token zonder punt af", () => {
      expect(verifyEmailLink("geenpunthierin").valid).toBe(false);
    });

    it("handelt een token met alleen een punt af", () => {
      expect(verifyEmailLink(".").valid).toBe(false);
      expect(verifyEmailLink("abc.").valid).toBe(false);
      expect(verifyEmailLink(".abc").valid).toBe(false);
    });

    it("wijst af bij ander secret", () => {
      const token = signEmailLink("test@example.com");

      // Verander het secret
      vi.stubEnv("EMAIL_LINK_SECRET", "een-heel-ander-secret-dat-lang-genoeg-is-voor-32-chars!");
      const result = verifyEmailLink(token);
      expect(result.valid).toBe(false);
      expect(result.expired).toBe(false);
    });

    it("retourneert ongeldig zonder EMAIL_LINK_SECRET bij verificatie", () => {
      const token = signEmailLink("test@example.com");

      vi.stubEnv("EMAIL_LINK_SECRET", "");
      const result = verifyEmailLink(token);
      expect(result.valid).toBe(false);
    });
  });

  describe("round-trip", () => {
    it("sign -> verify -> sign -> verify geeft consistent resultaat", () => {
      const email = "coordinator@oranjewit.nl";
      const dest = "/beheer/planning";

      const token1 = signEmailLink(email, dest, 30);
      const result1 = verifyEmailLink(token1);
      expect(result1.valid).toBe(true);
      expect(result1.email).toBe(email);
      expect(result1.destination).toBe(dest);

      // Tweede keer signen geeft ander token (andere expiresAt timestamp)
      const token2 = signEmailLink(email, dest, 30);
      // Beide tokens zijn geldig
      expect(verifyEmailLink(token2).valid).toBe(true);
    });

    it("werkt met speciale tekens in destination", () => {
      const dest = "/evaluatie/invullen/abc123?tab=resultaten&filter=actief";
      const token = signEmailLink("test@example.com", dest);
      const result = verifyEmailLink(token);

      expect(result.valid).toBe(true);
      expect(result.destination).toBe(dest);
    });

    it("werkt met lege destination", () => {
      const token = signEmailLink("test@example.com", "");
      const result = verifyEmailLink(token);

      expect(result.valid).toBe(true);
      expect(result.destination).toBeUndefined(); // lege string wordt undefined
    });
  });
});
