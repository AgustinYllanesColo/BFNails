import * as THREE from "three";

/** Strass: piedra de base plana con corona facetada (lathe de 12 lados, sombreado plano). */
export function createGemGeometry() {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(1, 0),
    new THREE.Vector2(1, 0.12),
    new THREE.Vector2(0.86, 0.3),
    new THREE.Vector2(0.6, 0.46),
    new THREE.Vector2(0.32, 0.53),
    new THREE.Vector2(0, 0.54),
  ];
  const g = new THREE.LatheGeometry(pts, 12);
  g.computeVertexNormals();
  return g;
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
