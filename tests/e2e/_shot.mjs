import { chromium } from "@playwright/test";
const [,, url = "http://localhost:3000/", name = "home", mode = "both"] = process.argv;
const out = "/tmp/claude-0/-home-user-BFNails/140ab651-3cc9-5ac3-84c6-94d81aa9da2e/scratchpad/shots";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const shots = [];
if (mode !== "mobile") shots.push({ w: 1440, h: 900, tag: "desktop" });
if (mode !== "desktop") shots.push({ w: 390, h: 844, tag: "mobile", mobile: true });
for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1, isMobile: !!s.mobile, hasTouch: !!s.mobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  // scroll to trigger reveals
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${name}-${s.tag}.png`, fullPage: true });
  console.log(`${name}-${s.tag}: ${s.w}x${s.h}, errors: ${errors.length}`); errors.slice(0, 5).forEach(e => console.log("  ", e));
  await ctx.close();
}
await browser.close();
