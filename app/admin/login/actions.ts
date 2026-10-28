"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, checkPassword, issueToken, passwordLoginEnabled } from "@/lib/admin/password";

export async function loginWithPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordLoginEnabled() || !checkPassword(password)) {
    // cada intento fallido tarda: probar claves a mano o con un script se vuelve muy lento
    await new Promise((r) => setTimeout(r, 1500));
    redirect(`/admin/login?error=${encodeURIComponent("Clave incorrecta")}`);
  }
  const token = issueToken();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: token.maxAge });
  redirect("/admin");
}
