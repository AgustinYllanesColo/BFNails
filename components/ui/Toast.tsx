"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE } from "@/lib/motion";
import { useToasts, type ToastItem } from "@/lib/store/toast";
import { useReducedMotion } from "@/lib/hooks";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/format";

/**
 * Pila de toasts (PLAN W1-F2.12). Se monta una sola vez (Providers). Va centrada abajo, 16 px por encima de la
 * StickyActionBar cuando está visible (`--sticky-bar-h`), del pie de una BottomSheet abierta (`--sheet-h`) y del área
 * segura. Entra con translateY(16px) + opacidad en 240 ms `EASE.ui` y sale en 160 ms (transiciones interrumpibles, no
 * keyframes). Con reduced-motion el recorrido se va (lo decide `useReducedMotion`: `MotionConfig` no toca las cadenas
 * `transform`) y queda solo el fundido; el reacomodo de la pila (`layout`) sí lo apaga `MotionConfig`.
 */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed bottom-[calc(max(16px,var(--safe-bottom,0px))+max(var(--sticky-bar-h,0px),var(--sheet-h,0px)))] left-1/2 z-[60] flex w-max max-w-[calc(100vw-24px)] -translate-x-1/2 flex-col items-center gap-2 transition-[bottom] duration-[260ms] ease-[var(--ease-drawer)] sm:max-w-md"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToasts((s) => s.dismiss);
  const reduced = useReducedMotion();
  const rise = reduced ? 0 : 16;
  const sink = reduced ? 0 : 8;
  const remaining = useRef(toast.duration);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hovered = useRef(false);
  const focused = useRef(false);
  /** Reevalúa si el reloj corre: se pausa con el puntero o el foco encima y con la pestaña oculta. */
  const syncRef = useRef<() => void>(() => {});

  useEffect(() => {
    const id = toast.id;
    const run = () => {
      if (timer.current !== undefined) return;
      startedAt.current = Date.now();
      timer.current = setTimeout(() => dismiss(id), Math.max(0, remaining.current));
    };
    const hold = () => {
      if (timer.current === undefined) return;
      clearTimeout(timer.current);
      timer.current = undefined;
      remaining.current -= Date.now() - startedAt.current;
    };
    const sync = () => {
      if (hovered.current || focused.current || document.visibilityState !== "visible") hold();
      else run();
    };
    syncRef.current = sync;
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      if (timer.current !== undefined) clearTimeout(timer.current);
      timer.current = undefined;
    };
  }, [toast.id, dismiss]);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.24, ease: EASE.ui } }}
      exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE.ui } }}
      transition={{ layout: { duration: 0.24, ease: EASE.ui } }}
      className="pointer-events-auto max-w-full"
      onPointerEnter={() => {
        hovered.current = true;
        syncRef.current();
      }}
      onPointerLeave={() => {
        hovered.current = false;
        syncRef.current();
      }}
      onFocus={() => {
        focused.current = true;
        syncRef.current();
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        focused.current = false;
        syncRef.current();
      }}
    >
      <motion.div
        data-surface="inverse"
        data-toast=""
        initial={{ transform: `translateY(${rise}px)` }}
        animate={{ transform: "translateY(0px)", transition: { duration: 0.24, ease: EASE.ui } }}
        exit={{ transform: `translateY(${sink}px)`, transition: { duration: 0.16, ease: EASE.ui } }}
        className={cn(
          "bg-ink text-cream flex min-h-12 max-w-full items-center gap-3 rounded-lg py-2 pl-5 text-sm shadow-lg",
          toast.action ? "pr-1.5" : "pr-5",
        )}
      >
        {toast.icon ? <Icon name={toast.icon} size={20} className="text-yellow -ml-1" /> : null}
        <p className="line-clamp-2 min-w-0 flex-1 leading-snug">{toast.message}</p>
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              dismiss(toast.id);
            }}
            className="rounded-pill text-yellow [@media(hover:hover)]:hover:bg-cream/10 inline-flex min-h-11 shrink-0 items-center px-3.5 font-semibold transition-[background-color,scale] duration-150 ease-[var(--ease-ui)] active:scale-[0.97]"
          >
            {toast.action.label}
          </button>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
