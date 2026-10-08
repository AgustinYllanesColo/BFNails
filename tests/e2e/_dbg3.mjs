import { chromium } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto("http://localhost:3000/disena", { waitUntil: "networkidle" });
const info = await page.evaluate(() => {
  const svg = document.querySelector("aside svg");
  const r = svg.getBoundingClientRect();
  const sx = r.width / 800, sy = r.height / 600;
  const pt = (vx, vy) => { const el = document.elementFromPoint(r.left + vx * sx, r.top + vy * sy); return el ? el.tagName + " " + (el.getAttribute("fill") || "") : null; };
  const rect = svg.querySelectorAll("rect")[1];
  const before = pt(112, 450);
  rect.setAttribute("fill", "#ff0000");
  const afterSolid = pt(112, 450);
  rect.setAttribute("fill", "url(#finger)");
  const g = svg.querySelector("#finger");
  g.setAttribute("gradientUnits", "userSpaceOnUse"); g.setAttribute("x1", "0"); g.setAttribute("x2", "100"); 
  const afterUnits = pt(112, 450);
  // check the clipPath: is the rect inside a clipPath by any chance?
  const ancestors = []; let e = rect; while (e && e !== svg) { ancestors.push(e.tagName + (e.id ? "#" + e.id : "")); e = e.parentElement; }
  return { before, afterSolid, afterUnits, ancestors };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
