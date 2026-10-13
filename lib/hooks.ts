"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { MOTION_EVENT, MQ, isMotionPaused } from "@/lib/motion";

const noop = () => () => {};

/** true después de hidratar; evita desajustes con estado persistido en localStorage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** Media query reactiva. En el servidor (y en la hidratación) devuelve `false`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** `prefers-reduced-motion: reduce`. Atenuar, no apagar: el feedback de UI queda intacto. */
export function useReducedMotion(): boolean {
  return useMediaQuery(MQ.reduced);
}

type InViewOptions = { rootMargin?: string; threshold?: number | number[]; once?: boolean };

/** ¿El elemento está en vista? Con `once`, queda en `true` después de la primera vez. */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { rootMargin = "0px", threshold = 0, once = false }: InViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);
  const thresholdKey = Array.isArray(threshold) ? threshold.join(",") : String(threshold);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold: thresholdKey.split(",").map(Number) },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, thresholdKey, once]);

  return inView;
}

/**
 * Pausa el ambiente CSS fuera de vista: alterna `data-offscreen` en el elemento y la capa de `globals.css` detiene
 * los `[data-ambient]` de adentro. Lo usa `AmbientZone`.
 */
export function useAmbientPause<T extends HTMLElement>(
  ref: RefObject<T | null>,
  rootMargin = "200px",
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.removeAttribute("data-offscreen");
        else el.setAttribute("data-offscreen", "");
      },
      { rootMargin },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.removeAttribute("data-offscreen");
    };
  }, [ref, rootMargin]);
}

/**
 * `setInterval` que corre solo cuando hace falta: el elemento está en vista (umbral `.4` por defecto), la pestaña
 * está visible y el movimiento no está pausado a mano. Para autoplays (teaser, carruseles).
 */
export function useVisibleInterval<T extends Element>(
  callback: () => void,
  ms: number,
  ref: RefObject<T | null>,
  { threshold = 0.4 }: { threshold?: number } = {},
): void {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = false;
    let id: ReturnType<typeof setInterval> | undefined;

    const sync = () => {
      const run = visible && document.visibilityState === "visible" && !isMotionPaused();
      if (run && id === undefined) id = setInterval(() => saved.current(), ms);
      if (!run && id !== undefined) {
        clearInterval(id);
        id = undefined;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener(MOTION_EVENT, sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener(MOTION_EVENT, sync);
      if (id !== undefined) clearInterval(id);
    };
  }, [ref, ms, threshold]);
}
