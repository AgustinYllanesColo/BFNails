import Image from "next/image";
import Link from "next/link";
import type { MakeupProduct } from "@/lib/data/makeup";
import { MakeupVisual } from "@/components/makeup/MakeupArt";

/**
 * Las dos tiendas, apenas termina el hero: Maquillaje (mundo rubor, con el dibujo de cada producto) y Uñas (mundo
 * crema y bordó, con fotos reales y la cinta leopardo). En el celular van una abajo de la otra, el maquillaje primero
 * porque es lo nuevo. Cada puerta es un solo link; con mouse, los stickers se abren en abanico (`.door-sticker`).
 */
export function Doors({ makeup, nailsCount }: { makeup: MakeupProduct[]; nailsCount: number }) {
  return (
    <section aria-label="Las dos tiendas" className="pt-14 pb-6 md:pt-20 md:pb-10">
      <div className="container-x grid gap-4 md:grid-cols-2 md:gap-6">
        <MakeupDoor makeup={makeup} />
        <NailsDoor count={nailsCount} />
      </div>
    </section>
  );
}

/**
 * Tres productos de formas distintas, para que el abanico se lea como "maquillaje" de un vistazo. Distintos de los
 * stickers del hero y de los destacados de la vitrina, para que la home no repita el mismo producto.
 */
export const MAKEUP_DOOR_PICKS = ["base-liquida-ruby", "lip-glaze-super-stay-matte", "brocha-city"];

/** Posición de reposo y de hover de cada sticker (izquierda, centro, derecha). */
const FAN = [
  { r: "-12deg", x: "18%", y: "8%", hr: "-18deg", hx: "4%", hy: "2%" },
  { r: "3deg", x: "0%", y: "-4%", hr: "0deg", hx: "0%", hy: "-10%" },
  { r: "13deg", x: "-18%", y: "10%", hr: "19deg", hx: "-4%", hy: "4%" },
];

function MakeupDoor({ makeup }: { makeup: MakeupProduct[] }) {
  const picks = MAKEUP_DOOR_PICKS.map((id) => makeup.find((m) => m.id === id)).filter((m): m is MakeupProduct => Boolean(m));
  // si Brenda borró alguno de estos, completa con los primeros que haya (mejor si no están destacados)
  const rest = [...makeup.filter((m) => !m.featured), ...makeup.filter((m) => m.featured)];
  const stickers = [...picks, ...rest.filter((m) => !picks.includes(m))].slice(0, 3);
  return (
    <Link
      href="/maquillaje"
      className="door group bg-blush text-lip relative isolate flex min-h-[440px] flex-col overflow-hidden rounded-[28px] p-6 md:min-h-[540px] md:p-10"
    >
      {/* mancha rubor detrás de los productos */}
      <span
        aria-hidden
        className="bg-blush-soft absolute top-[52%] left-1/2 -z-10 size-[min(78vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full md:top-[54%]"
      />
      <div>
        <h2 className="font-display text-[clamp(3rem,7vw,5.25rem)] leading-[0.95]">Maquillaje</h2>
        <p className="mt-3 max-w-[30ch] text-[17px] leading-snug font-semibold">
          {makeup.length} productos para rostro, ojos, cejas y labios, y las brochas para aplicarlos.
        </p>
      </div>

      <div aria-hidden className="relative my-6 flex flex-1 items-center justify-center md:my-8">
        {stickers.map((m, i) => (
          <span
            key={m.id}
            className="door-sticker relative w-[33%] max-w-[210px] shrink-0"
            style={
              {
                "--r": FAN[i].r,
                "--x": FAN[i].x,
                "--y": FAN[i].y,
                "--hr": FAN[i].hr,
                "--hx": FAN[i].hx,
                "--hy": FAN[i].hy,
                zIndex: i === 1 ? 2 : 1,
              } as React.CSSProperties
            }
          >
            <span className="block rounded-[18px] bg-white p-1.5 shadow-[0_20px_40px_-20px_rgba(142,31,61,0.55)] md:p-2">
              <span className="block overflow-hidden rounded-[13px]">
                <MakeupVisual product={m} sizes="(min-width: 768px) 210px, 33vw" />
              </span>
            </span>
          </span>
        ))}
        <span className="font-display bg-lip text-cream absolute top-[2%] right-[4%] z-[3] rotate-[8deg] rounded-xl px-3.5 py-1.5 text-2xl leading-none shadow-[0_12px_24px_-12px_rgba(142,31,61,0.7)] md:text-3xl">
          Nuevo
        </span>
      </div>

      <DoorCta className="bg-lip text-cream">Ver maquillaje</DoorCta>
    </Link>
  );
}

const NAIL_PHOTOS = [
  { src: "/catalog/set-pink-zebra-640.webp", r: "-10deg", x: "16%", y: "8%", hr: "-16deg", hx: "4%", hy: "2%" },
  { src: "/catalog/set-leopard-gold-640.webp", r: "2deg", x: "0%", y: "-4%", hr: "-1deg", hx: "0%", hy: "-9%" },
  { src: "/catalog/set-babyboomer-strass-640.webp", r: "11deg", x: "-16%", y: "9%", hr: "17deg", hx: "-4%", hy: "4%" },
];

function NailsDoor({ count }: { count: number }) {
  return (
    <Link
      href="/catalogo"
      className="door group bg-bordo text-cream relative isolate flex min-h-[440px] flex-col overflow-hidden rounded-[28px] p-6 md:min-h-[540px] md:p-10"
    >
      {/* cinta leopardo de canto, el acento de la marca */}
      <span aria-hidden className="leopard-bg absolute inset-x-0 bottom-0 -z-10 h-3 md:h-4" />
      <div>
        <h2 className="font-display text-[clamp(3rem,7vw,5.25rem)] leading-[0.95]">Uñas</h2>
        <p className="text-cream/90 mt-3 max-w-[32ch] text-[17px] leading-snug font-semibold">
          Press-on hechas a mano, a tu talle y con kit de colocación. {count > 0 ? `${count} diseños o el tuyo.` : "Del catálogo o el tuyo."}
        </p>
      </div>

      <div aria-hidden className="relative my-6 flex flex-1 items-center justify-center md:my-8">
        {NAIL_PHOTOS.map((p, i) => (
          <span
            key={p.src}
            className="door-sticker relative w-[33%] max-w-[210px] shrink-0"
            style={
              {
                "--r": p.r,
                "--x": p.x,
                "--y": p.y,
                "--hr": p.hr,
                "--hx": p.hx,
                "--hy": p.hy,
                zIndex: i === 1 ? 2 : 1,
              } as React.CSSProperties
            }
          >
            <span className="relative block rounded-[18px] bg-white p-1.5 shadow-[0_20px_40px_-18px_rgba(0,0,0,0.6)] md:p-2">
              <Image
                src={p.src}
                alt=""
                width={640}
                height={800}
                sizes="(min-width: 768px) 210px, 33vw"
                quality={85}
                className="aspect-[4/5] w-full rounded-[13px] object-cover"
              />
              {/* cinta leopardo pegando la foto del medio */}
              {i === 1 && (
                <span className="leopard-bg absolute -top-3 left-1/2 h-6 w-16 -translate-x-1/2 -rotate-6 rounded-[3px] opacity-95 shadow-[0_4px_8px_-4px_rgba(0,0,0,0.4)]" />
              )}
            </span>
          </span>
        ))}
      </div>

      <DoorCta className="bg-cream text-bordo">Ver uñas</DoorCta>
    </Link>
  );
}

function DoorCta({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`rounded-pill inline-flex h-12 w-fit items-center gap-2 px-6 text-[15px] font-bold ${className}`}>
      {children}
      <svg
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="door-arrow size-4"
      >
        <path d="M4 10h12M11 5l5 5-5 5" />
      </svg>
    </span>
  );
}
