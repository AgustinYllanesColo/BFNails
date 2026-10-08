import Link from "next/link";
import type { Design } from "@/lib/types";
import { DesignCard } from "@/components/catalog/DesignCard";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow, Heading, Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

export function Featured({ designs }: { designs: Design[] }) {
  return (
    <Section id="destacados">
      <div className="container-x">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Los más pedidos</Eyebrow>
            <Heading>
              Sets que <span className="text-bordo">vuelan</span>
            </Heading>
          </div>
          <Link href="/catalogo" className="font-semibold text-bordo underline-offset-4 hover:underline">
            Ver todo el catálogo →
          </Link>
        </Reveal>
        <Reveal stagger={0.08} className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {designs.map((d, i) => (
            <DesignCard key={d.slug} design={d} priority={i < 2} />
          ))}
        </Reveal>
        <Reveal className="mt-12 text-center">
          <Button href="/catalogo" variant="secondary" size="lg">
            Explorar los {designs.length}+ diseños
          </Button>
        </Reveal>
      </div>
    </Section>
  );
}
