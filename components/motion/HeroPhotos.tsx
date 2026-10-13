import Image from "next/image";
import { cn } from "@/lib/format";

/**
 * Fotos reales de sets alrededor del logo del hero, como stickers con borde crema. Reemplazan a las uñas
 * dibujadas en SVG: lo que vende es el trabajo de Bren, no un dibujo. Dos en el celular (arriba, lejos del
 * copy) y cuatro desde md, en las esquinas del logo. Decorativas (`aria-hidden`), con una flotación suave.
 */
type Spec = { src: string; x: string; y: string; w: number; rotate: number; delay: number; mobile?: boolean };

const PHOTOS: Spec[] = [
  { src: "/catalog/set-leopard-red-640.webp", x: "3%", y: "11%", w: 118, rotate: -8, delay: 0, mobile: true },
  { src: "/catalog/set-sunset-french-640.webp", x: "68%", y: "9%", w: 108, rotate: 7, delay: -3.2, mobile: true },
  { src: "/catalog/set-gems-french-640.webp", x: "5%", y: "40%", w: 150, rotate: 6, delay: -5.1 },
  { src: "/catalog/set-milky-gold-foil-640.webp", x: "84%", y: "44%", w: 160, rotate: -6, delay: -1.6 },
];

export function HeroPhotos({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {PHOTOS.map((p) => (
        <div
          key={p.src}
          className={cn("absolute", p.mobile ? "block" : "hidden md:block")}
          style={{ left: p.x, top: p.y, width: `clamp(${p.w * 0.8}px, ${p.w / 7.2}vw, ${p.w * 1.35}px)` }}
        >
          <div>
            <div
              className="overflow-hidden rounded-[18px] bg-white p-1.5 shadow-[0_18px_40px_-18px_rgba(74,14,14,0.45)] ring-1 ring-bordo/10 md:rounded-[22px] md:p-2"
              style={{ transform: `rotate(${p.rotate}deg)` }}
            >
              <Image
                src={p.src}
                alt=""
                width={640}
                height={800}
                sizes="(min-width: 768px) 200px, 120px"
                quality={70}
                className="aspect-[4/5] w-full rounded-[13px] object-cover md:rounded-[16px]"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
