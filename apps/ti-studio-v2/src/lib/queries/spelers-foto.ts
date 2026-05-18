import { db } from "@/lib/db";

export async function getSpelersMetFoto(
  relCodes: string[],
): Promise<Set<string>> {
  if (relCodes.length === 0) return new Set();
  const rows = await db.$queryRaw<{ rel_code: string }[]>`
    SELECT rel_code FROM lid_fotos
    WHERE rel_code = ANY(${relCodes}::text[])
    AND octet_length(image_webp) > 100
  `;
  return new Set(rows.map((r: { rel_code: string }) => r.rel_code));
}
