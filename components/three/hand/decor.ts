import type { Shape } from "@/lib/types";
import { mulberry32 } from "./anatomy";
import { halfWidth, type NailDims } from "./nail";

/**
 * Decoración pintada por uña en un canvas 2D (≤ 512 px). El canvas se dibuja en centímetros
 * de la uña: x ∈ [-W/2, W/2] a lo ancho, y ∈ [0, Lref] desde la cutícula hacia la punta,
 * para que los círculos sigan siendo círculos sobre la uña (los UV usan la misma escala).
 */

export const DECAL_W = 256;
export const DECAL_H = 512;

export type DecorInput = {
  index: number; // 0 pulgar … 4 meñique
  shape: Shape;
  dims: NailDims;
  extras: string[];
  tipHex: string;
  kitty: HTMLImageElement | null;
};

export function decorKey(i: DecorInput) {
  const relevant = i.extras.filter((e) => PAINTED.has(e)).sort();
  if (relevant.length === 0) return "none";
  return [i.shape, i.dims.L.toFixed(3), relevant.join(","), i.tipHex, i.kitty ? "k" : ""].join("|");
}

const PAINTED = new Set(["francesita", "francesita-color", "degrade", "animal-print", "flores", "personajes", "a-mano", "encapsulado"]);

/** contorno de la uña agrandado `grow` cm: la pintura pasa apenas el borde (sin bordes punteados al muestrear) */
function outline(ctx: CanvasRenderingContext2D, shape: Shape, d: NailDims, grow = 0) {
  const N = 60;
  ctx.beginPath();
  ctx.moveTo(0, -grow);
  for (let i = 0; i <= N; i++) {
    const y = (i / N) * d.L;
    ctx.lineTo(-halfWidth(shape, y, d) - grow, y);
  }
  ctx.lineTo(0, d.L + grow);
  for (let i = N; i >= 0; i--) {
    const y = (i / N) * d.L;
    ctx.lineTo(halfWidth(shape, y, d) + grow, y);
  }
  ctx.closePath();
}

/** mancha orgánica: polígono con radio ruidoso suavizado con curvas (nada de elipses perfectas) */
function blobPath(ctx: CanvasRenderingContext2D, rand: () => number, cx: number, cy: number, rx: number, ry: number, rot: number, wobble = 0.28, n = 9) {
  const pts: Array<[number, number]> = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const r = 1 + (rand() - 0.5) * 2 * wobble;
    const x = Math.cos(a) * rx * r;
    const y = Math.sin(a) * ry * r;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  ctx.beginPath();
  const mid = (i: number) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1);
  ctx.moveTo(m0[0], m0[1]);
  for (let k = 0; k < n; k++) {
    const m = mid(k);
    ctx.quadraticCurveTo(pts[k][0], pts[k][1], m[0], m[1]);
  }
  ctx.closePath();
}

/** trozo de anillo de roseta: una "C" gruesa en el medio y afinada en las puntas, con borde irregular */
function arcBlob(ctx: CanvasRenderingContext2D, rand: () => number, cx: number, cy: number, R: number, ry: number, rot: number, a0: number, a1: number, th: number) {
  const N = 12;
  const outer: Array<[number, number]> = [];
  const inner: Array<[number, number]> = [];
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const a = a0 + (a1 - a0) * t;
    const w = th * Math.pow(Math.sin(Math.PI * t), 0.5) * (0.88 + rand() * 0.24);
    const ro = R * (1 + (rand() - 0.5) * 0.08) + w * 0.5;
    const ri = R - w * 0.5;
    outer.push([Math.cos(a) * ro, Math.sin(a) * ro * ry]);
    inner.push([Math.cos(a) * ri, Math.sin(a) * ri * ry]);
  }
  const tr = ([x, y]: [number, number]): [number, number] => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
  const path = [...outer, ...inner.reverse()].map(tr);
  ctx.beginPath();
  ctx.moveTo(path[0][0], path[0][1]);
  for (let k = 1; k < path.length; k++) {
    const [x, y] = path[k];
    const [px, py] = path[k - 1];
    ctx.quadraticCurveTo(px, py, (x + px) / 2, (y + py) / 2);
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
  if (decorKey(input) === "none") return;

  const sx = canvas.width / d.W;
  const sy = canvas.height / d.Lref;
  ctx.setTransform(sx, 0, 0, -sy, canvas.width / 2, canvas.height);
  const px = 1 / sx; // 1 px del canvas en cm
  const rand = mulberry32(1000 + i * 97);
  const W = d.W;

  ctx.save();
  outline(ctx, shape, d, px * 4);
  ctx.clip();

  // 1. degradé / babyboomer: blanco lechoso hacia la punta
  if (has("degrade")) {
    const g = ctx.createLinearGradient(0, d.L * 0.25, 0, d.L);
    g.addColorStop(0, "rgba(255,252,248,0)");
    g.addColorStop(0.55, "rgba(255,252,248,0.55)");
    g.addColorStop(1, "rgba(255,253,250,0.97)");
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

  // 3. animal print: leopardo de verdad (como el de la Kitty del logo): rosetas separadas por el color
  //    de base, cada una con un anillo cortado en 3 o 4 "medialunas" oscuras e irregulares alrededor de
  //    un centro caramelo, y puntitos sueltos en los huecos. Las rosetas se cortan contra el borde.
  if (has("animal-print")) {
    const r0 = W * 0.13;
    const step = r0 * 2.4;
    const spots: Array<[number, number, number]> = [];
    let row = 0;
    for (let y = -r0 * 0.4; y < d.L + r0; y += step * 0.84, row++) {
      for (let x = -W / 2 - r0 * 0.6 + (row % 2) * step * 0.5; x < W / 2 + r0; x += step) {
        spots.push([x + (rand() - 0.5) * step * 0.3, y + (rand() - 0.5) * step * 0.28, r0 * (0.82 + rand() * 0.36)]);
      }
    }
    const ink = ["rgba(40,28,22,0.97)", "rgba(56,38,28,0.95)", "rgba(33,25,21,0.97)"];
    for (const [cx, cy, r] of spots) {
      const rot = rand() * Math.PI;
      const ry = 0.74 + rand() * 0.2;
      // centro: caramelo con un dejo rojizo en algunas (guiño a los centros bordó del leopardo de la marca)
      ctx.fillStyle = rand() < 0.3 ? "rgba(156,82,44,0.8)" : "rgba(184,120,64,0.76)";
      blobPath(ctx, rand, cx, cy, r * 0.7, r * 0.7 * ry, rot, 0.18);
      ctx.fill();
      // anillo cortado en medialunas
      const parts = 3 + Math.floor(rand() * 2);
      const start = rand() * Math.PI * 2;
      const span = (Math.PI * 2) / parts;
      for (let a = 0; a < parts; a++) {
        const a0 = start + a * span + rand() * 0.15;
        const a1 = a0 + span * (0.68 + rand() * 0.16);
        ctx.fillStyle = ink[Math.floor(rand() * ink.length)];
        arcBlob(ctx, rand, cx, cy, r * 0.93, ry, rot, a0, a1, r * (0.4 + rand() * 0.16));
        ctx.fill();
      }
    }
    // puntitos sueltos en los huecos (nunca encima de una roseta)
    for (let k = 0; k < spots.length * 1.6; k++) {
      const x = (rand() - 0.5) * (W + r0);
      const y = rand() * (d.L + r0) - r0 * 0.3;
      if (spots.some(([sx, sy, sr]) => (sx - x) ** 2 + (sy - y) ** 2 < (sr * 1.2) ** 2)) continue;
      const big = rand() < 0.4;
      ctx.fillStyle = ink[k % ink.length];
      blobPath(ctx, rand, x, y, W * (big ? 0.03 : 0.018), W * (big ? 0.022 : 0.014), rand() * Math.PI, 0.3, 7);
      ctx.fill();
    }
  }

  // 4. flores a mano (uñas pares: pulgar, medio, meñique)
  if (has("flores") && i % 2 === 0) {
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

  // 5. dibujo a mano alzada: trazos de pincel fino con grosor que varía (corazones, estrellas, ondas y puntitos)
  if (has("a-mano")) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const lw = px * 8;
    if (i % 2 === 0) {
      ctx.strokeStyle = "#3c3c3c";
      ctx.lineWidth = lw;
      star(ctx, W * 0.04, d.bed * 0.62, W * 0.26, 0.2);
      ctx.stroke();
      ctx.fillStyle = "#4a0e0e";
      star(ctx, -W * 0.24, d.bed * 0.24, W * 0.1, -0.3);
      ctx.fill();
      for (const [dx, dy, rr] of [
        [0.26, 0.28, 0.035],
        [0.3, 0.9, 0.028],
        [-0.27, 0.95, 0.025],
      ]) {
        ctx.beginPath();
        ctx.arc(W * dx, d.bed * dy, W * rr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = "#4a0e0e";
      ctx.lineWidth = lw * 1.1;
      heart(ctx, 0, d.bed * 0.64, W * 0.2);
      ctx.stroke();
      ctx.strokeStyle = "#3c3c3c";
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const x = -W / 2 + (k / 30) * W;
        const y = d.bed * 0.22 + Math.sin(k * 0.75) * W * 0.05;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "#3c3c3c";
      ctx.beginPath();
      ctx.arc(W * 0.24, d.bed * 0.98, W * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. personajes: la Kitty de la marca en el anular
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

  // 7. francesita (blanca o de color) por encima de todo, con línea de sonrisa
  if (has("francesita") || has("francesita-color")) {
    const free = d.L - d.bed;
    // sonrisa suave: la punta no cubre la mitad de la uña
    const depth = Math.min(d.L * 0.45, 0.12 * W + 0.85 * free);
    const yc = d.L - depth;
    const drop = 0.12 * W;
    ctx.fillStyle = has("francesita-color") ? input.tipHex : "#fbf9f5";
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
  }

  ctx.restore();
}
