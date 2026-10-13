import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { Eyebrow, Heading } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Carrito" };

export default function CarritoPage() {
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <div className="mb-8">
          <Eyebrow>Carrito</Eyebrow>
          <Heading as="h1">
            Tus <span className="text-bordo">sets</span>
          </Heading>
        </div>
        <CartView />
      </div>
    </div>
  );
}
