import { chromium } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://localhost:3000/disena", { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const svg = document.querySelector("aside svg");
  const rects = [...svg.querySelectorAll("rect")].map((r) => ({ x: r.getAttribute("x"), y: r.getAttribute("y"), w: r.getAttribute("width"), h: r.getAttribute("height"), rx: r.getAttribute("rx"), fill: r.getAttribute("fill"), cfill: getComputedStyle(r).fill, bbox: (() => { try { const b = r.getBBox(); return [b.x, b.y, b.width, b.height].map(Math.round); } catch { return null; } })() }));
  const grad = svg.querySelector("#finger");
  return { rects: rects.slice(0, 4), grad: grad ? grad.outerHTML.slice(0, 300) : null, ids: [...svg.querySelectorAll("[id]")].map((e) => e.id) };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
