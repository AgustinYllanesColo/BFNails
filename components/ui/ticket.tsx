import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * Piezas del ticket térmico (PLAN W1-F2.14): el material de marca de "Cómo funciona", carrito, checkout, pedido y 404.
 * `PrinterHead` (cabezal con LED y ranura) + `Paper` (papel con sombra, grano y dentado irregular) + `TicketRule` +
 * `TicketRow`. JetBrains Mono vive solo acá adentro. Sin estado: se pueden usar desde el servidor; la impresión
 * (scroll, clip-path, LED) la coreografía quien las compone.
 */

/* =========================================================================================
   Cabezal
   ========================================================================================= */

type PrinterStatus = "idle" | "printing" | "waiting";

/**
 * LED del visor. Amarillo nariz siempre sólido (a media opacidad sobre el carbón se ve oliva): imprimiendo parpadea
 * rápido con halo (1 → .45), esperando respira lento y poco profundo (1 → .7 en 2,4 s, como un equipo en espera) y
 * listo queda crema fijo.
 */
const LED: Record<PrinterStatus, string> = {
  printing:
    "bg-yellow shadow-[0_0_6px_1px_color-mix(in_srgb,var(--yellow)_55%,transparent)] animate-[led-pulse_0.9s_ease-in-out_infinite]",
  idle: "bg-cream",
  waiting: "bg-yellow [--led-low:0.7] animate-[led-pulse_2.4s_ease-in-out_infinite]",
};

export function PrinterHead({
  status = "idle",
  label,
  className,
}: {
  status?: PrinterStatus;
  /** Lo que dice el visor ("imprimiendo…", "listo", "esperando"). */
  label: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-surface="inverse"
      data-printer={status}
      className={cn(
        "bg-printer text-cream shadow-device relative z-10 rounded-[18px] px-4 pt-3 pb-4 font-mono",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-on-bordo-muted flex min-w-0 items-center gap-2 text-[13px] leading-none">
          {/* LED en su propio nodo: el parpadeo es ambiente (se pausa fuera de vista y con la pausa manual) */}
          <span
            aria-hidden
            data-ambient={status === "idle" ? undefined : "move"}
            className={cn(
              "size-2 shrink-0 rounded-full transition-colors duration-200",
              LED[status],
            )}
          />
          <span className="truncate">{label}</span>
        </span>
        {/* Relieve decorativo del plástico */}
        <span
          aria-hidden
          className="text-cream/25 shrink-0 font-sans text-[10px] font-bold tracking-[0.3em] uppercase"
        >
          BF Studio
        </span>
      </div>
      <div aria-hidden className="mt-4 h-1.5 rounded-full bg-black/70" />
    </div>
  );
}

/* =========================================================================================
   Papel
   ========================================================================================= */

/** PRNG determinístico (mulberry32): el mismo dentado en el servidor y en el cliente, sin parpadeo al hidratar. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STRIP_W = 480; // período de la tira; con dientes de 6–9 px la repetición no se nota
const STRIP_H = 8; // profundidad máxima del dentado

/**
 * Tira de máscara para el borde roto: dientes de 6–9 px de ancho y 5–8 px de profundidad. El papel ocupa la parte de
 * arriba de la tira; `flip` la invierte para el borde superior. Empieza y termina a la misma altura: se repite sin
 * costura.
 */
function tornStrip(seed: number, flip: boolean): string {
  const rand = prng(seed);
  const xs: number[] = [0];
  while (xs[xs.length - 1] < STRIP_W) xs.push(xs[xs.length - 1] + 6 + rand() * 3);
  const k = STRIP_W / xs[xs.length - 1]; // se estira apenas para cerrar justo en 480
  const depth = xs.map(() => 5 + rand() * 3);
  depth[depth.length - 1] = depth[0];
  const pts: string[] = [];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i] * k;
    pts.push(`${x.toFixed(2)},${(STRIP_H - depth[i]).toFixed(2)}`);
    if (i < xs.length - 1) {
      const mid = ((xs[i] + xs[i + 1]) / 2) * k;
      pts.push(`${mid.toFixed(2)},${STRIP_H}`);
    }
  }
  const poly = `0,0 ${pts.join(" ")} ${STRIP_W},0`;
  const transform = flip ? ` transform="matrix(1 0 0 -1 0 ${STRIP_H})"` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STRIP_W}" height="${STRIP_H}" viewBox="0 0 ${STRIP_W} ${STRIP_H}"><polygon${transform} points="${poly}" fill="#000"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

type Torn = boolean | "bottom" | "top" | "both";

function paperMask(torn: Torn, seed: number): CSSProperties {
  const bottom = torn === true || torn === "bottom" || torn === "both";
  const top = torn === "top" || torn === "both";
  if (!bottom && !top) return {};
  const layers: string[] = [];
  const sizes: string[] = [];
  const positions: string[] = [];
  const repeats: string[] = [];
  const body = `calc(100% - ${(bottom ? STRIP_H : 0) + (top ? STRIP_H : 0)}px)`;
  layers.push("linear-gradient(#000, #000)");
  sizes.push(`100% ${body}`);
  positions.push(`0 ${top ? `${STRIP_H}px` : "0"}`);
  repeats.push("no-repeat");
  if (bottom) {
    layers.push(tornStrip(seed, false));
    sizes.push(`${STRIP_W}px ${STRIP_H}px`);
    positions.push("0 100%");
    repeats.push("repeat-x");
  }
  if (top) {
    layers.push(tornStrip(seed + 101, true));
    sizes.push(`${STRIP_W}px ${STRIP_H}px`);
    positions.push("0 0");
    repeats.push("repeat-x");
  }
  const image = layers.join(", ");
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskSize: sizes.join(", "),
    WebkitMaskSize: sizes.join(", "),
    maskPosition: positions.join(", "),
    WebkitMaskPosition: positions.join(", "),
    maskRepeat: repeats.join(", "),
    WebkitMaskRepeat: repeats.join(", "),
  };
}

/**
 * Papel térmico: sombra de papel (drop-shadow que sigue el dentado), sombra de la ranura arriba, grano al 4 % y tinta
 * `#2b2622`. `torn` corta el borde de abajo (o `"top"` / `"both"`); `seed` cambia el dibujo del corte.
 */
export function Paper({
  children,
  torn = true,
  seed = 7,
  className,
  wrapperClassName,
  style,
}: {
  children: ReactNode;
  torn?: Torn;
  seed?: number;
  className?: string;
  wrapperClassName?: string;
  style?: CSSProperties;
}) {
  const bottom = torn === true || torn === "bottom" || torn === "both";
  const top = torn === "top" || torn === "both";
  return (
    <div className={cn("[filter:var(--filter-paper)]", wrapperClassName)}>
      <div
        data-paper=""
        className={cn(
          "relative isolate px-5 pt-5 font-mono text-[13px] leading-relaxed text-[#2b2622]",
          "after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:bg-[image:var(--noise-ink)] after:bg-[length:160px] after:opacity-[0.04] after:content-['']",
          bottom ? "pb-8" : "pb-5",
          top && "pt-7",
          className,
        )}
        style={{
          background:
            "linear-gradient(to bottom, rgb(0 0 0 / 0.07), transparent 14px), var(--paper)",
          boxShadow: "inset 1px 0 rgb(0 0 0 / 0.04), inset -1px 0 rgb(0 0 0 / 0.04)",
          ...paperMask(torn, seed),
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* =========================================================================================
   Filete y fila
   ========================================================================================= */

const DASH =
  "h-px bg-[repeating-linear-gradient(90deg,currentColor_0_5px,transparent_5px_9px)] opacity-35";

export function TicketRule({
  variant = "dash",
  className,
}: {
  variant?: "dash" | "double";
  className?: string;
}) {
  if (variant === "double") {
    return (
      <div aria-hidden className={cn("my-3 flex flex-col gap-[3px]", className)}>
        <div className={DASH} />
        <div className={DASH} />
      </div>
    );
  }
  return <div aria-hidden className={cn("my-3", DASH, className)} />;
}

type RowTone = "normal" | "bold" | "accent" | "muted";

const ROW_TONE: Record<RowTone, string> = {
  normal: "",
  bold: "font-bold",
  accent: "font-bold text-red",
  muted: "text-ink-soft",
};

export function TicketRow({
  label,
  value,
  sub,
  tone = "normal",
  className,
}: {
  label: ReactNode;
  value?: ReactNode;
  /** Detalle debajo de la etiqueta ("talle S · almendra"). */
  sub?: ReactNode;
  tone?: RowTone;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 py-0.5", ROW_TONE[tone], className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
        {value !== undefined ? (
          <span className="shrink-0 text-right tabular-nums">{value}</span>
        ) : null}
      </div>
      {sub ? (
        <p className="text-ink-soft pl-3 text-[13px] leading-snug font-normal">{sub}</p>
      ) : null}
    </div>
  );
}
