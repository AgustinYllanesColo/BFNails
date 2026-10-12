import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { CheckoutSteps } from "@/components/cart/CheckoutSteps";
import { Heading } from "@/components/ui/Section";
import { Brush } from "@/components/motion/Brush";
import { getBuilderConfig, getSettings } from "@/lib/data/settings";
import { getFeaturedDesigns } from "@/lib/data/repo";
import { mpEnabled } from "@/lib/mercadopago";
import { ordersEnabled } from "@/lib/data/orders";
import { quoteFromTable } from "@/lib/shipping/table";

export const metadata: Metadata = { title: "Pagar" };

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function CheckoutPage() {
  const [s, config, suggestions] = await Promise.all([getSettings(), getBuilderConfig(), getFeaturedDesigns(3)]);
  // Retiro y moto salen de la tabla (sin esperar una cotización); el Correo se cotiza con el código postal.
  const shipping = quoteFromTable(s.shipping);
  const correoFrom = Math.min(...Object.values(s.shipping.correo).flatMap((z) => [z.domicilio, z.sucursal]));

  return (
    <div className="pt-[calc(var(--nav-h)+24px)] pb-[var(--section-y-tight)] lg:pt-[calc(var(--nav-h)+40px)]">
      <div className="container-x">
        <div className="mx-auto max-w-[1180px]">
          <header className="mb-10 lg:mb-14">
            <CheckoutSteps current={1} linkBack />
            <Heading as="h1" className="mt-5">
              Ya casi es <Brush mode="load">tuyo</Brush>
            </Heading>
          </header>
          <CheckoutForm
            transfer={{ alias: s.transferAlias, holder: s.transferHolder }}
            mp={mpEnabled()}
            mode={ordersEnabled() ? "web" : "whatsapp"}
            whatsapp={s.whatsapp}
            shipping={shipping}
            correoFrom={Number.isFinite(correoFrom) ? correoFrom : null}
            config={config}
            suggestions={suggestions}
          />
        </div>
      </div>
    </div>
  );
}
