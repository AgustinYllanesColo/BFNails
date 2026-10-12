import { useId } from "react";
import { cn } from "@/lib/format";
import { Bow } from "@/components/brand/Bow";

type Props = {
  /** Texto que da la vuelta (con su separador al final, p. ej. "hechas a mano por Bren · Lanús · "). */
  text: string;
  /** Diámetro en px. */
  size?: number;
  className?: string;
};

/** Radio de la línea de base del texto (viewBox 100). */
const R = 38;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Sello giratorio (PLAN W2-A.4): un sticker crema con el texto en Figtree 600 de 12 px en MAYÚSCULAS que gira sin
 * parar alrededor del moño de la Kitty. El texto se reparte exacto en la vuelta (`textLength`), así el separador del
 * final empalma con el principio sin hueco ni encimado.
 *
 * Tres nodos: el sticker (quieto) › el anillo de texto (`animate-spin-slow`, `data-ambient="move"`: un `div`, nunca un
 * hijo del SVG) › el moño del centro (quieto). La entrada la pone quien lo usa, en un wrapper. Decorativo.
 */
export function SpinningBadge({ text, size = 140, className }: Props) {
  const id = `badge-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // 12 px reales: el SVG mide `size` px para 100 unidades
  const fontSize = (12 * 100) / size;

  return (
    <div
      aria-hidden
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <span className="bg-surface shadow-sticker ring-line absolute inset-0 rounded-full ring-1" />
      <div data-ambient="move" className="animate-spin-slow absolute inset-0">
        <svg viewBox="0 0 100 100" className="block size-full">
          <defs>
            <path id={id} d={`M50,50 m-${R},0 a${R},${R} 0 1,1 ${R * 2},0 a${R},${R} 0 1,1 -${R * 2},0`} />
          </defs>
          <text
            className="fill-bordo font-sans font-semibold uppercase"
            style={{ fontSize, letterSpacing: "0.12em" }}
          >
            <textPath href={`#${id}`} textLength={CIRCUMFERENCE} lengthAdjust="spacing">
              {text}
            </textPath>
          </text>
        </svg>
      </div>
      <Bow size={Math.round(size * 0.2)} className="relative" />
    </div>
  );
}
