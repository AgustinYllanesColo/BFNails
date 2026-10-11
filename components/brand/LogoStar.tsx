import type { CSSProperties } from "react";
import { cn } from "@/lib/format";

/** Estrella del logo (DESIGN §6.1): 5 puntas filosas, radio interior .36, viewBox 100. */
export const LOGO_STAR_PATH =
  "M50 4 60.29 37.84 95.65 37.17 66.64 57.41 78.21 90.83 50 69.5 21.79 90.83 33.36 57.41 4.35 37.17 39.71 37.84Z";

/** La deformación de las estrellas grandes del logo. Va en `transform`, así suma con keyframes de `rotate`/`scale`. */
export const LOGO_STAR_TILT = "skewX(-8deg) rotate(-12deg)";

type Props = {
  /** Lado en px. Composición en tríos 1 : .45 : .25; ≤ 56 px en móvil; ≤ 3 sueltas por viewport. */
  size?: number;
  /** Color del relleno. Siempre `--bordo-star` sobre crema; amarillo solo como separador sobre bordó. */
  fill?: string;
  /** Inclinación del logo (`skewX(-8deg) rotate(-12deg)`). */
  tilt?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Sin `title` es decorativa (`aria-hidden`). */
  title?: string;
};

export function LogoStar({
  size = 48,
  fill = "var(--bordo-star)",
  tilt = false,
  className,
  style,
  title,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn("block shrink-0", className)}
      style={tilt ? { transform: LOGO_STAR_TILT, ...style } : style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={LOGO_STAR_PATH} style={{ fill }} />
    </svg>
  );
}
