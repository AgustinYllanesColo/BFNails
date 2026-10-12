/**
 * Núcleo del sistema de movimiento de BF Nails (PLAN §2.5), sin dependencias: curvas, springs, media queries, la
 * pausa manual del ambiente (WCAG 2.2.2), las medidas fijas del nav, el scroll programático y el bloqueo de scroll.
 *
 * No importa GSAP ni nada con efectos al cargar, así que lo pueden importar componentes de servidor (app/layout.tsx
 * usa `MOTION_BOOT_SCRIPT`) y hooks livianos (lib/hooks.ts) sin arrastrar plugins. `lib/motion.ts` re-exporta todo
 * esto y suma `registerEases()`: el resto del sitio importa desde `@/lib/motion`.
 *
 * Nadie llama a Lenis directo: se usa `scrollToTarget`, `stickyOffset` y `lockScroll`. Las funciones que tocan
 * `window` solo se llaman en el cliente y no fallan si no hay DOM.
 */
import type Lenis from "lenis";

type Bezier = [number, number, number, number];

/** Curvas en formato Motion (`transition={{ ease: EASE.ui }}`); en CSS son `var(--ease-*)` y en GSAP `'bf.*'`. */
export const EASE = {
  /** UI: entradas y salidas de controles, toasts, chips (= `--ease-ui`, GSAP `'ui'`). */
  ui: [0.23, 1, 0.32, 1] as Bezier,
  /** Entradas de marketing (= `--ease-out-expo`, GSAP `'bf.expo'`). */
  expo: [0.16, 1, 0.3, 1] as Bezier,
  /** Movimiento en pantalla, barridos (= `--ease-move`, GSAP `'bf.move'`). */
  move: [0.77, 0, 0.175, 1] as Bezier,
  /** Barras sticky y hojas (= `--ease-drawer`, GSAP `'bf.drawer'`). */
  drawer: [0.32, 0.72, 0, 1] as Bezier,
  /** Solo badges, sellos y pops (= `--ease-bounce`, GSAP `'bf.bounce'`). */
  bounce: [0.34, 1.56, 0.64, 1] as Bezier,
};

export const SPRING_UI = { type: "spring", duration: 0.35, bounce: 0.15 } as const;
export const SPRING_POP = { type: "spring", duration: 0.35, bounce: 0.35 } as const;

/** Condiciones para `gsap.matchMedia().add(MQ, (ctx) => { const { reduced } = ctx.conditions! })`. */
export const MQ = {
  full: "(prefers-reduced-motion: no-preference)",
  reduced: "(prefers-reduced-motion: reduce)",
} as const;

/* ---------- Pausa manual del ambiente ---------- */

const MOTION_KEY = "bf-motion";
export const MOTION_EVENT = "bf:motion";
export type MotionEventDetail = { paused: boolean };

/**
 * Script en línea del `<head>` (app/layout.tsx): aplica la pausa guardada antes del primer paint, así quien pausó el
 * movimiento no lo ve arrancar mientras hidrata. `restoreMotionPreference` cubre el resto (avisa a los autoplays).
 */
export const MOTION_BOOT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(MOTION_KEY)})==="paused")document.documentElement.dataset.motion="paused"}catch(e){}`;

/**
 * Pausa (o reanuda) solo el movimiento automático: `html[data-motion="paused"]` detiene los `[data-ambient]` por CSS
 * y los autoplays escuchan `bf:motion`. No toca GSAP ni oculta contenido: nada puede quedar invisible.
 */
export function setMotionPaused(paused: boolean): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (paused) root.dataset.motion = "paused";
  else delete root.dataset.motion;
  try {
    if (paused) localStorage.setItem(MOTION_KEY, "paused");
    else localStorage.removeItem(MOTION_KEY);
  } catch {
    // almacenamiento bloqueado (modo privado): la pausa vale para esta visita
  }
  window.dispatchEvent(new CustomEvent<MotionEventDetail>(MOTION_EVENT, { detail: { paused } }));
}

export function isMotionPaused(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.motion === "paused";
}

/** Lee la preferencia guardada y la aplica (sin escribir de nuevo). La llama Providers al montar. */
export function restoreMotionPreference(): void {
  if (typeof document === "undefined") return;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(MOTION_KEY);
  } catch {
    return;
  }
  if (stored === "paused" && !isMotionPaused()) {
    document.documentElement.dataset.motion = "paused";
    window.dispatchEvent(
      new CustomEvent<MotionEventDetail>(MOTION_EVENT, { detail: { paused: true } }),
    );
  }
}

/** ¿El elemento ya se ve en este momento? (Reveal y WordReveal nunca esconden lo que ya está en pantalla.) */
export function isInViewportNow(el: Element | null | undefined): boolean {
  if (!el || typeof window === "undefined") return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  return r.top < window.innerHeight && r.bottom > 0 && r.left < window.innerWidth && r.right > 0;
}

/* ---------- Lenis ---------- */

let lenisInstance: Lenis | null = null;
export function setLenis(lenis: Lenis | null): void {
  lenisInstance = lenis;
}
export function getLenis(): Lenis | null {
  return lenisInstance;
}

/* ---------- Medidas fijas (PLAN §2.7) ---------- */

/**
 * Alto del nav (bottom de la píldora) leído de `--nav-h`: 72 px en móvil y 84 px desde md, más el área segura de
 * arriba cuando la hay (modo app). `--nav-h` está registrada como `<length>` en globals.css, así que llega en px; sin
 * `@property` (Safari < 16.4) llega como `calc(…)` y se usan las medidas base.
 */
export function navH(): number {
  if (typeof document === "undefined") return 72;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"));
  if (Number.isFinite(v)) return v;
  return window.matchMedia("(min-width: 768px)").matches ? 84 : 72;
}

/** Offset para scrollear a un ancla sin que el nav la tape: `-(nav + 16 + extra)`. */
export function stickyOffset(extra = 0): number {
  return -(navH() + 16 + extra);
}

type ScrollTarget = HTMLElement | string | number;

/**
 * Scroll programático único del sitio: usa Lenis si está montado y, si no, el scroll nativo.
 * A un elemento o selector se llega con el offset del nav (`stickyOffset()`); a una posición numérica, tal cual.
 * Con reduced-motion el salto es inmediato.
 */
export function scrollToTarget(
  target: ScrollTarget,
  { offset, immediate }: { offset?: number; immediate?: boolean } = {},
): void {
  if (typeof window === "undefined") return;
  const off = offset ?? (typeof target === "number" ? 0 : stickyOffset());
  const jump = immediate ?? window.matchMedia(MQ.reduced).matches;
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(target, { offset: off, immediate: jump, force: true });
    return;
  }
  let top: number;
  if (typeof target === "number") top = target;
  else {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    if (!el) return;
    top = el.getBoundingClientRect().top + window.scrollY;
  }
  window.scrollTo({ top: Math.max(0, top + off), behavior: jump ? "auto" : "smooth" });
}

/* ---------- Bloqueo de scroll (hojas, diálogos) ---------- */

let locks = 0;
let saved: { overflow: string; gutter: string } | null = null;

/** Bloquea el scroll de la página (anidable). Reserva el canal de la barra para que nada salte de lugar. */
export function lockScroll(): void {
  if (typeof document === "undefined") return;
  locks += 1;
  if (locks > 1) return;
  const root = document.documentElement;
  saved = { overflow: root.style.overflow, gutter: root.style.scrollbarGutter };
  root.style.scrollbarGutter = "stable";
  root.style.overflow = "hidden";
  getLenis()?.stop();
}

export function unlockScroll(): void {
  if (typeof document === "undefined" || locks === 0) return;
  locks -= 1;
  if (locks > 0) return;
  const root = document.documentElement;
  root.style.overflow = saved?.overflow ?? "";
  root.style.scrollbarGutter = saved?.gutter ?? "";
  saved = null;
  getLenis()?.start();
}
