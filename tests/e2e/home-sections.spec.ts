import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./helpers";
import { expectNoOverflowStrict } from "./lib/overflow";

/**
 * Secciones de la home (PLAN §4 W2-B): cintas, Destacados, Cómo funciona (ticket), Teaser del armador, Envíos (línea),
 * Preguntas y Cierre. Corre contra el dev server (PW_BASE_URL) en los proyectos mobile y desktop.
 */

const IDENTITY = new Set(["none", "matrix(1, 0, 0, 1, 0, 0)"]);

/** Scroll en pasos cortos (cada ScrollTrigger con scrub alcanza a seguirlo). */
async function scrollToY(page: Page, y: number, { step = 140, pause = 45 } = {}) {
  await page.evaluate(
    async ({ y, step, pause }) => {
      let cur = window.scrollY;
      while (Math.abs(y - cur) > step) {
        cur += Math.sign(y - cur) * step;
        window.scrollTo(0, cur);
        await new Promise((r) => setTimeout(r, pause));
      }
      window.scrollTo(0, y);
    },
    { y, step, pause },
  );
}

async function scrollThrough(page: Page, { step = 450, pause = 90 } = {}) {
  for (let i = 0; i < 80; i++) {
    const done = await page.evaluate((step) => {
      window.scrollBy(0, step);
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    }, step);
    await page.waitForTimeout(pause);
    if (done) break;
  }
}

const docTop = (page: Page, selector: string) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) throw new Error(`no existe ${s}`);
    return el.getBoundingClientRect().top + window.scrollY;
  }, selector);

/** Scrollea por "Cómo funciona" hasta que cae el sello; devuelve el estado de ese momento. */
async function scrollUntilStamped(page: Page) {
  const start = (await docTop(page, "#como-funciona")) - 900;
  await scrollToY(page, Math.max(0, start));
  for (let i = 0; i < 120; i++) {
    const stamped = await page
      .locator('#como-funciona [data-stamp="play"]')
      .count()
      .then((n) => n > 0);
    if (stamped) break;
    await page.evaluate(() => window.scrollBy(0, 60));
    await page.waitForTimeout(70);
  }
  await expect(page.locator('#como-funciona [data-stamp="play"]')).toHaveCount(1);
  // que termine la caída (450 ms) antes de medir
  await page.waitForTimeout(600);
}

/** Rects de cada línea de texto del ticket (sin el sello) y el rect del sello. */
const ticketGeometry = (page: Page) =>
  page.evaluate(() => {
    const sec = document.getElementById("como-funciona")!;
    const stampWrap = sec.querySelector<HTMLElement>("[data-stamp]")!;
    const stamp = stampWrap.firstElementChild!.getBoundingClientRect();
    const paper = sec.querySelector<HTMLElement>("[data-paper]")!;
    const texts: Array<{ text: string; r: { top: number; bottom: number; left: number; right: number } }> =
      [];
    const walker = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent?.trim() || stampWrap.contains(n)) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects())
        texts.push({ text: n.textContent.trim().slice(0, 24), r: { top: r.top, bottom: r.bottom, left: r.left, right: r.right } });
    }
    const rows = [...sec.querySelectorAll<HTMLElement>("[data-row]")].map((row) => {
      const ink = row.querySelector<HTMLElement>("[data-ink]")!;
      const r = row.getBoundingClientRect();
      return {
        opacity: getComputedStyle(row).opacity,
        inkOpacity: getComputedStyle(ink).opacity,
        clip: getComputedStyle(ink).clipPath,
        top: r.top,
        bottom: r.bottom,
      };
    });
    return {
      stamp: { top: stamp.top, bottom: stamp.bottom, left: stamp.left, right: stamp.right, width: stamp.width },
      stampOpacity: getComputedStyle(stampWrap.firstElementChild!).opacity,
      texts,
      rows,
      vh: window.innerHeight,
      pinned: sec.dataset.pin === "on",
    };
  });

test.describe("home · sin desborde (estricto)", () => {
  for (const width of [360, 375, 390]) {
    test(`${width} px`, async ({ page, isMobile }) => {
      test.skip(!isMobile, "solo celulares");
      const errors = collectErrors(page);
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/", { waitUntil: "networkidle" });
      await scrollThrough(page, { step: 600, pause: 70 });
      await expectNoOverflowStrict(page);
      expect(errors).toEqual([]);
    });
  }
});

test.describe("home · orden y titulares", () => {
  test("secciones en orden, Cierre antes del footer y ningún kicker sobre un h2", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const order = await page.evaluate(() =>
      ["destacados", "como-funciona", "armador", "envios", "preguntas", "cierre"].map((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : -1;
      }),
    );
    for (const y of order) expect(y).toBeGreaterThan(0);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    const footerTop = await docTop(page, "footer");
    expect(order[order.length - 1]).toBeLessThan(footerTop);

    // Ningún rótulo en mayúsculas espaciadas inmediatamente antes de un h2 de la home
    const kickers = await page.evaluate(() =>
      [...document.querySelectorAll("main h2")].flatMap((h2) => {
        const prev = h2.previousElementSibling as HTMLElement | null;
        if (!prev) return [];
        const cs = getComputedStyle(prev);
        const spaced = parseFloat(cs.letterSpacing) >= 1;
        return cs.textTransform === "uppercase" && spaced ? [`${prev.textContent} → ${h2.textContent}`] : [];
      }),
    );
    expect(kickers).toEqual([]);
  });

  test("resize 390 → 375 → 390: la pincelada de “vuelan” igual se pinta entera", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "solo celulares");
    await page.goto("/", { waitUntil: "networkidle" });
    for (const width of [375, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.waitForTimeout(400);
    }
    const brush = page.locator('#destacados [data-brush="scrub"]');
    const y = await brush.evaluate((el) => el.closest("h2")!.getBoundingClientRect().top + window.scrollY);
    await scrollToY(page, y - 844 * 0.35);
    await page.waitForTimeout(1500);
    const offset = await brush
      .locator("[data-stroke]")
      .evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset));
    expect(offset).toBeLessThan(0.01);
  });
});

test.describe("Cómo funciona · el ticket", () => {
  test("al terminar de imprimir: 4 filas a la vista, sello visible y sin tapar texto", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await scrollUntilStamped(page);
    const g = await ticketGeometry(page);
    expect(g.rows).toHaveLength(4);
    for (const row of g.rows) {
      expect(row.opacity).toBe("1");
      expect(row.inkOpacity).toBe("1");
      expect(row.clip).toBe("none");
    }
    expect(Number(g.stampOpacity)).toBeGreaterThan(0.85);
    expect(g.stamp.width).toBeGreaterThan(100);
    const overlaps = g.texts.filter(
      ({ r }) =>
        r.left < g.stamp.right && r.right > g.stamp.left && r.top < g.stamp.bottom && r.bottom > g.stamp.top,
    );
    expect(overlaps.map((o) => o.text)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("móvil: la sección mide ≤ 1100 px y no se pinea", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo celulares");
    await page.goto("/", { waitUntil: "networkidle" });
    const r = await page.evaluate(() => {
      const sec = document.getElementById("como-funciona")!;
      return { h: sec.offsetHeight, pinned: sec.dataset.pin === "on" };
    });
    expect(r.pinned).toBe(false);
    expect(r.h).toBeLessThanOrEqual(1100);
  });

  for (const vp of [
    { width: 1440, height: 900, pin: true },
    { width: 1280, height: 720, pin: false },
  ]) {
    test(`${vp.width}×${vp.height}: ${vp.pin ? "con" : "sin"} pin y el sello entra en pantalla`, async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "solo desktop");
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "networkidle" });
      await scrollUntilStamped(page);
      const g = await ticketGeometry(page);
      expect(g.pinned).toBe(vp.pin);
      expect(g.stamp.bottom).toBeLessThan(g.vh);
      expect(g.stamp.top).toBeGreaterThan(0);
    });
  }

  test.describe("con reduced-motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("sin pin ni recorte: ticket impreso y sellado, las 4 filas entran juntas en pantalla", async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "solo desktop");
      await page.goto("/", { waitUntil: "networkidle" });
      const pinned = await page.evaluate(() => document.getElementById("como-funciona")!.dataset.pin === "on");
      expect(pinned).toBe(false);
      // centrar el bloque de pasos en la pantalla
      const mid = await page.evaluate(() => {
        const rows = [...document.querySelectorAll<HTMLElement>("#como-funciona [data-row]")];
        const top = rows[0].getBoundingClientRect().top + window.scrollY;
        const bottom = rows[rows.length - 1].getBoundingClientRect().bottom + window.scrollY;
        return (top + bottom) / 2;
      });
      await scrollToY(page, mid - 450);
      await page.waitForTimeout(900);
      const g = await ticketGeometry(page);
      for (const row of g.rows) {
        expect(row.top).toBeGreaterThanOrEqual(0);
        expect(row.bottom).toBeLessThanOrEqual(g.vh);
        expect(row.inkOpacity).toBe("1");
      }
      await expect(page.locator('#como-funciona [data-stamp="rest"]')).toBeVisible();
    });
  });
});

test.describe("Teaser del armador", () => {
  test("autoplay solo a la vista: cambia mirando y 0 mutaciones fuera de vista en 3 s", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const card = await docTop(page, "[data-teaser-preview]");
    const vh = page.viewportSize()!.height;
    // la tarjeta terminó de levantarse (top < 55 %) y queda en pantalla
    await scrollToY(page, card - vh * 0.3);
    await page.waitForTimeout(400);

    const watch = () =>
      page.evaluate(() => {
        const host = document.querySelector("[data-teaser-preview]")!;
        const w = window as unknown as { __mut: number; __mo?: MutationObserver };
        w.__mo?.disconnect();
        w.__mut = 0;
        w.__mo = new MutationObserver((list) => {
          w.__mut += list.length;
        });
        w.__mo.observe(host, { subtree: true, childList: true, attributes: true, characterData: true });
      });
    const count = () => page.evaluate(() => (window as unknown as { __mut: number }).__mut);

    // a la vista: en ~4 s la demo cambia de set al menos una vez
    await watch();
    await page.waitForTimeout(4200);
    expect(await count(), "la demo avanza mirándola").toBeGreaterThan(0);

    // fuera de vista: ni una mutación
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    await watch();
    await page.waitForTimeout(3000);
    expect(await count(), "mutaciones de NailPreview fuera de vista").toBe(0);
  });

  test("pausa: aria-label fijo y aria-pressed; tocar una forma detiene la demo e invita al armador", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const pause = page.getByRole("button", { name: "Pausar demo" });
    await pause.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(pause).toHaveAttribute("aria-pressed", "false");
    await pause.click();
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Pausar demo" })).toHaveCount(1);

    const shapes = page.getByRole("radiogroup", { name: "Forma" });
    await shapes.getByRole("radio", { name: "Stiletto" }).click();
    await expect(shapes.getByRole("radio", { name: "Stiletto" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("link", { name: /Tu turno: seguí en el armador/ })).toBeVisible();
    await expect(page.getByRole("list", { name: "Tu selección" })).toContainText("Stiletto");
  });
});

test.describe("Envíos · la línea", () => {
  test("al recorrerla: tramos completos, estaciones encendidas y el paquete en el final", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const top = await docTop(page, "#envios");
    await scrollToY(page, top - 200);
    const bottom = await page.evaluate(() => {
      const el = document.getElementById("envios")!;
      return el.getBoundingClientRect().bottom + window.scrollY;
    });
    await scrollToY(page, bottom - 200, { step: 90, pause: 50 });
    await page.waitForTimeout(1400);
    const s = await page.evaluate(() => {
      const sec = document.getElementById("envios")!;
      const segs = [...sec.querySelectorAll<HTMLElement>("[data-seg]")].map((el) => ({
        transform: getComputedStyle(el).transform,
        clip: getComputedStyle(el).clipPath,
        dashed: !!el.dataset.dashed,
      }));
      const nodes = [...sec.querySelectorAll<HTMLElement>("[data-node], [data-end]")].map((n) => n.dataset.on ?? "ssr");
      const t = sec.querySelector<HTMLElement>("[data-traveler]")!.getBoundingClientRect();
      const end = sec.querySelector<HTMLElement>("[data-end]")!.getBoundingClientRect();
      return {
        segs,
        nodes,
        gap: Math.hypot(t.left + t.width / 2 - (end.left + end.width / 2), t.top + t.height / 2 - (end.top + end.height / 2)),
      };
    });
    expect(s.segs).toHaveLength(3);
    for (const seg of s.segs) {
      // recorte en cero por todos lados ("inset(0px 0px 0%)", "none"…)
      if (seg.dashed) expect(seg.clip).toMatch(/^(none|inset\((\s*0(px|%)?)+\))$/);
      else expect(IDENTITY.has(seg.transform), seg.transform).toBe(true);
    }
    for (const n of s.nodes) expect(["1", "ssr"]).toContain(n);
    expect(s.gap, "el paquete llegó a “todo el país”").toBeLessThan(30);
  });
});

test.describe("Preguntas", () => {
  test("la pregunta 2 abre su región; cerradas quedan inert", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const q = page.locator("#faq-q-1");
    await q.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(page.locator("#faq-a-1")).toHaveAttribute("inert", "");
    await q.click();
    await expect(q).toHaveAttribute("aria-expanded", "true");
    await page.waitForTimeout(400);
    const h = await page.locator("#faq-a-1").evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeGreaterThan(0);
    await expect(page.locator("#faq-a-1")).not.toHaveAttribute("inert", "");
    await expect(page.locator("#faq-a-0")).toHaveAttribute("inert", "");
    const font = await q.locator("span").first().evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).toMatch(/Figtree/i);
  });

  test("móvil: un solo “Escribile a Bren” entre las preguntas y el cierre", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo celulares");
    await page.goto("/", { waitUntil: "networkidle" });
    const visible = await page
      .locator("#preguntas a, #cierre a")
      .filter({ hasText: "Escribile a Bren" })
      .evaluateAll((els) => els.filter((el) => (el as HTMLElement).offsetParent !== null).length);
    expect(visible).toBe(1);
  });
});

test("con scrollY 3000 hay como mucho 6 animaciones corriendo", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await scrollToY(page, 3000);
  await page.waitForTimeout(1500);
  const running = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === "running")
      .map((a) => {
        const t = (a.effect as KeyframeEffect | null)?.target as HTMLElement | null;
        const name = (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? "waapi";
        return `${name} @ ${t?.tagName.toLowerCase()}.${String(t?.className ?? "").slice(0, 40)}`;
      }),
  );
  expect(running.length, running.join("\n")).toBeLessThanOrEqual(6);
});
