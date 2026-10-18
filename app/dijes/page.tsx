import type { Metadata } from "next";
import { Heading } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CharmsGrid } from "@/components/charms/CharmsGrid";
import { getCharms } from "@/lib/data/content-repo";

export const metadata: Metadata = {
  title: "Dijes",
  description: "Los dijes disponibles para sumar a tu set de press-on.",
};

// Se regenera como máximo cada 5 minutos; el admin además revalida al guardar.
export const revalidate = 300;

export default async function DijesPage() {
  const charms = await getCharms();
  return (
    <div className="pt-28 pb-24 md:pt-36">
      <div className="container-x">
        <Heading as="h1">Dijes</Heading>
        <p className="text-ink-soft mt-3 max-w-[44ch] text-lg">Lo que tengo disponible. Sumalos a tu set en el armador.</p>
        <div className="mt-8">
          {charms.length ? (
            <CharmsGrid charms={charms} />
          ) : (
            <p className="text-ink-soft">Ahora no tengo dijes cargados. Volvé pronto.</p>
          )}
        </div>
        <Button href="/disena#paso-6" size="lg" className="mt-10">
          Sumalos a tu set →
        </Button>
      </div>
    </div>
  );
}
