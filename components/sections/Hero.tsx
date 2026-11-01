"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { gsap } from "gsap";
import { Magnetic } from "@/components/motion/Magnetic";
import { HeroPhotos } from "@/components/motion/HeroPhotos";
import { useOffscreenPause } from "@/components/motion/useOffscreenPause";
import { Button } from "@/components/ui/Button";
import { MakeupVisual } from "@/components/makeup/MakeupArt";
import type { MakeupProduct } from "@/lib/data/makeup";

/**
 * Hero: el logo real de BF Studio, grande y centrado, sobre un halo cálido, con fotos reales de sets
 * alrededor como stickers. Una sola intro corta (logo, fotos, copy) y después nada corre por
 * cuadro: ni filas de texto en movimiento ni parallax atado al scroll. Lo único vivo es una
 * flotación suave del logo, en CSS.
 *
 * Vida sin peso (todo transform/opacity, en CSS salvo el mouse): las fotos se reparten desde el logo y flotan
 * cada una a su ritmo, un brillo de top coat barre el logo cada ~7 s, el titular rota lo que vende y, con
 * mouse, logo y fotos se corren a distinta profundidad.
 *
 * La intro es CSS (`hero-in-*` en globals.css) y arranca desde el primer cuadro pintado: con GSAP el
 * contenido llegaba visible del servidor, se escondía al hidratar y volvía a aparecer (parpadeo al recargar).
 */
/**
 * Debajo de "Uñas y maquillaje" rota lo que vende cada línea, alternando: uñas en bordó, maquillaje en labial.
 * Frases cortas y de hechos (lo que hay en la tienda), nada de promesas.
 */
const WORDS: Array<{ text: string; tone: "nails" | "makeup" }> = [
  { text: "press-on a tu talle", tone: "nails" },
  { text: "labiales, glosses y máscaras", tone: "makeup" },
  { text: "hechas a mano por mí", tone: "nails" },
  { text: "rubores, bases y brochas", tone: "makeup" },
];
const WORD_MS = 2600;

/**
 * Stickers de maquillaje entre las fotos de uñas: el dibujo de cada producto, hasta tener fotos. Son otros que los de
 * la puerta de Maquillaje y los destacados de la vitrina, así la home no repite.
 */
const MAKEUP_STICKERS: Array<{ id: string; pos: string; rotate: number; depth: number; bob: number; delay: number }> = [
  { id: "labial-matte-barra", pos: "left-[-2%] top-[45%] w-[clamp(64px,18vw,88px)] md:left-[13%] md:top-[70%] md:w-[clamp(96px,8vw,128px)]", rotate: -9, depth: -30, bob: 7.6, delay: 560 },
  { id: "pestanas-50d-naez", pos: "right-[-2%] top-[48%] w-[clamp(64px,18vw,88px)] md:right-[12%] md:top-[71%] md:w-[clamp(96px,8vw,128px)]", rotate: 8, depth: -40, bob: 6.8, delay: 650 },
  { id: "set-brochas", pos: "hidden md:block md:left-[22%] md:top-[11%] md:w-[clamp(84px,6.5vw,108px)]", rotate: 10, depth: -22, bob: 8.4, delay: 470 },
];
/**
 * `makeup`: los productos públicos (vienen del servidor, sin código de proveedor). Si un producto de los stickers se
 * borra o se desactiva, su sticker no aparece.
 */
export function Hero({ makeup }: { makeup: MakeupProduct[] }) {

  const root = useRef<HTMLElement>(null);
  // Fuera de pantalla se congelan la flotación, el brillo y la palabra que rota (data-paused + globals.css)
  const inView = useOffscreenPause(root);

  // Profundidad con el mouse (solo puntero fino): cada [data-depth] se corre proporcional a su número.
  // quickTo: una sola curva interrumpible por capa, sin tweens acumulados.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches)
      return;
    const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", el).map((n) => {
      const d = Number(n.dataset.depth) || 0;
      return {
        d,
        x: gsap.quickTo(n, "x", { duration: 1, ease: "power3.out" }),
        y: gsap.quickTo(n, "y", { duration: 1, ease: "power3.out" }),
      };
    });
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      for (const l of layers) {
        l.x(nx * l.d);
        l.y(ny * l.d * 0.6);
      }
    };
    const leave = () => layers.forEach((l) => (l.x(0), l.y(0)));
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section
      ref={root}
      className="relative isolate flex min-h-[86svh] flex-col items-center justify-center overflow-hidden pt-24 pb-20 md:min-h-[100svh] md:pt-28 md:pb-28"
    >
      {/* Fondo: halo cálido, estático */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute top-1/2 left-1/2 size-[90vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,167,195,0.3)_0%,rgba(201,160,99,0.12)_38%,rgba(254,247,231,0)_66%)]" />
      </div>
      <HeroPhotos className="-z-10" />
      <MakeupStickers makeup={makeup} />

      {/* Logo real: flota apenas, en CSS */}
      <div data-hero-logo className="hero-in-logo relative z-10 w-[min(88vw,760px)]">
        <div data-depth="14">
          <div className="relative motion-safe:animate-[float_7s_ease-in-out_infinite]">
            <Image
              src="/brand/logo-nails.webp"
              alt="BF Studio nails"
              width={960}
              height={580}
              preload
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 768px) 760px, 88vw"
              className="w-full drop-shadow-[0_30px_50px_rgba(74,14,14,0.22)]"
            />
            <span aria-hidden className="hero-sheen-mask">
              <span className="hero-sheen" />
            </span>
          </div>
        </div>
      </div>

      {/* Copy + CTAs */}
      <div data-hero-copy className="hero-in-copy relative mt-6 max-w-3xl px-5 text-center md:mt-8">
        <h1 className="text-ink">
          <span className="sr-only">
            Uñas y maquillaje: press-on a tu talle, hechas a mano por mí; labiales, glosses, máscaras, rubores, bases y brochas
          </span>
          <span aria-hidden className="block">
            <span className="font-display block text-[2.6rem] leading-[1.02] md:text-6xl">
              Uñas y <span className="text-lip">maquillaje</span>
            </span>
            <RotatingWord inView={inView} />
          </span>
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <Button href="/maquillaje" size="lg" data-cursor="ver" className="bg-lip! hover:bg-bordo!">
              Ver maquillaje
            </Button>
          </Magnetic>
          <Magnetic>
            <Button href="/catalogo" size="lg" variant="secondary" data-cursor="ver">
              Ver uñas
            </Button>
          </Magnetic>
        </div>
      </div>

      <div
        data-hero-cue
        aria-hidden
        className="hero-in-cue text-ink-soft absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold tracking-[0.25em] uppercase"
      >
        deslizá
        <span className="bg-bordo/15 block h-10 w-px overflow-hidden">
          <span className="bg-bordo block h-1/2 w-full motion-safe:animate-[cue_1.8s_ease-in-out_infinite]" />
        </span>
      </div>
    </section>
  );
}

/**
 * La línea que rota debajo de "Uñas y maquillaje". Va en su propio componente para que el cambio de palabra cada 2,6 s
 * vuelva a renderizar solo esta línea y no el hero entero (fotos, stickers, logo). No rota con reduced-motion, con la
 * pestaña oculta ni con el hero fuera de pantalla. Todas las frases van apiladas en la misma celda: el alto es fijo y
 * nada salta.
 */
function RotatingWord({ inView }: { inView: RefObject<boolean> }) {
  const [word, setWord] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible" && inView.current) setWord((w) => (w + 1) % WORDS.length);
    }, WORD_MS);
    return () => window.clearInterval(id);
  }, [inView]);
  return (
    <span className="font-title mt-2 grid overflow-hidden pb-[0.12em] text-center text-xl md:mt-3 md:text-2xl">
      {WORDS.map((w, i) => (
        <span
          key={i === word ? `${w.text}-on` : w.text}
          className={
            i === word
              ? `hero-word [grid-area:1/1] ${w.tone === "makeup" ? "text-lip" : "text-bordo"}`
              : "invisible [grid-area:1/1]"
          }
        >
          {w.text}
        </span>
      ))}
    </span>
  );
}

/**
 * Dos o tres productos de maquillaje como stickers (placa rubor con borde blanco), con la misma entrada y flotación que
 * las fotos de uñas: salen de atrás del logo y flotan. Decorativos.
 */
function MakeupStickers({ makeup }: { makeup: MakeupProduct[] }) {
  const STICKER_PRODUCTS = MAKEUP_STICKERS.map((s) => ({ ...s, product: makeup.find((m) => m.id === s.id) })).filter(
    (s): s is typeof s & { product: MakeupProduct } => Boolean(s.product),
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {STICKER_PRODUCTS.map((s, i) => (
        <div key={s.id} className={`absolute ${s.pos}`}>
          <div data-depth={s.depth}>
            <div
              className="hero-deal"
              style={{ ["--fx" as string]: "0px", ["--fy" as string]: "-14svh", animationDelay: `${s.delay}ms` }}
            >
              <div
                className="hero-bob"
                style={{
                  animation: `hero-bob ${s.bob}s ease-in-out ${-i * 2.1}s infinite`,
                  ["--sway" as string]: `${s.rotate > 0 ? -2.5 : 2.5}deg`,
                }}
              >
                <div
                  className="ring-lip/10 rounded-[18px] bg-white p-1.5 shadow-[0_18px_40px_-18px_rgba(142,31,61,0.5)] ring-1 md:rounded-[22px] md:p-2"
                  style={{ transform: `rotate(${s.rotate}deg)` }}
                >
                  <div className="overflow-hidden rounded-[13px] md:rounded-[16px]">
                    <MakeupVisual product={s.product} sizes="(min-width: 768px) 128px, 92px" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
