import { prisma } from "@/lib/teamindeling/db/prisma";
import { auth } from "@oranje-wit/auth";

/**
 * Haalt de User.id op van de huidige sessie via email-lookup.
 * Gooit als er geen sessie of email is — gebruik alleen achter requireTC()/guardTC().
 */
export async function huidigeUserId(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Geen sessie of email");
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  });
  return user.id;
}
