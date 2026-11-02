import { Marquee, Star } from "@/components/motion/Marquee";
import { cn } from "@/lib/format";

/**
 * Cinta de obra con los colores de la marca (amarillo y bordó): avisa que el catálogo de maquillaje se está armando.
 * Decorativa (aria-hidden, como todas las cintas): el texto que importa está escrito aparte en la página.
 */
/** Franjas diagonales de cinta de obra, en amarillo y bordó de la marca. */
const STRIPES: React.CSSProperties = {
  height: 8,
  backgroundImage: "repeating-linear-gradient(-45deg, var(--yellow) 0 12px, var(--bordo) 12px 24px)",
};

export function EnObraTape({ className }: { className?: string }) {
  return (
    <div className={cn("relative z-10 overflow-x-clip py-2", className)} aria-hidden>
      <div className="-mx-[4vw] w-[108vw] -rotate-[2deg]">
        <div style={STRIPES} />
        <Marquee
          items={["en obra", "estamos sacando las fotos", "en obra", "muy pronto todo el maquillaje"]}
          separator={<Star size={16} className="text-bordo" />}
          className="bg-yellow text-bordo font-title py-2 text-lg tracking-wide uppercase md:py-2.5 md:text-xl"
          speed={30}
        />
        <div style={STRIPES} />
      </div>
    </div>
  );
}
