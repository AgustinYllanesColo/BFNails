"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { BuilderSelection } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { cn } from "@/lib/format";
import Image from "next/image";

// three.js va en un chunk aparte y solo se pide en el cliente, cuando la vista previa está cerca
const NailPreview3D = dynamic(() => import("./NailPreview3D").then((m) => m.NailPreview3D), { ssr: false, loading: () => null });

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
 * Vista previa del set: solo la mano realista. Mientras three.js carga se ve una foto de esa misma mano 3D
 * (`/brand/hand-poster.webp`, capturada del render real con la selección por defecto) y, cuando el 3D dibuja su
 * primer cuadro, entra encima con un fundido. Sin WebGL, o si el 3D falla, queda la foto. La mano ilustrada en 2D
 * no se muestra nunca (pedido de Brenda).
 */
export function NailPreview({ sel, config }: { sel: BuilderSelection; config: BuilderConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load3D, setLoad3D] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [gen, setGen] = useState(0);
  const [hint, setHint] = useState<"off" | "on" | "gone">("off");
  const [perfGuard, setPerfGuard] = useState(true);
  const retries = useRef(0);
  const retryCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = ref.current;
    // sin IntersectionObserver (navegador muy viejo): queda la foto de la mano
    if (!el || typeof IntersectionObserver === "undefined") return;
    let idle = 0;
    let soon = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        if (!probeWebGL2()) return;
        setPerfGuard(!forced3D());
        // que three no compita con la hidratación ni con el primer toque
        const go = () => setLoad3D(true);
        if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(go, { timeout: 300 });
        else soon = window.setTimeout(go, 50);
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(soon);
      if (idle) window.cancelIdleCallback?.(idle);
      retryCleanup.current?.();
    };
  }, []);

  // si la ruta se oculta y vuelve (Activity / cacheComponents), repetimos el fundido desde cero
  useLayoutEffect(
    () => () => {
      setReady(false);
    },
    [],
  );

  useEffect(() => {
    if (hint !== "on") return;
    const t = window.setTimeout(() => setHint("gone"), HINT_MS);
    return () => window.clearTimeout(t);
  }, [hint]);

  const onReady = () => {
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
  const loading = show3D && !ready;
  const label = describe(sel, config);

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-cream-deep ring-1 ring-bordo/10"
      onPointerDown={() => hint === "on" && setHint("gone")}
    >
      <div ref={ref} role="img" aria-label={label} className="absolute inset-0 bg-[radial-gradient(120%_90%_at_38%_22%,#fbf0d9_0%,#f5e8c8_55%,#efdcb6_100%)]">
        {/* La foto de la mano realista queda debajo: el 3D entra encima con un fundido y la tapa entera */}
        <Image
          src="/brand/hand-poster.webp"
          alt=""
          fill
          loading="eager"
          sizes="(min-width: 1024px) 440px, 100vw"
          className="object-cover"
        />
        {show3D && (
          <NailPreview3D
            key={gen}
            sel={sel}
            config={config}
            perfGuard={perfGuard}
            onReady={onReady}
            onError={onError}
            className={cn(
              // entra sobre la foto de la misma mano: el cambio casi no se nota
              "absolute inset-0 block h-full w-full transition-opacity duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)]",
              faded ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </div>
      {loading && (
        <p
          aria-live="polite"
          className="pointer-events-none absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-pill bg-cream/90 px-2.5 py-0.5 text-[10px] font-semibold text-ink sm:text-[11px]"
        >
          <span aria-hidden className="size-2 rounded-full bg-bordo/70 motion-safe:animate-pulse" />
          Cargando vista 3D
        </p>
      )}
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
        Vista previa ilustrativa, el set real lo pinto a mano
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
