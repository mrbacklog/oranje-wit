import { auth } from "@oranje-wit/auth";
import { redirect } from "next/navigation";
import { AppLauncher } from "./app-launcher";

export default async function PortaalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as { role?: string }).role ?? "VIEWER";

  return <AppLauncher userName={session.user.name ?? "Gebruiker"} userRole={userRole} />;
}
