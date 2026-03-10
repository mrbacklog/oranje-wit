"use server";

import { requireEditor } from "@/lib/auth-check";
import { prisma } from "@/lib/db/prisma";
import { berekenAlleRatings } from "@/lib/rating";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export async function herbereken() {
  await requireEditor();
  return berekenAlleRatings(HUIDIG_SEIZOEN, prisma);
}
