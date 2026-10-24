import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { Heading } from "@/components/ui/Section";
import { getSettings } from "@/lib/data/settings";
import { mpEnabled } from "@/lib/mercadopago";
import Image from "next/image";
import { ordersEnabled } from "@/lib/data/orders";
import { Button } from "@/components/ui/Button";
import { waLink } from "@/lib/whatsapp";
import { getCartPromos } from "@/lib/data/content-repo";

export const metadata: Metadata = { title: "Pagar" };

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function CheckoutPage() {
  const [s, promos] = await Promise.all([getSettings(), getCartPromos()]);
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <div className="mb-8">
          <Heading as="h1">Finalizar pedido</Heading>
        </div>
        {!ordersEnabled() && (
          <div className="mb-8 flex flex-col items-start gap-5 rounded-lg bg-white/80 p-6 ring-1 ring-bordo/10 md:flex-row md:items-center">
            <Image src="/brand/kitty.webp" alt="" width={72} height={85} className="h-20 w-auto shrink-0" />
            <div className="flex-1">
              <p className="font-title text-2xl">Por ahora, los pedidos van por WhatsApp</p>
              <p className="mt-1 text-sm text-ink-soft">Armá tu carrito igual: con un toque me lo mandás con todo el detalle y lo cerrás por ahí.</p>
            </div>
            <Button href={waLink("Hola Bren! Quiero hacer un pedido 🐱")} target="_blank" rel="noreferrer" size="md">
              Pedir por WhatsApp
            </Button>
          </div>
        )}
        <CheckoutForm transfer={{ alias: s.transferAlias, holder: s.transferHolder }} mp={mpEnabled()} disabled={!ordersEnabled()} promos={promos} />
      </div>
    </div>
  );
}
