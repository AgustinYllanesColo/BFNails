import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { ArrepentimientoForm } from "@/components/legal/ArrepentimientoForm";

export const metadata: Metadata = { title: "Botón de arrepentimiento" };

export default function ArrepentimientoPage() {
  return (
    <LegalPage eyebrow="Defensa del consumidor" title={<>Botón de <span className="text-bordo">arrepentimiento</span></>} updated="octubre 2026">
      <section>
        <p>
          Si te arrepentiste de una compra, podés revocarla dentro de los 10 días corridos desde que recibiste el producto o desde la compra, lo que ocurra último, sin costo ni expresión de causa (Ley 24.240, art. 34, y Resolución 424/2020). Completá el formulario y se abre WhatsApp con tu solicitud ya escrita; te respondemos a la brevedad y te indicamos cómo seguir.
        </p>
      </section>
      <ArrepentimientoForm />
    </LegalPage>
  );
}
