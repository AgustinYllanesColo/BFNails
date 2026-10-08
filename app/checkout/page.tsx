import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { Eyebrow, Heading } from "@/components/ui/Section";
import { getSettings } from "@/lib/data/settings";
import { mpEnabled } from "@/lib/mercadopago";
import { ordersEnabled } from "@/lib/data/orders";
import { Button } from "@/components/ui/Button";
import { waLink } from "@/lib/whatsapp";

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
        {!ordersEnabled() && (
          <div className="mb-8 rounded-lg bg-bordo p-6 text-cream">
            <p className="font-display text-2xl">Todavía no tomamos pedidos por la web</p>
            <p className="mt-2 text-sm text-cream/85">
              Estamos terminando de conectar la tienda. Mientras tanto, mandale tu pedido a Bren por WhatsApp y lo armamos por ahí.
            </p>
            <Button href={waLink("Hola Bren! Quiero hacer un pedido 🐱")} target="_blank" rel="noreferrer" variant="leopard" className="mt-4">
              Pedir por WhatsApp
            </Button>
          </div>
        )}
        <CheckoutForm transfer={{ alias: s.transferAlias, holder: s.transferHolder }} mp={mpEnabled()} disabled={!ordersEnabled()} />
      </div>
    </div>
  );
}
