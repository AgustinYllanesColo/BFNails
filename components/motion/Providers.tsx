"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { useMediaQuery } from "@/lib/hooks";
import { MQ, restoreMotionPreference } from "@/lib/motion";

/* Cursor acompañante: carga diferida y solo con puntero fino (W2-A rehace su interior; el export `Cursor` sin props
   es contrato). El cursor nativo se ve siempre. */
const Cursor = dynamic(() => import("./Cursor").then((m) => m.Cursor), { ssr: false });

/**
 * Proveedores globales del cliente (PLAN W1-F3.7): Motion respeta reduced-motion (conserva opacidad y color, quita
 * transform/layout) y se restaura la pausa manual del ambiente guardada en `localStorage['bf-motion']`.
 * F3 suma acá `<FlyLayer/>` y `<Toaster/>`.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const finePointer = useMediaQuery("(pointer: fine)");
  // Transitorio hasta W2-A: el Cursor actual no maneja reduced-motion y quedaría quieto en la esquina.
  const reduced = useMediaQuery(MQ.reduced);

  useEffect(() => {
    restoreMotionPreference();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {finePointer && !reduced && <Cursor />}
      {children}
    </MotionConfig>
  );
}
