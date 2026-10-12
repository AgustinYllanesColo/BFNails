import { LOGO_STAR_PATH } from "@/components/brand/LogoStar";
import { MQ } from "@/lib/motion-core";

type BurstOptions = {
  /** Cantidad de estrellas. */
  count?: number;
  /** Distancia recorrida en px, `[mín, máx]`. */
  radius?: [number, number];
  /** Lado de cada estrella en px en su punto más grande (al terminar de abrirse), `[mín, máx]`. */
  sizes?: [number, number];
  /** Rellenos, alternados. Sobre crema: bordó estrella y rojo moño. */
  colors?: string[];
  /** Duración de cada estrella en ms. */
  duration?: number;
};

const SVG_NS = "http://www.w3.org/2000/svg";

const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);

/**
 * Ráfaga de estrellas del logo (PLAN F2.16; contrato §5: una sola ráfaga en todo el sitio, la del sello del pedido).
 * Crea las estrellas en una capa `fixed` propia fuera de React, las anima con WAAPI (en el compositor) desde el centro
 * de `originEl` y borra todo al terminar. Con reduced-motion no hace nada: el sello solo aparece.
 *
 * Dos animaciones por estrella, sobre propiedades de transform individuales (no se pisan):
 * - vuelo (`translate` + `rotate`) con curva expo: sale disparada y frena;
 * - vida (`scale` + `opacity`) lineal en el tiempo: se abre a tamaño completo en ~80 ms, se queda grande y opaca
 *   mientras vuela y recién en la segunda mitad se achica y se apaga. Con la opacidad atada a la curva del vuelo, la
 *   estrella llegaba a su tamaño cuando ya estaba casi transparente y la ráfaga se leía como polvo.
 */
export function starBurst(
  originEl: Element | null | undefined,
  {
    count = 8,
    radius = [50, 100],
    sizes = [10, 18],
    colors = ["var(--bordo-star)", "var(--red-600)"],
    duration = 680,
  }: BurstOptions = {},
): void {
  if (!originEl || typeof window === "undefined") return;
  if (window.matchMedia(MQ.reduced).matches) return;
  const r = originEl.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.dataset.starBurst = "";
  layer.style.cssText =
    "position:fixed;inset:0;z-index:90;pointer-events:none;overflow:hidden;contain:strict";

  const step = (Math.PI * 2) / count;
  const offset = Math.random() * step;
  const animations: Animation[] = [];
  for (let i = 0; i < count; i++) {
    const size = between(sizes);
    const angle = offset + i * step + (Math.random() - 0.5) * step * 0.5;
    const dist = between(radius);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const spin = (i % 2 ? 1 : -1) * 90;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.style.cssText = `position:absolute;left:${cx - size / 2}px;top:${cy - size / 2}px;overflow:visible`;
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", LOGO_STAR_PATH);
    path.style.fill = colors[i % colors.length];
    svg.appendChild(path);
    layer.appendChild(svg);

    const timing = { duration, delay: Math.random() * 60, fill: "both" } as const;
    animations.push(
      svg.animate(
        [
          { translate: "0px 0px", rotate: "0deg" },
          { translate: `${dx}px ${dy}px`, rotate: `${spin}deg` },
        ],
        { ...timing, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      ),
      svg.animate(
        [
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, offset: 0.12 },
          { scale: 0.9, opacity: 1, offset: 0.5 },
          { scale: 0.5, opacity: 0 },
        ],
        { ...timing, easing: "linear" },
      ),
    );
  }

  document.body.appendChild(layer);
  Promise.allSettled(animations.map((a) => a.finished)).then(() => layer.remove());
}
