"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { nav, siteConfig } from "@/lib/site";
import { cn } from "@/lib/format";
import { useHydrated, useReducedMotion } from "@/lib/hooks";
import { EASE, MQ, lockScroll, unlockScroll } from "@/lib/motion-core";
import { useCart } from "@/lib/store/cart";
import { waLink } from "@/lib/whatsapp";
import { CartButton } from "@/components/cart/CartButton";
import { CART_BUMP_EVENT } from "@/components/motion/FlyToCart";
import { LogoStar } from "@/components/brand/LogoStar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";

/** La píldora aparece al pasar los 24 px de scroll (lo que le gusta al dueño; no cambiar). */
const PILL_AT = 24;
/** La Kitty saluda si se sube más de 300 px "de golpe" (en menos de 700 ms)… */
const WAVE_UP_PX = 300;
const WAVE_UP_MS = 700;
/** …o cuando la ficha aterriza en la bolsita. Como mucho una vez cada 12 s. */
const WAVE_EVERY_MS = 12_000;

const MENU = [...nav, { href: "/carrito", label: "Carrito" }] as const;
const WA_HELLO = "Hola Bren! Te escribo desde la web 🐱";

/**
 * Nav fijo (PLAN W2-A.5). Transparente arriba de todo; pasando los 24 px se vuelve una píldora de vidrio crema
 * (`rgb(254 247 231 / .94)` + blur 16 + saturate 1.2: el ÚNICO `backdrop-filter` del sitio). La píldora mide lo mismo
 * en los dos estados: su borde de abajo es `--nav-h` (72 / 84 px), que usan los sticky y el scroll a anclas.
 *
 * - Lockup: la Kitty (saludo en el `span`, hover en la imagen: dos nodos) + el "nails" real del logo + "BF STUDIO".
 * - Desktop: links con `aria-current` y la píldora activa compartida (`layoutId`).
 * - Celular: hamburguesa que se cruza en 200 ms; panel que sale de la esquina del botón (220 ms, sale en 140 ms),
 *   ítems escalonados, el activo con la estrella del logo, y una fila final con WhatsApp, Instagram y TikTok.
 *   Abierto: foco al primer link, scroll de la página bloqueado, el resto de la página `inert`, Esc cierra y devuelve
 *   el foco a la hamburguesa.
 */
export function Nav() {
  const pathname = usePathname();
  // El menú se cierra solo al cambiar de ruta: guardamos en qué ruta se abrió.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt !== null && openAt === pathname;
  const [scrolled, setScrolled] = useState(false);
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));

  const burgerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  /** Al cerrar, ¿el foco vuelve a la hamburguesa? (no cuando se eligió un link: la página nueva manda). */
  const returnFocus = useRef(true);

  const close = useCallback(() => setOpenAt(null), []);
  const toggle = () => setOpenAt((at) => (at === pathname ? null : pathname));

  /* ---- Saludo de la Kitty ---- */
  const [kitty, animateKitty] = useAnimate<HTMLSpanElement>();
  const lastWave = useRef(-Infinity);
  const wave = useCallback(() => {
    if (!kitty.current || window.matchMedia(MQ.reduced).matches) return;
    const now = performance.now();
    if (now - lastWave.current < WAVE_EVERY_MS) return;
    lastWave.current = now;
    animateKitty(
      kitty.current,
      { rotate: [0, -12, 7, -3, 0] },
      { duration: 0.9, times: [0, 0.22, 0.5, 0.76, 1], ease: "easeInOut" },
    );
  }, [kitty, animateKitty]);

  useEffect(() => {
    window.addEventListener(CART_BUMP_EVENT, wave);
    return () => window.removeEventListener(CART_BUMP_EVENT, wave);
  }, [wave]);

  /* ---- Píldora (umbral 24 px) y subida rápida ---- */
  useEffect(() => {
    let anchor = { y: window.scrollY, t: performance.now() };
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > PILL_AT);
      const t = performance.now();
      // El ancla sigue al punto más bajo reciente: "de golpe" = 300 px para arriba en menos de 700 ms.
      if (y >= anchor.y || t - anchor.t > WAVE_UP_MS) anchor = { y, t };
      else if (anchor.y - y > WAVE_UP_PX) {
        wave();
        anchor = { y, t };
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [wave]);

  /* ---- Menú abierto: foco, scroll bloqueado, inert, Esc ---- */
  useEffect(() => {
    if (!open) return;
    returnFocus.current = true;
    lockScroll();
    const inerted: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>("#contenido, footer").forEach((el) => {
      if (el.hasAttribute("inert")) return;
      el.setAttribute("inert", "");
      inerted.push(el);
    });
    const raf = requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true }),
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      close();
    };
    // Si la ventana pasa a desktop con el menú abierto, se cierra (el panel es solo del celular).
    const wide = window.matchMedia("(min-width: 768px)");
    const onWide = () => {
      if (!wide.matches) return;
      returnFocus.current = false;
      close();
    };
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    const burger = burgerRef.current;
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      inerted.forEach((el) => el.removeAttribute("inert"));
      unlockScroll();
      if (returnFocus.current && burger?.isConnected) burger.focus({ preventScroll: true });
    };
  }, [open, close]);

  if (pathname?.startsWith("/admin")) return null;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");
  const solid = scrolled || open;
  const items = hydrated ? count : 0;

  // Con reduced-motion el panel y los ítems solo funden (MotionConfig no atenúa cadenas de `transform`).
  const panelFrom = reduced
    ? { opacity: 0 }
    : { opacity: 0, transform: "translateY(-6px) scale(0.97)" };
  const panelTo = reduced ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px) scale(1)" };
  const panelOut = reduced
    ? { opacity: 0 }
    : { opacity: 0, transform: "translateY(-4px) scale(0.98)" };
  const itemFrom = reduced ? { opacity: 0 } : { opacity: 0, transform: "translateY(6px)" };
  const itemTo = reduced ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-[var(--nav-pad-x)] pt-[var(--nav-pad-top)]">
      <div
        data-nav-pill=""
        data-solid={solid || undefined}
        className={cn(
          "rounded-pill pointer-events-auto mx-auto flex max-w-[1440px] items-center justify-between gap-3 py-1.5 pr-2 pl-1 transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-[var(--ease-ui)] md:pr-3 md:pl-3",
          solid
            ? "ring-line bg-[rgb(254_247_231/0.94)] shadow-md ring-1 backdrop-blur-[16px] backdrop-saturate-[1.2]"
            : "bg-transparent",
        )}
      >
        <Link
          href="/"
          aria-label="BF Nails Studio, inicio"
          className="group rounded-pill flex shrink-0 items-center gap-2.5 pr-3 pl-2"
        >
          {/* Saludo (useAnimate) en el span; hover en la imagen: dos nodos, dos transformaciones */}
          <span ref={kitty} className="inline-block origin-bottom">
            <Image
              src="/brand/kitty.webp"
              alt=""
              width={47}
              height={56}
              loading="eager"
              className="block h-12 w-auto transition-[rotate,scale] duration-300 ease-[var(--ease-bounce)] group-hover:scale-110 group-hover:rotate-[-8deg] md:h-14"
            />
          </span>
          <span className="flex flex-col gap-[3px]">
            <Image
              src="/brand/wordmark-nails.webp"
              alt=""
              width={79}
              height={36}
              loading="eager"
              className="block h-[30px] w-auto md:h-9"
            />
            <span className="text-ink font-sans text-[10.5px] leading-none font-semibold tracking-[0.12em] uppercase md:text-[11.5px]">
              BF Studio
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-pill relative px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                  active ? "text-bordo" : "text-ink hover:text-bordo",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="bg-bordo/10 rounded-pill absolute inset-0 -z-10"
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
            ref={burgerRef}
            type="button"
            onClick={toggle}
            className="rounded-pill bg-bordo text-cream hover:bg-bordo-soft grid size-11 place-items-center transition-[background-color,scale] duration-200 ease-[var(--ease-ui)] active:scale-[0.97] active:duration-100 md:hidden"
            aria-expanded={open}
            aria-controls="menu-movil"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            <span aria-hidden className="relative block h-3 w-5">
              <span
                className={cn(
                  "absolute inset-x-0 top-0 h-0.5 rounded bg-current transition-[translate,rotate] duration-200 ease-[var(--ease-ui)]",
                  open && "translate-y-[5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-0.5 rounded bg-current transition-[translate,rotate] duration-200 ease-[var(--ease-ui)]",
                  open && "-translate-y-[5px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="scrim"
            aria-hidden
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE.ui } }}
            exit={{ opacity: 0, transition: { duration: 0.14, ease: EASE.ui } }}
            className="bg-ink/30 pointer-events-auto fixed inset-0 -z-10 md:hidden"
          />
        )}
        {open && (
          <motion.nav
            key="panel"
            ref={panelRef}
            id="menu-movil"
            aria-label="Menú"
            data-lenis-prevent=""
            initial={panelFrom}
            animate={{ ...panelTo, transition: { duration: 0.22, ease: EASE.ui } }}
            exit={{ ...panelOut, transition: { duration: 0.14, ease: EASE.ui } }}
            style={{ transformOrigin: "top right" }}
            className="bg-cream ring-line pointer-events-auto mx-auto mt-2 max-h-[calc(100svh-var(--nav-h)-1rem)] max-w-[1440px] overflow-y-auto overscroll-contain rounded-lg p-2 shadow-lg ring-1 md:hidden"
          >
            <ul className="flex flex-col gap-0.5">
              {MENU.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <motion.li
                    key={item.href}
                    initial={itemFrom}
                    animate={{
                      ...itemTo,
                      transition: { duration: 0.22, ease: EASE.ui, delay: 0.03 + i * 0.04 },
                    }}
                  >
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        returnFocus.current = false;
                        close();
                      }}
                      className={cn(
                        "font-display text-h3 flex min-h-14 items-center justify-between gap-3 rounded-md px-4 transition-colors duration-150",
                        active
                          ? "bg-cream-deep text-bordo"
                          : "text-ink active:bg-cream-deep hover:bg-cream-deep/60",
                      )}
                    >
                      <span>
                        {item.label}
                        {item.href === "/carrito" && items > 0 ? (
                          <span className="sr-only">{`, ${items} ${items === 1 ? "set" : "sets"}`}</span>
                        ) : null}
                      </span>
                      <span className="flex items-center gap-2.5">
                        {item.href === "/carrito" && items > 0 ? (
                          <span
                            aria-hidden
                            className="bg-red text-cream rounded-pill grid h-6 min-w-6 place-items-center px-1.5 font-sans text-[13px] leading-none font-bold tabular-nums"
                          >
                            {items}
                          </span>
                        ) : null}
                        {active ? <LogoStar size={18} tilt /> : null}
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            <motion.div
              initial={itemFrom}
              animate={{
                ...itemTo,
                transition: { duration: 0.22, ease: EASE.ui, delay: 0.03 + MENU.length * 0.04 },
              }}
              className="border-line mt-2 grid grid-cols-[1fr_auto_auto] items-center gap-2 border-t px-1 pt-3 pb-1"
            >
              <Button
                href={waLink(WA_HELLO)}
                target="_blank"
                rel="noopener noreferrer"
                size="md"
                iconLeft="whatsapp"
                className="px-5"
              >
                Escribile a Bren
              </Button>
              <a
                href={siteConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram de BF Nails"
                className="rounded-pill bg-cream-deep text-bordo hover:bg-bordo hover:text-cream grid size-12 place-items-center transition-[background-color,color,scale] duration-200 ease-[var(--ease-ui)] active:scale-[0.97]"
              >
                <Icon name="instagram" size={24} />
              </a>
              <a
                href={siteConfig.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok de BF Nails"
                className="rounded-pill bg-cream-deep text-bordo hover:bg-bordo hover:text-cream grid size-12 place-items-center transition-[background-color,color,scale] duration-200 ease-[var(--ease-ui)] active:scale-[0.97]"
              >
                <Icon name="tiktok" size={24} />
              </a>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
