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
  /** largo actual de la uña en V del UV (la banda del cat eye se apaga hacia la punta) */
  uLenV: { value: number };
  /** cuánto se curva la "sonrisa" del lecho natural (en V del UV) */
  uSmile: { value: number };
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
uniform float uLenV;
uniform float uSmile;
float bfClear = 0.0;
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
  // gel transparente sobre la uña natural: lecho rosado (con la lúnula más clara), la línea rosada
  // del borde, el borde libre natural marfil y, más allá, el gel cristalino que deja ver la mesa
  float bfQ = ( vMapUv.x - 0.5 ) * 2.1;
  float bfLine = uBedV - uSmile * bfQ * bfQ;
  float bfBed = 1.0 - smoothstep( bfLine - 0.012, bfLine + 0.004, vMapUv.y );
  float bfFree = 1.0 - smoothstep( bfLine + 0.03, bfLine + 0.042, vMapUv.y );
  float bfLun = 1.0 - smoothstep( 0.05, 0.16, vMapUv.y / max( uBedV, 0.05 ) );
  vec3 bfNat = mix( vec3( 0.8, 0.42, 0.4 ), vec3( 0.9, 0.66, 0.62 ), bfLun * 0.7 );
  // banda onicodérmica: un hilo más rosado justo antes del borde libre
  bfNat = mix( bfNat, vec3( 0.72, 0.32, 0.32 ), exp( - pow( ( vMapUv.y - bfLine + 0.006 ) / 0.006, 2.0 ) ) * 0.55 );
  vec3 bfIvory = vec3( 0.93, 0.88, 0.8 );
  vec3 bfGel = vec3( 0.99, 0.98, 0.97 );
  vec3 bfUnder = mix( mix( bfGel, bfIvory, bfFree ), bfNat, bfBed );
  diffuseColor.rgb = mix( diffuseColor.rgb, bfUnder, uSheer );
  // solo el gel transparente deja ver la mesa: el milky y el nude cubren aunque dejen intuir el lecho
  bfClear = smoothstep( 0.55, 0.9, uSheer ) * ( 1.0 - bfFree );
  diffuseColor.a = 1.0 - 0.66 * bfClear;
  // decoración pintada, fundida entre la anterior y la nueva
  vec4 bfA = texture2D( map, vMapUv );
  vec4 bfB = texture2D( uDecalPrev, vMapUv );
  vec3 bfC1 = mix( diffuseColor.rgb, bfDecode( bfA ), bfA.a );
  vec3 bfC0 = mix( diffuseColor.rgb, bfDecode( bfB ), bfB.a );
  diffuseColor.rgb = mix( bfC0, bfC1, uDecalMix );
  float bfDecA = mix( bfB.a, bfA.a, uDecalMix );
  diffuseColor.a = mix( diffuseColor.a, 1.0, bfDecA );
  bfClear *= 1.0 - bfDecA;
  // sombra suave del pliegue de la cutícula sobre la base de la uña
  diffuseColor.rgb *= mix( 0.8, 1.0, smoothstep( 0.0, 0.028, vMapUv.y ) );
#endif
`,
    )
    .replace(
      "#include <metalnessmap_fragment>",
      /* glsl */ `
#include <metalnessmap_fragment>
// escamas grandes (~20 a lo ancho de la uña), como el glitter de una press-on
// (las capas opcionales van en ramas por uniform: sin glitter/cat eye/aurora no se paga su costo)
vec4 bfFl = vec4( 0.0, 0.5, 0.5, 0.0 );
float bfG = 0.0;
vec3 bfFlakeC = uGlitterTint;
if ( uGlitter > 0.001 ) {
  bfFl = texture2D( uFlake, vMapUv * uFlakeScale * 0.55 );
  bfG = smoothstep( 0.55, 0.75, bfFl.r ) * uGlitter;
  roughnessFactor = mix( roughnessFactor, 0.16, bfG );
  metalnessFactor = mix( metalnessFactor, 0.45, bfG );
  // escama metalizada: champagne con un leve corrimiento holográfico por escama (nunca más oscura que la base)
  vec3 bfHue = 0.5 + 0.5 * cos( 6.2831 * ( bfFl.a + vec3( 0.0, 0.33, 0.67 ) ) );
  bfFlakeC = mix( uGlitterTint, uGlitterTint * ( 0.75 + 0.5 * bfHue ), 0.35 );
  diffuseColor.rgb = mix( diffuseColor.rgb, max( bfFlakeC, diffuseColor.rgb ) * ( 0.85 + 0.3 * bfFl.a ), bfG );
}
`,
    )
    .replace(
      "#include <normal_fragment_maps>",
      /* glsl */ `
#include <normal_fragment_maps>
// cada escama tiene su propia inclinación: refleja otra parte del estudio (unas brillan, otras no)
normal = normalize( normal + vec3( bfFl.g * 2.0 - 1.0, bfFl.b * 2.0 - 1.0, 0.0 ) * bfG * 0.55 );
`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      /* glsl */ `
#include <emissivemap_fragment>
vec3 bfVN = normalize( vNormal );
vec3 bfV = normalize( vViewPosition );
if ( bfG > 0.0 ) {
  // glitter: destello propio de cada escama según su inclinación
  vec3 bfFN = normalize( bfVN + vec3( bfFl.g * 2.0 - 1.0, bfFl.b * 2.0 - 1.0, 0.0 ) * 0.9 );
  float bfSp = pow( max( dot( reflect( -bfV, bfFN ), normalize( vec3( -0.35, 0.45, 0.82 ) ) ), 0.0 ), 24.0 );
  // una escama nunca se apaga del todo: siempre devuelve algo de luz (es metal laminado)
  totalEmissiveRadiance += bfFlakeC * ( bfSp * 3.0 + 0.16 + 0.12 * bfFl.a ) * bfG;
}
// cat eye: las partículas imantadas forman una banda angosta y aterciopelada bajo el top coat.
// Vive en coordenadas de la uña (siempre cae sobre ella, también en el pulgar) y se corre con el giro.
if ( uCatEye > 0.001 ) {
float bfAlong = clamp( vMapUv.y / max( uLenV, 0.05 ), 0.0, 1.0 );
float bfCx = ( vMapUv.x - 0.5 ) - uCatOffset * 0.42 - 0.07 * ( bfAlong - 0.45 );
float bfBand = exp( - bfCx * bfCx / 0.0052 );
float bfHalo = exp( - bfCx * bfCx / 0.04 );
float bfEnvL = smoothstep( 0.0, 0.32, bfAlong ) * ( 1.0 - 0.55 * smoothstep( 0.6, 1.0, bfAlong ) );
float bfGrain = texture2D( uFlake, vMapUv * uFlakeScale * 3.1 ).a;
float bfGlint = smoothstep( 0.62, 0.95, texture2D( uFlake, vMapUv * uFlakeScale * 2.3 + 0.37 ).r );
totalEmissiveRadiance += uCatColor * uCatEye * bfEnvL * ( bfBand * ( 0.7 + 0.45 * bfGrain + 0.7 * bfGlint ) + 0.16 * bfHalo );
// fuera de la banda el gel queda más profundo (las partículas se fueron hacia el imán); más en las bases claras
diffuseColor.rgb *= mix( 1.0, 0.85 - 0.38 * saturate( dot( diffuseColor.rgb, vec3( 0.3, 0.55, 0.15 ) ) ), uCatEye );
}
// aurora: velo perlado que cambia de rosa a celeste y a verde agua con el ángulo (suave, sin franjas)
if ( uAurora > 0.001 ) {
float bfF = pow( 1.0 - saturate( dot( bfVN, bfV ) ), 1.6 );
// el tono corre a lo ancho de la uña y con el giro: rosa → durazno → verde agua → celeste → lila
vec3 bfHolo = 0.5 + 0.5 * cos( 6.2831 * ( 0.4 * bfVN.x + 0.25 * bfVN.y + bfF * 0.7 + uCatOffset * 0.8 + vec3( 0.0, 0.33, 0.67 ) ) );
vec3 bfPearl = mix( vec3( 1.0 ), bfHolo * 1.2, 0.3 );
// sobre bases oscuras el velo es de aceite (más color, menos blanco); sobre las claras, nácar
float bfLum = saturate( dot( diffuseColor.rgb, vec3( 0.3, 0.55, 0.15 ) ) * 2.0 );
// el velo tiñe el color (también en las bases claras) y suma un brillo nacarado que crece en los bordes
diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * bfPearl, uAurora * 0.7 );
totalEmissiveRadiance += mix( vec3( 1.0, 0.97, 0.95 ), bfHolo, mix( 0.92, 0.6, bfLum ) ) * uAurora * ( 0.06 + 0.34 * bfF ) * mix( 0.75, 1.0, bfLum );
}
`,
    )
    .replace(
      "#include <lights_fragment_maps>",
      /* glsl */ `#include <lights_fragment_maps>
// el top coat de gel: la ventana del estudio se lee como un brillo blanco nítido también sobre los
// colores claros; solo se refuerzan los reflejos intensos (la sala tenue no lava el color)
clearcoatRadiance *= 1.0 + 2.2 * smoothstep( 1.5, 9.0, dot( clearcoatRadiance, vec3( 0.3, 0.55, 0.15 ) ) );`,
    )
    .replace(
      "#include <opaque_fragment>",
      /* glsl */ `
// gel cristalino: el reflejo del top coat no se atenúa con la transparencia
float bfSpecL = dot( totalSpecular + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat, vec3( 0.3, 0.5, 0.2 ) );
// y el canto del gel se ve por Fresnel (el espesor del plástico)
float bfFr = pow( 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) ), 2.5 );
diffuseColor.a = max( diffuseColor.a, saturate( bfSpecL * 1.6 + bfFr * 0.7 ) * bfClear );
#include <opaque_fragment>
`,
    );
}

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
    uLenV: { value: 0.5 },
    uSmile: { value: 0.05 },
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
  m.customProgramCacheKey = () => "bf-nail-v3";
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
  // cromado: metal apenas satinado y un top coat fino encima → espejo líquido de degradés suaves (sin rayas duras)
  else if (finish === "cromado") p = { roughness: 0.13, metalness: 1, clearcoat: 0.18, clearcoatRoughness: 0.08, envMapIntensity: 1.2, sheen: 0, iridescence: 0, glitter: 0, catEye: 0 };
  else p = { roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.035, envMapIntensity: 0.42, sheen: 0, iridescence: 0, glitter: 0, catEye: 0 };
  if (extras.includes("aurora")) {
    // polvo perlado sobre el color: algo de metal (el color se conserva) y película fina iridiscente
    p.iridescence = 1;
    p.metalness = Math.max(p.metalness, 0.32);
    p.roughness = Math.min(p.roughness, 0.14);
    p.envMapIntensity = Math.max(p.envMapIntensity, 0.95);
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

const SKIN_DIFFUSE = "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );";
let skinLights: string | null | undefined;
/** iluminación de la piel: difusa "envuelta" por canal (el rojo atraviesa más), así el terminador se vuelve cálido y nunca gris */
function skinLightsChunk() {
  if (skinLights !== undefined) return skinLights;
  const src = THREE.ShaderChunk.lights_physical_pars_fragment;
  skinLights = src.includes(SKIN_DIFFUSE)
    ? src.replace(
        SKIN_DIFFUSE,
        /* glsl */ `{
    vec3 bfWrap = vec3( 0.46, 0.21, 0.14 );
    float bfNL = dot( geometryNormal, directLight.direction );
    vec3 bfIrr = saturate( ( vec3( bfNL ) + bfWrap ) / ( 1.0 + bfWrap ) ) * directLight.color;
    reflectedLight.directDiffuse += bfIrr * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
  }`,
      )
    : null;
  return skinLights;
}

/**
 * Piel: albedo + relieve pintados por dedo, difusa envuelta (subsuperficie falsa), brillo graso algo
 * más marcado sobre los nudillos y luz que atraviesa los bordes. `joints` = posiciones (V del UV)
 * de los nudillos del dedo.
 */
export function createSkinMaterial(map: THREE.Texture, normalMap: THREE.Texture, joints: number[] = []) {
  const m = new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    map,
    normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughness: 0.42,
    metalness: 0,
    ior: 1.4,
    specularIntensity: 0.75,
    // pelusa de la piel: brillo rasante muy suave
    sheen: 0.3,
    sheenColor: new THREE.Color("#ffd6c4"),
    sheenRoughness: 0.5,
    // película grasa muy leve
    clearcoat: 0.32,
    clearcoatRoughness: 0.3,
    emissive: new THREE.Color("#b2452c"),
    emissiveIntensity: 0.02,
    envMapIntensity: 0.2,
  });
  const j = [...joints, -1, -1, -1].slice(0, 3);
  const uJoints = { value: new THREE.Vector3(j[0], j[1], j[2]) };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uJoints = uJoints;
    const lights = skinLightsChunk();
    if (lights) sh.fragmentShader = sh.fragmentShader.replace("#include <lights_physical_pars_fragment>", lights);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uJoints;")
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `#include <roughnessmap_fragment>
float bfDors = 1.0 - smoothstep( 0.1, 0.3, abs( vMapUv.x - 0.5 ) );
vec3 bfJd = ( vec3( vMapUv.y ) - uJoints ) / 0.035;
float bfKn = exp( - min( min( bfJd.x * bfJd.x, bfJd.y * bfJd.y ), bfJd.z * bfJd.z ) );
roughnessFactor *= 1.0 - 0.3 * bfKn * bfDors;`,
      )
      .replace(
        "#include <lights_fragment_end>",
        /* glsl */ `#include <lights_fragment_end>
float bfRim = 1.0 - saturate( dot( normal, normalize( vViewPosition ) ) );
reflectedLight.indirectDiffuse += diffuseColor.rgb * vec3( 0.55, 0.2, 0.12 ) * pow( bfRim, 2.2 ) * 0.3;`,
      );
  };
  m.customProgramCacheKey = () => "bf-skin-v3";
  return m;
}

/** cristal facetado: espejo puro (una normal por cara) que refleja su propio entorno de alto contraste */
export function createGemMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: "#ffffff",
    metalness: 1,
    roughness: 0,
    clearcoat: 0,
    // película fina: algunas facetas se tiñen de azul, rosa o dorado (el "fuego")
    iridescence: 0.6,
    iridescenceIOR: 1.7,
    iridescenceThicknessRange: [180, 520],
    envMapIntensity: 1.1,
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
