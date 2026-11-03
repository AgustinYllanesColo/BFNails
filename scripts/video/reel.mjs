// Graba un reel vertical (1080x1920) recorriendo la web y lo arma con ffmpeg. Uso: pnpm video:reel [carpeta-salida]  (BASE=http://localhost:3000 para grabar local)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('@playwright/test')); } catch { ({ chromium } = require('/opt/node-tools/node_modules/playwright/index.js')); }

const BASE = process.env.BASE ?? 'https://bf-nails.vercel.app';
const OUT = path.resolve(process.argv[2] ?? 'out/reel');
const FRAMES = path.join(OUT, 'frames');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-gpu', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); // acelera mucho la vista 3D del builder
const ctx = await browser.newContext({
  viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  locale: 'es-AR', reducedMotion: 'no-preference',
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

// --- screencast ---
const frames = []; let n = 0; let seg = 0; let lastFrameAt = 0;
cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
  const file = path.join(FRAMES, `f${String(n++).padStart(5, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  frames.push({ file, t: metadata.timestamp, seg }); lastFrameAt = Date.now();
  try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
});
let recording = false;
const startRec = async () => { if (recording) return; recording = true; seg++; await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 86, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
};
// Los primeros cuadros de un segmento pueden salir a baja resolución: cutIn() descarta lo grabado hasta este instante dentro del segmento actual.
const cuts = [];
const cutIn = () => cuts.push({ seg, t: Date.now() / 1000, mode: 'in' });
// cutOut() descarta lo que se grabe en el segmento actual a partir de este instante (p. ej. una transición lenta).
const cutOut = () => cuts.push({ seg, t: Date.now() / 1000, mode: 'out' });
// El screencast entrega los cuadros con retraso (codifica JPEG grandes): antes de cortar esperamos a que se vacíe la cola.
async function drain(quietMs = 1200, maxMs = 15000) { const t0 = Date.now(); while (Date.now() - t0 < maxMs) { await new Promise((r) => setTimeout(r, 200)); if (Date.now() - lastFrameAt > quietMs) return; } }
const stopRec = async () => { if (!recording) return; await drain(); recording = false; await cdp.send('Page.stopScreencast'); };

// --- helpers ---
const sleep = (ms) => page.waitForTimeout(ms);
async function smoothScrollTo(y, ms) {
  await page.evaluate(([y, ms]) => new Promise((res) => {
    const y0 = window.scrollY, dy = y - y0, t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const step = (now) => { const p = Math.min(1, (now - t0) / ms); window.scrollTo(0, y0 + dy * ease(p)); if (p < 1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
  }), [y, ms]);
}
async function scrollToEl(selector, offset = 90, ms = 1200) {
  const y = await page.evaluate(([s, o]) => { const el = document.querySelector(s); if (!el) return null; return Math.max(0, el.getBoundingClientRect().top + window.scrollY - o); }, [selector, offset]);
  if (y != null) await smoothScrollTo(y, ms);
}
// Pie de texto con estilo de la marca (bordó sobre crema), aparece y desaparece con animación.
async function caption(text, ms = 2600) {
  await page.evaluate(([text, ms]) => {
    document.getElementById('__cap')?.remove();
    const el = document.createElement('div'); el.id = '__cap';
    el.textContent = text;
    Object.assign(el.style, {
      position: 'fixed', left: '50%', bottom: '92px', transform: 'translate(-50%, 24px) scale(.96)', opacity: '0',
      background: '#4a0e0e', color: '#fef7e7', padding: '14px 24px', borderRadius: '999px',
      font: '600 20px/1.2 var(--font-sans, "Space Grotesk", system-ui, sans-serif)', letterSpacing: '-0.01em', whiteSpace: 'nowrap',
      boxShadow: '0 12px 30px rgba(74,14,14,.28)', zIndex: '2147483647', pointerEvents: 'none',
      transition: 'opacity .45s cubic-bezier(.2,.7,.2,1), transform .45s cubic-bezier(.2,.7,.2,1)',
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translate(-50%, 0) scale(1)'; }));
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translate(-50%, 12px) scale(.98)'; setTimeout(() => el.remove(), 500); }, ms);
  }, [text, ms]);
}
async function tap(locator) {
  const el = locator.first();
  await el.scrollIntoViewIfNeeded();
  // Anillo de "toque" para que se note el click en el video
  const box = await el.boundingBox();
  if (box) await page.evaluate(([x, y]) => {
    const r = document.createElement('div');
    Object.assign(r.style, { position: 'fixed', left: `${x - 22}px`, top: `${y - 22}px`, width: '44px', height: '44px', borderRadius: '50%', border: '3px solid #4a0e0e', background: 'rgba(74,14,14,.18)', zIndex: '2147483647', pointerEvents: 'none', transform: 'scale(.5)', opacity: '1', transition: 'transform .45s ease-out, opacity .45s ease-out' });
    document.body.appendChild(r);
    requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transform = 'scale(1.4)'; r.style.opacity = '0'; }));
    setTimeout(() => r.remove(), 500);
  }, [box.x + box.width / 2, box.y + box.height / 2]);
  await sleep(180);
  await el.click();
}
async function go(p) { await stopRec(); await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 90000 }); await sleep(250); }
async function endCard() {
  await page.evaluate(() => new Promise((res) => {
    const o = document.createElement('div');
    Object.assign(o.style, { position: 'fixed', inset: '0', background: '#fef7e7', zIndex: '2147483646', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px', opacity: '0', transition: 'opacity .6s ease' });
    const img = document.createElement('img'); img.src = '/brand/logo-nails.webp'; Object.assign(img.style, { width: '260px', height: 'auto', transform: 'scale(.9)', transition: 'transform .7s cubic-bezier(.2,.7,.2,1)' });
    const h = document.createElement('div'); h.textContent = 'Uñas y maquillaje'; Object.assign(h.style, { font: '700 34px/1.1 var(--font-display, "Shrikhand", Georgia, serif)', color: '#4a0e0e', marginTop: '6px' });
    const u = document.createElement('div'); u.textContent = 'bf-nails.vercel.app'; Object.assign(u.style, { font: '600 22px/1.2 var(--font-sans, "Space Grotesk", system-ui, sans-serif)', color: '#fef7e7', background: '#4a0e0e', padding: '14px 26px', borderRadius: '999px', marginTop: '10px' });
    const s = document.createElement('div'); s.textContent = 'Envíos a todo el país · kit de colocación incluido'; Object.assign(s.style, { font: '500 15px/1.3 var(--font-sans, "Space Grotesk", system-ui, sans-serif)', color: '#6b1a1a', opacity: '.85', marginTop: '4px' });
    o.append(img, h, u, s); document.body.appendChild(o);
    requestAnimationFrame(() => requestAnimationFrame(() => { o.style.opacity = '1'; img.style.transform = 'scale(1)'; res(); }));
  }));
}

// --- storyboard ---
await go('/');
await startRec();
await sleep(3200);                                        // intro del hero
await caption('Nuestra nueva web ✨', 2400);
await sleep(400);
const yDoors = await page.evaluate(() => { const el = [...document.querySelectorAll('h2')].find(h => /^maquillaje$/i.test(h.textContent.trim())); return el ? el.getBoundingClientRect().top + window.scrollY - 160 : 900; });
await smoothScrollTo(yDoors, 1500);
await sleep(900);
await smoothScrollTo(yDoors + 1500, 2600);
await sleep(500);

await go('/maquillaje');
await startRec();
await sleep(500);
await caption('Maquillaje nuevo 💄', 2400);
await smoothScrollTo(750, 2000);
await sleep(300);
await smoothScrollTo(1800, 2200);
await sleep(400);

await go('/catalogo');
await startRec();
await sleep(500);
await caption('Uñas press-on, a tu talle 💅', 2600);
await scrollToEl('a[href^="/catalogo/"]', 110, 1400);
await sleep(300);
await page.evaluate(() => window.scrollY).then(async (y) => smoothScrollTo(y + 1000, 2200));
await sleep(300);
const card = page.locator('main a[href^="/catalogo/"]').nth(2);
const href = await card.getAttribute('href');
await tap(card);
await sleep(350);
cutOut();
await stopRec();
// La transición entre páginas (la tarjeta se funde en el detalle) rinde muy lento sin GPU real y queda borrosa:
// cargamos el detalle directo y seguimos desde ahí con un corte seco.
await go(href);
await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 8000 }).catch(() => {});
await sleep(600);
await startRec();
// Sin GPU real, la foto grande se rasteriza primero a baja resolución: damos tiempo y descartamos esos cuadros.
await sleep(2500);
await page.evaluate(() => window.scrollBy(0, 1));
await sleep(1500);
cutIn();
await sleep(200);
await smoothScrollTo(520, 1300);
await sleep(400);
const addBtn = page.getByRole('button', { name: /agregar al carrito/i });
if (await addBtn.count()) { await tap(addBtn); await sleep(1300); }

await go('/disena');
await page.getByText(/deslizá para girar/i).first().waitFor({ timeout: 30000 }).catch(() => {});
await sleep(400);
await startRec();
await sleep(400);
await caption('Diseñá tu set y mirá el precio al instante', 3000);
await sleep(300);
for (const [name, wait] of [[/^Coffin/, 700], [/^Largo/, 700], [/^Bordó/, 900], [/^Francesita/, 900], [/^Strass/, 900]]) {
  const b = page.getByRole('button', { name });
  if (await b.count()) { await tap(b); await sleep(wait); }
}
await smoothScrollTo(0, 1200);
await sleep(900);
await caption('Lo pinto a mano, a tu medida', 2400);
await sleep(2700);
await endCard();
await sleep(3600);
await stopRec();
await sleep(300);
await ctx.close(); await browser.close();

// --- armado con ffmpeg (concat con duraciones reales) ---
frames.sort((a, b) => a.t - b.t);
const kept = frames.filter((f) => !cuts.some((c) => c.seg === f.seg && (c.mode === 'in' ? f.t < c.t : f.t > c.t)));
frames.length = 0; frames.push(...kept);
const lines = [];
for (let i = 0; i < frames.length; i++) {
  // Entre segmentos (navegación) no suma tiempo; dentro del segmento se respeta la duración real (tope 3 s por si el compositor no emite cuadros)
  const next = frames[i + 1];
  const d = !next ? 0.1 : next.seg !== frames[i].seg ? 0.04 : Math.min(3, Math.max(0.001, next.t - frames[i].t));
  lines.push(`file '${frames[i].file}'`, `duration ${d.toFixed(4)}`);
}
lines.push(`file '${frames[frames.length - 1].file}'`);
const list = path.join(OUT, 'frames.txt');
fs.writeFileSync(list, lines.join('\n'));
const mp4 = path.join(OUT, 'bf-nails-reel.mp4');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-vf', 'scale=1080:1920:flags=lanczos,format=yuv420p', '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
console.log('frames', frames.length, '->', mp4);
