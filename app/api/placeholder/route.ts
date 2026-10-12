import type { NextRequest } from "next/server";

/**
 * Foto de producto provisoria (PLAN W2-C.8): un SVG 4:5 (800 × 1000) que se ve como una foto de estudio del set
 * hasta que lleguen las fotos reales. Misma proporción, mismo encuadre y mismo recorte que van a tener las fotos, así
 * la tarjeta, la galería y el zoom ya quedan probados con su forma final.
 *
 * Vistas (`i`):
 *   0 · las cinco uñas en abanico sobre papel crema (la foto principal de la tarjeta);
 *   1 · macro de dos uñas, recortadas, para ver el acabado (la segunda foto, la del hover);
 *   2 · el kit: las diez uñas montadas en su tarjeta, con la lima y el pegamento.
 *
 * Parámetros: `seed` (slug), `shape`, `len` (corto · medio · largo · xl), `colors` (hex sin #, separados por coma),
 * `finish` (glossy · mate · cromado), `fx` (efectos: french, leopard, glitter, strass, cateye, aurora, flowers,
 * bows, kitty), `v` (versión del dibujo: sube cuando cambia, así se rompe el caché inmutable).
 * Todo entra por lista blanca: el SVG nunca lleva texto ni nada que venga crudo de la URL.
 */

type Shape = "almendra" | "ovalada" | "coffin" | "cuadrada" | "stiletto";
type Finish = "glossy" | "mate" | "cromado";
type Fx =
  | "french"
  | "leopard"
  | "glitter"
  | "strass"
  | "cateye"
  | "aurora"
  | "flowers"
  | "bows"
  | "kitty";

/** Uña en una caja de 60 × 160: punta en y = 0, cutícula redondeada abajo (y = 160). */
const SHAPES: Record<Shape, string> = {
  almendra:
    "M30 0 C44 20 56 58 56 96 L56 128 C56 150 44 160 30 160 C16 160 4 150 4 128 L4 96 C4 58 16 20 30 0 Z",
  ovalada:
    "M30 0 C50 0 56 40 56 86 L56 128 C56 150 44 160 30 160 C16 160 4 150 4 128 L4 86 C4 40 10 0 30 0 Z",
  coffin: "M17 0 L43 0 L56 104 L56 128 C56 150 44 160 30 160 C16 160 4 150 4 128 L4 104 Z",
  cuadrada:
    "M6 2 Q6 0 8 0 L52 0 Q54 0 54 2 L56 128 C56 150 44 160 30 160 C16 160 4 150 4 128 Z",
  stiletto: "M30 0 L56 112 L56 128 C56 150 44 160 30 160 C16 160 4 150 4 128 L4 112 Z",
};

/** Punta de la francesita: la línea de sonrisa baja en los costados. */
const TIPS: Record<Shape, string> = {
  almendra: "M30 0 C44 20 52 42 54 64 C40 55 20 55 6 64 C8 42 16 20 30 0 Z",
  ovalada: "M30 0 C50 0 55 28 55 54 C40 46 20 46 5 54 C5 28 10 0 30 0 Z",
  coffin: "M17 0 L43 0 L49 50 C40 43 20 43 11 50 Z",
  cuadrada: "M6 2 Q6 0 8 0 L52 0 Q54 0 54 2 L54.6 38 C40 32 20 32 5.4 38 Z",
  stiletto: "M30 0 L50 86 C40 77 20 77 10 86 Z",
};

/** Dónde arranca el reflejo largo (más abajo en las formas con punta, donde la uña ya es ancha). */
const SHINE_TOP: Record<Shape, number> = {
  cuadrada: 12,
  ovalada: 16,
  almendra: 30,
  stiletto: 46,
  coffin: 16,
};

/** Largo de la uña: estira la caja hacia la punta desde la cutícula. */
const LENGTH_K: Record<string, number> = { corto: 0.84, medio: 1, largo: 1.13, xl: 1.26 };

const FX_LIST: Fx[] = [
  "french",
  "leopard",
  "glitter",
  "strass",
  "cateye",
  "aurora",
  "flowers",
  "bows",
  "kitty",
];

/** Estrella del logo (5 puntas filosas, radio interior .36, caja de 100). */
const LOGO_STAR =
  "M50 4 60.29 37.84 95.65 37.17 66.64 57.41 78.21 90.83 50 69.5 21.79 90.83 33.36 57.41 4.35 37.17 39.71 37.84Z";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** PRNG determinístico (mulberry32): el mismo diseño se dibuja siempre igual. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Luminancia aproximada (0 negro → 1 blanco) para dosificar brillos sobre colores oscuros. */
function luma(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

type Scene = {
  shape: Shape;
  k: number;
  colors: string[];
  finish: Finish;
  fx: Set<Fx>;
  seed: number;
};

/* ---------- Decoraciones (todas en coordenadas de la uña, 60 × 160) ---------- */

/** Rosetas de leopardo como las de la Kitty del logo: núcleo rojizo y 4–6 manchas carbón alrededor. */
function leopard(rand: () => number): string {
  let out = "";
  const cols = 3;
  const rows = 7;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (rand() < 0.22) continue;
      const x = 8 + col * 22 + (row % 2) * 10 + (rand() - 0.5) * 9;
      const y = 6 + row * 22 + (rand() - 0.5) * 8;
      const s = 0.8 + rand() * 0.55;
      const rot = Math.round(rand() * 360);
      const petals = 4 + Math.floor(rand() * 3);
      const gap = Math.floor(rand() * petals);
      let g = `<ellipse rx="3.3" ry="2.6" fill="${rand() < 0.5 ? "#8e1b12" : "#9a5a2a"}" opacity=".85"/>`;
      for (let p = 0; p < petals; p++) {
        if (p === gap && petals > 4) continue;
        const a = (p / petals) * Math.PI * 2;
        const px = Math.cos(a) * 4.7;
        const py = Math.sin(a) * 4.1;
        g += `<ellipse cx="${r2(px)}" cy="${r2(py)}" rx="2.5" ry="1.7" transform="rotate(${Math.round((a * 180) / Math.PI + 90)} ${r2(px)} ${r2(py)})" fill="#2a2321"/>`;
      }
      out += `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${r2(s)})">${g}</g>`;
    }
  }
  // puntitos sueltos entre rosetas
  for (let d = 0; d < 7; d++) {
    out += `<circle cx="${r1(4 + rand() * 52)}" cy="${r1(4 + rand() * 150)}" r="${r2(0.9 + rand() * 0.9)}" fill="#2a2321"/>`;
  }
  return out;
}

/** Glitter que nace en la punta y se diluye hacia la cutícula. */
function glitter(rand: () => number, color: string): string {
  let out = `<rect width="60" height="160" fill="url(#glit)"/>`;
  for (let i = 0; i < 70; i++) {
    const t = Math.pow(rand(), 1.8);
    const y = t * 118;
    const x = 2 + rand() * 56;
    const r = 0.45 + rand() * 1.05;
    const bright = rand() < 0.38;
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r2(r)}" fill="${bright ? "#fff6c8" : color}" opacity="${bright ? 0.95 : 0.9}"/>`;
  }
  return out;
}

/** Strass facetado: un cristal con brillo y destello. */
function gem(x: number, y: number, r: number): string {
  return `<g transform="translate(${x} ${y})">
<circle r="${r + 0.9}" fill="#000" opacity=".16" transform="translate(.6 1.1)"/>
<circle r="${r}" fill="url(#gem)"/>
<path d="M0 ${-r} L${r * 0.42} 0 L0 ${r} L${-r * 0.42} 0Z" fill="#fff" opacity=".35"/>
<circle r="${r * 0.32}" cx="${-r * 0.35}" cy="${-r * 0.38}" fill="#fff" opacity=".95"/>
<path d="M${r * 0.75} ${-r * 1.25} l.45 1.3 1.3.45 -1.3.45 -.45 1.3 -.45 -1.3 -1.3 -.45 1.3 -.45Z" fill="#fff"/>
</g>`;
}

function strass(n: number): string {
  if (n === 2) return gem(30, 96, 4.6) + gem(30, 111, 3.8) + gem(30, 124, 3.1);
  if (n === 4) return gem(23, 120, 3.8) + gem(37, 123, 3);
  return gem(30, 118, 4.2);
}

/** Cat eye: la franja de luz magnética, en diagonal y difusa. */
function catEye(band: string): string {
  return `<path d="M-10 118 C12 86 38 62 70 42" stroke="${band}" stroke-width="26" fill="none" opacity=".55" filter="url(#soft6)"/>
<path d="M-10 118 C12 86 38 62 70 42" stroke="${band}" stroke-width="11" fill="none" opacity=".8" filter="url(#soft4)"/>
<path d="M-10 118 C12 86 38 62 70 42" stroke="#fff" stroke-width="3" fill="none" opacity=".45" filter="url(#soft)"/>`;
}

/** Florcita de cinco pétalos con centro amarillo; a veces con hoja. */
function flower(x: number, y: number, s: number, petal: string, leaf: string | null, rot: number) {
  let p = "";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    p += `<ellipse cx="${r2(Math.cos(a) * 4.2)}" cy="${r2(Math.sin(a) * 4.2)}" rx="3.6" ry="3" transform="rotate(${Math.round((a * 180) / Math.PI)} ${r2(Math.cos(a) * 4.2)} ${r2(Math.sin(a) * 4.2)})" fill="${petal}"/>`;
  }
  const leafPath = leaf
    ? `<path d="M3 5 C9 6 13 11 13 16 C8 15 4 11 3 5Z" fill="${leaf}" opacity=".9"/>`
    : "";
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${leafPath}${p}<circle r="2.3" fill="#f5c400"/><circle r="1" cx="-.6" cy="-.6" fill="#fff" opacity=".7"/></g>`;
}

function flowers(rand: () => number, petal: string, leaf: string, n: number): string {
  const count = n === 2 ? 3 : n % 2 ? 2 : 1;
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = 18 + rand() * 24;
    const y = 34 + i * 36 + rand() * 14;
    out += flower(
      r1(x),
      r1(y),
      r2(1.1 + rand() * 0.45),
      petal,
      rand() < 0.6 ? leaf : null,
      Math.round(rand() * 70),
    );
  }
  // puntitos de relleno pintados a mano
  for (let d = 0; d < 4; d++) {
    out += `<circle cx="${r1(8 + rand() * 44)}" cy="${r1(20 + rand() * 110)}" r=".9" fill="${petal}" opacity=".8"/>`;
  }
  return out;
}

/** Moño en relieve (3D): dos lazos, nudo y colitas, con sombra debajo. */
function bow3d(x: number, y: number, s: number, color: string, outline = false): string {
  const stroke = outline ? `stroke="#2a2321" stroke-width=".9" stroke-linejoin="round"` : "";
  return `<g transform="translate(${x} ${y}) scale(${s})">
<g transform="translate(.8 2)" opacity=".25" fill="#3a0a0a" filter="url(#soft)">
<path d="M0 0 C-4 -7 -12 -9 -14 -4 C-15.6 0 -12 6 0 0Z"/><path d="M0 0 C4 -7 12 -9 14 -4 C15.6 0 12 6 0 0Z"/>
</g>
<path d="M-1 1 L-6 10 L-2.6 10.4 L1 2Z" fill="${color}" ${stroke}/>
<path d="M1 1 L6 10 L2.6 10.4 L-1 2Z" fill="${color}" ${stroke}/>
<path d="M0 0 C-4 -7 -12 -9 -14 -4 C-15.6 0 -12 6 0 0Z" fill="${color}" ${stroke}/>
<path d="M0 0 C4 -7 12 -9 14 -4 C15.6 0 12 6 0 0Z" fill="${color}" ${stroke}/>
<path d="M-11 -4.5 C-9 -6.4 -6 -5.6 -3.4 -2.6" stroke="#fff" stroke-width="1.1" fill="none" opacity=".55" stroke-linecap="round"/>
<path d="M11 -4.5 C9 -6.4 6 -5.6 3.4 -2.6" stroke="#000" stroke-width="1" fill="none" opacity=".12" stroke-linecap="round"/>
<ellipse rx="2.8" ry="3.2" fill="${color}" ${stroke}/>
<ellipse rx="2.8" ry="3.2" fill="#000" opacity=".1"/>
<ellipse cx="-.8" cy="-1" rx="1" ry="1.2" fill="#fff" opacity=".6"/>
</g>`;
}

/* ---------- Una uña ---------- */

type NailArt = { base: string; art: string; tip?: string };

function nailArt(scene: Scene, n: number, rand: () => number): NailArt {
  const [c0, c1, c2] = scene.colors;
  const { fx } = scene;

  if (fx.has("leopard")) {
    // set de la casa: leopardo en el pulgar, el mayor y el meñique; acentos lisos en el índice y el anular
    if (n === 1 && c1) return { base: c1, art: "" };
    if (n === 3 && c2)
      return { base: c2, art: fx.has("kitty") ? bow3d(30, 78, 1.7, "#b51c1c", true) : "" };
    return { base: c0, art: leopard(rand) };
  }
  if (fx.has("french")) {
    return { base: c0, art: "", tip: c1 ?? "#ffffff" };
  }
  if (fx.has("cateye")) return { base: c0, art: catEye(c1 ?? "#8a8aa8") };
  if (fx.has("glitter")) return { base: c0, art: glitter(rand, c1 ?? "#d4af37") };
  if (fx.has("strass")) return { base: n % 2 && c1 ? c1 : c0, art: strass(n) };
  if (fx.has("flowers"))
    return { base: c0, art: flowers(rand, c1 ?? "#f2a7c3", c2 ?? "#6f9a6b", n) };
  if (fx.has("bows"))
    return { base: c0, art: n % 2 === 0 ? bow3d(30, 100, 1.55, c1 ?? "#ffffff") : "" };
  if (fx.has("aurora"))
    return { base: n % 2 && c1 ? c1 : c0, art: `<rect width="60" height="160" fill="url(#aur)"/>` };
  // liso: alterna la paleta del set (el anular lleva el tercer color si lo hay)
  const base = n === 3 && c2 ? c2 : n % 2 && c1 ? c1 : c0;
  return { base, art: "" };
}

function nail(scene: Scene, n: number, rand: () => number): string {
  const d = SHAPES[scene.shape];
  const { base, art, tip } = nailArt(scene, n, rand);
  const dark = luma(base) < 0.28;
  const shine = SHINE_TOP[scene.shape];
  const glossy = scene.finish !== "mate";
  const chrome = scene.finish === "cromado";

  const gloss = glossy
    ? `<rect x="12.5" y="${shine}" width="7" height="${124 - shine}" rx="3.5" fill="#fff" opacity="${dark ? 0.5 : 0.62}" filter="url(#soft)"/>
<rect x="41" y="96" width="3.2" height="28" rx="1.6" fill="#fff" opacity="${dark ? 0.22 : 0.3}" filter="url(#soft)"/>
<rect x="15" y="132" width="5" height="9" rx="2.5" fill="#fff" opacity=".3" filter="url(#soft)"/>`
    : `<rect x="8" y="${shine}" width="24" height="${120 - shine}" rx="12" fill="#fff" opacity=".1" filter="url(#soft4)"/>`;

  // bases casi blancas (milky, transparentes): un poco traslúcidas, así se leen como gel y no como yeso
  const sheer = luma(base) > 0.93;
  return `<path d="${d}" fill="#3a0a0a" opacity="${sheer ? 0.14 : 0.2}" filter="url(#cast)" transform="translate(5 12)"/>
<path d="${d}" fill="${base}" ${sheer ? `fill-opacity=".74"` : ""}/>
<g clip-path="url(#nc)">
${tip ? `<path d="${TIPS[scene.shape]}" fill="${tip}"/><path d="${TIPS[scene.shape]}" fill="none" stroke="#fff" stroke-width="1.2" opacity=".35"/>` : ""}
${art}
<rect width="60" height="160" fill="url(#cyl)" opacity="${glossy ? 1 : 0.8}"/>
<rect width="60" height="160" fill="url(#depth)"/>
${chrome ? `<rect width="60" height="160" fill="url(#chr)"/>` : ""}
${gloss}
<path d="M6 150 Q30 168 54 150" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="5" filter="url(#soft)"/>
<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${glossy ? 0.28 : 0.12}" stroke-width="2.2"/>
</g>
<path d="${d}" fill="none" stroke="#2a2321" stroke-opacity="${sheer ? 0.22 : 0.14}" stroke-width="${sheer ? 1 : 0.8}"/>`;
}

/** Uña posicionada: `x` es el centro, `bottom` la base de la cutícula, `s` la escala y `rot` el giro desde la base. */
function placeNail(
  scene: Scene,
  n: number,
  rand: () => number,
  { x, bottom, s, rot = 0 }: { x: number; bottom: number; s: number; rot?: number },
): string {
  const h = 160 * s * scene.k;
  const top = bottom - h;
  return `<g transform="rotate(${r2(rot)} ${r1(x)} ${r1(bottom)}) translate(${r1(x - 30 * s)} ${r1(top)}) scale(${r2(s)} ${r2(s * scene.k)})">${nail(scene, n, rand)}</g>`;
}

/* ---------- Escenas ---------- */

function logoStar(x: number, y: number, size: number, opacity = 1) {
  const s = size / 100;
  return `<path transform="translate(${x} ${y}) scale(${r2(s)}) skewX(-8) rotate(-12 50 50)" d="${LOGO_STAR}" fill="#530a03" opacity="${opacity}"/>`;
}

function fan(scene: Scene, rand: () => number): string {
  const scales = [0.9, 0.97, 1, 0.97, 0.86];
  const lift = [48, 12, 0, 12, 56];
  // la base del abanico baja con el largo para que el conjunto quede centrado en el cuadro
  const base = 680 + (scene.k - 1) * 110;
  let out = `<ellipse cx="400" cy="${r1(base + 74)}" rx="340" ry="40" fill="#4a0e0e" opacity=".08" filter="url(#cast)"/>`;
  for (const n of [0, 4, 1, 3, 2]) {
    out += placeNail(scene, n, rand, {
      x: 400 + (n - 2) * 118,
      bottom: base + lift[n],
      s: 2.5 * scales[n],
      rot: (n - 2) * 5,
    });
  }
  return out + logoStar(646, 860, 60) + logoStar(714, 820, 26, 0.85);
}

function macro(scene: Scene, rand: () => number): string {
  const s = 4.6;
  const bottomA = 900;
  const bottomB = 968;
  let out = `<ellipse cx="420" cy="960" rx="360" ry="46" fill="#4a0e0e" opacity=".08" filter="url(#cast)"/>`;
  // dos uñas que cuentan el set: con leopardo, la estampada y el acento del anular; si no, índice y mayor
  const [back, front] = scene.fx.has("leopard") ? [2, 3] : [1, 2];
  out += placeNail(scene, back, rand, { x: 292, bottom: bottomA, s, rot: -7 });
  out += placeNail(scene, front, rand, { x: 528, bottom: bottomB, s, rot: 8 });
  return out + logoStar(648, 120, 58) + logoStar(716, 84, 26, 0.85);
}

function kit(scene: Scene, rand: () => number): string {
  const sizes = [1, 0.88, 0.92, 0.84, 0.72]; // pulgar → meñique
  const xs = [212, 306, 400, 494, 588];
  const s = 1.36;
  let out = `
<g filter="url(#card)"><rect x="88" y="96" width="624" height="660" rx="40" fill="#fffdf8"/></g>
<rect x="88" y="96" width="624" height="660" rx="40" fill="none" stroke="#e8dbcd" stroke-width="2"/>
<rect x="362" y="120" width="76" height="18" rx="9" fill="#f5e8c8"/>
<rect x="362" y="120" width="76" height="18" rx="9" fill="none" stroke="#e7d6ad" stroke-width="1.5"/>`;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      // mano derecha arriba (pulgar a la izquierda), izquierda abajo (pulgar a la derecha)
      const n = row === 0 ? i : 4 - i;
      out += placeNail(scene, n, rand, {
        x: xs[i],
        bottom: 426 + row * 290,
        s: s * sizes[n],
      });
    }
  }
  out += logoStar(636, 690, 38);
  // la lima (dos granos) y el pegamento, apoyados abajo
  out += `
<g transform="rotate(-8 340 860)">
  <rect x="120" y="830" width="440" height="48" rx="24" fill="#3a0a0a" opacity=".16" filter="url(#cast)" transform="translate(4 12)"/>
  <rect x="120" y="830" width="440" height="48" rx="24" fill="#e7d6ad"/>
  <path d="M144 830 H340 V878 H144 A24 24 0 0 1 144 830Z" fill="#a58a62"/>
  <rect x="120" y="830" width="440" height="48" rx="24" fill="url(#grit)" opacity=".5"/>
  <rect x="134" y="833" width="412" height="12" rx="6" fill="#fff" opacity=".28"/>
</g>
<g transform="translate(590 760) scale(1.3)">
  <ellipse cx="34" cy="146" rx="46" ry="10" fill="#3a0a0a" opacity=".16" filter="url(#cast)"/>
  <rect x="4" y="58" width="60" height="88" rx="16" fill="#fffdf8" stroke="#e8dbcd" stroke-width="2"/>
  <rect x="4" y="88" width="60" height="30" fill="#b51c1c"/>
  <rect x="14" y="62" width="9" height="78" rx="4.5" fill="#fff" opacity=".7"/>
  <rect x="16" y="26" width="36" height="36" rx="8" fill="#4a0e0e"/>
  <path d="M24 26 L30 0 L38 0 L44 26Z" fill="#4a0e0e"/>
  <rect x="21" y="30" width="6" height="28" rx="3" fill="#fff" opacity=".18"/>
</g>`;
  return out;
}

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const seed = (p.get("seed") ?? "bf").slice(0, 80);
  const shapeParam = p.get("shape") ?? "almendra";
  const shape: Shape = shapeParam in SHAPES ? (shapeParam as Shape) : "almendra";
  const k = LENGTH_K[p.get("len") ?? "medio"] ?? 1;
  const finishParam = p.get("finish");
  const finish: Finish =
    finishParam === "mate" || finishParam === "cromado" ? finishParam : "glossy";
  const colors = (p.get("colors") ?? "e8c4b0")
    .split(",")
    .slice(0, 4)
    .map((c) => {
      const hex = c.replace(/[^0-9a-f]/gi, "").slice(0, 6);
      return `#${hex.length === 6 ? hex : "e8c4b0"}`;
    });
  const fx = new Set(
    (p.get("fx") ?? "").split(",").filter((f): f is Fx => (FX_LIST as string[]).includes(f)),
  );
  const view = Math.min(2, Math.max(0, Math.floor(Number(p.get("i") ?? 0)) || 0));
  const scene: Scene = { shape, k, colors, finish, fx, seed: hash(seed) };
  const rand = prng(hash(`${seed}:${view}`));
  const glitterColor = colors[1] ?? "#d4af37";
  const auroraTint = colors[1] ?? "#e8d8f7";
  const catBase = colors[0];

  const body = view === 0 ? fan(scene, rand) : view === 1 ? macro(scene, rand) : kit(scene, rand);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
<defs>
  <radialGradient id="surf" cx=".28" cy=".18" r="1"><stop offset="0" stop-color="#fff8e6"/><stop offset=".55" stop-color="#f5e8c8"/><stop offset="1" stop-color="#ead6a8"/></radialGradient>
  <radialGradient id="spot" cx=".5" cy=".46" r=".5"><stop offset="0" stop-color="#fffdf6" stop-opacity=".75"/><stop offset="1" stop-color="#fffdf6" stop-opacity="0"/></radialGradient>
  <linearGradient id="cyl" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".14" stop-color="#000" stop-opacity=".06"/><stop offset=".34" stop-color="#fff" stop-opacity=".12"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".84" stop-color="#000" stop-opacity=".07"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
  <linearGradient id="depth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>
  <linearGradient id="chr" x1="0" y1="0" x2=".45" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".05"/><stop offset=".2" stop-color="#fff" stop-opacity=".55"/><stop offset=".36" stop-color="#fff" stop-opacity=".05"/><stop offset=".52" stop-color="#000" stop-opacity=".28"/><stop offset=".7" stop-color="#fff" stop-opacity=".42"/><stop offset=".86" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>
  <linearGradient id="glit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${glitterColor}" stop-opacity=".95"/><stop offset=".38" stop-color="${glitterColor}" stop-opacity=".45"/><stop offset=".72" stop-color="${glitterColor}" stop-opacity="0"/></linearGradient>
  <linearGradient id="aur" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd6ef" stop-opacity=".55"/><stop offset=".35" stop-color="${auroraTint}" stop-opacity=".1"/><stop offset=".55" stop-color="#cdf3ff" stop-opacity=".5"/><stop offset=".8" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#f6d2ff" stop-opacity=".45"/></linearGradient>
  <linearGradient id="cat" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${catBase}" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity=".06"/><stop offset=".5" stop-color="#fff" stop-opacity=".2"/><stop offset=".58" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="${catBase}" stop-opacity="0"/></linearGradient>
  <radialGradient id="gem" cx=".38" cy=".34" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#e3e9ee"/><stop offset=".8" stop-color="#9aa6b0"/><stop offset="1" stop-color="#6f7b86"/></radialGradient>
  <pattern id="grit" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".8" fill="#fff"/><circle cx="4.5" cy="4.2" r=".7" fill="#3a0a0a" opacity=".5"/></pattern>
  <clipPath id="nc"><path d="${SHAPES[shape]}"/></clipPath>
  <filter id="cast" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.1"/></filter>
  <filter id="soft4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="soft6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="card" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#4a0e0e" flood-opacity=".14"/></filter>
</defs>
<rect width="800" height="1000" fill="url(#surf)"/>
<ellipse cx="400" cy="460" rx="420" ry="380" fill="url(#spot)"/>
${body}
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
