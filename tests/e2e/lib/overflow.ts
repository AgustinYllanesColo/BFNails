import { expect, type Page } from "@playwright/test";

type Offender = { selector: string; right: number; width: number };

/**
 * Overflow horizontal estricto (PLAN §0.5, W1-F1.8). El `overflow-x: clip` de `html`/`body` es red de seguridad en
 * producción pero deja ciego a `scrollWidth`; este helper lo anula, mide y lista los culpables.
 *
 * 1. Fuerza `html, body { overflow-x: visible }`.
 * 2. `innerWidth` debe ser el ancho del viewport y `scrollWidth` no puede pasarlo.
 * 3. Lista los elementos cuyo borde derecho pasa el viewport (+0,5 px) y que no quedan recortados por un ancestro
 *    con overflow distinto de `visible` (un carril con scroll propio o una máscara `overflow-hidden` no cuentan).
 * 4. Quita el estilo.
 */
export async function expectNoOverflowStrict(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("expectNoOverflowStrict: la página no tiene viewport fijo");
  const vw = viewport.width;

  const tag = await page.addStyleTag({ content: "html,body{overflow-x:visible!important}" });
  try {
    const result = await page.evaluate((vw) => {
      const describe = (el: Element): string => {
        const parts: string[] = [];
        let node: Element | null = el;
        for (let depth = 0; node && depth < 4 && node !== document.body; depth++) {
          let part = node.tagName.toLowerCase();
          if (node.id) {
            parts.unshift(`${part}#${node.id}`);
            break;
          }
          const cls = (node.getAttribute("class") ?? "")
            .split(/\s+/)
            .filter((c) => c && !c.includes(":") && !c.includes("[") && !c.includes("/"))
            .slice(0, 3);
          if (cls.length) part += "." + cls.join(".");
          const parent: Element | null = node.parentElement;
          if (parent) {
            const same = [...parent.children].filter((c) => c.tagName === node!.tagName);
            if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
          }
          parts.unshift(part);
          node = parent;
        }
        return parts.join(" > ");
      };

      const clippedByAncestor = (el: Element): boolean => {
        for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
          if (p === document.body) break;
          const cs = getComputedStyle(p);
          // overflow-y ≠ visible ya fuerza overflow-x a auto, así que basta con mirar el eje X
          if (cs.overflowX !== "visible") return true;
          if (cs.position === "fixed") break;
        }
        return false;
      };

      const offenders: { selector: string; right: number; width: number }[] = [];
      for (const el of document.body.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right <= vw + 0.5) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "contents") continue;
        if (clippedByAncestor(el)) continue;
        offenders.push({
          selector: describe(el),
          right: Math.round(r.right * 10) / 10,
          width: Math.round(r.width),
        });
      }
      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        offenders: offenders.slice(0, 12),
        total: offenders.length,
      };
    }, vw);

    const list = (result.offenders as Offender[]).map(
      (o) => `  ${o.selector} (right ${o.right}px, ancho ${o.width}px)`,
    );
    const detail = list.length
      ? `\nDesbordan ${result.total} elemento(s):\n${list.join("\n")}`
      : "";
    expect(result.innerWidth, "innerWidth = ancho del viewport").toBe(vw);
    expect(result.scrollWidth, `scrollWidth ≤ ${vw}px${detail}`).toBeLessThanOrEqual(vw);
    expect(result.total, `elementos fuera del viewport${detail}`).toBe(0);
  } finally {
    await tag.evaluate((node) => (node as Element).remove());
  }
}
