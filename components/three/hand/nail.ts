import * as THREE from "three";
import type { Length, Shape } from "@/lib/types";
import { FingerModel } from "./anatomy";

/**
 * Uña press-on como cáscara: superficie superior con curva C transversal (sigue el dorso del dedo
 * + un poco más de curva), arco longitudinal con ápice, espesor y canto redondeado.
 * La grilla (u a lo ancho, s a lo largo) es la misma para todas las formas, así que cambiar
 * forma o largo es interpolar posiciones vértice a vértice (morph).
 */

export const NR = 40; // filas a lo largo
export const NC = 18; // columnas a lo ancho

/** largo libre (cm más allá del lecho) para una uña de 1,1 cm de ancho */
export const FREE_LEN: Record<Length, number> = { corto: 0.24, medio: 0.58, largo: 0.98, xl: 1.42 };

export type NailDims = { W: number; bed: number; L: number; free: number; Lref: number };

export function nailDims(model: FingerModel, length: Length): NailDims {
  const { w: W, bed } = model.spec.nail;
  const k = W / 1.1;
  const free = FREE_LEN[length] * k;
  return { W, bed, free, L: bed + free, Lref: bed + FREE_LEN.xl * k + 0.06 };
}

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** semiancho de la uña a la distancia y de la cutícula */
export function halfWidth(shape: Shape, y: number, d: NailDims): number {
  const { W, bed, L } = d;
  const yb = 0.3 * W;
  const base = y < yb ? Math.sqrt(Math.max(0, 1 - (1 - y / yb) ** 2)) : 1;
  let hw = (W / 2) * (0.965 + 0.035 * Math.min(1, y / bed));
  const minStart = 0.55 * bed; // la base no cambia nunca (la cutícula es fija)
  switch (shape) {
    case "cuadrada": {
      const r = 0.12 * W;
      if (y > L - r) {
        const dy = y - (L - r);
        hw = hw - r + Math.sqrt(Math.max(0, r * r - dy * dy));
      }
      break;
    }
    case "coffin": {
      const ys = Math.max(minStart, bed - 0.18 * W);
      const span = L - ys;
      const endHalf = (W / 2) * clamp(0.92 - (0.32 * span) / W, 0.54, 0.86);
      const lin = (yy: number) => (yy <= ys ? hw : hw + (endHalf - hw) * ((yy - ys) / span));
      const r = 0.07 * W;
      if (y > L - r) {
        const dy = y - (L - r);
        hw = lin(L - r) - r + Math.sqrt(Math.max(0, r * r - dy * dy));
      } else hw = lin(y);
      break;
    }
    case "ovalada": {
      const len = Math.min(0.6 * W, L - minStart);
      const ys = L - len;
      if (y > ys) hw *= Math.sqrt(Math.max(0, 1 - ((y - ys) / len) ** 2));
      break;
    }
    case "almendra": {
      const len = Math.min(Math.max(0.78 * W, L - bed + 0.55 * W), L - minStart);
      const ys = L - len;
      if (y > ys) {
        const t = (y - ys) / len;
        hw *= Math.pow(Math.max(0, 1 - Math.pow(t, 1.9)), 0.58);
      }
      break;
    }
    case "stiletto": {
      const len = Math.min(Math.max(0.95 * W, L - bed + 0.8 * W), L - minStart);
      const ys = L - len;
      if (y > ys) {
        const t = (y - ys) / len;
        hw *= Math.pow(Math.max(0, 1 - t), 0.9) * (1 - 0.06 * Math.sin(Math.PI * t));
      }
      break;
    }
  }
  return Math.max(0, hw * base);
}

/** fila → fracción de largo (más densa en base y punta) */
export const rowS = (k: number) => (1 - Math.cos((Math.PI * k) / NR)) / 2;

type Ctx = {
  model: FingerModel;
  /** frame del lecho al final, para extrapolar el borde libre */
  endFrame: ReturnType<FingerModel["frame"]>;
  endTangent: THREE.Vector3;
  endCenter: THREE.Vector3;
};

export function nailContext(model: FingerModel, d: NailDims): Ctx {
  const vE = model.vCuticle + d.bed / model.length;
  const endFrame = model.frame(vE);
  const p0 = nailBedPoint(model, 0, d.bed - 0.05, new THREE.Vector3(), 0);
  const p1 = nailBedPoint(model, 0, d.bed, new THREE.Vector3(), 0);
  return { model, endFrame, endTangent: p1.sub(p0).normalize(), endCenter: nailBedPoint(model, 0, d.bed, new THREE.Vector3(), 0) };
}

/** profundidad extra de la curva C de la press-on respecto del dedo */
const C_EXTRA = 0.022;

function lift(y: number, d: NailDims) {
  // la uña nace apenas sobre la piel (sin hundirse: evita el serrucho contra la malla del dedo)
  // y sube hasta separarse ~0,4 mm; ápice suave
  const rise = THREE.MathUtils.smoothstep(y, 0, 0.5 * d.W);
  const apex = 0.022 * Math.sin(Math.PI * clamp(y / (d.bed * 1.15), 0, 1));
  return 0.004 + 0.032 * rise + apex;
}

type BedSection = { a0: number; a1: number; b0: number; b1: number; span: number };
const bedCache = new WeakMap<FingerModel, BedSection>();

/** sección del lecho suavizada (lineal entre cutícula y final del lecho): la placa de una press-on es rígida */
function bedSection(model: FingerModel): BedSection {
  let c = bedCache.get(model);
  if (!c) {
    const span = model.spec.nail.bed + 0.1;
    const f0 = model.frame(model.vCuticle);
    const f1 = model.frame(model.vCuticle + span / model.length);
    c = { a0: f0.aU, a1: f1.aU, b0: f0.bTopU, b1: f1.bTopU, span };
    bedCache.set(model, c);
  }
  return c;
}

type Frame = ReturnType<FingerModel["frame"]>;

const frameAt = (model: FingerModel, y: number) => model.frame(model.vCuticle + y / model.length);

function nailBedPoint(model: FingerModel, x: number, y: number, out: THREE.Vector3, W: number, f: Frame = frameAt(model, y)) {
  // sin las ondas de la yema y de la cintura de la falange (el reflejo queda recto)
  const c = bedSection(model);
  const t = clamp(y / c.span, 0, 1);
  const bLin = c.b0 + (c.b1 - c.b0) * t;
  const top = FingerModel.dorsalOffset({ ...f, aU: c.a0 + (c.a1 - c.a0) * t, bTopU: bLin }, x) + (f.bTopU - bLin);
  const curve = W > 0 ? -C_EXTRA * (2 * x / W) ** 2 : 0;
  out.copy(f.C).addScaledVector(f.S, x).addScaledVector(f.U, top + curve);
  return out;
}

const _p = new THREE.Vector3();

/** punto de la superficie superior de la uña en (x lateral, y desde la cutícula); `f` = frame del dedo en y (opcional, cacheable por fila) */
export function nailTopPoint(ctx: Ctx, d: NailDims, x: number, y: number, out: THREE.Vector3, f?: Frame) {
  const m = ctx.model;
  if (y <= d.bed) {
    const fr = f ?? frameAt(m, y);
    nailBedPoint(m, x, y, out, d.W, fr);
    out.addScaledVector(fr.U, lift(y, d));
    return out;
  }
  // borde libre: sigue la tangente del final del lecho con una caída leve
  const fe = ctx.endFrame;
  const dy = y - d.bed;
  const top = FingerModel.dorsalOffset(fe, x) - FingerModel.dorsalOffset(fe, 0);
  const curve = -C_EXTRA * (2 * x / d.W) ** 2;
  out
    .copy(ctx.endCenter)
    .addScaledVector(fe.S, x)
    .addScaledVector(fe.U, top + curve + lift(d.bed, d) - 0.03 * dy * dy - 0.012 * dy)
    .addScaledVector(ctx.endTangent, dy);
  return out;
}

function frameRow(ctx: Ctx, d: NailDims, y: number): Frame {
  return y > d.bed ? ctx.endFrame : frameAt(ctx.model, y);
}

export type NailBuffers = { pos: Float32Array; nrm: Float32Array; top: Float32Array; uv: Float32Array; L: number };

const TOP_COUNT = (NR + 1) * (NC + 1);
// borde: izquierda (NR+1) + punta (NC+1) + derecha (NR+1) + base (NC+1)
const RING = 2 * (NR + 1) + 2 * (NC + 1);
export const NAIL_VERTS = TOP_COUNT * 2 + RING * 3;

function ringIndex(): Array<[number, number]> {
  const r: Array<[number, number]> = [];
  for (let k = 0; k <= NR; k++) r.push([k, 0]);
  for (let j = 0; j <= NC; j++) r.push([NR, j]);
  for (let k = NR; k >= 0; k--) r.push([k, NC]);
  for (let j = NC; j >= 0; j--) r.push([0, j]);
  return r;
}
const RING_IDX = ringIndex();

/** geometría base con índices y UV (las posiciones se escriben con computeNail) */
export function createNailGeometry(d: NailDims) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NAIL_VERTS * 3), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(NAIL_VERTS * 3), 3));
  g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(NAIL_VERTS * 2), 2));
  const idx: number[] = [];
  const row = NC + 1;
  for (let k = 0; k < NR; k++) {
    for (let j = 0; j < NC; j++) {
      const a = k * row + j;
      const b = a + row;
      // superior (normal hacia afuera = U)
      idx.push(a, a + 1, b, a + 1, b + 1, b);
      // inferior (invertida)
      const o = TOP_COUNT;
      idx.push(o + a, o + b, o + a + 1, o + a + 1, o + b, o + b + 1);
    }
  }
  const w0 = TOP_COUNT * 2;
  for (let r = 0; r < RING; r++) {
    const n = (r + 1) % RING;
    for (let layer = 0; layer < 2; layer++) {
      const a = w0 + layer * RING + r;
      const b = w0 + layer * RING + n;
      const c = w0 + (layer + 1) * RING + r;
      const e = w0 + (layer + 1) * RING + n;
      idx.push(a, b, c, b, e, c);
    }
  }
  g.setIndex(idx);
  // UV fijos en coordenadas físicas: la decoración no se estira al cambiar el largo
  g.userData.dims = d;
  return g;
}

/** calcula posiciones/normales destino para una forma y largo */
export function computeNail(index: THREE.BufferAttribute, ctx: Ctx, shape: Shape, d: NailDims): NailBuffers {
  const pos = new Float32Array(NAIL_VERTS * 3);
  const uvs = new Float32Array(NAIL_VERTS * 2);
  const uv = { setXY: (i: number, a: number, b: number) => uvs.set([a, b], i * 2), getX: (i: number) => uvs[i * 2], getY: (i: number) => uvs[i * 2 + 1] };
  const top = new Float32Array(TOP_COUNT * 3);
  const row = NC + 1;
  const thickness = (y: number) => 0.05 - 0.016 * THREE.MathUtils.smoothstep(y, d.bed, d.L);
  const ups: THREE.Vector3[] = [];
  const frames: Frame[] = [];
  for (let k = 0; k <= NR; k++) {
    const y = rowS(k) * d.L;
    const hw = halfWidth(shape, y, d);
    // un solo frame del dedo por fila (el frame depende solo de y)
    const f = frameRow(ctx, d, y);
    frames.push(f);
    const U = f.U;
    ups.push(U);
    for (let j = 0; j <= NC; j++) {
      const u = (j / NC) * 2 - 1;
      const x = u * hw;
      nailTopPoint(ctx, d, x, y, _p, f);
      const i = k * row + j;
      top.set([_p.x, _p.y, _p.z], i * 3);
      pos.set([_p.x, _p.y, _p.z], i * 3);
      const th = thickness(y);
      pos.set([_p.x - U.x * th, _p.y - U.y * th, _p.z - U.z * th], (TOP_COUNT + i) * 3);
      uv.setXY(i, x / d.W + 0.5, y / d.Lref);
      uv.setXY(TOP_COUNT + i, x / d.W + 0.5, y / d.Lref);
    }
  }
  // canto: tres anillos (arriba, medio redondeado hacia afuera, abajo)
  const w0 = TOP_COUNT * 2;
  const outs: THREE.Vector3[] = [];
  const center = new THREE.Vector3();
  const pt = new THREE.Vector3();
  const pb = new THREE.Vector3();
  const prev = new THREE.Vector3();
  const next = new THREE.Vector3();
  const out = new THREE.Vector3();
  for (let r = 0; r < RING; r++) {
    const [k, j] = RING_IDX[r];
    const i = k * row + j;
    pt.fromArray(top, i * 3);
    pb.fromArray(pos, (TOP_COUNT + i) * 3);
    const y = rowS(k) * d.L;
    // dirección hacia afuera: del eje de la uña al borde, o a lo largo en punta/base
    nailTopPoint(ctx, d, 0, y, center, frames[k]);
    out.subVectors(pt, center);
    if (out.lengthSq() < 1e-8) {
      const [pk, pj] = RING_IDX[(r - 1 + RING) % RING];
      const [nk, nj] = RING_IDX[(r + 1) % RING];
      prev.fromArray(top, (pk * row + pj) * 3);
      next.fromArray(top, (nk * row + nj) * 3);
      out.subVectors(next, prev).cross(ups[k]);
      if (k === 0) out.negate();
      if (out.lengthSq() < 1e-8) out.copy(ctx.endTangent).multiplyScalar(k === 0 ? -1 : 1);
    }
    out.normalize();
    outs.push(out.clone());
    const th = thickness(y);
    // el anillo medio casi no sale de la silueta: si asoma menos de 1 px, el MSAA lo muestrea a saltos (contorno punteado)
    const mid = pt.clone().add(pb).multiplyScalar(0.5).addScaledVector(out, th * 0.04);
    pos.set([pt.x, pt.y, pt.z], (w0 + r) * 3);
    pos.set([mid.x, mid.y, mid.z], (w0 + RING + r) * 3);
    pos.set([pb.x, pb.y, pb.z], (w0 + 2 * RING + r) * 3);
    const u0 = uv.getX(i);
    const v0 = uv.getY(i);
    for (let l = 0; l < 3; l++) uv.setXY(w0 + l * RING + r, u0, v0);
  }
  // normales: geometría temporal con los mismos índices
  const tmp = new THREE.BufferGeometry();
  tmp.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  tmp.setIndex(index);
  tmp.computeVertexNormals();
  const nrm = (tmp.getAttribute("normal") as THREE.BufferAttribute).array as Float32Array;
  tmp.setIndex(null);
  tmp.dispose();
  // canto redondeado: el anillo superior hereda la normal de la cara superior y el del medio
  // mezcla esa normal con la dirección hacia afuera (evita un contorno oscuro tipo dibujo)
  const n = new THREE.Vector3();
  const tn = new THREE.Vector3();
  for (let r = 0; r < RING; r++) {
    const [k, j] = RING_IDX[r];
    const i = k * row + j;
    tn.fromArray(nrm, i * 3);
    tn.toArray(nrm, (w0 + r) * 3);
    n.copy(tn).multiplyScalar(0.75).addScaledVector(outs[r], 0.65).normalize();
    n.toArray(nrm, (w0 + RING + r) * 3);
    // el anillo inferior también mira "hacia arriba": el canto se lee claro y no como un trazo oscuro
    n.toArray(nrm, (w0 + 2 * RING + r) * 3);
  }
  return { pos, nrm: new Float32Array(nrm), top, uv: uvs, L: d.L };
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _e = new THREE.Vector3();
const _du = new THREE.Vector3();
const _ds = new THREE.Vector3();
const _tmp = new THREE.Vector3();

/** muestreo bilineal de la superficie superior en (u ∈ [-1,1], s ∈ [0,1]) (sin crear objetos) */
export function sampleTop(top: Float32Array, u: number, s: number, outP: THREE.Vector3, outN: THREE.Vector3, outT: THREE.Vector3) {
  const row = NC + 1;
  const kf = clamp((Math.acos(clamp(1 - 2 * s, -1, 1)) / Math.PI) * NR, 0, NR - 0.0001);
  const jf = clamp(((u + 1) / 2) * NC, 0, NC - 0.0001);
  const k = Math.floor(kf);
  const j = Math.floor(jf);
  const fk = kf - k;
  const fj = jf - j;
  const at = (kk: number, jj: number, o: THREE.Vector3) => o.fromArray(top, (kk * row + jj) * 3);
  const a = at(k, j, _a);
  const b = at(k, j + 1, _b);
  const c = at(k + 1, j, _c);
  const e = at(k + 1, j + 1, _e);
  outP.copy(a).lerp(b, fj).lerp(_tmp.copy(c).lerp(e, fj), fk);
  const du = _du.subVectors(b, a).lerp(_tmp.subVectors(e, c), fk);
  const ds = _ds.subVectors(c, a).lerp(_tmp.subVectors(e, b), fj);
  if (ds.lengthSq() < 1e-10) ds.set(0, 1, 0);
  if (du.lengthSq() < 1e-10) du.set(1, 0, 0);
  outT.copy(ds).normalize();
  outN.crossVectors(du, ds).normalize();
  return outP;
}
