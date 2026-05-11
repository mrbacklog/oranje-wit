import { test as base, expect } from "@playwright/test";

/**
 * Gedeelde test fixture voor TI Studio v2.
 *
 * Voegt Basic-Auth headers toe via de playwright.config.ts extraHTTPHeaders.
 * Alle tests importeren `test` en `expect` vanuit dit bestand
 * zodat ze automatisch de auth storageState en Basic-Auth headers gebruiken.
 */
export const test = base.extend({});
export { expect };
