"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia(REDUCED).matches;
// en el servidor no se sabe: se asume movimiento reducido y el video se monta recién en el navegador
const getReducedServer = () => true;

/**
 * Video del producto sobre su foto fija, para la tarjeta del catálogo. Corre solo, sin sonido y en bucle, como un
 * GIF: `muted` + `playsInline` son lo que deja a iOS reproducirlo sin abrir pantalla completa.
 *
 * - No baja nada hasta que la tarjeta está cerca de la pantalla (`preload="none"` y el `src` se pone recién ahí).
 * - Se pausa cuando sale de la pantalla y vuelve a correr al entrar.
 * - Con movimiento reducido no se monta: queda la foto fija que está debajo.
 * - Aparece con un fundido cuando ya tiene cuadros, así no hay salto desde la foto.
 */
export function MakeupVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedServer);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          // play() falla si el navegador no deja (ahorro de batería): queda la foto, sin error a la vista
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  if (reduced) return null;

  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={near}
      preload="none"
      aria-hidden
      tabIndex={-1}
      disablePictureInPicture
      onLoadedData={() => setReady(true)}
      className={
        "absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none " +
        (ready ? "opacity-100" : "opacity-0")
      }
    />
  );
}
