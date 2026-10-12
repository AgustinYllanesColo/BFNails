/**
 * Sistema de movimiento de BF Nails (PLAN §2.5). Un solo lugar para curvas, springs, media queries, la pausa manual
 * del ambiente (WCAG 2.2.2), las medidas fijas del nav y el scroll programático. Nadie llama a Lenis directo: se usa
 * `scrollToTarget`, `stickyOffset` y `lockScroll`.
 *
 * Todo lo que no depende de GSAP vive en `lib/motion-core.ts` (sin dependencias, importable desde el servidor) y se
 * re-exporta acá, así que la API pública es la misma. Este módulo solo suma `registerEases()`, el único punto que
 * trae GSAP y CustomEase: lo importan los componentes de cliente que animan con GSAP.
 */
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

export * from "./motion-core";

let easesRegistered = false;
/** Registra las curvas de marca en GSAP. Idempotente; lo llama SmoothScroll al montar. */
export function registerEases(): void {
  if (easesRegistered) return;
  gsap.registerPlugin(CustomEase);
  CustomEase.create("ui", "0.23,1,0.32,1");
  CustomEase.create("bf.expo", "0.16,1,0.3,1");
  CustomEase.create("bf.bounce", "0.34,1.56,0.64,1");
  CustomEase.create("bf.move", "0.77,0,0.175,1");
  CustomEase.create("bf.drawer", "0.32,0.72,0,1");
  easesRegistered = true;
}
