"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/format";

export type ReceiptLine =
  | {
      kind: "row";
      id: string;
      label: string;
      value: string;
      tone?: "normal" | "bold" | "accent" | "muted";
    }
  | { kind: "rule"; id: string }
  | { kind: "text"; id: string; text: string; align?: "left" | "center" | "right" };

type Props = {
  title: string;
  meta?: string; // arriba a la derecha (hora, nº de pedido)
  lines: ReceiptLine[];
  footer?: ReceiptLine[];
  className?: string;
  /** Texto del LED mientras "imprime" */
  printingLabel?: string;
  idleLabel?: string;
};

/**
 * Ticket de impresora térmica: cabezal oscuro con LED, papel que sale de la
 * ranura y líneas que se imprimen de a una. Cada vez que cambian las líneas,
 * las nuevas se imprimen con un pequeño delay y el LED parpadea.
 */
export function Receipt({
  title,
  meta,
  lines,
  footer = [],
  className,
  printingLabel = "imprimiendo…",
  idleLabel = "listo",
}: Props) {
  const key = lines.map((l) => l.id + ("value" in l ? l.value : "")).join("|");
  // Estado derivado: "imprimiendo" mientras la última versión impresa no coincide con las líneas actuales.
  const [printedKey, setPrintedKey] = useState<string | null>(null);
  const printing = printedKey !== key;
  const firstPrint = printedKey === null;

  useEffect(() => {
    const t = setTimeout(() => setPrintedKey(key), firstPrint ? 1400 + lines.length * 90 : 900);
    return () => clearTimeout(t);
  }, [key, firstPrint, lines.length]);

  // Avance del papel: cada cambio después de la primera impresión empuja el papel un toque hacia abajo,
  // como si la impresora lo alimentara. WAAPI sobre transform, sin pasar por React.
  const paper = useRef<HTMLDivElement>(null);
  const lastKey = useRef(key);
  useEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    const el = paper.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate([{ transform: "translateY(-7px)" }, { transform: "translateY(0px)" }], {
      duration: 380,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    });
  }, [key]);

  const all = [
    ...lines,
    ...(footer.length ? [{ kind: "rule", id: "footer-rule" } as ReceiptLine, ...footer] : []),
  ];

  return (
    <div className={cn("text-ink font-mono text-[13px] leading-relaxed", className)}>
      {/* Cabezal de la impresora */}
      <div className="text-cream relative z-10 rounded-xl bg-[#2a2a2a] px-4 pt-3 pb-4 shadow-[0_18px_30px_-18px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between">
          <span className="text-cream/80 flex items-center gap-2 text-[12px]">
            <span
              className={cn(
                "size-2 rounded-full",
                printing
                  ? "animate-[print-led_0.9s_ease-in-out_infinite] bg-emerald-400"
                  : "bg-emerald-400/70",
              )}
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={printing ? "p" : "i"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {printing ? printingLabel : idleLabel}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="relative h-5 w-16 overflow-hidden rounded-md bg-white/10">
            {/* cabezal: una luz que barre mientras imprime */}
            <span
              className={cn(
                "absolute inset-y-0 w-6 bg-[linear-gradient(90deg,transparent,rgba(245,196,0,0.9),transparent)]",
                printing ? "animate-[print-head_0.7s_ease-in-out_infinite_alternate]" : "opacity-0",
              )}
            />
          </span>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-black/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]" />
      </div>

      {/* Papel */}
      <div className="relative -mt-2 overflow-hidden px-2">
        <motion.div
          ref={paper}
          initial={{ transform: "translateY(-100%)" }}
          animate={{ transform: "translateY(0%)" }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          className="text-ink relative bg-[#f6f1e4] px-4 pt-5 pb-6 shadow-[0_20px_40px_-24px_rgba(74,14,14,0.5)]"
          style={{
            clipPath:
              "polygon(0 0, 100% 0, 100% calc(100% - 8px), 97.5% 100%, 95% calc(100% - 8px), 92.5% 100%, 90% calc(100% - 8px), 87.5% 100%, 85% calc(100% - 8px), 82.5% 100%, 80% calc(100% - 8px), 77.5% 100%, 75% calc(100% - 8px), 72.5% 100%, 70% calc(100% - 8px), 67.5% 100%, 65% calc(100% - 8px), 62.5% 100%, 60% calc(100% - 8px), 57.5% 100%, 55% calc(100% - 8px), 52.5% 100%, 50% calc(100% - 8px), 47.5% 100%, 45% calc(100% - 8px), 42.5% 100%, 40% calc(100% - 8px), 37.5% 100%, 35% calc(100% - 8px), 32.5% 100%, 30% calc(100% - 8px), 27.5% 100%, 25% calc(100% - 8px), 22.5% 100%, 20% calc(100% - 8px), 17.5% 100%, 15% calc(100% - 8px), 12.5% 100%, 10% calc(100% - 8px), 7.5% 100%, 5% calc(100% - 8px), 2.5% 100%, 0 calc(100% - 8px))",
          }}
        >
          <div className="flex items-baseline justify-between gap-3 font-bold tracking-wide uppercase">
            <span>{title}</span>
            {meta && <span className="text-ink-soft">{meta}</span>}
          </div>
          <div className="border-ink/30 my-2 border-t border-dashed" />
          <ul>
            <AnimatePresence initial={true}>
              {all.map((l, i) => (
                <motion.li
                  key={l.id}
                  layout
                  initial={{ opacity: 0, transform: "translateY(-8px)" }}
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{
                    duration: 0.28,
                    ease: [0.23, 1, 0.32, 1],
                    delay: firstPrint ? 0.45 + i * 0.07 : 0.08,
                  }}
                  className="overflow-hidden"
                >
                  {l.kind === "rule" ? (
                    <div className="border-ink/30 my-2 border-t border-dashed" />
                  ) : l.kind === "text" ? (
                    <p
                      className={cn(
                        "text-ink-soft py-0.5 text-[12px]",
                        l.align === "center" && "text-center",
                        l.align === "right" && "text-right",
                      )}
                    >
                      {l.text}
                    </p>
                  ) : (
                    <div
                      className={cn(
                        "flex justify-between gap-3 py-0.5",
                        l.tone === "bold" && "font-bold",
                        l.tone === "accent" && "text-red font-bold",
                        l.tone === "muted" && "text-ink-soft",
                      )}
                    >
                      <span className="min-w-0 truncate">{l.label}</span>
                      <span className="relative shrink-0 overflow-hidden tabular-nums">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={l.value}
                            initial={{ opacity: 0, transform: "translateY(8px)" }}
                            animate={{ opacity: 1, transform: "translateY(0px)" }}
                            exit={{ opacity: 0, transform: "translateY(-8px)" }}
                            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                            className="inline-block"
                          >
                            {l.value}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </div>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
