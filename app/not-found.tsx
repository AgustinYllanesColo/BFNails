import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/motion/Stars";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden pt-24 text-center">
      {/* En los costados y lejos del texto: las de default pisaban la frase en el celular */}
      <Stars
        stars={[
          { x: "6%", y: "18%", size: 56, rotate: -12, speed: 0.6 },
          { x: "84%", y: "12%", size: 44, rotate: 15, speed: 1 },
          { x: "80%", y: "82%", size: 72, rotate: 8, speed: 0.8, mobile: false },
        ]}
      />
      <div className="relative px-5">
        <p className="font-display text-[clamp(5rem,20vw,12rem)] leading-none text-bordo">404</p>
        <p className="mt-2 text-lg text-ink-soft">Esa página no existe, pero el catálogo sí.</p>
        <Button href="/catalogo" className="mt-8">
          Ir al catálogo
        </Button>
      </div>
    </div>
  );
}
