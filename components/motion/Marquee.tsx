"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/format";
import { useAmbientPause } from "@/lib/hooks";
import { MOTION_EVENT, MQ, isMotionPaused } from "@/lib/motion-core";
import { Icon } from "@/components/ui/icons";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  items: string[];
  className?: string;
  /**
   * Segundos que tarda en pasar la lista de `items` una vez. La velocidad en pantalla no cambia con `repeat`: la
   * pista dura `speed × repeat`.
   */
  speed?: number;
  /** Invierte el sentido base: sin `reverse` la pista corre hacia la izquierda. Al scrollear para arriba el sentido se invierte un momento. */
  reverse?: boolean;
  /** Separador entre ítems. Por defecto, estrella amarilla (`solid`) o destello rojo de .35em (`outline`). */
  separator?: ReactNode;
  /**
   * Veces que se repite `items` en cada copia de la pista. Tiene que alcanzar para que una copia cubra el ancho de la
   * cinta (en desarrollo avisa por consola si no alcanza). Se fija por uso, no se mide: medir haría saltar la pista al
   * hidratar. El 3 por defecto cubre hasta 2560 px de ancho (monitores 1440p y 5K) con las cintas de seis ítems de la
   * home (108vw) y del footer; con 2 quedaba un hueco al dar la vuelta.
   */
  repeat?: number;
  /** `solid`: texto lleno. `outline`: solo contorno bordó (`outline-text`), para la fila gigante del hero. */
  variant?: "solid" | "outline";
  /**
   * Reacciona a la velocidad del scroll: acelera, se inclina y al subir rápido se invierte. Solo sin reduced-motion y
   * sin la pausa manual; en reposo vuelve siempre a +1.
   */
  reactive?: boolean;
};

type ProxyRate = { rate: number };

/** Velocidad de scroll (px/s) por debajo de la cual la cinta vuelve a su ritmo base. */
const DEAD_ZONE = 200;

/**
 * Cinta de texto en movimiento constante (PLAN F3.4). La pista es una animación CSS (`marquee`, en el compositor) que
 * arranca en el primer paint, también con reduced-motion (3× más lenta por `--marquee-k`). Se pausa fuera de vista,
 * con la pausa manual (`[data-ambient]`) y con hover en punteros finos; nunca se detiene después de scrollear.
 *
 * Tres nodos, una responsabilidad cada uno: la raíz recorta y lleva `data-offscreen`; la capa del medio recibe la
 * inclinación reactiva (el fondo y el borde de la raíz quedan quietos); la pista lleva la animación CSS y
 * `data-ambient="marquee"`. La reacción al scroll solo cambia el `playbackRate` de la CSSAnimation existente:
 * prohibido `play()`/`pause()`, que harían que la animación ignore `animation-play-state`.
 */
export function Marquee({
  items,
  className,
  speed = 28,
  reverse,
  separator,
  repeat = 3,
  variant = "solid",
  reactive = true,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const skew = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useAmbientPause(root);

  const copy = Array.from({ length: Math.max(1, repeat) }, () => items).flat();
  const row = [...copy, ...copy];

  // Aviso de desarrollo: una copia más corta que la cinta deja un hueco al dar la vuelta.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const r = root.current;
    const t = track.current;
    if (!r || !t) return;
    const check = () => {
      if (t.scrollWidth / 2 + 1 < r.clientWidth)
        console.warn(
          `[Marquee] Una copia (${Math.round(t.scrollWidth / 2)} px) no cubre la cinta (${r.clientWidth} px): subí \`repeat\`.`,
          items,
        );
    };
    document.fonts?.ready.then(check);
  }, [items]);

  useEffect(() => {
    const r = root.current;
    const s = skew.current;
    const t = track.current;
    if (!reactive || !r || !s || !t) return;

    const mm = gsap.matchMedia();
    mm.add(MQ.full, () => {
      /*
       * La CSSAnimation de la pista se busca una vez (y de nuevo solo si el navegador la recrea: `animationstart`).
       * En el loop de scroll no se lee nada que fuerce estilos: `getAnimations()` y `currentTime` hacen flush del
       * estilo pendiente, y el frame anterior acaba de escribir la inclinación.
       */
      let anim: Animation | null = null;
      let dur = 0;
      let rateNow = 1; // el último playbackRate aplicado (una CSSAnimation nueva arranca en 1)
      let skewNow = "";
      let backwards = false;

      /** "Mil vueltas adelante": con rate negativo nunca llega a 0 (no termina). Sumar vueltas enteras no la mueve. */
      const pad = (a: Animation) => {
        const time = Number(a.currentTime ?? 0);
        if (time < dur * 10) a.currentTime = time + dur * 1000;
      };
      const lookup = (): Animation | null => {
        anim =
          t.getAnimations().find((x) => (x as CSSAnimation).animationName === "marquee") ?? null;
        dur = anim ? Number(anim.effect?.getComputedTiming().duration) || speed * repeat * 1000 : 0;
        rateNow = anim ? anim.playbackRate : 1;
        if (anim && dur) pad(anim);
        return anim;
      };
      const onStart = (e: AnimationEvent) => {
        if (e.target === t && e.animationName === "marquee") anim = null; // la busca el próximo apply
      };
      t.addEventListener("animationstart", onStart);

      const proxy: ProxyRate = { rate: 0 };
      let enabled = !isMotionPaused();
      const apply = () => {
        const a = anim ?? lookup();
        if (!a || !dur) return;
        const rate = enabled ? proxy.rate : 0;
        const dir = rate < -0.05 ? -1 : 1; // la dirección base la da animation-direction: en reposo, siempre +1
        // Lecturas antes de escribir, y solo al empezar a ir para atrás (el colchón de mil vueltas sobra para eso).
        if (dir < 0 && !backwards) pad(a);
        backwards = dir < 0;
        const next = Math.round((1 + Math.abs(rate)) * dir * 100) / 100;
        if (next !== rateNow) {
          a.updatePlaybackRate(next);
          rateNow = next;
        }
        const skew = Math.abs(rate) >= 0.01 ? `skewX(${gsap.utils.clamp(-6, 6, rate * -1.5).toFixed(2)}deg)` : "";
        if (skew !== skewNow) {
          s.style.transform = skew;
          skewNow = skew;
        }
      };
      const rateTo = gsap.quickTo(proxy, "rate", {
        duration: 0.5,
        ease: "power3.out",
        onUpdate: apply,
      });

      let idle: ReturnType<typeof setTimeout> | undefined;
      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          if (!enabled) return;
          // Zona muerta: la cola del scroll suave (o de la inercia táctil) sigue mandando velocidades chiquitas
          // durante un segundo; sin esto la cinta quedaba invertida después de subir.
          const v = self.getVelocity();
          rateTo(Math.abs(v) < DEAD_ZONE ? 0 : gsap.utils.clamp(-4, 4, v / 600));
          clearTimeout(idle);
          idle = setTimeout(() => rateTo(0), 150);
        },
      });

      const onMotion = () => {
        enabled = !isMotionPaused();
        if (!enabled) {
          gsap.killTweensOf(proxy);
          proxy.rate = 0;
          apply();
        }
      };
      window.addEventListener(MOTION_EVENT, onMotion);
      lookup();

      return () => {
        window.removeEventListener(MOTION_EVENT, onMotion);
        t.removeEventListener("animationstart", onStart);
        clearTimeout(idle);
        st.kill();
        gsap.killTweensOf(proxy);
        anim?.updatePlaybackRate(1);
        s.style.transform = "";
      };
    });
    return () => mm.revert();
  }, [reactive, speed, repeat]);

  const outline = variant === "outline";
  const sep =
    separator ??
    (outline ? (
      <Icon name="sparkle" className="text-red size-[0.35em]" />
    ) : (
      <Icon name="star" size={18} className="text-yellow" />
    ));

  return (
    <div
      ref={root}
      aria-hidden
      className={cn("relative flex overflow-hidden whitespace-nowrap select-none", className)}
    >
      <div ref={skew} className="flex shrink-0">
        <div
          ref={track}
          data-ambient="marquee"
          className="flex w-max shrink-0 animate-[marquee_calc(var(--speed)*var(--marquee-k))_linear_infinite] items-center [@media(hover:hover)]:hover:[animation-play-state:paused]"
          style={
            {
              "--speed": `${speed * Math.max(1, repeat)}s`,
              animationDirection: reverse ? "reverse" : "normal",
            } as CSSProperties
          }
        >
          {row.map((item, i) => (
            <span
              key={i}
              className={cn(
                "flex shrink-0 items-center",
                outline ? "gap-[0.4em] pr-[0.4em]" : "gap-8 pr-8",
              )}
            >
              <span className={outline ? "outline-text" : undefined}>{item}</span>
              {sep}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * @deprecated Alias de compatibilidad de `<Icon name="star">` (PLAN F1.7): las secciones migran al set de íconos y
 * W3 lo borra.
 */
export function Star({ size = 24, className }: { size?: number; className?: string }) {
  return <Icon name="star" size={size} className={className} />;
}
