import * as THREE from "three";

/**
 * Entornos de reflejo procedurales (HDR de media precisión, sin archivos):
 * - el estudio crema: paredes y techo con degradés suaves + dos softboxes de bordes difusos.
 *   Todo es de baja frecuencia, así el cromado se lee como un espejo líquido (sin rayas) y el
 *   glossy muestra una sola "ventana" larga y blanda.
 * - el de los strass: casi negro con puntos de luz chicos y unos pocos de color, para que cada
 *   faceta destelle o quede oscura (el cristal se lee por el contraste, no por el color).
 *
 * Coordenadas de mundo: z sale de la mesa (hacia la cámara), y apunta hacia la punta de los dedos.
 */

type RGB = [number, number, number];
type Radiance = (x: number, y: number, z: number, out: RGB) => void;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** softbox rectangular de esquinas redondeadas sobre la esfera; a = azimut (de +z hacia +x), b = hacia +y */
function softbox(x: number, y: number, z: number, a0: number, b0: number, ha: number, hb: number, feather: number) {
  const a = Math.atan2(x, z) - a0;
  const b = Math.asin(Math.max(-1, Math.min(1, y))) - b0;
  const s = Math.pow(Math.pow(Math.abs(a) / ha, 4) + Math.pow(Math.abs(b) / hb, 4), 0.25);
  // más luminoso en el centro, como la tela de un softbox
  return (1 - smooth(1 - feather, 1 + feather, s)) * (0.8 + 0.2 * Math.max(0, 1 - s * s));
}

const studio: Radiance = (x, y, z, out) => {
  // techo cálido → paredes crema → mesa tostada
  const up = smooth(-0.05, 0.9, z);
  const down = smooth(0.0, -0.6, z);
  // la pared del lado de la ventana (-x) es más clara; la del fondo (+x) y el horizonte, más oscuros:
  // ese contraste suave es lo que hace que el cromado se lea como metal y no como pintura
  const side = 1 + 0.3 * -x - 0.12 * Math.max(0, y);
  const horizon = 1 - 0.34 * Math.exp(-((z - 0.12) ** 2) / 0.09) * smooth(-0.6, 0.7, x);
  const k = (0.3 + 0.66 * up) * side * horizon;
  let r = (0.9 + 0.1 * up) * k;
  let g = (0.8 + 0.15 * up) * k;
  let b = (0.64 + 0.23 * up) * k;
  const floor = 0.3 - 0.1 * down;
  r = r * (1 - down) + 0.84 * floor * down;
  g = g * (1 - down) + 0.69 * floor * down;
  b = b * (1 - down) + 0.5 * floor * down;
  // ventana principal, larga en el sentido de los dedos: núcleo brillante + halo ancho que se apaga de a poco
  const key = softbox(x, y, z, -0.3, 0.22, 0.085, 0.5, 0.3) * 56 + softbox(x, y, z, -0.36, 0.18, 0.42, 0.95, 0.85) * 2.6;
  // relleno ancho y frío del otro lado
  const fill = softbox(x, y, z, 0.7, 0.04, 0.3, 0.5, 0.7) * 2.2;
  // luz baja de contra, por delante de las puntas (brillo en el borde libre)
  const kick = softbox(x, y, z, 0.05, 0.95, 0.5, 0.16, 0.6) * 1.4;
  out[0] = r + key * 1.0 + fill * 0.93 + kick;
  out[1] = g + key * 0.965 + fill * 0.96 + kick * 0.97;
  out[2] = b + key * 0.91 + fill * 1.0 + kick * 0.92;
};

/** puntos de luz para el cristal: blancos intensos y unos pocos con color (el "fuego") */
const GEM_LIGHTS: Array<[number, number, number, number, number, number, number]> = (() => {
  const out: Array<[number, number, number, number, number, number, number]> = [];
  // dirección (az, el), tamaño, intensidad, color
  const spec: Array<[number, number, number, number, RGB]> = [
    [-0.4, 1.0, 0.08, 60, [1, 1, 1]],
    [0.5, 0.9, 0.07, 55, [1, 1, 1]],
    [1.6, 0.75, 0.08, 48, [1, 1, 1]],
    [2.7, 0.95, 0.07, 52, [1, 1, 1]],
    [-1.5, 0.7, 0.09, 50, [1, 1, 1]],
    [-2.5, 1.05, 0.07, 46, [1, 1, 1]],
    [3.6, 0.55, 0.08, 40, [1, 1, 1]],
    [-3.3, 0.5, 0.07, 38, [1, 1, 1]],
    [0.0, 1.45, 0.1, 26, [1, 1, 1]],
    [1.1, 0.4, 0.06, 34, [1, 1, 1]],
    [-0.9, 0.38, 0.06, 34, [1, 1, 1]],
    [2.2, 0.3, 0.07, 18, [0.55, 0.75, 1]],
    [-2.0, 0.32, 0.07, 18, [1, 0.55, 0.8]],
    [0.25, 0.62, 0.05, 16, [1, 0.82, 0.45]],
    [-1.05, 1.2, 0.05, 14, [0.6, 1, 0.85]],
    [1.95, 1.25, 0.05, 14, [0.8, 0.6, 1]],
  ];
  // az gira alrededor de z (la normal de la mesa); el = altura sobre la mesa
  for (const [az, el, size, k, c] of spec) out.push([Math.cos(el) * Math.sin(az), Math.cos(el) * Math.cos(az), Math.sin(el), size, k * c[0], k * c[1], k * c[2]]);
  return out;
})();

const gemRoom: Radiance = (x, y, z, out) => {
  // fondo casi negro con un techo apenas gris: las facetas que no "ven" una luz quedan oscuras
  const up = smooth(-0.2, 1, z);
  // la mesa de la piedra (que mira casi a la cámara) ve un techo claro: se lee plateada, no gris
  const zen = smooth(0.82, 0.97, z);
  out[0] = 0.05 + 0.16 * up + 1.3 * zen;
  out[1] = 0.05 + 0.16 * up + 1.3 * zen;
  out[2] = 0.055 + 0.17 * up + 1.4 * zen;
  for (const [lx, ly, lz, s, r, g, b] of GEM_LIGHTS) {
    const w = Math.exp(-(1 - (x * lx + y * ly + z * lz)) / (s * s));
    if (w < 1e-4) continue;
    out[0] += r * w;
    out[1] += g * w;
    out[2] += b * w;
  }
};

/** pinta la función en un equirectangular half-float (convención de three: polo = +y) */
function equirect(fn: Radiance, W: number, H: number) {
  const data = new Uint16Array(W * H * 4);
  const c: RGB = [0, 0, 0];
  const half = THREE.DataUtils.toHalfFloat;
  const one = half(1);
  for (let row = 0; row < H; row++) {
    const lat = ((row + 0.5) / H - 0.5) * Math.PI;
    const y = Math.sin(lat);
    const cl = Math.cos(lat);
    for (let col = 0; col < W; col++) {
      const phi = ((col + 0.5) / W - 0.5) * Math.PI * 2;
      fn(Math.cos(phi) * cl, y, Math.sin(phi) * cl, c);
      const o = (row * W + col) * 4;
      data[o] = half(c[0]);
      data[o + 1] = half(c[1]);
      data[o + 2] = half(c[2]);
      data[o + 3] = one;
    }
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.LinearSRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

export function createStudioEnvironment(pmrem: THREE.PMREMGenerator) {
  const tex = equirect(studio, 512, 256);
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose();
  return rt;
}

export function createGemEnvironment(pmrem: THREE.PMREMGenerator) {
  const tex = equirect(gemRoom, 256, 128);
  const rt = pmrem.fromEquirectangular(tex);
  tex.dispose();
  return rt;
}
