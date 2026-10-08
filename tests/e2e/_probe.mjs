import { chromium } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
await page.goto("http://localhost:3000/disena", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const chip = document.querySelector('button[aria-pressed="true"]');
  const cs = getComputedStyle(chip);
  const span = chip.querySelector("span");
  const scs = getComputedStyle(span);
  const btn = [...document.querySelectorAll("button")].find(b => b.textContent.includes("Agregar al carrito"));
  const bspan = btn.querySelector("span");
  return { chipColor: cs.color, chipBg: cs.backgroundColor, chipOpacity: cs.opacity, spanColor: scs.color, spanOpacity: scs.opacity, cls: chip.className, btnColor: getComputedStyle(btn).color, btnSpanOpacity: getComputedStyle(bspan).opacity, btnSpanStyle: bspan.getAttribute("style"), cream: getComputedStyle(document.documentElement).getPropertyValue("--color-cream") };
});
console.log(info);
await browser.close();
