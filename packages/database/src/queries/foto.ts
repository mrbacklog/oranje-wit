/**
 * Gedeelde foto query — gebruikt door team-indeling, monitor en scouting apps.
 *
 * Retourneert de webp foto-bytes voor een lid, of null als er geen foto is.
 */

// Prisma client type — bewust ruim getypeerd vanwege Prisma 7 TS2321 workarounds in apps
type DB = any;

/**
 * Haal de webp foto op voor een lid via relCode.
 * Retourneert de foto-bytes of null als er geen foto is.
 */
export async function getFoto(db: DB, relCode: string): Promise<Buffer | null> {
  const foto = await db.lidFoto.findUnique({
    where: { relCode },
    select: { imageWebp: true },
  });

  if (!foto) return null;

  return foto.imageWebp as Buffer;
}
