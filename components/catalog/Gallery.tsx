"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/format";
import { lockScroll, unlockScroll } from "@/lib/motion";
import { Icon } from "@/components/ui/icons";

/**
 * Galería del detalle (PLAN W2-C.4), pensada para fotos reales en 4:5 (mismo contenido que antes, mejor encuadre).
 *
 * - **Celular**: carrusel a todo el ancho con scroll-snap; contador "1/3" sobre la foto y puntitos debajo (los mueve un
 *   IntersectionObserver al 60 %). Tocar una foto la abre ampliada.
 * - **Desktop** (≥ lg): miniaturas en columna a la izquierda de la foto principal (así la galería entera entra en el
 *   primer viewport), cambio con fundido de 200 ms. Con puntero fino, pasar el mouse amplía 1,8× desde el punto donde
 *   está el puntero; un click la abre ampliada.
 * - **Ampliada**: `<dialog>` modal a pantalla completa sobre bordó. Se pasa de foto deslizando o con las flechas;
 *   doble toque (o click) amplía 2× ahí donde tocaste y se recorre arrastrando; pellizcar también amplía. Se cierra
 *   con el botón, con Esc o deslizando hacia abajo. El foco vuelve a la foto que la abrió.
 */
type Props = {
  /** Fotos en orden (la principal primero). */
  images: string[];
  /** Texto alternativo de cada foto. */
  alts: string[];
  /** Nombre del set (rótulos del carrusel y del visor). */
  name: string;
};

/** Las fotos grandes piden un ancho holgado: con el zoom de 1,8× no se ven blandas. */
const MAIN_SIZES = "(min-width: 1024px) 72vw, 100vw";

export function Gallery({ images, alts, name }: Props) {
  const [active, setActive] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const count = images.length;

  return (
    <div className="min-w-0">
      <MobileCarousel
        images={images}
        alts={alts}
        name={name}
        active={active}
        onActive={setActive}
        onOpen={setZoomAt}
      />
      <DesktopGallery
        images={images}
        alts={alts}
        active={active}
        onActive={setActive}
        onOpen={setZoomAt}
      />
      <ZoomDialog
        images={images}
        alts={alts}
        name={name}
        openAt={zoomAt}
        onClose={(last) => {
          if (last !== null && last >= 0 && last < count) setActive(last);
          setZoomAt(null);
        }}
      />
    </div>
  );
}

/* ---------- Celular: carrusel ---------- */

function MobileCarousel({
  images,
  alts,
  name,
  active,
  onActive,
  onOpen,
}: {
  images: string[];
  alts: string[];
  name: string;
  active: number;
  onActive: (i: number) => void;
  onOpen: (i: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const count = images.length;

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const slides = [...root.querySelectorAll<HTMLElement>("[data-slide]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onActive(Number((e.target as HTMLElement).dataset.slide));
        }
      },
      { root, threshold: 0.6 },
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [onActive, count]);

  return (
    <div className="lg:hidden">
      <div className="relative -mx-[var(--gutter)]">
        <div
          ref={scrollerRef}
          role="region"
          aria-roledescription="carrusel"
          aria-label={`Fotos de ${name}`}
          data-gallery-carousel=""
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              data-slide={i}
              role="group"
              aria-roledescription="foto"
              aria-label={`${i + 1} de ${count}`}
              className="bg-cream-deep relative aspect-[4/5] w-full shrink-0 snap-center snap-always"
            >
              <button
                type="button"
                onClick={() => onOpen(i)}
                aria-label={`Ampliar foto ${i + 1}`}
                className="absolute inset-0 block size-full cursor-zoom-in outline-offset-[-4px]"
              >
                <Image
                  src={src}
                  alt={alts[i] ?? name}
                  fill
                  sizes={MAIN_SIZES}
                  loading={i === 0 ? "eager" : "lazy"}
                  fetchPriority={i === 0 ? "high" : undefined}
                  className="object-cover"
                  draggable={false}
                />
              </button>
            </div>
          ))}
        </div>
        {count > 1 ? (
          <span
            aria-hidden
            className="rounded-pill bg-cream/90 text-ink text-meta tabular pointer-events-none absolute right-[calc(var(--gutter)-4px)] bottom-3 inline-flex h-7 items-center px-2.5"
          >
            {active + 1}/{count}
          </span>
        ) : null}
      </div>
      {count > 1 ? (
        <div aria-hidden data-gallery-dots="" className="mt-3 flex justify-center gap-1.5">
          {images.map((src, i) => (
            <span
              key={src + i}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-200 ease-[var(--ease-ui)]",
                i === active ? "bg-bordo w-5" : "bg-bordo/25 w-1.5",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Desktop: miniaturas + principal con zoom al pasar ---------- */

function DesktopGallery({
  images,
  alts,
  active,
  onActive,
  onOpen,
}: {
  images: string[];
  alts: string[];
  active: number;
  onActive: (i: number) => void;
  onOpen: (i: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const count = images.length;

  // Origen del zoom en el punto del puntero (variables en el escenario; el <img> activo las lee).
  const onMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--zx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--zy", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
  };

  const onThumbKey = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + count) % count;
    onActive(next);
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <div
      className={cn(
        "hidden gap-3 lg:grid",
        count > 1 ? "lg:grid-cols-[76px_minmax(0,1fr)] xl:grid-cols-[88px_minmax(0,1fr)]" : "",
      )}
    >
      {count > 1 ? (
        <div role="group" aria-label="Elegir foto" className="flex flex-col gap-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => onActive(i)}
              onKeyDown={(e) => onThumbKey(e, i)}
              aria-label={`Ver foto ${i + 1} de ${count}`}
              aria-current={i === active ? "true" : undefined}
              tabIndex={i === active ? 0 : -1}
              className={cn(
                "bg-cream-deep relative aspect-[4/5] w-full overflow-hidden rounded-md ring-2 transition-[box-shadow,opacity] duration-200 ease-[var(--ease-ui)]",
                i === active
                  ? "ring-bordo"
                  : "ring-transparent opacity-80 hover:opacity-100 hover:ring-[var(--border-subtle)]",
              )}
            >
              <Image src={src} alt="" fill sizes="(min-width: 1024px) 7vw, 33vw" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={stageRef}
        onPointerMove={onMove}
        onPointerEnter={onMove}
        className="group/zoom bg-cream-deep relative aspect-[4/5] w-full overflow-hidden rounded-xl"
        style={{ "--zx": "50%", "--zy": "50%" } as CSSProperties}
      >
        <button
          type="button"
          onClick={() => onOpen(active)}
          aria-label={`Ampliar foto ${active + 1}`}
          className="absolute inset-0 block size-full cursor-zoom-in rounded-xl outline-offset-[-4px]"
        >
          {images.map((src, i) => (
            <Image
              key={src + i}
              src={src}
              alt={i === active ? (alts[i] ?? "") : ""}
              aria-hidden={i === active ? undefined : true}
              fill
              sizes={MAIN_SIZES}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              draggable={false}
              className={cn(
                "origin-[var(--zx)_var(--zy)] object-cover transition-[opacity,scale] duration-200 ease-[var(--ease-ui)] [@media(pointer:fine)]:group-hover/zoom:scale-[1.8]",
                i === active ? "opacity-100" : "opacity-0",
              )}
            />
          ))}
        </button>
        <span
          aria-hidden
          className="rounded-pill bg-cream/90 text-ink text-meta pointer-events-none absolute right-3 bottom-3 inline-flex h-8 items-center gap-1.5 px-3 transition-opacity duration-200 group-hover/zoom:opacity-0"
        >
          <Icon name="zoom" size={16} />
          Ampliar
        </span>
      </div>
    </div>
  );
}

/* ---------- Visor ampliado ---------- */

/** Cierre por deslizar hacia abajo: distancia (px) o velocidad (px/ms). */
const CLOSE_DY = 80;
const CLOSE_V = 0.11;

function ZoomDialog({
  images,
  alts,
  name,
  openAt,
  onClose,
}: {
  images: string[];
  alts: string[];
  name: string;
  openAt: number | null;
  onClose: (lastIndex: number | null) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const indexRef = useRef(0);
  const count = images.length;

  // Abrir: modal nativo (foco adentro, Esc, el resto inerte) + scroll de la página bloqueado.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || openAt === null) return;
    indexRef.current = openAt;
    if (!dialog.open) dialog.showModal();
    lockScroll();
    // la foto pedida, sin animación de scroll
    requestAnimationFrame(() => {
      const track = trackRef.current;
      if (track) track.scrollLeft = openAt * track.clientWidth;
    });
    return () => unlockScroll();
  }, [openAt]);

  const close = useCallback(() => {
    setZoomed(false);
    dialogRef.current?.close();
  }, []);

  // El evento `close` del <dialog> cubre Esc, el botón y el gesto.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onDialogClose = () => {
      setZoomed(false);
      onClose(indexRef.current);
    };
    dialog.addEventListener("close", onDialogClose);
    return () => dialog.removeEventListener("close", onDialogClose);
  }, [onClose]);

  // Foto actual según el scroll del carril.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || openAt === null) return;
    const slides = [...track.querySelectorAll<HTMLElement>("[data-zoom-slide]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.zoomSlide);
          indexRef.current = i;
          setIndex(i);
        }
      },
      { root: track, threshold: 0.6 },
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [openAt, count]);

  const go = (step: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    setZoomed(false);
    const next = Math.min(count - 1, Math.max(0, indexRef.current + step));
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDialogElement>) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  };

  return (
    <dialog
      ref={dialogRef}
      data-surface="inverse"
      aria-label={`Fotos de ${name}, ampliadas`}
      onKeyDown={onKeyDown}
      data-zoom-dialog=""
      className="bg-bordo/95 text-cream fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden p-0 opacity-0 transition-[opacity,overlay,display] transition-discrete duration-200 ease-[var(--ease-ui)] backdrop:bg-transparent open:opacity-100 starting:open:opacity-0"
    >
      {openAt !== null ? (
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 px-[max(12px,var(--safe-x,0px))] pt-[max(10px,var(--safe-top,0px))] pb-2">
            <p className="text-on-bordo-muted text-sm tabular pl-2" aria-live="polite">
              {index + 1} / {count}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              autoFocus
              className="text-cream grid size-11 place-items-center rounded-full transition-[background-color,scale] duration-150 ease-[var(--ease-ui)] hover:bg-white/10 active:scale-[0.94]"
            >
              <Icon name="close" size={24} />
            </button>
          </div>

          <div
            ref={trackRef}
            className={cn(
              "flex min-h-0 flex-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              zoomed ? "overflow-x-hidden" : "overflow-x-auto",
            )}
          >
            {images.map((src, i) => (
              <ZoomSlide
                key={src + i}
                index={i}
                src={src}
                alt={alts[i] ?? name}
                current={i === index}
                zoomed={zoomed && i === index}
                onZoom={setZoomed}
                onDismiss={close}
              />
            ))}
          </div>

          {count > 1 ? (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between px-4 md:flex">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                aria-label="Foto anterior"
                className="bg-cream/10 text-cream pointer-events-auto grid size-12 place-items-center rounded-full transition-[background-color,opacity] duration-150 hover:bg-cream/20 disabled:opacity-0"
              >
                <Icon name="chevron" size={24} className="rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={index === count - 1}
                aria-label="Foto siguiente"
                className="bg-cream/10 text-cream pointer-events-auto grid size-12 place-items-center rounded-full transition-[background-color,opacity] duration-150 hover:bg-cream/20 disabled:opacity-0"
              >
                <Icon name="chevron" size={24} className="-rotate-90" />
              </button>
            </div>
          ) : null}

          <p className="text-on-bordo-faint text-meta shrink-0 px-6 pt-2 pb-[max(14px,var(--safe-bottom,0px))] text-center">
            <span className="md:hidden">Tocá dos veces para acercar · deslizá hacia abajo para cerrar</span>
            <span className="hidden md:inline">Click para acercar · Esc para cerrar</span>
          </p>
        </div>
      ) : null}
    </dialog>
  );
}

/**
 * Una foto del visor. Sin ampliar: el gesto vertical es nuestro (cerrar deslizando) y el horizontal es del carril
 * (`touch-action: pan-x pinch-zoom`). Ampliada al doble: el contenedor scrollea en los dos ejes y se recorre con el
 * dedo o, con mouse, siguiendo al puntero.
 */
function ZoomSlide({
  index,
  src,
  alt,
  current,
  zoomed,
  onZoom,
  onDismiss,
}: {
  index: number;
  src: string;
  alt: string;
  current: boolean;
  zoomed: boolean;
  onZoom: (z: boolean) => void;
  onDismiss: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; t: number; dy: number } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);

  // Al ampliar, centra el punto tocado.
  const zoomAt = (clientX: number, clientY: number) => {
    const box = boxRef.current;
    if (!box) return;
    const r = box.getBoundingClientRect();
    const fx = (clientX - r.left) / r.width;
    const fy = (clientY - r.top) / r.height;
    onZoom(true);
    requestAnimationFrame(() => {
      box.scrollLeft = fx * box.scrollWidth - r.width / 2;
      box.scrollTop = fy * box.scrollHeight - r.height / 2;
    });
  };

  const setPull = (dy: number) => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = dy ? `translateY(${dy}px) scale(${1 - Math.min(dy, 300) / 1500})` : "";
    const dialog = img.closest("dialog");
    if (dialog) dialog.style.backgroundColor = dy ? `rgb(74 14 14 / ${0.95 - Math.min(dy, 300) / 600})` : "";
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (zoomed || e.pointerType === "mouse" || !e.isPrimary) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), dy: 0 };
    if (imgRef.current) imgRef.current.style.transition = "none";
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d && d.id === e.pointerId) {
      const dy = e.clientY - d.y;
      const dx = e.clientX - d.x;
      if (dy > 0 && dy > Math.abs(dx)) {
        d.dy = dy;
        setPull(dy);
      }
      return;
    }
    // con mouse y ampliada: la foto sigue al puntero
    if (zoomed && e.pointerType === "mouse") {
      const box = boxRef.current;
      if (!box) return;
      const r = box.getBoundingClientRect();
      box.scrollLeft = ((e.clientX - r.left) / r.width) * (box.scrollWidth - r.width);
      box.scrollTop = ((e.clientY - r.top) / r.height) * (box.scrollHeight - r.height);
    }
  };

  const release = (e: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const dt = Math.max(1, performance.now() - d.t);
    const img = imgRef.current;
    if (img) img.style.transition = "transform 220ms var(--ease-drawer)";
    if (!cancelled && (d.dy > CLOSE_DY || (d.dy > 24 && d.dy / dt > CLOSE_V))) {
      onDismiss();
      setPull(0);
      return;
    }
    setPull(0);
    // doble toque: amplía (o vuelve) ahí donde tocaste
    if (cancelled || Math.abs(d.dy) > 8) return;
    const now = performance.now();
    const prev = lastTap.current;
    if (prev && now - prev.t < 300 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 30) {
      lastTap.current = null;
      if (zoomed) onZoom(false);
      else zoomAt(e.clientX, e.clientY);
    } else {
      lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    }
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // mouse: un click acerca o aleja
    if ((e.nativeEvent as PointerEvent).pointerType && (e.nativeEvent as PointerEvent).pointerType !== "mouse") return;
    if (zoomed) onZoom(false);
    else zoomAt(e.clientX, e.clientY);
  };

  return (
    <div
      ref={boxRef}
      data-zoom-slide={index}
      aria-hidden={current ? undefined : true}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => release(e)}
      onPointerCancel={(e) => release(e, true)}
      onClick={onClick}
      className={cn(
        "relative h-full w-full shrink-0 snap-center snap-always",
        zoomed
          ? "cursor-zoom-out overflow-auto [scrollbar-width:none] [touch-action:manipulation] [&::-webkit-scrollbar]:hidden"
          : "cursor-zoom-in overflow-hidden [touch-action:pan-x_pinch-zoom]",
      )}
    >
      <div
        ref={imgRef}
        className={cn(
          "relative transition-[scale] duration-200 ease-[var(--ease-ui)] starting:scale-[0.97]",
          zoomed ? "h-[200%] w-[200%]" : "size-full",
        )}
      >
        <Image src={src} alt={alt} fill sizes="100vw" className="object-contain select-none" draggable={false} />
      </div>
    </div>
  );
}
