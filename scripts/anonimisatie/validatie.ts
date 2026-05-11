/**
 * Env-validatie en post-anonimisatie integriteitschecks.
 *
 * Veiligheid: het script weigert te draaien als DATABASE_URL_TARGET
 * lijkt op de productie-database. Detectie gebeurt op hostname-patronen
 * (railway.app, ckvoranjewit, oranjewit) en op een expliciete
 * waarschuwingsstring ("production").
 */

/**
 * Lijkt deze URL op de productie-database?
 * We zijn bewust streng: bij twijfel weigeren.
 */
export function lijktOpProductie(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  // Bekende productie-indicatoren
  const verdachtePatronen = [
    "railway.app",
    "rlwy.net",
    "ckvoranjewit",
    "oranjewit",
    "production",
    "prod-",
    ".prod.",
  ];
  return verdachtePatronen.some((p) => lower.includes(p));
}

/**
 * Valideer dat ANON_SALT is ingesteld en lang genoeg.
 */
export function valideerSalt(salt: string | undefined): asserts salt is string {
  if (!salt || salt.length < 16) {
    throw new Error(
      "ANON_SALT moet ingesteld zijn in .env.local en minstens 16 tekens lang. " +
        "Genereer met: openssl rand -hex 32"
    );
  }
}

/**
 * Valideer alle env-vars die het script nodig heeft. Throwt bij fouten.
 */
export function valideerEnv(): { sourceUrl: string; targetUrl: string; salt: string } {
  const sourceUrl = process.env.DATABASE_URL_SOURCE;
  const targetUrl = process.env.DATABASE_URL_TARGET;
  const salt = process.env.ANON_SALT;

  if (!sourceUrl) {
    throw new Error("DATABASE_URL_SOURCE ontbreekt in .env.local");
  }
  if (!targetUrl) {
    throw new Error("DATABASE_URL_TARGET ontbreekt in .env.local");
  }
  if (lijktOpProductie(targetUrl)) {
    throw new Error(
      "Weigering: DATABASE_URL_TARGET lijkt op productie. " +
        "Wijs naar een aparte test-database (bijv. localhost of studio-test-db)."
    );
  }
  valideerSalt(salt);

  return { sourceUrl, targetUrl, salt };
}

/**
 * Generieke vorm voor integriteitscheck-uitkomsten.
 */
export interface IntegriteitsCheckResult {
  naam: string;
  ok: boolean;
  detail?: string;
}
