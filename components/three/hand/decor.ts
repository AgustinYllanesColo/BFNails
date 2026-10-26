import type { Shape } from "@/lib/types";
import { mulberry32 } from "./anatomy";
import { halfWidth, type NailDims } from "./nail";
import { paintArt } from "./art";

/**
 * Decoración pintada por uña en un canvas 2D (≤ 512 px). El canvas se dibuja en centímetros
 * de la uña: x ∈ [-W/2, W/2] a lo ancho, y ∈ [0, Lref] desde la cutícula hacia la punta,
 * para que los círculos sigan siendo círculos sobre la uña (los UV usan la misma escala).
 */

export const DECAL_W = 256;
export const DECAL_H = 512;

export type DecorInput = {
  index: number; // 0 pulgar … 4 meñique
  /** uña de las 10 (0–4 derecha, 5–9 izquierda) */
  nail: number;
  /** diseño del catálogo con dibujo propio (art.ts); si lo tiene, reemplaza a las técnicas pintadas */
  art?: string;
  /** color de la base del set (el aura lo aclara en el centro) */
  baseHex: string;
  shape: Shape;
  dims: NailDims;
  extras: string[];
  tipHex: string;
  /** color de los diseños (puntitos, ondas, cebra, estrellitas, tribal) */
  detailHex: string;
  /** color al que llega el degradé */
  degradeHex: string;
  /** esta uña es acento: lleva las técnicas del set más las suyas (ya sumadas en `extras`) */
  isAccent: boolean;
  /** color propio de la uña acento (se pinta como base opaca debajo de todo); null = el de la base del set */
  accentHex: string | null;
  kitty: HTMLImageElement | null;
};

export function decorKey(i: DecorInput) {
  const relevant = i.extras.filter((e) => PAINTED.has(e)).sort();
  if (relevant.length === 0 && !i.accentHex && !i.art) return "none";
  return [i.shape, i.dims.L.toFixed(3), relevant.join(","), i.tipHex, i.detailHex, i.degradeHex, i.isAccent ? "a" : "", i.accentHex ?? "", i.kitty ? "k" : "", i.art ?? "", i.art ? i.nail : "", relevant.includes("aura") ? i.baseHex : ""].join("|");
}

const PAINTED = new Set([
  "carey",
  "francesita",
  "francesita-color",
  "degrade",
  "animal-print",
  "flores",
  "personajes",
  "a-mano",
  "encapsulado",
  "puntitos",
  "cebra",
  "ondas",
  "estrellas",
  "tribal",
  "perlas",
  "strass-colores",
  "cadenas",
  "aura",
]);

/** "#rrggbb" + alfa → rgba() */
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function outline(ctx: CanvasRenderingContext2D, shape: Shape, d: NailDims) {
  const N = 60;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const y = (i / N) * d.L;
    const x = -halfWidth(shape, y, d);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const y = (i / N) * d.L;
    ctx.lineTo(halfWidth(shape, y, d), y);
  }
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr, y - Math.sin(a) * rr);
  }
  ctx.closePath();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  // en este canvas y crece hacia la punta; dibujamos el corazón "parado" hacia la punta
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.9);
  ctx.bezierCurveTo(x + s * 1.2, y - s * 0.1, x + s * 0.9, y + s * 0.9, x, y + s * 0.4);
  ctx.bezierCurveTo(x - s * 0.9, y + s * 0.9, x - s * 1.2, y - s * 0.1, x, y - s * 0.9);
  ctx.closePath();
}

/** dibuja la decoración en el canvas (transparente donde no hay nada) */
export function paintDecor(canvas: HTMLCanvasElement, input: DecorInput) {
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { dims: d, shape, extras, index: i } = input;
  const has = (x: string) => extras.includes(x);
  const detail = input.detailHex;
  if (decorKey(input) === "none") return;

  const sx = canvas.width / d.W;
  const sy = canvas.height / d.Lref;
  ctx.setTransform(sx, 0, 0, -sy, canvas.width / 2, canvas.height);
  const px = 1 / sx; // 1 px del canvas en cm
  const rand = mulberry32(1000 + i * 97);
  const W = d.W;

  ctx.save();
  outline(ctx, shape, d);
  ctx.clip();

  // 0. uña acento con color propio: base opaca debajo de todo (el acabado del set sigue arriba)
  if (input.accentHex) {
    ctx.fillStyle = input.accentHex;
    ctx.fillRect(-W, 0, W * 2, d.Lref);
  }

  // 0b. diseño del catálogo con dibujo propio: se pinta como en la foto de Brenda y no lo genérico
  if (
    input.art &&
    paintArt(input.art, {
      ctx,
      d,
      W,
      px,
      finger: i,
      nail: input.nail,
      shape,
      baseHex: input.baseHex,
      accentHex: input.accentHex,
      tipHex: input.tipHex,
      detailHex: detail,
      rand,
      outline: () => outline(ctx, shape, d),
    })
  ) {
    ctx.restore();
    return;
  }

  // 0c. aura: la base se enciende en el centro y se apaga hacia los bordes (como el Bordó aura de Brenda)
  if (has("aura")) {
    const baseHex = input.accentHex ?? input.baseHex;
    const n = parseInt(baseHex.slice(1), 16);
    const [r0, g0, b0] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    // se enciende hacia un tono cálido (como el gel iluminado desde adentro), no hacia el blanco
    const light = (k: number) => `rgba(${Math.round(r0 + (255 - r0) * k)},${Math.round(g0 + (120 - g0) * k)},${Math.round(b0 + (70 - b0) * k)}`;
    const cx = 0;
    const cy = d.L * 0.5;
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, d.L * 0.55);
    glow.addColorStop(0, `${light(0.55)},0.95)`);
    glow.addColorStop(0.45, `${light(0.25)},0.5)`);
    glow.addColorStop(1, `${light(0)},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(-W, 0, W * 2, d.Lref);
    const shade = ctx.createRadialGradient(cx, cy, d.L * 0.3, cx, cy, d.L * 0.92);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = shade;
    ctx.fillRect(-W, 0, W * 2, d.Lref);
  }

  // 1. degradé: babyboomer (blanco lechoso) o de color (sunset, rosa a negro) hacia la punta
  if (has("degrade")) {
    const g = ctx.createLinearGradient(0, d.L * 0.22, 0, d.L);
    g.addColorStop(0, rgba(input.degradeHex, 0));
    g.addColorStop(0.55, rgba(input.degradeHex, 0.6));
    g.addColorStop(1, rgba(input.degradeHex, 0.98));
    ctx.fillStyle = g;
    ctx.fillRect(-W, 0, W * 2, d.Lref);
  }

  // 2. encapsulado: velo lechoso con foil dorado y pétalos secos atrapados
  if (has("encapsulado")) {
    ctx.fillStyle = "rgba(255,250,244,0.1)";
    ctx.fillRect(-W, 0, W * 2, d.Lref);
    for (let k = 0; k < 9; k++) {
      const cx = (rand() - 0.5) * W * 0.8;
      const cy = d.L * (0.18 + rand() * 0.7);
      const r = W * (0.05 + rand() * 0.07);
      // foil metálico: cada pieza con su degradé de luz a sombra
      const g = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      const pale = rand() > 0.65;
      g.addColorStop(0, pale ? "#fffbe8" : "#fff4c8");
      g.addColorStop(0.45, pale ? "#e9d39a" : "#d8b25a");
      g.addColorStop(1, pale ? "#a8874a" : "#8a6420");
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.85 + rand() * 0.15;
      ctx.beginPath();
      const sides = 5 + Math.floor(rand() * 3);
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2 + rand() * 0.6;
        const rr = r * (0.5 + rand() * 0.7);
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // pétalos secos: dos tonos y nervadura
    for (let k = 0; k < 5; k++) {
      const cx = (rand() - 0.5) * W * 0.7;
      const cy = d.L * (0.25 + rand() * 0.6);
      const pink = rand() > 0.5;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rand() * Math.PI);
      for (let p = 0; p < 4; p++) {
        ctx.rotate(Math.PI / 2);
        const g = ctx.createLinearGradient(0, 0, 0, W * 0.1);
        g.addColorStop(0, pink ? "rgba(206,110,138,0.85)" : "rgba(222,176,70,0.85)");
        g.addColorStop(1, pink ? "rgba(246,188,204,0.7)" : "rgba(250,226,150,0.7)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, W * 0.05, W * 0.03, W * 0.055, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pink ? "rgba(150,70,90,0.35)" : "rgba(140,96,30,0.35)";
        ctx.lineWidth = px * 2;
        ctx.beginPath();
        ctx.moveTo(0, W * 0.012);
        ctx.lineTo(0, W * 0.095);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 3. animal print: rosetas de leopardo (centro tostado + anillo cortado oscuro)
  if (has("animal-print")) {
    const count = Math.round(9 + (d.L / W) * 4);
    for (let k = 0; k < count; k++) {
      const cx = (rand() - 0.5) * W * 1.05;
      const cy = d.L * (0.08 + rand() * 0.9);
      const r = W * (0.05 + rand() * 0.07);
      const rot = rand() * Math.PI;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      // leopardo de la marca: centro #c9a063, anillo café
      ctx.fillStyle = "rgba(201,160,99,0.9)";
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.82, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(59,36,22,0.95)";
      ctx.lineCap = "round";
      ctx.lineWidth = r * 0.28;
      const arcs = 3 + Math.floor(rand() * 2);
      for (let a = 0; a < arcs; a++) {
        const start = (a / arcs) * Math.PI * 2 + rand() * 0.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.78, 0, start, start + (Math.PI * 2) / arcs - 0.55 - rand() * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }
    // manchas sueltas pequeñas (~30 % del total)
    for (let k = 0; k < Math.round(count * 0.45); k++) {
      ctx.fillStyle = "rgba(59,36,22,0.9)";
      ctx.beginPath();
      ctx.ellipse((rand() - 0.5) * W, d.L * rand(), W * 0.03, W * 0.022, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. flores a mano
  // en todo el set van una sí, una no (pulgar, mayor, meñique); en una uña acento, siempre
  if (has("flores") && (input.isAccent || i % 2 === 0)) {
    const cy = d.bed * 0.58;
    const r = W * 0.17;
    ctx.save();
    ctx.translate(W * 0.04, cy);
    for (let p = 0; p < 5; p++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.fillStyle = "#f4b3cb";
      ctx.beginPath();
      ctx.ellipse(0, r * 0.95, r * 0.55, r * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = px * 4;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.35);
      ctx.lineTo(0, r * 1.25);
      ctx.stroke();
    }
    ctx.fillStyle = "#f5c400";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(160,110,0,0.5)";
    for (let s = 0; s < 6; s++) {
      ctx.beginPath();
      ctx.arc(Math.cos(s) * r * 0.18, Math.sin(s * 1.7) * r * 0.18, px * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = "#ffffff";
    for (const [dx, dy, rr] of [
      [-0.28, 0.95, 0.035],
      [0.3, 0.3, 0.028],
      [-0.22, 0.22, 0.022],
    ]) {
      ctx.beginPath();
      ctx.arc(W * dx, cy + d.bed * (dy - 0.58), W * rr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. dibujo a mano alzada: corazones, estrellas y trazos finos
  if (has("a-mano")) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const lw = px * 4.5;
    if (i % 2 === 0) {
      ctx.strokeStyle = "#3c3c3c";
      ctx.lineWidth = lw;
      star(ctx, W * 0.05, d.bed * 0.62, W * 0.2, 0.2);
      ctx.stroke();
      ctx.fillStyle = "#4a0e0e";
      star(ctx, -W * 0.22, d.bed * 0.25, W * 0.08, -0.3);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(W * 0.25, d.bed * 0.3, W * 0.03, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#4a0e0e";
      ctx.lineWidth = lw;
      heart(ctx, 0, d.bed * 0.6, W * 0.17);
      ctx.stroke();
      ctx.strokeStyle = "#3c3c3c";
      ctx.beginPath();
      for (let s = 0; s <= 30; s++) {
        const x = -W / 2 + (s / 30) * W;
        const y = d.bed * 0.22 + Math.sin(s * 0.9) * W * 0.04;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // 6. puntitos: filas alternadas de lunares en el color del detalle, con un brillo cada uno. Con francesita van
  // sobre la punta (como el set de lunares de Brenda): se pintan después, en el paso 10.
  const french = has("francesita") || has("francesita-color");
  const dots = (from: number, r: number, step: number) => {
    let row = 0;
    for (let y = from; y < d.L + r; y += step, row++) {
      for (let x = -W / 2 + (row % 2 ? step / 2 : 0); x < W / 2 + r; x += step * 1.1) {
        ctx.fillStyle = detail;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y + r * 0.3, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  if (has("puntitos") && !french) dots(d.bed * 0.12, W * 0.075, W * 0.27);

  // 7. cebra / tigre: rayas cruzadas que se afinan en las puntas, irregulares como pintadas a pincel
  if (has("cebra")) {
    ctx.fillStyle = detail;
    const n = Math.round(4 + d.L / W * 2.2);
    for (let k = 0; k < n; k++) {
      const y0 = d.L * ((k + 0.3 + rand() * 0.4) / n);
      const fromLeft = k % 2 === 0;
      const len = W * (0.55 + rand() * 0.35);
      const thick = W * (0.07 + rand() * 0.05);
      const tilt = (rand() - 0.5) * W * 0.5;
      const x0 = fromLeft ? -W * 0.6 : W * 0.6;
      const x1 = fromLeft ? x0 + len : x0 - len;
      ctx.beginPath();
      ctx.moveTo(x0, y0 - thick);
      ctx.quadraticCurveTo((x0 + x1) / 2, y0 + tilt * 0.5 - thick * 0.6, x1, y0 + tilt);
      ctx.quadraticCurveTo((x0 + x1) / 2, y0 + tilt * 0.5 + thick * 0.6, x0, y0 + thick);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 8. ondas: dos o tres líneas sinuosas a lo largo de la uña (como el set rosa de ondas de Brenda)
  if (has("ondas")) {
    ctx.strokeStyle = detail;
    ctx.lineCap = "round";
    ctx.lineWidth = W * 0.07;
    const lines = 3;
    for (let k = 0; k < lines; k++) {
      const off = (k - (lines - 1) / 2) * W * 0.32 + (i % 2 ? W * 0.05 : -W * 0.05);
      const phase = i * 0.9 + k * 0.6;
      ctx.beginPath();
      for (let sN = 0; sN <= 40; sN++) {
        const y = d.bed * 0.05 + (sN / 40) * (d.L * 1.02);
        const x = off + Math.sin(phase + (y / d.L) * Math.PI * 2.2) * W * 0.16;
        if (sN === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // 9. estrellitas: una estrella de cuatro puntas grande, dos chicas y puntos de brillo
  if (has("estrellas")) {
    const sparkle = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rr = k % 2 === 0 ? r : r * 0.22;
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    };
    ctx.fillStyle = detail;
    sparkle(W * (i % 2 ? -0.08 : 0.1), d.bed * 0.6, W * 0.24);
    sparkle(-W * 0.22, d.bed * 0.25 + d.L * 0.1, W * 0.1);
    sparkle(W * 0.24, d.L * 0.82, W * 0.12);
    for (const [dx, dy] of [
      [0.28, 0.32],
      [-0.25, 0.75],
      [0.05, 0.95],
    ]) {
      ctx.beginPath();
      ctx.arc(W * dx, d.L * dy, W * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 9b. carey: ámbar translúcido con manchas café de bordes difusos, como el caparazón de tortuga
  if (has("carey")) {
    // fondo ámbar que deja ver la base
    const amber = ctx.createLinearGradient(0, 0, 0, d.L);
    amber.addColorStop(0, "rgba(214,140,62,0.72)");
    amber.addColorStop(0.5, "rgba(196,116,40,0.78)");
    amber.addColorStop(1, "rgba(222,156,76,0.7)");
    ctx.fillStyle = amber;
    ctx.fillRect(-W, 0, W * 2, d.Lref);
    // manchas grandes: radiales con el centro casi negro y borde que se funde en el ámbar
    const blobs = Math.round(5 + (d.L / W) * 2.5);
    for (let k = 0; k < blobs; k++) {
      const cx = (rand() - 0.5) * W * 1.1;
      const cy = d.L * (0.05 + rand() * 0.9);
      const rx = W * (0.16 + rand() * 0.16);
      const ry = rx * (0.55 + rand() * 0.5);
      const rot = rand() * Math.PI;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, "rgba(46,22,8,0.96)");
      g.addColorStop(0.45, "rgba(78,36,12,0.85)");
      g.addColorStop(0.8, "rgba(128,64,22,0.4)");
      g.addColorStop(1, "rgba(160,90,34,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // vetas finas y puntos chicos entre las manchas
    for (let k = 0; k < blobs * 2; k++) {
      const cx = (rand() - 0.5) * W;
      const cy = d.L * rand();
      const r = W * (0.03 + rand() * 0.05);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(60,28,10,0.8)");
      g.addColorStop(1, "rgba(60,28,10,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // reflejos cálidos: zonas más claras, miel, para que no quede chato
    for (let k = 0; k < 3; k++) {
      const cx = (rand() - 0.5) * W;
      const cy = d.L * (0.15 + rand() * 0.7);
      const r = W * (0.12 + rand() * 0.1);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(246,196,110,0.5)");
      g.addColorStop(1, "rgba(246,196,110,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 10. francesita (blanca o de color) sobre los patrones, con línea de sonrisa
  if (has("francesita") || has("francesita-color")) {
    const free = d.L - d.bed;
    // sonrisa suave: la punta no cubre la mitad de la uña
    const depth = Math.min(d.L * 0.45, 0.12 * W + 0.85 * free);
    const yc = d.L - depth;
    const drop = 0.12 * W;
    ctx.fillStyle = input.tipHex;
    ctx.beginPath();
    ctx.moveTo(-W, yc - drop * 1.3);
    for (let s = 0; s <= 40; s++) {
      const x = -W / 2 + (s / 40) * W;
      ctx.lineTo(x, yc - drop * Math.pow((2 * x) / W, 2));
    }
    ctx.lineTo(W, yc - drop * 1.3);
    ctx.lineTo(W, d.Lref + 1);
    ctx.lineTo(-W, d.Lref + 1);
    ctx.closePath();
    ctx.fill();
    if (has("puntitos")) {
      // lunares solo dentro de la punta
      ctx.save();
      ctx.clip();
      dots(yc - drop * 1.2 + W * 0.07, W * 0.075, W * 0.26);
      ctx.restore();
    }
  }


  // 11. tribal: trazos curvos que nacen del borde libre con puntas afiladas (como el Tribal french de Brenda)
  if (has("tribal")) {
    ctx.fillStyle = detail;
    const blade = (x0: number, y0: number, x1: number, y1: number, cx: number, cy: number, w: number) => {
      ctx.beginPath();
      ctx.moveTo(x0 - w, y0);
      ctx.quadraticCurveTo(cx - w * 0.6, cy, x1, y1);
      ctx.quadraticCurveTo(cx + w * 0.6, cy, x0 + w, y0);
      ctx.closePath();
      ctx.fill();
    };
    const top = d.L;
    const flip = i % 2 ? -1 : 1;
    blade(0, top + 0.05, flip * W * 0.1, d.bed * 0.3, flip * W * 0.36, top * 0.72, W * 0.18);
    blade(-W * 0.34 * flip, top, -W * 0.02 * flip, top * 0.5, -W * 0.46 * flip, top * 0.7, W * 0.11);
    blade(W * 0.36 * flip, top, W * 0.18 * flip, top * 0.55, W * 0.5 * flip, top * 0.78, W * 0.1);
  }

  // 12. personajes: la Kitty de la marca en el anular
  if (has("personajes") && i === 3 && input.kitty) {
    const img = input.kitty;
    const w = W * 0.78;
    const h = (w * img.naturalHeight) / img.naturalWidth;
    ctx.save();
    ctx.translate(0, d.bed * 0.55);
    ctx.scale(1, -1);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }


  // 13. perlas: tres o cuatro perlas con su sombra y su brillo, cerca de la cutícula
  if (has("perlas")) {
    const pearl = (x: number, y: number, r: number) => {
      const g = ctx.createRadialGradient(x - r * 0.35, y + r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, "#fffefb");
      g.addColorStop(0.55, "#f3ece2");
      g.addColorStop(1, "#c9bba8");
      ctx.fillStyle = "rgba(60,40,30,0.18)";
      ctx.beginPath();
      ctx.arc(x + r * 0.12, y - r * 0.16, r * 1.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(x - r * 0.35, y + r * 0.35, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    };
    const r = W * 0.16;
    if (input.isAccent || i % 2 === 1) {
      // corazón de perlas
      for (const [dx, dy] of [
        [0, -0.32],
        [-0.17, -0.16],
        [0.17, -0.16],
        [-0.28, 0.04],
        [0.28, 0.04],
        [-0.15, 0.17],
        [0.15, 0.17],
      ]) pearl(W * dx * 1.35, d.bed * 0.55 + W * dy * 1.45, r * 0.62);
    } else {
      pearl(0, d.bed * 0.3, r);
    }
  }

  // 14. gemas de colores: piedritas facetadas en la punta (como el Candy gems de Brenda)
  if (has("strass-colores")) {
    const COLORS = ["#e0337f", "#2f8fe0", "#f5c400", "#35b06a", "#9b5de5", "#ff7a3d"];
    const gem = (x: number, y: number, r: number, c: string) => {
      ctx.fillStyle = "rgba(40,20,20,0.25)";
      ctx.beginPath();
      ctx.arc(x + r * 0.1, y - r * 0.14, r, 0, Math.PI * 2);
      ctx.fill();
      const g = ctx.createRadialGradient(x - r * 0.3, y + r * 0.3, r * 0.05, x, y, r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.35, c);
      g.addColorStop(1, rgba(c, 0.85));
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4 + Math.PI / 8;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    };
    const n = input.isAccent ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const x = (k - (n - 1) / 2) * W * 0.26;
      gem(x, d.L * 0.86 - Math.abs(x) * 0.3, W * 0.1, COLORS[(i * 2 + k) % COLORS.length]);
    }
  }

  // 15. cadenitas doradas: eslabones que cruzan la uña en curva, como colgadas (Leo star gold de Brenda)
  if (has("cadenas")) {
    const link = (x: number, y: number, ang: number, r: number, flat: boolean) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(-r, r, r, -r);
      g.addColorStop(0, "#8a6420");
      g.addColorStop(0.45, "#f6dc8c");
      g.addColorStop(1, "#b88a2e");
      ctx.strokeStyle = g;
      ctx.lineWidth = r * (flat ? 0.55 : 0.7);
      ctx.beginPath();
      ctx.ellipse(0, 0, r, flat ? r * 0.38 : r * 0.62, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };
    const drape = (y0: number, y1: number, sag: number) => {
      // curva de borde a borde: punto de control abajo, como una cadena que cuelga
      const x0 = -W * 0.62;
      const x1 = W * 0.62;
      const cy = (y0 + y1) / 2 - sag;
      const r = W * 0.05;
      const steps = Math.ceil((W * 1.3) / (r * 1.45));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * 0 + t * t * x1;
        const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
        const dx = 2 * (1 - t) * (0 - x0) + 2 * t * (x1 - 0);
        const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
        link(x, y, Math.atan2(dy, dx), r, k % 2 === 1);
      }
    };
    drape(d.L * 0.62, d.L * 0.48, d.L * 0.12);
    if (input.isAccent || d.L > W * 1.6) drape(d.L * 0.4, d.L * 0.3, d.L * 0.08);
  }

  ctx.restore();
}
