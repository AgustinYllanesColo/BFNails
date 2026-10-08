import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/auth";
import { supabaseConfigured } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  const { error } = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm rounded-lg bg-white/80 p-8 ring-1 ring-bordo/10">
        <Image src="/brand/kitty-icon.png" alt="" width={48} height={45} className="h-12 w-auto" />
        <h1 className="mt-4 font-display text-3xl">Panel de Bren</h1>
        <p className="mt-1 text-sm text-ink-soft">Te mandamos un link mágico a tu email.</p>
        {error && <p className="mt-3 rounded bg-red/10 p-2 text-sm text-red">{decodeURIComponent(error)}</p>}
        {supabaseConfigured() ? (
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
