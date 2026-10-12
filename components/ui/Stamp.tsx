"use client";

import { useId, type AnimationEvent } from "react";
import { cn } from "@/lib/format";
import { Icon } from "@/components/ui/icons";

/**
 * Sello de goma rojo (PLAN W1-F2.15): el único del sitio (pedido recibido, "Bren se pone a trabajar", "Enviado").
 * Doble filete rojo, tinta con huecos (`--ink-mask`) y apoyado a -8° con opacidad .92. La rotación vive en el nodo del
 * sello y el wrapper queda quieto (§1 c): así `stamp-in` puede escribir `transform` sin sumarse a otra rotación.
 * - `play`: cae con `stamp-in` (450 ms `--ease-bounce`); al terminar llama a `onLanded`. Con reduced-motion solo
 *   aparece (`stamp-fade`, 200 ms, hasta la misma opacidad .92 del reposo) con la misma inclinación.
 * - md: Imbue 28 px + moño de 18 px. sm: Figtree 700 12 px (pasa a dos líneas balanceadas si no entra) + Kitty
 *   entintada de 32 px o moño de 14 px.
 * - Tinta de un solo color: el moño es el ícono monocromo `bow` y la Kitty es el dibujo del logo pasado a tinta roja.
 *   No lleva el `Bow` de marca a dos colores (rojo + contorno carbón): un sello real es de una tinta.
 * - Caja: el wrapper reserva el alto que ocupa el sello girado (7 % del ancho arriba y abajo, 4 px a los costados), así
 *   no pisa el texto vecino ni lo recorta un padre con `overflow-hidden`. Solo la caída de `stamp-in` (escala 1,8) se
 *   sale un instante de la caja.
 * - Es de cliente por `onAnimationEnd`; desde un componente de servidor se usa igual sin `onLanded`.
 */
type Props = {
  label: string;
  icon?: "bow" | "kitty";
  size?: "sm" | "md";
  play?: boolean;
  onLanded?: () => void;
  className?: string;
};

export function Stamp({ label, icon, size = "md", play = false, onLanded, className }: Props) {
  const md = size === "md";
  return (
    <span
      className={cn(
        // girar -8° un ancho W suma ≈ 0,07·W arriba y abajo: lo reservan los dos pseudo (el % sale del ancho del wrapper)
        "inline-flex max-w-full flex-col items-start px-1 align-middle before:block before:pt-[7%] before:content-[''] after:block after:pt-[7%] after:content-['']",
        className,
      )}
      data-stamp={play ? "play" : "rest"}
    >
      <span
        onAnimationEnd={(e: AnimationEvent<HTMLSpanElement>) => {
          if (e.target === e.currentTarget) onLanded?.();
        }}
        className={cn(
          "border-red text-red inline-flex max-w-full items-center rounded-sm border-[3px] border-double [mask-image:var(--ink-mask)] [mask-size:120px] [-webkit-mask-image:var(--ink-mask)] [-webkit-mask-size:120px]",
          md
            ? "font-display gap-2.5 px-3.5 pt-1.5 pb-1 text-[28px] leading-none tracking-[0.04em] uppercase"
            : "gap-2 px-3 py-1.5 font-sans text-[12px] leading-[1.15] font-bold tracking-[0.04em] uppercase",
          play &&
            "animate-[stamp-in_450ms_var(--ease-bounce)_both] motion-reduce:animate-[stamp-fade_200ms_ease-out_both]",
        )}
        style={{
          transform: "rotate(-8deg)",
          opacity: 0.92,
          ["--icon-accent" as string]: "currentColor",
        }}
      >
        {icon === "kitty" ? (
          <InkedKitty />
        ) : icon === "bow" ? (
          <Icon name="bow" size={md ? 18 : 14} className={md ? "-mt-0.5" : undefined} />
        ) : null}
        <span className={cn("min-w-0", md ? "whitespace-nowrap" : "text-balance")}>{label}</span>
      </span>
    </span>
  );
}

/**
 * La Kitty del logo pasada a tinta: los trazos oscuros quedan rojos y lo claro (cara, papel) se vuelve transparente,
 * como si el sello estuviera tallado con su dibujo. Un filtro SVG mapea luminancia → alfa (sin blend).
 */
function InkedKitty() {
  const id = `ink-kitty-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={27} height={32} viewBox="0 0 508 600" aria-hidden className="shrink-0">
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.71  0 0 0 0 0.11  0 0 0 0 0.11  -0.29 -0.97 -0.1 1.36 0"
          />
        </filter>
      </defs>
      <image href="/brand/kitty.webp" width="508" height="600" filter={`url(#${id})`} />
    </svg>
  );
}
