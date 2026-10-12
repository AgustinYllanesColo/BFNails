import * as THREE from "three";

/**
 * Strass (flatback): faja vertical corta, corona en dos pisos de facetas triangulares alternadas
 * (como un chatón) y mesa chica. Sin índices y con una normal por cara: cada faceta refleja otra
 * dirección del entorno y destella por separado. Eje Y = normal de la uña, radio 1.
 */
export function createGemGeometry() {
  const N = 16;
  const ring = (r: number, h: number, half: boolean) =>
    Array.from({ length: N }, (_, k) => {
      const a = ((k + (half ? 0.5 : 0)) / N) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * r, h, Math.sin(a) * r);
    });
  const g0 = ring(1, 0, false);
  const g1 = ring(1, 0.1, false);
  const c1 = ring(0.8, 0.3, true);
  const t0 = ring(0.44, 0.44, false);
  const top = new THREE.Vector3(0, 0.44, 0);
  const tris: THREE.Vector3[][] = [];
  for (let k = 0; k < N; k++) {
    const n = (k + 1) % N;
    // faja
    tris.push([g0[k], g0[n], g1[n]], [g0[k], g1[n], g1[k]]);
    // corona baja: estrellas alternadas
    tris.push([g1[k], g1[n], c1[k]], [c1[k], g1[n], c1[n]]);
    // corona alta
    tris.push([c1[k], t0[n], t0[k]], [c1[k], c1[n], t0[n]]);
    // mesa
    tris.push([t0[k], t0[n], top]);
  }
  const pos = new Float32Array(tris.length * 9);
  const center = new THREE.Vector3(0, 0.18, 0);
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const nn = new THREE.Vector3();
  const cen = new THREE.Vector3();
  tris.forEach(([a, b, c], i) => {
    // orientación hacia afuera (la piedra es convexa)
    nn.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    cen.copy(a).add(b).add(c).multiplyScalar(1 / 3).sub(center);
    const [p, q, r] = nn.dot(cen) >= 0 ? [a, b, c] : [a, c, b];
    pos.set([p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z], i * 9);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** sombra de contacto de un strass: disco difuso (alfa en el canal verde) que se apoya sobre la uña */
export function createGemShadow() {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  // denso justo bajo la faja y se esfuma enseguida: apoya la piedra sin dibujarle un contorno
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.9)");
  g.addColorStop(0.5, "rgba(255,255,255,0.42)");
  g.addColorStop(0.66, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const texture = new THREE.CanvasTexture(c);
  // el disco mide 2,4 radios de piedra: asoma un anillo de sombra alrededor de la faja
  const geometry = new THREE.PlaneGeometry(2.3, 2.3).rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#3b1d14"),
    alphaMap: texture,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  return { geometry, material, texture };
}

/** Dije: corazón dorado inflado. Eje Z = normal de la uña. */
export function createHeartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(1.25, -0.05, 0.95, 0.95, 0, 0.42);
  s.bezierCurveTo(-0.95, 0.95, -1.25, -0.05, 0, -0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.16, bevelSegments: 5, curveSegments: 28 });
  g.translate(0, 0, 0.22);
  return smoothNormals(g);
}

/** Moño rojo tipo Kitty en relieve: dos lazos inflados + nudo central. Eje Z = normal. */
export function createBowGeometry() {
  const loop = (side: 1 | -1) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.16);
    s.bezierCurveTo(side * 0.3, 0.5, side * 0.86, 0.66, side * 0.95, 0.24);
    s.bezierCurveTo(side * 1.02, -0.12, side * 0.86, -0.6, side * 0.42, -0.5);
    s.bezierCurveTo(side * 0.22, -0.44, side * 0.08, -0.3, 0, -0.16);
    s.closePath();
    return s;
  };
  const opts = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.13, bevelSegments: 6, curveSegments: 30 };
  const left = new THREE.ExtrudeGeometry(loop(-1), opts);
  const right = new THREE.ExtrudeGeometry(loop(1), opts);
  left.translate(0, 0, 0.2);
  right.translate(0, 0, 0.2);
  const knot = new THREE.SphereGeometry(1, 24, 16);
  knot.scale(0.24, 0.3, 0.22);
  knot.translate(0, 0, 0.36);
  const parts = [left, right, knot].map((g) => (g.index ? g.toNonIndexed() : g));
  for (const p of parts) {
    if (p.getAttribute("uv")) p.deleteAttribute("uv");
  }
  return smoothNormals(mergeNonIndexed(parts));
}

/** promedia normales de vértices coincidentes (ExtrudeGeometry sale facetada) */
export function smoothNormals(g: THREE.BufferGeometry) {
  const geo = g.index ? g.toNonIndexed() : g;
  const p = geo.getAttribute("position") as THREE.BufferAttribute;
  const acc = new Map<string, THREE.Vector3>();
  const key = (i: number) => `${Math.round(p.getX(i) * 1e4)},${Math.round(p.getY(i) * 1e4)},${Math.round(p.getZ(i) * 1e4)}`;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    n.subVectors(c, b).cross(a.clone().sub(b));
    for (let k = 0; k < 3; k++) {
      const id = key(i + k);
      const v = acc.get(id);
      if (v) v.add(n);
      else acc.set(id, n.clone());
    }
  }
  const out = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const v = acc.get(key(i))!.clone().normalize();
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y;
    out[i * 3 + 2] = v.z;
  }
  geo.setAttribute("normal", new THREE.BufferAttribute(out, 3));
  return geo;
}

function mergeNonIndexed(parts: THREE.BufferGeometry[]) {
  let count = 0;
  for (const p of parts) count += p.getAttribute("position").count;
  const pos = new Float32Array(count * 3);
  const nrm = new Float32Array(count * 3);
  let o = 0;
  for (const p of parts) {
    const a = p.getAttribute("position").array as Float32Array;
    pos.set(a, o);
    nrm.set(p.getAttribute("normal").array as Float32Array, o);
    o += a.length;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  return g;
}
