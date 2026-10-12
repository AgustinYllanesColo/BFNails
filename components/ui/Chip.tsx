"use client";

import { useId, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { Icon } from "@/components/ui/icons";

/**
 * Chip de elección (PLAN W1-F2.2): filtros del catálogo, opciones del armador, modos de talle.
 * - Por defecto es un toggle (`aria-pressed`). Con `role="radio"` es una elección única (`role="radio"` +
 *   `aria-checked`; el grupo lleva `role="radiogroup"`).
 * - `multi`: elección múltiple con ícono `plus` que gira 90° y se cruza con `check` (180 ms).
 * - `disabled` solo aplica si no está seleccionado (un chip elegido nunca se deshabilita): queda enfocable con
 *   `aria-disabled`, el click no hace nada y se describe con `disabledHint`.
 * Alto mínimo 44 px en el celular (40 px desde md, con puntero fino).
 */
type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "role" | "children"> & {
  selected?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  className?: string;
  /** Dato secundario a la derecha (p. ej. "+$ 2.000"). */
  hint?: ReactNode;
  /** Color de la muestra circular (cualquier color CSS). */
  swatch?: string;
  disabled?: boolean;
  /** Texto para lectores de pantalla cuando el chip está deshabilitado. */
  disabledHint?: string;
  role?: "radio";
  multi?: boolean;
};

export function Chip({
  selected = false,
  onClick,
  children,
  className,
  hint,
  swatch,
  disabled = false,
  disabledHint = "Sin diseños con esta combinación",
  role,
  multi = false,
  ...rest
}: Props) {
  const hintId = useId();
  const off = disabled && !selected;
  const state =
    role === "radio"
      ? { role: "radio" as const, "aria-checked": selected }
      : { "aria-pressed": selected };

  return (
    <>
      <button
        type="button"
        {...rest}
        {...state}
        aria-disabled={off || undefined}
        aria-describedby={
          [rest["aria-describedby"], off ? hintId : null].filter(Boolean).join(" ") || undefined
        }
        onClick={(e) => {
          if (off) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        className={cn(
          "rounded-pill inline-flex min-h-11 items-center gap-2 border px-4 text-sm font-medium transition-[background-color,border-color,color,box-shadow,scale] duration-150 ease-[var(--ease-ui)] select-none active:scale-[0.97] md:min-h-10",
          selected
            ? "border-bordo bg-bordo text-cream shadow-sm"
            : off
              ? "bg-cream-deep text-ink-faint border-transparent shadow-none active:scale-100"
              : "border-sand/60 bg-surface text-ink hover:border-bordo/60 shadow-xs",
          multi && "pl-3",
          className,
        )}
      >
        {multi ? (
          <span aria-hidden className="relative grid size-3.5 shrink-0 place-items-center">
            <Icon
              name="plus"
              size={14}
              className={cn(
                "absolute transition-[opacity,rotate] duration-[180ms] ease-[var(--ease-ui)]",
                selected ? "rotate-90 opacity-0" : "rotate-0 opacity-100",
              )}
            />
            <Icon
              name="check"
              size={14}
              className={cn(
                "absolute transition-[opacity,rotate] duration-[180ms] ease-[var(--ease-ui)]",
                selected ? "rotate-0 opacity-100" : "-rotate-90 opacity-0",
              )}
            />
          </span>
        ) : null}
        {swatch ? (
          <span
            aria-hidden
            className={cn(
              "size-4 shrink-0 rounded-full transition-[box-shadow] duration-150",
              selected ? "ring-cream ring-2" : "ring-1 ring-black/10",
            )}
            style={{ background: swatch }}
          />
        ) : null}
        <span>{children}</span>
        {hint ? (
          <span
            className={cn(
              "text-meta transition-colors duration-150",
              selected ? "text-on-bordo-muted" : off ? "text-ink-faint" : "text-ink-soft",
            )}
          >
            {hint}
          </span>
        ) : null}
      </button>
      {/* Fuera del botón: si estuviera adentro se sumaría a su nombre accesible. sr-only es absoluto: no ocupa lugar. */}
      {off ? (
        <span id={hintId} className="sr-only">
          {disabledHint}
        </span>
      ) : null}
    </>
  );
}
