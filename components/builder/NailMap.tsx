"use client";

import type { BuilderSelection } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { FINGERS, FINGER_SHORT, HANDS, nailSpec } from "@/lib/nails";
import { cn } from "@/lib/format";

/**
 * Las 10 uñas del set, mano derecha y mano izquierda, cada una con su color. Se tocan para marcarlas (una o varias).
 * `marked` pinta un puntito en las uñas que ya llevan algo (un diseño propio, o el dije que se está ubicando).
 */
export function NailMap({
  sel,
  config,
  selected,
  onToggle,
  marked,
  label,
  size = "md",
}: {
  sel: BuilderSelection;
  config: BuilderConfig;
  selected: number[];
  onToggle: (i: number) => void;
  marked?: (i: number) => boolean;
  label: string;
  size?: "sm" | "md";
}) {
  const hex = (id: string) => config.bases.find((b) => b.id === id)?.hex ?? "#e8c4b0";
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-x-6 gap-y-3">
      {HANDS.map((hand, h) => (
        <div key={hand}>
          <p className="mb-1 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">{hand}</p>
          <div className="flex items-end gap-1.5">
            {FINGERS.map((finger, f) => {
              const i = h * 5 + f;
              const on = selected.includes(i);
              const spec = nailSpec(sel, i);
              return (
                <button
                  key={finger}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${finger} ${hand.toLowerCase()}`}
                  onClick={() => onToggle(i)}
                  className="group flex flex-col items-center gap-1"
                >
                  <span
                    className={cn(
                      "relative block rounded-t-full rounded-b-md ring-1 ring-black/15 transition-[box-shadow,translate] duration-150",
                      size === "sm" ? "h-7 w-5" : "h-10 w-7",
                      // el pulgar es más ancho, como en la mano
                      f === 0 && (size === "sm" ? "w-6" : "w-8"),
                      on ? "-translate-y-0.5 shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-bordo)]" : "group-hover:shadow-[0_0_0_2px_#fff,0_0_0_3px_rgba(74,14,14,0.3)]",
                    )}
                    style={{ background: hex(spec.color) }}
                  >
                    {(marked ? marked(i) : spec.custom) && (
                      <span aria-hidden className="absolute -top-1 -right-1 size-2.5 rounded-full bg-bordo ring-2 ring-cream" />
                    )}
                  </span>
                  <span className={cn("text-[10px] leading-none font-semibold", on ? "text-bordo" : "text-ink-soft")}>{FINGER_SHORT[f]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
