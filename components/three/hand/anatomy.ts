import * as THREE from "three";

/**
 * Anatomía procedural de la mano (derecha, palma abajo, apoyada sobre la mesa).
 * Unidades: centímetros. Plano de la mesa = z 0, los dedos apuntan a +Y y el dorso mira a +Z.
 *
 * Cada dedo es un barrido (sweep) de una sección superelíptica cuyo radio se afina a lo largo
 * de la falange, con bultos sutiles en los nudillos, almohadilla distal y una punta redondeada
 * "espatulada" (superelipse, no media esfera). La sección es más plana abajo (yema apoyada).
 */

export type FingerId = "thumb" | "index" | "middle" | "ring" | "pinky";

export type FingerSpec = {
  id: FingerId;
  /** articulación de la base (MCP) sobre el plano de la mesa */
  base: [number, number];
  /** grados; positivo inclina el dedo hacia +X */
  angle: number;
  /** largos de falanges, de proximal a distal (cm) */
  segs: number[];
  /** ancho a la altura del nudillo medio (cm) */
  width: number;
  /** alto/ancho de la sección */
  thick: number;
  /** giro sobre el propio eje (grados); positivo lleva el dorso hacia +X */
  roll: number;
  /** altura de la cara palmar en la base: el dedo sube hacia el nudillo */
  lift: number;
  /** curvatura lateral (cm de desvío en la punta) */
  curl: number;
  nail: { w: number; bed: number };
};

/** Orden visual de izquierda a derecha: pulgar, índice, medio, anular, meñique (igual que la vista 2D). */
export const FINGERS: FingerSpec[] = [
  // pulgar: más largo y afinado, recostado de costado junto al índice (se ve la articulación y la uña de tres cuartos)
  { id: "thumb", base: [-4.25, -2.3], angle: -22, segs: [3.5, 3.05], width: 1.74, thick: 0.84, roll: -30, lift: 0.55, curl: 0.22, nail: { w: 1.24, bed: 1.42 } },
  { id: "index", base: [-2.45, 0.1], angle: -7, segs: [4.1, 2.45, 2.15], width: 1.56, thick: 0.82, roll: 6, lift: 1.0, curl: 0.14, nail: { w: 1.05, bed: 1.24 } },
  { id: "middle", base: [-0.8, 0.45], angle: -1.5, segs: [4.45, 2.8, 2.3], width: 1.6, thick: 0.82, roll: 0, lift: 1.05, curl: 0.03, nail: { w: 1.09, bed: 1.32 } },
  { id: "ring", base: [0.86, 0.15], angle: 4.5, segs: [4.15, 2.65, 2.2], width: 1.52, thick: 0.82, roll: -4, lift: 1.0, curl: -0.12, nail: { w: 1.01, bed: 1.24 } },
  { id: "pinky", base: [2.38, -0.7], angle: 10.5, segs: [3.3, 2.0, 1.95], width: 1.3, thick: 0.82, roll: -9, lift: 0.92, curl: -0.18, nail: { w: 0.84, bed: 1.02 } },
];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const gauss = (x: number, s: number) => Math.exp(-(x * x) / (2 * s * s));
const superCap = (t: number, p: number) => (t <= 0 ? 1 : t >= 1 ? 0 : Math.pow(1 - Math.pow(t, p), 1 / p));

export type FingerFrame = {
  C: THREE.Vector3;
  T: THREE.Vector3;
  S: THREE.Vector3;
  U: THREE.Vector3;
  /** semiancho y semialtos con punta redondeada */
  a: number;
  bTop: number;
  bBot: number;
  /** mismos valores sin el redondeo de la punta (la uña apoya sobre el hueso, no sobre la yema) */
  aU: number;
  bTopU: number;
};

const Z = new THREE.Vector3(0, 0, 1);

export class FingerModel {
  readonly spec: FingerSpec;
  readonly length: number;
  /** fracciones de largo donde están las articulaciones */
  readonly joints: number[];
  /** fracción de largo donde arranca la uña (cutícula) */
  readonly vCuticle: number;
  private readonly A: number;
  private readonly dir: THREE.Vector2;
  private readonly perp: THREE.Vector2;

  constructor(spec: FingerSpec) {
    this.spec = spec;
    this.length = spec.segs.reduce((s, x) => s + x, 0);
    let acc = 0;
    this.joints = spec.segs.slice(0, -1).map((s) => (acc += s) / this.length);
    this.A = spec.width / 2;
    const r = (spec.angle * Math.PI) / 180;
    this.dir = new THREE.Vector2(Math.sin(r), Math.cos(r));
    this.perp = new THREE.Vector2(Math.cos(r), -Math.sin(r));
    // la uña termina ~1,2 mm antes de la punta del dedo
    this.vCuticle = 1 - (spec.nail.bed + 0.12) / this.length;
  }

  private widthRel(v: number) {
    // hacia la base (v < 0) el dedo se ensancha y se funde con el dorso de la mano
    // se afina hacia la punta (más en la falange distal): dedos largos y finos, no tubos
    const vv = Math.max(v, -0.1);
    let w = 1.07 - 0.13 * vv - 0.1 * vv * vv;
    // dorso de la mano: hacia la base los dedos se ensanchan hasta fundirse (sin huecos de fondo)
    if (this.spec.id !== "thumb") w += 0.62 * smooth(0.1, -0.22, v);
    // cintura sutil en el medio de cada falange
    const marks = [0, ...this.joints, 1];
    for (let i = 0; i < marks.length - 1; i++) w -= 0.04 * gauss(v - (marks[i] + marks[i + 1]) / 2, (marks[i + 1] - marks[i]) * 0.22);
    for (const j of this.joints) w += 0.045 * gauss(v - j, 0.035);
    // almohadilla distal: la yema es apenas más ancha que la articulación
    const last = this.joints[this.joints.length - 1] ?? 0.5;
    w += 0.04 * gauss(v - (last + (1 - last) * 0.62), 0.07);
    w -= 0.02 * gauss(v - last, 0.03);
    return w;
  }

  private heightRel(v: number, top: boolean) {
    let h = 1 - 0.17 * v;
    if (this.spec.id !== "thumb") h += 0.22 * smooth(0.08, -0.25, v);
    if (top) {
      // nudillos marcados en el dorso
      this.joints.forEach((j, i) => {
        h += (i === this.joints.length - 1 ? 0.03 : 0.075) * gauss(v - j, 0.032);
      });
    }
    return h;
  }

  /** altura de la cara palmar sobre la mesa: sube hacia el nudillo de la base */
  private palmarHeight(v: number) {
    // mano relajada: el nudillo medio (PIP) es lo más alto de los dedos, la yema apoya
    const L = this.spec.lift;
    const knots: Array<[number, number]> =
      this.joints.length >= 2
        ? [
            [-0.4, L * 1.35],
            [0, L],
            [this.joints[0], L * 0.42],
            [this.joints[1], L * 0.16],
            [1, 0],
          ]
        : [
            [-0.4, L * 1.3],
            [0, L],
            [this.joints[0], L * 0.3],
            [1, 0],
          ];
    for (let i = 0; i < knots.length - 1; i++) {
      const [v0, h0] = knots[i];
      const [v1, h1] = knots[i + 1];
      if (v <= v1 || i === knots.length - 2) {
        const t = Math.min(1, Math.max(0, (v - v0) / (v1 - v0)));
        // tangentes de Catmull-Rom para que no haya quiebres
        const hPrev = knots[Math.max(0, i - 1)][1];
        const hNext = knots[Math.min(knots.length - 1, i + 2)][1];
        const m0 = (h1 - hPrev) / 2;
        const m1 = (hNext - h0) / 2;
        const t2 = t * t;
        const t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * h0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * h1 + (t3 - t2) * m1 + 0.015;
      }
    }
    return 0.015;
  }

  private sizes(v: number) {
    const A = this.A;
    const L = this.length;
    const dist = (1 - v) * L; // distancia a la punta
    const aU = A * this.widthRel(v);
    const capW = 0.92 * A;
    const capT = 0.5 * A;
    const capB = 1.05 * A;
    const a = aU * superCap(1 - dist / capW, 2.6);
    const bTopU = A * this.spec.thick * this.heightRel(v, true);
    const bTop = bTopU * superCap(1 - dist / capT, 2.2);
    const bBotU = A * this.spec.thick * 0.8 * this.heightRel(v, false);
    const bBot = bBotU * superCap(1 - dist / capB, 2.0);
    return { a, aU, bTop, bTopU, bBot, bBotU };
  }

  private spine(v: number, out: THREE.Vector3) {
    const { base, curl } = this.spec;
    const along = v * this.length;
    const side = curl * Math.max(0, v) * v;
    const s = this.sizes(v);
    // cuánto baja la sección girada (para que el pulgar de costado no atraviese la mesa)
    const r = (this.spec.roll * Math.PI) / 180;
    const down = Math.sqrt((s.aU * Math.sin(r)) ** 2 + (s.bBotU * Math.cos(r)) ** 2);
    // por debajo de la base el dedo baja derecho (no se cruza con los vecinos)
    const k = v < 0 ? smooth(0, -0.3, v) : 0;
    const dx = this.dir.x * (1 - k);
    const dy = this.dir.y * (1 - k) + k;
    out.set(base[0] + dx * along + this.perp.x * side, base[1] + dy * along + this.perp.y * side, this.palmarHeight(v) + down);
    return out;
  }

  frame(v: number): FingerFrame {
    const C = this.spine(v, new THREE.Vector3());
    const e = 0.002;
    const p0 = this.spine(Math.max(0, v - e), new THREE.Vector3());
    const p1 = this.spine(Math.min(1, v + e), new THREE.Vector3());
    const T = p1.sub(p0).normalize();
    const S0 = new THREE.Vector3().crossVectors(T, Z).normalize();
    const U0 = new THREE.Vector3().crossVectors(S0, T).normalize();
    const r = (this.spec.roll * Math.PI) / 180;
    const U = U0.clone().multiplyScalar(Math.cos(r)).addScaledVector(S0, Math.sin(r));
    const S = S0.clone().multiplyScalar(Math.cos(r)).addScaledVector(U0, -Math.sin(r));
    const s = this.sizes(v);
    return { C, T, S, U, a: s.a, bTop: s.bTop, bBot: s.bBot, aU: s.aU, bTopU: s.bTopU };
  }

  /** altura del dorso (sin punta redondeada) a una distancia lateral x del eje */
  static dorsalOffset(f: FingerFrame, x: number) {
    const n = 2.4;
    const q = Math.min(0.999, Math.abs(x) / f.aU);
    return f.bTopU * Math.pow(1 - Math.pow(q, n), 1 / n);
  }

  /**
   * Distancia (cm, con signo: negativa adentro) al contorno de la base de la uña, en coordenadas de
   * la uña (x lateral, y desde la cutícula). La base es media elipse; los costados, rectos.
   */
  private nailDist(x: number, y: number) {
    const { w: W } = this.spec.nail;
    const hw = W / 2;
    const yb = 0.3 * W;
    if (y >= yb) return Math.abs(x) - hw;
    const qx = x / hw;
    const qy = (y - yb) / yb;
    return (Math.hypot(qx, qy) - 1) * Math.min(hw, yb) * 1.15;
  }

  /**
   * Relieve de la piel alrededor de la uña: el lecho baja ~0,6 mm (la placa apoya en un surco y nunca
   * se cruza con la piel) y alrededor nace el pliegue: el eponiquio en la base, que tapa el borde de la
   * uña, y los pliegues laterales que la abrazan y se apagan hacia la punta.
   */
  private nailRelief(v: number, x: number) {
    const { bed } = this.spec.nail;
    const y = (v - this.vCuticle) * this.length;
    if (y < -0.4 || y > bed + 0.25) return 0;
    const d = this.nailDist(x, y);
    const along = 1 - smooth(bed - 0.1, bed + 0.15, y);
    const recess = 0.06 * (1 - smooth(-0.11, 0.015, d)) * smooth(-0.06, 0.02, y) * along;
    // el pliegue es más alto en la base (eponiquio) y se afina por los costados
    const prox = 1 - smooth(0.0, 0.75 * bed, y);
    const h = (0.012 + 0.016 * prox) * (1 - smooth(0.75 * bed, bed + 0.1, y));
    const fold = h * Math.exp(-(((d - 0.03) / 0.032) ** 2));
    return fold - recess;
  }

  /** anillos a lo largo: densos alrededor de la cutícula (el pliegue es fino), medios en la uña y la punta */
  private ringVs(vMin: number) {
    const L = this.length;
    const vc = this.vCuticle;
    const vs: number[] = [];
    let v = vMin;
    while (v < 1) {
      vs.push(v);
      const y = (v - vc) * L;
      const step = y > -0.25 && y < 0.45 ? 0.03 : y >= 0.45 ? 0.055 : 0.15;
      v += step / L;
    }
    vs.push(1);
    return vs;
  }

  buildGeometry(around = 58, vMin = -0.32) {
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const vs = this.ringVs(vMin);
    const rings = vs.length - 1;
    for (let k = 0; k <= rings; k++) {
      const v = vs[k];
      const f = this.frame(v);
      for (let j = 0; j <= around; j++) {
        // costura abajo (cara palmar), dorso en u = 0,5; más muestras en el dorso (ahí está la uña)
        const t = j / around;
        const u = t - (0.7 / (Math.PI * 2)) * Math.sin(Math.PI * 2 * (t - 0.5));
        const th = -Math.PI / 2 + u * Math.PI * 2;
        const c = Math.cos(th);
        const s = Math.sin(th);
        const n = s >= 0 ? 2.4 : 3.3;
        const x = f.a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n);
        let z = (s >= 0 ? f.bTop : f.bBot) * Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
        if (s > 0) z += this.nailRelief(v, x) * Math.min(1, s * 3);
        pos.push(f.C.x + f.S.x * x + f.U.x * z, f.C.y + f.S.y * x + f.U.y * z, f.C.z + f.S.z * x + f.U.z * z);
        uv.push(u, v);
      }
    }
    const row = around + 1;
    for (let k = 0; k < rings; k++) {
      for (let j = 0; j < around; j++) {
        const a = k * row + j;
        const b = a + row;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    // la costura duplica vértices: promediamos sus normales para que no se vea una línea
    const nrm = g.getAttribute("normal") as THREE.BufferAttribute;
    const tmp = new THREE.Vector3();
    for (let k = 0; k <= rings; k++) {
      const a = k * row;
      const b = a + around;
      tmp.set(nrm.getX(a) + nrm.getX(b), nrm.getY(a) + nrm.getY(b), nrm.getZ(a) + nrm.getZ(b)).normalize();
      nrm.setXYZ(a, tmp.x, tmp.y, tmp.z);
      nrm.setXYZ(b, tmp.x, tmp.y, tmp.z);
    }
    // la punta converge a un polo: usamos el eje como normal para evitar un punto oscuro
    const tipFrame = this.frame(1);
    for (let j = 0; j <= around; j++) nrm.setXYZ(rings * row + j, tipFrame.T.x, tipFrame.T.y, tipFrame.T.z);
    return g;
  }
}

/* ------------------------------------------------------------------ */
/* Piel: albedo y normal map procedurales por dedo (≤ 512 px)          */
/* ------------------------------------------------------------------ */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEX_W = 256;
const TEX_H = 512;

export const SKIN_BASE = "#e2c2b6";

/** Pinta albedo + mapa de alturas de la piel en coordenadas UV del dedo (u alrededor, v a lo largo). */
export function paintSkin(model: FingerModel, seed: number) {
  const rand = mulberry32(seed);
  const albedo = document.createElement("canvas");
  albedo.width = TEX_W;
  albedo.height = TEX_H;
  const ctx = albedo.getContext("2d")!;
  const vy = (v: number) => (1 - v) * TEX_H; // flipY: v=1 (punta) arriba
  const ux = (u: number) => u * TEX_W;

  ctx.fillStyle = SKIN_BASE;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // palma más clara y rosada (u ≈ 0 / 1), dorso apenas más tostado
  const side = ctx.createLinearGradient(0, 0, TEX_W, 0);
  side.addColorStop(0, "rgba(246,206,190,0.55)");
  side.addColorStop(0.18, "rgba(246,206,190,0)");
  side.addColorStop(0.27, "rgba(214,120,104,0.28)");
  side.addColorStop(0.36, "rgba(214,120,104,0)");
  side.addColorStop(0.5, "rgba(196,132,104,0.10)");
  side.addColorStop(0.64, "rgba(214,120,104,0)");
  side.addColorStop(0.73, "rgba(214,120,104,0.28)");
  side.addColorStop(0.82, "rgba(246,206,190,0)");
  side.addColorStop(1, "rgba(246,206,190,0.55)");
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // hacia la base, un poco más dorado
  const along = ctx.createLinearGradient(0, vy(0), 0, vy(1));
  along.addColorStop(0, "rgba(206,150,110,0.16)");
  along.addColorStop(0.6, "rgba(206,150,110,0)");
  along.addColorStop(0.9, "rgba(226,130,116,0.10)");
  along.addColorStop(1, "rgba(226,120,110,0.32)");
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const blob = (u: number, v: number, ru: number, rv: number, color: string, alpha: number) => {
    ctx.save();
    ctx.translate(ux(u), vy(v));
    ctx.scale(ru * TEX_W, rv * TEX_H);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, color.replace("ALPHA", String(alpha)));
    g.addColorStop(1, color.replace("ALPHA", "0"));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // moteado sutil (la piel nunca es un color plano)
  for (let i = 0; i < 520; i++) {
    const tone = rand();
    const color = tone < 0.4 ? "rgba(214,128,112,ALPHA)" : tone < 0.75 ? "rgba(236,196,160,ALPHA)" : "rgba(250,222,205,ALPHA)";
    blob(rand(), rand(), 0.01 + rand() * 0.03, 0.004 + rand() * 0.014, color, 0.025 + rand() * 0.035);
  }
  // variación de tono amplia: zonas apenas más doradas y otras más rosadas (rompe el "plástico")
  for (let i = 0; i < 46; i++) {
    const warm = rand() < 0.5;
    blob(rand(), rand(), 0.07 + rand() * 0.16, 0.025 + rand() * 0.06, warm ? "rgba(228,190,150,ALPHA)" : "rgba(222,148,136,ALPHA)", 0.06 + rand() * 0.06);
  }
  // el centro de cada falange, un poco más claro y dorado que las articulaciones
  const marks = [0, ...model.joints, model.vCuticle];
  for (let i = 0; i < marks.length - 1; i++) {
    const mid = (marks[i] + marks[i + 1]) / 2;
    blob(0.5, mid, 0.22, (marks[i + 1] - marks[i]) * 0.38, "rgba(240,206,176,ALPHA)", 0.14);
  }
  // líneas finas de la piel en el albedo (casi invisibles: dan textura, no dibujo)
  ctx.save();
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 420; i++) {
    const x = rand() * TEX_W;
    const y = rand() * TEX_H;
    const a = (rand() < 0.5 ? 0.6 : -0.6) + (rand() - 0.5) * 0.3;
    const l = 3 + rand() * 6;
    ctx.strokeStyle = `rgba(170,104,92,${0.035 + rand() * 0.03})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  ctx.restore();
  // nudillos rojizos y arrugados
  model.joints.forEach((j, i) => {
    const big = i < model.joints.length - 1;
    blob(0.5, j, big ? 0.17 : 0.12, big ? 0.05 : 0.03, "rgba(200,110,96,ALPHA)", big ? 0.32 : 0.22);
    blob(0.5, j + 0.004, big ? 0.08 : 0.06, big ? 0.02 : 0.014, "rgba(176,92,80,ALPHA)", big ? 0.2 : 0.14);
  });
  // yema y punta más rosadas
  blob(0.5, 0.995, 0.45, 0.06, "rgba(226,118,108,ALPHA)", 0.32);
  blob(0.0, 0.97, 0.2, 0.08, "rgba(230,130,120,ALPHA)", 0.3);
  blob(1.0, 0.97, 0.2, 0.08, "rgba(230,130,120,ALPHA)", 0.3);
  // pliegue periungueal: rosado alrededor de la uña
  const vc = model.vCuticle;
  const nailU = model.spec.nail.w / (Math.PI * model.spec.width) / 1.15;
  blob(0.5, vc + 0.004, nailU * 1.25, 0.018, "rgba(214,112,100,ALPHA)", 0.14);
  blob(0.5 - nailU * 0.95, vc + (1 - vc) * 0.4, 0.035, (1 - vc) * 0.45, "rgba(214,112,100,ALPHA)", 0.1);
  blob(0.5 + nailU * 0.95, vc + (1 - vc) * 0.4, 0.035, (1 - vc) * 0.45, "rgba(214,112,100,ALPHA)", 0.1);

  // arrugas del nudillo en el albedo: líneas finas irregulares (largo, curva y corrimiento propios, algunas cortadas)
  const creases = (j: number, count: number, spread: number, width: number, alpha: number) => {
    ctx.save();
    ctx.lineCap = "round";
    for (let c = 0; c < count; c++) {
      const v = j + (c - (count - 1) / 2) * spread + (rand() - 0.5) * spread * 0.4;
      const half = width * (0.55 + rand() * 0.45) * (1 - (Math.abs(c - (count - 1) / 2) / count) * 0.6);
      const bendK = -(0.006 + rand() * 0.012);
      const shift = (rand() - 0.5) * 0.04;
      const cut = rand() < 0.35 ? 4 + Math.floor(rand() * 9) : -1;
      ctx.strokeStyle = `rgba(150,78,64,${alpha * (0.6 + rand() * 0.5)})`;
      ctx.lineWidth = 0.8 + rand() * 0.6;
      ctx.beginPath();
      for (let s = 0; s <= 16; s++) {
        const q = s / 16;
        const u = 0.5 + shift + (q - 0.5) * 2 * half;
        const bend = bendK * Math.pow((q - 0.5) * 2, 2);
        const px = ux(u);
        const py = vy(v + bend + Math.sin(q * 9 + c) * 0.0008);
        if (s === cut) {
          // pequeño corte en el trazo
          ctx.stroke();
          ctx.beginPath();
        } else if (s === 0 || s === cut + 1) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  };
  model.joints.forEach((j, i) => {
    const big = i < model.joints.length - 1;
    creases(j, big ? 5 : 3, big ? 0.0085 : 0.0065, big ? 0.11 : 0.075, big ? 0.14 : 0.09);
  });

  /* ---------- alturas → normal map ---------- */
  const hc = document.createElement("canvas");
  hc.width = TEX_W;
  hc.height = TEX_H;
  // canvas por software: lo leemos con getImageData (en un canvas acelerado, la lectura traba el hilo)
  const h = hc.getContext("2d", { willReadFrequently: true })!;
  h.fillStyle = "rgb(128,128,128)";
  h.fillRect(0, 0, TEX_W, TEX_H);
  // poros: grano fino y uniforme (ruido suavizado, más abajo); acá solo algunas depresiones apenas marcadas
  for (let i = 0; i < 900; i++) {
    const g = 128 - rand() * 26;
    h.fillStyle = `rgba(${g},${g},${g},0.3)`;
    h.beginPath();
    h.arc(rand() * TEX_W, rand() * TEX_H, 0.55 + rand() * 0.5, 0, Math.PI * 2);
    h.fill();
  }
  // micro líneas de piel: un cuadriculado diagonal suave (como el de la piel del dorso)
  h.strokeStyle = "rgba(100,100,100,0.2)";
  h.lineWidth = 0.7;
  for (let i = 0; i < 700; i++) {
    const x = rand() * TEX_W;
    const y = rand() * TEX_H;
    const a = (rand() < 0.5 ? 0.62 : -0.62) + (rand() - 0.5) * 0.35;
    const l = 4 + rand() * 9;
    h.beginPath();
    h.moveTo(x, y);
    h.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    h.stroke();
  }
  // surcos de las arrugas de los nudillos
  const grooves = (j: number, count: number, spread: number, width: number, depth: number) => {
    h.lineCap = "round";
    for (let c = 0; c < count; c++) {
      const v = j + (c - (count - 1) / 2) * spread;
      const half = width * (0.8 + rand() * 0.3);
      h.strokeStyle = `rgba(40,40,40,${depth})`;
      h.lineWidth = 1.4;
      h.beginPath();
      for (let s = 0; s <= 16; s++) {
        const q = s / 16;
        const u = 0.5 + (q - 0.5) * 2 * half;
        const bend = -0.012 * Math.pow((q - 0.5) * 2, 2);
        if (s === 0) h.moveTo(ux(u), vy(v + bend));
        else h.lineTo(ux(u), vy(v + bend));
      }
      h.stroke();
    }
  };
  model.joints.forEach((j, i) => {
    const big = i < model.joints.length - 1;
    grooves(j, big ? 6 : 3, big ? 0.0075 : 0.006, big ? 0.13 : 0.09, big ? 0.3 : 0.22);
  });

  const hd = h.getImageData(0, 0, TEX_W, TEX_H).data;
  // grano de piel: ruido blanco suavizado (3×3), sumado a la altura
  const N = TEX_W * TEX_H;
  const noise = new Float32Array(N);
  for (let i = 0; i < N; i++) noise[i] = rand() - 0.5;
  const hf = new Float32Array(N);
  for (let y = 0; y < TEX_H; y++) {
    for (let x = 0; x < TEX_W; x++) {
      let acc = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) acc += noise[((y + dy + TEX_H) % TEX_H) * TEX_W + ((x + dx + TEX_W) % TEX_W)];
      hf[y * TEX_W + x] = hd[(y * TEX_W + x) * 4] / 255 + (acc / 9) * 0.05;
    }
  }
  const nd = new Uint8Array(TEX_W * TEX_H * 4);
  const H = (x: number, y: number) => hf[((y + TEX_H) % TEX_H) * TEX_W + ((x + TEX_W) % TEX_W)];
  const strength = 2.8;
  for (let y = 0; y < TEX_H; y++) {
    for (let x = 0; x < TEX_W; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength; // canvas y crece hacia abajo = v decrece
      let nx = -dx;
      let ny = dy;
      let nz = 1;
      const l = Math.hypot(nx, ny, nz);
      nx /= l;
      ny /= l;
      nz /= l;
      // DataTexture no invierte Y: fila 0 = v 0, mientras el canvas tiene la fila 0 arriba
      const o = ((TEX_H - 1 - y) * TEX_W + x) * 4;
      nd[o] = (nx * 0.5 + 0.5) * 255;
      nd[o + 1] = (ny * 0.5 + 0.5) * 255;
      nd[o + 2] = (nz * 0.5 + 0.5) * 255;
      nd[o + 3] = 255;
    }
  }

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 4;
  const normalMap = new THREE.DataTexture(nd, TEX_W, TEX_H, THREE.RGBAFormat, THREE.UnsignedByteType);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.wrapS = THREE.RepeatWrapping;
  normalMap.magFilter = THREE.LinearFilter;
  normalMap.minFilter = THREE.LinearMipmapLinearFilter;
  normalMap.generateMipmaps = true;
  normalMap.needsUpdate = true;
  return { map, normalMap };
}
