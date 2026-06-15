"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "ti-preview";
const WACHTWOORD = "1kw1ler1n";

export async function checkWachtwoord(formData: FormData) {
  const invoer = formData.get("wachtwoord");
  if (invoer === WACHTWOORD) {
    (await cookies()).set(COOKIE, "ok", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dagen
      path: "/teamindeling",
    });
    redirect("/teamindeling");
  }
  redirect("/teamindeling?fout=1");
}

export async function isGeldig(): Promise<boolean> {
  return (await cookies()).get(COOKIE)?.value === "ok";
}
