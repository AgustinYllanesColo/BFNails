"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { useMediaQuery } from "@/lib/hooks";
import { MQ, restoreMotionPreference } from "@/lib/motion-core";
import { Toaster } from "@/components/ui/Toast";
import { FlyLayer } from "./FlyToCart";

/* Cursor acompañante: carga diferida y solo con puntero fino (W2-A rehace su interior; el export `Cursor` sin props
   es contrato). El cursor nativo se ve siempre. */
const Cursor = dynamic(() => import("./Cursor").then((m) => m.Cursor), { ssr: false });

/**
 * Proveedores globales del cliente (PLAN W1-F3.7):
 * - `MotionConfig reducedMotion="user"`: con reduced-motion, Motion conserva opacidad y color y quita transform/layout.
 * - Restaura la pausa manual del ambiente (`localStorage['bf-motion']`; el script del `<head>` ya la aplicó antes del
 *   primer paint) y avisa a los autoplays con `bf:motion`.
 * - Monta una vez la capa de vuelos a la bolsita (`FlyLayer`) y la pila de toasts (`Toaster`).
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
      <FlyLayer />
      <Toaster />
    </MotionConfig>
  );
}
