"use client";

import {
  useEffect,
  useId,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useDragControls, useMotionValue } from "motion/react";
import { EASE, SPRING_UI, lockScroll, unlockScroll } from "@/lib/motion";
import { useHydrated, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/format";
import { Icon } from "@/components/ui/icons";

/**
 * Hoja inferior modal (PLAN W1-F2.10): filtros del catálogo, pasos del armador.
 * - Portal al `body`; fondo `ink/40` que funde en 200 ms; el panel sube en 320 ms `EASE.drawer` y baja en 220 ms.
 *   Con reduced-motion sube solo 24 px mientras funde (`MotionConfig` no atenúa cadenas `transform`: lo hace este nodo).
 * - Se arrastra **solo** desde la agarradera y el encabezado (44 px, `touch-action: none`): el contenido scrollea
 *   normal. Suelta con más de 80 px o un tirón (> 500 px/s) y se cierra; si no, vuelve con un resorte corto.
 * - `role="dialog"` modal: foco al primer control y de vuelta al disparador, Esc cierra, scroll bloqueado y `inert`
 *   en `#contenido`, `header`, `footer` y la barra sticky mientras está abierta.
 */
type Props = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Pie fijo (acciones): queda abajo aunque el contenido scrollee. */
  footer?: ReactNode;
  /** Control que recibe el foco al abrir (por defecto, el primero del contenido). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const INERT_TARGETS = ["#contenido", "header", "footer", "[data-sticky-bar]"];

export function BottomSheet(props: Props) {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return createPortal(
    <AnimatePresence>{props.open ? <Sheet key="sheet" {...props} /> : null}</AnimatePresence>,
    document.body,
  );
}

function Sheet({
  onClose,
  title,
  description,
  children,
  footer,
  initialFocusRef,
  className,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const controls = useDragControls();
  const y = useMotionValue(0);
  const reduced = useReducedMotion();
  // mismas unidades en los dos extremos: Motion interpola el número con la plantilla del destino
  const hidden = reduced
    ? { transform: "translateY(24px)", opacity: 0 }
    : { transform: "translateY(100%)", opacity: 1 };
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Modal: scroll bloqueado, resto de la página inerte, Esc, foco adentro y de vuelta al disparador.
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    lockScroll();
    const inerted: HTMLElement[] = [];
    for (const sel of INERT_TARGETS) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (panelRef.current?.contains(el) || el.hasAttribute("inert")) return;
        el.setAttribute("inert", "");
        inerted.push(el);
      });
    }
    const first =
      initialFocusRef?.current ??
      bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      closeRef.current;
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      inerted.forEach((el) => el.removeAttribute("inert"));
      unlockScroll();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [initialFocusRef]);

  // Los toasts suben por encima del pie de la hoja (Toaster usa max(--sticky-bar-h, --sheet-h)).
  useEffect(() => {
    const el = footerRef.current;
    const panel = panelRef.current;
    if (!el || !panel) return;
    const root = document.documentElement;
    const publish = () => {
      const pad = parseFloat(getComputedStyle(panel).paddingBottom) || 0;
      root.style.setProperty("--sheet-h", `${Math.round(el.offsetHeight + pad)}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--sheet-h");
    };
  }, []);

  const startDrag = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    controls.start(e);
  };

  return (
    <>
      <motion.div
        aria-hidden
        className="bg-ink/40 fixed inset-0 z-[55]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2, ease: "linear" } }}
        exit={{ opacity: 0, transition: { duration: 0.2, ease: "linear" } }}
        onClick={() => onCloseRef.current()}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[55] mx-auto w-full max-w-xl"
        initial={hidden}
        animate={{
          transform: reduced ? "translateY(0px)" : "translateY(0%)",
          opacity: 1,
          transition: { duration: 0.32, ease: EASE.drawer },
        }}
        exit={{ ...hidden, transition: { duration: 0.22, ease: EASE.drawer } }}
      >
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          style={{ y }}
          drag="y"
          dragControls={controls}
          dragListener={false}
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.y > 80 || info.velocity.y > 500) onCloseRef.current();
            else animate(y, 0, SPRING_UI);
          }}
          className={cn(
            "bg-cream text-ink flex max-h-[85dvh] flex-col rounded-t-[28px] pb-[max(16px,var(--safe-bottom,0px))] shadow-xl",
            className,
          )}
        >
          <div
            onPointerDown={startDrag}
            className="shrink-0 cursor-grab touch-none px-5 pt-2 select-none active:cursor-grabbing"
          >
            <div className="flex h-5 items-center justify-center" aria-hidden>
              <span className="bg-ink/20 h-1 w-9 rounded-full" />
            </div>
            <div className="flex min-h-11 items-center justify-between gap-3 pb-2">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-ink text-[28px] leading-none">
                  {title}
                </h2>
                {description ? (
                  <p id={descId} className="text-meta text-ink-soft mt-1.5">
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                ref={closeRef}
                type="button"
                data-no-drag=""
                onClick={() => onCloseRef.current()}
                aria-label="Cerrar"
                className="text-ink [@media(hover:hover)]:hover:bg-cream-deep -mr-2 grid size-11 shrink-0 place-items-center rounded-full transition-[background-color,scale] duration-150 ease-[var(--ease-ui)] active:scale-[0.94]"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>
          <div
            ref={bodyRef}
            data-lenis-prevent=""
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-4"
          >
            {children}
          </div>
          {footer ? (
            <div ref={footerRef} className="border-line shrink-0 border-t px-5 pt-3">
              {footer}
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </>
  );
}
