"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { nav } from "@/lib/site";
import { cn } from "@/lib/format";
import { CartButton } from "@/components/cart/CartButton";
import { Star } from "@/components/motion/Marquee";

export function Nav() {
  const pathname = usePathname();
  // El menú se cierra solo al cambiar de ruta: guardamos en qué ruta se abrió.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const setOpen = (v: boolean | ((prev: boolean) => boolean)) =>
    setOpenAt((prev) => ((typeof v === "function" ? v(prev === pathname) : v) ? pathname : null));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5 md:pt-4">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-[1440px] items-center justify-between rounded-pill px-3 py-1.5 transition-all duration-500 ease-[var(--ease-out-expo)] md:px-5",
          scrolled || open
            ? "bg-cream/85 shadow-[0_10px_40px_-20px_rgba(74,14,14,0.45)] ring-1 ring-bordo/10 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <Image
            src="/brand/kitty.webp"
            alt=""
            width={51}
            height={60}
            preload
            loading="eager"
            className="h-12 w-auto transition-transform duration-500 ease-[var(--ease-bounce)] group-hover:rotate-[-8deg] group-hover:scale-110 md:h-14"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.9rem] leading-[0.9] text-ink md:text-[2.3rem]">nails</span>
            <span className="font-sans text-[10px] font-bold tracking-[0.22em] text-bordo uppercase md:text-[11px]">BF Studio</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const hi = Boolean(item.highlight);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold transition-colors",
                  hi
                    ? "text-lip hover:text-bordo"
                    : active
                      ? "text-bordo"
                      : "text-ink hover:text-bordo",
                )}
              >
                {/* el destacado (maquillaje) lleva su pastilla rosa siempre; la activa se desliza por encima */}
                {hi && !active && <span aria-hidden className="absolute inset-0 -z-20 rounded-pill bg-blush/70 ring-1 ring-rose/25" />}
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className={cn("absolute inset-0 -z-10 rounded-pill", hi ? "bg-blush ring-1 ring-rose/40" : "bg-bordo/10")}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {item.label}
                {item.highlight && <NewPill>{item.highlight}</NewPill>}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <CartButton />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-pill bg-bordo text-cream md:hidden"
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            <span className="relative block h-3 w-5">
              <span
                className={cn(
                  "absolute inset-x-0 top-0 h-0.5 rounded bg-current transition-transform duration-300",
                  open && "top-[5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-0.5 rounded bg-current transition-transform duration-300",
                  open && "bottom-[5px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto mx-auto mt-2 max-w-[1440px] rounded-lg bg-cream p-3 shadow-[0_30px_60px_-30px_rgba(74,14,14,0.5)] ring-1 ring-bordo/10 md:hidden"
            aria-label="Menú"
          >
            <ul className="flex flex-col">
              {[...nav]
                .sort((a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)))
                .map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    className={item.highlight ? "mb-2" : undefined}
                  >
                    {item.highlight ? (
                      <Link
                        href={item.href}
                        className="bg-blush text-lip ring-rose/25 relative flex items-center justify-between overflow-hidden rounded-md px-4 py-5 ring-1 transition-transform duration-150 active:scale-[0.97]"
                      >
                        <span className="flex items-center gap-3">
                          <span className="font-title text-4xl">{item.label}</span>
                          <NewPill>{item.highlight}</NewPill>
                        </span>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </Link>
                    ) : (
                      <Link
                        href={item.href}
                        className="flex items-center justify-between rounded-md px-4 py-3.5 font-title text-3xl text-ink transition-transform duration-150 hover:bg-cream-deep active:scale-[0.97]"
                      >
                        {item.label}
                        <Star size={18} className="text-bordo" />
                      </Link>
                    )}
                  </motion.li>
                ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Pastillita "Nuevo" del ítem destacado del menú. */
function NewPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill bg-lip text-cream inline-flex items-center px-1.5 py-0.5 font-sans text-[10px] leading-none font-bold tracking-wide uppercase">
      {children}
    </span>
  );
}
