import type { Charm } from "@/lib/data/content";
import { formatARS } from "@/lib/format";
import { CharmThumb } from "./CharmThumb";

/** Grilla de dijes disponibles con su precio por unidad. */
export function CharmsGrid({ charms }: { charms: Charm[] }) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {charms.map((c) => (
        <li key={c.id} className="rounded-lg bg-white/80 p-2 ring-1 ring-bordo/10">
          <CharmThumb charm={c} />
          <p className="mt-2 px-1 text-[13px] leading-tight font-semibold">{c.name}</p>
          <p className="px-1 pb-1 text-[13px] text-ink-soft">{formatARS(c.price)} c/u</p>
        </li>
      ))}
    </ul>
  );
}
