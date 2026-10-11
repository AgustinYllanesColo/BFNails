// Captura para auditoría: viewports en varias posiciones de scroll, cuadros de la intro del hero e interacciones clave.
import { chromium } from "@playwright/test";
import fs from "node:fs";
const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = process.argv[3];
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const manifest = [];
const DEVICES = [
  { tag: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { tag: "desktop", viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];
async function shot(page, name, desc) {
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file });
  manifest.push({ file, desc });
}
async function scrollFrames(page, prefix, device, maxFrames = 14) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = device.viewport.height;
  let i = 0;
  for (let y = 0; y < h && i < maxFrames; y += Math.round(vh * 0.85), i++) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
    await page.waitForTimeout(900);
    await shot(page, `${prefix}-scroll${String(i).padStart(2, "0")}`, `${prefix} viewport at scrollY=${y}/${h}`);
  }
}
for (const d of DEVICES) {
  const ctx = await browser.newContext({ viewport: d.viewport, isMobile: !!d.isMobile, hasTouch: !!d.hasTouch, deviceScaleFactor: d.deviceScaleFactor });
  const page = await ctx.newPage();
  // Hero intro frames
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  for (const t of [150, 500, 900, 1400, 2200, 3500, 5000]) {
    await page.waitForTimeout(t - (manifest.filter(m => m.file.includes(`home-${d.tag}-intro`)).length ? [150, 500, 900, 1400, 2200, 3500, 5000][manifest.filter(m => m.file.includes(`home-${d.tag}-intro`)).length - 1] : 0));
    await shot(page, `home-${d.tag}-intro-${t}ms`, `home ${d.tag} hero ${t}ms after load (intro animation frame)`);
  }
  await page.waitForLoadState("networkidle");
  await scrollFrames(page, `home-${d.tag}`, d, 16);
  for (const [path, name] of [["/catalogo", "catalogo"], ["/catalogo/kitty-leopard", "detalle"], ["/disena", "disena"], ["/talles", "talles"], ["/faq", "faq"], ["/terminos", "terminos"]]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await scrollFrames(page, `${name}-${d.tag}`, d, name === "terminos" ? 2 : 6);
  }
  // Builder with selections
  await page.goto(`${BASE}/disena`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Coffin/ }).click();
  await page.getByRole("button", { name: /^Largo/ }).click();
  await page.getByRole("button", { name: /^Bordó/ }).first().click();
  await page.getByRole("button", { name: /^Francesita de color/ }).click();
  await page.getByRole("button", { name: /Strass \(hasta/ }).click();
  await page.waitForTimeout(1000);
  const aside = page.locator("aside").first();
  await aside.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await shot(page, `disena-${d.tag}-selected`, `builder ${d.tag} after choosing coffin/largo/bordó/francesita de color/strass`);
  // Cart with two items
  await page.goto(`${BASE}/catalogo/cherry-red`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.waitForTimeout(400);
  await shot(page, `detalle-${d.tag}-added`, `product detail ${d.tag} right after 'Agregar al carrito' (feedback state)`);
  await page.goto(`${BASE}/catalogo/kitty-leopard`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.goto(`${BASE}/carrito`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await shot(page, `carrito-${d.tag}-printing`, `cart ${d.tag} while receipt prints (400ms)`);
  await page.waitForTimeout(2500);
  await scrollFrames(page, `carrito-${d.tag}`, d, 4);
  await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await scrollFrames(page, `checkout-${d.tag}`, d, 6);
  // Mobile menu
  if (d.isMobile) {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.waitForTimeout(700);
    await shot(page, `nav-mobile-open`, "mobile nav menu open");
  }
  // Order page (local dev only, needs orders enabled)
  try {
    await page.goto(`${BASE}/checkout`, { waitUntil: "networkidle" });
    await page.fill("#name", "Mica Test"); await page.fill("#whatsapp", "11 5555 1234");
    await page.getByRole("button", { name: /^Transferencia/ }).click();
    await page.getByRole("button", { name: /Confirmar pedido|Enviar pedido/ }).click();
    await page.waitForURL(/\/pedido\//, { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2600);
    await scrollFrames(page, `pedido-${d.tag}`, d, 4);
  } catch (e) { manifest.push({ file: null, desc: `order page ${d.tag} not captured: ${e.message.slice(0, 80)}` }); }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1));
console.log("captured", manifest.filter(m => m.file).length, "frames");
