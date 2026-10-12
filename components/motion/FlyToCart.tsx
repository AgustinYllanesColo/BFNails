"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { EASE, MQ } from "@/lib/motion-core";
import { NailSwatch } from "@/components/ui/NailSwatch";
import type { Finish, Shape } from "@/lib/types";

/** Evento que pide un vuelo (lo despacha `flyToCart`, lo atiende `FlyLayer`). */
export const FLY_EVENT = "bf:fly";
/** Evento que sale cuando la ficha llega a la bolsita (o en el acto, sin vuelo): el contador sube con él. */
export const CART_BUMP_EVENT = "bf:cart-bump";

export type FlyOptions = {
  /** Foto del diseño (la ficha la recorta con `object-cover`). */
  src?: string;
  /** Sin foto: color base de la uña (armador). */
  base?: string;
  shape?: Shape;
  tip?: string;
  finish?: Finish;
};

export type FlyDetail = FlyOptions & {
  /** Centro del elemento de origen en coordenadas del viewport; `null` si no había origen visible. */
  from: { x: number; y: number } | null;
};

/**
 * Hace volar una ficha de 36 px desde `fromEl` (el botón "Agregar") hasta la bolsita del nav (`[data-cart-target]`).
 * Se puede llamar en el mismo click que agrega al carrito: el contador sube recién con `bf:cart-bump`.
 */
export function flyToCart(fromEl: Element | null | undefined, options: FlyOptions = {}): void {
  if (typeof window === "undefined") return;
  const r = fromEl?.getBoundingClientRect();
  const from =
    r && (r.width > 0 || r.height > 0)
      ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      : null;
  window.dispatchEvent(new CustomEvent<FlyDetail>(FLY_EVENT, { detail: { ...options, from } }));
}

const CHIP = 36;
/** Duración del vuelo (ms). */
export const FLY_MS = 560;
/** Tramos rectos con que se muestrea la curva (a 60 fps, menos de un frame por tramo: no se notan). */
const STEPS = 24;
/** Cuánto sube el arco por encima del punto más alto del recorrido. */
const ARC = 40;
/** El centro de la ficha nunca sube más que esto: en el tope del arco mide ~23 px y queda entera en pantalla. */
const TOP_ROOM = 18;
/** Aire lateral (px, más allá del borde de la bolsita) con que la ficha pasa al lado antes de caer adentro. */
const CLEAR = 26;
/** Margen con los bordes de la pantalla para la panza lateral. */
const EDGE = 22;
/**
 * Reparto del tiempo sobre la parábola, `τ = t − WARP·t·(1 − t)`: sale un poco menos disparada y pasa más rápido por
 * el tope, así la ficha no flota al lado de la bolsita antes de entrar.
 */
const WARP = 0.3;

export type Point = { x: number; y: number };

export type FlightPath = {
  /** Centros de la ficha muestreados en tiempo uniforme (`steps + 1` puntos, del origen a la bolsita). */
  points: Point[];
  /** Lado por el que entra a la bolsita: `-1` desde la izquierda, `1` desde la derecha. */
  side: -1 | 1;
};

/**
 * Recorrido de la ficha: un tiro parabólico que entra a la bolsita por arriba.
 *
 * - **Y**: sale rápido, frena hasta el tope del arco (`ARC` px por encima del punto más alto, sin salirse de la
 *   pantalla) y cae acelerando adentro. Con `y(t) = y0 + b·t + a·t²`, tope en `peak`, `A = y0 − peak` y
 *   `B = y1 − peak`: `√a = √A + √B` y `b = −2·√A·√a` (el tope cae en `t = √A / √a`, ~90 % del vuelo con la bolsita
 *   arriba: la ficha nunca se queda quieta encima del ícono, entra en el último tramo).
 * - **X**: avanza parejo y, si hace falta, se abre en una panza (`4·bow·t·(1 − t)`) para que al subir a la altura
 *   de la bolsita pase a su lado con `CLEAR` px de aire y no por encima del ícono (origen justo debajo, por ejemplo
 *   la barra de abajo en el celular). Entra siempre por el lado que mira al centro de la pantalla.
 */
export function flightPath(
  from: Point,
  to: Point,
  viewportWidth: number,
  targetRadius = 22,
  steps = STEPS,
): FlightPath {
  const high = Math.min(from.y, to.y);
  const peak = high - Math.max(0, Math.min(ARC, high - TOP_ROOM));
  const sa = Math.sqrt(Math.max(0, from.y - peak));
  const k = sa + Math.sqrt(Math.max(0, to.y - peak));
  const yAt = (t: number) =>
    k === 0 ? from.y + (to.y - from.y) * t : from.y - 2 * sa * k * t + k * k * t * t;

  const dx = to.x - from.x;
  // Entra por el lado de la bolsita que mira al centro de la pantalla: nunca pega contra el borde ni pasa por
  // encima de lo que está más afuera en el nav (el menú en el celular).
  const side: -1 | 1 = to.x > viewportWidth / 2 ? -1 : 1;
  // Momento en que la ficha sube hasta el borde de abajo de la bolsita (raíz menor de y(t) = y1 + r).
  const rise = from.y - (to.y + targetRadius);
  const tc = k > 0 && rise > 0 ? (sa - Math.sqrt(Math.max(0, sa * sa - rise))) / k : 0;
  let bow = 0;
  if (tc > 0.05 && tc < 0.95) {
    const w = 4 * tc * (1 - tc);
    // aire que ya trae el recorrido recto en ese momento, del lado por el que entra
    const natural = -side * dx * (1 - tc);
    bow = Math.max(0, (targetRadius + CLEAR - natural) / w);
    // la panza llega a su máximo a mitad de vuelo: que no se salga de la pantalla
    const mid = from.x + dx / 2;
    const room = side < 0 ? mid - EDGE : viewportWidth - EDGE - mid;
    bow = Math.min(bow, Math.max(0, room));
  }

  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const u = i / steps;
    const t = u - WARP * u * (1 - u);
    return { x: from.x + dx * t + 4 * side * bow * t * (1 - t), y: yAt(t) };
  });
  return { points, side };
}

/** La bolsita visible (puede haber más de una en el DOM, por ejemplo desktop y móvil). */
function findTarget(): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>("[data-cart-target]")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return el;
  }
  return null;
}

/** Llegada: la bolsita se aplasta y rebota, el contador sube y el teléfono vibra apenas. */
function land(target: HTMLElement | null) {
  target?.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.18, 0.86)" },
      { transform: "scale(0.96, 1.04)" },
      { transform: "scale(1)" },
    ],
    { duration: 420, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
  );
  window.dispatchEvent(new Event(CART_BUMP_EVENT));
  navigator.vibrate?.(8);
}

/** Sin vuelo (reduced-motion o sin origen): un pulso de fondo de 200 ms en la bolsita y el evento en el acto. */
function pulse(target: HTMLElement | null) {
  target?.animate(
    [
      { backgroundColor: "rgb(74 14 14 / 0.16)", borderRadius: "999px" },
      { backgroundColor: "rgb(74 14 14 / 0)", borderRadius: "999px" },
    ],
    { duration: 200, easing: "ease-out" },
  );
  window.dispatchEvent(new Event(CART_BUMP_EVENT));
}

type Flight = FlyDetail & {
  id: number;
  from: Point;
  to: Point;
  /** Medio lado de la bolsita, mínimo 22 (para pasar a su lado con aire antes de caer adentro). */
  radius: number;
  target: HTMLElement;
};

/**
 * Capa de vuelos (PLAN F3.8), montada una vez en Providers. Portal `fixed inset-0 z-[90]`, solo mientras hay una
 * ficha en el aire. Dos nodos, uno por responsabilidad: el externo recorre el arco (`flightPath`, en tiempo lineal:
 * la curva ya trae la física) y el interno lleva la pose de la ficha (sale del botón con un pop, se inclina hacia
 * donde va, se achica a .64 y en el último 15 % entra en la bolsita: .3 y opacidad 0 justo cuando aterriza).
 * WAAPI con strings de `transform`: corre en el compositor.
 */
export function FlyLayer() {
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    let seq = 0;
    const onFly = (e: Event) => {
      const detail = (e as CustomEvent<FlyDetail>).detail ?? { from: null };
      const target = findTarget();
      if (!target || !detail.from || window.matchMedia(MQ.reduced).matches) {
        pulse(target);
        return;
      }
      const r = target.getBoundingClientRect();
      const flight: Flight = {
        ...detail,
        id: ++seq,
        from: detail.from,
        to: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
        // si el destino es solo el ícono (20 px), el aire se mide desde el botón de 44 px que lo rodea
        radius: Math.max(22, Math.max(r.width, r.height) / 2),
        target,
      };
      setFlights((list) => [...list, flight]);
    };
    window.addEventListener(FLY_EVENT, onFly);
    return () => window.removeEventListener(FLY_EVENT, onFly);
  }, []);

  if (flights.length === 0) return null;
  return createPortal(
    <div aria-hidden data-fly-layer="" className="pointer-events-none fixed inset-0 z-[90]">
      {flights.map((f) => (
        <FlyChip
          key={f.id}
          flight={f}
          onDone={() => setFlights((list) => list.filter((x) => x.id !== f.id))}
        />
      ))}
    </div>,
    document.body,
  );
}

const POP = `cubic-bezier(${EASE.ui.join(", ")})`;
const SWAY = `cubic-bezier(${EASE.move.join(", ")})`;
/** Entrada a la bolsita: arranca suave y termina rápido (la ficha "cae adentro"). */
const DROP = "cubic-bezier(0.55, 0, 1, 0.45)";

const at = (p: Point) =>
  `translate3d(${(p.x - CHIP / 2).toFixed(1)}px, ${(p.y - CHIP / 2).toFixed(1)}px, 0)`;

function FlyChip({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  // Efecto pasivo (no de layout): el primer paint ya muestra la ficha en el cuadro 0 por los estilos en línea, y en
  // desarrollo el doble montaje de StrictMode corre en el mismo pase, sin reiniciar un vuelo ya pintado.
  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const { points, side } = flightPath(flight.from, flight.to, window.innerWidth, flight.radius);
    const move = o.animate(
      points.map((p, k) => ({ transform: at(p), offset: k / (points.length - 1) })),
      { duration: FLY_MS, easing: "linear", fill: "forwards" },
    );
    // Se inclina hacia donde va (entra desde la izquierda: gira a favor del reloj) y endereza al entrar.
    const tilt = side * -8;
    const pose = i.animate(
      [
        { offset: 0, transform: "scale(0.9) rotate(0deg)", opacity: 1, easing: POP },
        { offset: 0.14, transform: `scale(1.06) rotate(${(tilt * 0.4).toFixed(2)}deg)`, easing: SWAY },
        { offset: 0.55, transform: `scale(0.82) rotate(${tilt.toFixed(2)}deg)`, easing: SWAY },
        {
          offset: 0.85,
          transform: `scale(0.64) rotate(${(tilt * 0.5).toFixed(2)}deg)`,
          opacity: 1,
          easing: DROP,
        },
        { offset: 1, transform: "scale(0.3) rotate(0deg)", opacity: 0 },
      ],
      { duration: FLY_MS, fill: "forwards" },
    );
    let cancelled = false;
    Promise.all([move.finished, pose.finished]).then(
      () => {
        if (cancelled) return;
        // Mismo frame en que la ficha desaparece adentro: la bolsita se aplasta y el contador sube.
        land(flight.target.isConnected ? flight.target : findTarget());
        done.current();
      },
      () => {}, // cancelado (desmontó antes de llegar): no aterriza
    );
    return () => {
      cancelled = true;
      move.cancel();
      pose.cancel();
    };
  }, [flight]);

  return (
    <div ref={outer} className="absolute top-0 left-0" style={{ transform: at(flight.from) }}>
      <div
        ref={inner}
        data-fly-chip=""
        className="bg-cream-deep ring-cream size-9 overflow-hidden rounded-sm shadow-md ring-2"
        style={{ transform: "scale(0.9)" }}
      >
        {flight.src ? (
          <Image
            src={flight.src}
            alt=""
            width={CHIP}
            height={CHIP}
            unoptimized
            loading="eager"
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center">
            <NailSwatch
              shape={flight.shape ?? "almendra"}
              base={flight.base ?? "var(--bordo-900)"}
              tip={flight.tip}
              finish={flight.finish}
              count={1}
              size={30}
            />
          </span>
        )}
      </div>
    </div>
  );
}
