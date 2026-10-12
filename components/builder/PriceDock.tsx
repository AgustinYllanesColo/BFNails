"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useAnimate } from "motion/react";
import type { Finish, Shape } from "@/lib/types";
import { EASE } from "@/lib/motion";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/format";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { NailSwatch } from "@/components/ui/NailSwatch";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";

/**
 * Total que rueda (odómetro de `PriceTicker`) y late cuando cambia: el pulso que le gusta al dueño (escala 1,15 → 1
 * y un destello de color en 350 ms `--ease-ui`). El span es estable (nunca lleva `key`), así el odómetro gira de
 * verdad en vez de remontarse. Lo usan el panel "Tu set" (crema: destello rojo moño → bordó) y el PriceDock (bordó:
 * destello amarillo → crema; el rojo sobre bordó no se lee).
 * Con reduced-motion queda solo el destello de color.
 */
export function PulsingTotal({
  value,
  tone = "light",
  size = "xl",
  delta = false,
  announce = false,
  className,
}: {
  value: number;
  tone?: "light" | "inverse";
  size?: "xl" | "lg";
  delta?: boolean;
  announce?: boolean;
  className?: string;
}) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduced = useReducedMotion();
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    const el = scope.current;
    if (!el) return;
    const [flash, rest] = tone === "light" ? ["#b51c1c", "#4a0e0e"] : ["#f5c400", "#fef7e7"];
    const controls = animate(
      el,
      reduced
        ? { color: [flash, rest] }
        : { color: [flash, rest], transform: ["scale(1.15)", "scale(1)"] },
      { duration: 0.35, ease: EASE.ui },
    );
    return () => controls.stop();
  }, [value, tone, reduced, animate, scope]);

  return (
    <span
      ref={scope}
      data-total=""
      className={cn(
        "inline-flex origin-right",
        tone === "light" ? "text-bordo" : "text-cream",
        className,
      )}
    >
      <PriceTicker value={value} size={size} delta={delta} announce={announce} />
    </span>
  );
}

type DockProps = {
  /** El panel "Tu set": mientras está en pantalla (o la barra lo taparía) el dock se esconde. */
  panelRef: RefObject<HTMLElement | null>;
  total: number;
  /** Paso actual ("Paso 3/7 · Acabado"). */
  step: { n: number; title: string };
  stepCount: number;
  swatch: { shape: Shape; base: string; tip?: string; finish: Finish };
  /** Cambia con cada elección: hace latir la miniatura. */
  pingKey: string;
  onOpenSteps: () => void;
  onAdd: (button: HTMLButtonElement) => void;
  added: boolean;
};

/**
 * Barra del armador en el celular (PLAN W2-D.2): siempre a mano mientras elegís. A la izquierda, un solo botón (abre
 * la hoja de pasos) con la miniatura del set, el paso en el que estás y el total que rueda; a la derecha, "Agregar".
 * Se esconde con el panel "Tu set" en pantalla (ahí están los botones grandes), con el footer y con el teclado abierto.
 */
export function PriceDock({
  panelRef,
  total,
  step,
  stepCount,
  swatch,
  pingKey,
  onOpenSteps,
  onAdd,
  added,
}: DockProps) {
  return (
    <StickyActionBar
      watchRef={panelRef}
      hideWhenRef={panelRef}
      mode="outside"
      label="Tu set"
      variant="bordo"
      className="gap-2 pl-2"
    >
      <button
        type="button"
        onClick={onOpenSteps}
        aria-label={`Ver pasos de tu set. Paso ${step.n} de ${stepCount}: ${step.title}`}
        aria-haspopup="dialog"
        className="rounded-pill flex min-h-12 min-w-0 flex-1 items-center gap-3 py-0.5 pr-2 text-left transition-[background-color,scale] duration-150 ease-[var(--ease-ui)] active:scale-[0.98] active:bg-white/5"
      >
        <DockSwatch {...swatch} pingKey={pingKey} />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-on-bordo-muted flex min-w-0 items-center gap-1 text-[13px] leading-none font-medium">
            <span className="truncate">
              <span className="tabular">
                Paso {step.n}/{stepCount}
              </span>{" "}
              · {step.title}
            </span>
            <Icon name="chevron" size={14} className="shrink-0 rotate-180" />
          </span>
          <PulsingTotal value={total} tone="inverse" size="lg" delta className="leading-none" />
        </span>
      </button>
      <Button
        variant="inverse"
        size="md"
        className="shrink-0 px-5"
        onClick={(e) => onAdd(e.currentTarget)}
      >
        {/* las dos etiquetas apiladas en la misma celda: el ancho no cambia al confirmar */}
        <span className="grid place-items-center">
          <span
            aria-hidden={added}
            className={cn(
              "transition-[opacity,translate] duration-200 ease-[var(--ease-ui)] [grid-area:1/1]",
              added ? "translate-y-2 opacity-0" : "opacity-100",
            )}
          >
            Agregar
          </span>
          <span
            aria-hidden={!added}
            className={cn(
              "inline-flex items-center gap-1 transition-[opacity,translate] duration-200 ease-[var(--ease-ui)] [grid-area:1/1]",
              added ? "opacity-100" : "-translate-y-2 opacity-0",
            )}
          >
            <Icon name="check" size={16} />
            Sumado
          </span>
        </span>
      </Button>
    </StickyActionBar>
  );
}

/** Miniatura del set (forma, color, punta y acabado) en un círculo crema; late 220 ms con cada elección. */
function DockSwatch({
  shape,
  base,
  tip,
  finish,
  pingKey,
}: {
  shape: Shape;
  base: string;
  tip?: string;
  finish: Finish;
  pingKey: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = el.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }],
      { duration: 220, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
    return () => a.cancel();
  }, [pingKey]);

  return (
    <span
      ref={ref}
      aria-hidden
      className="bg-cream grid size-12 shrink-0 place-items-center overflow-hidden rounded-full shadow-xs"
    >
      <NailSwatch shape={shape} base={base} tip={tip} finish={finish} count={5} size={40} />
    </span>
  );
}
