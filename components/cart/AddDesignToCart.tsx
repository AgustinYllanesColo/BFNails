"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { Design, Length, Shape, SizeSelection } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { designVariantPrice } from "@/lib/pricing";
import { useCart } from "@/lib/store/cart";
import { designImage, LENGTH_LABEL, LENGTH_MEASURE_HINT, lengthWithCm, SHAPE_LABEL } from "@/lib/data/catalog";
import { formatARS } from "@/lib/format";
import { SizePicker, sizesAreValid } from "./SizePicker";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { flyToCart } from "@/components/motion/flyToCart";

/**
 * Compra de un set del catálogo. El diseño viene con una forma y un largo, pero la clienta puede
 * pedirlo en otra forma u otro largo: el precio se recalcula en vivo con los mismos deltas del armador.
 */
export function AddDesignToCart({ design, config }: { design: Design; config: BuilderConfig }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [shape, setShape] = useState<Shape>(design.shape);
  const [length, setLength] = useState<Length>(design.length);
  const [sizes, setSizes] = useState<SizeSelection>({ mode: "standard", size: "S" });
  const [added, setAdded] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const valid = sizesAreValid(sizes);
  const price = useMemo(
    () => designVariantPrice(design, shape, length, config),
    [design, shape, length, config],
  );
  const isOriginal = shape === design.shape && length === design.length;

  const shapes = config.shapes.filter((s) => s.id !== "ovalada");
  const hint = <T extends string>(list: { id: T; delta: number }[], id: T, base: T) => {
    const d = (x: T) => list.find((o) => o.id === x)?.delta ?? 0;
    const diff = d(id) - d(base);
    return diff > 0 ? `+${formatARS(diff)}` : undefined;
  };

  const onAdd = (fly = true) => {
    if (fly) flyToCart(btn.current, designImage(design, 0));
    add({
      kind: "design",
      designSlug: design.slug,
      name: design.name,
      image: designImage(design, 0),
      unitPrice: price,
      qty: 1,
      sizes,
      shape,
      length,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="ring-bordo/10 mt-8 space-y-5 rounded-lg bg-white/60 p-5 ring-1">
      <div>
        <p className="mb-3 text-sm font-semibold">
          Forma{" "}
          <span className="text-ink-soft font-normal">
            · el diseño viene en {SHAPE_LABEL[design.shape].toLowerCase()}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {shapes.map((o) => (
            <Chip
              key={o.id}
              selected={shape === o.id}
              onClick={() => setShape(o.id)}
              hint={hint(config.shapes, o.id, design.shape)}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold">
          Largo{" "}
          <span className="text-ink-soft font-normal">
            · el diseño viene en {LENGTH_LABEL[design.length].toLowerCase()} · {LENGTH_MEASURE_HINT.toLowerCase()}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {config.lengths.map((o) => (
            <Chip
              key={o.id}
              selected={length === o.id}
              onClick={() => setLength(o.id)}
              hint={hint(config.lengths, o.id, design.length)}
            >
              {lengthWithCm(o.id, o.label)}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold">Tu medida</p>
        <SizePicker value={sizes} onChange={setSizes} />
      </div>

      <div className="border-bordo/10 flex items-baseline gap-3 border-t pt-4">
        {/* initial={false}: el precio llega visible del servidor; solo se anima cuando cambia */}
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={price}
            initial={{ opacity: 0, transform: "translateY(6px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            className="font-display text-bordo text-4xl"
          >
            {formatARS(price)}
          </motion.span>
        </AnimatePresence>
        <span className="text-ink-soft text-sm">
          kit completo
          {isOriginal
            ? ""
            : ` · ${SHAPE_LABEL[shape].toLowerCase()} ${LENGTH_LABEL[length].toLowerCase()}`}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button ref={btn} onClick={() => onAdd()} size="lg" disabled={!valid} data-cursor="sumar">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={String(added)}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {added ? "¡Sumado al carrito! ✦" : "Agregar al carrito"}
            </motion.span>
          </AnimatePresence>
        </Button>
        <Button
          variant="secondary"
          size="lg"
          disabled={!valid}
          onClick={() => {
            onAdd(false);
            router.push("/checkout");
          }}
        >
          Comprar ahora
        </Button>
      </div>
      {!valid && <p className="text-red text-xs">Completá las 10 medidas (entre 0,5 y 2,5 cm).</p>}
    </div>
  );
}
