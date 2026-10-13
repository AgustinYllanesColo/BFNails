import Image from "next/image";
import Link from "next/link";
import type { Design } from "@/lib/types";
import { COMPLEXITY_LABEL, LENGTH_LABEL, SHAPE_LABEL, designImage } from "@/lib/data/catalog";
import { formatARS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

export function DesignCard({ design, priority }: { design: Design; priority?: boolean }) {
  return (
    <Link
      href={`/catalogo/${design.slug}`}
      className="group block"
      data-cursor="ver"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-cream-deep ring-1 ring-bordo/5">
        <Image
          src={designImage(design, 0)}
          alt={design.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="object-cover transition-[transform,opacity] duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105 group-hover:opacity-0"
        />
        <Image
          src={designImage(design, 1)}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-0 transition-[transform,opacity] duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {design.featured && <Badge tone="yellow">★ favorito</Badge>}
          <Badge tone="cream">{COMPLEXITY_LABEL[design.complexity]}</Badge>
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl leading-tight text-ink group-hover:text-bordo">{design.name}</h3>
          <p className="mt-0.5 text-xs text-ink-soft">
            {SHAPE_LABEL[design.shape]} · {LENGTH_LABEL[design.length]}
          </p>
        </div>
        <p className="shrink-0 rounded-pill bg-cream-deep px-3 py-1 text-sm font-bold text-bordo">
          {formatARS(design.price)}
        </p>
      </div>
    </Link>
  );
}
