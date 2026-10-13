import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/format";
import s from "./FloatingNails.module.css";

/**
 * Uñas press-on de fondo del hero (PLAN W2-A.4, DESIGN §6.7): tres en el celular (arriba del 52 % del alto, lejos
 * del copy) y cuatro desde md, en los colores de marca y sin leopardo (el único leopardo de la zona es la cinta de la
 * home). Decorativas (`aria-hidden`), sin blur ni `will-change`.
 *
 * Cada uña: nodo de posición con la entrada `nail-in` (sale desde el lado del logo y se abre a su lugar) › nodo de
 * deriva constante (`drift`, `data-ambient="drift"`: reduced-motion la pausa en su pose) › el SVG con `data-nail`
 * (el que miden los tests: su rect ya incluye la deriva).
 */
type Shape = "almendra" | "ovalada" | "coffin";
type Finish = "gloss" | "french" | "glitter";

type Spec = {
  x: string;
  y: string;
  /** Alto en px (el ancho es .375 del alto). */
  size: number;
  shape: Shape;
  color: string;
  finish?: Finish;
  /** Inclinación fija (va dentro del keyframe `drift`, que ya escribe `rotate`). */
  r: number;
  /** Recorrido de la deriva (px, a mitad de ciclo). */
  dx: number;
  dy: number;
  /** Duración (s) y desfase (s, negativo) del ciclo de deriva. */
  dur: number;
  delay: number;
  /** Desde dónde entra (px, hacia el centro del logo). */
  fx: number;
  fy: number;
};

/* Contornos (viewBox 60 × 160): punta arriba, cutícula redondeada abajo. */
const CUTICLE = "L56 138 Q56 160 30 160 Q4 160 4 138";
const SHAPES: Record<Shape, string> = {
  almendra: `M30 0 C44 20 56 60 56 100 ${CUTICLE} L4 100 C4 60 16 20 30 0 Z`,
  ovalada: `M30 0 C50 0 56 40 56 90 ${CUTICLE} L4 90 C4 40 10 0 30 0 Z`,
  coffin: `M16 0 L44 0 L56 110 ${CUTICLE} L4 110 Z`,
};

/* Línea de sonrisa de la francesita: los costados bajan más que el centro. */
const FRENCH = "M0 0 H60 V58 C46 40 14 40 0 58 Z";
/* Brillitos del milky glitter: [cx, cy, r, opacidad]. */
const GLITTER: Array<[number, number, number, number]> = [
  [20, 38, 1.6, 1],
  [36, 52, 1.1, 0.9],
  [27, 70, 1.9, 1],
  [42, 84, 1.3, 0.85],
  [16, 96, 1.2, 0.9],
  [33, 104, 1.7, 1],
  [22, 122, 1.1, 0.8],
  [40, 128, 1.4, 0.95],
  [30, 140, 1.0, 0.8],
  [46, 112, 0.9, 0.7],
];

/** Celular: x y % del hero; todas con el borde de arriba por debajo del nav y por arriba del 52 %. */
const MOBILE: Spec[] = [
  { x: "3%", y: "16%", size: 80, shape: "almendra", color: "#4a0e0e", r: -16, dx: 10, dy: -14, dur: 11, delay: 0, fx: 48, fy: 28 },
  { x: "84%", y: "12%", size: 64, shape: "ovalada", color: "#e8c4b0", finish: "french", r: 18, dx: -8, dy: -12, dur: 12, delay: -3, fx: -48, fy: 28 },
  { x: "86%", y: "46%", size: 56, shape: "almendra", color: "#f6efe6", finish: "glitter", r: 26, dx: 8, dy: -12, dur: 10, delay: -6, fx: -44, fy: -24 },
];

/** Desde md: las cuatro esquinas del logo. */
const DESKTOP: Spec[] = [
  { x: "4%", y: "24%", size: 110, shape: "almendra", color: "#4a0e0e", r: -18, dx: 22, dy: -34, dur: 11, delay: 0, fx: 60, fy: 40 },
  { x: "88%", y: "18%", size: 90, shape: "ovalada", color: "#e8c4b0", finish: "french", r: 20, dx: -24, dy: -30, dur: 12, delay: -2, fx: -60, fy: 40 },
  { x: "7%", y: "66%", size: 64, shape: "almendra", color: "#f6efe6", finish: "glitter", r: 28, dx: 16, dy: -22, dur: 9.5, delay: -5, fx: 60, fy: -40 },
  { x: "90%", y: "62%", size: 88, shape: "coffin", color: "#b51c1c", r: -12, dx: -18, dy: -32, dur: 13, delay: -7, fx: -60, fy: -40 },
];

export function FloatingNails({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      <div className="absolute inset-0 md:hidden">
        {MOBILE.map((n, i) => (
          <FloatingNail key={i} spec={n} index={i} />
        ))}
      </div>
      <div className="absolute inset-0 hidden md:block">
        {DESKTOP.map((n, i) => (
          <FloatingNail key={i} spec={n} index={i} />
        ))}
      </div>
    </div>
  );
}

function FloatingNail({ spec: n, index }: { spec: Spec; index: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const shape = SHAPES[n.shape];
  const clip = `fn-c-${uid}`;
  const vol = `fn-v-${uid}`;

  return (
    <div
      className={s.nail}
      style={
        {
          left: n.x,
          top: n.y,
          width: n.size * 0.375,
          height: n.size,
          animationDelay: `${150 + index * 70}ms`,
          "--fx": `${n.fx}px`,
          "--fy": `${n.fy}px`,
        } as CSSProperties
      }
    >
      <div
        data-ambient="drift"
        className="size-full"
        style={
          {
            animation: `drift calc(${n.dur}s * var(--amb-k)) ease-in-out ${n.delay}s infinite`,
            "--r": `${n.r}deg`,
            "--dx": `${n.dx}px`,
            "--dy": `${n.dy}px`,
          } as CSSProperties
        }
      >
        <svg
          data-nail=""
          viewBox="0 0 60 160"
          className="block size-full overflow-visible [filter:var(--filter-paper)]"
        >
          <defs>
            <clipPath id={clip}>
              <path d={shape} />
            </clipPath>
            {/* Volumen del gel: la uña es un cilindro, oscurece en los bordes y brilla a un tercio. */}
            <linearGradient id={vol} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#000" stopOpacity="0.18" />
              <stop offset="0.3" stopColor="#fff" stopOpacity="0.18" />
              <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path d={shape} fill={n.color} />
          <g clipPath={`url(#${clip})`}>
            {n.finish === "french" ? <path d={FRENCH} fill="#fef7e7" /> : null}
            {n.finish === "glitter"
              ? GLITTER.map(([cx, cy, r, o], k) => (
                  <circle key={k} cx={cx} cy={cy} r={r} fill={k % 3 ? "#fff6c8" : "#e6cf8f"} opacity={o} />
                ))
              : null}
            <rect width="60" height="160" fill={`url(#${vol})`} />
            {/* reflejo del top coat */}
            <ellipse cx="19" cy="46" rx="4.5" ry="22" fill="#fff" opacity="0.5" transform="rotate(-8 19 46)" />
          </g>
        </svg>
      </div>
    </div>
  );
}
