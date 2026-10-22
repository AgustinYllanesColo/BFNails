import type { Metadata } from "next";
import { Faq } from "@/components/sections/Faq";
import { Heading } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

const WA_DUDA = "Hola Bren! Tengo una consulta sobre las press-on 🐱";

export default function FaqPage() {
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <Heading as="h1">Preguntas frecuentes</Heading>
          </Reveal>
          <Reveal className="mt-8 hidden rounded-lg bg-bordo p-8 text-cream lg:block">
            <h2 className="font-title text-2xl">¿Te quedó alguna duda?</h2>
            <p className="mt-2 text-cream/80">Escribime por WhatsApp o Instagram y hablamos.</p>
            <Button href={waLink(WA_DUDA)} target="_blank" rel="noreferrer" variant="leopard" className="mt-6">
              Hablar por WhatsApp
            </Button>
          </Reveal>
        </div>
        <div>
          <Faq compact />
          <Reveal className="mt-12 rounded-lg bg-bordo p-8 text-cream lg:hidden">
            <h2 className="font-title text-2xl">¿Te quedó alguna duda?</h2>
            <p className="mt-2 text-cream/80">Escribime por WhatsApp o Instagram y hablamos.</p>
            <Button href={waLink(WA_DUDA)} target="_blank" rel="noreferrer" variant="leopard" className="mt-6">
              Hablar por WhatsApp
            </Button>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
