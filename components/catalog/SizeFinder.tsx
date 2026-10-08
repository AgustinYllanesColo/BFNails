"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { suggestSize } from "@/lib/data/sizes";
import { Field, inputClass } from "@/components/ui/Field";

export function SizeFinder() {
  const [thumb, setThumb] = useState("");
  const [ring, setRing] = useState("");
  const t = Number(thumb);
  const r = Number(ring);
  const ok = t >= 10 && t <= 25 && r >= 8 && r <= 20;
  const size = ok ? suggestSize(t, r) : null;

  return (
    <div className="mt-6 rounded-lg bg-white/80 p-6 ring-1 ring-bordo/10">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pulgar (mm)" htmlFor="thumb">
          <input id="thumb" type="number" inputMode="decimal" step="0.5" className={inputClass} value={thumb} onChange={(e) => setThumb(e.target.value)} placeholder="17" />
        </Field>
        <Field label="Anular (mm)" htmlFor="ring">
          <input id="ring" type="number" inputMode="decimal" step="0.5" className={inputClass} value={ring} onChange={(e) => setRing(e.target.value)} placeholder="13" />
        </Field>
      </div>
      <div className="mt-5 flex min-h-16 items-center gap-4">
        {size ? (
          <motion.div
            key={size}
            initial={{ scale: 0.7, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="flex items-center gap-4"
          >
            <span className="grid size-16 place-items-center rounded-pill bg-bordo font-display text-3xl text-cream">{size}</span>
            <p className="text-sm text-ink-soft">
              Te sugerimos el <strong className="text-ink">talle {size}</strong>. Si querés exactitud total, cargá
              las 10 medidas al hacer el pedido.
            </p>
          </motion.div>
        ) : (
          <p className="text-sm text-ink-soft">Cargá las dos medidas y te decimos tu talle.</p>
        )}
      </div>
    </div>
  );
}
