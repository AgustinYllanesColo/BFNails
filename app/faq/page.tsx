import type { Metadata } from "next";
import { Faq } from "@/components/sections/Faq";
import { Eyebrow, Heading } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

export default function FaqPage() {
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <Eyebrow>Preguntas frecuentes</Eyebrow>
          <Heading as="h1">
            Todo lo que querés <span className="text-bordo">saber</span>
          </Heading>
        </Reveal>
        <div className="mt-10 max-w-3xl">
          <Faq compact />
        </div>
        <Reveal className="mt-16 rounded-lg bg-bordo p-8 text-cream md:p-12">
          <h2 className="font-display text-3xl">¿Te quedó alguna duda?</h2>
          <p className="mt-2 text-cream/80">Escribile a Bren por WhatsApp, responde rápido.</p>
          <Button href={waLink("Hola Bren! Tengo una consulta sobre las press-on 🐱")} target="_blank" rel="noreferrer" variant="leopard" className="mt-6">
            Hablar por WhatsApp
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
