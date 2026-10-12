"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/format";

/**
 * Control segmentado de elección única (PLAN W1-F2.11): "Estándar / En mm / Por WhatsApp", "A domicilio / En sucursal".
 * `role="radiogroup"` con opciones `role="radio"`; el fondo bordó se desliza con un resorte corto
 * (`layoutId` único por instancia: dos Segmented en la misma página no se pisan). Flechas, Inicio y Fin mueven la
 * selección con tabindex itinerante. Cada opción mide 44 px de alto.
 */
export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
};

type Props<T extends string> = {
  options: SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Nombre del grupo para lectores de pantalla. */
  label?: string;
  /** id de un título visible que nombra al grupo (en lugar de `label`). */
  labelledBy?: string;
  disabled?: boolean;
  className?: string;
};

const SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  labelledBy,
  disabled = false,
  className,
}: Props<T>) {
  const layoutId = `seg-${useId()}`;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = (i: number) => !disabled && !options[i]?.disabled;
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabStop = selectedIndex >= 0 ? selectedIndex : options.findIndex((_, i) => enabled(i));

  const move = (from: number, step: 1 | -1 | "first" | "last") => {
    const n = options.length;
    let i = step === "first" ? -1 : step === "last" ? n : from;
    const dir = step === "first" ? 1 : step === "last" ? -1 : step;
    for (let k = 0; k < n; k++) {
      i = (i + dir + n) % n;
      if (enabled(i)) {
        onChange(options[i].value);
        refs.current[i]?.focus();
        return;
      }
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const map: Record<string, 1 | -1 | "first" | "last"> = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
      Home: "first",
      End: "last",
    };
    const step = map[e.key];
    if (step === undefined) return;
    e.preventDefault();
    move(i, step);
  };

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-disabled={disabled || undefined}
      className={cn(
        "rounded-pill bg-cream-deep grid min-h-11 p-1",
        disabled && "opacity-60",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o, i) => {
        const selected = i === selectedIndex;
        const off = !enabled(i);
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={off || undefined}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => {
              if (!off && !selected) onChange(o.value);
            }}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "rounded-pill relative isolate inline-flex min-h-11 min-w-0 items-center justify-center gap-1.5 px-3 text-center text-sm leading-tight font-semibold transition-[color,scale] duration-150 ease-[var(--ease-ui)] select-none",
              selected
                ? "text-cream"
                : off
                  ? "text-ink-faint"
                  : "text-ink-soft hover:text-ink active:scale-[0.97]",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                transition={SPRING}
                aria-hidden
                className="rounded-pill bg-bordo absolute inset-0 -z-10 shadow-sm"
              />
            ) : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
