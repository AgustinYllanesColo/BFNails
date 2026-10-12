"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CartItem, Design, Shape } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { useHydrated } from "@/lib/hooks";
import { EASE } from "@/lib/motion";
import { MAX_QTY, useCart } from "@/lib/store/cart";
import { toast, truncateName } from "@/lib/store/toast";
import { cn, formatARS } from "@/lib/format";
import { customLabels, itemName, shortSizes } from "@/lib/whatsapp";
import { FINGERS } from "@/lib/data/sizes";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { Price } from "@/components/ui/Price";
import { NailSwatch } from "@/components/ui/NailSwatch";
import { PrinterHead } from "@/components/ui/ticket";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { AmbientZone } from "@/components/motion/AmbientZone";
import { Receipt, type ReceiptLine } from "@/components/ui/Receipt";
import { EmptyCart } from "@/components/cart/EmptyCart";

/**
 * La bolsita (PLAN W2-E.2). Lista de sets a la izquierda (miniatura 4:5, nombre, talle, precio y el contador de
 * unidades) y el ticket a la derecha (en el celular, debajo), con "Ir a pagar" en línea y en una barra bordó que
 * acompaña al pulgar mientras el botón no se ve. Quitar un set lo saca con un deslizamiento corto y deja "Deshacer"
 * en un toast. Sin sets: la impresora en espera (`EmptyCart`); al quitar el último, el ticket se arranca.
 */

type Props = {
  /** Tres sets del catálogo para la bolsita vacía (la página llama a `getFeaturedDesigns(3)`). */
  suggestions?: Design[];
  /** Configuración vigente del armador: etiquetas y colores de los sets a medida. */
  config: BuilderConfig;
};

export function CartView({ suggestions = [], config }: Props) {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  if (!hydrated) return <CartSkeleton />;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {items.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0, transform: "translateY(12px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.3, ease: EASE.ui }}
        >
          <EmptyCart suggestions={suggestions} />
        </motion.div>
      ) : (
        <motion.div
          key="filled"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.15 } }}
          transition={{ duration: 0.24, ease: EASE.ui }}
        >
          <FilledCart items={items} config={config} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------------------------------------------------------------------------------------- */

function FilledCart({ items, config }: { items: CartItem[]; config: BuilderConfig }) {
  const ctaRef = useRef<HTMLDivElement>(null);
  const [printedAt] = useState(() =>
    new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  );
  const subtotal = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
  const sets = items.reduce((a, i) => a + i.qty, 0);
  const needsConfirmation = items.some((i) => i.kind === "custom" && i.quote.needsConfirmation);

  const lines: ReceiptLine[] = [
    ...items.map<ReceiptLine>((i) => ({
      kind: "row",
      id: i.id,
      label: `${itemName(i)} ×${i.qty}`,
      value: formatARS(i.unitPrice * i.qty),
      sub: ticketSize(i),
    })),
    { kind: "rule", id: "r1" },
    { kind: "row", id: "envio", label: "envío", value: "se calcula después", tone: "muted" },
    { kind: "row", id: "total", label: needsConfirmation ? "Desde" : "Total", value: formatARS(subtotal) },
  ];
  const footer: ReceiptLine[] = [
    { kind: "row", id: "sets", label: "sets", value: String(sets) },
    { kind: "row", id: "kit", label: "cada set", value: "10 uñas + pegamento + lima", tone: "muted" },
    ...(needsConfirmation
      ? [{ kind: "text", id: "conf", text: "* bren confirma el precio final" } as ReceiptLine]
      : []),
    { kind: "text", id: "thanks", text: "* gracias por elegir bf studio *", align: "center" },
  ];

  return (
    <div className="grid grid-cols-1 gap-12 pb-28 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16 lg:pb-0">
      <section aria-labelledby="bolsita-lista" className="min-w-0 lg:max-w-[640px]">
        <h2 id="bolsita-lista" className="text-ink-soft text-sm font-semibold">
          {sets} {sets === 1 ? "set" : "sets"} en tu bolsita
        </h2>
        <ul className="mt-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((item, index) => (
              <CartLine key={item.id} item={item} index={index} config={config} />
            ))}
          </AnimatePresence>
        </ul>
      </section>

      <motion.aside
        aria-label="Resumen"
        className="h-fit min-w-0 lg:sticky lg:top-[calc(var(--nav-h)+32px)]"
        exit={{ opacity: 0, transform: "translateY(40px) rotate(4deg)", transition: { duration: 0.35, ease: EASE.move } }}
      >
        <Receipt
          title="BF Studio · tu bolsita"
          meta={printedAt}
          lines={lines}
          footer={footer}
          className="mx-auto max-w-[400px]"
        />
        <div ref={ctaRef} className="mx-auto mt-8 grid max-w-[400px] gap-2">
          <Button href="/checkout" size="lg" iconRight="arrow" className="w-full" data-cursor="pagar">
            Ir a pagar
          </Button>
          <Button href="/catalogo" variant="ghost" className="w-full">
            Seguir eligiendo
          </Button>
        </div>
      </motion.aside>

      <StickyActionBar watchRef={ctaRef} mode="outside" variant="bordo" label="Ir a pagar">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-on-bordo-muted text-meta">{needsConfirmation ? "Desde" : "Total"}</p>
          <Price value={subtotal} size="md" className="text-cream" />
        </div>
        <Button href="/checkout" variant="inverse" size="md" className="px-5">
          Ir a pagar
        </Button>
      </StickyActionBar>
    </div>
  );
}

/** Talle para el ticket, en minúscula de ticket pero con la letra del talle tal cual ("talle S"). */
function ticketSize(item: CartItem): string {
  if (item.sizes.mode === "standard") return `talle ${item.sizes.size}`;
  if (item.sizes.mode === "custom") return "a medida · 10 medidas";
  return "talle por whatsapp";
}

/* ---------------------------------------------------------------------------------------------- */

function CartLine({ item, index, config }: { item: CartItem; index: number; config: BuilderConfig }) {
  const remove = useCart((s) => s.remove);
  const restore = useCart((s) => s.restore);
  const setQty = useCart((s) => s.setQty);
  const name = itemName(item);
  const lineTotal = item.unitPrice * item.qty;
  const quote = item.kind === "custom" && item.quote.needsConfirmation;
  // los sets del armador no tienen página propia (el armador guarda solo el último diseño)
  const href = item.kind === "design" ? `/catalogo/${item.designSlug}` : null;

  const onRemove = () => {
    remove(item.id);
    toast.show({
      message: `Quitaste ${truncateName(name)}`,
      icon: "trash",
      action: { label: "Deshacer", onClick: () => restore(item, index) },
    });
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, transform: "translateY(8px)" }}
      animate={{ opacity: 1, transform: "translateX(0px)" }}
      exit={{ opacity: 0, transform: "translateX(-16px)", transition: { duration: 0.18, ease: EASE.ui } }}
      transition={{ layout: { type: "spring", duration: 0.35, bounce: 0.1 }, default: { duration: 0.24, ease: EASE.ui } }}
      className="border-line flex gap-4 border-t py-5 first:border-t-0 sm:gap-5"
      data-cart-line=""
    >
      {href ? (
        <Link href={href} tabIndex={-1} aria-hidden className="block shrink-0 rounded-md">
          <Thumb item={item} config={config} />
        </Link>
      ) : (
        <div className="shrink-0">
          <Thumb item={item} config={config} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-title text-ink line-clamp-2 [overflow-wrap:anywhere]">
          {href ? (
            <Link href={href} className="hover:text-bordo rounded-xs transition-colors duration-150">
              {name}
            </Link>
          ) : (
            name
          )}
        </h3>
        <p className="text-meta text-ink-soft mt-0.5">{shortSizes(item.sizes)}</p>
        {item.kind === "custom" ? <CustomDetails item={item} config={config} /> : null}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          {quote ? <span className="text-meta text-ink-soft">desde</span> : null}
          <Price value={lineTotal} size="md" className="text-bordo" />
          {item.qty > 1 ? <span className="text-meta text-ink-soft tabular">{formatARS(item.unitPrice)} c/u</span> : null}
        </div>

        <div className="mt-auto pt-3">
          <Stepper
            name={name}
            qty={item.qty}
            onLess={() => (item.qty === 1 ? onRemove() : setQty(item.id, item.qty - 1))}
            onMore={() => setQty(item.id, item.qty + 1)}
          />
        </div>
      </div>
    </motion.li>
  );
}

function Stepper({ name, qty, onLess, onMore }: { name: string; qty: number; onLess: () => void; onMore: () => void }) {
  const single = qty === 1;
  const btn =
    "text-bordo grid size-11 place-items-center rounded-full transition-[background-color,scale,color] duration-100 ease-[var(--ease-ui)] active:scale-90 [@media(hover:hover)]:hover:bg-cream-ink/70 disabled:text-ink-faint disabled:active:scale-100";
  return (
    <div className="bg-cream-deep inline-flex items-center rounded-full p-0.5" role="group" aria-label={`Unidades de ${name}`}>
      <button type="button" onClick={onLess} className={btn} aria-label={single ? `Quitar ${name}` : `Menos unidades de ${name}`}>
        {/* minus ↔ tacho: cruce corto en la misma celda */}
        <span className="grid">
          <Icon
            name="minus"
            size={18}
            className={cn("transition-[opacity,scale] duration-150 [grid-area:1/1]", single ? "scale-75 opacity-0" : "opacity-100")}
          />
          <Icon
            name="trash"
            size={18}
            className={cn("transition-[opacity,scale] duration-150 [grid-area:1/1]", single ? "opacity-100" : "scale-75 opacity-0")}
          />
        </span>
      </button>
      <span className="relative inline-block h-6 w-7 overflow-hidden text-center text-[15px] leading-6 font-semibold">
        <span className="sr-only" aria-live="polite">
          {qty} {qty === 1 ? "unidad" : "unidades"}
        </span>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={qty}
            aria-hidden
            initial={{ transform: "translateY(14px)", opacity: 0 }}
            animate={{ transform: "translateY(0px)", opacity: 1 }}
            exit={{ transform: "translateY(-14px)", opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="tabular absolute inset-0"
          >
            {qty}
          </motion.span>
        </AnimatePresence>
      </span>
      <button type="button" onClick={onMore} disabled={qty >= MAX_QTY} className={btn} aria-label={`Más unidades de ${name}`}>
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

const WHITE_TIP = "#fbf8f1";

/** Miniatura 4:5: la foto del set; los sets a medida y los placeholders viejos (cuadrados) dibujan su abanico. */
function Thumb({ item, config }: { item: CartItem; config: BuilderConfig }) {
  const box = "bg-cream-deep relative grid aspect-[4/5] w-24 place-items-center overflow-hidden rounded-md sm:w-28";
  if (item.kind === "custom") {
    const s = item.selection;
    const hex = (id?: string) => config.bases.find((b) => b.id === id)?.hex;
    const tip = s.extras.includes("francesita-color") ? hex(s.tipColor ?? "bordo") : s.extras.includes("francesita") ? WHITE_TIP : undefined;
    return (
      <div className={box}>
        <NailSwatch shape={s.shape} base={s.extras.includes("animal-print") ? "animal-print" : (hex(s.base) ?? "#e8c4b0")} tip={tip} finish={s.finish} size={80} className="drop-shadow-[0_6px_8px_rgb(74_14_14/0.14)]" />
      </div>
    );
  }
  const legacy = !item.image || (item.image.startsWith("/api/placeholder") && !/[?&]v=\d/.test(item.image));
  if (legacy) {
    const params = new URLSearchParams(item.image?.split("?")[1] ?? "");
    const shape = (params.get("shape") as Shape | null) ?? "almendra";
    const [first = "e8c4b0"] = (params.get("colors") ?? "").split(",").filter(Boolean);
    return (
      <div className={cn(box, "bg-[radial-gradient(circle_at_28%_18%,var(--cream-50)_0%,var(--cream-200)_60%,var(--cream-300)_100%)]")}>
        <NailSwatch shape={shape} base={`#${first}`} size={80} className="drop-shadow-[0_6px_8px_rgb(74_14_14/0.14)]" />
      </div>
    );
  }
  return (
    <div className={box}>
      <Image src={item.image!} alt="" fill sizes="112px" className="object-cover" />
    </div>
  );
}

/** Sets a medida: etiquetas legibles, medidas en un desplegable (2 manos × 5 uñas) y la nota para Bren. */
function CustomDetails({ item, config }: { item: Extract<CartItem, { kind: "custom" }>; config: BuilderConfig }) {
  const s = item.selection;
  const mm = item.sizes.mode === "custom" ? item.sizes.mm : null;
  return (
    <div className="mt-1.5 min-w-0 space-y-1.5">
      <p className="text-meta text-ink [overflow-wrap:anywhere]">{customLabels(s, config).join(" · ")}</p>
      {mm ? (
        <details className="group/mm text-meta">
          <summary className="text-bordo -my-2 inline-flex min-h-11 cursor-pointer list-none items-center gap-1 font-semibold [&::-webkit-details-marker]:hidden">
            Ver medidas
            <Icon name="chevron" size={16} className="transition-transform duration-200 ease-[var(--ease-ui)] group-open/mm:rotate-180" />
          </summary>
          <table className="tabular mt-1 w-full max-w-[240px] text-left text-[14px]">
            <caption className="sr-only">Medidas de cada uña en milímetros</caption>
            <thead>
              <tr className="text-ink-soft text-meta">
                <th scope="col" className="py-0.5 font-medium">
                  <span className="sr-only">Uña</span>
                </th>
                <th scope="col" className="py-0.5 text-right font-medium">Der.</th>
                <th scope="col" className="py-0.5 text-right font-medium">Izq.</th>
              </tr>
            </thead>
            <tbody>
              {FINGERS.map((finger, f) => (
                <tr key={finger} className="border-line border-t first:border-t-0">
                  <th scope="row" className="text-ink-soft py-1 font-normal">
                    {finger}
                  </th>
                  <td className="text-ink py-1 text-right">{(mm[f] ?? 0).toLocaleString("es-AR")}</td>
                  <td className="text-ink py-1 text-right">{(mm[5 + f] ?? 0).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
      {s.notes ? <p className="text-meta text-ink-soft italic [overflow-wrap:anywhere]">“{s.notes}”</p> : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------- */

/** Antes de hidratar (la bolsita vive en el navegador): la misma forma que el resultado, sin contenido. */
function CartSkeleton() {
  const bar =
    "rounded-xs bg-[linear-gradient(90deg,var(--cream-200)_0%,var(--cream-100)_50%,var(--cream-200)_100%)] bg-[length:200%_100%] animate-[shimmer_1.6s_linear_infinite]";
  return (
    <AmbientZone aria-hidden className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
      <div className="min-w-0 lg:max-w-[640px]">
        <div data-ambient="move" className={cn(bar, "h-4 w-28")} />
        {[0, 1].map((i) => (
          <div key={i} className="border-line flex gap-4 border-t py-5 first:border-t-0 sm:gap-5">
            <div data-ambient="move" className={cn(bar, "aspect-[4/5] w-24 rounded-md sm:w-28")} />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div data-ambient="move" className={cn(bar, "h-5 w-3/5")} />
              <div data-ambient="move" className={cn(bar, "h-3.5 w-16")} />
              <div data-ambient="move" className={cn(bar, "mt-1 h-5 w-20")} />
              <div data-ambient="move" className={cn(bar, "mt-auto h-12 w-36 rounded-full")} />
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto w-full max-w-[400px]">
        <PrinterHead status="waiting" label="cargando tu bolsita" />
      </div>
    </AmbientZone>
  );
}
