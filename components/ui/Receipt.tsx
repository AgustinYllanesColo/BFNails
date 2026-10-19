"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { animate } from "motion/react";
import { cn, formatARS } from "@/lib/format";
import { useHydrated, useReducedMotion } from "@/lib/hooks";
import { Paper, PrinterHead, TicketRow, TicketRule } from "@/components/ui/ticket";
import { Stamp } from "@/components/ui/Stamp";
import { starBurst } from "@/components/motion/burst";

/**
 * Ticket de la impresora térmica (PLAN W2-E.1): carrito, checkout, pedido, receta del armador y 404.
 * Se arma con las piezas de `ticket.tsx` (cabezal, papel, filete, fila). JetBrains Mono vive solo acá adentro.
 *
 * Impresión sin mover el layout: todas las filas se renderizan desde el principio (el alto final queda reservado) y el
 * papel se destapa con `clip-path` hasta el borde de abajo de la última fila impresa (`--printed-h`, una fila cada
 * 70 ms, transición de 70 ms lineal). Cada fila entra con un barrido de 90 ms en 8 pasos (sin fundido), el cabezal
 * vibra mientras imprime y el TOTAL (doble alto, con filete doble) cuenta hasta su valor en 300 ms. Al terminar el
 * papel se corta (baja 4 px con un resorte; 6 px si lleva sello) y el LED queda crema. Una fila que cambia (key
 * `id:valor`) repite su barrido sola. Con reduced-motion no hay barrido ni vibración: el papel aparece en 150 ms.
 *
 * Nunca esconde lo que el servidor pintó a la vista: si el ticket se hidrata desde el HTML del servidor y ya está en
 * pantalla, queda impreso. Lo que monta el cliente (carrito, checkout, la hoja del armador) imprime al entrar en vista
 * (`startOnView`, 35 % visible). `firstVisitKey` (pedido): imprime, corta y sella solo la primera vez que esa clienta
 * lo abre (`localStorage`); en una carga completa lo decide antes del primer paint `receiptBootScript(key)`, que la
 * página pone antes del ticket. Un toque sobre el ticket saltea la coreografía.
 */

export type ReceiptLine =
  | {
      kind: "row";
      id: string;
      label: string;
      value: string;
      /** Detalle debajo de la etiqueta ("talle S"). */
      sub?: string;
      tone?: "normal" | "bold" | "accent" | "muted";
    }
  | { kind: "rule"; id: string; variant?: "dash" | "double" }
  | { kind: "text"; id: string; text: string; align?: "left" | "center" | "right" };

export type ReceiptStamp = {
  label: string;
  icon?: "bow" | "kitty";
  size?: "sm" | "md";
  /** Al caer: temblor del papel, ráfaga de estrellas y vibración (solo el sello del pedido y el "Enviado"). */
  celebrate?: boolean;
};

type Props = {
  title: string;
  /** Arriba a la derecha (hora, fecha, nº de pedido). */
  meta?: string;
  lines: ReceiptLine[];
  footer?: ReceiptLine[];
  className?: string;
  /** Texto del visor mientras imprime. */
  printingLabel?: string;
  /** Texto del visor cuando terminó. */
  idleLabel?: string;
  /** Texto del visor mientras espera para imprimir (todavía fuera de vista). */
  waitingLabel?: string;
  /** Sello de goma en su propia fila, al pie del papel (nunca tapa el TOTAL). Puede llegar después ("Enviado"). */
  stamp?: ReceiptStamp | null;
  /** Logo de la Kitty impreso en tinta térmica arriba del ticket. */
  logo?: boolean;
  /** Código de barras decorativo (dibujo derivado de este texto, p. ej. el número de pedido). */
  barcode?: string;
  /** Espera a estar 35 % en pantalla para imprimir (default). Con `false` imprime apenas monta. */
  startOnView?: boolean;
  /** Imprime, corta y sella solo la primera visita con esta clave; las siguientes queda impreso y quieto. */
  firstVisitKey?: string;
  /** Ya impreso y quieto, sin coreografía. */
  still?: boolean;
  /** El papel se corta y se va (baja 24 px y se desvanece en 400 ms); después llama a `onExited`. */
  exit?: boolean;
  onExited?: () => void;
  onPrinted?: () => void;
  onStampLanded?: (stampEl: HTMLElement) => void;
  /** Algo que asoma por detrás del cabezal (la Kitty del pedido). Va posicionado por quien lo usa. */
  behindHead?: ReactNode;
  /** Semilla del dentado del papel. */
  seed?: number;
};

type Phase = "static" | "pending" | "printing" | "done";

const TICK = 70;
const SLIVER = 14; // papel cargado: asoma apenas debajo del cabezal
const SHADOW = 32; // la sombra del papel se sale por los costados: el recorte no la corta
const CELEBRATED = (key: string) => `bf-celebrated-${key}`;

/**
 * Script en línea (cargas completas) que va antes del ticket con `firstVisitKey`: si es la primera visita marca
 * `html[data-bf-print]` y el CSS tapa el papel desde el primer paint, sin parpadeo. Si React no llega a tomar la
 * posta en 5 s, se desarma solo y el ticket queda impreso.
 */
export function receiptBootScript(key: string): string {
  const k = JSON.stringify(key);
  const storageKey = JSON.stringify(CELEBRATED(key));
  return `try{if(!localStorage.getItem(${storageKey})){var d=document.documentElement;d.dataset.bfPrint=matchMedia("(prefers-reduced-motion: reduce)").matches?"fade":"print";d.dataset.bfPrintKey=${k};setTimeout(function(){if(d.dataset.bfPrintKey===${k}){delete d.dataset.bfPrint;delete d.dataset.bfPrintKey}},5000)}}catch(e){}`;
}

function readCelebrated(key: string): boolean {
  try {
    return localStorage.getItem(CELEBRATED(key)) !== null;
  } catch {
    return true; // sin almacenamiento: mejor quieto que repetir la fiesta en cada visita
  }
}

function markCelebrated(key: string | undefined) {
  if (!key) return;
  try {
    localStorage.setItem(CELEBRATED(key), "1");
  } catch {
    // modo privado: la coreografía puede repetirse, nada más
  }
}

/* ---------- contexto de impresión (lo leen las filas) ---------- */

type PrintCtx = {
  printed: (index: number) => boolean;
  /** El ticket ya montó: una fila que monta ahora es nueva o cambió (repite su barrido). */
  mounted: React.RefObject<boolean>;
  reduced: boolean;
  phase: Phase;
};
const Ctx = createContext<PrintCtx | null>(null);

const INK_HIDDEN = "inset(0 100% 0 0)";

function sweep(el: HTMLElement) {
  el.animate([{ clipPath: INK_HIDDEN }, { clipPath: "inset(0 0% 0 0)" }], {
    duration: 90,
    easing: "steps(8, end)",
  });
}

/** Un bloque imprimible: oculto (sin tinta) hasta que el cabezal llega; entra con el barrido. */
function Block({ index, children, className }: { index: number; children: ReactNode; className?: string }) {
  const ctx = useContext(Ctx)!;
  const ref = useRef<HTMLDivElement>(null);
  const printed = ctx.printed(index);
  const was = useRef(printed);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || ctx.reduced) return;
    // fila nueva o cambiada cuando el ticket ya estaba impreso
    if (ctx.mounted.current && printed && (ctx.phase === "done" || ctx.phase === "static")) sweep(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (printed && !was.current && !ctx.reduced) sweep(el);
    was.current = printed;
  }, [printed, ctx.reduced]);

  return (
    <div
      ref={ref}
      data-pr=""
      className={className}
      style={printed || ctx.reduced ? undefined : { clipPath: INK_HIDDEN }}
    >
      {children}
    </div>
  );
}

/** TOTAL que cuenta hasta su valor (300 ms) cuando se imprime o cuando cambia. */
function CountUp({ value, index }: { value: string; index: number }) {
  const ctx = useContext(Ctx)!;
  const printed = ctx.printed(index);
  const [shown, setShown] = useState(value);
  const prev = useRef<{ value: string; printed: boolean }>({ value, printed });

  useLayoutEffect(() => {
    const before = prev.current;
    prev.current = { value, printed };
    const target = Number(value.replace(/[^\d]/g, ""));
    const isMoney = /\$/.test(value) && Number.isFinite(target);
    const startPrint = printed && !before.printed;
    const changed = printed && before.printed && before.value !== value;
    if (!isMoney || ctx.reduced || !(startPrint || changed)) {
      setShown(value);
      return;
    }
    const from = startPrint ? 0 : Number(before.value.replace(/[^\d]/g, "")) || 0;
    setShown(formatARS(from)); // antes del paint: la fila entra ya en el valor de partida
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 300);
      const k = 1 - Math.pow(1 - t, 3);
      if (t >= 1) {
        setShown(value);
        return;
      }
      // en pasos de $100, como una caja registradora (y sin cifras sueltas que tiemblen)
      setShown(formatARS(Math.round((from + (target - from) * k) / 100) * 100));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, printed, ctx.reduced]);

  return <span className="tabular-nums">{shown}</span>;
}

/* ---------- código de barras decorativo ---------- */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function Barcode({ value }: { value: string }) {
  let a = hash(value) || 1;
  const rand = () => {
    a ^= a << 13;
    a ^= a >>> 17;
    a ^= a << 5;
    return ((a >>> 0) % 1000) / 1000;
  };
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  while (x < 196) {
    const w = 1 + Math.floor(rand() * 3);
    bars.push({ x, w });
    x += w + 1 + Math.floor(rand() * 2.4);
  }
  return (
    <div aria-hidden className="flex flex-col items-center gap-1.5 pt-1">
      <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="h-10 w-full max-w-[240px]">
        {bars.map((b) => (
          <rect key={b.x} x={b.x + 2} y="0" width={b.w} height="40" fill="currentColor" />
        ))}
      </svg>
      <span className="text-[13px] tracking-[0.3em]">{value}</span>
    </div>
  );
}

/* ---------- ticket ---------- */

export function Receipt({
  title,
  meta,
  lines,
  footer = [],
  className,
  printingLabel = "imprimiendo…",
  idleLabel = "listo",
  waitingLabel = "en espera",
  stamp = null,
  logo = false,
  barcode,
  startOnView = true,
  firstVisitKey,
  still = false,
  exit = false,
  onExited,
  onPrinted,
  onStampLanded,
  behindHead,
  seed = 7,
}: Props) {
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  // ¿Montó en el cliente (sin HTML del servidor que respetar) o se está hidratando?
  const [clientMount] = useState(hydrated);
  const [phase, setPhase] = useState<Phase>(() => {
    if (still || !clientMount) return "static";
    if (firstVisitKey && readCelebrated(firstVisitKey)) return "static";
    return "pending";
  });
  const [count, setCount] = useState(0);
  const [stampState, setStampState] = useState<"rest" | "hidden" | "play">(() =>
    phase === "static" ? "rest" : "hidden",
  );
  const stampLabel = useRef(stamp?.label ?? null);
  const countRef = useRef(0);

  const root = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const cutNode = useRef<HTMLDivElement>(null);
  const stampNode = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const shake = useRef<Animation | null>(null);
  const skipped = useRef(false);
  const callbacks = useRef({ onPrinted, onStampLanded, onExited });
  useEffect(() => {
    callbacks.current = { onPrinted, onStampLanded, onExited };
  });

  /* ----- bloques en orden de impresión ----- */
  let n = 0;
  const next = () => n++;
  const all: ReceiptLine[] = [
    ...lines,
    ...(footer.length ? [{ kind: "rule", id: "footer-rule" } as ReceiptLine, ...footer] : []),
  ];
  const headerIndex = logo ? 1 : 0;
  if (logo) next();
  next(); // título
  next(); // filete
  const lineIndex = all.map(() => next());
  const barcodeIndex = barcode ? next() : -1;
  const stampIndex = stamp ? next() : -1;
  const total = n;

  const printed = useCallback(
    (i: number) => phase === "static" || phase === "done" || i < count,
    [phase, count],
  );

  const cut = stamp ? 6 : 4;

  /* ----- hidratación: el servidor lo pintó impreso; ¿lo tapó el script de primera visita? ¿está fuera de vista? ----- */
  useLayoutEffect(() => {
    mounted.current = true;
    if (clientMount || still) return;
    const html = document.documentElement;
    const booted = firstVisitKey && html.dataset.bfPrintKey === firstVisitKey;
    if (booted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el estado sale del DOM al hidratar (script de primera visita): no se conoce en el render
      setPhase("pending");
      setStampState("hidden");
      return;
    }
    if (firstVisitKey) return; // ya celebrado (o sin almacenamiento): queda impreso
    const el = root.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const visible = r.top < window.innerHeight && r.bottom > 0;
    if (!visible) {
      setPhase("pending");
      setStampState("hidden");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El script de primera visita se desarma cuando React ya tomó la posta (mismo estado: tapado).
  useLayoutEffect(() => {
    if (phase === "static") return;
    const html = document.documentElement;
    if (firstVisitKey && html.dataset.bfPrintKey === firstVisitKey) {
      delete html.dataset.bfPrint;
      delete html.dataset.bfPrintKey;
    }
  }, [phase, firstVisitKey]);

  /* ----- disparo: al entrar en vista o apenas monta ----- */
  useEffect(() => {
    if (phase !== "pending") return;
    const el = root.current;
    if (!el) return;
    const start = () => {
      if (reduced) {
        setPhase("done");
        return;
      }
      setPhase("printing");
    };
    if (!startOnView || firstVisitKey) {
      const raf = requestAnimationFrame(start);
      return () => cancelAnimationFrame(raf);
    }
    // 35 % del ticket en pantalla (o 35 % de la pantalla, si el ticket es más alto que ella)
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const enough =
          entry.intersectionRatio >= 0.35 || entry.intersectionRect.height >= window.innerHeight * 0.35;
        if (!enough) return;
        io.disconnect();
        start();
      },
      { threshold: [0, 0.1, 0.2, 0.35, 0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [phase, startOnView, firstVisitKey, reduced]);

  /* ----- impresión: una fila cada 70 ms, cabezal vibrando ----- */
  useEffect(() => {
    if (phase !== "printing") return;
    const h = head.current;
    shake.current?.cancel();
    shake.current =
      h?.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(0.6px)" },
          { transform: "translateY(0)" },
          { transform: "translateY(-0.4px)" },
          { transform: "translateY(0)" },
        ],
        { duration: 120, iterations: Infinity, easing: "linear" },
      ) ?? null;
    const id = setInterval(() => {
      countRef.current += 1;
      setCount(countRef.current);
      if (countRef.current >= total) {
        clearInterval(id);
        setPhase("done");
      }
    }, TICK);
    return () => {
      clearInterval(id);
      shake.current?.cancel();
      shake.current = null;
    };
  }, [phase, total]);

  /* ----- borde del papel: el fondo de la última fila impresa ----- */
  useLayoutEffect(() => {
    const f = feed.current;
    if (!f) return;
    if (phase !== "pending" && phase !== "printing") {
      f.style.removeProperty("--printed-h");
      return;
    }
    const blocks = f.querySelectorAll<HTMLElement>("[data-pr]");
    const last = blocks[Math.min(count, blocks.length) - 1];
    const top = f.getBoundingClientRect().top;
    const h = last ? last.getBoundingClientRect().bottom - top + 6 : SLIVER;
    f.style.setProperty("--printed-h", `${Math.max(SLIVER, Math.round(h))}px`);
  }, [phase, count]);

  /* ----- fin de la impresión: corte (resorte) y, si hay, sello ----- */
  const playStamp = useCallback(() => {
    if (skipped.current) return;
    setStampState("play");
  }, []);

  useEffect(() => {
    if (phase !== "done") return;
    callbacks.current.onPrinted?.();
    const node = cutNode.current;
    if (!node || reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- la fase "done" llega del final de la animación; el sello sigue ese evento
      if (stamp) setStampState(reduced ? "play" : "rest");
      return;
    }
    const a = animate(node, { transform: ["translateY(0px)", `translateY(${cut}px)`] }, { type: "spring", stiffness: 700, damping: 20 });
    const t = stamp ? setTimeout(playStamp, 220) : undefined;
    return () => {
      clearTimeout(t);
      a.stop();
    };
    // el sello que llega después lo maneja el efecto de abajo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Sello que aparece cuando el ticket ya estaba impreso ("Enviado"): fila nueva → corte → sello.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    const label = stamp?.label ?? null;
    if (label === stampLabel.current) return;
    stampLabel.current = label;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (!label) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- el sello sigue a un cambio de prop que puede llegar con el ticket ya impreso
      setStampState("hidden");
      return;
    }
    if (phase !== "done" && phase !== "static") return; // lo sella el final de la impresión
    setStampState("hidden");
    const node = cutNode.current;
    // la fila nueva se imprime (~90 ms), el papel se vuelve a cortar y cae el sello
    timers.current.push(
      setTimeout(() => {
        if (!node || reduced) return;
        animate(
          node,
          { transform: [`translateY(${Math.max(0, cut - 3)}px)`, `translateY(${cut}px)`] },
          { type: "spring", stiffness: 700, damping: 20 },
        );
      }, 140),
      setTimeout(() => setStampState("play"), reduced ? 0 : 360),
    );
  }, [stamp?.label, phase, cut, reduced]);

  const landed = useCallback(() => {
    const el = stampNode.current;
    markCelebrated(firstVisitKey);
    if (!el) return;
    if (stamp?.celebrate && !reduced && !skipped.current) {
      feed.current?.animate(
        [{ translate: "0 0" }, { translate: "-2px 0" }, { translate: "2px 0" }, { translate: "-1px 0" }, { translate: "0 0" }],
        { duration: 180, easing: "linear" },
      );
      starBurst(el, { count: 10, radius: [60, 110] });
      navigator.vibrate?.(12);
    }
    callbacks.current.onStampLanded?.(el);
  }, [firstVisitKey, stamp?.celebrate, reduced]);

  // Sin sello, la primera visita queda registrada al terminar de imprimir.
  useEffect(() => {
    if (phase === "done" && !stamp) markCelebrated(firstVisitKey);
  }, [phase, stamp, firstVisitKey]);

  /* ----- un toque saltea la coreografía del pedido (el sello que ya cae, termina) ----- */
  const skip = () => {
    if (!firstVisitKey) return;
    const busy = phase === "printing" || phase === "pending" || (phase === "done" && stampState === "hidden");
    if (!busy) return;
    skipped.current = true;
    countRef.current = total;
    setCount(total);
    setPhase("done");
    if (stamp) setStampState("rest");
    markCelebrated(firstVisitKey);
  };

  /* ----- salida (checkout → pedido) ----- */
  useEffect(() => {
    if (!exit) return;
    const node = cutNode.current;
    if (!node || reduced) {
      const t = setTimeout(() => callbacks.current.onExited?.(), reduced ? 150 : 0);
      if (node && reduced) node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" });
      return () => clearTimeout(t);
    }
    const from = getComputedStyle(node).transform;
    const a = node.animate(
      [
        { transform: from === "none" ? "translateY(0px)" : from, opacity: 1 },
        { transform: "translateY(24px)", opacity: 0 },
      ],
      { duration: 400, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "forwards" },
    );
    a.onfinish = () => callbacks.current.onExited?.();
    return () => {
      a.onfinish = null;
    };
  }, [exit, reduced]);

  const status = phase === "printing" ? "printing" : phase === "pending" ? "waiting" : "idle";
  const label = phase === "printing" ? printingLabel : phase === "pending" ? waitingLabel : idleLabel;
  const covered = phase === "pending" || phase === "printing";

  const feedStyle: CSSProperties = covered
    ? reduced
      ? { opacity: phase === "pending" ? 0 : 1, transition: "opacity 150ms ease-out" }
      : {
          clipPath: `inset(0 -${SHADOW}px calc(100% - var(--printed-h, ${SLIVER}px)) -${SHADOW}px)`,
          transition: "clip-path 70ms linear",
        }
    : reduced
      ? { opacity: 1, transition: "opacity 150ms ease-out" }
      : {};

  const ctx: PrintCtx = { printed, mounted, reduced, phase };

  return (
    <Ctx.Provider value={ctx}>
      <div
        ref={root}
        data-receipt={phase}
        className={cn("relative font-mono text-[13px] leading-relaxed text-[#2b2622]", className)}
        onClick={skip}
      >
        {behindHead}
        <div ref={head} className="relative z-10">
          <PrinterHead status={status} label={label} />
        </div>

        {/* El papel sale de la ranura: un poco más angosto que el cabezal y metido debajo */}
        <div
          ref={feed}
          data-receipt-feed=""
          className={cn(
            "relative -mt-2 px-2",
            // primera visita en una carga completa: tapado desde el primer paint (lo marca receiptBootScript)
            firstVisitKey &&
              "[html[data-bf-print=print]_&]:[clip-path:inset(0_-32px_calc(100%_-_14px)_-32px)] [html[data-bf-print=fade]_&]:opacity-0",
          )}
          style={feedStyle}
        >
          <div
            ref={cutNode}
            style={phase === "static" && !reduced ? { transform: `translateY(${cut}px)` } : undefined}
          >
            <Paper seed={seed}>
              {logo ? (
                <Block index={0} className="flex justify-center pb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tinta térmica: filtro sobre el webp chico */}
                  <img
                    src="/brand/logo-kitty.webp"
                    alt=""
                    width={72}
                    height={67}
                    className="h-auto w-[72px] mix-blend-multiply [filter:grayscale(1)_contrast(1.8)_brightness(.9)]"
                  />
                </Block>
              ) : null}
              <Block index={headerIndex} className="flex items-baseline justify-between gap-3 font-bold tracking-[0.04em] uppercase">
                <span className="min-w-0 [overflow-wrap:anywhere]">{title}</span>
                {meta ? <span className="text-ink-soft shrink-0 font-normal tabular-nums">{meta}</span> : null}
              </Block>
              <Block index={headerIndex + 1}>
                <TicketRule />
              </Block>

              {all.map((l, i) => {
                const index = lineIndex[i];
                if (l.kind === "rule") {
                  return (
                    <Block key={l.id} index={index}>
                      <TicketRule variant={l.variant} />
                    </Block>
                  );
                }
                if (l.kind === "text") {
                  return (
                    <Block
                      key={`${l.id}:${l.text}`}
                      index={index}
                      className={cn(
                        "text-ink-soft py-0.5 text-[13px] leading-snug",
                        l.align === "center" && "text-center",
                        l.align === "right" && "text-right",
                      )}
                    >
                      {l.text}
                    </Block>
                  );
                }
                if (l.id === "total") {
                  return (
                    <Block key={`${l.id}:${l.label}`} index={index}>
                      <TicketRule variant="double" className="mt-1" />
                      <div className="flex items-baseline justify-between gap-3 text-[20px] leading-none font-bold uppercase">
                        <span className="min-w-0">{l.label}</span>
                        <CountUp value={l.value} index={index} />
                      </div>
                      {l.sub ? <p className="text-ink-soft mt-1.5 text-[13px] leading-snug">{l.sub}</p> : null}
                    </Block>
                  );
                }
                return (
                  <Block key={`${l.id}:${l.value}:${l.label}`} index={index}>
                    <TicketRow label={l.label} value={l.value} sub={l.sub} tone={l.tone} />
                  </Block>
                );
              })}

              {barcode ? (
                <Block index={barcodeIndex} className="mt-3">
                  <Barcode value={barcode} />
                </Block>
              ) : null}

              {stamp ? (
                // El sello en su fila (reserva su alto desde el principio): nunca tapa el TOTAL ni mueve nada al caer
                <Block
                  index={stampIndex}
                  className={cn(
                    "mt-3 flex justify-end",
                    stamp.size === "sm" ? "min-h-12" : "min-h-16",
                    firstVisitKey && "[html[data-bf-print]_&]:invisible",
                  )}
                >
                  <div ref={stampNode} className={cn(stampState === "hidden" && "invisible")}>
                    <Stamp
                      key={stamp.label}
                      size={stamp.size ?? "md"}
                      icon={stamp.icon}
                      label={stamp.label}
                      play={stampState === "play"}
                      onLanded={landed}
                    />
                  </div>
                </Block>
              ) : null}
            </Paper>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
