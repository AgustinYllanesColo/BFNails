import * as THREE from "three";
import type { BuilderSelection, Length, Shape } from "@/lib/types";
import type { BuilderConfig } from "@/lib/pricing";
import { FINGERS, FingerModel, SKIN_BASE, mulberry32, paintSkin } from "./anatomy";
import { DECAL_H, DECAL_W, decorKey, paintDecor } from "./decor";
import { computeNail, createNailGeometry, halfWidth, nailContext, nailDims, sampleTop, type NailBuffers, type NailDims } from "./nail";
import {
  FINISH_KEYS,
  applyFinish,
  createBowMaterial,
  createFlakeTexture,
  createGemMaterial,
  createGoldMaterial,
  createNailMaterial,
  createSkinMaterial,
  finishParams,
  type NailUniforms,
} from "./materials";
import { createBowGeometry, createGemGeometry, createGemShadow, createHeartGeometry } from "./accessories";
import { createGemEnvironment, createStudioEnvironment } from "./environment";

/**
 * Escena procedural de la mano con uñas (estilo img2threejs: todo en código, sin modelos).
 * Render on demand: solo dibuja cuando algo cambia o hay una animación en curso (el balanceo de
 * reposo se apaga solo a los pocos segundos), y se pausa fuera de pantalla o con la pestaña oculta.
 */

export type HandScene = {
  update(sel: BuilderSelection, config: BuilderConfig): void;
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
/** el balanceo de reposo dura unos segundos después de la última interacción y se apaga */
const IDLE_MS = 6000;
const MAX_TILT = THREE.MathUtils.degToRad(25);
const CAMERA_TILT = THREE.MathUtils.degToRad(16);
const FOV = 26;

// ≈ cubic-bezier(0.23, 1, 0.32, 1)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/** encuadre según el largo: las uñas (el producto) llenan el cuadro; el corte cae en la falange proximal */
const FRAMING: Record<Length, { cx: number; cy: number; h: number }> = {
  corto: { cx: -1.3, cy: 6.0, h: 9.8 },
  medio: { cx: -1.25, cy: 6.3, h: 10.2 },
  largo: { cx: -1.3, cy: 6.65, h: 10.8 },
  xl: { cx: -1.35, cy: 7.0, h: 11.4 },
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
  // Suave: con PCF a secas el borde es duro y la sombra de los dedos se lee como una segunda mano al costado
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  const key = new THREE.DirectionalLight("#ffeedb", 2.5);
  key.position.set(-5, 5, 14).add(PIVOT);
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
  const fill = new THREE.DirectionalLight("#d6e2ff", 0.32);
  fill.position.set(10, -3, 7).add(PIVOT);
  fill.target.position.copy(PIVOT);
  const rim = new THREE.DirectionalLight("#fff6ee", 0.7);
  rim.position.set(3, 22, 3).add(PIVOT);
  rim.target.position.copy(PIVOT);
  // rebote cálido de la mesa crema: levanta los costados y la cara de abajo de los dedos (sombras cálidas, no grises)
  const bounce = new THREE.HemisphereLight("#fff6ee", "#e9c7a2", 0.32);
  bounce.position.set(0, 0, 1);
  scene.add(key, key.target, fill, fill.target, rim, rim.target, bounce);

  /* ---------- grupo que rota (mano + mesa) ---------- */
  const pivot = new THREE.Group();
  pivot.position.copy(PIVOT);
  scene.add(pivot);
  const hand = new THREE.Group();
  hand.position.copy(PIVOT).negate();
  hand.rotation.z = HAND_ROLL;
  pivot.add(hand);

  // sombra proyectada suave (solo sombra, el fondo es el crema del contenedor)
  const shadowMat = track(new THREE.ShadowMaterial({ color: new THREE.Color("#5b2618"), opacity: 0.11 }));
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
  const skinMats = models.map((model) => {
    const geo = track(model.buildGeometry());
    const mat = track(withEnv(createSkinMaterial(skinPlaceholder, flatNormal, model.joints)));
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
    uniforms.uSmile.value = (0.15 * d.W) / d.Lref;
    const mesh = new THREE.Mesh(geom, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hand.add(mesh);
    const b = computeNail(geom.getIndex()!, ctx, "almendra", d);
    return { model, ctx, dims, geom, mesh, material, uniforms, from: b, to: b, cur: cloneBuffers(b), canvases, textures, decorKey: "none" };
  });

  /* ---------- apliques ---------- */
  const gemGeo = track(createGemGeometry());
  const gemMat = track(createGemMaterial());
  const MAX_GEMS = 320;
  const gems = new THREE.InstancedMesh(gemGeo, gemMat, MAX_GEMS);
  // la sombra de cada piedra la pone su disco de contacto (no pasan por el mapa de sombras: hasta 300 piedras)
  gems.castShadow = false;
  gems.frustumCulled = false;
  gems.count = 0;
  hand.add(gems);
  // sombra de contacto de cada piedra (se dibuja después de las uñas, que son transparentes)
  const gemShadow = createGemShadow();
  track(gemShadow.geometry);
  track(gemShadow.material);
  track(gemShadow.texture);
  const gemShadows = new THREE.InstancedMesh(gemShadow.geometry, gemShadow.material, MAX_GEMS);
  gemShadows.frustumCulled = false;
  gemShadows.count = 0;
  gemShadows.renderOrder = 2;
  hand.add(gemShadows);
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
    const idleY = Math.sin(t * 0.7) * 0.022 * idleAmp;
    const idleX = Math.sin(t * 0.53 + 1.3) * 0.012 * idleAmp;
    pivot.rotation.set(idleX + parallax.y, idleY + rot + parallax.x, Math.sin(t * 0.41) * 0.006 * idleAmp);
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
    if (perfGuard && chained && !lowPower && intervals.length < 20) {
      intervals.push(now - lastFrameNow);
      if (intervals.length === 20) {
        const sorted = [...intervals].sort((a, b) => a - b);
        if (sorted[10] > 45) degrade();
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

  /** el dispositivo no llega: menos píxeles y sin balanceo */
  function degrade() {
    lowPower = true;
    parallax.tx = parallax.ty = 0;
    renderer.setPixelRatio(1);
    resize(true);
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
    n.uniforms.uLenV.value = cur.L / n.dims.medio.Lref;
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
      gems.setMatrixAt(count, _M);
      // la sombra cae del lado contrario a la luz clave (que viene de arriba a la izquierda)
      _M.setPosition(_P.addScaledVector(_N, 0.01).addScaledVector(_X, 0.12 * sc).addScaledVector(_T, -0.08 * sc));
      gemShadows.setMatrixAt(count, _M);
      count++;
    }
    gems.count = count;
    gems.instanceMatrix.needsUpdate = true;
    gemShadows.count = count;
    gemShadows.instanceMatrix.needsUpdate = true;
    for (const a of [heartAcc, bowAcc]) {
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
  }

  type GemSpot = { key: string; nail: number; u: number; y: number; size: number };
  const layoutCache = new Map<string, GemSpot[]>();

  /**
   * Strass full: mosaico denso de piedras de varios tamaños (como se pegan de verdad: primero las
   * grandes, después las medianas y las chicas en los huecos), sin salirse del contorno de la uña.
   */
  function packNail(i: number, shp: Shape, len: Length, out: GemSpot[]) {
    const d = nails[i].dims[len];
    const k = d.W / 1.1;
    const rand = mulberry32(500 + i * 31);
    const placed: Array<{ x: number; y: number; r: number }> = [];
    const gap = 0.007 * k;
    const hwAt = (y: number, r: number) => Math.min(halfWidth(shp, Math.max(0, y - r * 0.6), d), halfWidth(shp, Math.min(d.L, y + r * 0.6), d));
    for (const R of [0.13, 0.095, 0.068, 0.048]) {
      const r = R * k;
      const step = r * 0.95;
      const cands: Array<[number, number, number]> = [];
      for (let y = 0.03 + r; y < d.L; y += step * 0.87) {
        for (let x = -d.W / 2; x <= d.W / 2; x += step) cands.push([x + (rand() - 0.5) * step * 0.6, y + (rand() - 0.5) * step * 0.5, rand()]);
      }
      cands.sort((a, b) => a[2] - b[2]);
      for (const [x, y] of cands) {
        if (y - r < 0.02 || y + r * 0.85 > d.L) continue;
        const hw = hwAt(y, r);
        if (Math.abs(x) + r * 0.9 > hw) continue;
        let ok = true;
        for (const p of placed) {
          const m = r + p.r + gap;
          if ((p.x - x) ** 2 + (p.y - y) ** 2 < m * m) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        placed.push({ x, y, r });
      }
    }
    placed.forEach((p, n) => out.push({ key: `f${shp}${len}${i}:${n}`, nail: i, u: p.x / Math.max(1e-3, halfWidth(shp, p.y, d)), y: p.y, size: p.r }));
  }

  function gemLayout(extras: string[], shp: Shape, len: Length): GemSpot[] {
    const full = extras.includes("strass-full");
    const some = extras.includes("strass");
    if (!full && !some) return [];
    const cacheKey = `${full ? "f" : "s"}|${shp}|${len}`;
    const hit = layoutCache.get(cacheKey);
    if (hit) return hit;
    const out: GemSpot[] = [];
    nails.forEach((n, i) => {
      const { W, bed } = n.dims[len];
      if (full) packNail(i, shp, len, out);
      else if (i % 2 === 1) {
        // índice y anular: tres piedras en degradé desde la cutícula
        out.push({ key: `s${i}:0`, nail: i, u: 0, y: bed * 0.26, size: 0.17 * W });
        out.push({ key: `s${i}:1`, nail: i, u: 0, y: bed * 0.5, size: 0.125 * W });
        out.push({ key: `s${i}:2`, nail: i, u: 0, y: bed * 0.69, size: 0.095 * W });
      } else {
        out.push({ key: `s${i}:0`, nail: i, u: 0, y: bed * 0.3, size: 0.18 * W });
      }
    });
    layoutCache.set(cacheKey, out);
    return out;
  }

  function setDecal(n: NailState, i: number, sel: BuilderSelection, tipHex: string, instant: boolean) {
    const input = { index: i, shape: sel.shape, dims: n.dims[sel.length], extras: sel.extras, tipHex, kitty };
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

    // forma / largo → morph
    if (instant || sel.shape !== shape || sel.length !== length) {
      shape = sel.shape;
      length = sel.length;
      for (const n of nails) {
        n.from = cloneBuffers(n.cur);
        n.to = computeNail(n.geom.getIndex()!, n.ctx, shape, n.dims[length]);
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
    const cat = catEyeColor(base);
    const fin = finishParams(sel.finish, sel.extras);
    if (fin.catEye > 0) {
      // sobre bases oscuras el negro tiene que leerse negro (no metal gris)
      const hsl = { h: 0, s: 0, l: 0 };
      base.getHSL(hsl, THREE.SRGBColorSpace);
      if (hsl.l < 0.15) fin.envMapIntensity = Math.min(fin.envMapIntensity, 0.3);
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
      if (setDecal(n, i, sel, tipHex, instant)) decalChanged = true;
    });
    if (decalChanged && !instant) {
      decalStart = now;
      decalT = 0;
    }

    // strass: los que siguen en su lugar se quedan; los nuevos aparecen escalonados
    const layout = gemLayout(sel.extras, sel.shape, sel.length);
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
      [bowAcc, sel.extras.includes("3d")],
    ] as const) {
      const t = on ? 1 : 0;
      if (acc.target !== t) {
        acc.target = t;
        if (instant) acc.scale = t;
      }
    }
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
    try {
      await renderer.compileAsync(scene, camera);
    } catch {
      /* si no hay compilación paralela, se compila al dibujar */
    }
    if (disposed || lost) return;
    ready = true;
    renderer.render(scene, camera);
    lastRender = performance.now();
    needsRender = false;
    requestAnimationFrame(() => {
      if (disposed || lost) return;
      firstFrameDone = true;
      firstFrameCbs.forEach((cb) => cb());
      firstFrameCbs.clear();
      if (pending && (!onScreen || !pageVisible)) return;
      resume();
    });
  };
  void start().catch(() => {
    if (!disposed) options.onContextLost?.();
  });

  function buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    // estudio crema de baja frecuencia (sin rayas en el cromado) y un entorno de alto contraste para los strass
    const envRT = track(createStudioEnvironment(pmrem));
    const gemEnvRT = track(createGemEnvironment(pmrem));
    pmrem.dispose();
    // envMap por material (no scene.environment): así cada material conserva su envMapIntensity
    for (const m of envMaterials) m.envMap = envRT.texture;
    gemMat.envMap = gemEnvRT.texture;
  }

  return {
    update,
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
      gemShadows.dispose();
      for (const d of disposables) d.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      // un contexto ya perdido no se puede "perder" de nuevo (evita la advertencia de three)
      if (!lost) renderer.forceContextLoss();
    },
  };
}

/**
 * Color de la banda del cat eye: el brillo de las partículas teñido por el gel de la base
 * (más saturado y luminoso que la base, nunca plateado). En el negro, un humo champaña tenue.
 */
function catEyeColor(base: THREE.Color) {
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl, THREE.SRGBColorSpace);
  const c = new THREE.Color();
  if (hsl.s < 0.12) {
    if (hsl.l < 0.35) c.setHSL(0.08, 0.22, 0.5, THREE.SRGBColorSpace).multiplyScalar(0.75);
    else c.setHSL(0.11, 0.38, 0.78, THREE.SRGBColorSpace);
  } else {
    // en las bases claras la banda es un nácar casi blanco (si no, no se distingue del color)
    if (hsl.l > 0.6) return c.setHSL(hsl.h, Math.min(1, hsl.s * 0.8), 0.92, THREE.SRGBColorSpace).multiplyScalar(1.7);
    c.setHSL(hsl.h, Math.min(1, hsl.s * 1.25 + 0.14), THREE.MathUtils.clamp(hsl.l * 0.55 + 0.42, 0.48, 0.74), THREE.SRGBColorSpace);
  }
  return c.multiplyScalar(1.35);
}

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
