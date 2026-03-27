"use server";

import { requireEditor } from "@/lib/teamindeling/auth-check";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { berekenAlleRatings } from "@/lib/teamindeling/rating";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export async function herbereken() {
  await requireEditor();
  return berekenAlleRatings(HUIDIG_SEIZOEN, prisma);
}
