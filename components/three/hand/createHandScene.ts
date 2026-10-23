import { defaultDetailColor } from "@/lib/pricing";
import { nailSpec } from "@/lib/nails";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { BuilderSelection, Length, Shape } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { FINGERS, FingerModel, SKIN_BASE, paintSkin } from "./anatomy";
import { DECAL_H, DECAL_W, decorKey, paintDecor } from "./decor";
import { artGems } from "./art";
import { createCuticleGeometry, computeNail, createNailGeometry, halfWidth, nailContext, nailDims, sampleTop, type NailBuffers, type NailDims } from "./nail";
import {
  FINISH_KEYS,
  applyFinish,
  createBowMaterial,
  createFlowerMaterial,
  createCuticleMaterial,
  createFlakeTexture,
  createGemMaterial,
  createGoldMaterial,
  createNailMaterial,
  createSkinMaterial,
  finishParams,
  type NailUniforms,
} from "./materials";
import { createBowGeometry, createFlowerCenterGeometry, createFlowerGeometry, createGemGeometry, createHeartGeometry } from "./accessories";

/**
 * Escena procedural de la mano con uñas (estilo img2threejs: todo en código, sin modelos).
 * Render on demand: solo dibuja cuando algo cambia o hay una animación en curso (el balanceo de
 * reposo se apaga solo a los pocos segundos), y se pausa fuera de pantalla o con la pestaña oculta.
 */

export type HandScene = {
  update(sel: BuilderSelection, config: BuilderConfig): void;
  /** qué mano se ve: 0 derecha, 1 izquierda (la misma mano espejada; el espejo lo hace quien la muestra) */
  setHand(hand: 0 | 1): void;
  resize(): void;
  dispose(): void;
  /** se llama una vez, cuando el primer cuadro ya está dibujado */
  onFirstFrame(cb: () => void): () => void;
};

export type HandSceneOptions = {
  reducedMotion?: boolean;
  /** se perdió el contexto WebGL o falló la construcción de la escena */
  onContextLost?: () => void;
  /** si el dispositivo no sostiene ~22 fps, baja la resolución y apaga el balanceo (default: true) */
  perfGuard?: boolean;
};

const MORPH_MS = 280;
const FRAME_MS = 280;
const MATERIAL_MS = 240;
const DECAL_MS = 220;
/** con "reducir movimiento": nada se desplaza, pero color, acabado y decoración se funden igual */
const REDUCED_FADE_MS = 160;
/**
 * El balanceo de reposo no se apaga mientras la mano está en pantalla (quieta del todo parecía una foto). Igual se
 * pausa fuera de pantalla, con la pestaña oculta, con "reducir movimiento" o si el dispositivo no llega.
 */
const IDLE_MS = Number.POSITIVE_INFINITY;
const MAX_TILT = THREE.MathUtils.degToRad(25);
const CAMERA_TILT = THREE.MathUtils.degToRad(16);
const FOV = 26;

// ≈ cubic-bezier(0.23, 1, 0.32, 1)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/** encuadre según el largo: las uñas (el producto) llenan el cuadro; el corte cae en la falange proximal */
const FRAMING: Record<Length, { cx: number; cy: number; h: number }> = {
  corto: { cx: -1.0, cy: 6.5, h: 10.0 },
  medio: { cx: -0.6, cy: 7.0, h: 10.0 },
  largo: { cx: -0.7, cy: 7.4, h: 10.7 },
  xl: { cx: -0.8, cy: 7.9, h: 11.5 },
};
const PIVOT = new THREE.Vector3(-1.2, 6.0, 0);
/** leve diagonal de la mano en el cuadro */
const HAND_ROLL = -0.1;

/** cuánto del gel translúcido deja ver según el color */
const SHEER: Record<string, number> = { transparente: 0.9, milky: 0.4, nude: 0.08 };

type NailState = {
  model: FingerModel;
  ctx: ReturnType<typeof nailContext>;
  dims: Record<Length, NailDims>;
  geom: THREE.BufferGeometry;
  mesh: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  uniforms: NailUniforms;
  from: NailBuffers;
  to: NailBuffers;
  cur: NailBuffers;
  canvases: [HTMLCanvasElement, HTMLCanvasElement];
  textures: [THREE.CanvasTexture, THREE.CanvasTexture];
  decorKey: string;
  /** formas ya calculadas ("forma|largo"): cambiar de forma no recalcula en el momento del toque */
  shapes: Map<string, NailBuffers>;
};

type Accessory = { object: THREE.Object3D; key: string; nail: number; u: number; y: number; size: number; tilt: number; scale: number; vel: number; target: number; delay: number };

type Scheduler = { yield?: () => Promise<void> };
const yieldToMain = () =>
  new Promise<void>((resolve) => {
    const sch = (globalThis as { scheduler?: Scheduler }).scheduler;
    if (sch?.yield) sch.yield().then(resolve, resolve);
    else setTimeout(resolve, 0);
  });

export function createHandScene(canvas: HTMLCanvasElement, options: HandSceneOptions = {}): HandScene {
  const reduced = !!options.reducedMotion;
  const perfGuard = options.perfGuard !== false;
  const dpr = window.devicePixelRatio || 1;
  // a 2x (o más) el MSAA es fill-rate de sobra
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 2, alpha: true, powerPreference: "default" });
  renderer.setPixelRatio(Math.min(dpr, 2));
  renderer.setClearColor(0x000000, 0);
  // Neutral respeta el tono elegido (ACES lava los pastel y corre el rojo a coral)
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.75;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = true;

  const disposables: Array<{ dispose(): void }> = [];
  const track = <T extends { dispose(): void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  const scene = new THREE.Scene();
  /** materiales que reciben el reflejo del estudio (se asigna al construir el entorno) */
  const envMaterials: THREE.MeshStandardMaterial[] = [];
  const withEnv = <T extends THREE.MeshStandardMaterial>(m: T) => {
    envMaterials.push(m);
    return m;
  };

  const camera = new THREE.PerspectiveCamera(FOV, 4 / 3, 1, 120);
  camera.up.set(0, 1, 0);

  /* ---------- luz ---------- */
  const key = new THREE.DirectionalLight("#ffeedb", 2.2);
  key.position.set(-4, 5, 15).add(PIVOT);
  key.target.position.copy(PIVOT);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 5;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.025;
  const sc = key.shadow.camera;
  sc.left = -10;
  sc.right = 10;
  sc.top = 10;
  sc.bottom = -10;
  sc.near = 1;
  sc.far = 45;
  const fill = new THREE.DirectionalLight("#d6e2ff", 0.42);
  fill.position.set(10, -3, 7).add(PIVOT);
  fill.target.position.copy(PIVOT);
  const rim = new THREE.DirectionalLight("#fff6ee", 0.7);
  rim.position.set(3, 22, 3).add(PIVOT);
  rim.target.position.copy(PIVOT);
  scene.add(key, key.target, fill, fill.target, rim, rim.target);

  /* ---------- grupo que rota (mano + mesa) ---------- */
  const pivot = new THREE.Group();
  pivot.position.copy(PIVOT);
  scene.add(pivot);
  const hand = new THREE.Group();
  hand.position.copy(PIVOT).negate();
  hand.rotation.z = HAND_ROLL;
  pivot.add(hand);

  // sombra proyectada suave (solo sombra, el fondo es el crema del contenedor)
  // Neutra, tenue y con la luz casi de frente: rojiza al 20 % y con la luz de costado, la sombra de los dedos se
  // leía como una segunda mano color piel al lado de la primera.
  const shadowMat = track(new THREE.ShadowMaterial({ color: new THREE.Color("#3a2a24"), opacity: 0.1 }));
  const floorGeo = track(new THREE.PlaneGeometry(40, 40));
  const floor = new THREE.Mesh(floorGeo, shadowMat);
  floor.position.set(PIVOT.x, PIVOT.y, 0);
  floor.receiveShadow = true;
  hand.add(floor);

  const models = FINGERS.map((spec) => new FingerModel(spec));

  /* ---------- dedos (la textura de la piel se pinta después, en tandas, sin trabar el hilo) ---------- */
  const skinPlaceholder = track(solidTexture(SKIN_BASE));
  const flatNormal = track(new THREE.DataTexture(new Uint8Array([128, 128, 255, 255]), 1, 1));
  flatNormal.needsUpdate = true;
  const cuticleMat = track(withEnv(createCuticleMaterial()));
  const skinMats = models.map((model) => {
    const geo = track(model.buildGeometry());
    const mat = track(withEnv(createSkinMaterial(skinPlaceholder, flatNormal)));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hand.add(mesh);
    return mat;
  });

  /* ---------- uñas ---------- */
  // sin decoración: una textura vacía compartida (nunca volvemos a subir un canvas vacío)
  const BLANK = track(new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1));
  BLANK.needsUpdate = true;
  const flake = track(createFlakeTexture());
  const lengths: Length[] = ["corto", "medio", "largo", "xl"];
  const nails: NailState[] = models.map((model) => {
    const dims = Object.fromEntries(lengths.map((l) => [l, nailDims(model, l)])) as Record<Length, NailDims>;
    const ctx = nailContext(model, dims.medio);
    const geom = track(createNailGeometry(dims.medio));
    const canvases: [HTMLCanvasElement, HTMLCanvasElement] = [makeCanvas(), makeCanvas()];
    const textures = canvases.map((c) => {
      const t = track(new THREE.CanvasTexture(c));
      // sRGB "crudo" y premultiplicado: el shader des-premultiplica y decodifica (ver materials.ts)
      t.colorSpace = THREE.NoColorSpace;
      t.premultiplyAlpha = true;
      t.anisotropy = 4;
      return t;
    }) as [THREE.CanvasTexture, THREE.CanvasTexture];
    const { material, uniforms } = createNailMaterial(flake, BLANK, BLANK);
    track(withEnv(material));
    const d = dims.medio;
    uniforms.uFlakeScale.value.set(d.W / 1.9, d.Lref / 1.9);
    uniforms.uBedV.value = d.bed / d.Lref;
    const mesh = new THREE.Mesh(geom, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hand.add(mesh);
    const cut = new THREE.Mesh(track(createCuticleGeometry(ctx, d)), cuticleMat);
    cut.castShadow = true;
    cut.receiveShadow = true;
    hand.add(cut);
    const b = computeNail(geom.getIndex()!, ctx, "almendra", d);
    return { model, ctx, dims, geom, mesh, material, uniforms, from: b, to: b, cur: cloneBuffers(b), canvases, textures, decorKey: "none", shapes: new Map([[`almendra|medio`, b]]) };
  });

  /* ---------- apliques ---------- */
  const gemGeo = track(createGemGeometry());
  const gemMat = track(createGemMaterial());
  const MAX_GEMS = 80;
  const gems = new THREE.InstancedMesh(gemGeo, gemMat, MAX_GEMS);
  gems.castShadow = true;
  gems.frustumCulled = false;
  gems.count = 0;
  hand.add(gems);
  const gemSlots: Accessory[] = [];
  const heart = new THREE.Mesh(track(createHeartGeometry()), track(withEnv(createGoldMaterial())));
  heart.castShadow = true;
  heart.visible = false;
  const bow = new THREE.Mesh(track(createBowGeometry()), track(withEnv(createBowMaterial())));
  bow.castShadow = true;
  bow.visible = false;
  hand.add(heart, bow);
  const heartAcc: Accessory = { object: heart, key: "heart", nail: 1, u: 0, y: 0.5, size: 0.24, tilt: 0.25, scale: 0, vel: 0, target: 0, delay: 0 };
  const bowAcc: Accessory = { object: bow, key: "bow", nail: 3, u: 0, y: 0.5, size: 0.36, tilt: -0.18, scale: 0, vel: 0, target: 0, delay: 0 };

  /* flor 3D de organza: una por uña (la llevan las uñas que tienen la técnica, en general las acento) */
  const flowerGeo = track(createFlowerGeometry());
  const flowerCenterGeo = track(createFlowerCenterGeometry());
  const flowerMat = track(withEnv(createFlowerMaterial()));
  const flowerGold = track(withEnv(createGoldMaterial()));
  const flowerAccs: Accessory[] = [0, 1, 2, 3, 4].map((i) => {
    const g = new THREE.Group();
    // sin sombra propia: la de una tela de dos caras pedía otro shader al aparecer (la página se trababa al elegirla)
    const petals = new THREE.Mesh(flowerGeo, flowerMat);
    g.add(petals, new THREE.Mesh(flowerCenterGeo, flowerGold));
    g.visible = false;
    hand.add(g);
    return { object: g, key: `flower${i}`, nail: i, u: 0, y: 0.5, size: 0.3, tilt: 0.35, scale: 0, vel: 0, target: 0, delay: i * 0.04 };
  });

  /* dijes reales: la foto recortada de la pieza (fondo transparente) apoyada sobre la uña, un plano por dije y uña */
  const charmGeo = track(new THREE.PlaneGeometry(1, 1));
  const texLoader = new THREE.TextureLoader();
  const charmTex = new Map<string, THREE.Texture>();
  type CharmAcc = Accessory & { aspect: number; gone: boolean };
  const charmAccs = new Map<string, CharmAcc>();
  const charmWarm = new THREE.Mesh(charmGeo, track(new THREE.MeshBasicMaterial({ map: track(solidTexture("#ffffff")), transparent: true, alphaTest: 0.35, toneMapped: false })));
  charmWarm.visible = false;
  hand.add(charmWarm);
  function charmTexture(url: string) {
    let t = charmTex.get(url);
    if (!t) {
      t = track(
        texLoader.load(url, (tex) => {
          const im = tex.image as { width: number; height: number };
          for (const a of charmAccs.values()) {
            if (((a.object as THREE.Mesh).material as THREE.MeshBasicMaterial).map === tex) a.aspect = im.width / im.height;
          }
          accDirty = true;
          wake();
        }),
      );
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      charmTex.set(url, t);
    }
    return t;
  }
  function syncCharms(wanted: Map<string, { url: string; nail: number; y: number; size: number }>, instant: boolean) {
    for (const [key, a] of charmAccs) {
      if (wanted.has(key)) continue;
      a.gone = true;
      a.target = 0;
      if (instant) a.scale = 0;
    }
    let order = 0;
    for (const [key, w] of wanted) {
      const old = charmAccs.get(key);
      if (old) {
        old.gone = false;
        old.target = 1;
        old.y = w.y;
        old.size = w.size;
        continue;
      }
      const tex = charmTexture(w.url);
      // la foto ya trae sus luces y brillos: se muestra tal cual (con la luz de la escena el metal se veía apagado)
      const mat = track(new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, toneMapped: false }));
      // un punto más de luz: achicada a la uña, la foto pierde los brillos (las perlas se veían grises)
      mat.color.setScalar(1.15);
      // calcomanía plana sobre la uña: sin sombra (con transparencia, la sombra pedía otro shader en el primer dije)
      const mesh = new THREE.Mesh(charmGeo, mat);
      mesh.visible = false;
      hand.add(mesh);
      const im = tex.image as { width: number; height: number } | undefined;
      charmAccs.set(key, {
        object: mesh,
        key,
        nail: w.nail,
        u: 0,
        y: w.y,
        size: w.size,
        tilt: 0,
        scale: instant ? 1 : 0,
        vel: 0,
        target: 1,
        delay: instant ? 0 : order++ * 0.05,
        aspect: im?.width ? im.width / im.height : 1,
        gone: false,
      });
    }
  }

  /* ---------- estado ---------- */
  let shape: Shape = "almendra";
  let length: Length = "medio";
  let morphT = 1;
  let morphStart = 0;
  let matT = 1;
  let matStart = 0;
  let decalT = 1;
  let decalStart = 0;
  let frameT = 1;
  let frameStart = 0;
  const color = { from: new THREE.Color("#e8c4b0"), to: new THREE.Color("#e8c4b0"), cur: new THREE.Color("#e8c4b0") };
  const catColor = { from: new THREE.Color(), to: new THREE.Color(), cur: new THREE.Color() };
  const sheer = { from: 0, to: 0, cur: 0 };
  let finFrom = finishParams("glossy", []);
  let finTo = finFrom;
  let finCur = { ...finFrom };
  const framing = { from: { ...FRAMING.medio }, to: { ...FRAMING.medio }, cur: { ...FRAMING.medio } };
  let firstUpdate = true;
  let lastSel: BuilderSelection | null = null;
  /** mano a la vista: las uñas 0–4 (derecha) o 5–9 (izquierda) de la selección */
  let viewHand: 0 | 1 = 0;
  const at = (i: number) => viewHand * 5 + i;
  let lastConfig: BuilderConfig | null = null;
  let pending: { sel: BuilderSelection; config: BuilderConfig } | null = null;
  let kitty: HTMLImageElement | null = null;
  let accDirty = true;

  const img = new Image();
  img.decoding = "async";
  img.onload = () => {
    kitty = img;
    if (lastSel && lastConfig && lastSel.extras.includes("personajes")) update(lastSel, lastConfig);
  };
  img.src = "/brand/kitty.webp";

  /* ---------- interacción ---------- */
  let idleUntil = performance.now() + IDLE_MS;
  let idleAmp = 0;
  let lowPower = false;
  let dragging = false;
  let pointerId = -1;
  let startX = 0;
  let startY = 0;
  let startRot = 0;
  let decided = false;
  let rot = 0;
  let rotVel = 0;
  let rotTarget = 0;
  let cursorLabel: string | undefined;
  const parallax = { x: 0, y: 0, tx: 0, ty: 0 };
  // scroll vertical y pellizco quedan para el navegador; el arrastre horizontal gira la mano
  canvas.style.touchAction = "pan-y pinch-zoom";

  const onDown = (e: PointerEvent) => {
    idleUntil = performance.now() + IDLE_MS;
    if (pointerId !== -1) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startRot = rot;
    decided = false;
    dragging = false;
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!decided) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      decided = true;
      dragging = Math.abs(dx) > Math.abs(dy);
      if (dragging) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        cursorLabel = canvas.dataset.cursor;
        canvas.dataset.cursor = "soltá";
      }
    }
    if (!dragging) return;
    const w = canvas.clientWidth || 300;
    // resistencia elástica cerca del tope
    const raw = startRot + (dx / w) * 1.6;
    rotTarget = Math.tanh(raw / MAX_TILT) * MAX_TILT;
    wake();
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    pointerId = -1;
    if (dragging) {
      dragging = false;
      rotTarget = 0;
      if (cursorLabel !== undefined) canvas.dataset.cursor = cursorLabel;
      idleUntil = performance.now() + IDLE_MS;
      wake();
    }
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  const fine = typeof window.matchMedia === "function" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const onMouse = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || reduced || lowPower) return;
    const r = canvas.getBoundingClientRect();
    if (r.width === 0) return;
    const nx = THREE.MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5), -1, 1);
    const ny = THREE.MathUtils.clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.5), -1, 1);
    parallax.tx = nx * 0.075;
    parallax.ty = ny * 0.045;
    wake();
  };
  if (fine) window.addEventListener("pointermove", onMouse, { passive: true });

  /* ---------- visibilidad ---------- */
  let onScreen = true;
  let pageVisible = typeof document === "undefined" ? true : !document.hidden;
  const io =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          for (const en of entries) onScreen = en.isIntersecting;
          if (onScreen) resume();
        })
      : null;
  io?.observe(canvas);
  const onVis = () => {
    pageVisible = !document.hidden;
    if (pageVisible) resume();
  };
  document.addEventListener("visibilitychange", onVis);

  let lost = false;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    options.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  /* ---------- bucle ---------- */
  let raf = 0;
  let lastStep = 0;
  let lastRender = 0;
  let lastFrameNow = 0;
  let chained = false;
  let hardBusy = false;
  let needsRender = true;
  let ready = false;
  let disposed = false;
  const firstFrameCbs = new Set<() => void>();
  let firstFrameDone = false;
  const intervals: number[] = [];
  /** el control de rendimiento recién mide después de este instante (la página termina de cargar y de decodificar fotos) */
  let guardFrom = Infinity;

  /** al volver a pantalla: aplica de una el último cambio que llegó mientras estaba oculta */
  function resume() {
    if (pending && !disposed) {
      const p = pending;
      pending = null;
      apply(p.sel, p.config, true);
      return;
    }
    wake();
  }

  function wake() {
    needsRender = true;
    if (!raf && ready && !disposed && !lost && onScreen && pageVisible) {
      chained = false;
      raf = requestAnimationFrame(frame);
    }
  }

  function springAcc(a: Accessory, dt: number) {
    if (a.delay > 0) {
      a.delay -= dt;
      return true;
    }
    const k = 260;
    const c = 20;
    const acc = -k * (a.scale - a.target) - c * a.vel;
    a.vel += acc * dt;
    a.scale += a.vel * dt;
    if (Math.abs(a.scale - a.target) > 0.002 || Math.abs(a.vel) > 0.01) return true;
    a.scale = a.target;
    a.vel = 0;
    return false;
  }

  const dur = (ms: number, moves: boolean) => (reduced ? (moves ? 1 : REDUCED_FADE_MS) : ms);

  /** avanza las animaciones; devuelve true si alguna sigue en curso (sin contar el reposo ni el parallax) */
  function step(now: number, dt: number) {
    let busy = false;
    const morphing = morphT < 1;
    // morph de forma/largo
    if (morphT < 1) {
      morphT = Math.min(1, (now - morphStart) / dur(MORPH_MS, true));
      const e = easeOut(morphT);
      for (const n of nails) blendNail(n, e);
      busy = true;
    }
    // material (color + acabado + gel translúcido)
    if (matT < 1) {
      matT = Math.min(1, (now - matStart) / dur(MATERIAL_MS, false));
      const e = easeOut(matT);
      color.cur.copy(color.from).lerp(color.to, e);
      catColor.cur.copy(catColor.from).lerp(catColor.to, e);
      sheer.cur = sheer.from + (sheer.to - sheer.from) * e;
      for (const k of FINISH_KEYS) finCur[k] = finFrom[k] + (finTo[k] - finFrom[k]) * e;
      for (const n of nails) applyMaterial(n);
      busy = true;
    }
    if (decalT < 1) {
      decalT = Math.min(1, (now - decalStart) / dur(DECAL_MS, false));
      for (const n of nails) n.uniforms.uDecalMix.value = easeOut(decalT);
      busy = true;
    }
    if (frameT < 1) {
      frameT = Math.min(1, (now - frameStart) / dur(FRAME_MS, true));
      const e = easeOut(frameT);
      framing.cur.cx = framing.from.cx + (framing.to.cx - framing.from.cx) * e;
      framing.cur.cy = framing.from.cy + (framing.to.cy - framing.from.cy) * e;
      framing.cur.h = framing.from.h + (framing.to.h - framing.from.h) * e;
      placeCamera();
      busy = true;
    }
    // apliques: resorte con un toque de rebote (solo se reubican si algo se movió)
    let accBusy = false;
    for (const a of gemSlots) if (springAcc(a, dt)) accBusy = true;
    if (springAcc(heartAcc, dt)) accBusy = true;
    if (springAcc(bowAcc, dt)) accBusy = true;
    for (const a of flowerAccs) if (springAcc(a, dt)) accBusy = true;
    for (const [key, a] of charmAccs) {
      if (springAcc(a, dt)) accBusy = true;
      else if (a.gone) {
        hand.remove(a.object);
        ((a.object as THREE.Mesh).material as THREE.Material).dispose();
        charmAccs.delete(key);
      }
    }
    if (accBusy || morphing || accDirty) {
      placeAccessories();
      accDirty = false;
    }
    if (accBusy) busy = true;
    // giro: arrastre con resorte de vuelta (ζ ≈ 0,74: rebote ~3 %)
    if (dragging) {
      const prev = rot;
      rot += (rotTarget - rot) * (1 - Math.exp(-dt * 22));
      rotVel = (rot - prev) / Math.max(dt, 1e-3);
      busy = true;
    } else if (Math.abs(rot) > 0.0005 || Math.abs(rotVel) > 0.001) {
      const k = 55;
      const c = 11;
      rotVel += (-k * rot - c * rotVel) * dt;
      rot += rotVel * dt;
      busy = true;
    } else {
      rot = 0;
      rotVel = 0;
    }
    // parallax del mouse
    const pk = 1 - Math.exp(-dt * 6);
    parallax.x += (parallax.tx - parallax.x) * pk;
    parallax.y += (parallax.ty - parallax.y) * pk;
    // balanceo de reposo: entra y sale suave
    const idleTarget = idleWanted(now) ? 1 : 0;
    idleAmp += (idleTarget - idleAmp) * (1 - Math.exp(-dt * 2.5));
    if (Math.abs(idleTarget - idleAmp) < 0.002) idleAmp = idleTarget;
    const t = now / 1000;
    const idleY = Math.sin(t * 0.7) * 0.05 * idleAmp;
    const idleX = Math.sin(t * 0.53 + 1.3) * 0.022 * idleAmp;
    pivot.rotation.set(idleX + parallax.y, idleY + rot + parallax.x, Math.sin(t * 0.41) * 0.01 * idleAmp);
    // cat eye y aurora: el reflejo acompaña el giro
    for (const n of nails) n.uniforms.uCatOffset.value = -(rot + parallax.x + idleY) * 0.9;
    return busy;
  }

  const idleWanted = (now: number) => !reduced && !lowPower && now < idleUntil;
  const softActive = (now: number) =>
    idleAmp > 0 || idleWanted(now) || Math.abs(parallax.tx - parallax.x) > 0.0005 || Math.abs(parallax.ty - parallax.y) > 0.0005;

  function frame(now: number) {
    raf = 0;
    if (disposed || lost || !onScreen || !pageVisible) {
      chained = false;
      return;
    }
    // control de rendimiento: intervalo real entre cuadros encadenados
    // Se mide recién pasados ~2,5 s del primer cuadro y con la página cargada: durante la carga (fotos
    // decodificándose, hidratación, scroll de entrada) todo dispositivo tira cuadros largos y antes el
    // guardia bajaba la mano a baja resolución para siempre por un mal arranque.
    if (perfGuard && chained && !lowPower && now > guardFrom && document.readyState === "complete") {
      intervals.push(now - lastFrameNow);
      if (intervals.length === 30) {
        const sorted = [...intervals].sort((a, b) => a - b);
        if (sorted[15] > 50) degrade();
        intervals.length = 0;
        guardFrom = now + 4000;
      }
    }
    lastFrameNow = now;
    // solo reposo o parallax: alcanza con ~30 fps
    if (!hardBusy && !needsRender && now - lastRender < 32) {
      raf = requestAnimationFrame(frame);
      chained = true;
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (now - (lastStep || now)) / 1000));
    lastStep = now;
    hardBusy = step(now, dt);
    renderer.render(scene, camera);
    lastRender = now;
    needsRender = false;
    if (hardBusy || softActive(now)) {
      raf = requestAnimationFrame(frame);
      chained = true;
    } else {
      chained = false;
      lastStep = 0;
    }
  }

  /** el dispositivo no llega: se apaga el balanceo y el parallax, pero la resolución se mantiene (la mano
   *  a 1x se veía borrosa y parecía "otra mano"; se prefiere menos movimiento antes que menos nitidez) */
  function degrade() {
    lowPower = true;
    parallax.tx = parallax.ty = 0;
  }

  function placeCamera() {
    const { cx, cy, h } = framing.cur;
    const aspect = camera.aspect;
    const hEff = Math.max(h, (h * (4 / 3)) / aspect);
    const dist = hEff / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.position.set(cx, cy - Math.sin(CAMERA_TILT) * dist, Math.cos(CAMERA_TILT) * dist + 0.4);
    camera.lookAt(cx, cy, 0.4);
    camera.updateProjectionMatrix();
  }

  function applyMaterial(n: NailState) {
    n.material.color.copy(color.cur);
    n.uniforms.uCatColor.value.copy(catColor.cur);
    n.uniforms.uSheer.value = sheer.cur;
    applyFinish(n.material, n.uniforms, finCur);
  }

  /** La forma de una uña en forma y largo dados: de la caché si ya se calculó (en un celular calcular las cinco
   *  en el momento del toque eran ~70 ms de imagen congelada justo al elegir Coffin o Stiletto). */
  function nailShape(n: NailState, shp: Shape, len: Length): NailBuffers {
    const key = `${shp}|${len}`;
    let b = n.shapes.get(key);
    if (!b) {
      b = computeNail(n.geom.getIndex()!, n.ctx, shp, n.dims[len]);
      n.shapes.set(key, b);
    }
    return b;
  }

  /** Precalcula en los ratos libres todas las formas (primero las del largo actual): una por tanda. */
  function warmShapes() {
    const SHAPES: Shape[] = ["almendra", "ovalada", "cuadrada", "coffin", "stiletto"];
    const LENGTHS: Length[] = ["corto", "medio", "largo", "xl"];
    const queue: Array<[Shape, Length]> = [];
    for (const l of [length, ...LENGTHS.filter((x) => x !== length)]) for (const sh of SHAPES) queue.push([sh, l]);
    const idle = (cb: () => void) =>
      typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb, { timeout: 800 }) : window.setTimeout(cb, 60);
    const next = () => {
      if (disposed || lost) return;
      const job = queue.shift();
      if (!job) return;
      for (const n of nails) nailShape(n, job[0], job[1]);
      idle(next);
    };
    idle(next);
  }

  function blendNail(n: NailState, e: number) {
    const { from, to, cur } = n;
    for (let i = 0; i < cur.pos.length; i++) cur.pos[i] = from.pos[i] + (to.pos[i] - from.pos[i]) * e;
    for (let i = 0; i < cur.nrm.length; i += 3) {
      const x = from.nrm[i] + (to.nrm[i] - from.nrm[i]) * e;
      const y = from.nrm[i + 1] + (to.nrm[i + 1] - from.nrm[i + 1]) * e;
      const z = from.nrm[i + 2] + (to.nrm[i + 2] - from.nrm[i + 2]) * e;
      const l = Math.hypot(x, y, z) || 1;
      cur.nrm[i] = x / l;
      cur.nrm[i + 1] = y / l;
      cur.nrm[i + 2] = z / l;
    }
    for (let i = 0; i < cur.top.length; i++) cur.top[i] = from.top[i] + (to.top[i] - from.top[i]) * e;
    for (let i = 0; i < cur.uv.length; i++) cur.uv[i] = from.uv[i] + (to.uv[i] - from.uv[i]) * e;
    cur.L = from.L + (to.L - from.L) * e;
    writeNail(n);
  }

  function writeNail(n: NailState) {
    const g = n.geom;
    (g.getAttribute("position") as THREE.BufferAttribute).copyArray(n.cur.pos).needsUpdate = true;
    (g.getAttribute("normal") as THREE.BufferAttribute).copyArray(n.cur.nrm).needsUpdate = true;
    (g.getAttribute("uv") as THREE.BufferAttribute).copyArray(n.cur.uv).needsUpdate = true;
    g.computeBoundingSphere();
  }

  const _P = new THREE.Vector3();
  const _N = new THREE.Vector3();
  const _T = new THREE.Vector3();
  const _X = new THREE.Vector3();
  const _Z = new THREE.Vector3();
  const _M = new THREE.Matrix4();
  const _Q = new THREE.Quaternion();
  const _S = new THREE.Vector3();

  function frameOn(a: Accessory) {
    const n = nails[a.nail];
    const s = Math.min(0.97, a.y / n.cur.L);
    sampleTop(n.cur.top, a.u, s, _P, _N, _T);
    _X.crossVectors(_T, _N).normalize();
    _T.crossVectors(_N, _X).normalize();
    if (a.tilt) {
      _Q.setFromAxisAngle(_N, a.tilt);
      _X.applyQuaternion(_Q);
      _T.applyQuaternion(_Q);
    }
  }

  function placeAccessories() {
    let count = 0;
    for (const a of gemSlots) {
      frameOn(a);
      // la lathe crece en +Y: Y = normal de la uña
      _M.makeBasis(_X, _N, _Z.crossVectors(_X, _N));
      const sc = Math.max(0, a.scale) * a.size;
      _S.set(sc, sc, sc);
      _M.scale(_S);
      _M.setPosition(_P.addScaledVector(_N, -0.004));
      gems.setMatrixAt(count++, _M);
    }
    gems.count = count;
    gems.instanceMatrix.needsUpdate = true;
    for (const a of [heartAcc, bowAcc, ...flowerAccs]) {
      const o = a.object;
      o.visible = a.scale > 0.001;
      if (!o.visible) continue;
      frameOn(a);
      _M.makeBasis(_X, _T, _N);
      o.position.copy(_P);
      o.quaternion.setFromRotationMatrix(_M);
      const sc = Math.max(0, a.scale) * a.size;
      o.scale.set(sc, sc, sc * 0.9);
    }
    for (const a of charmAccs.values()) {
      const o = a.object;
      o.visible = a.scale > 0.001;
      if (!o.visible) continue;
      frameOn(a);
      // el plano mira hacia afuera de la uña (Z = normal) y la foto queda derecha, con la parte de arriba hacia la punta
      _M.makeBasis(_X, _T, _N);
      o.position.copy(_P).addScaledVector(_N, a.size * 0.08);
      o.quaternion.setFromRotationMatrix(_M);
      const sc = Math.max(0, a.scale) * a.size;
      o.scale.set(sc * Math.min(1, a.aspect), sc * Math.min(1, 1 / a.aspect), 1);
    }
  }

  const FULL_PATTERN: Array<[number, number, number]> = [
    [0, 0.0, 0.13],
    [-0.55, 0.09, 0.09],
    [0.55, 0.09, 0.09],
    [0, 0.2, 0.11],
    [-0.56, 0.3, 0.1],
    [0.56, 0.3, 0.1],
    [0, 0.41, 0.12],
    [-0.5, 0.52, 0.085],
    [0.5, 0.52, 0.085],
    [0, 0.63, 0.1],
    [-0.4, 0.74, 0.075],
    [0.4, 0.74, 0.075],
    [0, 0.85, 0.08],
    [-0.3, 0.94, 0.06],
    [0.3, 0.94, 0.06],
  ];

  function gemLayout(extrasOf: (i: number) => string[], shp: Shape, len: Length, art?: string) {
    const out: Array<{ key: string; nail: number; u: number; y: number; size: number }> = [];
    nails.forEach((n, i) => {
      // diseño del catálogo con strass propios (art.ts): van donde los pone Brenda
      const own = artGems(art, i, n.dims[len], shp);
      if (own) {
        own.forEach((g, k) => out.push({ key: `a${i}:${k}`, nail: i, u: g.u, y: g.y, size: g.size }));
        return;
      }
      const extras = extrasOf(i);
      const full = extras.includes("strass-full");
      const some = extras.includes("strass");
      if (!full && !some) return;
      const d = n.dims[len];
      const { W, bed } = d;
      if (full) {
        // cubre todo el largo real de la uña, sin sobresalir de los bordes (stiletto, almendra)
        const span = Math.min(d.L * 0.9, d.bed + 0.9 * (d.L - d.bed));
        FULL_PATTERN.forEach(([u, s, r], k) => {
          const y = 0.06 + 0.11 * W + s * (span - 0.11 * W);
          const size = r * W * 1.05;
          if ((1 - Math.abs(u)) * halfWidth(shp, y, d) < size * 0.9 && u !== 0) return;
          if (halfWidth(shp, y, d) < size * 1.05) return;
          out.push({ key: `f${i}:${k}`, nail: i, u, y, size });
        });
      } else if (i % 2 === 1) {
        out.push({ key: `s${i}:0`, nail: i, u: 0, y: bed * 0.26, size: 0.17 * W });
        out.push({ key: `s${i}:1`, nail: i, u: 0, y: bed * 0.5, size: 0.125 * W });
        out.push({ key: `s${i}:2`, nail: i, u: 0, y: bed * 0.69, size: 0.095 * W });
      } else {
        out.push({ key: `s${i}:0`, nail: i, u: 0, y: bed * 0.3, size: 0.18 * W });
      }
    });
    return out;
  }

  /** Técnicas que lleva la uña i de la mano a la vista (las del set o las que la clienta le puso a esa uña). */
  function nailExtras(sel: BuilderSelection, i: number): string[] {
    return nailSpec(sel, at(i)).extras;
  }

  function setDecal(n: NailState, i: number, sel: BuilderSelection, hex: { base: string; tip: string; detail: string; degrade: string; accent: string | null }, instant: boolean) {
    const isAccent = nailSpec(sel, at(i)).custom;
    const input = {
      index: i,
      nail: at(i),
      art: sel.art,
      baseHex: hex.base,
      shape: sel.shape,
      dims: n.dims[sel.length],
      extras: nailExtras(sel, i),
      tipHex: hex.tip,
      detailHex: hex.detail,
      degradeHex: hex.degrade,
      isAccent,
      accentHex: isAccent ? hex.accent : null,
      kitty,
    };
    const k = decorKey(input);
    if (k === n.decorKey) return false;
    n.decorKey = k;
    const prev = n.material.map as THREE.Texture;
    let next: THREE.Texture = BLANK;
    if (k !== "none") {
      // doble búfer: pintamos en el canvas que no está en pantalla
      const back = prev === n.textures[0] ? 1 : 0;
      paintDecor(n.canvases[back], input);
      n.textures[back].needsUpdate = true;
      next = n.textures[back];
    }
    n.material.map = next;
    n.uniforms.uDecalPrev.value = instant ? next : prev;
    n.uniforms.uDecalMix.value = instant ? 1 : 0;
    return true;
  }

  function update(sel: BuilderSelection, config: BuilderConfig) {
    if (disposed) return;
    lastSel = sel;
    lastConfig = config;
    // fuera de pantalla no gastamos nada: guardamos el último cambio y lo aplicamos al volver
    if (!firstUpdate && (!onScreen || !pageVisible)) {
      pending = { sel, config };
      return;
    }
    pending = null;
    apply(sel, config, firstUpdate);
  }

  function apply(sel: BuilderSelection, config: BuilderConfig, instant: boolean) {
    const now = performance.now();
    idleUntil = now + IDLE_MS;
    const baseHex = config.bases.find((b) => b.id === sel.base)?.hex ?? "#e8c4b0";
    const tipHex = config.bases.find((b) => b.id === (sel.tipColor ?? "bordo"))?.hex ?? "#4a0e0e";
    const detailHex = config.bases.find((b) => b.id === (sel.detailColor ?? defaultDetailColor(sel.base)))?.hex ?? "#4a0e0e";
    const degradeHex = sel.degradeColor ? (config.bases.find((b) => b.id === sel.degradeColor)?.hex ?? "#fffdfa") : "#fffdfa";
    // color propio de cada uña: solo si es distinto del de la base
    const ownHex = (i: number) => {
      const c = nailSpec(sel, at(i)).color;
      return c !== sel.base ? (config.bases.find((b) => b.id === c)?.hex ?? null) : null;
    };

    // forma / largo → morph
    if (instant || sel.shape !== shape || sel.length !== length) {
      shape = sel.shape;
      length = sel.length;
      for (const n of nails) {
        n.from = cloneBuffers(n.cur);
        n.to = nailShape(n, shape, length);
      }
      morphStart = now;
      morphT = instant ? 1 : 0;
      if (instant) for (const n of nails) blendNail(n, 1);
      framing.from = { ...framing.cur };
      framing.to = { ...FRAMING[length] };
      frameStart = now;
      frameT = instant ? 1 : 0;
      if (instant) {
        framing.cur = { ...framing.to };
        placeCamera();
      }
      accDirty = true;
    }

    // color + acabado
    const base = new THREE.Color(baseHex);
    const target = base.clone();
    if (sel.finish === "cromado") {
      // metal espejado del mismo tono (en HSL sRGB: en lineal el rosa sale blanco)
      const hsl = { h: 0, s: 0, l: 0 };
      base.getHSL(hsl, THREE.SRGBColorSpace);
      const neutral = hsl.s < 0.12;
      target.setHSL(
        hsl.h,
        neutral ? 0.03 : Math.min(0.9, hsl.s),
        neutral ? THREE.MathUtils.clamp(hsl.l * 0.6 + 0.3, 0.36, 0.8) : THREE.MathUtils.clamp(hsl.l * 0.9 + 0.12, 0.26, 0.72),
        THREE.SRGBColorSpace,
      );
    }
    if (sel.extras.includes("aurora")) target.lerp(new THREE.Color("#ffffff"), 0.06);
    const cat = base.clone().lerp(new THREE.Color("#fff1d6"), CAT_LERP).multiplyScalar(CAT_GAIN);
    const fin = finishParams(sel.finish, sel.extras);
    if (fin.catEye > 0) {
      // sobre bases oscuras el negro tiene que leerse negro (no metal gris)
      const hsl = { h: 0, s: 0, l: 0 };
      base.getHSL(hsl, THREE.SRGBColorSpace);
      if (hsl.l < 0.15) fin.envMapIntensity = Math.min(fin.envMapIntensity, 0.18);
    }
    const sheerTo = sel.finish === "cromado" ? 0 : (SHEER[sel.base] ?? 0);
    const changed = !target.equals(color.to) || FINISH_KEYS.some((k) => fin[k] !== finTo[k]) || !cat.equals(catColor.to) || sheerTo !== sheer.to;
    if (instant || changed) {
      color.from.copy(color.cur);
      color.to.copy(target);
      catColor.from.copy(catColor.cur);
      catColor.to.copy(cat);
      sheer.from = sheer.cur;
      sheer.to = sheerTo;
      finFrom = { ...finCur };
      finTo = fin;
      matStart = now;
      matT = instant ? 1 : 0;
      if (instant) {
        color.cur.copy(target);
        catColor.cur.copy(cat);
        sheer.cur = sheerTo;
        finCur = { ...fin };
        for (const n of nails) applyMaterial(n);
      }
    }

    // decoración pintada
    let decalChanged = false;
    nails.forEach((n, i) => {
      if (setDecal(n, i, sel, { base: baseHex, tip: tipHex, detail: detailHex, degrade: degradeHex, accent: ownHex(i) }, instant)) decalChanged = true;
    });
    if (decalChanged && !instant) {
      decalStart = now;
      decalT = 0;
    }

    // strass: los que siguen en su lugar se quedan; los nuevos aparecen escalonados
    const layout = gemLayout((i) => nailExtras(sel, i), sel.shape, sel.length, sel.art);
    const prevSlots = new Map(gemSlots.map((g) => [g.key, g]));
    gemSlots.length = 0;
    layout.forEach((g, i) => {
      if (gemSlots.length >= MAX_GEMS) return;
      const old = prevSlots.get(g.key);
      gemSlots.push({
        object: gems,
        key: g.key,
        nail: g.nail,
        u: g.u,
        y: g.y,
        size: g.size,
        tilt: (i % 5) * 0.35,
        scale: instant ? 1 : (old?.scale ?? 0),
        vel: old?.vel ?? 0,
        target: 1,
        delay: instant || old ? 0 : (i % 13) * 0.018 + g.nail * 0.03,
      });
    });
    // dije y moño
    const ring = nails[3].dims.medio.bed;
    bowAcc.y = sel.extras.includes("personajes") ? ring * 0.97 : ring * 0.5;
    heartAcc.y = nails[1].dims.medio.bed * 0.5;
    for (const [acc, on] of [
      [heartAcc, sel.extras.includes("charms")],
      [bowAcc, nailExtras(sel, 3).includes("3d")],
    ] as const) {
      const t = on ? 1 : 0;
      if (acc.target !== t) {
        acc.target = t;
        if (instant) acc.scale = t;
      }
    }
    // flor 3D: al medio de la uña, del ancho de la uña
    flowerAccs.forEach((a, i) => {
      const d = nails[i].dims[sel.length];
      a.y = d.L * 0.45;
      a.size = d.W * 0.62;
      const t = nailExtras(sel, i).includes("flor-3d") ? 1 : 0;
      if (a.target !== t) {
        a.target = t;
        if (instant) a.scale = t;
      }
    });

    // dijes elegidos con sus uñas: uno va al medio de la uña; varios en la misma uña se reparten a lo largo
    const perNail = new Map<number, string[]>();
    for (const p of sel.charms ?? []) {
      const piece = config.charms?.find((c) => c.id === p.id)?.piece;
      if (!piece || !p.nails) continue;
      for (const n of p.nails) {
        const i = n - viewHand * 5;
        if (i >= 0 && i < nails.length) perNail.set(i, [...(perNail.get(i) ?? []), piece]);
      }
    }
    const wanted = new Map<string, { url: string; nail: number; y: number; size: number }>();
    perNail.forEach((urls, i) => {
      const d = nails[i].dims[sel.length];
      urls.forEach((url, k) => {
        const n = urls.length;
        const y = n === 1 ? d.L * 0.42 : d.L * (0.26 + (0.46 * k) / (n - 1));
        wanted.set(`${url}|${i}|${k}`, { url, nail: i, y, size: d.W * (n === 1 ? 0.88 : 0.66) });
      });
    });
    syncCharms(wanted, instant);

    placeAccessories();
    accDirty = false;
    firstUpdate = false;
    wake();
  }

  let lastW = 0;
  let lastH = 0;
  function resize(force = false) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    // reasignar el tamaño borra el canvas: solo si de verdad cambió
    if (!force && w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    placeCamera();
    if (ready && !disposed && !lost) {
      // redibujamos en el acto: sin un cuadro en blanco al rotar el teléfono
      renderer.render(scene, camera);
      lastRender = performance.now();
    }
    wake();
  }

  /* ---------- arranque en tandas: entorno, piel, sombra de contacto, shaders y primer cuadro ---------- */
  resize();
  placeCamera();
  const start = async () => {
    await yieldToMain();
    if (disposed || lost) return;
    buildEnvironment();
    for (let i = 0; i < models.length; i++) {
      await yieldToMain();
      if (disposed || lost) return;
      const { map, normalMap } = paintSkin(models[i], 11 + i * 31);
      track(map);
      track(normalMap);
      skinMats[i].map = map;
      skinMats[i].normalMap = normalMap;
    }
    await yieldToMain();
    if (disposed || lost) return;
    // sombra de contacto: huella difusa de cada dedo sobre la mesa
    const contact = createContactShadow(models);
    track(contact.texture);
    track(contact.material);
    track(contact.geometry);
    hand.add(contact.mesh);
    // Los apliques (flor, moño, corazón, dijes) arrancan ocultos y three solo compila lo visible: su primer uso
    // compilaba el shader en el momento del toque (en un celu, más de un segundo trabado). Los compilamos ahora,
    // visibles y diminutos; el dije de prueba se queda (oculto) para que su programa no se libere.
    const warm = [heart, bow, ...flowerAccs.map((a) => a.object), charmWarm];
    for (const o of warm) {
      o.visible = true;
      o.scale.setScalar(1e-4);
      // todavía no están sobre la uña: sin esto la sombra los descarta por estar fuera de cuadro y no los compila
      o.traverse((m) => (m.frustumCulled = false));
    }
    try {
      await renderer.compileAsync(scene, camera);
    } catch {
      /* si no hay compilación paralela, se compila al dibujar */
    }
    // un cuadro de prueba: compila también lo que compileAsync no ve (las sombras de los apliques)
    if (disposed || lost) return;
    renderer.render(scene, camera);
    for (const o of warm) {
      o.visible = false;
      o.traverse((m) => (m.frustumCulled = true));
    }
    accDirty = true;
    if (disposed || lost) return;
    ready = true;
    renderer.render(scene, camera);
    lastRender = performance.now();
    needsRender = false;
    requestAnimationFrame(() => {
      if (disposed || lost) return;
      firstFrameDone = true;
      guardFrom = performance.now() + 2500;
      firstFrameCbs.forEach((cb) => cb());
      firstFrameCbs.clear();
      warmShapes();
      if (pending && (!onScreen || !pageVisible)) return;
      resume();
    });
  };
  void start().catch(() => {
    if (!disposed) options.onContextLost?.();
  });

  function buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    // softboxes alargados en el techo: la "ventana" larga que recorre toda la uña glossy
    const stripGeo = new THREE.BoxGeometry(1, 1, 1);
    const stripMats: THREE.Material[] = [];
    const strip = (x: number, z: number, sx: number, sz: number, intensity: number) => {
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.97, 0.93).multiplyScalar(intensity) });
      stripMats.push(mat);
      const m = new THREE.Mesh(stripGeo, mat);
      m.position.set(x, 19, z);
      m.scale.set(sx, 0.1, sz);
      room.add(m);
    };
    strip(-3.2, -6, 1.6, 26, 36);
    // brillo secundario ancho y suave (sin una segunda raya fina)
    strip(3.0, -5, 2.6, 20, 5);
    const envRT = track(pmrem.fromScene(room, 0.03));
    room.dispose();
    stripGeo.dispose();
    stripMats.forEach((m) => m.dispose());
    // entorno propio de los strass: fondo negro con paneles muy brillantes → facetas que destellan
    const gemRoom = new THREE.Scene();
    // gris medio en lineal (un hex se convierte de sRGB y quedaría casi negro)
    gemRoom.background = new THREE.Color().setRGB(0.32, 0.32, 0.34, THREE.LinearSRGBColorSpace);
    const panelGeo = new THREE.PlaneGeometry(2.6, 2.6);
    const panelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(30, 30, 30), side: THREE.DoubleSide });
    for (const [x, y, z] of [
      [3, 8, 2],
      [-4, 7, -3],
      [0, 9, -5],
      [5, 4, -1],
      [-6, 5, 3],
      [2, 6, 6],
      [-2, 3, 7],
      [6, 7, 4],
      [-5, 8, 0],
      [1, 4, -7],
      [-3, 9, 4],
      [4, 9, -4],
    ]) {
      const m = new THREE.Mesh(panelGeo, panelMat);
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      gemRoom.add(m);
    }
    const gemEnvRT = track(pmrem.fromScene(gemRoom, 0));
    panelGeo.dispose();
    panelMat.dispose();
    pmrem.dispose();
    // envMap por material (no scene.environment): así cada material conserva su envMapIntensity
    for (const m of envMaterials) {
      m.envMap = envRT.texture;
      // el "techo" de la habitación queda arriba de la mano (el dorso mira a +Z)
      m.envMapRotation.set(Math.PI / 2, 0, 0);
    }
    gemMat.envMap = gemEnvRT.texture;
    gemMat.envMapRotation.set(Math.PI / 2, 0, 0);
  }

  return {
    update,
    setHand(hand) {
      if (hand === viewHand) return;
      viewHand = hand;
      if (lastSel && lastConfig) update(lastSel, lastConfig);
    },
    resize: () => resize(),
    onFirstFrame(cb) {
      if (firstFrameDone) {
        cb();
        return () => {};
      }
      firstFrameCbs.add(cb);
      return () => firstFrameCbs.delete(cb);
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("webglcontextlost", onLost);
      if (fine) window.removeEventListener("pointermove", onMouse);
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
      img.onload = null;
      gems.dispose();
      for (const d of disposables) d.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      // un contexto ya perdido no se puede "perder" de nuevo (evita la advertencia de three)
      if (!lost) renderer.forceContextLoss();
    },
  };
}

/** color del cat eye: la base aclarada hacia un crema cálido */
const CAT_LERP = 0.6;
const CAT_GAIN = 1.25;

function solidTexture(hex: string) {
  const c = new THREE.Color(hex);
  const t = new THREE.DataTexture(new Uint8Array([Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255), 255]), 1, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function makeCanvas() {
  const c = document.createElement("canvas");
  c.width = DECAL_W;
  c.height = DECAL_H;
  return c;
}

function cloneBuffers(b: NailBuffers): NailBuffers {
  return { pos: b.pos.slice(), nrm: b.nrm.slice(), top: b.top.slice(), uv: b.uv.slice(), L: b.L };
}

function createContactShadow(models: FingerModel[]) {
  const x0 = -10;
  const x1 = 8;
  const y0 = -5;
  const y1 = 14;
  const S = 512;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const ctx = c.getContext("2d")!;
  const toPx = (x: number, y: number): [number, number] => [((x - x0) / (x1 - x0)) * S, (1 - (y - y0) / (y1 - y0)) * S];
  const scale = S / (x1 - x0);
  const OFF = 4000; // dibujamos fuera del canvas y dejamos que solo caiga la sombra (blur portable)
  const pass = (blur: number, alphaK: number, widthK: number, sharp: number) => {
    ctx.save();
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = OFF;
    for (const m of models) {
      for (let k = 0; k <= 90; k++) {
        const v = 0.05 + (k / 90) * 0.95;
        const f = m.frame(v);
        // cuanto más cerca de la mesa, más oscura la huella
        const bottom = Math.max(0, f.C.z - f.bBot);
        const a = alphaK * Math.exp(-bottom * sharp) * Math.min(1, f.a / (m.spec.width * 0.25));
        if (a < 0.004) continue;
        const [px, py] = toPx(f.C.x, f.C.y);
        ctx.shadowColor = `rgba(66,36,28,${a})`;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(px - OFF, py, Math.max(1, f.a * widthK * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };
  pass(18, 0.04, 0.95, 1.4);
  pass(6, 0.07, 0.72, 4);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  const geometry = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.003);
  mesh.renderOrder = -1;
  return { mesh, texture, material, geometry };
}
