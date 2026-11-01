"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MAKEUP_CATEGORIES, makeupInStock, type MakeupCategory, type MakeupProduct } from "@/lib/data/makeup";
import { Chip } from "@/components/ui/Chip";
import { MakeupCard, makeupTilt } from "./MakeupCard";

/**
 * Grilla del maquillaje con filtro por categoría. La categoría vive en la URL (?cat=labios): se puede compartir
 * y el "atrás" del navegador no la pierde. Se cambia con history.replaceState, que Next sincroniza con useSearchParams.
 */
export function MakeupGrid({ products }: { products: MakeupProduct[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const present = useMemo(
    () =>
      MAKEUP_CATEGORIES.map((c) => ({ ...c, count: products.filter((p) => p.category === c.id).length })).filter(
        (c) => c.count > 0,
      ),
    [products],
  );
  const raw = params.get("cat");
  const cat = present.some((c) => c.id === raw) ? (raw as MakeupCategory) : null;

  const setCat = (next: MakeupCategory | null) => {
    const q = new URLSearchParams(params.toString());
    if (next) q.set("cat", next);
    else q.delete("cat");
    const s = q.toString();
    window.history.replaceState(null, "", s ? `${pathname}?${s}` : pathname);
  };

  // Los que hay primero; los agotados quedan al final de su categoría.
  const visible = useMemo(() => {
    const list = cat ? products.filter((p) => p.category === cat) : products;
    return [...list].sort((a, b) => Number(makeupInStock(b)) - Number(makeupInStock(a)));
  }, [products, cat]);

  return (
    <div>
      {present.length > 1 && (
        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:mb-6 sm:flex-wrap sm:overflow-visible" role="group" aria-label="Filtrar por categoría">
          <Chip selected={cat === null} onClick={() => setCat(null)} hint={String(products.length)} className="shrink-0">
            Todo
          </Chip>
          {present.map((c) => (
            <Chip
              key={c.id}
              selected={cat === c.id}
              onClick={() => setCat(cat === c.id ? null : c.id)}
              hint={String(c.count)}
              className="shrink-0"
            >
              {c.label}
            </Chip>
          ))}
        </div>
      )}

      <p className="text-ink-soft mb-4 text-sm tabular-nums" aria-live="polite">
        {visible.length} {visible.length === 1 ? "producto" : "productos"}
      </p>

      <motion.ul layout={!reduce} className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
        {/* initial={false}: al cargar llegan visibles; solo se animan al filtrar */}
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((p, i) => (
            <motion.li
              key={p.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1], delay: reduce ? 0 : Math.min(i * 0.025, 0.2) }}
            >
              <MakeupCard product={p} priority={i < 4} tilt={makeupTilt(p.id)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      {visible.length === 0 && (
        <div className="bg-blush-soft rounded-lg p-10 text-center">
          <p className="font-title text-2xl">Todavía no hay productos cargados</p>
          <p className="text-ink-soft mt-2">Estoy sumando cosas nuevas. Volvé en unos días.</p>
        </div>
      )}
    </div>
  );
}
