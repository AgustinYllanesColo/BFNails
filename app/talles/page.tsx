import type { Metadata } from "next";
import { Eyebrow, Heading, Section } from "@/components/ui/Section";
import { Reveal } from "@/components/motion/Reveal";
import { FINGERS, SIZE_ORDER, STANDARD_SIZES } from "@/lib/data/sizes";
import { SizeFinder } from "@/components/catalog/SizeFinder";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Guía de talles",
  description: "Cómo medir tus uñas para pedir press-on a tu talle exacto.",
};

const STEPS = [
  {
    t: "Cortá una tirita de papel",
    d: "De 1 cm de ancho. Vale cinta métrica flexible o hilo también.",
  },
  {
    t: "Apoyala sobre la uña",
    d: "En la parte más ancha, de borde a borde (de piel a piel), bien pegada a la curva.",
  },
  {
    t: "Marcá y medí",
    d: "Marcá los dos bordes con birome, estirá el papel y medí en milímetros con una regla.",
  },
  {
    t: "Repetí en las 10",
    d: "Las dos manos no son iguales. Anotá pulgar, índice, mayor, anular y meñique de cada una.",
  },
];

export default function TallesPage() {
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <Eyebrow>Guía de talles</Eyebrow>
          <Heading as="h1">
            Medite en <span className="text-bordo">2 minutos</span>
          </Heading>
          <p className="mt-4 text-lg text-ink-soft">
            Las press-on quedan perfectas cuando el ancho es el justo. Podés elegir un talle estándar o
            pasarnos tus 10 medidas y Bren arma el set a tu mano.
          </p>
        </Reveal>

        <Reveal stagger={0.1} className="mt-12 grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-lg bg-white/70 p-6 ring-1 ring-bordo/10">
              <span className="font-display text-4xl text-bordo">0{i + 1}</span>
              <h3 className="mt-3 font-display text-xl">{s.t}</h3>
              <p className="mt-2 text-sm text-ink-soft">{s.d}</p>
            </div>
          ))}
        </Reveal>
      </div>

      <Section tone="deep" className="mt-20">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <Reveal>
            <Eyebrow>Talles estándar</Eyebrow>
            <h2 className="font-display text-3xl md:text-4xl">¿Cuál soy?</h2>
            <p className="mt-3 text-ink-soft">
              Ancho aproximado en milímetros por dedo. Si estás entre dos, elegí el más chico: la uña puede
              limarse un poquito, pero no agrandarse.
            </p>
            <div className="mt-6 overflow-x-auto rounded-lg bg-white/80 ring-1 ring-bordo/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bordo text-left text-cream">
                    <th className="p-3 font-semibold">Talle</th>
                    {FINGERS.map((f) => (
                      <th key={f} className="p-3 font-semibold">
                        {f}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SIZE_ORDER.map((s) => (
                    <tr key={s} className="border-t border-bordo/10">
                      <td className="p-3 font-display text-xl text-bordo">{s}</td>
                      {STANDARD_SIZES[s].widthMm.map((w, i) => (
                        <td key={i} className="p-3">
                          {w} mm
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
          <Reveal>
            <Eyebrow>Calculadora</Eyebrow>
            <h2 className="font-display text-3xl md:text-4xl">Decime dos medidas</h2>
            <p className="mt-3 text-ink-soft">Con el pulgar y el anular ya te sugerimos un talle.</p>
            <SizeFinder />
          </Reveal>
        </div>
      </Section>

      <div className="container-x mt-20 text-center">
        <Reveal>
          <h2 className="font-display text-3xl">¿Ya tenés tus medidas?</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/catalogo" size="lg">
              Ir al catálogo
            </Button>
            <Button href="/disena" size="lg" variant="secondary">
              Diseñá tu set
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
