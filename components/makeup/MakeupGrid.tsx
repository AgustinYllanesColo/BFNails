"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MAKEUP_CATEGORIES, makeupInStock, type MakeupCategory, type MakeupProduct } from "@/lib/data/makeup";
import { Chip } from "@/components/ui/Chip";
import { MakeupCard, makeupTilt } from "./MakeupCard";

/** Chips del filtro: 44 px de alto para el dedo, foco visible (el Chip base no trae) y sin quedar bajo la barra. */
const CHIP = "min-h-11 shrink-0 scroll-mx-4 scroll-mt-28 focus-visible:outline-bordo focus-visible:outline-2 focus-visible:outline-offset-2";

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
  const catLabel = present.find((c) => c.id === cat)?.label;

  // Elegir un filtro a mano descarta el #ancla de producto; el reset por ancla (abajo) la conserva.
  const setCat = (next: MakeupCategory | null, keepHash = false) => {
    const q = new URLSearchParams(window.location.search);
    if (next) q.set("cat", next);
    else q.delete("cat");
    const s = q.toString();
    window.history.replaceState(null, "", `${pathname}${s ? `?${s}` : ""}${keepHash ? window.location.hash : ""}`);
  };

  // Link a un producto (/maquillaje?cat=ojos#labial-x) que el filtro activo esconde: se vuelve a "Todo" y, cuando ya
  // está en la grilla, se baja hasta él. Solo al llegar y con cada cambio de #, no al tocar los chips.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const hit = id ? products.find((p) => p.id === id) : undefined;
      const current = new URLSearchParams(window.location.search).get("cat");
      if (!hit || !current || hit.category === current) return;
      pending.current = id;
      setCat(null, true);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setCat solo escribe la URL
  }, [products]);
  useEffect(() => {
    if (cat !== null || !pending.current) return;
    document.getElementById(pending.current)?.scrollIntoView({ block: "start" });
    pending.current = null;
  }, [cat]);

  // Los que hay primero; los agotados quedan al final de su categoría.
  const visible = useMemo(() => {
    const list = cat ? products.filter((p) => p.category === cat) : products;
    return [...list].sort((a, b) => Number(makeupInStock(b)) - Number(makeupInStock(a)));
  }, [products, cat]);

  return (
    <div>
      {present.length > 1 && (
        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pt-1.5 pb-3 [scrollbar-width:none] sm:mb-6 sm:flex-wrap sm:overflow-visible" role="group" aria-label="Filtrar por categoría">
          <Chip selected={cat === null} onClick={() => setCat(null)} hint={String(products.length)} className={CHIP}>
            Todo
          </Chip>
          {present.map((c) => (
            <Chip
              key={c.id}
              selected={cat === c.id}
              onClick={() => setCat(cat === c.id ? null : c.id)}
              hint={String(c.count)}
              className={CHIP}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      )}

      <p className="text-ink-soft mb-4 text-sm tabular-nums" role="status">
        {visible.length} {visible.length === 1 ? "producto" : "productos"}
        {catLabel && <span className="sr-only"> en {catLabel}</span>}
      </p>

      <ul className="relative grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
        {/* initial={false}: al cargar llegan visibles; solo se animan al filtrar */}
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((p, i) => (
            <motion.li
              key={p.id}
              layout={!reduce}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              // escalonado corto y con tope (≤ 100 ms): con 27 tarjetas, un retardo largo hace sentir lento el filtro
              transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1], delay: reduce ? 0 : Math.min(i * 0.02, 0.1) }}
            >
              <MakeupCard product={p} priority={i < 4} tilt={makeupTilt(p.id)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {visible.length === 0 && (
        <div className="bg-blush-soft rounded-lg p-10 text-center">
          <p className="font-title text-2xl">Todavía no hay productos cargados</p>
          <p className="text-ink-soft mt-2">Estoy sumando cosas nuevas. Volvé en unos días.</p>
        </div>
      )}
    </div>
  );
}
