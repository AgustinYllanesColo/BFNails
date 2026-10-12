"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MQ, getLenis, registerEases, scrollToTarget, setLenis } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll suave de todo el sitio (PLAN F3.6): una instancia de Lenis en la raíz, movida por el ticker de GSAP para que
 * ScrollTrigger y Lenis vean el mismo frame. Nadie la llama directo: `scrollToTarget`, `stickyOffset` y `lockScroll`
 * de `lib/motion`.
 *
 * - Reduced-motion: la rueda vuelve a ser nativa (`smoothWheel: false`, se actualiza en vivo si cambia la
 *   preferencia); en táctil Lenis nunca suaviza (scroll nativo del celular).
 * - Al cambiar de ruta: si vino de atrás/adelante (`popstate`) se conserva la posición que restauró el navegador
 *   (solo `resize` + `refresh`); si no, arriba de todo en el acto, o al ancla del hash si la hay. Un cambio de ruta
 *   cuenta como atrás/adelante si la URL a la que llevó el último `popstate` es la ruta a la que se llegó (sin ventana
 *   de tiempo: una vuelta atrás que tarda en resolver no salta arriba, y un `popstate` dentro de la misma página, como
 *   el de un ancla, no confunde a la navegación siguiente).
 * - `ScrollTrigger.refresh()` cuando cargan las fuentes (cambian los altos de los titulares).
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  /** Ruta (`location.pathname`) a la que llevó el último `popstate` (atrás/adelante); null si no hubo. */
  const popPath = useRef<string | null>(null);
  /** Última ruta atendida (null = primera carga). Evita repetir el salto en el doble efecto de StrictMode. */
  const last = useRef<string | null>(null);

  useEffect(() => {
    registerEases();
    const reduced = window.matchMedia(MQ.reduced);
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: !reduced.matches,
      autoRaf: false,
      stopInertiaOnNavigate: true,
      prevent: (node) => node.hasAttribute("data-lenis-prevent"),
    });
    setLenis(lenis);

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onReduced = () => {
      lenis.options.smoothWheel = !reduced.matches;
    };
    reduced.addEventListener("change", onReduced);
    const onPop = () => {
      popPath.current = window.location.pathname;
    };
    window.addEventListener("popstate", onPop);

    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) ScrollTrigger.refresh();
    });

    return () => {
      alive = false;
      reduced.removeEventListener("change", onReduced);
      window.removeEventListener("popstate", onPop);
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  useEffect(() => {
    // La primera carga respeta la posición que dé el navegador (recarga, ancla de la URL).
    if (last.current === null || last.current === pathname) {
      last.current = pathname;
      return;
    }
    last.current = pathname;
    // Se compara con la URL del navegador (no con `pathname`): las dos vienen de `location` y no dependen de
    // rewrites ni de codificación. Si no coincide, el `popstate` era viejo (p. ej. de un ancla) y se descarta.
    if (popPath.current !== null && popPath.current === window.location.pathname) {
      const id = requestAnimationFrame(() => {
        getLenis()?.resize();
        ScrollTrigger.refresh();
      });
      return () => cancelAnimationFrame(id);
    }
    popPath.current = null;
    const hash = window.location.hash.slice(1);
    const anchor = hash ? document.getElementById(decodeURIComponent(hash)) : null;
    if (anchor) scrollToTarget(anchor, { immediate: true });
    else getLenis()?.scrollTo(0, { immediate: true, force: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return children;
}
