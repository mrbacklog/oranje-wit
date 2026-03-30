/**
 * WebAuthn/Passkey service voor c.k.v. Oranje Wit.
 *
 * Server-side functies voor het registreren en authenticeren van passkeys.
 * Gebruikt @simplewebauthn/server voor de WebAuthn-ceremonie.
 *
 * Challenge-opslag: in-memory Map met 5-minuten TTL.
 * Dit is voldoende voor een single-instance deployment (Railway).
 */

import {
  generateRegistrationOptions as _generateRegistrationOptions,
  verifyRegistrationResponse as _verifyRegistrationResponse,
  generateAuthenticationOptions as _generateAuthenticationOptions,
  verifyAuthenticationResponse as _verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { logger } from "@oranje-wit/types";

// ============================================================
// RP configuratie
// ============================================================

function getRpId(): string {
  const url = process.env.NEXTAUTH_URL;
  if (!url) return "localhost";
  try {
    return new URL(url).hostname;
  } catch {
    return "localhost";
  }
}

function getExpectedOrigin(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

const RP_NAME = "c.k.v. Oranje Wit";

// ============================================================
// Challenge store — in-memory met TTL
// ============================================================

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minuten

interface StoredChallenge {
  challenge: string;
  expiresAt: number;
}

/** In-memory challenge store, geëxporteerd voor testing */
export const challengeStore = new Map<string, StoredChallenge>();

function storeChallenge(userId: string, challenge: string): void {
  challengeStore.set(userId, {
    challenge,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  });
}

function consumeChallenge(userId: string): string | null {
  const stored = challengeStore.get(userId);
  if (!stored) return null;

  challengeStore.delete(userId);

  if (Date.now() > stored.expiresAt) {
    logger.warn("Passkey challenge verlopen", { userId });
    return null;
  }

  return stored.challenge;
}

/** Periodiek opruimen van verlopen challenges */
function cleanExpired(): void {
  const now = Date.now();
  for (const [key, value] of challengeStore.entries()) {
    if (now > value.expiresAt) {
      challengeStore.delete(key);
    }
  }
}

// Opruimen elke 10 minuten
if (typeof setInterval !== "undefined") {
  setInterval(cleanExpired, 10 * 60 * 1000).unref?.();
}

// ============================================================
// Database interface — geïnjecteerd door de app
// ============================================================

export interface PasskeyRecord {
  credentialId: string;
  credentialPublicKey: Buffer | Uint8Array;
  counter: bigint | number;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  transports: string[];
}

export interface PasskeyDbOperations {
  findByGebruikerId: (gebruikerId: string) => Promise<PasskeyRecord[]>;
  findByCredentialId: (credentialId: string) => Promise<
    | (PasskeyRecord & {
        id: string;
        gebruikerId: string;
        gebruiker: { email: string };
      })
    | null
  >;
  create: (data: {
    gebruikerId: string;
    credentialId: string;
    credentialPublicKey: Buffer;
    counter: bigint;
    credentialDeviceType: string;
    credentialBackedUp: boolean;
    transports: string[];
    deviceName?: string;
  }) => Promise<void>;
  updateCounterAndLastUsed: (id: string, counter: bigint, lastUsedAt: Date) => Promise<void>;
  findGebruikerByEmail: (
    email: string
  ) => Promise<{ id: string; email: string; naam: string } | null>;
}

let dbOps: PasskeyDbOperations | null = null;

/**
 * Registreer de database-operaties voor passkeys.
 * Moet door de app worden aangeroepen bij initialisatie.
 */
export function setPasskeyDb(ops: PasskeyDbOperations): void {
  dbOps = ops;
}

function getDb(): PasskeyDbOperations {
  if (!dbOps) {
    throw new Error(
      "Passkey DB niet geconfigureerd — roep setPasskeyDb() aan bij app-initialisatie"
    );
  }
  return dbOps;
}

// ============================================================
// Registratie
// ============================================================

/**
 * Genereer WebAuthn registratie-opties voor een gebruiker.
 * Vereist dat de gebruiker al ingelogd is (userId moet bekend zijn).
 */
export async function generateRegistrationOpts(userId: string, email: string, displayName: string) {
  const db = getDb();
  const existingPasskeys = await db.findByGebruikerId(userId);

  const options = await _generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpId(),
    userName: email,
    userDisplayName: displayName,
    // Voorkom dubbele registratie van hetzelfde authenticator
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      // Voorkeur voor platform authenticator (vingerafdruk, Face ID)
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "preferred",
    },
    // Geen attestation nodig — we vertrouwen op het authenticator-type
    attestationType: "none",
  });

  // Sla challenge op
  storeChallenge(userId, options.challenge);

  return options;
}

/**
 * Verifieer de registratie-response en sla de passkey op in de database.
 */
export async function verifyAndSaveRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  deviceName?: string
) {
  const challenge = consumeChallenge(userId);
  if (!challenge) {
    return { verified: false, error: "Challenge verlopen of niet gevonden" };
  }

  try {
    const verification = await _verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getRpId(),
      requireUserVerification: false, // niet alle devices ondersteunen UV
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { verified: false, error: "Verificatie mislukt" };
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Sla op in database
    const db = getDb();
    await db.create({
      gebruikerId: userId,
      credentialId: credential.id,
      credentialPublicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      credentialDeviceType,
      credentialBackedUp,
      transports: (credential.transports ?? []) as string[],
      deviceName,
    });

    logger.info("Passkey geregistreerd", { userId, credentialDeviceType });

    return { verified: true };
  } catch (error) {
    logger.warn("Passkey registratie mislukt", error);
    return {
      verified: false,
      error: error instanceof Error ? error.message : "Onbekende fout bij registratie",
    };
  }
}

// ============================================================
// Authenticatie
// ============================================================

/**
 * Genereer WebAuthn authenticatie-opties.
 * Als email is opgegeven, worden alleen de passkeys van die gebruiker aangeboden.
 * Anders: lege allowCredentials (discoverable credentials).
 */
export async function generateAuthenticationOpts(email?: string) {
  const db = getDb();
  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined;

  if (email) {
    const gebruiker = await db.findGebruikerByEmail(email);
    if (gebruiker) {
      const passkeys = await db.findByGebruikerId(gebruiker.id);
      if (passkeys.length > 0) {
        allowCredentials = passkeys.map((pk) => ({
          id: pk.credentialId,
          transports: pk.transports as AuthenticatorTransportFuture[],
        }));
      }
    }
  }

  const options = await _generateAuthenticationOptions({
    rpID: getRpId(),
    allowCredentials,
    userVerification: "preferred",
  });

  // Challenge opslaan onder email of een fallback key
  const challengeKey = email ?? `anon-${options.challenge.substring(0, 8)}`;
  storeChallenge(challengeKey, options.challenge);

  return { options, challengeKey };
}

/**
 * Verifieer de authenticatie-response.
 * Retourneert de gebruiker-gegevens bij succes.
 */
export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
  challengeKey: string
) {
  const challenge = consumeChallenge(challengeKey);
  if (!challenge) {
    return { verified: false as const, error: "Challenge verlopen of niet gevonden" };
  }

  const db = getDb();

  // Zoek de passkey op basis van het credential ID in de response
  const credentialId = response.id;
  const passkey = await db.findByCredentialId(credentialId);
  if (!passkey) {
    return { verified: false as const, error: "Passkey niet gevonden" };
  }

  try {
    const verification = await _verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: [getRpId()],
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.credentialPublicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      return { verified: false as const, error: "Authenticatie mislukt" };
    }

    // Update counter en lastUsedAt
    await db.updateCounterAndLastUsed(
      passkey.id,
      BigInt(verification.authenticationInfo.newCounter),
      new Date()
    );

    logger.info("Passkey authenticatie geslaagd", {
      gebruikerId: passkey.gebruikerId,
    });

    return {
      verified: true as const,
      gebruiker: {
        id: passkey.gebruikerId,
        email: passkey.gebruiker.email,
      },
    };
  } catch (error) {
    logger.warn("Passkey authenticatie mislukt", error);
    return {
      verified: false as const,
      error: error instanceof Error ? error.message : "Onbekende fout bij authenticatie",
    };
  }
}
