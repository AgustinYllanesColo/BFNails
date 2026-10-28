import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Heading } from "@/components/ui/Section";
import { getLivePromos } from "@/lib/data/content-repo";
import { fourForThreeLive } from "@/lib/data/content";

export const metadata: Metadata = { title: "Carrito" };
export const revalidate = 300;

export default async function CarritoPage() {
  const promos = await getLivePromos();
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <div className="mb-8">
          <Heading as="h1">Carrito</Heading>
        </div>
        <CartView promo4x3={fourForThreeLive(promos)} />
      </div>
    </div>
  );
}
