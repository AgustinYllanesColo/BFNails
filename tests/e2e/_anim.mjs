import { chromium } from "@playwright/test";
const url = process.argv[2] ?? "https://bf-nails.vercel.app/";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text().slice(0, 200)); });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const m = document.querySelector('[class*="animate-"]');
  const cs = m ? getComputedStyle(m) : null;
  const unit = document.querySelector("[data-unit]");
  const star = document.querySelector("[data-star]");
  const kitty = document.querySelector('img[alt^="BF Studio"]')?.parentElement;
  return {
    marqueeClass: m?.className, animationName: cs?.animationName, animationDuration: cs?.animationDuration, animationPlayState: cs?.animationPlayState,
    unitTransform: unit ? getComputedStyle(unit).transform : null,
    starTransform: star ? getComputedStyle(star).transform : null,
    kittyStyle: kitty?.getAttribute("style"),
    lenis: document.documentElement.className,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
});
console.log(JSON.stringify(info, null, 1));
// sample marquee position twice
const x1 = await page.evaluate(() => getComputedStyle(document.querySelector('[class*="animate-"]')).transform);
await page.waitForTimeout(1000);
const x2 = await page.evaluate(() => getComputedStyle(document.querySelector('[class*="animate-"]')).transform);
console.log("marquee moved:", x1 !== x2, x1, "->", x2);
console.log("errors:", errors.length); errors.slice(0, 6).forEach((e) => console.log("  ", e));
await browser.close();
