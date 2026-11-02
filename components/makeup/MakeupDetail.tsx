"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { isVideoUrl, makeupMedia, type MakeupProduct } from "@/lib/data/makeup";
import { cn, formatARS } from "@/lib/format";
import { MakeupVisual } from "./MakeupArt";
import { AddMakeupToCart } from "./AddMakeupToCart";

/**
 * Vista ampliada de un producto de maquillaje: fotos y videos en grande (se deslizan de costado, con miniaturas),
 * nombre, marca, precio, la descripción corta y sencilla y el botón para sumarlo con su tono.
 * Es un <dialog> nativo: Esc lo cierra, el foco queda adentro y vuelve a la tarjeta al cerrar.
 */
export function MakeupDetail({ product, open, onClose }: { product: MakeupProduct; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // sin scroll de fondo mientras está abierta
      const html = document.documentElement;
      const prev = html.style.overflow;
      html.style.overflow = "hidden";
      return () => {
        html.style.overflow = prev;
      };
    }
    if (!open && d.open) d.close();
  }, [open]);

  const sale = product.priceBefore != null && product.priceBefore > product.price;
  const text = product.details || product.description;
  const titleId = `${product.id}-detalle`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // tocar afuera del panel cierra
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="backdrop:bg-ink/60 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 backdrop:backdrop-blur-[2px] md:p-6 md:open:grid md:open:place-items-center"
    >
      {open && (
        <div
          className={cn(
            "bg-cream absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col overflow-y-auto overscroll-contain rounded-t-2xl shadow-2xl",
            "md:relative md:inset-auto md:grid md:h-[min(88dvh,820px)] md:max-h-none md:w-full md:max-w-5xl md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:overflow-hidden md:rounded-2xl",
            "transition-[opacity,translate] duration-300 ease-[var(--ease-out-expo)] starting:translate-y-8 starting:opacity-0 motion-reduce:transition-none",
          )}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-ink focus-visible:outline-bordo absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <Gallery product={product} />

          <div className="flex flex-col px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:overflow-y-auto md:px-8 md:pt-10 md:pb-8">
            {product.brand && <p className="text-lip text-[13px] font-bold tracking-wider uppercase">{product.brand}</p>}
            <h2 id={titleId} className="font-title text-ink mt-1 text-[28px] leading-[1.05] text-balance md:text-4xl">
              {product.name}
            </h2>
            <p className="text-lip mt-3 flex flex-wrap items-baseline gap-x-2 text-xl font-bold tabular-nums">
              {sale && (
                <s className="text-ink-soft text-sm font-semibold">
                  <span className="sr-only">Antes </span>
                  {formatARS(product.priceBefore!)}
                </s>
              )}
              {sale && <span className="sr-only">, ahora </span>}
              {formatARS(product.price)}
            </p>
            {text && <p className="text-ink mt-4 max-w-[52ch] text-[15px] leading-relaxed text-pretty whitespace-pre-line">{text}</p>}
            {product.details && product.description && product.details !== product.description && (
              <p className="text-ink-soft mt-2 text-[13px] leading-snug">{product.description}</p>
            )}
            {product.stock === 1 && <p className="text-lip mt-3 text-[13px] font-semibold">Queda una sola unidad.</p>}
            <div className="mt-6 md:mt-auto md:pt-8">
              <AddMakeupToCart product={product} />
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

/** Fotos y videos en grande. En el celu se deslizan con el dedo; en la compu, con las flechas o las miniaturas. */
function Gallery({ product }: { product: MakeupProduct }) {
  const media = makeupMedia(product);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // cuál se ve: el que está más centrado en la pista
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) {
      setActive(i);
      // corre solo el video que se está viendo (sin sonido, en bucle, como en la tarjeta)
      el.querySelectorAll<HTMLVideoElement>("[data-slide] video").forEach((v) => {
        if (v.closest<HTMLElement>("[data-slide]")?.dataset.slide === String(i)) v.play().catch(() => {});
        else v.pause();
      });
    }
  };
  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(media.length - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  if (media.length === 0) {
    return (
      <div className="md:h-full">
        <MakeupVisual product={product} sizes="(min-width: 768px) 55vw, 100vw" className="rounded-none ring-0 md:aspect-auto md:h-full" />
      </div>
    );
  }

  return (
    <div className="bg-cream-deep relative flex flex-col md:h-full md:min-h-0">
      <div
        ref={track}
        onScroll={onScroll}
        className="flex aspect-[4/5] max-h-[62dvh] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] md:aspect-auto md:max-h-none md:min-h-0 md:flex-1 [&::-webkit-scrollbar]:hidden"
        aria-roledescription="carrusel"
        aria-label={`Fotos de ${product.name}`}
      >
        {media.map((url, i) => (
          <div
            key={url}
            data-slide={i}
            className="relative h-full w-full shrink-0 snap-center"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${media.length}`}
          >
            {isVideoUrl(url) ? (
              <video
                src={url}
                controls
                muted
                loop
                playsInline
                preload="metadata"
                autoPlay={i === 0 && !matchMedia("(prefers-reduced-motion: reduce)").matches}
                className="absolute inset-0 size-full object-contain"
              />
            ) : (
              <Image
                src={url}
                alt={i === 0 ? product.name : `${product.name}, foto ${i + 1}`}
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                quality={90}
                preload={i === 0}
                className="object-contain"
              />
            )}
          </div>
        ))}
      </div>

      {media.length > 1 && (
        <>
          <NavArrow dir={-1} disabled={active === 0} onClick={() => go(active - 1)} />
          <NavArrow dir={1} disabled={active === media.length - 1} onClick={() => go(active + 1)} />
          <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] md:absolute md:inset-x-0 md:bottom-0 md:justify-center md:bg-gradient-to-t md:from-black/25 md:to-transparent md:pt-8">
            {media.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ver ${isVideoUrl(url) ? "video" : "foto"} ${i + 1} de ${media.length}`}
                aria-current={i === active || undefined}
                className={cn(
                  "bg-cream relative size-14 shrink-0 overflow-hidden rounded-md ring-2 transition-[box-shadow,opacity] duration-200",
                  "focus-visible:outline-bordo focus-visible:outline-2 focus-visible:outline-offset-2",
                  i === active ? "ring-bordo" : "opacity-70 ring-transparent hover:opacity-100",
                )}
              >
                {isVideoUrl(url) ? (
                  <>
                    <video src={url} muted playsInline preload="metadata" className="pointer-events-none size-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center bg-black/25 text-white" aria-hidden>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </>
                ) : (
                  <Image src={url} alt="" fill sizes="56px" className="object-cover" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NavArrow({ dir, disabled, onClick }: { dir: -1 | 1; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir < 0 ? "Foto anterior" : "Foto siguiente"}
      className={cn(
        "text-ink absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-md transition-opacity duration-200 md:grid",
        "focus-visible:outline-bordo focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-0",
        dir < 0 ? "left-3" : "right-3",
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={dir < 0 ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}
