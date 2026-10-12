"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Brush } from "@/components/motion/Brush";
import { Paper, PrinterHead, TicketRule } from "@/components/ui/ticket";
import { Stamp } from "@/components/ui/Stamp";
import { useAmbientPause } from "@/lib/hooks";
import { MQ, isInViewportNow, registerEases } from "@/lib/motion";
import { cn } from "@/lib/format";
import "./home.module.css";

gsap.registerPlugin(ScrollTrigger);

/** Los cuatro pasos, en voz de ticket (resumen del texto de siempre: nada nuevo). */
const STEPS = [
  {
    n: "01",
    title: "Elegí o diseñá",
    text: "Un set del catálogo, uno armado por vos o la foto del diseño que viste.",
  },
  {
    n: "02",
    title: "Medí tu talle",
    text: "Un talle estándar con la guía, o el ancho de cada una de tus 10 uñas.",
  },
  {
    n: "03",
    title: "Pagá como quieras",
    text: "Mercado Pago, transferencia o efectivo. Confirmás por WhatsApp.",
  },
  {
    n: "04",
    title: "Recibí y pegá",
    text: "Kit con 10 uñas, pegamento y lima. Se ponen en 10 minutos.",
  },
];

type HeadStatus = "idle" | "printing" | "waiting";
type StampState = "rest" | "hidden" | "play";

const LABEL: Record<"before" | "printing" | "done", string> = {
  before: "esperando tu pedido",
  printing: "imprimiendo…",
  done: "listo",
};

/** Cuánto se sale la sombra del papel por los costados (el recorte no la corta). */
const SHADOW = 28;
/** Una línea de tinta se imprime cuando el borde del papel pasa esta distancia por debajo de su borde superior. */
const INK_LEAD = 16;

/**
 * "Cómo funciona" = el ticket de tu pedido (PLAN §4 W2-B.4): la impresora térmica de la marca imprime los cuatro pasos
 * mientras scrolleás y Bren lo sella al final.
 *
 * - Desktop alto (≥ 1024 × 820, sin reduced): la sección se pinea durante 120 % de pantalla; el papel sale de la
 *   ranura y cada línea se imprime cuando el borde del papel la pasa (barrido de 240 ms en 12 pasos, LED y temblor del
 *   cabezal). Al terminar de salir, el sello.
 * - Celular, tablet y laptops bajas: sin pin; el papel se alimenta con el scroll (`top 75%` → `bottom 65%`) con el
 *   borde casi quieto en pantalla, y las líneas se imprimen igual, una vez cada una.
 * - Reduced-motion: ticket impreso y sellado; las líneas aparecen con opacidad al entrar.
 * - Lo que el SSR pinta es el ticket completo y sellado: si al montar ya está en pantalla, queda así.
 *
 * El pin vive adentro de un wrapper propio de React (el pin-spacer de GSAP se inserta ahí, nunca entre React y su
 * nodo) y se arma y se revierte en `useLayoutEffect`: la limpieza corre antes de que React saque los nodos al navegar.
 */
export function HowItWorks() {
  const wrap = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<HeadStatus>("idle");
  const [label, setLabel] = useState(LABEL.done);
  const [stamp, setStamp] = useState<StampState>("rest");
  useAmbientPause(root);

  useLayoutEffect(() => {
    const section = root.current;
    const wrapEl = wrap.current;
    const paperBox = feed.current;
    const headEl = head.current;
    if (!section || !paperBox || !headEl) return;
    registerEases();
    const mm = gsap.matchMedia();

    mm.add(
      {
        pin: "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 820px)",
        feed: "(prefers-reduced-motion: no-preference) and (max-width: 1023px), (prefers-reduced-motion: no-preference) and (max-height: 819px)",
        reduced: MQ.reduced,
      },
      (ctx) => {
        const { pin, reduced } = ctx.conditions as Record<string, boolean>;
        if (isInViewportNow(section)) {
          // ya se ve: queda impreso y sellado, sin pin (y sin el espacio que el CSS le reserva)
          if (!pin || !wrapEl) return;
          wrapEl.dataset.nopin = "";
          return () => {
            delete wrapEl.dataset.nopin;
          };
        }
        const inks = gsap.utils.toArray<HTMLElement>("[data-ink]", paperBox);

        if (reduced) {
          gsap.set(inks, { autoAlpha: 0 });
          gsap.to(inks, {
            autoAlpha: 1,
            duration: 0.3,
            ease: "power1.out",
            stagger: 0.05,
            clearProps: "opacity,visibility",
            scrollTrigger: { trigger: paperBox, start: "top 80%", once: true },
          });
          return;
        }

        /* ---------- impresión ---------- */
        const printed = new Set<HTMLElement>();
        const running: Animation[] = [];
        let tops: number[] = [];
        let stampAt = Infinity;
        let height = 0;
        let stamped = false;
        let settle: ReturnType<typeof setTimeout> | undefined;

        for (const ink of inks) ink.style.clipPath = "inset(0 100% 0 0)";
        paperBox.style.clipPath = `inset(0 -${SHADOW}px 100% -${SHADOW}px)`;
        setStatus("waiting");
        setLabel(LABEL.before);
        setStamp("hidden");

        const measure = () => {
          const box = paperBox.getBoundingClientRect();
          height = paperBox.offsetHeight;
          tops = inks.map((ink) => ink.getBoundingClientRect().top - box.top);
          const mark = paperBox.querySelector<HTMLElement>("[data-stamp-row]");
          stampAt = mark ? mark.getBoundingClientRect().top - box.top + mark.offsetHeight * 0.5 : height;
        };

        const shake = () => {
          running.push(
            headEl.animate(
              [
                { transform: "translateY(0)" },
                { transform: "translateY(1px)" },
                { transform: "translateY(0)" },
                { transform: "translateY(-0.6px)" },
                { transform: "translateY(0)" },
              ],
              { duration: 120, easing: "linear" },
            ),
          );
        };

        const print = (ink: HTMLElement) => {
          printed.add(ink);
          const a = ink.animate(
            [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
            { duration: 240, easing: "steps(12, end)", fill: "forwards" },
          );
          a.onfinish = () => {
            ink.style.clipPath = "";
            a.cancel();
          };
          running.push(a);
          shake();
          setStatus("printing");
          setLabel(LABEL.printing);
          clearTimeout(settle);
          // Entre línea y línea el LED respira; "listo" recién cuando cae el sello.
          settle = setTimeout(() => setStatus(stamped ? "idle" : "waiting"), 300);
        };

        /** `q` = cuánto papel salió (0 → 1). */
        const apply = (q: number) => {
          const shown = q * height;
          const hidden = q >= 1 ? -SHADOW : height - shown;
          paperBox.style.clipPath = `inset(0 -${SHADOW}px ${hidden.toFixed(1)}px -${SHADOW}px)`;
          inks.forEach((ink, i) => {
            if (!printed.has(ink) && shown >= tops[i] + INK_LEAD) print(ink);
          });
          if (!stamped && shown >= stampAt) {
            stamped = true;
            setStamp("play");
            setStatus("idle");
            setLabel(LABEL.done);
          }
        };

        measure();
        const proxy = { p: 0 };
        const build = () => {
          gsap.to(proxy, {
            p: 1,
            ease: "none",
            onUpdate: () => apply(pin ? Math.min(1, proxy.p / 0.9) : proxy.p),
            scrollTrigger: pin
              ? {
                  trigger: section,
                  start: "top top",
                  end: "+=120%",
                  pin: true,
                  // el recorrido del pin ya lo reserva el CSS (.bfhs-pinwrap): el layout es el mismo con y sin JS,
                  // así volver atrás o recargar cae siempre en el mismo lugar
                  pinSpacing: false,
                  scrub: 0.6,
                  anticipatePin: 1,
                  // el pin se mide antes que los disparadores de más abajo (Teaser, Envíos), que se crean antes que él
                  refreshPriority: 1,
                  invalidateOnRefresh: true,
                  onRefresh: measure,
                }
              : {
                  trigger: paperBox,
                  start: "top 75%",
                  end: "bottom 65%",
                  scrub: 0.4,
                  invalidateOnRefresh: true,
                  onRefresh: measure,
                },
          });
        };
        /*
         * El pin se arma dos frames después de montar: al crearse, ScrollTrigger mide con un `scrollTo` y, si eso pasa
         * antes de que el navegador restaure la posición al volver atrás (~6 ms después de montar), la restauración
         * se cancela y la home vuelve arriba de todo. Los estados de arriba ya se aplicaron antes del primer paint.
         */
        let raf = 0;
        if (pin) {
          raf = requestAnimationFrame(() => {
            raf = requestAnimationFrame(() => {
              raf = 0;
              ctx.add(build);
              section.dataset.pin = "on"; // lo leen los tests (con pinSpacing: false no hay pin-spacer)
              ScrollTrigger.refresh();
            });
          });
        } else build();

        return () => {
          cancelAnimationFrame(raf);
          delete section.dataset.pin;
          clearTimeout(settle);
          for (const a of running) a.cancel();
          for (const ink of inks) ink.style.clipPath = "";
          paperBox.style.clipPath = "";
          setStatus("idle");
          setLabel(LABEL.done);
          setStamp("rest");
        };
      },
    );
    return () => mm.revert();
  }, []);

  return (
    // Contenedor propio de React: el pin-spacer de GSAP se inserta adentro, nunca entre React y su nodo. En desktop alto
    // reserva por CSS el recorrido del pin (120 % de pantalla) debajo de la sección.
    <div ref={wrap} className="bfhs-pinwrap bg-bordo relative">
      <section
        ref={root}
        id="como-funciona"
        data-surface="inverse"
        aria-labelledby="como-funciona-titulo"
        className={cn(
          "bg-bordo text-on-bordo grain bfhs-ticket relative overflow-x-clip py-[var(--section-y)]",
        )}
      >
        <div className="container-x grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="lg:col-span-5">
            <h2 id="como-funciona-titulo" className="font-display text-h2 text-cream text-balance">
              De tu idea{" "}
              <Brush tone="inverse" mode="scrub">
                a tus manos
              </Brush>
            </h2>
            <p className="text-lead text-on-bordo-muted mt-4 max-w-[34ch]">
              Así sale tu pedido, paso a paso.
            </p>
            <div className="mt-10 hidden w-24 -rotate-[8deg] lg:block">
              <Image
                src="/brand/kitty-sticker.webp"
                width={564}
                height={666}
                alt=""
                sizes="96px"
                className="h-auto w-full"
              />
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <div className="mx-auto w-full max-w-[420px]">
              <div ref={head} className="relative z-10">
                <PrinterHead status={status} label={label} />
              </div>
              {/* El papel sale de la ranura: un poco más angosto que el cabezal y metido debajo */}
              <div ref={feed} className="relative -mt-2 px-2">
                <Paper seed={11}>
                  <div data-ink="" className="text-center">
                    <p className="font-bold tracking-[0.04em] uppercase">BF Studio · tu pedido</p>
                    <p className="text-ink-soft">paso a paso</p>
                  </div>
                  <ol className="bfhs-rows mt-1">
                    {STEPS.map((s) => (
                      <li key={s.n} data-row="">
                        <div data-ink="">
                          <TicketRule className="my-0" />
                          <div className="grid grid-cols-[2.25rem_1fr] gap-x-2 py-[var(--row-pad,0.75rem)]">
                            <span className="font-bold tabular-nums">{s.n}</span>
                            <div className="min-w-0">
                              <h3 className="font-mono text-[13px] font-bold tracking-[0.04em] uppercase">
                                {s.title}
                              </h3>
                              <p className="text-ink-soft mt-1 font-sans text-[length:var(--row-text,15px)] leading-[1.55]">
                                {s.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div data-ink="">
                    <TicketRule variant="double" className="mt-0" />
                    <div className="flex items-baseline justify-between gap-3 text-[20px] leading-none font-bold uppercase">
                      <span>Total</span>
                      <span>tus uñas</span>
                    </div>
                    <p className="text-ink-soft mt-2 text-[13px] leading-snug">
                      a mano, en general de 3 a 7 días
                    </p>
                  </div>
                  {/* El sello va en su propia fila: nunca tapa el TOTAL */}
                  <div data-stamp-row="" className="mt-4 flex min-h-14 justify-end pr-1">
                    <div className={cn(stamp === "hidden" && "invisible")}>
                      <Stamp
                        size="sm"
                        icon="kitty"
                        label="Bren se pone a trabajar"
                        play={stamp === "play"}
                      />
                    </div>
                  </div>
                </Paper>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
