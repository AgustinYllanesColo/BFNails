import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { Eyebrow, Heading } from "@/components/ui/Section";
import { getSettings } from "@/lib/data/settings";
import { mpEnabled } from "@/lib/mercadopago";

export const metadata: Metadata = { title: "Pagar" };

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <div className="mb-8">
          <Eyebrow>Checkout</Eyebrow>
          <Heading as="h1">
            Último <span className="text-bordo">paso</span>
          </Heading>
        </div>
        <CheckoutForm transfer={{ alias: s.transferAlias, holder: s.transferHolder }} mp={mpEnabled()} />
      </div>
    </div>
  );
}
