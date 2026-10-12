import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { CheckoutSteps } from "@/components/cart/CheckoutSteps";
import { Heading } from "@/components/ui/Section";
import { Brush } from "@/components/motion/Brush";
import { getFeaturedDesigns } from "@/lib/data/repo";
import { getBuilderConfig } from "@/lib/data/settings";

export const metadata: Metadata = { title: "Carrito" };

// La bolsita vive en el navegador; lo del servidor (sugerencias y etiquetas del armador) se regenera cada 5 minutos.
export const revalidate = 300;

export default async function CarritoPage() {
  const [suggestions, config] = await Promise.all([getFeaturedDesigns(3), getBuilderConfig()]);
  return (
    <div className="pt-[calc(var(--nav-h)+24px)] pb-[var(--section-y-tight)] lg:pt-[calc(var(--nav-h)+40px)]">
      <div className="container-x">
        <div className="mx-auto max-w-[1180px]">
          <header className="mb-8 lg:mb-12">
            <CheckoutSteps current={0} />
            <Heading as="h1" className="mt-5">
              Tus <Brush mode="load">sets</Brush>
            </Heading>
          </header>
          <CartView suggestions={suggestions} config={config} />
        </div>
      </div>
    </div>
  );
}
