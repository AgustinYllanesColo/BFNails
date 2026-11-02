"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import type { AdminSession } from "@/lib/admin/auth";
import {
  IconBuilder,
  IconCharm,
  IconClose,
  IconCosts,
  IconExternal,
  IconHome,
  IconKit,
  IconMakeup,
  IconMenu,
  IconNails,
  IconOrders,
  IconPromo,
  IconSettings,
  IconSupplies,
} from "./icons";

type NavLink = { href: string; label: string; Icon: (p: { className?: string }) => React.ReactNode };

/**
 * Menú del panel en grupos con nombre de lo que hace cada uno: lo de todos los días arriba (inicio y pedidos), después
 * lo que se vende, después los números. En el celular es un botón "Menú" que abre la lista completa: antes era una fila
 * que se corría de costado y la mitad de las secciones no se veía.
 */
const GROUPS: Array<{ title?: string; links: NavLink[] }> = [
  {
    links: [
      { href: "/admin", label: "Inicio", Icon: IconHome },
      { href: "/admin/pedidos", label: "Pedidos", Icon: IconOrders },
    ],
  },
  {
    title: "Lo que vendés",
    links: [
      { href: "/admin/catalogo", label: "Uñas", Icon: IconNails },
      { href: "/admin/maquillaje", label: "Maquillaje", Icon: IconMakeup },
      { href: "/admin/dijes", label: "Dijes", Icon: IconCharm },
      { href: "/admin/promos", label: "Promos", Icon: IconPromo },
      { href: "/admin/kit", label: "Kit de colocación", Icon: IconKit },
    ],
  },
  {
    title: "Precios y costos",
    links: [
      { href: "/admin/armador", label: "Precios del armador", Icon: IconBuilder },
      { href: "/admin/insumos", label: "Insumos", Icon: IconSupplies },
      { href: "/admin/costos", label: "Costos y margen", Icon: IconCosts },
    ],
  },
  { links: [{ href: "/admin/configuracion", label: "Configuración", Icon: IconSettings }] },
];
const ALL = GROUPS.flatMap((g) => g.links);

function isActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({ children, session, dbReady }: { children: React.ReactNode; session: AdminSession; dbReady: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = ALL.find((l) => isActive(l.href, pathname));

  const nav = (
    <nav aria-label="Secciones del panel" className="space-y-5">
      {GROUPS.map((g, i) => (
        <div key={i}>
          {g.title && <p className="mb-1.5 px-3 text-xs font-semibold text-ink-soft">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.links.map(({ href, label, Icon }) => {
              const active = isActive(href, pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md px-3 text-[15px] font-semibold transition-colors duration-150",
                      active ? "bg-bordo text-cream" : "text-ink hover:bg-bordo/10",
                    )}
                  >
                    <Icon className={cn("shrink-0", active ? "opacity-100" : "opacity-60")} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-2 text-sm text-ink-soft">
      {session.dev && <p className="rounded bg-yellow/40 px-2 py-1 text-ink">Modo desarrollo (sin login)</p>}
      {!dbReady && <p className="rounded bg-red/10 px-2 py-1 text-red">Sin base de datos: no se guardan cambios</p>}
      <Link href="/" target="_blank" className="flex min-h-11 items-center gap-2 px-3 font-semibold text-bordo">
        Ver la tienda <IconExternal className="size-4" />
      </Link>
      {!session.dev && (
        <form action="/admin/auth/logout" method="post">
          <button className="min-h-11 px-3 font-semibold underline underline-offset-4">Cerrar sesión</button>
        </form>
      )}
    </div>
  );

  const logo = (
    <Link href="/admin" className="flex items-center gap-2">
      <Image src="/brand/kitty-icon.png" alt="" width={32} height={30} className="h-8 w-auto" />
      <span className="font-title text-xl">
        Panel <span className="text-bordo">BF</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-screen bg-cream text-ink md:grid md:grid-cols-[248px_1fr]">
      {/* compu: barra lateral fija */}
      <aside className="hidden border-r border-bordo/10 bg-cream-deep/60 p-4 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-y-auto">
        {logo}
        <div className="mt-6 flex-1">{nav}</div>
        <div className="mt-6 border-t border-bordo/10 pt-4">{footer}</div>
      </aside>

      {/* celular: barra arriba con la sección actual y el botón Menú */}
      <header className="sticky top-0 z-30 border-b border-bordo/10 bg-cream/95 backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          {logo}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="admin-menu"
            className="flex min-h-11 items-center gap-2 rounded-pill bg-bordo px-4 text-sm font-semibold text-cream"
          >
            {open ? <IconClose className="size-5" /> : <IconMenu className="size-5" />}
            {open ? "Cerrar" : current ? current.label : "Menú"}
          </button>
        </div>
        {open && (
          // tocar una sección cierra el menú
          <div id="admin-menu" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)} className="max-h-[calc(100svh-3.5rem)] overflow-y-auto overscroll-contain border-t border-bordo/10 px-3 pt-4 pb-6">
            {nav}
            <div className="mt-5 border-t border-bordo/10 pt-3">{footer}</div>
          </div>
        )}
      </header>

      <main className="min-w-0 p-4 pb-16 md:p-8">{children}</main>
    </div>
  );
}
