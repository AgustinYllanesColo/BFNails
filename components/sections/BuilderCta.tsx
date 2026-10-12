"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AmbientZone } from "@/components/motion/AmbientZone";
import { Brush } from "@/components/motion/Brush";
import { Magnetic } from "@/components/motion/Magnetic";
import { NailPreview } from "@/components/builder/NailPreview";
import { Heading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { NailSwatch } from "@/components/ui/NailSwatch";
import { Price } from "@/components/ui/Price";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { DEFAULT_BUILDER_CONFIG as CFG, quoteSelection } from "@/lib/pricing";
import type { BuilderSelection, Shape } from "@/lib/types";
import { useReducedMotion, useVisibleInterval } from "@/lib/hooks";
import { EASE, MQ, isInViewportNow, registerEases } from "@/lib/motion";
import { cn } from "@/lib/format";
import "./home.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Cinco sets de muestra que la demo recorre sola (con el precio real del motor). */
const DEMO: BuilderSelection[] = [
  { shape: "almendra", length: "medio", finish: "glossy", base: "nude", extras: ["francesita"] },
  { shape: "coffin", length: "largo", finish: "cromado", base: "bordo", extras: ["strass"] },
  { shape: "ovalada", length: "corto", finish: "glossy", base: "rosa", extras: ["3d", "glitter"] },
  { shape: "stiletto", length: "xl", finish: "glossy", base: "negro", extras: ["cat-eye", "charms"] },
  { shape: "cuadrada", length: "medio", finish: "mate", base: "milky", extras: ["animal-print", "personajes"] },
];

const SHAPES = CFG.shapes;
const COLORS = CFG.bases.slice(0, 5);

/** Autoplay: 2,6 s por set; con reduced-motion, más lento. El primer cambio llega 900 ms después de "levantarse". */
const STEP_MS = 2600;
const STEP_MS_REDUCED = 4000;
const FIRST_MS = 900;

const labelOf = <T extends { id: string; label: string }>(list: T[], id?: string) =>
  list.find((o) => o.id === id)?.label;
/** Sin la aclaración entre paréntesis: "Strass (hasta 10)" → "Strass" (el chip es un resumen). */
const short = (label?: string) => label?.replace(/\s*\(.*\)\s*$/, "");

function chipsOf(sel: BuilderSelection) {
  const out: Array<{ key: string; label: string }> = [];
  const push = (key: string, label?: string) => {
    if (label) out.push({ key, label });
  };
  push(`shape-${sel.shape}`, labelOf(CFG.shapes, sel.shape));
  push(`len-${sel.length}`, labelOf(CFG.lengths, sel.length));
  push(`base-${sel.base}`, labelOf(CFG.bases, sel.base));
  if (sel.finish !== "glossy") push(`fin-${sel.finish}`, labelOf(CFG.finishes, sel.finish));
  for (const x of sel.extras) push(`x-${x}`, short(labelOf(CFG.extras, x)));
  return out;
}

/**
 * Teaser del armador (PLAN §4 W2-B.5): la tarjeta "en vivo" se levanta de la mesa al scrollear (rotateX + subida desde
 * md; sin perspectiva sobre el canvas 3D en el celular), la Kitty asoma por detrás y la demo recorre cinco sets con el
 * precio que rueda como odómetro. Abajo, "tu turno": forma y color para probar; al tocar uno la demo se detiene para
 * siempre y la invitación pasa al armador.
 *
 * Autoplay (`useVisibleInterval`): solo con la tarjeta en pantalla, la pestaña visible y sin la pausa manual; además
 * se frena con el puntero o el foco adentro de la tarjeta y con el botón de pausa. Fuera de vista no hay ni un cambio
 * de selección: la vista previa 3D no recibe mutaciones (su render loop ya se duerme solo fuera de vista).
 */
export function BuilderCta() {
  const frame = useRef<HTMLDivElement>(null);
  const lift = useRef<HTMLDivElement>(null);
  const peek = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const step = reduced ? STEP_MS_REDUCED : STEP_MS;

  const [index, setIndex] = useState(0);
  const [custom, setCustom] = useState<BuilderSelection | null>(null);
  const [paused, setPaused] = useState(false);

  // El autoplay lee estas condiciones sin volver a armar el intervalo.
  const started = useRef(false);
  const hovered = useRef(false);
  const pausedRef = useRef(false);
  const customRef = useRef(false);
  const lastChange = useRef(0);
  useEffect(() => {
    pausedRef.current = paused;
    customRef.current = custom !== null;
  }, [paused, custom]);

  const sel = custom ?? DEMO[index];
  const quote = quoteSelection(sel, CFG);
  const chips = chipsOf(sel);

  const advance = useCallback(
    (force = false) => {
      if (!started.current || hovered.current || pausedRef.current || customRef.current) return;
      // Doble seguro: nunca cambiar la selección con la tarjeta fuera de pantalla.
      if (!isInViewportNow(frame.current)) return;
      const now = performance.now();
      if (!force && now - lastChange.current < step * 0.8) return;
      lastChange.current = now;
      setIndex((v) => (v + 1) % DEMO.length);
    },
    [step],
  );
  const tick = useCallback(() => advance(), [advance]);
  useVisibleInterval(tick, step, frame, { threshold: 0.4 });

  // Arranque: cuando el levantado termina (o al entrar, con reduced-motion), primer cambio a los 900 ms.
  const firstTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    lastChange.current = performance.now();
    clearTimeout(firstTimer.current);
    firstTimer.current = setTimeout(() => advance(true), FIRST_MS);
  }, [advance]);
  useEffect(() => () => clearTimeout(firstTimer.current), []);

  // Puntero o foco adentro de la tarjeta: la demo espera.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const on = () => {
      hovered.current = true;
    };
    const off = (e: Event) => {
      if (e.type === "focusout" && el.contains((e as FocusEvent).relatedTarget as Node | null)) return;
      hovered.current = false;
      lastChange.current = performance.now(); // al soltar, un intervalo entero antes del próximo cambio
    };
    el.addEventListener("pointerenter", on);
    el.addEventListener("pointerleave", off);
    el.addEventListener("focusin", on);
    el.addEventListener("focusout", off);
    return () => {
      el.removeEventListener("pointerenter", on);
      el.removeEventListener("pointerleave", off);
      el.removeEventListener("focusin", on);
      el.removeEventListener("focusout", off);
    };
  }, []);

  // Levantarse + Kitty que asoma
  useEffect(() => {
    const card = lift.current;
    const kitty = peek.current;
    if (!card || !kitty) return;
    registerEases();
    const mm = gsap.matchMedia();
    mm.add(
      {
        desk: `(min-width: 768px) and ${MQ.full}`,
        mobile: `(max-width: 767px) and ${MQ.full}`,
        reduced: MQ.reduced,
      },
      (ctx) => {
        const { desk, reduced: r } = ctx.conditions as Record<string, boolean>;
        if (isInViewportNow(card)) {
          start();
          return;
        }
        if (r) {
          gsap.set(card, { autoAlpha: 0 });
          gsap.to(card, {
            autoAlpha: 1,
            duration: 0.3,
            ease: "power1.out",
            clearProps: "opacity,visibility",
            onComplete: start,
            scrollTrigger: { trigger: card, start: "top 85%", once: true },
          });
          return;
        }
        const from = desk
          ? { rotateX: 14, y: 80, scale: 0.94, transformPerspective: 1200, transformOrigin: "50% 100%" }
          : { y: 60, scale: 0.96, transformOrigin: "50% 100%" };
        const to = desk ? { rotateX: 0, y: 0, scale: 1 } : { y: 0, scale: 1 };
        gsap.fromTo(card, from, {
          ...to,
          ease: "none",
          immediateRender: false,
          onUpdate(this: gsap.core.Tween) {
            if (this.progress() > 0.999) start();
          },
          scrollTrigger: { trigger: card, start: "top 95%", end: "top 55%", scrub: 0.5 },
        });
        gsap.fromTo(
          kitty,
          { yPercent: 60 },
          {
            yPercent: 0,
            duration: 0.7,
            ease: "back.out(1.4)",
            scrollTrigger: { trigger: card, start: "top 80%", once: true },
          },
        );
      },
    );
    return () => mm.revert();
  }, [start]);

  const pick = (patch: Partial<BuilderSelection>) => {
    setCustom({ ...sel, ...patch });
  };

  return (
    <AmbientZone
      as="section"
      id="armador"
      aria-labelledby="armador-titulo"
      className="bg-cream-deep relative overflow-x-clip py-[var(--section-y-peak)]"
    >
      <div className="container-x grid items-center gap-x-16 gap-y-10 [grid-template-areas:'head'_'frame'_'cta'] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-y-0 lg:[grid-template-areas:'._frame'_'head_frame'_'cta_frame'_'._frame']">
        <div className="min-w-0 [grid-area:head]">
          <Heading reveal id="armador-titulo">
            Tu idea, con precio <Brush mode="scrub">al instante</Brush>.
          </Heading>
          <p className="text-lead text-ink-soft measure-lead mt-5">
            Forma, largo, color y técnicas. Cada elección suma y lo ves al toque. ¿Viste un diseño en
            internet? Pegá el link y Bren lo cotiza.
          </p>
        </div>

        <div className="flex min-w-0 flex-col items-stretch gap-3 [grid-area:cta] sm:flex-row sm:items-center sm:gap-5 lg:mt-9">
          <Magnetic className="w-full sm:w-auto">
            <Button href="/disena" size="lg" className="w-full sm:w-auto" data-cursor="armar">
              Diseñá tu set
            </Button>
          </Magnetic>
          <p className="text-meta text-ink-soft text-center sm:text-left">
            Desde <Price value={CFG.basePrice} size="sm" className="text-ink" /> el kit completo
          </p>
        </div>

        <div className="min-w-0 [grid-area:frame]">
          <div ref={frame}>
            <div ref={lift} className="relative isolate pt-14">
              {/* La Kitty asoma por detrás de la tarjeta (sube con la tarjeta; idle suave aparte) */}
              <div aria-hidden className="absolute top-0 right-8 -z-10 w-[72px] md:right-12">
                <div ref={peek}>
                  <div data-ambient="move" className="bfhs-bob">
                    <Image
                      src="/brand/kitty-sticker.webp"
                      width={564}
                      height={666}
                      alt=""
                      sizes="72px"
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-surface ring-line shadow-xl relative overflow-hidden rounded-xl ring-1">
                <span
                  data-surface="inverse"
                  className="bg-bordo text-cream rounded-pill absolute top-3 left-3 z-10 inline-flex h-8 items-center gap-1.5 px-3 text-[13px] font-semibold shadow-sm"
                >
                  <span
                    aria-hidden
                    data-ambient="move"
                    className="bg-yellow size-1.5 animate-[print-led_1.6s_ease-in-out_infinite] rounded-full"
                  />
                  en vivo
                </span>
                {/* NailPreview a sangre: su interior no se toca, solo se le sacan el radio y el filete propios */}
                <div data-teaser-preview="" className="[&>div]:rounded-none [&>div]:ring-0">
                  <NailPreview sel={sel} config={CFG} />
                </div>

                <div className="border-line border-t p-4 md:p-5">
                  {/* Una sola fila (alto fijo: la tarjeta no salta entre sets); lo que no entra se desvanece */}
                  <ul
                    aria-label="Tu selección"
                    className="-mr-4 flex h-7 gap-1.5 overflow-hidden [mask-image:linear-gradient(90deg,#000_calc(100%-40px),transparent)] md:-mr-5"
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      {chips.map((c) => (
                        <motion.li
                          key={c.key}
                          layout
                          initial={{ opacity: 0, transform: "translateY(6px)" }}
                          animate={{ opacity: 1, transform: "translateY(0px)" }}
                          exit={{ opacity: 0, transform: "translateY(-6px)" }}
                          transition={{ duration: 0.18, ease: EASE.ui }}
                          className="bg-cream-deep text-ink rounded-pill text-meta inline-flex h-7 shrink-0 items-center px-2.5 whitespace-nowrap"
                        >
                          {c.label}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <p className="text-meta text-ink-soft">
                      Nivel {quote.complexityLabel.toLowerCase()}
                    </p>
                    <p className="flex items-baseline gap-2">
                      <span className="text-meta text-ink-soft">Total</span>
                      <PriceTicker value={quote.total} size="lg" className="text-bordo" />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado de la demo / invitación */}
            <div className="mt-4 flex min-h-11 items-center justify-between gap-4">
              {custom ? (
                <Link
                  href="/disena"
                  data-cursor="armar"
                  className="group text-bordo rounded-pill inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold"
                >
                  Tu turno: seguí en el armador
                  <Icon
                    name="arrow"
                    size={18}
                    className="transition-transform duration-200 ease-[var(--ease-ui)] group-hover:translate-x-1"
                  />
                </Link>
              ) : (
                <>
                  <div aria-hidden className="flex items-center gap-1.5 pl-1">
                    {DEMO.map((_, k) => (
                      <span
                        key={k}
                        className={cn(
                          "rounded-pill h-0.5 w-6 transition-colors duration-200 ease-[var(--ease-ui)]",
                          k === index ? "bg-bordo" : "bg-bordo/20",
                        )}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label="Pausar demo"
                    aria-pressed={paused}
                    onClick={() => setPaused((p) => !p)}
                    className="bg-surface ring-line text-bordo rounded-pill shadow-xs grid size-11 shrink-0 place-items-center ring-1 transition-[scale,background-color] duration-150 ease-[var(--ease-ui)] hover:bg-cream active:scale-[0.96]"
                  >
                    <Icon name={paused ? "play" : "pause"} size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Tu turno: forma y color (al tocar, la demo se detiene para siempre) */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-6">
              <RadioRow
                label="Forma"
                options={SHAPES.map((s) => ({ id: s.id, label: s.label }))}
                value={sel.shape}
                onChange={(id) => pick({ shape: id as Shape })}
                render={(o, on) => (
                  <span
                    className={cn(
                      "bg-surface rounded-pill grid size-11 place-items-center transition-[box-shadow] duration-150 ease-[var(--ease-ui)]",
                      on
                        ? "ring-bordo ring-offset-cream-deep ring-2 ring-offset-2"
                        : "ring-line ring-1 group-hover/opt:ring-bordo/40",
                    )}
                  >
                    <NailSwatch
                      shape={o.id as Shape}
                      base={CFG.bases.find((b) => b.id === sel.base)?.hex ?? "#4a0e0e"}
                      count={1}
                      size={28}
                      className="drop-shadow-[0_1px_1px_rgb(74_14_14/0.25)]"
                    />
                  </span>
                )}
              />
              <RadioRow
                label="Color"
                options={COLORS.map((c) => ({ id: c.id, label: c.label, hex: c.hex }))}
                value={sel.base}
                onChange={(id) => pick({ base: id })}
                render={(o, on) => (
                  <span className="grid size-11 place-items-center">
                    <span
                      className={cn(
                        "rounded-pill block size-8 transition-[box-shadow] duration-150 ease-[var(--ease-ui)]",
                        on
                          ? "ring-bordo ring-offset-cream-deep ring-2 ring-offset-2"
                          : "ring-1 ring-black/10 group-hover/opt:ring-bordo/40",
                      )}
                      style={{ background: o.hex }}
                    />
                  </span>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </AmbientZone>
  );
}

type Opt = { id: string; label: string; hex?: string };

/**
 * Grupo de opciones únicas (`radiogroup`) con foco itinerante: Tab entra en la opción marcada (o la primera), las
 * flechas mueven y eligen.
 */
function RadioRow({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: Opt[];
  value: string;
  onChange: (id: string) => void;
  render: (o: Opt, on: boolean) => React.ReactNode;
}) {
  const group = useRef<HTMLDivElement>(null);
  const active = options.some((o) => o.id === value) ? value : options[0]?.id;
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = options.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].id);
    group.current?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  };
  const id = `teaser-${label.toLowerCase()}`;
  return (
    <div className="min-w-0">
      <p id={id} className="text-meta text-ink-soft mb-1.5 font-semibold">
        {label}
      </p>
      <div ref={group} role="radiogroup" aria-labelledby={id} className="-ml-0.5 flex flex-wrap gap-1">
        {options.map((o, i) => {
          const on = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={o.label}
              tabIndex={o.id === active ? 0 : -1}
              onClick={() => onChange(o.id)}
              onKeyDown={(e) => onKey(e, i)}
              className="group/opt rounded-pill grid size-11 place-items-center transition-[scale] duration-150 ease-[var(--ease-ui)] active:scale-[0.94]"
            >
              {render(o, on)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
