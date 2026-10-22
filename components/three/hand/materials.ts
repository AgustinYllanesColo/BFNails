import * as THREE from "three";
import { mulberry32 } from "./anatomy";

/**
 * Materiales. Las uñas usan un único programa (MeshPhysicalMaterial + onBeforeCompile) con
 * todas las capas "encendidas" en valores mínimos: así cambiar de acabado nunca recompila el
 * shader y se puede interpolar glossy ↔ mate ↔ cromado ↔ aurora en ~300 ms.
 */

export type NailUniforms = {
  uDecalPrev: { value: THREE.Texture | null };
  uDecalMix: { value: number };
  uFlake: { value: THREE.Texture | null };
  uFlakeScale: { value: THREE.Vector2 };
  uGlitter: { value: number };
  uGlitterTint: { value: THREE.Color };
  uCatEye: { value: number };
  uCatColor: { value: THREE.Color };
  uCatOffset: { value: number };
  /** 0 = esmalte opaco, 1 = gel transparente (se ve el lecho rosado y el borde libre translúcido) */
  uSheer: { value: number };
  /** fin del lecho ungueal en V del UV */
  uBedV: { value: number };
  uAurora: { value: number };
};

const EPS = 1e-4;

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * Escamas de glitter: hexágonos nítidos de 8 px, ~22 % encendidos.
 * R = máscara, G/B = inclinación de la escama (lo que la hace titilar), A = variación de brillo.
 */
export function createFlakeTexture() {
  const N = 512;
  const cell = 8;
  const half = cell / 2;
  const data = new Uint8Array(N * N * 4);
  const rand = mulberry32(77);
  const SQ3 = Math.sqrt(3);
  for (let cy = 0; cy < N / cell; cy++) {
    for (let cx = 0; cx < N / cell; cx++) {
      const on = rand() < 0.22;
      const mask = on ? 200 + rand() * 55 : 0;
      const nx = (rand() - 0.5) * 2;
      const ny = (rand() - 0.5) * 2;
      const nz = rand();
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const dx = Math.abs(x + 0.5 - half);
          const dy = Math.abs(y + 0.5 - half);
          const dHex = Math.max(dx, (dx + SQ3 * dy) / 2) / half;
          const px = cx * cell + x;
          const py = cy * cell + y;
          const o = (py * N + px) * 4;
          data[o] = mask * smoothstep(1.0, 0.8, dHex);
          data[o + 1] = (nx * 0.5 + 0.5) * 255;
          data[o + 2] = (ny * 0.5 + 0.5) * 255;
          data[o + 3] = nz * 255;
        }
      }
    }
  }
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

const NAIL_CHUNK_PARS = /* glsl */ `
uniform sampler2D uDecalPrev;
uniform float uDecalMix;
uniform sampler2D uFlake;
uniform vec2 uFlakeScale;
uniform float uGlitter;
uniform vec3 uGlitterTint;
uniform float uCatEye;
uniform vec3 uCatColor;
uniform float uCatOffset;
uniform float uSheer;
uniform float uBedV;
uniform float uAurora;
// la decoración se sube premultiplicada y en sRGB "crudo": des-premultiplicamos y recién ahí decodificamos
// (decodificar sRGB sobre valores premultiplicados ensucia los semitransparentes y los bordes)
vec3 bfDecode( vec4 c ) {
  return c.a > 0.002 ? sRGBTransferEOTF( vec4( c.rgb / c.a, 1.0 ) ).rgb : vec3( 0.0 );
}
`;

function onBeforeCompileNail(this: THREE.MeshPhysicalMaterial, shader: THREE.WebGLProgramParametersWithUniforms) {
  const u = (this.userData as { nailUniforms: NailUniforms }).nailUniforms;
  Object.assign(shader.uniforms, u);
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${NAIL_CHUNK_PARS}`)
    .replace(
      "#include <map_fragment>",
      /* glsl */ `
#ifdef USE_MAP
  // gel translúcido: lecho rosado debajo, borde libre más claro y semitransparente
  float bfBed = 1.0 - smoothstep( uBedV - 0.03, uBedV + 0.025, vMapUv.y );
  vec3 bfPink = vec3( 0.86, 0.55, 0.50 );
  vec3 bfTip = vec3( 0.97, 0.95, 0.92 );
  diffuseColor.rgb = mix( diffuseColor.rgb, mix( bfTip, bfPink, bfBed ), uSheer * mix( 0.55, 0.75, bfBed ) );
  diffuseColor.a = mix( 1.0, 0.55, uSheer * ( 1.0 - bfBed ) );
  // decoración pintada, fundida entre la anterior y la nueva
  vec4 bfA = texture2D( map, vMapUv );
  vec4 bfB = texture2D( uDecalPrev, vMapUv );
  vec3 bfC1 = mix( diffuseColor.rgb, bfDecode( bfA ), bfA.a );
  vec3 bfC0 = mix( diffuseColor.rgb, bfDecode( bfB ), bfB.a );
  diffuseColor.rgb = mix( bfC0, bfC1, uDecalMix );
  diffuseColor.a = mix( diffuseColor.a, 1.0, mix( bfB.a, bfA.a, uDecalMix ) );
  // sombrita del pliegue de la cutícula sobre la base de la uña
  diffuseColor.rgb *= mix( 0.74, 1.0, smoothstep( 0.0, 0.03, vMapUv.y ) );
#endif
`,
    )
    .replace(
      "#include <metalnessmap_fragment>",
      /* glsl */ `
#include <metalnessmap_fragment>
// escamas grandes (~20 a lo ancho de la uña), como el glitter de una press-on
vec4 bfFl = texture2D( uFlake, vMapUv * uFlakeScale * 0.55 );
float bfG = smoothstep( 0.55, 0.75, bfFl.r ) * uGlitter;
roughnessFactor = mix( roughnessFactor, 0.2, bfG );
metalnessFactor = mix( metalnessFactor, 0.35, bfG );
// una escama nunca es más oscura que la base
diffuseColor.rgb = mix( diffuseColor.rgb, max( uGlitterTint, diffuseColor.rgb ) * ( 0.9 + 0.3 * bfFl.a ), bfG );
`,
    )
    .replace(
      "#include <normal_fragment_maps>",
      /* glsl */ `
#include <normal_fragment_maps>
normal = normalize( normal + vec3( bfFl.g * 2.0 - 1.0, bfFl.b * 2.0 - 1.0, 0.0 ) * bfG * 0.25 );
`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      /* glsl */ `
#include <emissivemap_fragment>
vec3 bfVN = normalize( vNormal );
vec3 bfV = normalize( vViewPosition );
// glitter: destello propio de cada escama según su inclinación
vec3 bfFN = normalize( bfVN + vec3( bfFl.g * 2.0 - 1.0, bfFl.b * 2.0 - 1.0, 0.0 ) * 0.9 );
float bfSp = pow( max( dot( reflect( -bfV, bfFN ), normalize( vec3( -0.35, 0.45, 0.82 ) ) ), 0.0 ), 30.0 );
totalEmissiveRadiance += uGlitterTint * ( bfSp * 2.2 + 0.22 * bfFl.a ) * bfG;
// cat eye: banda luminosa aterciopelada bajo el top coat que sigue al ángulo de vista
float bfCe = dot( bfVN, normalize( vec3( 0.92, 0.22, 0.0 ) ) );
float bfDc = bfCe - uCatOffset;
float bfBand = exp( -bfDc * bfDc * BF_CAT_SHARP );
float bfHalo = exp( -bfDc * bfDc * 9.0 );
float bfFine = texture2D( uFlake, vMapUv * uFlakeScale * 7.0 ).r;
float bfSpark = step( 0.82, bfFine );
totalEmissiveRadiance += uCatColor * uCatEye * ( bfBand * ( 0.55 + 0.9 * bfFine + 1.6 * bfSpark ) + BF_CAT_HALO * bfHalo );
diffuseColor.rgb *= mix( 1.0, 0.55, uCatEye );
// aurora: corrimiento holográfico (rosa, azul, verde, dorado) según el ángulo y el giro
float bfF = pow( 1.0 - saturate( dot( bfVN, bfV ) ), 1.5 );
vec3 bfHolo = 0.5 + 0.5 * cos( 6.2831 * ( bfF * 0.9 + vMapUv.y * 0.55 + uCatOffset * 0.6 + vec3( 0.0, 0.33, 0.67 ) ) );
totalEmissiveRadiance += bfHolo * uAurora * ( 0.13 + 0.45 * bfF );
`,
    );
  shader.fragmentShader = `#define BF_CAT_SHARP ${CAT_SHARP.toFixed(1)}\n#define BF_CAT_HALO ${CAT_HALO.toFixed(3)}\n` + shader.fragmentShader;
}

const CAT_SHARP = 110;
const CAT_HALO = 0.02;

export function createNailMaterial(flake: THREE.Texture, decalA: THREE.Texture, decalB: THREE.Texture) {
  const nailUniforms: NailUniforms = {
    uDecalPrev: { value: decalB },
    uDecalMix: { value: 1 },
    uFlake: { value: flake },
    uFlakeScale: { value: new THREE.Vector2(1, 1) },
    uGlitter: { value: 0 },
    uGlitterTint: { value: new THREE.Color("#f2e7cf") },
    uCatEye: { value: 0 },
    uCatColor: { value: new THREE.Color("#ffffff") },
    uCatOffset: { value: 0 },
    uSheer: { value: 0 },
    uBedV: { value: 0.5 },
    uAurora: { value: 0 },
  };
  const m = new THREE.MeshPhysicalMaterial({
    color: "#e8c4b0",
    map: decalA,
    roughness: 0.25,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    iridescence: EPS,
    iridescenceIOR: 1.8,
    iridescenceThicknessRange: [120, 420],
    sheen: EPS,
    sheenColor: new THREE.Color("#ffffff"),
    sheenRoughness: 0.6,
    ior: 1.5,
    specularIntensity: 1,
    envMapIntensity: 1,
    // alfa 1 salvo el borde libre del gel transparente: así cambiar de color nunca recompila
    transparent: true,
  });
  m.userData.nailUniforms = nailUniforms;
  m.onBeforeCompile = onBeforeCompileNail;
  m.customProgramCacheKey = () => "bf-nail-v2";
  return { material: m, uniforms: nailUniforms };
}

export type FinishParams = {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
  sheen: number;
  iridescence: number;
  glitter: number;
  catEye: number;
};

export const FINISH_KEYS: (keyof FinishParams)[] = ["roughness", "metalness", "clearcoat", "clearcoatRoughness", "envMapIntensity", "sheen", "iridescence", "glitter", "catEye"];

export function finishParams(finish: string, extras: string[]): FinishParams {
  let p: FinishParams;
  if (finish === "mate") p = { roughness: 0.6, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.5, envMapIntensity: 0.28, sheen: 0.35, iridescence: 0, glitter: 0, catEye: 0 };
  else if (finish === "cromado") p = { roughness: 0.06, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.25, sheen: 0, iridescence: 0, glitter: 0, catEye: 0 };
  else p = { roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 0.42, sheen: 0, iridescence: 0, glitter: 0, catEye: 0 };
  if (extras.includes("aurora")) {
    p.iridescence = 1;
    p.metalness = Math.max(p.metalness, 0.65);
    p.roughness = Math.min(p.roughness, 0.1);
    p.envMapIntensity = Math.max(p.envMapIntensity, 1.1);
  }
  if (extras.includes("glitter")) p.glitter = 1;
  if (extras.includes("cat-eye")) p.catEye = 1;
  return p;
}

export function applyFinish(m: THREE.MeshPhysicalMaterial, u: NailUniforms, p: FinishParams) {
  m.roughness = p.roughness;
  m.metalness = p.metalness;
  m.clearcoat = Math.max(EPS, p.clearcoat);
  m.clearcoatRoughness = p.clearcoatRoughness;
  m.envMapIntensity = p.envMapIntensity;
  m.sheen = Math.max(EPS, p.sheen);
  m.iridescence = Math.max(EPS, p.iridescence);
  u.uGlitter.value = p.glitter;
  u.uCatEye.value = p.catEye;
  u.uAurora.value = p.iridescence;
}

export function createSkinMaterial(map: THREE.Texture, normalMap: THREE.Texture) {
  const m = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    map,
    normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughness: 0.47,
    metalness: 0,
    ior: 1.4,
    specularIntensity: 0.8,
    // pelusa de la piel: brillo rasante muy suave
    sheen: 0.28,
    sheenColor: new THREE.Color("#ffd9c8"),
    sheenRoughness: 0.55,
    // película grasa muy leve
    clearcoat: 0.2,
    clearcoatRoughness: 0.38,
    // "subsurface" simulado: emisión cálida mínima que levanta las sombras sin volverlas grises
    emissive: new THREE.Color("#b2452c"),
    emissiveIntensity: 0.03,
    envMapIntensity: 0.32,
  });
  // SSS falso: la luz que atraviesa la piel en los bordes los vuelve cálidos (no grises)
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace(
      "#include <lights_fragment_end>",
      /* glsl */ `#include <lights_fragment_end>
float bfRim = 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) );
reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3( 0.5, 0.2, 0.12 ) * pow( bfRim, 2.5 ) * 0.25;`,
    );
  };
  m.customProgramCacheKey = () => "bf-skin-v2";
  return m;
}

export function createCuticleMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#e0b29e",
    roughness: 0.5,
    ior: 1.4,
    specularIntensity: 0.6,
    sheen: 0.4,
    sheenColor: new THREE.Color("#ffd9c8"),
    sheenRoughness: 0.5,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4,
    emissive: new THREE.Color("#b2452c"),
    emissiveIntensity: 0.03,
    envMapIntensity: 0.32,
    // el pliegue apoya sobre la uña: sin z-fighting en el borde
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

/** cristal facetado: espejo puro que refleja su propio entorno de alto contraste (ver createHandScene) */
export function createGemMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    metalness: 1,
    roughness: 0,
    clearcoat: 0,
    iridescence: 0.5,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: [200, 600],
    envMapIntensity: 1.6,
    flatShading: true,
  });
}

export function createGoldMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#f0c56a",
    metalness: 1,
    roughness: 0.16,
    clearcoat: 0.6,
    clearcoatRoughness: 0.08,
    envMapIntensity: 0.9,
  });
}

export function createBowMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#a30f18",
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    sheen: 0.2,
    sheenColor: new THREE.Color("#ff9a9a"),
    envMapIntensity: 0.45,
  });
}

/** Organza rosa de la flor 3D: translúcida, con brillo de tela y el rosa más intenso de la marca. */
export function createFlowerMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#f27fb6",
    roughness: 0.35,
    transparent: true,
    opacity: 0.86,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    sheen: 1,
    sheenColor: new THREE.Color("#ffd3e8"),
    side: THREE.DoubleSide,
    envMapIntensity: 0.4,
  });
}
