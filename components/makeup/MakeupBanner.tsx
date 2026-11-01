import Link from "next/link";
import type { MakeupProduct } from "@/lib/data/makeup";
import { cn } from "@/lib/format";
import { MakeupArt } from "./MakeupArt";

// Solo para el dibujo de la banda: un labial y un gloss con los colores de la línea.
const LIPSTICK = { id: "banner-labial", name: "", category: "labios", form: "labial", price: 0, hex: "#b5384f", active: true } satisfies MakeupProduct;
const GLOSS = { id: "banner-gloss", name: "", category: "labios", form: "gloss", price: 0, hex: "#f08fb0", active: true } satisfies MakeupProduct;

/** Aviso chico, junto al botón "Diseñá tu set" del catálogo de uñas, que lleva al maquillaje. */
export function MakeupBanner({ className }: { className?: string }) {
  return (
    <Link
      href="/maquillaje"
      className={cn(
        "group bg-blush text-lip ring-rose/25 inline-flex max-w-full items-center gap-3 rounded-pill py-1.5 pr-4 pl-1.5 ring-1",
        "transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-blush-soft active:scale-[0.97]",
        className,
      )}
    >
      <span className="flex shrink-0 -space-x-3" aria-hidden>
        {[LIPSTICK, GLOSS].map((p, i) => (
          <span
            key={p.id}
            className={cn(
              "bg-blush-soft relative block aspect-[4/5] w-10 overflow-hidden rounded-full ring-2 ring-white",
              i === 0 ? "-rotate-6" : "rotate-6",
            )}
          >
            <MakeupArt product={p} className="scale-125" />
          </span>
        ))}
      </span>
      <span className="min-w-0 text-sm leading-tight">
        <span className="font-bold">Nuevo: maquillaje.</span>{" "}
        <span className="text-bordo hidden sm:inline">Bases, máscaras, glosses y brochas.</span>
      </span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
