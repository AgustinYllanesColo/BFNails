"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import type { AdminSession } from "@/lib/admin/auth";

const LINKS = [
  { href: "/admin", label: "Resumen", icon: "◆" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "✦" },
  { href: "/admin/catalogo", label: "Catálogo", icon: "✿" },
  { href: "/admin/armador", label: "Armador", icon: "✧" },
  { href: "/admin/insumos", label: "Insumos", icon: "⬢" },
  { href: "/admin/costos", label: "Costos y margen", icon: "%" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙" },
];

export function AdminShell({ children, session, dbReady }: { children: React.ReactNode; session: AdminSession; dbReady: boolean }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-cream text-ink md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-bordo/10 bg-cream-deep/60 p-4 md:sticky md:top-0 md:h-screen md:border-r md:border-b-0">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/brand/kitty-icon.png" alt="" width={32} height={30} className="h-8 w-auto" />
          <span className="font-display text-xl">
            nails <span className="font-sans text-[10px] font-bold tracking-[0.18em] text-bordo uppercase">admin</span>
          </span>
        </Link>
        <nav className="mt-6 flex gap-1 overflow-x-auto md:flex-col" aria-label="Admin">
          {LINKS.map((l) => {
            const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                  active ? "bg-bordo text-cream" : "hover:bg-bordo/10",
                )}
              >
                <span className="w-4 text-center opacity-70">{l.icon}</span>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 hidden text-xs text-ink-soft md:block">
          <p className="truncate">{session.email}</p>
          {session.dev && <p className="mt-1 rounded bg-yellow/40 px-2 py-1 text-ink">Modo desarrollo (sin login)</p>}
          {!dbReady && <p className="mt-1 rounded bg-red/10 px-2 py-1 text-red">Sin base de datos: solo lectura de datos locales</p>}
          <Link href="/" className="mt-3 block underline underline-offset-4">
            Ver el sitio →
          </Link>
          {!session.dev && (
            <form action="/admin/auth/logout" method="post">
              <button className="mt-2 underline underline-offset-4">Cerrar sesión</button>
            </form>
          )}
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
