"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import type { BuilderSelection } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { createHandScene, type HandScene } from "@/components/three/hand";

/**
 * Mano 3D (three.js) para la vista previa. Se carga en diferido desde NailPreview y avisa
 * cuando dibujó su primer cuadro (onReady) o si no pudo crear el contexto WebGL (onError).
 */
export function NailPreview3D({
  sel,
  config,
  className,
  perfGuard = true,
  onReady,
  onError,
}: {
  sel: BuilderSelection;
  config: BuilderConfig;
  className?: string;
  /** baja la calidad si el dispositivo no llega (se apaga en pruebas con WebGL por software) */
  perfGuard?: boolean;
  onReady?: () => void;
  onError?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HandScene | null>(null);

  const ready = useEffectEvent(() => onReady?.());
  const fail = useEffectEvent(() => onError?.());
  const initialUpdate = useEffectEvent((scene: HandScene) => scene.update(sel, config));
  const guard = useEffectEvent(() => perfGuard);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    // un canvas nuevo por montaje: un contexto WebGL liberado no se puede reutilizar
    // (en desarrollo, StrictMode monta y desmonta dos veces)
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.dataset.cursor = "girá";
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);
    let scene: HandScene;
    try {
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      scene = createHandScene(canvas, { reducedMotion, perfGuard: guard(), onContextLost: () => fail() });
    } catch {
      canvas.remove();
      fail();
      return;
    }
    sceneRef.current = scene;
    initialUpdate(scene);
    const off = scene.onFirstFrame(() => ready());
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => scene.resize()) : null;
    ro?.observe(canvas);
    return () => {
      off();
      ro?.disconnect();
      sceneRef.current = null;
      scene.dispose();
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.update(sel, config);
  }, [sel, config]);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
