import type { CSSProperties } from "react";
import { cn } from "@/lib/format";

type Props = {
  /** Ancho en px (el alto es 0,6 × el ancho). Separador 20 · sello 14–18 · favorito del talle 16. */
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** Sin `title` es decorativo (`aria-hidden`). */
  title?: string;
};

/**
 * Moño de la Kitty (DESIGN §6.3): lazos rojo moño, nudo rojo profundo y contorno carbón como el del logo.
 * Uno por pantalla. El contorno mide 1,5 px a 40 px de ancho y nunca baja de 1 px reales en tamaños chicos,
 * para que el moño no pierda el dibujo a 14–20 px.
 */
export function Bow({ size = 40, className, style, title }: Props) {
  const outlinePx = Math.max(1, (size * 1.5) / 40);
  const strokeWidth = (outlinePx * 40) / size; // en unidades del viewBox
  return (
    <svg
      width={size}
      height={Math.round(size * 0.6 * 100) / 100}
      viewBox="0 0 40 24"
      className={cn("block shrink-0 overflow-visible", className)}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <g stroke="#2a2321" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M20 12C16.8 5.6 9.6 1.8 5.4 4.2 1.6 6.4 1.8 17.4 5.6 20c4.2 2.8 10.6-.8 14.4-8Z"
          style={{ fill: "var(--red-600)" }}
        />
        <path
          d="M20 12c3.2-6.4 10.4-10.2 14.6-7.8 3.8 2.2 3.6 13.2-.2 15.8-4.2 2.8-10.6-.8-14.4-8Z"
          style={{ fill: "var(--red-600)" }}
        />
        <ellipse cx="20" cy="12" rx="4" ry="4.6" style={{ fill: "var(--red-800)" }} />
      </g>
    </svg>
  );
}
