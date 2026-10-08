"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import type { Design, SizeSelection } from "@/lib/types";
import { useCart } from "@/lib/store/cart";
import { designImage } from "@/lib/data/catalog";
import { SizePicker, sizesAreValid } from "./SizePicker";
import { Button } from "@/components/ui/Button";

export function AddDesignToCart({ design }: { design: Design }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [sizes, setSizes] = useState<SizeSelection>({ mode: "standard", size: "S" });
  const [added, setAdded] = useState(false);
  const valid = sizesAreValid(sizes);

  const onAdd = () => {
    add({
      kind: "design",
      designSlug: design.slug,
      name: design.name,
      image: designImage(design, 0),
      unitPrice: design.price,
      qty: 1,
      sizes,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="mt-8 space-y-5 rounded-lg bg-white/60 p-5 ring-1 ring-bordo/10">
      <div>
        <p className="mb-3 text-sm font-semibold">Tu talle</p>
        <SizePicker value={sizes} onChange={setSizes} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onAdd} size="lg" disabled={!valid} data-cursor="sumar">
          <motion.span key={String(added)} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            {added ? "¡Sumado al carrito! ✦" : "Agregar al carrito"}
          </motion.span>
        </Button>
        <Button
          variant="secondary"
          size="lg"
          disabled={!valid}
          onClick={() => {
            onAdd();
            router.push("/checkout");
          }}
        >
          Comprar ahora
        </Button>
      </div>
      {!valid && <p className="text-xs text-red">Completá las 10 medidas (entre 5 y 25 mm).</p>}
    </div>
  );
}
