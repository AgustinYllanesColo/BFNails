import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDesign, getDesigns } from "@/lib/data/repo";
import { COMPLEXITY_LABEL, FINISH_LABEL, LENGTH_LABEL, SHAPE_LABEL, designImage } from "@/lib/data/catalog";
import { formatARS } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { AddDesignToCart } from "@/components/cart/AddDesignToCart";
import { DesignCard } from "@/components/catalog/DesignCard";
import { Reveal } from "@/components/motion/Reveal";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const design = await getDesign(slug);
  if (!design) return { title: "Diseño" };
  return {
    title: design.name,
    description: `${design.description} ${formatARS(design.price)}, kit completo.`,
    openGraph: { images: [{ url: designImage(design, 0) }] },
  };
}

export default async function DesignPage({ params }: Props) {
  const { slug } = await params;
  const design = await getDesign(slug);
  if (!design) notFound();
  const all = await getDesigns();
  const related = all.filter((d) => d.slug !== design.slug && (d.shape === design.shape || d.tags.some((t) => design.tags.includes(t)))).slice(0, 4);

  return (
    <div className="pt-24 pb-24 md:pt-32">
      <div className="container-x">
        <nav className="mb-6 text-sm text-ink-soft" aria-label="Migas">
          <Link href="/catalogo" className="hover:text-bordo">
            Catálogo
          </Link>{" "}
          / <span className="text-ink">{design.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="grid grid-cols-2 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-lg bg-cream-deep ${i === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}
              >
                <Image
                  src={designImage(design, i)}
                  alt={`${design.name}, vista ${i + 1}`}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  priority={i === 0}
                  className="object-cover"
                />
              </div>
            ))}
          </Reveal>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <div className="flex flex-wrap gap-2">
                {design.featured && <Badge tone="yellow">★ favorito</Badge>}
                <Badge tone="cream">{COMPLEXITY_LABEL[design.complexity]}</Badge>
                {design.tags.map((t) => (
                  <Badge key={t} tone="cream" className="normal-case">
                    {t}
                  </Badge>
                ))}
              </div>
              <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.95]">{design.name}</h1>
              <p className="mt-4 text-lg text-ink-soft">{design.description}</p>

              <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
                {[
                  ["Forma", SHAPE_LABEL[design.shape]],
                  ["Largo", LENGTH_LABEL[design.length]],
                  ["Acabado", FINISH_LABEL[design.finish]],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-md bg-cream-deep p-3">
                    <dt className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">{k}</dt>
                    <dd className="mt-1 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex items-baseline gap-3">
                <span className="font-display text-4xl text-bordo">{formatARS(design.price)}</span>
                <span className="text-sm text-ink-soft">kit completo</span>
              </div>

              <AddDesignToCart design={design} />

              <ul className="mt-8 space-y-2 text-sm text-ink-soft">
                <li>✦ 10 uñas en tu talle + pegamento + lima</li>
                <li>✦ Hecho a mano y a pedido: 3 a 7 días</li>
                <li>✦ Retiro en estación gratis o envío por Correo Argentino</li>
              </ul>
            </Reveal>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-24">
            <Reveal>
              <h2 className="font-display text-3xl">También te pueden gustar</h2>
            </Reveal>
            <Reveal stagger={0.08} className="mt-6 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {related.map((d) => (
                <DesignCard key={d.slug} design={d} />
              ))}
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}
