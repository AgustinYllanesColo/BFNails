"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { suggestSize } from "@/lib/data/sizes";
import { Field } from "@/components/ui/Field";
import { CmInput } from "@/components/ui/CmInput";

export function SizeFinder() {
  const [t, setThumb] = useState(0);
  const [r, setRing] = useState(0);
  const ok = t >= 10 && t <= 25 && r >= 8 && r <= 20;
  const size = ok ? suggestSize(t, r) : null;

  return (
    <div className="mt-6 rounded-lg bg-white/80 p-6 ring-1 ring-bordo/10">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pulgar (cm)" htmlFor="thumb">
          <CmInput id="thumb" mm={t} onChange={setThumb} placeholder="1,6" />
        </Field>
        <Field label="Anular (cm)" htmlFor="ring">
          <CmInput id="ring" mm={r} onChange={setRing} placeholder="1,2" />
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
              Sos <strong className="text-ink">{size}</strong>. Si querés que queden exactas, pedilas con medida
              personalizada.
            </p>
          </motion.div>
        ) : (
          <p className="text-sm text-ink-soft">Cargá las dos medidas.</p>
        )}
      </div>
    </div>
  );
}
