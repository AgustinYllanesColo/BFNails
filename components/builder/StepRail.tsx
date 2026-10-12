"use client";

import { motion } from "motion/react";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/format";
import type { StepSummary } from "./StepSheet";

type Props = {
  steps: StepSummary[];
  current: number;
  onGo: (n: number) => void;
  className?: string;
};

const PILL_SPRING = { type: "spring", stiffness: 500, damping: 40 } as const;

/**
 * Riel de pasos del armador en desktop (PLAN W2-D.3), arriba del panel fijo: una sola instancia (el armador lo monta
 * solo desde lg). El paso actual es una píldora bordó con su nombre que se desliza de paso en paso
 * (`layoutId="step-pill-desk"`, resorte 500/40); los pasos ya elegidos muestran un check y la barra de abajo crece
 * con ellos (`scaleX(tocados / 7)`, 300 ms). Cada paso lleva a su sección.
 */
export function StepRail({ steps, current, onGo, className }: Props) {
  const touched = steps.filter((s) => s.touched).length;
  return (
    <nav aria-label="Pasos del armador" className={cn("shrink-0", className)}>
      <ol className="flex items-center gap-1.5">
        {steps.map((s) => {
          const active = s.n === current;
          return (
            <motion.li key={s.n} layout="position" transition={PILL_SPRING}>
              <button
                type="button"
                onClick={() => onGo(s.n)}
                aria-current={active ? "step" : undefined}
                aria-label={`Paso ${s.n}: ${s.title}${s.touched ? ", elegido" : ""}`}
                title={s.title}
                className={cn(
                  "rounded-pill relative flex h-9 min-w-9 items-center justify-center text-[13px] font-semibold transition-[background-color,box-shadow,scale] duration-150 ease-[var(--ease-ui)] active:scale-[0.96]",
                  active
                    ? "px-3.5"
                    : s.touched
                      ? "bg-cream-deep text-bordo [@media(hover:hover)]:hover:bg-cream-ink"
                      : "text-ink-soft ring-line ring-1 ring-inset [@media(hover:hover)]:hover:ring-sand",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="step-pill-desk"
                    transition={PILL_SPRING}
                    className="bg-bordo rounded-pill absolute inset-0 shadow-sm"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative z-[1] flex items-center gap-1.5 whitespace-nowrap",
                    active && "text-cream",
                  )}
                >
                  {s.touched && !active ? (
                    <Icon name="check" size={14} />
                  ) : (
                    <span className="tabular">{s.n}</span>
                  )}
                  {active ? <span>{s.title}</span> : null}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ol>
      <div aria-hidden className="bg-line mt-2 h-0.5 overflow-hidden rounded-full">
        <div
          className="bg-bordo h-full origin-left rounded-full transition-transform duration-300 ease-[var(--ease-ui)]"
          style={{ transform: `scaleX(${touched / steps.length})` }}
        />
      </div>
    </nav>
  );
}
