import { test as base, expect } from "@playwright/test";

// Gedeelde test fixture met ingelogde gebruiker.
// Alle tests importeren `test` en `expect` vanuit dit bestand
// zodat ze automatisch de auth storageState gebruiken.
export const test = base.extend({});
export { expect };
