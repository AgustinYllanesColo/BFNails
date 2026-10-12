"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Design } from "@/lib/types";
import {
  EMPTY_FILTERS,
  catalogQuery,
  filterDesigns,
  parseCatalogFilters,
  type CatalogFilters,
} from "@/lib/data/catalog";
import { EASE } from "@/lib/motion";
import { useHydrated, useReducedMotion } from "@/lib/hooks";
import { DesignCard } from "./DesignCard";
import { FilterBar } from "./FilterBar";
import { Button } from "@/components/ui/Button";
import { AmbientZone } from "@/components/motion/AmbientZone";

/**
 * Catálogo con filtros en la URL (PLAN W2-C.2/.3): `?forma=…&largo=…&estilo=…&orden=…`. Se escriben con
 * `history.replaceState` (Next lo sincroniza con `useSearchParams`), así "Atrás" desde un detalle vuelve al mismo
 * filtro y a la misma altura, y un link compartido abre filtrado.
 *
 * `useSearchParams` en una página prerenderizada se resuelve en el cliente: la página lo envuelve en `<Suspense>` con
 * `CatalogBrowser` sin filtros como fallback (mismo HTML que sin parámetros: nada salta al hidratar).
 */
export function CatalogGrid({ designs }: { designs: Design[] }) {
  const params = useSearchParams();
  const filters = useMemo(() => parseCatalogFilters(params), [params]);
  return <CatalogBrowser designs={designs} filters={filters} />;
}

export function CatalogBrowser({
  designs,
  filters: urlFilters = EMPTY_FILTERS,
}: {
  designs: Design[];
  filters?: CatalogFilters;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  // Respuesta inmediata al toque: lo elegido manda mientras la URL (useSearchParams) siga como estaba al tocar.
  // Apenas la URL cambia (porque llegó lo elegido o porque se navegó a otro filtro), manda la URL.
  const urlQ = catalogQuery(urlFilters);
  const [pending, setPending] = useState<{ from: string; f: CatalogFilters } | null>(null);
  const filters = pending && pending.from === urlQ ? pending.f : urlFilters;
  const list = useMemo(() => filterDesigns(designs, filters), [designs, filters]);

  const setFilters = useCallback(
    (next: CatalogFilters) => {
      const q = catalogQuery(next);
      setPending({ from: urlQ, f: next });
      const { pathname, hash } = window.location;
      window.history.replaceState(null, "", `${pathname}${q ? `?${q}` : ""}${hash}`);
    },
    [urlQ],
  );
  const clear = () => setFilters({ ...filters, forma: null, largo: null, estilo: null });

  return (
    <div>
      <FilterBar
        designs={designs}
        filters={filters}
        total={list.length}
        onChange={setFilters}
        gridRef={gridRef}
      />
      {/* Un solo anuncio para lectores de pantalla (las cantidades visibles no son regiones vivas). */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {list.length === 1 ? "1 diseño" : `${list.length} diseños`}
      </p>

      <div
        ref={gridRef}
        data-catalog-grid=""
        className="relative mt-5 grid scroll-mt-[calc(var(--sticky-top)+76px)] grid-cols-2 gap-x-3 gap-y-8 md:mt-8 md:gap-x-6 md:gap-y-12 lg:grid-cols-4"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((d, i) => (
            <GridItem key={d.slug} design={d} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {list.length === 0 ? <EmptyState onClear={clear} /> : null}
    </div>
  );
}

/**
 * Una tarjeta de la grilla, un nodo por responsabilidad (PLAN §1 b):
 * 1. `layout` + opacidad (Motion): el reacomodo con resorte corto al filtrar y el fundido de entrada/salida;
 * 2. recorrido (Motion, cadena `transform`): sube 12 px desde .98 al entrar, se achica a .96 al salir;
 * 3. intro del primer paint (CSS `@starting-style`): solo las tarjetas que vinieron en el HTML, desde opacidad .4 (nunca
 *    invisibles) y 14 px abajo, escalonadas 40 ms. Las que entran al filtrar usan solo Motion (sin doble entrada).
 */
function GridItem({ design, index }: { design: Design; index: number }) {
  const hydrated = useHydrated();
  // se decide al montar: true solo en el render del HTML del servidor y su hidratación
  const [intro] = useState(!hydrated);
  const reduced = useReducedMotion();
  const delay = Math.min(index * 0.025, 0.12);
  const from = reduced ? "translateY(0px) scale(1)" : "translateY(12px) scale(0.98)";
  const gone = reduced ? "translateY(0px) scale(1)" : "translateY(0px) scale(0.96)";

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: EASE.ui } }}
      transition={{
        duration: 0.3,
        ease: EASE.expo,
        delay,
        layout: { type: "spring", duration: 0.35, bounce: 0.12 },
      }}
      className="min-w-0"
    >
      <motion.div
        initial={{ transform: from }}
        animate={{ transform: "translateY(0px) scale(1)" }}
        exit={{ transform: gone, transition: { duration: 0.18, ease: EASE.ui } }}
        transition={{ duration: 0.3, ease: EASE.expo, delay }}
      >
        <div
          className={
            intro
              ? "transition-[opacity,translate] duration-[400ms] ease-[var(--ease-out-expo)] starting:[translate:0_14px] starting:opacity-40 motion-reduce:starting:[translate:0_0]"
              : undefined
          }
          style={intro ? { transitionDelay: `${Math.min(index, 6) * 40}ms` } : undefined}
        >
          <DesignCard design={design} priority={index < 4} />
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Sin resultados: la Kitty se asoma desde atrás del borde, buscando. */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <AmbientZone className="bg-surface ring-line mx-auto mt-2 max-w-md rounded-xl px-6 pt-8 pb-8 text-center ring-1">
      <div aria-hidden className="relative mx-auto h-[84px] w-40 overflow-hidden">
        <span
          data-ambient="move"
          className="animate-peek-idle absolute inset-x-0 bottom-0 mx-auto block w-[96px]"
        >
          <Image src="/brand/kitty.webp" alt="" width={96} height={113} className="block h-auto w-full" />
        </span>
      </div>
      <div aria-hidden className="bg-sand/50 mx-auto h-px w-48" />
      <h3 className="font-display text-h3 text-ink mt-6 text-balance">Kitty no encontró nada así</h3>
      <p className="text-ink-soft mt-2">Probá sacando un filtro o armalo a tu gusto.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" size="sm" onClick={onClear}>
          Limpiar filtros
        </Button>
        <Button size="sm" href="/disena">
          Diseñá tu set
        </Button>
      </div>
    </AmbientZone>
  );
}
