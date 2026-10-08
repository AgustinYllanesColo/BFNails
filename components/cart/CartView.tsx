"use client";

import Image from "next/image";
import { useHydrated } from "@/lib/hooks";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/lib/store/cart";
import { formatARS } from "@/lib/format";
import { describeSizes } from "@/lib/whatsapp";
import { Button } from "@/components/ui/Button";
import type { CartItem } from "@/lib/types";
import { Receipt, type ReceiptLine } from "@/components/ui/Receipt";

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
                    <button type="button" onClick={() => setQty(item.id, item.qty - 1)} className="size-9 font-bold transition-transform active:scale-75" aria-label="Menos">
                      −
                    </button>
                    <span className="relative inline-block h-5 w-6 overflow-hidden text-center text-sm font-semibold">
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.span key={item.qty} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="absolute inset-0">
                          {item.qty}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <button type="button" onClick={() => setQty(item.id, item.qty + 1)} className="size-9 font-bold transition-transform active:scale-75" aria-label="Más">
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

      <aside className="h-fit lg:sticky lg:top-28">
        <Receipt
          title="BF Studio · tu carrito"
          meta={new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          lines={[
            ...items.map<ReceiptLine>((i) => ({ kind: "row", id: i.id, label: `${i.name} ×${i.qty}`, value: formatARS(i.unitPrice * i.qty) })),
            { kind: "rule", id: "r1" },
            { kind: "row", id: "sub", label: "subtotal", value: formatARS(subtotal) },
            { kind: "row", id: "envio", label: "envío", value: "al pagar", tone: "muted" },
            { kind: "row", id: "total", label: needsConfirmation ? "DESDE" : "TOTAL", value: formatARS(subtotal), tone: "bold" },
          ]}
          footer={[
            { kind: "row", id: "items", label: "sets", value: String(items.reduce((a, i) => a + i.qty, 0)) },
            { kind: "row", id: "kit", label: "incluye", value: "10 uñas + pegamento + lima" },
            ...(needsConfirmation ? [{ kind: "text", id: "conf", text: "* precio final a confirmar por WhatsApp", align: "left" } as ReceiptLine] : []),
            { kind: "text", id: "thanks", text: "✦ gracias por elegir bf studio ✦", align: "center" },
          ]}
        />
        <Button href="/checkout" size="lg" className="mt-6 w-full">
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
