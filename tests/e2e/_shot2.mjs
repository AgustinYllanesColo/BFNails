import { chromium } from "@playwright/test";
const [,, url = "http://localhost:3000/", name = "home", mode = "both"] = process.argv;
const out = "/tmp/claude-0/-home-user-BFNails/140ab651-3cc9-5ac3-84c6-94d81aa9da2e/scratchpad/shots";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const shots = [];
if (mode !== "mobile") shots.push({ w: 1440, h: 900, tag: "desktop" });
if (mode !== "desktop") shots.push({ w: 390, h: 844, tag: "mobile", mobile: true });
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1, isMobile: !!s.mobile, hasTouch: !!s.mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 160)); });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.mouse.move(s.w * 0.6, s.h * 0.4);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${out}/${name}-${s.tag}-fold.png` });
  // scroll slowly to run pinned/scrub animations, then capture full page
  await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 120) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}-${s.tag}.png`, fullPage: true });
  console.log(`${name}-${s.tag}: errors ${errors.length}`); errors.slice(0, 5).forEach(e => console.log("  ", e));
  await ctx.close();
}
await browser.close();
