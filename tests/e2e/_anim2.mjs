import { chromium } from "@playwright/test";
const url = process.argv[2] ?? "https://bf-nails.vercel.app/";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const m = document.querySelector('div[style*="--speed"]');
  const cs = getComputedStyle(m);
  return { cls: m.className, name: cs.animationName, dur: cs.animationDuration, state: cs.animationPlayState, t: cs.transform, inlineStyle: m.getAttribute("style") };
});
console.log(info);
const t1 = await page.evaluate(() => getComputedStyle(document.querySelector('div[style*="--speed"]')).transform);
await page.waitForTimeout(800);
const t2 = await page.evaluate(() => getComputedStyle(document.querySelector('div[style*="--speed"]')).transform);
console.log("moved:", t1 !== t2, t1, "->", t2);
// Check CSS rule exists
const hasKeyframes = await page.evaluate(() => {
  let found = [];
  for (const sheet of document.styleSheets) { try { for (const r of sheet.cssRules) { if (r instanceof CSSKeyframesRule) found.push(r.name); if (r.cssText.includes("animate-\\[marquee")) found.push("RULE:" + r.cssText.slice(0, 160)); } } catch {} }
  return found;
});
console.log(hasKeyframes);
await browser.close();
