import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/motion/Stars";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden pt-24 text-center">
      <Stars />
      <div className="relative">
        <p className="font-display text-[clamp(5rem,20vw,12rem)] leading-none text-bordo">404</p>
        <p className="mt-2 text-lg text-ink-soft">Esa página no existe, pero el catálogo sí.</p>
        <Button href="/catalogo" className="mt-8">
          Ir al catálogo
        </Button>
      </div>
    </div>
  );
}
