import { useId } from "react";
import type { Finish, Shape } from "@/lib/types";
import { cn } from "@/lib/format";

/**
 * Muestra estática de uñas en SVG (PLAN W1-F2.13): una uña o un abanico de cinco con la forma, el color base, la
 * francesita y la terminación del set. Se usa donde una foto o la vista previa 3D serían caras o no existen: la
 * ficha que vuela a la bolsita, el PriceDock del armador, líneas del carrito.
 *
 * Geometría de una uña (unidades del viewBox): ancho 4 → 56, punta arriba (y ≈ 0), costados hasta y = 138 y la
 * cutícula redondeada `L56 138 Q56 160 30 160 Q4 160 4 138`. El abanico rota cada uña `(n − 2) · 8°` desde su base.
 * Server-safe (sin estado); los ids de gradientes y recortes salen de `useId()`.
 */

/** Costados y punta de cada forma, de la base izquierda (4,138) a la base derecha (56,138). */
const TIP: Record<Shape, string> = {
  cuadrada: "M4 138 V21 Q4 8 17 8 H43 Q56 8 56 21 V138",
  ovalada: "M4 138 V46 C4 19 15 6 30 6 C45 6 56 19 56 46 V138",
  almendra: "M4 138 V62 C4 36 19 5 30 4 C41 5 56 36 56 62 V138",
  stiletto: "M4 138 V74 C4 50 21 18 30 1 C39 18 56 50 56 74 V138",
  coffin: "M4 138 V46 L12.6 10.2 Q13.6 6.5 17.5 6.5 H42.5 Q46.4 6.5 47.4 10.2 L56 46 V138",
};
const CUTICLE = " Q56 160 30 160 Q4 160 4 138 Z";

/** Dónde arranca el reflejo (más abajo en las formas con punta, donde la uña ya es ancha). */
const SHINE_TOP: Record<Shape, number> = {
  cuadrada: 20,
  ovalada: 24,
  almendra: 36,
  stiletto: 52,
  coffin: 24,
};

/** Base del abanico: pivote en el centro de la cutícula. */
const PIVOT = { x: 30, y: 160 };

type Placement = { n: number; rotate: number; dx: number; dy: number };

/** Cinco uñas en abanico; el orden de dibujo deja la del medio arriba de todo (pirámide). */
const FAN: Placement[] = [0, 4, 1, 3, 2].map((n) => ({
  n,
  rotate: (n - 2) * 8,
  dx: (n - 2) * 13,
  dy: Math.abs(n - 2) * 5,
}));
const SINGLE: Placement[] = [{ n: 2, rotate: 0, dx: 0, dy: 0 }];

/** Caja cuadrada que contiene todas las uñas (esquinas del rectángulo de cada uña, rotadas). */
function squareBox(placements: Placement[]): string {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of placements) {
    const a = (p.rotate * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    for (const [x, y] of [
      [4, 0],
      [56, 0],
      [56, 160],
      [4, 160],
    ]) {
      const rx = x - PIVOT.x;
      const ry = y - PIVOT.y;
      const X = PIVOT.x + rx * cos - ry * sin + p.dx;
      const Y = PIVOT.y + rx * sin + ry * cos + p.dy;
      minX = Math.min(minX, X);
      minY = Math.min(minY, Y);
      maxX = Math.max(maxX, X);
      maxY = Math.max(maxY, Y);
    }
  }
  const pad = 4;
  const side = Math.max(maxX - minX, maxY - minY) + pad * 2;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const r = (v: number) => Math.round(v * 100) / 100;
  return `${r(cx - side / 2)} ${r(cy - side / 2)} ${r(side)} ${r(side)}`;
}
const VIEWBOX = { 1: squareBox(SINGLE), 5: squareBox(FAN) } as const;

const LEOPARD = new Set(["leopard", "leopardo", "animal-print"]);

type Props = {
  shape: Shape;
  /** Color base (cualquier color CSS) o `"animal-print"` para el leopardo de la Kitty. */
  base: string;
  /** Color de la francesita (punta), si el set la lleva. */
  tip?: string;
  finish?: Finish;
  /** Una uña (ficha que vuela, miniaturas) o el abanico de cinco (default). */
  count?: 1 | 5;
  /** Lado del cuadrado en px. */
  size?: number;
  className?: string;
  /** Sin `title` es decorativa (`aria-hidden`). */
  title?: string;
};

export function NailSwatch({
  shape,
  base,
  tip,
  finish = "glossy",
  count = 5,
  size = 96,
  className,
  title,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = {
    nail: `ns-${uid}-nail`,
    clip: `ns-${uid}-clip`,
    vol: `ns-${uid}-vol`,
    chrome: `ns-${uid}-chrome`,
    leo: `ns-${uid}-leo`,
  };
  const placements = count === 1 ? SINGLE : FAN;
  const leopard = LEOPARD.has(base);
  const fill = leopard ? `url(#${ids.leo})` : base;
  const shineTop = SHINE_TOP[shape];

  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEWBOX[count]}
      className={cn("block shrink-0 overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-nail-swatch={count}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <path id={ids.nail} d={TIP[shape] + CUTICLE} />
        <clipPath id={ids.clip}>
          <use href={`#${ids.nail}`} />
        </clipPath>
        {/* Volumen: la uña es curva de costado a costado (más oscura en los bordes, luz cerca del centro). */}
        <linearGradient id={ids.vol} x1="4" x2="56" y1="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity={finish === "mate" ? 0.14 : 0.22} />
          <stop offset="0.2" stopColor="#000" stopOpacity="0.03" />
          <stop offset="0.42" stopColor="#fff" stopOpacity={finish === "mate" ? 0.06 : 0.14} />
          <stop offset="0.7" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={finish === "mate" ? 0.16 : 0.26} />
        </linearGradient>
        {finish === "cromado" ? (
          <linearGradient id={ids.chrome} x1="0" x2="0.35" y1="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="0.3" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.5" stopColor="#000" stopOpacity="0.22" />
            <stop offset="0.72" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#000" stopOpacity="0.12" />
          </linearGradient>
        ) : null}
        {leopard ? (
          <pattern id={ids.leo} patternUnits="userSpaceOnUse" width="84" height="84">
            <image href="/brand/leopard-tile.svg" width="84" height="84" />
          </pattern>
        ) : null}
      </defs>

      {placements.map((p) => (
        <g
          key={p.n}
          transform={`translate(${p.dx} ${p.dy}) rotate(${p.rotate} ${PIVOT.x} ${PIVOT.y})`}
        >
          <use href={`#${ids.nail}`} style={{ fill }} />
          <g clipPath={`url(#${ids.clip})`}>
            {tip ? (
              /* Francesita: línea de sonrisa más baja en los costados que en el centro. */
              <path d="M-2 56 Q30 20 62 56 V-4 H-2 Z" style={{ fill: tip }} />
            ) : null}
            <rect x="0" y="0" width="60" height="164" fill={`url(#${ids.vol})`} />
            {finish === "cromado" ? (
              <rect x="0" y="0" width="60" height="164" fill={`url(#${ids.chrome})`} />
            ) : null}
            {/* Sombra de cutícula */}
            <path
              d="M6 147 Q30 166 54 147"
              fill="none"
              stroke="#000"
              strokeOpacity="0.1"
              strokeWidth="4"
            />
            {finish !== "mate" ? (
              <>
                <rect
                  x="13"
                  y={shineTop}
                  width="7"
                  height="54"
                  rx="3.5"
                  fill="#fff"
                  opacity="0.6"
                />
                <rect
                  x="14"
                  y={shineTop + 62}
                  width="5"
                  height="11"
                  rx="2.5"
                  fill="#fff"
                  opacity="0.32"
                />
              </>
            ) : null}
          </g>
          <use
            href={`#${ids.nail}`}
            fill="none"
            stroke="rgb(42 35 33 / 0.2)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ))}
    </svg>
  );
}
