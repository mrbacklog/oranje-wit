"use server";

import { requireTC } from "@/lib/teamindeling/auth-check";
import { prisma } from "@/lib/teamindeling/db/prisma";
import { berekenAlleRatings } from "@/lib/teamindeling/rating";
import { HUIDIG_SEIZOEN } from "@oranje-wit/types";

export async function herbereken() {
  await requireTC();
  return berekenAlleRatings(HUIDIG_SEIZOEN, prisma);
}
