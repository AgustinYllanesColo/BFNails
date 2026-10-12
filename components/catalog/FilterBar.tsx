"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import type { Design, Length, Shape } from "@/lib/types";
import {
  LENGTH_LABEL,
  SHAPE_LABEL,
  SORT_LABEL,
  activeFilterCount,
  catalogTags,
  countWith,
  tagLabel,
  type CatalogFilters,
  type CatalogSort,
  type FilterKey,
} from "@/lib/data/catalog";
import { EASE, navH, scrollToTarget, stickyOffset } from "@/lib/motion";
import { useHydrated, useMediaQuery, useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/format";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Icon } from "@/components/ui/icons";

/**
 * Filtros del catálogo (PLAN W2-C.2). Mismos `Chip` (toggle con `aria-pressed`) y misma animación de la grilla que
 * le gustan al dueño; lo que cambia es el contenedor.
 *
 * - **Celular** (< md): bloque en el flujo, no pegado. Forma y Largo en filas que envuelven, Estilo en una fila con
 *   scroll lateral (con fundido en el borde que tiene más chips). Cuando el bloque sale de vista aparece la **barra
 *   compacta** fija de 56 px (fuera del flujo: no corre nada de lugar) con "Filtros" + contador, los filtros activos
 *   para sacarlos de un toque y la cantidad de diseños; "Filtros" abre la hoja con los mismos grupos.
 * - **Desktop** (≥ md): las tres filas en un panel flotante que se pega debajo del nav; la sombra aparece solo
 *   cuando está pegado.
 * - Cada chip muestra cuántos diseños quedarían con los otros filtros puestos; si serían 0 queda deshabilitado
 *   (salvo que esté elegido: un chip elegido siempre se puede soltar).
 */
type RevealMode = "smooth" | "instant";

type Props = {
  designs: Design[];
  filters: CatalogFilters;
  /** Diseños que se ven con los filtros actuales. */
  total: number;
  onChange: (next: CatalogFilters) => void;
  /** Comienzo de la grilla: después de filtrar desde la barra o la hoja, se scrollea ahí si quedó tapado. */
  gridRef: RefObject<HTMLElement | null>;
};

type Option = { value: string; label: string; count: number };

const SHAPES = Object.keys(SHAPE_LABEL) as Shape[];
const LENGTHS = Object.keys(LENGTH_LABEL) as Length[];
/** Alto de la barra compacta (56) + aire con la grilla. */
const COMPACT_COVER = 66;

const designsLabel = (n: number) => (n === 1 ? "1 diseño" : `${n} diseños`);

export function FilterBar({ designs, filters, total, onChange, gridRef }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const desktop = useMediaQuery("(min-width: 768px)");
  const hydrated = useHydrated();
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const beforeRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [past, setPast] = useState(false);
  const [sheet, setSheet] = useState(false);

  const tags = catalogTags(designs, 10, filters.estilo);
  const groups: { key: FilterKey; label: string; options: Option[] }[] = [
    {
      key: "forma",
      label: "Forma",
      options: SHAPES.map((s) => ({
        value: s,
        label: SHAPE_LABEL[s],
        count: countWith(designs, filters, "forma", s),
      })),
    },
    {
      key: "largo",
      label: "Largo",
      options: LENGTHS.map((l) => ({
        value: l,
        label: LENGTH_LABEL[l],
        count: countWith(designs, filters, "largo", l),
      })),
    },
    {
      key: "estilo",
      label: "Estilo",
      options: tags.map((t) => ({
        value: t,
        label: tagLabel(t),
        count: countWith(designs, filters, "estilo", t),
      })),
    },
  ];
  const active = activeFilterCount(filters);
  const activeChips = groups.flatMap((g) => {
    const v = filters[g.key];
    const o = v ? g.options.find((opt) => opt.value === v) : undefined;
    return o ? [{ key: g.key, label: o.label }] : [];
  });

  // Desktop: ¿el panel ya está pegado debajo del nav? (sentinela justo antes del panel)
  useEffect(() => {
    const el = beforeRef.current;
    if (!el || !desktop) return;
    const top = navH() + 10;
    const io = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < top + 1),
      { rootMargin: `-${top + 1}px 0px 0px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [desktop]);

  // Celular: ¿el bloque de filtros ya quedó arriba, detrás del nav? (sentinela justo después del bloque)
  useEffect(() => {
    const el = afterRef.current;
    if (!el || desktop) return;
    const top = navH();
    const io = new IntersectionObserver(
      ([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < top + 1),
      { rootMargin: `-${top}px 0px 0px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [desktop]);

  /** Si el comienzo de la grilla quedó tapado (por la barra compacta o el panel pegado), lo trae a la vista. */
  const reveal = (mode: RevealMode) => {
    const grid = gridRef.current;
    if (!grid) return;
    const cover = desktop ? (panelRef.current?.offsetHeight ?? 0) + 10 : COMPACT_COVER;
    if (grid.getBoundingClientRect().top < navH() + 16 + cover - 1) {
      scrollToTarget(grid, { offset: stickyOffset(cover), immediate: mode === "instant" || undefined });
    }
  };

  const set = (key: FilterKey, value: string | null, mode?: RevealMode) => {
    onChange({ ...filters, [key]: value });
    if (mode) reveal(mode);
  };
  const setSort = (orden: CatalogSort, mode?: RevealMode) => {
    onChange({ ...filters, orden });
    if (mode) reveal(mode);
  };
  const clear = (mode?: RevealMode) => {
    onChange({ ...filters, forma: null, largo: null, estilo: null });
    if (mode) reveal(mode);
  };

  return (
    <>
      <div ref={beforeRef} aria-hidden className="h-0" />
      <section
        ref={panelRef}
        aria-label="Filtrar diseños"
        data-stuck={stuck || undefined}
        className={cn(
          "relative",
          "md:ring-line md:bg-cream md:sticky md:top-[var(--sticky-top)] md:z-30 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-x-8 md:rounded-xl md:px-5 md:py-3.5 md:ring-1 md:transition-[box-shadow] md:duration-200 md:ease-[var(--ease-ui)]",
          stuck && "md:shadow-md",
        )}
      >
        <div className="space-y-3 md:space-y-2">
          {groups.map((g) => (
            <ChipGroup
              key={g.key}
              id={`${uid}-${g.key}`}
              label={g.label}
              options={g.options}
              selected={filters[g.key]}
              onPick={(v) => set(g.key, v, desktop ? "smooth" : undefined)}
              scroll={g.key === "estilo"}
            />
          ))}
        </div>
        <div className="mt-4 flex min-h-11 items-center justify-between gap-2 md:mt-0 md:flex-col md:items-end md:justify-end md:gap-2">
          <p className="text-ink-soft text-sm whitespace-nowrap md:order-first">
            <CountRoll value={total} /> {total === 1 ? "diseño" : "diseños"}
          </p>
          <div className="flex items-center gap-1">
            {active > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clear(desktop ? "smooth" : undefined)}
                className="md:h-10"
              >
                Limpiar
              </Button>
            ) : null}
            <SortSelect
              id={`${uid}-orden`}
              value={filters.orden}
              onChange={(o) => setSort(o, desktop ? "smooth" : undefined)}
            />
          </div>
        </div>
      </section>
      <div ref={afterRef} aria-hidden className="h-0" />

      {hydrated
        ? createPortal(
            <AnimatePresence>
              {past && !desktop ? (
                <motion.div
                  key="compact"
                  data-sticky-bar=""
                  data-filter-bar=""
                  role="region"
                  aria-label="Filtros del catálogo"
                  initial={{
                    opacity: 0,
                    transform: reduced ? "translateY(0px)" : "translateY(-8px)",
                  }}
                  animate={{
                    opacity: 1,
                    transform: "translateY(0px)",
                    transition: { duration: 0.2, ease: EASE.ui },
                  }}
                  exit={{
                    opacity: 0,
                    transform: reduced ? "translateY(0px)" : "translateY(-8px)",
                    transition: { duration: 0.14, ease: EASE.ui },
                  }}
                  className="rounded-pill bg-cream ring-line fixed inset-x-[max(12px,var(--safe-x,0px))] top-[var(--sticky-top)] z-30 flex h-14 items-center gap-2 pr-4 pl-1.5 shadow-md ring-1 md:hidden"
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSheet(true)}
                    aria-haspopup="dialog"
                    className="shrink-0 gap-1.5 px-3.5"
                  >
                    Filtros
                    {active > 0 ? (
                      <span className="bg-red text-cream tabular grid size-5 place-items-center rounded-full text-[12px] leading-none font-bold">
                        {active}
                        <span className="sr-only"> activos</span>
                      </span>
                    ) : null}
                  </Button>
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none]">
                    {activeChips.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => set(c.key, null, "smooth")}
                        aria-label={`Quitar ${c.label}`}
                        className="rounded-pill bg-bordo text-cream relative inline-flex h-9 shrink-0 items-center gap-1 pr-2 pl-3 text-sm font-medium whitespace-nowrap transition-[scale] duration-100 ease-[var(--ease-ui)] before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] active:scale-[0.96]"
                      >
                        {c.label}
                        <Icon name="close" size={14} className="opacity-80" />
                      </button>
                    ))}
                  </div>
                  <p className="text-meta text-ink-soft tabular shrink-0 whitespace-nowrap">
                    {designsLabel(total)}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filtros"
        description={`Se ven ${designsLabel(total)}`}
        footer={
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
            <Button variant="ghost" onClick={() => clear()} disabled={active === 0}>
              Limpiar
            </Button>
            <Button
              onClick={() => {
                // la página queda lista debajo de la hoja: al bajar ya se ve el comienzo de la grilla
                reveal("instant");
                setSheet(false);
              }}
            >
              Ver {designsLabel(total)}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 pb-2">
          {groups.map((g) => (
            <ChipGroup
              key={g.key}
              id={`${uid}-s-${g.key}`}
              label={g.label}
              options={g.options}
              selected={filters[g.key]}
              onPick={(v) => set(g.key, v)}
              stacked
            />
          ))}
          <div role="radiogroup" aria-labelledby={`${uid}-s-orden-l`}>
            <p id={`${uid}-s-orden-l`} className="text-label text-ink-soft mb-2.5 uppercase">
              Ordenar
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SORT_LABEL) as CatalogSort[]).map((o) => (
                <Chip
                  key={o}
                  role="radio"
                  selected={filters.orden === o}
                  onClick={() => setSort(o)}
                >
                  {SORT_LABEL[o]}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

/* ---------- Grupo de chips ---------- */

function ChipGroup({
  id,
  label,
  options,
  selected,
  onPick,
  scroll = false,
  stacked = false,
}: {
  id: string;
  label: string;
  options: Option[];
  selected: string | null;
  onPick: (value: string | null) => void;
  /** Fila con scroll lateral en el celular (en desktop envuelve como las demás). */
  scroll?: boolean;
  /** Rótulo siempre arriba (la hoja). */
  stacked?: boolean;
}) {
  const chips = options.map((o) => {
    const on = selected === o.value;
    const descId = `${id}-${o.value.replace(/[^a-zA-Z0-9]+/g, "-")}`;
    return (
      <span key={o.value} className="contents">
        <Chip
          selected={on}
          disabled={o.count === 0}
          onClick={() => onPick(on ? null : o.value)}
          aria-describedby={descId}
          data-filter={o.value}
          hint={
            <span aria-hidden className="tabular">
              {o.count}
            </span>
          }
          className={cn("shrink-0", scroll && "snap-start")}
        >
          {o.label}
        </Chip>
        <span id={descId} className="sr-only">
          {designsLabel(o.count)}
        </span>
      </span>
    );
  });

  return (
    <div
      role="group"
      aria-labelledby={`${id}-l`}
      className={cn(!stacked && "md:flex md:items-start md:gap-3")}
    >
      <p
        id={`${id}-l`}
        className={cn(
          "text-label text-ink-soft mb-2 uppercase",
          !stacked && "md:mb-0 md:w-14 md:shrink-0 md:pt-3",
        )}
      >
        {label}
      </p>
      {scroll && !stacked ? (
        <ScrollRow selected={selected}>{chips}</ScrollRow>
      ) : (
        <div className="flex min-w-0 flex-wrap gap-2">{chips}</div>
      )}
    </div>
  );
}

/**
 * Fila de chips con scroll lateral en el celular. Funde el borde que todavía tiene chips (derecho, izquierdo o los
 * dos), así se entiende que sigue sin tapar el último chip cuando ya llegaste al final. Si el elegido quedó fuera de
 * vista al cargar (llegaste desde un tag del detalle), corre la fila hasta él. En desktop envuelve.
 */
function ScrollRow({ children, selected }: { children: ReactNode; selected: string | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const sync = () => {
      raf = 0;
      const max = el.scrollWidth - el.clientWidth;
      const left = el.scrollLeft > 2;
      const right = max > 2 && el.scrollLeft < max - 2;
      const mask =
        left && right
          ? "linear-gradient(90deg, transparent, #000 40px, #000 calc(100% - 56px), transparent)"
          : right
            ? "linear-gradient(90deg, #000 calc(100% - 56px), transparent)"
            : left
              ? "linear-gradient(90deg, transparent, #000 40px)"
              : "";
      el.style.maskImage = mask;
      el.style.setProperty("-webkit-mask-image", mask);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    sync();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // El elegido, a la vista dentro de la fila (solo la fila: la página no se mueve).
  useEffect(() => {
    const el = ref.current;
    if (!el || !selected) return;
    const chip = el.querySelector<HTMLElement>(`[data-filter="${CSS.escape(selected)}"]`);
    if (!chip) return;
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const left = chip.offsetLeft - el.offsetLeft;
    if (left < el.scrollLeft || left + chip.offsetWidth > el.scrollLeft + el.clientWidth) {
      el.scrollLeft = Math.max(0, left - pad);
    }
  }, [selected]);

  return (
    <div
      ref={ref}
      className="-mx-[var(--gutter)] flex min-w-0 snap-x flex-nowrap items-center gap-2 overflow-x-auto scroll-px-[var(--gutter)] px-[var(--gutter)] py-1.5 -my-1.5 [scrollbar-width:none] md:mx-0 md:my-0 md:flex-wrap md:overflow-visible md:px-0 md:py-0 [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </div>
  );
}

/* ---------- Orden ---------- */

function SortSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: CatalogSort;
  onChange: (value: CatalogSort) => void;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Ordenar por
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as CatalogSort)}
        className="rounded-pill border-sand bg-surface text-ink h-11 appearance-none border pr-10 pl-4 text-base font-medium transition-[border-color] duration-150 ease-[var(--ease-ui)] hover:border-bordo md:h-10 md:text-sm"
      >
        {(Object.keys(SORT_LABEL) as CatalogSort[]).map((o) => (
          <option key={o} value={o}>
            {SORT_LABEL[o]}
          </option>
        ))}
      </select>
      <Icon
        name="chevron"
        size={16}
        className="text-ink-soft pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2"
      />
    </div>
  );
}

/* ---------- Cantidad que rueda ---------- */

/**
 * La cantidad de diseños cambia como un odómetro: el número viejo sube y se va, el nuevo entra de abajo (160 ms,
 * interrumpible: tocar chips seguido no encola animaciones). Con reduced-motion, solo funde.
 */
function CountRoll({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const off = reduced ? "0em" : "0.6em";
  return (
    <span className="tabular text-ink relative inline-grid overflow-hidden align-bottom font-semibold">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="[grid-area:1/1]"
          initial={{ opacity: 0, transform: `translateY(${off})` }}
          animate={{
            opacity: 1,
            transform: "translateY(0em)",
            transition: { duration: 0.16, ease: EASE.ui },
          }}
          exit={{
            opacity: 0,
            transform: `translateY(-${off})`,
            transition: { duration: 0.12, ease: EASE.ui },
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
