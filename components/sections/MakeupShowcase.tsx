import Link from "next/link";
import { MAKEUP_CATEGORIES, type MakeupProduct } from "@/lib/data/makeup";
import { MakeupCard } from "@/components/makeup/MakeupCard";
import { Heading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

/**
 * La línea nueva, en su propio mundo (fondo rubor): título, una intro corta, accesos directos a cada categoría y los
 * productos destacados. En el celular los productos se deslizan de costado (como las promos); desde md van en grilla.
 */
export function MakeupShowcase({ products }: { products: MakeupProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section id="maquillaje" aria-labelledby="makeup-t" className="bg-blush-soft text-lip relative overflow-hidden py-20 md:py-28">
      <div className="container-x grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-16">
        <div>
          <Heading>
            <span id="makeup-t">Llegó el maquillaje</span>
          </Heading>
          <p className="mt-5 max-w-[46ch] text-lg leading-relaxed">
            Bases, rubores, máscaras, glosses, delineadores y brochas, elegidos por mí para el día a día. Los sumás al
            mismo carrito que tus uñas.
          </p>
        </div>
        <nav aria-label="Categorías de maquillaje">
          <ul className="flex flex-wrap gap-2 lg:justify-end">
            {MAKEUP_CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/maquillaje?cat=${c.id}`}
                  className="rounded-pill text-lip ring-lip/20 hover:bg-lip hover:text-cream focus-visible:ring-lip inline-flex h-11 items-center bg-white px-5 text-[15px] font-bold ring-1 transition-[background-color,color,transform] duration-200 ease-[var(--ease-out-expo)] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.97]"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <ul
        className="mt-10 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:container-x md:mt-12 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible lg:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
        style={{ "--cols": Math.min(products.length, 6) } as React.CSSProperties}
      >
        {products.map((p, i) => (
          <li key={p.id} className="w-[62%] max-w-[260px] shrink-0 snap-start md:w-auto md:max-w-none">
            <MakeupCard product={p} priority={i < 2} />
          </li>
        ))}
      </ul>

      <div className="container-x mt-10 text-center md:mt-14">
        <Button href="/maquillaje" size="lg" className="bg-lip! hover:bg-bordo!">
          Ver todo el maquillaje
        </Button>
      </div>
    </section>
  );
}
