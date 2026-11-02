"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Pausa las animaciones CSS en bucle de un bloque mientras no se ve: marca `data-paused` en el elemento y
 * globals.css congela `animation-play-state` de todo lo de adentro. Devuelve una ref con la visibilidad actual
 * para que los intervalos de JS (palabras que rotan, demos) también se salteen los ticks fuera de pantalla,
 * sin volver a renderizar.
 */
export function useOffscreenPause(ref: RefObject<HTMLElement | null>, rootMargin = "120px 0px") {
  const visible = useRef(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        el.dataset.paused = entry.isIntersecting ? "false" : "true";
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return visible;
}
