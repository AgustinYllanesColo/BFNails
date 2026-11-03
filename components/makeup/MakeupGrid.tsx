"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MAKEUP_CATEGORIES, makeupInStock, type MakeupCategory, type MakeupProduct } from "@/lib/data/makeup";
import { Chip } from "@/components/ui/Chip";
import { slugify } from "@/lib/format";
import { MakeupCard, makeupTilt } from "./MakeupCard";

/** Chips del filtro: 44 px de alto para el dedo, foco visible (el Chip base no trae) y sin quedar bajo la barra. */
const CHIP = "min-h-11 shrink-0 scroll-mx-4 scroll-mt-28 focus-visible:outline-bordo focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * Grilla del maquillaje con filtro por categoría y por marca. Los dos viven en la URL (?cat=labios&marca=pink21): se
 * pueden compartir, se combinan y el "atrás" del navegador no los pierde. Se cambia con history.replaceState, que Next sincroniza con useSearchParams.
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

  // Marcas cargadas (sin repetir por mayúsculas), con cuántos productos tiene cada una en la categoría elegida.
  const brands = useMemo(() => {
    const map = new Map<string, { slug: string; label: string; all: number; inCat: number }>();
    for (const p of products) {
      const label = p.brand?.trim();
      if (!label) continue;
      const slug = slugify(label);
      const b = map.get(slug) ?? { slug, label, all: 0, inCat: 0 };
      b.all++;
      if (!cat || p.category === cat) b.inCat++;
      map.set(slug, b);
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [products, cat]);
  const rawBrand = params.get("marca");
  const brand = brands.find((b) => b.slug === rawBrand) ?? null;

  // Elegir un filtro a mano descarta el #ancla de producto; el reset por ancla (abajo) la conserva.
  const setParam = (key: "cat" | "marca", next: string | null, keepHash = false) => {
    const q = new URLSearchParams(window.location.search);
    if (next) q.set(key, next);
    else q.delete(key);
    const s = q.toString();
    window.history.replaceState(null, "", `${pathname}${s ? `?${s}` : ""}${keepHash ? window.location.hash : ""}`);
  };
  const setCat = (next: MakeupCategory | null, keepHash = false) => setParam("cat", next, keepHash);
  const setBrand = (next: string | null) => setParam("marca", next);

  // Link a un producto (/maquillaje?cat=ojos#labial-x) que el filtro activo esconde: se vuelve a "Todo" y, cuando ya
  // está en la grilla, se baja hasta él. Solo al llegar y con cada cambio de #, no al tocar los chips.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const hit = id ? products.find((p) => p.id === id) : undefined;
      const q = new URLSearchParams(window.location.search);
      const current = q.get("cat");
      const marca = q.get("marca");
      const hiddenByCat = current && hit && hit.category !== current;
      const hiddenByBrand = marca && hit && slugify(hit.brand ?? "") !== marca;
      if (!hit || (!hiddenByCat && !hiddenByBrand)) return;
      pending.current = id;
      // se sacan los dos filtros de una (el que no lo esconde también: así no queda una grilla rara)
      q.delete("cat");
      q.delete("marca");
      const s = q.toString();
      window.history.replaceState(null, "", `${pathname}${s ? `?${s}` : ""}${window.location.hash}`);
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setCat solo escribe la URL
  }, [products]);
  useEffect(() => {
    if (cat !== null || brand !== null || !pending.current) return;
    document.getElementById(pending.current)?.scrollIntoView({ block: "start" });
    pending.current = null;
  }, [cat, brand]);

  // Los que hay primero; los agotados quedan al final de su categoría.
  const visible = useMemo(() => {
    const list = products.filter((p) => (!cat || p.category === cat) && (!brand || slugify(p.brand ?? "") === brand.slug));
    return [...list].sort((a, b) => Number(makeupInStock(b)) - Number(makeupInStock(a)));
  }, [products, cat, brand]);
  // marcas con algo en la categoría elegida (la elegida queda siempre, para poder sacarla)
  const brandChips = brands.filter((b) => b.inCat > 0 || b.slug === brand?.slug);

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

      {brands.length > 1 && (
        <div className="-mt-2 mb-5 sm:-mt-3 sm:mb-6">
          <p className="text-ink-soft mb-1.5 text-xs font-bold tracking-wider uppercase">Marca</p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pt-1.5 pb-3 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible" role="group" aria-label="Filtrar por marca">
            <Chip selected={brand === null} onClick={() => setBrand(null)} className={CHIP}>
              Todas
            </Chip>
            {brandChips.map((b) => (
              <Chip
                key={b.slug}
                selected={brand?.slug === b.slug}
                onClick={() => setBrand(brand?.slug === b.slug ? null : b.slug)}
                hint={String(b.inCat)}
                className={CHIP}
              >
                {b.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <p className="text-ink-soft mb-4 text-sm tabular-nums" role="status">
        {visible.length} {visible.length === 1 ? "producto" : "productos"}
        {catLabel && <span className="sr-only"> en {catLabel}</span>}
        {brand && <span className="sr-only"> de {brand.label}</span>}
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
          {brand ? (
            <>
              <p className="font-title text-2xl">No hay productos de {brand.label} acá</p>
              <button type="button" onClick={() => setBrand(null)} className="text-lip mt-2 font-semibold underline underline-offset-4">
                Ver todas las marcas
              </button>
            </>
          ) : (
            <>
              <p className="font-title text-2xl">Todavía no hay productos cargados</p>
              <p className="text-ink-soft mt-2">Estoy sumando cosas nuevas. Volvé en unos días.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
