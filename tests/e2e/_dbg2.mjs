import { chromium } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://localhost:3000/disena", { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const svg = document.querySelector("aside svg");
  const r = svg.getBoundingClientRect();
  const sx = r.width / 800, sy = r.height / 600;
  const pt = (vx, vy) => { const el = document.elementFromPoint(r.left + vx * sx, r.top + vy * sy); return el ? el.tagName + (el.getAttribute("fill") ? " fill=" + el.getAttribute("fill") : "") + (el.getAttribute("d") ? " d=" + el.getAttribute("d").slice(0, 20) : "") : null; };
  const rect = svg.querySelectorAll("rect")[1];
  return { at_finger: pt(112, 450), at_finger2: pt(112, 520), at_nail: pt(112, 300), rectOpacity: getComputedStyle(rect).opacity, rectVisibility: getComputedStyle(rect).visibility, rectDisplay: getComputedStyle(rect).display, parent: rect.parentElement.getAttribute("transform"), prev: rect.previousElementSibling?.tagName, next: rect.nextElementSibling?.tagName };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
