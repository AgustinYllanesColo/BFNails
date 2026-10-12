"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/format";
import { Icon } from "@/components/ui/icons";

/**
 * Gotas de esmalte para elegir un color (PLAN W2-D.4): color base y color de la punta. Grilla de 6 columnas (también
 * en desktop, en dos filas) de botones `role="radio"` dentro de un `radiogroup`, con el patrón de flechas estándar:
 * izquierda/derecha recorren, arriba/abajo saltan de fila, Inicio/Fin van a los extremos y la elección sigue al foco.
 *
 * - Cada gota es el hex del color con un brillo de laca (`radial-gradient` arriba a la izquierda) y `shadow-drop`.
 * - Elegida: anillo bordó separado por un aro crema y un check blanco o bordó según la luminancia del color.
 * - En el celular no hay nombre debajo (el elegido va en el encabezado del paso); desde lg, nombre de 13 px.
 * - El nombre accesible es el del color ("Bordó"); el grupo lleva su propio nombre ("Color base").
 */
export type ColorOption = { id: string; label: string; hex: string };

type Props = {
  options: ColorOption[];
  value: string;
  onChange: (id: string) => void;
  /** Nombre accesible del grupo. */
  label: string;
  /** Id de un título visible que nombra el grupo (en vez de `label`). */
  labelledBy?: string;
  className?: string;
};

const COLS = 6;
const BORDO_L = 0.0118; // #4a0e0e
const CREAM_L = 0.935; // #fef7e7

/** Brillo de laca: un reflejo duro arriba a la izquierda que se apaga rápido (sin borde). */
const LACQUER = "radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.6) 0 8%, rgb(255 255 255 / 0) 34%)";

/**
 * "Transparente" es gel incoloro: la gota se dibuja como vidrio (deja ver el crema de atrás, con reflejo y un filo de
 * luz) para que no se confunda con el blanco y el milky, que en el celular van sin nombre.
 */
const CLEAR_STYLE = {
  backgroundColor: "rgb(255 253 248 / 0.25)",
  backgroundImage: [
    "radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.95) 0 9%, rgb(255 255 255 / 0) 30%)",
    "linear-gradient(135deg, rgb(255 255 255 / 0) 52%, rgb(255 255 255 / 0.75) 58%, rgb(255 255 255 / 0) 64%)",
    "radial-gradient(circle at 68% 78%, rgb(74 14 14 / 0.12), rgb(74 14 14 / 0) 55%)",
  ].join(", "),
};

function isClear(o: ColorOption): boolean {
  return /transparen|clear/i.test(`${o.id} ${o.label}`);
}

/** Luminancia relativa (WCAG) de un hex `#rrggbb` o `#rgb`. */
export function luminance(hex: string): number {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return 0.5;
  const ch = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function ColorDrops({ options, value, onChange, label, labelledBy, className }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1;
    let next = -1;
    switch (e.key) {
      case "ArrowRight":
        next = index === last ? 0 : index + 1;
        break;
      case "ArrowLeft":
        next = index === 0 ? last : index - 1;
        break;
      case "ArrowDown":
        next = index + COLS <= last ? index + COLS : index % COLS;
        break;
      case "ArrowUp":
        next = index - COLS >= 0 ? index - COLS : Math.min(last, index + COLS * Math.floor(last / COLS));
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    const target = options[next];
    if (!target) return;
    onChange(target.id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={cn(
        "grid grid-cols-[repeat(6,44px)] justify-between gap-y-3 sm:justify-start sm:gap-x-5 lg:max-w-xl lg:grid-cols-6 lg:justify-normal lg:gap-x-2 lg:gap-y-4",
        className,
      )}
    >
      {options.map((o, i) => {
        const selected = o.id === value;
        // check bordó o crema: el que más contraste haga con el color (WCAG)
        const L = luminance(o.hex);
        const darkCheck = (L + 0.05) / (BORDO_L + 0.05) >= (CREAM_L + 0.05) / (L + 0.05);
        const clear = isClear(o);
        return (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.label}
            title={o.label}
            tabIndex={i === selectedIndex ? 0 : -1}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className="group/drop flex flex-col items-center gap-2 rounded-pill select-none focus-visible:[outline-offset:5px] lg:rounded-md lg:focus-visible:[outline-offset:2px]"
          >
            <span
              aria-hidden
              className={cn(
                "relative grid size-11 shrink-0 place-items-center rounded-full shadow-drop transition-[box-shadow,scale] duration-150 ease-[var(--ease-ui)] group-active/drop:scale-[0.94] lg:size-12",
                // aro interior: que el blanco, el milky y el transparente se lean sobre el crema
                "after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:ring-1 after:ring-inset",
                clear ? "after:ring-ink/25" : "after:ring-ink/15",
                selected
                  ? "ring-2 ring-bordo ring-offset-2 ring-offset-cream"
                  : "[@media(hover:hover)]:group-hover/drop:ring-2 [@media(hover:hover)]:group-hover/drop:ring-bordo/25 [@media(hover:hover)]:group-hover/drop:ring-offset-2 [@media(hover:hover)]:group-hover/drop:ring-offset-cream",
              )}
              style={clear ? CLEAR_STYLE : { backgroundColor: o.hex, backgroundImage: LACQUER }}
            >
              <Icon
                name="check"
                size={18}
                className={cn(
                  "transition-[opacity,scale] duration-150 ease-[var(--ease-ui)]",
                  darkCheck || clear ? "text-bordo" : "text-cream",
                  selected ? "scale-100 opacity-100" : "scale-75 opacity-0",
                )}
              />
            </span>
            <span
              className={cn(
                "text-meta hidden max-w-full truncate px-1 text-center transition-colors duration-150 lg:block",
                selected ? "text-bordo font-semibold" : "text-ink-soft",
              )}
            >
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
