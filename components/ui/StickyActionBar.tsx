"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { EASE } from "@/lib/motion";
import { useHydrated, useMediaQuery, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/format";

/**
 * Barra de acción fija abajo, solo en el celular y la tablet (< lg) (PLAN W1-F2.9): precio + CTA al alcance del pulgar.
 * - `mode="outside"`: se ve mientras `watchRef` (la fila de CTAs original) está fuera de la pantalla, arriba o abajo.
 * - `mode="after"`: se ve recién cuando `watchRef` quedó arriba del viewport (ya lo pasaste).
 * - Se esconde si `hideWhenRef` o el `<footer>` entran en pantalla y mientras hay un campo de texto enfocado (el teclado
 *   tapa todo).
 * Cuando está oculta no existe en el DOM. Entra con translateY(120 %) → 0 en 260 ms `EASE.drawer` y sale en 180 ms.
 * Con reduced-motion sube solo 12 px mientras funde (`MotionConfig` no atenúa cadenas `transform`: lo hace este nodo).
 * Mientras se ve publica `--sticky-bar-h` (alto + 12 px) en `<html>`: lo usan el Toaster y el `scroll-padding-bottom`.
 */
type Props = {
  watchRef: RefObject<HTMLElement | null>;
  hideWhenRef?: RefObject<HTMLElement | null>;
  mode?: "outside" | "after";
  /** Nombre de la región ("Comprar este set"). */
  label: string;
  variant?: "bordo" | "light";
  children: ReactNode;
  className?: string;
};

const TEXT_INPUT_EXCLUDED = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

function isTypingField(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) return !TEXT_INPUT_EXCLUDED.has(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

export function StickyActionBar({
  watchRef,
  hideWhenRef,
  mode = "after",
  label,
  variant = "bordo",
  children,
  className,
}: Props) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [past, setPast] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [typing, setTyping] = useState(false);

  // ¿El disparador original quedó fuera de la pantalla (o arriba, según el modo)?
  // En modo "after" la raíz se estira hacia abajo: "no intersecta" pasa a significar "quedó arriba del viewport", y el
  // cambio se detecta aunque un salto (ancla, scroll programático) lo lleve de abajo a arriba sin pasar por la pantalla.
  useEffect(() => {
    const el = watchRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting), {
      rootMargin: mode === "after" ? "0px 0px 100000px 0px" : "0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef, mode]);

  // Footer o zona propia en pantalla: la barra se corre.
  useEffect(() => {
    // el footer del sitio es el último <footer> del documento
    const siteFooter = [...document.querySelectorAll("footer")].at(-1);
    const targets = [hideWhenRef?.current, siteFooter].filter(
      (n): n is HTMLElement => n instanceof HTMLElement,
    );
    if (!targets.length) return;
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setBlocked(visible.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [hideWhenRef]);

  // Teclado abierto: con un campo de texto enfocado la barra no aparece.
  useEffect(() => {
    const sync = () => setTyping(isTypingField(document.activeElement));
    const onOut = () => requestAnimationFrame(sync);
    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  const hydrated = useHydrated();
  const show = !desktop && past && !blocked && !typing;

  // En un portal: si algún ancestro tiene transform (reveals, transiciones), position: fixed dejaría de ser al viewport.
  if (!hydrated) return null;
  return createPortal(
    <AnimatePresence>
      {show ? (
        <Bar key="bar" label={label} variant={variant} className={className}>
          {children}
        </Bar>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function Bar({
  label,
  variant,
  className,
  children,
}: {
  label: string;
  variant: "bordo" | "light";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // mismas unidades en los dos extremos: Motion interpola el número con la plantilla del destino
  const hidden = reduced ? "translateY(12px)" : "translateY(120%)";
  const shown = reduced ? "translateY(0px)" : "translateY(0%)";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () =>
      root.style.setProperty("--sticky-bar-h", `${Math.round(el.offsetHeight + 12)}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty("--sticky-bar-h", "0px");
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      role="region"
      aria-label={label}
      data-sticky-bar=""
      data-surface={variant === "bordo" ? "inverse" : undefined}
      initial={{ transform: hidden, opacity: 0 }}
      animate={{
        transform: shown,
        opacity: 1,
        transition: { duration: 0.26, ease: EASE.drawer },
      }}
      exit={{
        transform: hidden,
        opacity: 0,
        transition: { duration: 0.18, ease: EASE.drawer },
      }}
      className={cn(
        "rounded-pill fixed inset-x-[max(12px,var(--safe-x,0px))] bottom-[max(12px,var(--safe-bottom,0px))] z-40 flex min-h-16 items-center gap-3 py-2 pr-2 pl-5 lg:hidden",
        variant === "bordo"
          ? "bg-bordo text-cream shadow-bar-inverse"
          : "bg-cream text-ink ring-line shadow-lg ring-1",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
