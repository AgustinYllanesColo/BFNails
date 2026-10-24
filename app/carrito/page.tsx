import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Heading } from "@/components/ui/Section";
import { getCartPromos } from "@/lib/data/content-repo";

export const metadata: Metadata = { title: "Carrito" };

// Las promos y los sets en stock se releen cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function CarritoPage() {
  const promos = await getCartPromos();
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <div className="mb-8">
          <Heading as="h1">Carrito</Heading>
        </div>
        <CartView promos={promos} />
      </div>
    </div>
  );
}
