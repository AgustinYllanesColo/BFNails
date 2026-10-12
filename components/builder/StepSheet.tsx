"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/format";

export type StepSummary = {
  n: number;
  title: string;
  /** Lo elegido en ese paso ("Almendra", "3 técnicas · +$ 6.200"). */
  value: string;
  /** La clienta ya eligió algo en ese paso (no es el valor por defecto). */
  touched: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  steps: StepSummary[];
  current: number;
  total: number;
  levelLabel: string;
  /** Lleva al paso (la hoja se cierra sola). */
  onGo: (n: number) => void;
  /** Lleva al panel con el detalle del precio. */
  onSeePrice: () => void;
};

/**
 * Hoja "Tu set" del armador en el celular (PLAN W2-D.2): los 7 pasos con lo elegido en cada uno, el paso actual
 * resaltado y un check en los que ya tocaste. Tocar una fila cierra la hoja y te lleva a ese paso; el pie muestra el
 * total y lleva al detalle del precio.
 */
export function StepSheet({ open, onClose, steps, current, total, levelLabel, onGo, onSeePrice }: Props) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Tu set"
      description="Tocá un paso para ir directo."
      footer={
        <div className="flex items-center justify-between gap-3 pb-1">
          <div className="min-w-0">
            <p className="text-meta text-ink-soft">Total · nivel {levelLabel.toLowerCase()}</p>
            <Price value={total} size="lg" className="text-bordo" />
          </div>
          <Button variant="secondary" size="sm" onClick={onSeePrice} className="shrink-0">
            Ver detalle del precio
          </Button>
        </div>
      }
    >
      <ol className="-mx-2 grid gap-1">
        {steps.map((s) => {
          const active = s.n === current;
          return (
            <li key={s.n}>
              <button
                type="button"
                onClick={() => onGo(s.n)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-[background-color,scale] duration-150 ease-[var(--ease-ui)] active:scale-[0.98]",
                  active ? "bg-cream-deep" : "[@media(hover:hover)]:hover:bg-cream-deep/60",
                )}
              >
                <span className="font-display text-bordo tabular w-7 shrink-0 text-[22px] leading-none">
                  {String(s.n).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-ink block text-[15px] leading-tight font-semibold">{s.title}</span>
                  <span className="text-meta text-ink-soft block truncate">{s.value}</span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full transition-colors duration-150",
                    s.touched ? "bg-bordo text-cream" : "ring-line ring-1 ring-inset",
                  )}
                >
                  {s.touched ? <Icon name="check" size={14} /> : null}
                </span>
                <span className="sr-only">{s.touched ? "(elegido)" : "(sin tocar)"}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </BottomSheet>
  );
}
