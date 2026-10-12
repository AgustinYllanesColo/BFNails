"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AmbientZone } from "@/components/motion/AmbientZone";
import { Brush } from "@/components/motion/Brush";
import { Bow } from "@/components/brand/Bow";
import { Heading } from "@/components/ui/Section";
import { Icon, type IconName } from "@/components/ui/icons";
import { Price } from "@/components/ui/Price";
import { DEFAULT_SHIPPING_TABLE } from "@/lib/shipping/table";
import { isInViewportNow, registerEases } from "@/lib/motion";
import { cn } from "@/lib/format";
import "./home.module.css";

gsap.registerPlugin(ScrollTrigger);

type Stop = {
  id: string;
  icon: IconName;
  title: string;
  price: ReactNode;
  stations?: string[];
  text: string;
};

/** Las tres formas de recibir el pedido, de la más cercana a la más lejana (textos y precio de siempre). */
const STOPS: Stop[] = [
  {
    id: "retiro",
    icon: "train",
    title: "Retiro en estación",
    price: "Gratis",
    stations: ["Remedios de Escalada", "Lanús", "Banfield"],
    text: "Coordinamos día y horario por WhatsApp.",
  },
  {
    id: "moto",
    icon: "moto",
    title: "Moto en zona",
    price: (
      <>
        Desde&nbsp;
        <Price value={DEFAULT_SHIPPING_TABLE.moto.cost} size="sm" />
      </>
    ),
    text: "Te lo llevamos a tu casa si estás cerca. El precio final depende del barrio y lo confirmamos por WhatsApp.",
  },
  {
    id: "correo",
    icon: "mail",
    title: "Correo Argentino",
    price: "Se cotiza por CP",
    text: "A domicilio o a sucursal, a todo el país, con seguimiento. El costo lo ves antes de pagar.",
  },
];

/** Punteado del último tramo (el correo): mismo bordó, guiones de 8 px. */
const DASH_V = "bg-[repeating-linear-gradient(180deg,var(--bordo-900)_0_8px,transparent_8px_16px)]";
const DASH_H = "md:bg-[repeating-linear-gradient(90deg,var(--bordo-900)_0_8px,transparent_8px_16px)]";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Envíos = la línea Lanús → todo el país (PLAN §4 W2-B.6). Tres estaciones sobre una línea recta (en columnas desde
 * md, vertical en el celular), con un paquetito con moño que viaja en la punta de la línea mientras scrolleás: la línea
 * se dibuja por tramos (los dos primeros sólidos, el del correo punteado) y cada estación se enciende cuando el
 * paquete llega (pop con rebote; el nodo sigue bordó y el ícono pasa a amarillo).
 *
 * El estado que pinta el SSR es el final (línea completa, estaciones encendidas, paquete en "todo el país"): así queda
 * sin JS y con reduced-motion. Si al montar la sección no está en pantalla, se apaga y el scrub la recorre.
 */
export function Zones() {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    registerEases();
    const mm = gsap.matchMedia();
    mm.add(
      {
        mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
        desk: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const { desk } = ctx.conditions as Record<string, boolean>;
        if (isInViewportNow(el)) return;
        const segs = gsap.utils.toArray<HTMLElement>("[data-seg]", el);
        const nodes = gsap.utils.toArray<HTMLElement>("[data-node]", el);
        const end = el.querySelector<HTMLElement>("[data-end]");
        const traveler = el.querySelector<HTMLElement>("[data-traveler]");
        if (!segs.length || !end || !traveler) return;

        // Geometría en coordenadas del track, con offsets de layout (no rects: los tramos y las estaciones están
        // escalados por la propia animación). Se recalcula en cada refresh: dónde arranca y termina la línea, dónde
        // está cada tramo y cada estación, y dónde descansa el paquete en el CSS (al final).
        let from = 0;
        let to = 1;
        let spans: Array<[number, number]> = [];
        let stations: number[] = [];
        let rest = 0;
        const pos = (n: HTMLElement) => {
          let x = 0;
          let y = 0;
          for (let cur: HTMLElement | null = n; cur && cur !== el; cur = cur.offsetParent as HTMLElement | null) {
            x += cur.offsetLeft;
            y += cur.offsetTop;
          }
          return desk ? [x, x + n.offsetWidth] : [y, y + n.offsetHeight];
        };
        const center = (n: HTMLElement) => {
          const [a, b] = pos(n);
          return (a + b) / 2;
        };
        const measure = () => {
          spans = segs.map((s) => pos(s) as [number, number]);
          stations = nodes.map(center);
          from = stations[0] ?? 0;
          to = center(end);
          rest = center(traveler);
        };

        const lit = new Set<HTMLElement>();
        const light = (n: HTMLElement, on: boolean) => {
          n.dataset.on = on ? "1" : "0";
          if (on) lit.add(n);
          else lit.delete(n);
        };

        const apply = (p: number) => {
          const tip = from + (to - from) * p;
          segs.forEach((s, i) => {
            const [a, b] = spans[i];
            // al llegar, todo completo (el último tramo sigue unos px debajo del punto final)
            const k = p >= 0.999 ? 1 : clamp01((tip - a) / Math.max(1, b - a));
            if (s.dataset.dashed) {
              s.style.clipPath = desk
                ? `inset(0 ${((1 - k) * 100).toFixed(2)}% 0 0)`
                : `inset(0 0 ${((1 - k) * 100).toFixed(2)}% 0)`;
            } else {
              s.style.transform = desk ? `scaleX(${k.toFixed(4)})` : `scaleY(${k.toFixed(4)})`;
            }
          });
          nodes.forEach((n, i) => {
            const on = tip >= stations[i] - 1;
            if (on !== lit.has(n)) light(n, on);
          });
          const arrived = p >= 0.999;
          if (arrived !== lit.has(end)) light(end, arrived);
          gsap.set(traveler, desk ? { x: tip - rest } : { y: tip - rest });
        };

        for (const s of segs) s.style.transformOrigin = desk ? "0 50%" : "50% 0";
        for (const n of [...nodes, end]) n.dataset.on = "0"; // apagadas hasta que pase el paquete
        measure();
        apply(0);

        const proxy = { p: 0 };
        gsap.to(proxy, {
          p: 1,
          ease: "none",
          onUpdate: () => apply(proxy.p),
          scrollTrigger: {
            trigger: el,
            start: desk ? "top 75%" : "top 70%",
            end: desk ? "bottom 50%" : "bottom 60%",
            scrub: 0.6,
            invalidateOnRefresh: true,
            onRefresh: () => {
              measure();
              apply(proxy.p);
            },
          },
        });

        return () => {
          for (const s of segs) {
            s.style.transform = "";
            s.style.clipPath = "";
            s.style.transformOrigin = "";
          }
          for (const n of [...nodes, end]) delete n.dataset.on;
        };
      },
    );
    return () => mm.revert();
  }, []);

  return (
    <AmbientZone as="section" id="envios" aria-labelledby="envios-titulo" className="bg-cream relative py-[var(--section-y)]">
      <div className="container-x">
        <Heading id="envios-titulo" className="max-w-[16ch]">
          De Lanús a <Brush mode="scrub">todo el país</Brush>
        </Heading>
        <p className="text-lead text-ink-soft measure-lead mt-5">
          BF Studio está en Lanús. Si sos de la zona nos vemos en la estación o te lo llevamos. Si no,
          viaja por Correo Argentino.
        </p>

        <div
          ref={track}
          className="relative mt-12 md:mt-20 md:grid md:grid-cols-[1.2fr_1fr_1fr] md:gap-x-8"
        >
          {STOPS.map((s, i) => {
            const last = i === STOPS.length - 1;
            return (
              <div key={s.id} className="relative pb-12 pl-16 md:pt-[72px] md:pb-0 md:pl-0">
                {/* Tramo propio: vertical en el celular (del nodo hasta el próximo), horizontal desde md. Debajo, el
                    mismo tramo apenas marcado: el recorrido se ve antes de que el paquete lo pinte. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-11 bottom-0 left-[20.5px] w-[3px] rounded-full opacity-[0.14] md:top-[21px] md:bottom-auto md:left-0 md:h-[3px] md:w-auto",
                    last ? cn(DASH_V, DASH_H, "md:right-0") : "bg-bordo md:right-[-2rem]",
                  )}
                />
                <span
                  aria-hidden
                  data-seg=""
                  data-dashed={last ? "1" : undefined}
                  className={cn(
                    "absolute top-11 bottom-0 left-[20.5px] w-[3px] rounded-full md:top-[21px] md:bottom-auto md:left-0 md:h-[3px] md:w-auto",
                    last ? cn(DASH_V, DASH_H, "md:right-0") : "bg-bordo md:right-[-2rem]",
                  )}
                />
                <span
                  aria-hidden
                  data-node=""
                  className={cn(
                    "bg-bordo bfhs-node shadow-sm absolute top-0 left-0 z-[1] grid size-11 place-items-center rounded-full",
                  )}
                >
                  <Icon name={s.icon} size={24} />
                </span>

                <div className="pt-2.5 md:pt-0">
                  <h3 className="text-ink font-sans text-[20px] leading-tight font-semibold">{s.title}</h3>
                  <span className="mt-2.5 inline-block -rotate-2">
                    <span className="bg-bordo text-cream rounded-pill tabular inline-flex h-8 items-center px-3 font-sans text-[15px] font-bold whitespace-nowrap shadow-sm">
                      {s.price}
                    </span>
                  </span>
                  {s.stations ? (
                    <ul aria-label="Estaciones" className="mt-3 flex flex-wrap gap-1.5">
                      {s.stations.map((st) => (
                        <li
                          key={st}
                          className="bg-cream-deep text-ink rounded-pill text-meta inline-flex h-7 items-center px-2.5"
                        >
                          {st}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="text-ink-soft mt-3 max-w-[32ch] text-[15px] leading-[1.55]">{s.text}</p>
                </div>
              </div>
            );
          })}

          {/* Final de la línea */}
          <div className="relative flex items-center gap-3 pl-[14px] md:absolute md:top-[14px] md:right-0 md:block md:p-0">
            <span
              data-end=""
              aria-hidden
              className="bg-cream ring-bordo bfhs-end block size-4 rounded-full ring-[3px]"
            />
            <span className="text-meta text-bordo font-semibold whitespace-nowrap md:absolute md:right-0 md:bottom-[calc(100%+10px)]">
              todo el país
            </span>
          </div>

          {/* El paquetito: descansa en el final (estado sin JS) y el scrub lo trae desde el principio */}
          <div
            data-traveler=""
            aria-hidden
            className="pointer-events-none absolute bottom-[-9px] left-[5px] z-10 size-[34px] md:top-[-12px] md:right-[-9px] md:bottom-auto md:left-auto"
          >
            <div data-ambient="move" className="animate-pendulum bfhs-sway size-full origin-bottom">
              {/* Cajita de regalo kraft con cinta roja y el moño de la Kitty */}
              <svg viewBox="0 0 34 34" className="size-full overflow-visible">
                <rect x="4" y="13" width="26" height="19" rx="3" fill="var(--cream-200)" stroke="var(--bordo-900)" strokeWidth="1.75" />
                <rect x="2.5" y="9" width="29" height="6.5" rx="2" fill="var(--cream-100)" stroke="var(--bordo-900)" strokeWidth="1.75" />
                <rect x="15" y="9.9" width="4" height="21.2" fill="var(--red-600)" />
              </svg>
              <Bow size={18} className="absolute top-[1.5px] left-1/2 -translate-x-1/2" />
            </div>
          </div>
        </div>
      </div>
    </AmbientZone>
  );
}
