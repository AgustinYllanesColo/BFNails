import type { KitItem } from "@/lib/data/content";
import { cn } from "@/lib/format";

/** Ícono de línea según el nombre del ítem (los nombres los edita Brenda desde el admin). */
function KitIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  const common = {
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (n.includes("pegamento"))
    return (
      <svg {...common}>
        <path d="M13 4h6l1 6h-8l1-6z" />
        <rect x="10" y="10" width="12" height="18" rx="3" />
        <path d="M10 17h12" />
      </svg>
    );
  if (n.includes("buffer") || n.includes("pulidor"))
    return (
      <svg {...common}>
        <rect x="5" y="9" width="22" height="14" rx="4" />
        <path d="M5 16h22" />
      </svg>
    );
  if (n.includes("lima"))
    return (
      <svg {...common}>
        <rect x="3" y="12.5" width="26" height="7" rx="3.5" transform="rotate(-30 16 16)" />
      </svg>
    );
  if (n.includes("wipe") || n.includes("toallita"))
    return (
      <svg {...common}>
        <rect x="7" y="7" width="18" height="18" rx="3" />
        <path d="M11.5 11.5h.01M16 11.5h.01M20.5 11.5h.01M11.5 16h.01M16 16h.01M20.5 16h.01M11.5 20.5h.01M16 20.5h.01M20.5 20.5h.01" strokeWidth="2.5" />
      </svg>
    );
  if (n.includes("palito"))
    return (
      <svg {...common}>
        <path d="M7 26L24 7l2 2-17 19z" />
        <path d="M24 7l3-2-1 4" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M16 4l3.3 8 8.7.7-6.6 5.6 2 8.4L16 22.4 8.6 26.7l2-8.4L4 12.7l8.7-.7z" />
    </svg>
  );
}

/** Lo que trae el kit de colocación, en una fila compacta de íconos. */
export function KitItems({ items, className }: { items: KitItem[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((it) => (
        <li
          key={it.name}
          className="inline-flex items-center gap-1.5 rounded-pill bg-cream-deep py-1 pr-3 pl-1.5 text-[13px] font-semibold text-ink"
        >
          <span className="grid size-6 place-items-center text-bordo [&>svg]:size-[18px]">
            <KitIcon name={it.name} />
          </span>
          {it.name}
        </li>
      ))}
    </ul>
  );
}
