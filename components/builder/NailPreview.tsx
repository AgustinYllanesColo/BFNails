"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BuilderSelection } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { cn } from "@/lib/format";
import { NailPreview2D } from "./NailPreview2D";

// three.js va en un chunk aparte y solo se pide en el cliente, cuando la vista previa está cerca
const NailPreview3D = dynamic(() => import("./NailPreview3D").then((m) => m.NailPreview3D), { ssr: false, loading: () => null });

/** si el 3D tarda más que esto, se muestra la ilustración como respaldo (red lenta o chunk que no llega) */
const FALLBACK_MS = 15000;
const HINT_MS = 2600;
const HINT_KEY = "bf:hint-girar";
/** para pruebas con WebGL por software: localStorage "bf:force3d" = "1" */
const FORCE_KEY = "bf:force3d";

function forced3D() {
  try {
    return window.localStorage.getItem(FORCE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * ¿Hay WebGL2 con GPU de verdad? Un solo contexto de sondeo. Los renderizadores por software
 * (SwiftShader, llvmpipe, "Microsoft Basic Render") llevarían toda la página a pocos fps: ahí queda el 2D.
 */
function probeWebGL2() {
  if (typeof WebGL2RenderingContext === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2", { powerPreference: "default" });
    if (!gl) return false;
    let ok = true;
    if (!forced3D()) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name)) ok = false;
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Vista previa del set. Si el dispositivo tiene WebGL, carga la mano 3D en diferido y la muestra
 * sobre el fondo crema cuando dibuja su primer cuadro (sin otra mano distinta debajo). La
 * ilustración 2D queda como respaldo: sin WebGL, si el 3D falla o si tarda más de 2,5 s.
 */
export function NailPreview({ sel, config }: { sel: BuilderSelection; config: BuilderConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load3D, setLoad3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [allow2D, setAllow2D] = useState(false);
  const [hide2D, setHide2D] = useState(false);
  const [gen, setGen] = useState(0);
  const [hint, setHint] = useState<"off" | "on" | "gone">("off");
  const [perfGuard, setPerfGuard] = useState(true);
  const fallbackTimer = useRef(0);
  const retries = useRef(0);
  const retryCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // navegador muy viejo: queda la ilustración
      const t = window.setTimeout(() => setAllow2D(true), 0);
      return () => window.clearTimeout(t);
    }
    let idle = 0;
    let soon = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (!probeWebGL2()) {
          setAllow2D(true);
          return;
        }
        setPerfGuard(!forced3D());
        fallbackTimer.current = window.setTimeout(() => setAllow2D(true), FALLBACK_MS);
        // que three no compita con la hidratación ni con el primer toque
        const go = () => setLoad3D(true);
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(go, { timeout: 1500 });
        else soon = window.setTimeout(go, 200);
      },
      { rootMargin: "240px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(fallbackTimer.current);
      window.clearTimeout(soon);
      if (idle) window.cancelIdleCallback?.(idle);
      retryCleanup.current?.();
    };
  }, []);

  // si la ruta se oculta y vuelve (Activity / cacheComponents), repetimos el fundido desde cero
  useLayoutEffect(
    () => () => {
      setReady(false);
      setHide2D(false);
    },
    [],
  );

  // cuando el 3D ya está a la vista, el 2D se desmonta (con un timer: si el fundido no llega a
  // correr, por ejemplo porque el 2D recién aparecía, transitionend nunca dispararía)
  useEffect(() => {
    if (!(load3D && !failed && ready)) return;
    const t = window.setTimeout(() => setHide2D(true), 420);
    return () => window.clearTimeout(t);
  }, [load3D, failed, ready]);

  useEffect(() => {
    if (hint !== "on") return;
    const t = window.setTimeout(() => setHint("gone"), HINT_MS);
    return () => window.clearTimeout(t);
  }, [hint]);

  const onReady = () => {
    window.clearTimeout(fallbackTimer.current);
    setReady(true);
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(HINT_KEY) === "1";
      window.sessionStorage.setItem(HINT_KEY, "1");
    } catch {
      /* sin storage: la pista se muestra igual */
    }
    if (!seen) setHint((h) => (h === "off" ? "on" : h));
  };

  const onError = () => {
    setFailed(true);
    setReady(false);
    setHide2D(false);
    setAllow2D(true);
    // reintento acotado: en iOS el contexto se pierde al pasar la pestaña a segundo plano
    if (retries.current >= 2) return;
    retries.current += 1;
    const retry = () => {
      retryCleanup.current = null;
      setGen((g) => g + 1);
      setFailed(false);
    };
    if (document.visibilityState === "visible") {
      const t = window.setTimeout(retry, 1200);
      retryCleanup.current = () => window.clearTimeout(t);
    } else {
      const onVis = () => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", onVis);
        retry();
      };
      document.addEventListener("visibilitychange", onVis);
      retryCleanup.current = () => document.removeEventListener("visibilitychange", onVis);
    }
  };

  const show3D = load3D && !failed;
  const faded = show3D && ready;
  const show2D = (allow2D || failed) && !(faded && hide2D);
  const label = describe(sel, config);

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-cream-deep ring-1 ring-bordo/10"
      onPointerDown={() => hint === "on" && setHint("gone")}
    >
      <div ref={ref} role="img" aria-label={label} className="absolute inset-0 bg-[radial-gradient(120%_90%_at_38%_22%,#fbf0d9_0%,#f5e8c8_55%,#efdcb6_100%)]">
        {!faded && !show2D && (
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_40%,rgba(255,255,255,0.45),transparent)] motion-safe:animate-pulse" />
        )}
        {show2D && (
          <div
            className={cn(
              "absolute inset-0 transition-opacity ease-out starting:opacity-0",
              faded ? "opacity-0 duration-[140ms]" : "opacity-100 duration-200",
            )}
          >
            <NailPreview2D sel={sel} config={config} />
          </div>
        )}
        {show3D && (
          <NailPreview3D
            key={gen}
            sel={sel}
            config={config}
            perfGuard={perfGuard}
            onReady={onReady}
            onError={onError}
            className={cn(
              // entra sobre el fondo crema; si había 2D, espera a que se vaya (fundido secuencial, sin dos manos superpuestas)
              "absolute inset-0 block h-full w-full transition-[opacity,filter,scale] duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
              faded ? "opacity-100" : "opacity-0 motion-safe:scale-[1.015] motion-safe:blur-[6px]",
              faded && show2D && "delay-100",
            )}
          />
        )}
      </div>
      {hint !== "off" && (
        <p
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-2 right-2 rounded-pill bg-cream/90 px-2.5 py-0.5 text-[10px] font-semibold text-ink transition-opacity duration-300 ease-out sm:text-[11px]",
            hint === "on" ? "opacity-100" : "opacity-0",
          )}
        >
          Deslizá para girar
        </p>
      )}
      <p className="pointer-events-none absolute bottom-2 left-2 max-w-[calc(100%-1rem)] rounded-pill bg-cream/90 px-2.5 py-0.5 text-[10px] font-semibold text-ink sm:text-[11px]">
        Vista previa ilustrativa, el set real lo pinta Bren a mano
      </p>
    </div>
  );
}

function describe(sel: BuilderSelection, config: BuilderConfig) {
  const name = <T extends { id: string; label: string }>(list: T[], id?: string) => list.find((o) => o.id === id)?.label;
  const parts = [name(config.shapes, sel.shape), name(config.lengths, sel.length), name(config.bases, sel.base), name(config.finishes, sel.finish)].filter(Boolean);
  const extras = sel.extras.map((e) => name(config.extras, e)).filter(Boolean);
  return `Vista previa de tu set: ${parts.join(", ").toLowerCase()}${extras.length ? `, con ${extras.join(", ").toLowerCase()}` : ""}`;
}
