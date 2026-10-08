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
          "pointer-events-auto mx-auto flex max-w-[1440px] items-center justify-between rounded-pill px-3 py-2 transition-all duration-500 ease-[var(--ease-out-expo)] md:px-4",
          scrolled || open
            ? "bg-cream/85 shadow-[0_10px_40px_-20px_rgba(74,14,14,0.45)] ring-1 ring-bordo/10 backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/kitty-icon.png"
            alt=""
            width={40}
            height={37}
            priority
            className="h-9 w-auto drop-shadow-sm transition-transform duration-500 ease-[var(--ease-bounce)] hover:rotate-[-8deg] hover:scale-110"
          />
          <span className="font-display text-xl leading-none text-ink md:text-2xl">
            nails<span className="ml-1 font-sans text-[10px] font-bold tracking-[0.18em] text-bordo uppercase">BF studio</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {nav.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-pill px-4 py-2 text-sm font-semibold transition-colors",
                  active ? "text-bordo" : "text-ink hover:text-bordo",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-pill bg-bordo/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {item.label}
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
              {nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-md px-4 py-4 font-display text-3xl text-ink hover:bg-cream-deep"
                  >
                    {item.label}
                    <Star size={18} className="text-bordo" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
