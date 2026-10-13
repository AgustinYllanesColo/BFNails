"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Design, Length, Shape } from "@/lib/types";
import { LENGTH_LABEL, SHAPE_LABEL } from "@/lib/data/catalog";
import { DesignCard } from "./DesignCard";
import { Chip } from "@/components/ui/Chip";

type Sort = "destacados" | "precio-asc" | "precio-desc" | "nombre";

export function CatalogGrid({ designs }: { designs: Design[] }) {
  const [shape, setShape] = useState<Shape | null>(null);
  const [length, setLength] = useState<Length | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("destacados");

  const tags = useMemo(() => {
    const count = new Map<string, number>();
    designs.forEach((d) => d.tags.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 10);
  }, [designs]);

  const filtered = useMemo(() => {
    let list = designs.filter(
      (d) => (!shape || d.shape === shape) && (!length || d.length === length) && (!tag || d.tags.includes(tag)),
    );
    switch (sort) {
      case "precio-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "precio-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "nombre":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        list = [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    }
    return list;
  }, [designs, shape, length, tag, sort]);

  const anyFilter = shape || length || tag;

  return (
    <div>
      <div className="sticky top-[72px] z-30 -mx-4 mb-8 space-y-3 bg-cream/90 px-4 py-3 backdrop-blur-md md:top-[84px]">
        <div className="flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs font-bold tracking-wider text-ink-soft uppercase">Forma</span>
          {(Object.keys(SHAPE_LABEL) as Shape[]).map((s) => (
            <Chip key={s} selected={shape === s} onClick={() => setShape(shape === s ? null : s)}>
              {SHAPE_LABEL[s]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs font-bold tracking-wider text-ink-soft uppercase">Largo</span>
          {(Object.keys(LENGTH_LABEL) as Length[]).map((l) => (
            <Chip key={l} selected={length === l} onClick={() => setLength(length === l ? null : l)}>
              {LENGTH_LABEL[l]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 self-center text-xs font-bold tracking-wider text-ink-soft uppercase">Estilo</span>
          {tags.map((t) => (
            <Chip key={t} selected={tag === t} onClick={() => setTag(tag === t ? null : t)} className="capitalize">
              {t}
            </Chip>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {anyFilter && (
              <button
                type="button"
                onClick={() => {
                  setShape(null);
                  setLength(null);
                  setTag(null);
                }}
                className="text-xs font-semibold text-bordo underline underline-offset-4"
              >
                Limpiar
              </button>
            )}
            {/* select nativo con apariencia propia: chip crema con chevron bordó, el menú lo dibuja el sistema */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-10 cursor-pointer appearance-none rounded-pill bg-cream-deep bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234a0e0e%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[position:right_14px_center] bg-no-repeat py-0 pr-9 pl-4 text-sm font-semibold text-bordo ring-1 ring-bordo/10 transition-colors hover:bg-cream-ink/60 focus-visible:ring-2 focus-visible:ring-bordo/40 focus-visible:outline-none"
              aria-label="Ordenar"
            >
              <option value="destacados">Destacados</option>
              <option value="precio-asc">Menor precio</option>
              <option value="precio-desc">Mayor precio</option>
              <option value="nombre">Nombre</option>
            </select>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-ink-soft">
        {filtered.length} {filtered.length === 1 ? "diseño" : "diseños"}
      </p>

      <motion.div layout className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((d, i) => (
            <motion.div
              key={d.slug}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: Math.min(i * 0.03, 0.3) }}
            >
              <DesignCard design={d} priority={i < 4} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="rounded-lg bg-cream-deep p-10 text-center">
          <p className="font-display text-2xl">Nada con esos filtros</p>
          <p className="mt-2 text-ink-soft">Probá sacando alguno, o armá el tuyo en Diseñá tu set.</p>
        </div>
      )}
    </div>
  );
}
