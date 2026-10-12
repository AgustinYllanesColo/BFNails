"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { BuilderSelection, Quote, SizeSelection } from "@/lib/types";
import {
  DEFAULT_SELECTION,
  normalizeExtras,
  quoteSelection,
  toggleExtra,
  type BuilderConfig,
  type Option,
} from "@/lib/pricing";
import { cn, formatARS } from "@/lib/format";
import { EASE, MQ, navH, scrollToTarget } from "@/lib/motion";
import { useHydrated, useMediaQuery, useReducedMotion } from "@/lib/hooks";
import { useCart } from "@/lib/store/cart";
import { flyToCart } from "@/components/motion/FlyToCart";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { Icon } from "@/components/ui/icons";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { SizePicker, sizesAreValid } from "@/components/cart/SizePicker";
import { NailPreview } from "./NailPreview";
import { ColorDrops } from "./ColorDrops";
import { PriceDock, PulsingTotal } from "./PriceDock";
import { StepSheet, type StepSummary } from "./StepSheet";
import { StepRail } from "./StepRail";
import { BuildCelebration } from "./BuildCelebration";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { n: 1, title: "Forma", hint: "Todas quedan bien, es gusto." },
  { n: 2, title: "Largo", hint: "Corto y medio son los más cómodos para el día a día." },
  { n: 3, title: "Acabado", hint: "Brillante, mate o efecto espejo." },
  { n: 4, title: "Color base", hint: "Si querés otro color, anotalo en detalles." },
  { n: 5, title: "Técnicas", hint: "Sumá las que quieras. Cada una suma precio y complejidad." },
  {
    n: 6,
    title: "Detalles",
    hint: "Opcional. Si pedís algo que no está en la lista, Bren lo cotiza antes de que pagues.",
  },
  { n: 7, title: "Talle", hint: "Estándar, con tus medidas o lo vemos por WhatsApp." },
] as const;

const STEP_COUNT = STEPS.length;
const DEFAULT_SIZES: SizeSelection = { mode: "standard", size: "S" };
/** Más técnicas que esto y el panel las agrupa en una línea "Técnicas (n)" con su detalle plegable. */
const GROUP_EXTRAS_AFTER = 3;
const STORAGE_KEY = "bf-builder-v1";
const DESKTOP = "(min-width: 1024px)";
const WHITE_TIP = "#fffdf8";
/** Salida de la BottomSheet (220 ms) + un cuadro: recién ahí se libera el scroll. */
const SHEET_EXIT_MS = 240;

/**
 * Posición absoluta para dejar `el` a `gap` px por debajo del nav. Se le pasa a `scrollToTarget` un número (y no el
 * elemento) porque Lenis, con un elemento, ya descuenta el `scroll-padding-top` de la raíz y el `scroll-margin` del
 * destino: con un offset propio encima el viaje se quedaba corto.
 */
function scrollYFor(el: HTMLElement, gap: number): number {
  return Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - navH() - gap));
}

/** Corre `fn` cuando `lockScroll()` ya soltó la página (o a los 1,2 s, lo que pase primero). */
function whenScrollUnlocked(fn: () => void) {
  const t0 = performance.now();
  const check = () => {
    const locked = document.documentElement.style.overflow === "hidden";
    if (!locked || performance.now() - t0 > 1200) {
      requestAnimationFrame(fn);
      return;
    }
    requestAnimationFrame(check);
  };
  check();
}

type Saved = { v: 1; sel: BuilderSelection; sizes: SizeSelection; touched: number[] };

/** Lee lo guardado en esta pestaña y lo valida contra la config actual (opciones que ya no existen vuelven al default). */
function readSaved(config: BuilderConfig): Saved | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Saved>;
    if (data.v !== 1 || !data.sel) return null;
    const s = data.sel;
    const has = (list: { id: string }[], id: unknown) => typeof id === "string" && list.some((o) => o.id === id);
    const sel: BuilderSelection = {
      shape: has(config.shapes, s.shape) ? s.shape : DEFAULT_SELECTION.shape,
      length: has(config.lengths, s.length) ? s.length : DEFAULT_SELECTION.length,
      finish: has(config.finishes, s.finish) ? s.finish : DEFAULT_SELECTION.finish,
      base: has(config.bases, s.base) ? s.base : DEFAULT_SELECTION.base,
      extras: Array.isArray(s.extras) ? normalizeExtras(s.extras.filter((e) => typeof e === "string"), config) : [],
      tipColor: has(config.bases, s.tipColor) ? s.tipColor : undefined,
      notes: typeof s.notes === "string" ? s.notes : undefined,
      referenceUrl: typeof s.referenceUrl === "string" ? s.referenceUrl : undefined,
    };
    const z = data.sizes;
    const sizes: SizeSelection =
      z?.mode === "standard" && ["XS", "S", "M", "L"].includes(z.size)
        ? z
        : z?.mode === "custom" && Array.isArray(z.mm) && z.mm.length === 10
          ? { mode: "custom", mm: z.mm.map((n) => (typeof n === "number" ? n : 0)) }
          : z?.mode === "kit"
            ? z
            : DEFAULT_SIZES;
    const touched = Array.isArray(data.touched)
      ? data.touched.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= STEP_COUNT)
      : [];
    return { v: 1, sel, sizes, touched };
  } catch {
    return null;
  }
}

function writeSaved(data: Saved | null) {
  try {
    if (data) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* sin almacenamiento (modo privado): el diseño vale para esta visita */
  }
}

const label = <T extends { id: string; label: string }>(list: T[], id?: string) =>
  list.find((o) => o.id === id)?.label ?? "";

function sizeValue(sizes: SizeSelection): string {
  if (sizes.mode === "standard") return `Talle ${sizes.size}`;
  if (sizes.mode === "custom") return sizesAreValid(sizes) ? "Con tus medidas" : "Faltan medidas";
  return "Por WhatsApp";
}

/**
 * Armador "Diseñá tu set" (PLAN W2-D).
 *
 * Celular: la vista previa 3D queda a la vista mientras elegís: al llegar arriba se pega debajo del nav y se achica
 * con el scroll (una sola instancia, escalada en el compositor: el canvas no se redimensiona), sobre una banda crema
 * que tapa lo que pasa por debajo. Abajo, el PriceDock lleva la miniatura del set, el paso actual y el total; un toque
 * abre la hoja con los 7 pasos.
 * Desktop: columna fija con el riel de pasos, la vista previa y el panel "Tu set" (líneas que entran y salen, total
 * que rueda y late, CTAs siempre a la vista).
 * Una sola `NailPreview` montada, elegida por breakpoint: `[data-preview="mobile"]` (con la clase `lg:hidden`) o
 * `[data-preview="desktop"]` dentro del `<aside>`.
 */
export function Builder({ config, intro }: { config: BuilderConfig; intro?: ReactNode }) {
  const [sel, setSel] = useState<BuilderSelection>(DEFAULT_SELECTION);
  const [sizes, setSizes] = useState<SizeSelection>(DEFAULT_SIZES);
  const [touched, setTouched] = useState<number[]>([]);
  const [step, setStep] = useState(1);
  const [added, setAdded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [celebration, setCelebration] = useState<{ open: boolean; at: string }>({
    open: false,
    at: "",
  });
  const [hint, setHint] = useState<{ group: string; text: string; key: number } | null>(null);
  const [resumed, setResumed] = useState(false);
  const [restored, setRestored] = useState(false);

  const add = useCart((s) => s.add);
  const router = useRouter();
  const desktop = useMediaQuery(DESKTOP);
  const reduced = useReducedMotion();
  const hydrated = useHydrated();

  const panelRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageCardRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const mobileSweepRef = useRef<HTMLDivElement>(null);
  const desktopSweepRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef(0);
  const timers = useRef<number[]>([]);
  const hintSeq = useRef(0);

  // Restaurar lo guardado en esta pestaña, recién después de hidratar (el HTML del servidor es siempre el default).
  if (hydrated && !restored) {
    setRestored(true);
    const saved = readSaved(config);
    if (saved) {
      setSel(saved.sel);
      setSizes(saved.sizes);
      setTouched(saved.touched);
      setResumed(saved.touched.length > 0);
    }
  }

  useEffect(() => {
    if (!restored) return;
    writeSaved({ v: 1, sel, sizes, touched });
  }, [restored, sel, sizes, touched]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const quote = useMemo(() => quoteSelection(sel, config), [sel, config]);
  const valid = sizesAreValid(sizes);

  const groups = useMemo(() => {
    const m = new Map<string, BuilderConfig["extras"]>();
    config.extras.forEach((e) => m.set(e.group, [...(m.get(e.group) ?? []), e]));
    return [...m.entries()];
  }, [config]);

  const touch = (n: number) => setTouched((t) => (t.includes(n) ? t : [...t, n]));
  const update = (n: number, patch: Partial<BuilderSelection>) => {
    setSel((s) => ({ ...s, ...patch }));
    touch(n);
  };

  const onToggleExtra = (id: string, group: string) => {
    const result = toggleExtra(sel.extras, id, config);
    setSel((s) => ({ ...s, extras: result.extras }));
    touch(5);
    if (result.removed.length) {
      const names = result.removed.map((r) => label(config.extras, r)).join(" y ");
      setHint({ group, text: `Cambiamos ${names} por ${label(config.extras, id)}`, key: ++hintSeq.current });
    }
  };

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(null), 2500);
    return () => window.clearTimeout(t);
  }, [hint]);

  /* ---------- Resumen de cada paso (encabezados, hoja, riel) ---------- */
  const extrasTotal = sel.extras.reduce(
    (acc, id) => acc + (config.extras.find((e) => e.id === id)?.delta ?? 0),
    0,
  );
  const extrasValue =
    sel.extras.length === 0
      ? "Ninguna"
      : `${sel.extras.length} ${sel.extras.length === 1 ? "técnica" : "técnicas"} · +${formatARS(extrasTotal)}`;
  const detailValue =
    [sel.notes?.trim() ? "notas" : null, sel.referenceUrl?.trim() ? "referencia" : null]
      .filter(Boolean)
      .join(" y ") || "";
  const values = [
    label(config.shapes, sel.shape),
    label(config.lengths, sel.length),
    label(config.finishes, sel.finish),
    label(config.bases, sel.base),
    extrasValue,
    detailValue ? `Con ${detailValue}` : "Opcional",
    sizeValue(sizes),
  ];
  const summaries: StepSummary[] = STEPS.map((s, i) => ({
    n: s.n,
    title: s.title,
    value: values[i],
    touched: touched.includes(s.n),
  }));

  /* ---------- Paso actual: el que cruza la franja de lectura (40–45 % de la pantalla) ---------- */
  useEffect(() => {
    const els = stepRefs.current.filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ---------- Vista previa pegada en el celular ---------- */
  useEffect(() => {
    if (desktop) return;
    const wrap = stageRef.current;
    const card = stageCardRef.current;
    const band = bandRef.current;
    const sentinel = sentinelRef.current;
    if (!wrap || !card || !band || !sentinel) return;
    const root = document.documentElement;
    let natural = 0;
    let top = 0;
    let minScale = 1;

    const measure = () => {
      natural = card.offsetHeight;
      top = parseFloat(getComputedStyle(wrap).top) || 80;
      // alto compacto: ~22 % de la pantalla, entre 150 y 196 px (las cinco uñas siguen leyéndose)
      const compact = Math.round(Math.min(196, Math.max(150, window.innerHeight * 0.22)));
      minScale = natural > 0 ? Math.min(1, compact / natural) : 1;
      compactRef.current = Math.round(natural * minScale);
      wrap.style.setProperty("--stage-compact", `${compactRef.current}px`);
      // con la vista previa pegada, el foco por teclado y los anclajes no quedan tapados por ella
      root.style.scrollPaddingTop = `calc(var(--nav-h) + ${compactRef.current + 40}px)`;
    };

    const mm = gsap.matchMedia();
    mm.add(MQ, (ctx) => {
      const { reduced: calm } = ctx.conditions as { reduced: boolean };
      const apply = (p: number) => {
        // reduced-motion: sin escala atada al scroll, cambia de estado de una vez
        const q = calm ? (p > 0.5 ? 1 : 0) : p;
        const s = 1 - (1 - minScale) * q;
        card.style.transform = q > 0 ? `scale(${s.toFixed(4)})` : "";
        const full = top + natural + 12;
        band.style.transform = `scaleY(${((top + natural * s + 12) / full).toFixed(4)})`;
        band.style.opacity = String(Math.min(1, p * 6));
        band.style.pointerEvents = p > 0 ? "auto" : "none";
        wrap.toggleAttribute("data-stuck", p > 0);
      };
      const st = ScrollTrigger.create({
        trigger: sentinel,
        start: () => `top ${top}px`,
        end: () => `+=${Math.max(80, Math.round((natural - compactRef.current) * 1.2))}`,
        invalidateOnRefresh: true,
        onRefreshInit: measure,
        onRefresh: (self) => apply(self.progress),
        onUpdate: (self) => apply(self.progress),
      });
      measure();
      st.refresh();
      apply(st.progress);
      return () => {
        st.kill();
        card.style.transform = "";
        band.style.transform = "";
        band.style.opacity = "";
        band.style.pointerEvents = "";
        wrap.removeAttribute("data-stuck");
      };
    });
    return () => {
      mm.revert();
      root.style.scrollPaddingTop = "";
      compactRef.current = 0;
    };
  }, [desktop]);

  // lo de arriba de la vista previa cambió de alto (aviso "Seguís con tu diseño"): recalcular dónde se pega
  useEffect(() => {
    if (restored) ScrollTrigger.refresh();
  }, [restored, resumed]);

  /* ---------- Navegación entre pasos ---------- */
  const registerStep = useCallback((n: number, el: HTMLElement | null) => {
    stepRefs.current[n - 1] = el;
  }, []);

  const goToStep = useCallback(
    (n: number, { focusInvalid = false }: { focusInvalid?: boolean } = {}) => {
      const el = stepRefs.current[n - 1];
      if (!el) return;
      const mobile = !window.matchMedia(DESKTOP).matches;
      // debajo del nav y, en el celular, de la vista previa pegada (compacta) con su fundido
      scrollToTarget(scrollYFor(el, mobile && compactRef.current ? compactRef.current + 36 : 12));
      if (focusInvalid) {
        const t = window.setTimeout(() => {
          const field =
            el.querySelector<HTMLInputElement>("input:invalid, input[value='']") ??
            el.querySelector<HTMLElement>("input, button");
          field?.focus({ preventScroll: true });
        }, 420);
        timers.current.push(t);
      }
    },
    [],
  );

  // La hoja bloquea el scroll mientras está abierta (y al soltarlo Lenis corta cualquier viaje en curso): primero se
  // cierra y, recién con el scroll libre, la página viaja al paso.
  const afterSheet = (fn: () => void) => {
    setSheetOpen(false);
    timers.current.push(window.setTimeout(() => whenScrollUnlocked(fn), SHEET_EXIT_MS));
  };
  const goFromSheet = (n: number) => afterSheet(() => goToStep(n));
  const seePrice = () =>
    afterSheet(() => {
      const el = panelRef.current;
      if (el) scrollToTarget(scrollYFor(el, 12));
    });

  /* ---------- Agregar ---------- */
  const baseHex = config.bases.find((b) => b.id === sel.base)?.hex ?? "#e8c4b0";
  const tipHex = sel.extras.includes("francesita-color")
    ? (config.bases.find((b) => b.id === (sel.tipColor ?? "bordo"))?.hex ?? undefined)
    : sel.extras.includes("francesita")
      ? WHITE_TIP
      : undefined;

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const addToCart = (from: HTMLElement | null, then?: "checkout") => {
    if (!valid) {
      goToStep(7, { focusInvalid: true });
      return;
    }
    add({
      kind: "custom",
      name: `Set a medida · ${label(config.shapes, sel.shape)} ${label(config.lengths, sel.length).toLowerCase()}`,
      selection: sel,
      quote,
      unitPrice: quote.total,
      qty: 1,
      sizes,
    });
    // t = 0: la ficha vuela a la bolsita (la bolsita se aplasta y el contador sube al llegar, ~560 ms)
    flyToCart(from, { base: baseHex, shape: sel.shape, tip: tipHex, finish: sel.finish });
    setAdded(true);
    later(() => setAdded(false), 2200);
    if (then === "checkout") {
      router.push("/checkout");
      return;
    }
    // t = 80 ms: barrido de laca sobre la vista previa
    const sweep = (window.matchMedia(DESKTOP).matches ? desktopSweepRef : mobileSweepRef).current;
    if (sweep && !reduced) {
      sweep.animate(
        [{ transform: "translateX(-120%)" }, { transform: "translateX(120%)" }],
        { duration: 700, delay: 80, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    }
    // t = 700 ms: se imprime la receta
    const at = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    later(() => setCelebration({ open: true, at }), reduced ? 150 : 700);
  };

  const startOver = () => {
    setSel(DEFAULT_SELECTION);
    setSizes(DEFAULT_SIZES);
    setTouched([]);
    setResumed(false);
    setHint(null);
    writeSaved(null);
  };

  const designAnother = () => {
    setCelebration((c) => ({ ...c, open: false }));
    startOver();
    // la receta también bloquea el scroll: subir recién cuando la hoja la soltó
    later(() => whenScrollUnlocked(() => scrollToTarget(0)), SHEET_EXIT_MS);
  };

  /* ---------- Render ---------- */
  const tipValue = sel.tipColor ?? "bordo";
  const pingKey = `${sel.shape}|${sel.length}|${sel.finish}|${sel.base}|${tipHex ?? ""}|${sel.extras.join(",")}`;
  const currentStep = STEPS[Math.min(STEP_COUNT, Math.max(1, step)) - 1];

  return (
    <div className="grid gap-x-12 [--stage-top:calc(var(--nav-h)+8px)] lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-x-16">
      <div className="min-w-0 pb-6 lg:pb-[var(--section-y-tight)]">
        {intro}

        <AnimatePresence initial={false}>
          {resumed ? (
            <motion.div
              key="resumed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: EASE.ui }}
              className="overflow-hidden"
            >
              <div
                role="status"
                className="bg-surface ring-line rounded-pill mb-5 flex items-center justify-between gap-2 py-1 pr-1 pl-4 shadow-xs ring-1"
              >
                <span className="text-ink flex min-w-0 items-center gap-2 text-sm font-medium">
                  <Icon name="sparkle" size={16} className="text-bordo shrink-0" />
                  <span className="truncate">Seguís con tu diseño</span>
                </span>
                <button
                  type="button"
                  onClick={startOver}
                  className="text-bordo rounded-pill [@media(hover:hover)]:hover:bg-cream-deep min-h-11 shrink-0 px-4 text-sm font-semibold transition-[background-color,scale] duration-150 ease-[var(--ease-ui)] active:scale-[0.97]"
                >
                  Empezar de cero
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Celular: vista previa que se pega debajo del nav y se achica con el scroll */}
        <div ref={sentinelRef} aria-hidden className="h-0 lg:hidden" />
        <div
          ref={stageRef}
          data-preview="mobile"
          className="pointer-events-none sticky top-[var(--stage-top)] z-20 lg:hidden"
        >
          <div
            ref={bandRef}
            aria-hidden
            className="bg-cream pointer-events-none absolute -inset-x-[var(--gutter)] top-[calc(var(--stage-top)*-1)] h-[calc(var(--stage-top)+100%+12px)] origin-top opacity-0 after:absolute after:inset-x-0 after:top-full after:h-8 after:bg-[linear-gradient(to_bottom,var(--cream-100)_20%,rgb(254_247_231/0))]"
          />
          <div
            ref={stageCardRef}
            className="pointer-events-auto relative mx-auto w-full max-w-[440px] origin-top rounded-lg shadow-lg"
          >
            {!desktop ? <NailPreview sel={sel} config={config} /> : <PreviewPlaceholder />}
            <LacquerSweep sweepRef={mobileSweepRef} />
          </div>
        </div>

        <div className="mt-10 space-y-12 md:mt-12 lg:mt-14 lg:space-y-16">
          <StepSection n={1} value={values[0]} register={registerStep}>
            {(labelId) => (
              <ChoiceChips
                options={config.shapes}
                value={sel.shape}
                labelledBy={labelId}
                onChange={(id) => update(1, { shape: id })}
              />
            )}
          </StepSection>

          <StepSection n={2} value={values[1]} register={registerStep}>
            {(labelId) => (
              <ChoiceChips
                options={config.lengths}
                value={sel.length}
                labelledBy={labelId}
                onChange={(id) => update(2, { length: id })}
              />
            )}
          </StepSection>

          <StepSection n={3} value={values[2]} register={registerStep}>
            {(labelId) => (
              <ChoiceChips
                options={config.finishes}
                value={sel.finish}
                labelledBy={labelId}
                onChange={(id) => update(3, { finish: id })}
              />
            )}
          </StepSection>

          <StepSection n={4} value={values[3]} register={registerStep}>
            {(labelId) => (
              <ColorDrops
                options={config.bases}
                value={sel.base}
                label="Color base"
                labelledBy={labelId}
                onChange={(id) => update(4, { base: id })}
              />
            )}
          </StepSection>

          <StepSection n={5} value={values[4]} register={registerStep}>
            {() => (
              <div className="space-y-6">
                {groups.map(([group, extras]) => (
                  <TechniqueGroup
                    key={group}
                    group={group}
                    extras={extras}
                    selected={sel.extras}
                    hint={hint?.group === group ? hint : null}
                    onToggle={(id) => onToggleExtra(id, group)}
                  >
                    <AnimatePresence initial={false}>
                      {group === "Clásicos" && sel.extras.includes("francesita-color") ? (
                        <motion.div
                          key="tip"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.26, ease: EASE.ui }}
                          className="overflow-hidden"
                        >
                          <TipColor
                            options={config.bases}
                            value={tipValue}
                            onChange={(id) => update(5, { tipColor: id })}
                          />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </TechniqueGroup>
                ))}
              </div>
            )}
          </StepSection>

          <StepSection n={6} value={values[5]} register={registerStep}>
            {() => (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Referencia (link de Pinterest, IG, TikTok)" htmlFor="ref">
                  <input
                    id="ref"
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    className={inputClass}
                    placeholder="https://"
                    value={sel.referenceUrl ?? ""}
                    onChange={(e) => update(6, { referenceUrl: e.target.value })}
                  />
                </Field>
                <Field
                  label="Notas para Bren"
                  htmlFor="notes"
                  hint={
                    sel.notes?.trim() ? "Con notas, el precio final se confirma por WhatsApp." : undefined
                  }
                >
                  <textarea
                    id="notes"
                    className={textareaClass}
                    placeholder="Ej: la del anular con una K dorada, el resto liso"
                    value={sel.notes ?? ""}
                    onChange={(e) => update(6, { notes: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </StepSection>

          <StepSection n={7} value={values[6]} register={registerStep} invalid={!valid}>
            {() => (
              <SizePicker
                value={sizes}
                onChange={(v) => {
                  setSizes(v);
                  touch(7);
                }}
              />
            )}
          </StepSection>
        </div>
      </div>

      {/* Desktop: columna fija con riel, vista previa y panel. Celular: solo el panel, al final. */}
      <aside
        aria-label="Resumen de tu set"
        className="lg:sticky lg:top-[calc(var(--nav-h)+32px)] lg:flex lg:h-[calc(100dvh-var(--nav-h)-48px)] lg:flex-col lg:self-start"
      >
        <StepRail steps={summaries} current={step} onGo={goToStep} className="hidden lg:block" />
        <section
          id="tu-set"
          ref={panelRef}
          aria-labelledby="tu-set-t"
          className="bg-surface ring-line flex flex-col rounded-xl p-2 shadow-sm ring-1 lg:mt-3 lg:min-h-0 lg:flex-1"
        >
          <div data-preview="desktop" className="hidden shrink-0 lg:block">
            <div className="relative mx-auto w-[min(100%,calc(clamp(180px,34dvh,330px)*4/3))] rounded-lg">
              {desktop ? <NailPreview sel={sel} config={config} /> : <PreviewPlaceholder />}
              <LacquerSweep sweepRef={desktopSweepRef} />
            </div>
          </div>
          <SummaryPanel
            quote={quote}
            ctaRef={ctaRef}
            desktop={desktop}
            added={added}
            valid={valid}
            onAdd={(btn) => addToCart(btn)}
            onBuyNow={(btn) => addToCart(btn, "checkout")}
          />
        </section>
      </aside>

      <PriceDock
        ctaRef={ctaRef}
        total={quote.total}
        step={{ n: currentStep.n, title: currentStep.title }}
        stepCount={STEP_COUNT}
        swatch={{ shape: sel.shape, base: baseHex, tip: tipHex, finish: sel.finish }}
        pingKey={pingKey}
        onOpenSteps={() => setSheetOpen(true)}
        onAdd={(btn) => addToCart(btn)}
        added={added}
      />
      <StepSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        steps={summaries}
        current={step}
        total={quote.total}
        levelLabel={quote.complexityLabel}
        onGo={goFromSheet}
        onSeePrice={seePrice}
      />
      <BuildCelebration
        open={celebration.open}
        onClose={() => setCelebration((c) => ({ ...c, open: false }))}
        onReset={designAnother}
        sel={sel}
        sizes={sizes}
        quote={quote}
        config={config}
        printedAt={celebration.at}
      />
    </div>
  );
}

/* =========================================================================================
   Piezas
   ========================================================================================= */

/** Mismo fondo que la vista previa (sin `role="img"`): ocupa su lugar en el breakpoint donde no está montada. */
function PreviewPlaceholder() {
  return (
    <div
      aria-hidden
      className="bg-cream-deep aspect-[4/3] w-full rounded-lg bg-[radial-gradient(120%_90%_at_38%_22%,#fbf0d9_0%,#f5e8c8_55%,#efdcb6_100%)] ring-1 ring-bordo/10"
    />
  );
}

/** Barrido de laca (top coat) que cruza la vista previa al agregar: lo anima `addToCart` con WAAPI. */
function LacquerSweep({ sweepRef }: { sweepRef: RefObject<HTMLDivElement | null> }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
      <div
        ref={sweepRef}
        className="absolute inset-0 -translate-x-[120%] bg-[linear-gradient(105deg,transparent_40%,rgb(255_255_255/0.55)_50%,transparent_60%)]"
      />
    </div>
  );
}

function StepSection({
  n,
  value,
  register,
  invalid = false,
  children,
}: {
  n: number;
  value: string;
  register: (n: number, el: HTMLElement | null) => void;
  invalid?: boolean;
  children: (labelId: string) => ReactNode;
}) {
  const meta = STEPS[n - 1];
  const titleId = `paso-${n}-t`;
  return (
    <section
      id={`paso-${n}`}
      data-step={n}
      aria-labelledby={titleId}
      ref={(el) => register(n, el)}
    >
      <header className="mb-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5">
        <span
          aria-hidden
          className="font-display text-bordo tabular text-[28px] leading-none md:text-[32px]"
        >
          {String(n).padStart(2, "0")}
        </span>
        <h2 id={titleId} className="font-display text-ink text-[28px] leading-none md:text-[32px]">
          <span className="sr-only">Paso {n}: </span>
          {meta.title}
        </h2>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: EASE.ui }}
            className={cn(
              "max-w-[46vw] truncate text-right text-sm font-semibold lg:max-w-none",
              invalid ? "text-red" : "text-bordo",
            )}
          >
            {value}
          </motion.span>
        </AnimatePresence>
        <p className="text-meta text-ink-soft col-start-2 col-end-4">{meta.hint}</p>
      </header>
      {children(titleId)}
    </section>
  );
}

/** Elección única con chips (`role="radio"`): flechas para recorrer, la elección sigue al foco. */
function ChoiceChips<T extends string>({
  options,
  value,
  labelledBy,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  labelledBy: string;
  onChange: (id: T) => void;
}) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = options.length - 1;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = i === last ? 0 : i + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = i === 0 ? last : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    onChange(options[next].id);
    const radios = e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]');
    radios?.[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {options.map((o, i) => (
        <Chip
          key={o.id}
          role="radio"
          selected={o.id === value}
          tabIndex={i === selectedIndex ? 0 : -1}
          onKeyDown={(e) => onKeyDown(e, i)}
          onClick={() => onChange(o.id)}
          hint={o.delta ? `+${formatARS(o.delta)}` : undefined}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  );
}

function TechniqueGroup({
  group,
  extras,
  selected,
  hint,
  onToggle,
  children,
}: {
  group: string;
  extras: BuilderConfig["extras"];
  selected: string[];
  hint: { text: string; key: number } | null;
  onToggle: (id: string) => void;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="text-label text-ink-soft mb-2.5 uppercase">
        {group}
      </p>
      <div className="flex flex-wrap gap-2">
        {extras.map((e) => (
          <Chip
            key={e.id}
            multi
            selected={selected.includes(e.id)}
            onClick={() => onToggle(e.id)}
            hint={`+${formatARS(e.delta)}`}
          >
            {e.label}
          </Chip>
        ))}
      </div>
      {/* región viva siempre montada: el aviso de "Cambiamos X por Y" se anuncia al aparecer */}
      <div aria-live="polite" className="empty:hidden">
        <AnimatePresence initial={false}>
          {hint ? (
            <motion.p
              key={hint.key}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: EASE.ui }}
              className="overflow-hidden"
            >
              <span className="text-meta text-ink-soft flex items-center gap-1.5 pt-2.5">
                <Icon name="check" size={14} className="text-bordo shrink-0" />
                {hint.text}
              </span>
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
      {children}
    </div>
  );
}

function TipColor({
  options,
  value,
  onChange,
}: {
  options: BuilderConfig["bases"];
  value: string;
  onChange: (id: string) => void;
}) {
  const id = useId();
  return (
    <div className="bg-cream-deep/60 mt-3 rounded-lg p-4">
      <p id={id} className="text-ink mb-3 text-sm font-semibold">
        Color de la punta
      </p>
      <ColorDrops options={options} value={value} label="Color de la punta" labelledBy={id} onChange={onChange} />
    </div>
  );
}

/* ---------- Panel "Tu set" ---------- */

function SummaryPanel({
  quote,
  ctaRef,
  desktop,
  added,
  valid,
  onAdd,
  onBuyNow,
}: {
  quote: Quote;
  ctaRef: RefObject<HTMLDivElement | null>;
  desktop: boolean;
  added: boolean;
  valid: boolean;
  onAdd: (btn: HTMLButtonElement) => void;
  onBuyNow: (btn: HTMLButtonElement) => void;
}) {
  const [openExtras, setOpenExtras] = useState(false);
  const extrasId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [fade, setFade] = useState(false);

  const extraLines = quote.lines.filter((l) => l.id.startsWith("extra:"));
  const grouped = extraLines.length > GROUP_EXTRAS_AFTER;
  const before = quote.lines.filter((l) => !l.id.startsWith("extra:") && l.id !== "complexity");
  const after = quote.lines.filter((l) => l.id === "complexity");
  const extrasSum = extraLines.reduce((a, l) => a + l.amount, 0);

  // máscara inferior solo si la lista desborda y no llegaste al final (desktop: la lista scrollea adentro del panel)
  useEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    const sync = () => setFade(ul.scrollHeight > ul.clientHeight + 1 && ul.scrollTop + ul.clientHeight < ul.scrollHeight - 4);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(ul);
    for (const child of ul.children) ro.observe(child);
    ul.addEventListener("scroll", sync, { passive: true });
    return () => {
      ro.disconnect();
      ul.removeEventListener("scroll", sync);
    };
  }, [quote.lines.length, openExtras]);

  const line = (l: Quote["lines"][number]) => (
    <motion.li
      key={l.id}
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.25, ease: EASE.ui }}
      className="flex items-baseline justify-between gap-3"
    >
      <span className="text-ink-soft min-w-0">{l.label}</span>
      <Price value={l.amount} size="sm" className="text-ink shrink-0" />
    </motion.li>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col px-3 pt-4 pb-3 lg:px-4 lg:pt-4 lg:pb-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="tu-set-t" className="font-display text-ink text-[26px] leading-none">
          Tu set
        </h2>
        <LevelMeter level={quote.complexity} label={quote.complexityLabel} />
      </div>

      <ul
        ref={listRef}
        data-lenis-prevent=""
        className={cn(
          "mt-4 space-y-2 text-sm lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1",
          fade && "[mask-image:linear-gradient(to_bottom,#000_calc(100%-28px),transparent)]",
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {before.map(line)}
          {grouped ? (
            <motion.li
              key="extras-group"
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease: EASE.ui }}
            >
              <button
                type="button"
                aria-expanded={openExtras}
                aria-controls={extrasId}
                onClick={() => setOpenExtras((o) => !o)}
                className="group/x flex min-h-11 w-full items-center justify-between gap-3 text-left lg:min-h-0"
              >
                <span className="text-ink-soft flex min-w-0 items-center gap-1.5">
                  Técnicas ({extraLines.length})
                  <span className="text-bordo text-meta font-semibold underline-offset-2 [@media(hover:hover)]:group-hover/x:underline">
                    {openExtras ? "ocultar" : "ver detalle"}
                  </span>
                  <Icon
                    name="chevron"
                    size={14}
                    className={cn(
                      "text-bordo transition-transform duration-200 ease-[var(--ease-ui)]",
                      openExtras && "rotate-180",
                    )}
                  />
                </span>
                <Price value={extrasSum} size="sm" className="text-ink shrink-0" />
              </button>
              <div
                id={extrasId}
                className="grid transition-[grid-template-rows] duration-[250ms] ease-[var(--ease-ui)]"
                style={{ gridTemplateRows: openExtras ? "1fr" : "0fr" }}
              >
                <ul className="min-h-0 overflow-hidden" inert={!openExtras || undefined}>
                  {extraLines.map((l) => (
                    <li key={l.id} className="text-meta flex items-baseline justify-between gap-3 pt-1.5 pl-3">
                      <span className="text-ink-soft min-w-0">{l.label}</span>
                      <Price value={l.amount} size="sm" className="text-ink-soft shrink-0 text-[13px]" />
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ) : (
            extraLines.map(line)
          )}
          {after.map(line)}
          {quote.lines.length === 1 ? (
            <motion.li
              key="empty"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE.ui }}
              className="border-line text-meta text-ink-faint mt-1 flex items-center gap-2 rounded-md border border-dashed px-3 py-2.5"
            >
              <Icon name="plus" size={14} className="shrink-0" />
              Lo que sumes aparece acá, con su precio.
            </motion.li>
          ) : null}
        </AnimatePresence>
      </ul>

      <div className="border-line mt-4 flex items-end justify-between gap-3 border-t pt-4">
        <span className="text-ink pb-1 text-[15px] font-semibold">
          {quote.needsConfirmation ? "Desde" : "Total"}
        </span>
        <PulsingTotal value={quote.total} tone="light" size="xl" announce />
      </div>
      {quote.needsConfirmation ? (
        <p className="text-meta text-ink-soft mt-2">
          Tus notas pueden cambiar el precio. Bren te confirma por WhatsApp antes de cobrar.
        </p>
      ) : null}

      <div
        ref={ctaRef}
        className="mt-5 grid gap-2 lg:mt-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"
      >
        <Button
          size={desktop ? "md" : "lg"}
          className="lg:px-4"
          onClick={(e) => onAdd(e.currentTarget)}
          data-cursor="sumar"
        >
          <motion.span
            key={String(added)}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE.ui }}
            className="inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            {added ? (
              <>
                ¡Sumado al carrito!
                <Icon name="sparkle" size={16} />
              </>
            ) : (
              "Agregar al carrito"
            )}
          </motion.span>
        </Button>
        <Button
          variant="secondary"
          size={desktop ? "md" : "lg"}
          className="lg:px-4"
          onClick={(e) => onBuyNow(e.currentTarget)}
        >
          Pedir ahora
        </Button>
      </div>
      {!valid ? (
        <p className="text-meta text-red mt-2.5 flex items-start gap-1.5 font-medium">
          <Icon name="alert" size={14} className="mt-[0.15em] shrink-0" />
          Completá las 10 medidas (entre 5 y 25 mm) en el paso Talle.
        </p>
      ) : null}
    </div>
  );
}

/** Nivel de complejidad: píldora que hace pop al cambiar + cuatro estrellitas. */
function LevelMeter({ level, label: text }: { level: number; label: string }) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const prev = useRef(level);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (prev.current === level) return;
    prev.current = level;
    if (reduced || !scope.current) return;
    const c = animate(
      scope.current,
      { transform: ["scale(1)", "scale(1.12)", "scale(1)"] },
      { duration: 0.26, ease: EASE.bounce },
    );
    return () => c.stop();
  }, [level, reduced, animate, scope]);
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="flex items-center gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <Icon
            key={i}
            name="star"
            size={12}
            className={cn(
              "transition-colors duration-200",
              i <= level ? "text-bordo-star" : "text-cream-ink",
            )}
          />
        ))}
      </span>
      <span
        ref={scope}
        className={cn(
          "rounded-pill text-label inline-flex h-6 items-center px-2.5 uppercase transition-colors duration-200",
          level >= 3 ? "bg-bordo text-cream" : "bg-cream-deep text-bordo",
        )}
      >
        <span className="sr-only">Nivel </span>
        {text}
      </span>
    </span>
  );
}
