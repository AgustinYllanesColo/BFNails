"use client";

import type { Charm } from "@/lib/data/content";
import { formatARS } from "@/lib/format";
import { CharmThumb } from "./CharmThumb";
import { useCharmFilter } from "./CharmFilter";
import { AddCharmToCart } from "./AddCharmToCart";

/** Grilla de dijes disponibles con su precio por unidad. */
export function CharmsGrid({ charms }: { charms: Charm[] }) {
  const { chips, visible } = useCharmFilter(charms);
  return (
    <>
      {chips}
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {visible.map((c) => (
          <li key={c.id} className="rounded-lg bg-white/80 p-2 ring-1 ring-bordo/10">
            <CharmThumb charm={c} />
            <p className="mt-2 px-1 text-[13px] leading-tight font-semibold">{c.name}</p>
            <p className="px-1 text-[13px] text-ink-soft">{formatARS(c.price)} c/u</p>
            <AddCharmToCart charm={c} />
          </li>
        ))}
      </ul>
    </>
  );
}
