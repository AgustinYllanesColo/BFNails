"use client";

import Image from "next/image";
import { useHydrated } from "@/lib/hooks";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/lib/store/cart";
import { formatARS } from "@/lib/format";
import { describeSizes } from "@/lib/whatsapp";
import { Button } from "@/components/ui/Button";
import type { CartItem } from "@/lib/types";

export function CartView() {
  const { items, remove, setQty } = useCart();
  const mounted = useHydrated();
  if (!mounted) return <div className="h-40" />;

  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const needsConfirmation = items.some((i) => i.kind === "custom" && i.quote.needsConfirmation);

  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-cream-deep p-12 text-center">
        <p className="font-display text-3xl">Todavía no hay nada acá</p>
        <p className="mt-2 text-ink-soft">Elegí un set del catálogo o armá el tuyo.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/catalogo">Ver catálogo</Button>
          <Button href="/disena" variant="secondary">
            Diseñá tu set
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="flex gap-4 rounded-lg bg-white/70 p-4 ring-1 ring-bordo/10"
            >
              <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-cream-deep">
                {item.kind === "design" && item.image ? (
                  <Image src={item.image} alt="" fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center font-display text-3xl text-bordo">✦</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl leading-tight">{item.name}</p>
                    <p className="text-xs text-ink-soft">{describeSizes(item.sizes)}</p>
                    <ItemDetails item={item} />
                  </div>
                  <button type="button" onClick={() => remove(item.id)} className="text-xs font-semibold text-ink-soft hover:text-red" aria-label={`Quitar ${item.name}`}>
                    Quitar
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-pill bg-cream-deep">
                    <button type="button" onClick={() => setQty(item.id, item.qty - 1)} className="size-9 font-bold" aria-label="Menos">
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                    <button type="button" onClick={() => setQty(item.id, item.qty + 1)} className="size-9 font-bold" aria-label="Más">
                      +
                    </button>
                  </div>
                  <p className="font-bold text-bordo">
                    {item.kind === "custom" && item.quote.needsConfirmation ? "Desde " : ""}
                    {formatARS(item.unitPrice * item.qty)}
                  </p>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <aside className="h-fit rounded-lg bg-white/80 p-5 ring-1 ring-bordo/10 lg:sticky lg:top-28">
        <div className="flex justify-between text-sm">
          <span className="text-ink-soft">Subtotal</span>
          <span className="font-semibold">{formatARS(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-soft">Envío</span>
          <span className="text-ink-soft">se calcula al pagar</span>
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-bordo/10 pt-4">
          <span className="font-semibold">{needsConfirmation ? "Desde" : "Total"}</span>
          <span className="font-display text-3xl text-bordo">{formatARS(subtotal)}</span>
        </div>
        {needsConfirmation && (
          <p className="mt-2 text-xs text-ink-soft">Tenés un set con notas: Bren confirma el precio final por WhatsApp.</p>
        )}
        <Button href="/checkout" size="lg" className="mt-5 w-full">
          Ir a pagar
        </Button>
        <Button href="/catalogo" variant="ghost" className="mt-2 w-full">
          Seguir eligiendo
        </Button>
      </aside>
    </div>
  );
}

function ItemDetails({ item }: { item: CartItem }) {
  if (item.kind !== "custom") return null;
  const s = item.selection;
  return (
    <p className="mt-1 text-xs text-ink-soft">
      {[s.shape, s.length, s.finish, `base ${s.base}`, ...s.extras].join(" · ")}
      {s.notes ? ` · nota: "${s.notes}"` : ""}
    </p>
  );
}
