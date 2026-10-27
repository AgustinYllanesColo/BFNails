import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import { supabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/LoginForm";
import { passwordLoginEnabled } from "@/lib/admin/password";
import { loginWithPassword } from "./actions";
import { inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  const { error } = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm rounded-lg bg-white/80 p-8 ring-1 ring-bordo/10">
        <Image src="/brand/kitty-icon.png" alt="" width={48} height={45} className="h-12 w-auto" />
        <h1 className="mt-4 font-title text-3xl">Panel de Bren</h1>
        <p className="mt-1 text-sm text-ink-soft">{passwordLoginEnabled() ? "Entrá con la clave del panel." : "Te mandamos un link mágico a tu email."}</p>
        {error && <p className="mt-3 rounded bg-red/10 p-2 text-sm text-red">{decodeURIComponent(error)}</p>}
        {passwordLoginEnabled() && (
          <form action={loginWithPassword} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-ink" htmlFor="password">
              Clave del panel
            </label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        )}
        {/* con clave configurada, la clave es la única puerta; el link por mail queda solo para una instalación sin clave */}
        {passwordLoginEnabled() ? null : supabaseConfigured() ? (
          <LoginForm />
        ) : (
          <p className="mt-4 rounded bg-yellow/30 p-3 text-sm">
            Supabase no está configurado. En producción el admin queda cerrado; en desarrollo entrás directo.
          </p>
        )}
      </div>
    </div>
  );
}
