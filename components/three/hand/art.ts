import type { Shape } from "@/lib/types";
import { halfWidth, type NailDims } from "./nail";

/**
 * Dibujo propio de cada diseño del catálogo (PLAN: "todos los diseños del catálogo se tienen que ver perfectos en
 * el armador"). Las técnicas genéricas (`decor.ts`) sirven para lo que arma la clienta; acá cada set de Brenda se
 * pinta como en su foto: el marco negro con dos ventanas del Black french, las ondas con glitter del Pink wave, el
 * tribal fino sobre la punta blanca, la estrella dorada con tachas del Milky star…
 *
 * Mismo canvas y mismas coordenadas que `decor.ts`: x en cm centrado en la uña, y en cm desde la cutícula (0) hacia
 * la punta (`d.L`). El contorno ya viene recortado. `finger` es el dedo (0 pulgar … 4 meñique) y `nail` la uña de
 * las 10 (0–4 derecha, 5–9 izquierda), por si el diseño cambia de mano.
 */

export type ArtCtx = {
  ctx: CanvasRenderingContext2D;
  d: NailDims;
  W: number;
  /** 1 px del canvas, en cm */
  px: number;
  finger: number;
  nail: number;
  shape: Shape;
  baseHex: string;
  accentHex: string | null;
  tipHex: string;
  detailHex: string;
  rand: () => number;
  /** path del contorno de la uña */
  outline: () => void;
};

type Painter = (a: ArtCtx) => void;

export type ArtGem = { u: number; y: number; size: number };
/** Strass 3D del diseño: `u` ∈ [-1, 1] a lo ancho, `y` en cm desde la cutícula, `size` en cm. */
type GemLayout = (finger: number, d: NailDims, shape: Shape) => ArtGem[];

/* ---------- utilidades ---------- */

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Línea de sonrisa de la francesita: `yc` en el centro, más baja hacia los costados. */
function smile(a: ArtCtx, depth: number, drop = 0.12 * a.W) {
  const yc = a.d.L - depth;
  return { yc, drop, at: (x: number) => yc - drop * Math.pow((2 * x) / a.W, 2) };
}

/** Path de la punta (desde la línea de sonrisa hasta más allá del borde libre). */
function tipPath(a: ArtCtx, depth: number, drop?: number) {
  const { ctx, W, d } = a;
  const s = smile(a, depth, drop);
  ctx.beginPath();
  ctx.moveTo(-W, s.at(-W / 2) - s.drop * 0.3);
  for (let k = 0; k <= 40; k++) {
    const x = -W / 2 + (k / 40) * W;
    ctx.lineTo(x, s.at(x));
  }
  ctx.lineTo(W, s.at(W / 2) - s.drop * 0.3);
  ctx.lineTo(W, d.Lref + 1);
  ctx.lineTo(-W, d.Lref + 1);
  ctx.closePath();
  return s;
}

function paintTip(a: ArtCtx, color: string, depth: number, drop?: number) {
  const s = tipPath(a, depth, drop);
  a.ctx.fillStyle = color;
  a.ctx.fill();
  return s;
}

/** Tacha metálica (dorada o plateada): esfera con sombra y brillo. */
function stud(a: ArtCtx, x: number, y: number, r: number, tone: "gold" | "silver") {
  const { ctx } = a;
  const [hi, mid, lo] = tone === "gold" ? ["#fff6cf", "#e3b94a", "#8a6420"] : ["#ffffff", "#cfd4db", "#5a6068"];
  ctx.fillStyle = "rgba(40,25,15,0.28)";
  ctx.beginPath();
  ctx.arc(x + r * 0.15, y - r * 0.2, r * 1.05, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.35, y + r * 0.35, r * 0.05, x, y, r);
  g.addColorStop(0, hi);
  g.addColorStop(0.5, mid);
  g.addColorStop(1, lo);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Gema redonda de color, facetada por el brillo. */
function gem(a: ArtCtx, x: number, y: number, r: number, color: string) {
  const { ctx } = a;
  ctx.fillStyle = "rgba(40,20,20,0.3)";
  ctx.beginPath();
  ctx.arc(x + r * 0.12, y - r * 0.16, r * 1.04, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.32, y + r * 0.32, r * 0.05, x, y, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.3, color);
  g.addColorStop(0.85, color);
  g.addColorStop(1, rgba(color, 0.6));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(x - r * 0.38, y + r * 0.38, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function pearl(a: ArtCtx, x: number, y: number, r: number) {
  const { ctx } = a;
  const g = ctx.createRadialGradient(x - r * 0.35, y + r * 0.35, r * 0.1, x, y, r);
  g.addColorStop(0, "#fffefb");
  g.addColorStop(0.55, "#f3ece2");
  g.addColorStop(1, "#c9bba8");
  ctx.fillStyle = "rgba(60,40,30,0.2)";
  ctx.beginPath();
  ctx.arc(x + r * 0.12, y - r * 0.16, r * 1.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y + r * 0.35, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

/** Destello de cuatro puntas (el "✦" dorado del Leo star gold y del Milky star). */
function sparkle(a: ArtCtx, x: number, y: number, r: number, rot = 0, waist = 0.22) {
  const { ctx } = a;
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const ang = rot + (k * Math.PI) / 4;
    const rr = k % 2 === 0 ? r : r * waist;
    ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath();
}

function star5(a: ArtCtx, x: number, y: number, r: number, rot = 0) {
  const { ctx } = a;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const ang = rot + (k * Math.PI) / 5 - Math.PI / 2;
    const rr = k % 2 === 0 ? r : r * 0.48;
    ctx.lineTo(x + Math.cos(ang) * rr, y - Math.sin(ang) * rr);
  }
  ctx.closePath();
}

function goldFill(a: ArtCtx, x0: number, y0: number, x1: number, y1: number) {
  const g = a.ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#fff1b8");
  g.addColorStop(0.45, "#e2b64a");
  g.addColorStop(1, "#9a6f1e");
  return g;
}

/** Trazo que se afina hasta la punta (rayas de cebra, tribal). */
function taper(a: ArtCtx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number) {
  const { ctx } = a;
  // normal aproximada en el arranque
  const dx = cx - x0;
  const dy = cy - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * w * 0.5;
  const ny = (dx / len) * w * 0.5;
  ctx.beginPath();
  ctx.moveTo(x0 + nx, y0 + ny);
  ctx.quadraticCurveTo(cx + nx * 0.5, cy + ny * 0.5, x1, y1);
  ctx.quadraticCurveTo(cx - nx * 0.5, cy - ny * 0.5, x0 - nx, y0 - ny);
  ctx.closePath();
  ctx.fill();
}

/** Trazo con las dos puntas afiladas (los tallos del tribal): grosor `w` en el medio. */
function spindle(a: ArtCtx, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w: number) {
  const { ctx } = a;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * w;
  const ny = (dx / len) * w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(cx + nx, cy + ny, x1, y1);
  ctx.quadraticCurveTo(cx - nx, cy - ny, x0, y0);
  ctx.closePath();
  ctx.fill();
}

/** Glitter pintado: escamas chicas de varios tonos, denso, sobre toda la uña. */
function glitterFill(a: ArtCtx, tones: string[], density = 1) {
  const { ctx, W, d, rand } = a;
  const n = Math.round(260 * density * (d.L / W));
  for (let k = 0; k < n; k++) {
    const x = (rand() - 0.5) * W * 1.1;
    const y = rand() * d.L * 1.02;
    const r = W * (0.012 + rand() * 0.02);
    ctx.globalAlpha = 0.45 + rand() * 0.55;
    ctx.fillStyle = tones[Math.floor(rand() * tones.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // unas pocas escamas grandes que destellan
  for (let k = 0; k < 10 * density; k++) {
    const x = (rand() - 0.5) * W * 0.9;
    const y = rand() * d.L;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#ffffff";
    sparkle(a, x, y, W * (0.03 + rand() * 0.025), rand() * Math.PI, 0.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Foil dorado: pedacitos metálicos irregulares, como los encapsulados de Brenda. */
function goldFoil(a: ArtCtx, count: number) {
  const { ctx, W, d, rand } = a;
  for (let k = 0; k < count; k++) {
    const cx = (rand() - 0.5) * W * 0.85;
    const cy = d.L * (0.12 + rand() * 0.8);
    const r = W * (0.05 + rand() * 0.09);
    ctx.fillStyle = goldFill(a, cx - r, cy - r, cx + r, cy + r);
    ctx.globalAlpha = 0.88 + rand() * 0.12;
    ctx.beginPath();
    const sides = 5 + Math.floor(rand() * 3);
    for (let s = 0; s < sides; s++) {
      const ang = (s / sides) * Math.PI * 2 + rand() * 0.7;
      const rr = r * (0.45 + rand() * 0.7);
      ctx.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Cadenita dorada que cruza la uña colgando (Leo star gold). */
function chain(a: ArtCtx, y0: number, y1: number, sag: number) {
  const { ctx, W } = a;
  const x0 = -W * 0.62;
  const x1 = W * 0.62;
  const cy = (y0 + y1) / 2 - sag;
  const r = W * 0.05;
  const steps = Math.ceil((W * 1.3) / (r * 1.45));
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const x = (1 - t) * (1 - t) * x0 + t * t * x1;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    const dx = 2 * (1 - t) * (0 - x0) + 2 * t * (x1 - 0);
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
    const flat = k % 2 === 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.strokeStyle = goldFill(a, -r, r, r, -r);
    ctx.lineWidth = r * (flat ? 0.55 : 0.7);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, flat ? r * 0.38 : r * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/** Mancha de leopardo: centro tostado con anillo café cortado. */
function leoSpot(a: ArtCtx, cx: number, cy: number, r: number, rot: number) {
  const { ctx, rand } = a;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = "rgba(201,160,99,0.92)";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.82, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(30,22,18,0.95)";
  ctx.lineCap = "round";
  ctx.lineWidth = r * 0.3;
  const arcs = 2 + Math.floor(rand() * 2);
  for (let k = 0; k < arcs; k++) {
    const start = (k / arcs) * Math.PI * 2 + rand() * 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.78, 0, start, start + (Math.PI * 2) / arcs - 0.6 - rand() * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

/** Punto en una curva cúbica. */
function cubic(t: number, p0: number, p1: number, p2: number, p3: number) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/** La onda del Pink wave: una S que cruza la uña de lado a lado, espejada en dedos alternos. */
function wave(finger: number, d: NailDims, W: number) {
  const m = finger % 2 ? -1 : 1;
  const P = {
    x: [-0.62 * W * m, 0.55 * W * m, -0.55 * W * m, 0.62 * W * m],
    y: [d.L * 0.16, d.L * 0.34, d.L * 0.62, d.L * 0.86],
  };
  return (t: number) => ({ x: cubic(t, P.x[0], P.x[1], P.x[2], P.x[3]), y: cubic(t, P.y[0], P.y[1], P.y[2], P.y[3]) });
}

/* ---------- los diseños ---------- */

const ART: Record<string, Painter> = {
  /** Marco negro fino alrededor de toda la uña y una banda que la cruza al medio: dos ventanas nude. */
  "black-french": (a) => {
    const { ctx, W, d } = a;
    const black = "#141414";
    ctx.strokeStyle = black;
    ctx.lineJoin = "round";
    a.outline();
    ctx.lineWidth = W * 0.2; // la mitad queda adentro del recorte: borde de 0.1 W
    ctx.stroke();
    // banda curva al medio, como una segunda línea de sonrisa
    const s = smile(a, d.L - d.L * 0.47, 0.1 * W);
    ctx.lineWidth = W * 0.11;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) {
      const x = -W * 0.6 + (k / 40) * W * 1.2;
      const y = s.at(x);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  },

  /** Ondas fucsia con glitter que cruzan la uña, con un strass en cada tramo. */
  "pink-wave": (a) => {
    const { ctx, W, d, finger, rand } = a;
    const w = wave(finger, d, W);
    const stroke = (fn: (t: number) => { x: number; y: number }, width: number) => {
      ctx.strokeStyle = "#e0338a";
      ctx.lineCap = "round";
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let k = 0; k <= 48; k++) {
        const p = fn(k / 48);
        if (k === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      // glitter sobre la onda
      const tones = ["#ffffff", "#ffd3ea", "#ff8fc8", "#fff0f7"];
      for (let k = 0; k < 140; k++) {
        const p = fn(rand());
        const ang = rand() * Math.PI * 2;
        const rr = rand() * width * 0.48;
        ctx.globalAlpha = 0.5 + rand() * 0.5;
        ctx.fillStyle = tones[Math.floor(rand() * tones.length)];
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(ang) * rr, p.y + Math.sin(ang) * rr, W * (0.008 + rand() * 0.014), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    stroke(w, W * 0.14);
    if (finger === 1 || finger === 3) {
      // una segunda onda más corta cerca de la punta
      const m = finger % 2 ? -1 : 1;
      stroke((t) => ({ x: (-0.6 + 1.2 * t) * W * m, y: d.L * (0.9 - 0.12 * Math.sin(t * Math.PI)) }), W * 0.07);
    }
  },

  /** Punta blanca profunda con tribal negro fino y tachas plateadas. */
  "tribal-french": (a) => {
    const { ctx, W, d, finger, rand } = a;
    const depth = d.L * 0.46;
    const s = paintTip(a, "#fbfaf6", depth, 0.1 * W);
    ctx.save();
    tipPath(a, depth, 0.1 * W);
    ctx.clip();
    ctx.fillStyle = "#161616";
    const f = finger % 2 ? -1 : 1;
    const y0 = s.yc;
    const h = d.L - y0;
    const X = (k: number) => k * W * f;
    const Y = (k: number) => y0 + h * k;
    // llamas gruesas que nacen de la sonrisa y se curvan todas para el mismo lado, con las puntas afiladas
    spindle(a, X(-0.38), Y(0.0), X(0.12), Y(0.38), X(-0.1), Y(1.02), W * 0.17);
    spindle(a, X(0.28), Y(0.04), X(0.58), Y(0.5), X(0.18), Y(0.92), W * 0.13);
    spindle(a, X(-0.52), Y(0.36), X(-0.42), Y(0.72), X(-0.38), Y(1.0), W * 0.1);
    spindle(a, X(0.02), Y(0.5), X(0.34), Y(0.7), X(0.5), Y(1.0), W * 0.09);
    spindle(a, X(0.5), Y(0.08), X(0.56), Y(0.26), X(0.3), Y(0.4), W * 0.06);
    // puntitos negros entre las llamas
    for (const [x, y] of [
      [0.08, 0.18],
      [-0.3, 0.6],
      [0.36, 0.82],
    ]) {
      ctx.beginPath();
      ctx.arc(X(x), Y(y), W * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // tachas plateadas: dos sobre la sonrisa y una en la punta
    const r = W * 0.055;
    stud(a, -0.3 * W, s.at(-0.3 * W) + r * 1.3, r, "silver");
    stud(a, 0.3 * W, s.at(0.3 * W) + r * 1.3, r, "silver");
    stud(a, X(-0.16), Y(0.5 + rand() * 0.1), r * 0.9, "silver");
    stud(a, X(0.2), Y(0.72 + rand() * 0.1), r * 0.85, "silver");
  },

  /** Punta blanca con tres gemas redondas de colores. */
  "candy-gems": (a) => {
    const { W, d, finger, shape } = a;
    const s = paintTip(a, "#fdfdfb", Math.max(d.L * 0.3, d.free + d.bed * 0.18));
    const COLORS = ["#e9348f", "#2f8fe0", "#f5c400", "#35b06a", "#9b5de5", "#ff3b3b", "#2ec4c4"];
    const picks = [COLORS[finger % 7], COLORS[(finger + 3) % 7], COLORS[(finger + 5) % 7]];
    const inside = (x: number, y: number, r: number) => {
      const hw = halfWidth(shape, Math.min(y, d.L - r * 0.4), d) - r * 1.15;
      return Math.max(-hw, Math.min(hw, x));
    };
    const big = W * 0.17;
    const small = W * 0.12;
    const yb = s.yc + W * 0.1;
    gem(a, inside(0.02 * W, yb, big), yb, big, picks[0]);
    const y1 = s.at(-0.3 * W) - W * 0.02;
    gem(a, inside(-0.34 * W, y1, small), y1, small, picks[1]);
    const y2 = s.at(0.32 * W) + W * 0.12;
    gem(a, inside(0.34 * W, y2, small), y2, small, picks[2]);
  },

  /** Milky con una estrella dorada de ocho puntas y tres tachas a cada lado, en el anular. */
  "milky-star": (a) => {
    if (a.finger !== 3) return;
    const { ctx, W, d } = a;
    const cy = d.bed * 0.6;
    ctx.fillStyle = goldFill(a, -W * 0.25, cy + W * 0.25, W * 0.25, cy - W * 0.25);
    ctx.strokeStyle = "#8a6420";
    ctx.lineWidth = a.px * 1.5;
    sparkle(a, 0, cy, W * 0.33, 0, 0.18);
    ctx.fill();
    ctx.stroke();
    sparkle(a, 0, cy, W * 0.18, Math.PI / 4, 0.22);
    ctx.fill();
    ctx.stroke();
    for (const k of [0.29, 0.37, 0.45]) {
      stud(a, -k * W, cy, W * 0.03, "gold");
      stud(a, k * W, cy, W * 0.03, "gold");
    }
  },

  /** Nude con punta amarilla; el pulgar en degradé atardecer; mayor y anular con manchas rosas. */
  "sunset-french": (a) => {
    const { ctx, W, d, finger, rand } = a;
    const yellow = "#f6d53a";
    if (finger === 0) {
      const g = ctx.createLinearGradient(0, 0, 0, d.L);
      g.addColorStop(0, "#f2a7c3");
      g.addColorStop(0.42, "#f28a3a");
      g.addColorStop(1, yellow);
      ctx.fillStyle = g;
      ctx.fillRect(-W, 0, W * 2, d.Lref);
      return;
    }
    if (finger === 2 || finger === 3) {
      for (let k = 0; k < 3; k++) {
        const x = (rand() - 0.5) * W * 0.6;
        const y = d.bed * (0.2 + k * 0.22 + rand() * 0.1);
        const r = W * (0.14 + rand() * 0.07);
        const g = ctx.createRadialGradient(x, y, r * 0.3, x, y, r);
        g.addColorStop(0, "rgba(240,122,138,0.9)");
        g.addColorStop(0.8, "rgba(240,122,138,0.75)");
        g.addColorStop(1, "rgba(240,122,138,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    paintTip(a, yellow, d.L * 0.3);
  },

  /** Negro; el índice rosa que se funde en negro hacia la punta. */
  "black-stiletto": (a) => {
    const { ctx, W, d, finger } = a;
    if (finger !== 1) return;
    const g = ctx.createLinearGradient(0, d.bed * 0.25, 0, d.bed * 0.95);
    g.addColorStop(0, "rgba(20,20,20,0)");
    g.addColorStop(0.5, "rgba(20,20,20,0.75)");
    g.addColorStop(1, "rgba(20,20,20,1)");
    ctx.fillStyle = g;
    ctx.fillRect(-W, 0, W * 2, d.Lref);
  },

  /** Negro con el índice nude (lleva la serpiente) y el anular en glitter dorado. */
  "black-snake": (a) => {
    if (a.finger === 3) glitterFill(a, ["#fff6d5", "#ffe9a8", "#f5d06b", "#ffffff", "#e6c25a"], 1.1);
  },

  /** Milky con punta blanca; el índice con foil dorado y el anular con tachas sobre la sonrisa. */
  "milky-gold": (a) => {
    const { W, d, finger } = a;
    if (finger === 1) {
      goldFoil(a, 16);
      return;
    }
    const s = paintTip(a, "#ffffff", d.L * 0.26);
    if (finger === 3) {
      for (let k = -2; k <= 2; k++) {
        const x = k * 0.17 * W;
        stud(a, x, s.at(x) - W * 0.075, W * 0.032, "gold");
      }
    }
  },

  /** Milky stiletto; el anular con un racimo de perlas cerca de la cutícula. */
  "milky-pearl": (a) => {
    const { W, d, finger, rand } = a;
    if (finger !== 3) return;
    const spots: Array<[number, number, number]> = [
      [-0.3, 0.3, 0.075],
      [-0.12, 0.26, 0.09],
      [0.08, 0.29, 0.08],
      [0.27, 0.33, 0.07],
      [-0.22, 0.44, 0.065],
      [-0.02, 0.43, 0.085],
      [0.2, 0.46, 0.07],
      [0.08, 0.58, 0.06],
    ];
    for (const [dx, dy, r] of spots) pearl(a, dx * W + (rand() - 0.5) * W * 0.02, d.bed * dy, r * W * 1.7);
  },

  /** Fucsia; índice y anular nude con lunares fucsia sueltos, más grandes hacia la punta. */
  "pink-dots": (a) => {
    const { ctx, W, d, finger, rand } = a;
    if (finger !== 1 && finger !== 3) return;
    ctx.fillStyle = "#e3196f";
    const n = 8;
    for (let k = 0; k < n; k++) {
      const y = d.L * (0.14 + (k / n) * 0.86 + (rand() - 0.5) * 0.08);
      const x = (rand() - 0.5) * W * 0.78;
      const r = W * (0.055 + rand() * 0.065);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /** Rosa con shimmer y rayas rojas finas de cebra que entran desde los dos bordes. */
  "pink-zebra": (a) => {
    const { ctx, W, d, rand } = a;
    // el cat eye oscurece la base: se levanta el rosa antes de las rayas
    ctx.fillStyle = "rgba(255,138,197,0.55)";
    ctx.fillRect(-W, 0, W * 2, d.Lref);
    ctx.fillStyle = "#ff1e3c";
    const n = 9;
    for (let k = 0; k < n; k++) {
      const fromLeft = k % 2 === 0;
      const y0 = d.L * (0.06 + (k / n) * 0.9 + (rand() - 0.5) * 0.05);
      const x0 = fromLeft ? -W * 0.56 : W * 0.56;
      const len = W * (0.35 + rand() * 0.35);
      const x1 = fromLeft ? x0 + len : x0 - len;
      const y1 = y0 + (rand() - 0.5) * d.L * 0.14 + d.L * 0.05;
      const cx = (x0 + x1) / 2;
      const cy = y0 + (rand() - 0.5) * d.L * 0.1;
      taper(a, x0, y0, cx, cy, x1, y1, W * 0.07);
      if (rand() > 0.5) taper(a, x0, y0 + d.L * 0.04, cx + (fromLeft ? 1 : -1) * W * 0.05, cy + d.L * 0.06, x1 * 0.6, y1 + d.L * 0.05, W * 0.045);
    }
  },

  /** Cuadrada XL, cada uña distinta: cadenas y leopardo, francesita rosa con tachas, destellos dorados, estrellas rosas. */
  "leo-star-gold": (a) => {
    const { ctx, W, d, finger, rand } = a;
    const pink = "#f2a7c3";
    const pinkStars = () => {
      ctx.fillStyle = pink;
      star5(a, -0.2 * W, d.bed * 0.32, W * 0.2, 0.3);
      ctx.fill();
      star5(a, 0.22 * W, d.bed * 0.72, W * 0.22, -0.2);
      ctx.fill();
      star5(a, -0.12 * W, d.L * 0.9, W * 0.17, 0.5);
      ctx.fill();
      stud(a, 0.3 * W, d.bed * 0.28, W * 0.03, "gold");
      stud(a, -0.3 * W, d.bed * 0.6, W * 0.03, "gold");
      stud(a, 0.1 * W, d.L * 0.78, W * 0.03, "gold");
    };
    switch (finger) {
      case 0:
      case 4: {
        chain(a, d.L * 0.62, d.L * 0.46, d.L * 0.12);
        chain(a, d.L * 0.42, d.L * 0.3, d.L * 0.08);
        for (let k = 0; k < 4; k++) leoSpot(a, (rand() - 0.5) * W * 0.8, d.L * (0.72 + k * 0.07) + (rand() - 0.5) * d.L * 0.06, W * 0.09, rand() * Math.PI);
        break;
      }
      case 1: {
        const s = paintTip(a, pink, d.L * 0.32);
        for (let k = -2; k <= 2; k++) {
          const x = k * 0.17 * W;
          stud(a, x, s.at(x) - W * 0.08, W * 0.034, "gold");
        }
        break;
      }
      case 2: {
        ctx.fillStyle = goldFill(a, -W * 0.3, d.bed * 0.9, W * 0.3, d.bed * 0.3);
        sparkle(a, 0.02 * W, d.bed * 0.6, W * 0.3, 0, 0.16);
        ctx.fill();
        sparkle(a, -0.26 * W, d.bed * 0.28, W * 0.12, 0, 0.2);
        ctx.fill();
        sparkle(a, 0.24 * W, d.L * 0.82, W * 0.1, 0, 0.2);
        ctx.fill();
        break;
      }
      default:
        pinkStars();
    }
  },
};

/** Strass 3D propios del diseño (reemplazan a los genéricos). `null` = no tiene strass. */
const GEMS: Record<string, GemLayout | null> = {
  "black-french": (finger, d) => [{ u: 0, y: d.L * 0.47, size: 0.13 * d.W }],
  "pink-wave": (finger, d, shape) => {
    const w = wave(finger, d, d.W);
    return [0.3, 0.74].map((t) => {
      const p = w(t);
      const hw = halfWidth(shape, p.y, d);
      return { u: Math.max(-0.8, Math.min(0.8, p.x / hw)), y: p.y, size: 0.085 * d.W };
    });
  },
  babyboomer: (finger, d) => {
    if (finger !== 3) return [];
    return [-0.55, -0.28, 0, 0.28, 0.55].map((u) => ({ u, y: d.L * 0.5 + (1 - Math.abs(u)) * d.W * 0.07, size: d.W * (0.07 + (1 - Math.abs(u)) * 0.035) }));
  },
  "tribal-french": null,
  "candy-gems": null,
  "milky-star": null,
  "leo-star-gold": null,
  "milky-gold": null,
};

export function hasArt(slug: string | undefined): slug is string {
  return Boolean(slug && (ART[slug] || slug in GEMS));
}

/** Pinta el diseño `slug` en la uña; devuelve false si ese diseño no tiene dibujo propio (se pinta lo genérico). */
export function paintArt(slug: string, a: ArtCtx): boolean {
  const painter = ART[slug];
  if (!painter) return false;
  painter(a);
  return true;
}

/** Strass del diseño en este dedo, o `undefined` si usa los genéricos. */
export function artGems(slug: string | undefined, finger: number, d: NailDims, shape: Shape): ArtGem[] | undefined {
  if (!slug || !(slug in GEMS)) return undefined;
  const fn = GEMS[slug];
  return fn ? fn(finger, d, shape) : [];
}
