import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const out = process.argv[2];
const pages = ["/", "/catalogo", "/catalogo/" , "/disena", "/dijes", "/medidas", "/faq", "/carrito", "/checkout", "/contacto"];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
// find a design slug
let slug;
{
  const p = await b.newPage(); await p.goto("http://localhost:3002/catalogo", { waitUntil: "networkidle" });
  slug = await p.evaluate(() => [...document.querySelectorAll('a[href^="/catalogo/"]')].map(a => a.getAttribute("href"))[0]);
  await p.close();
}
const list = pages.map(x => x === "/catalogo/" ? slug : x);
const report = [];
for (const vp of [{ w: 390, h: 844, tag: "m", mobile: true }, { w: 1440, h: 900, tag: "d" }]) {
  const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  for (const path of list) {
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", e => errs.push(e.message)); p.on("console", m => m.type() === "error" && errs.push(m.text().slice(0, 140)));
    await p.goto("http://localhost:3002" + path, { waitUntil: "networkidle" });
    await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); });
    await p.waitForTimeout(900);
    const name = (path === "/" ? "home" : path.replaceAll("/", "_").slice(1)) + "-" + vp.tag;
    await p.screenshot({ path: `${out}/${name}.png`, fullPage: true });
    const info = await p.evaluate(() => {
      const sw = document.documentElement.scrollWidth;
      const small = [...document.querySelectorAll("a,button,input,select,[role=button]")].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40) && getComputedStyle(e).visibility !== "hidden"; }).map(e => `${e.tagName}:${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
      const imgs = [...document.images].filter(i => !i.alt && i.getAttribute("aria-hidden") !== "true" && !i.closest("[aria-hidden=true]")).length;
      const h = [...document.querySelectorAll("h1,h2,h3")].map(x => x.tagName + ":" + x.textContent.trim().slice(0, 30));
      return { sw, small: small.slice(0, 12), smallCount: small.length, imgsNoAlt: imgs, h1: h.filter(x => x.startsWith("H1")).length, heads: h.slice(0, 14) };
    });
    let axe = [];
    if (vp.tag === "m") {
      const r = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa"]).analyze();
      axe = r.violations.map(v => `${v.id}(${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" | ")}`);
    }
    report.push({ name, errs: errs.slice(0, 4), ...info, axe });
    await p.close();
  }
  await ctx.close();
}
console.log(JSON.stringify(report, null, 1));
await b.close();
