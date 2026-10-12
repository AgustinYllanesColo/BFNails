import { expect, test, type Page } from "@playwright/test";
import { collectErrors } from "./helpers";
import { expectNoOverflowStrict } from "./lib/overflow";

/**
 * W1-F1 · Fundaciones: assets corregidos, fuentes, tokens, superficies del navegador, foco, capa de movimiento y
 * overflow estricto (PLAN §3 F1, criterios de aceptación W1). F2 y F3 suman los suyos en
 * fundaciones-f2.spec.ts y fundaciones-f3.spec.ts.
 *
 * Capturas opcionales para revisión: SHOTS_DIR=/ruta pnpm exec playwright test tests/e2e/fundaciones.spec.ts
 */
const SHOTS_DIR = process.env.SHOTS_DIR;

type RGBA = [number, number, number, number];
const isWhite = ([r, g, b, a]: RGBA, min = 242) => a === 255 && Math.min(r, g, b) >= min;

/** Lee píxeles de un PNG (captura de Playwright) dibujándolo en un canvas de la página. Coordenadas fraccionarias. */
async function samplePng(
  page: Page,
  png: Buffer,
  points: Array<[number, number]>,
): Promise<RGBA[]> {
  return page.evaluate(
    async ({ b64, points }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      return points.map(([fx, fy]) => {
        const d = ctx.getImageData(
          Math.round(fx * (c.width - 1)),
          Math.round(fy * (c.height - 1)),
          1,
          1,
        ).data;
        return [d[0], d[1], d[2], d[3]] as [number, number, number, number];
      });
    },
    { b64: png.toString("base64"), points },
  );
}

/** Píxeles de un asset tal como se sirve (sin optimizar). Coordenadas absolutas o fraccionarias (< 1). */
async function sampleAsset(page: Page, url: string, points: Array<[number, number]>) {
  return page.evaluate(
    async ({ url, points }) => {
      const blob = await (await fetch(url)).blob();
      const bmp = await createImageBitmap(blob);
      const c = document.createElement("canvas");
      c.width = bmp.width;
      c.height = bmp.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(bmp, 0, 0);
      const px = points.map(([x, y]) => {
        const ax = x < 1 ? Math.round(x * bmp.width) : x;
        const ay = y < 1 ? Math.round(y * bmp.height) : y;
        const d = ctx.getImageData(ax, ay, 1, 1).data;
        return [d[0], d[1], d[2], d[3]] as [number, number, number, number];
      });
      return { width: bmp.width, height: bmp.height, px };
    },
    { url, points },
  );
}

test.describe("assets de marca (F1.1)", () => {
  test("los recortes del logo tienen las medidas nuevas y la cara de la Kitty blanca y opaca", async ({
    page,
  }) => {
    await page.goto("/terminos");

    const sticker = await sampleAsset(page, "/brand/kitty-sticker.webp", [
      [0.35, 0.3],
      [0.4, 0.32],
      [0.45, 0.35],
      [228, 333],
    ]);
    expect([sticker.width, sticker.height]).toEqual([564, 666]);
    for (const p of sticker.px) expect(isWhite(p, 245), `kitty-sticker ${p}`).toBe(true);

    const kitty = await sampleAsset(page, "/brand/kitty.webp", [[200, 300]]);
    expect([kitty.width, kitty.height]).toEqual([508, 600]);
    expect(isWhite(kitty.px[0], 245), `kitty ${kitty.px[0]}`).toBe(true);

    const sizes: Array<[string, number, number]> = [
      ["/brand/logo-nails.webp", 960, 582],
      ["/brand/logo-kitty.webp", 800, 745],
      ["/brand/wordmark-nails.webp", 360, 166],
    ];
    for (const [url, w, h] of sizes) {
      const a = await sampleAsset(page, url, []);
      expect([a.width, a.height], url).toEqual([w, h]);
    }
    const icon = await sampleAsset(page, "/brand/kitty-icon.png", [[0.4, 0.32]]);
    expect(icon.height).toBe(256);
    expect(isWhite(icon.px[0]), `kitty-icon ${icon.px[0]}`).toBe(true);

    const leopard = await page.request.get("/brand/leopard-tile.svg");
    expect(leopard.ok()).toBe(true);
    expect(await leopard.text()).toContain("<svg");
  });

  test("la Kitty del nav tiene la cara blanca sobre crema y sobre un campo bordó", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const kitty = page.locator('header img[src*="kitty"]').first();
    await expect(kitty).toBeVisible();
    const face: Array<[number, number]> = [
      [0.4, 0.32],
      [0.45, 0.35],
    ];

    const onCream = await samplePng(page, await kitty.screenshot({ animations: "disabled" }), face);
    for (const p of onCream) expect(isWhite(p), `cara sobre crema ${p}`).toBe(true);
    if (SHOTS_DIR)
      await page.screenshot({
        path: `${SHOTS_DIR}/f1-nav-kitty-cream.png`,
        clip: { x: 0, y: 0, width: 260, height: 100 },
      });

    // Un campo bordó que pase por debajo del nav (cinta / cómo funciona / footer)
    const ok = await page.evaluate(() => {
      const bordo = "rgb(74, 14, 14)";
      const field = [
        ...document.querySelectorAll<HTMLElement>("main section, main > div, footer"),
      ].find(
        (el) =>
          getComputedStyle(el).backgroundColor === bordo &&
          el.getBoundingClientRect().height >= 300,
      );
      if (!field) return false;
      window.scrollTo(0, field.getBoundingClientRect().top + window.scrollY + 40);
      return true;
    });
    expect(ok, "hay un campo bordó en la home").toBe(true);
    await page.waitForTimeout(900);
    const underNav = await page.evaluate(() => {
      const navH = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--nav-h"),
      );
      let el = document.elementFromPoint(window.innerWidth / 2, navH + 12) as HTMLElement | null;
      while (el && getComputedStyle(el).backgroundColor !== "rgb(74, 14, 14)")
        el = el.parentElement;
      return !!el;
    });
    expect(underNav, "el nav quedó sobre el campo bordó").toBe(true);
    const onBordo = await samplePng(page, await kitty.screenshot({ animations: "disabled" }), face);
    for (const p of onBordo) expect(isWhite(p), `cara sobre bordó ${p}`).toBe(true);
    if (SHOTS_DIR)
      await page.screenshot({
        path: `${SHOTS_DIR}/f1-nav-kitty-bordo.png`,
        clip: { x: 0, y: 0, width: 260, height: 100 },
      });
  });
});

test.describe("tipografía (F1.3)", () => {
  for (const path of ["/", "/catalogo"]) {
    test(`${path}: titulares en Imbue, cuerpo en Figtree, sin Shrikhand ni Space Grotesk`, async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(() => {
        const heading = document.querySelector("main h1, main h2")!;
        const faces: Array<{ family: string; src: string[] }> = [];
        for (const sheet of document.styleSheets) {
          let rules: CSSRuleList;
          try {
            rules = sheet.cssRules;
          } catch {
            continue;
          }
          for (const rule of rules) {
            if (rule instanceof CSSFontFaceRule) {
              const src = rule.style.getPropertyValue("src");
              const urls = [...src.matchAll(/url\("?([^")]+)"?\)/g)].map(
                (m) => new URL(m[1], sheet.href ?? location.href).pathname,
              );
              faces.push({
                family: rule.style.getPropertyValue("font-family").replace(/["']/g, ""),
                src: urls,
              });
            }
          }
        }
        const downloaded = performance
          .getEntriesByType("resource")
          .map((e) => new URL(e.name).pathname)
          .filter((p) => /\.(woff2?|ttf|otf)$/.test(p));
        const familyOf = (p: string) => faces.find((f) => f.src.includes(p))?.family ?? "?";
        return {
          heading: getComputedStyle(heading).fontFamily,
          headingWeight: getComputedStyle(heading).fontWeight,
          body: getComputedStyle(document.body).fontFamily,
          families: [...new Set([...document.fonts].map((f) => f.family.replace(/["']/g, "")))],
          imbueLoaded: [...document.fonts].some(
            (f) => f.family.includes("Imbue") && f.status === "loaded",
          ),
          downloadedFamilies: downloaded.map(familyOf),
        };
      });
      expect(r.heading).toMatch(/Imbue/);
      expect(r.headingWeight).toBe("700");
      expect(r.body).toMatch(/Figtree/);
      expect(r.imbueLoaded).toBe(true);
      for (const banned of [/Shrikhand/i, /Space Grotesk/i]) {
        expect(r.families.join(", ")).not.toMatch(banned);
        expect(r.downloadedFamilies.join(", ")).not.toMatch(banned);
      }
      expect(errors).toEqual([]);
    });
  }

  test("la home no precarga JetBrains Mono (solo Imbue y Figtree)", async ({ page }) => {
    const res = await page.goto("/", { waitUntil: "networkidle" });
    const header = res?.headers()["link"] ?? "";
    const fromHeader = [...header.matchAll(/<([^>]+)>;[^,]*rel=preload[^,]*as="?font/g)].map(
      (m) => m[1],
    );
    const r = await page.evaluate((fromHeader) => {
      const fromHead = [
        ...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="font"]'),
      ].map((l) => l.href);
      const preloads = [...fromHeader, ...fromHead].map((u) => new URL(u, location.href).pathname);
      const familyBySrc = new Map<string, string>();
      for (const sheet of document.styleSheets) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        for (const rule of rules) {
          if (!(rule instanceof CSSFontFaceRule)) continue;
          const family = rule.style.getPropertyValue("font-family").replace(/["']/g, "");
          for (const m of rule.style.getPropertyValue("src").matchAll(/url\("?([^")]+)"?\)/g)) {
            familyBySrc.set(new URL(m[1], sheet.href ?? location.href).pathname, family);
          }
        }
      }
      return preloads.map((p) => familyBySrc.get(p) ?? "?");
    }, fromHeader);
    expect(r.length, "hay fuentes precargadas").toBeGreaterThan(0);
    expect(r.join(", ")).not.toMatch(/JetBrains/);
    expect(r.join(", ")).toMatch(/Imbue/);
  });
});

test.describe("layout y superficies (F1.3–F1.4)", () => {
  test("viewport-fit, main#contenido y skip link funcional", async ({ page }) => {
    await page.goto("/catalogo", { waitUntil: "networkidle" });
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      "content",
      /viewport-fit=cover/,
    );
    await expect(page.locator("main#contenido[tabindex='-1']")).toHaveCount(1);

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(skip).toBeFocused();
    const box = await skip.boundingBox();
    expect(
      box && box.width > 40 && box.y >= 0 && box.y < 40,
      "visible arriba a la izquierda al enfocarlo",
    ).toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.locator("main#contenido")).toBeFocused();
    const outline = await page
      .locator("main#contenido")
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).toBe("none");
  });

  test("tokens y superficies del navegador", async ({ page, isMobile }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const r = await page.evaluate(() => {
      const html = getComputedStyle(document.documentElement);
      const link = document.querySelector("header a[href]")!;
      return {
        navH: html.getPropertyValue("--nav-h").trim(),
        scrollPaddingTop: html.scrollPaddingTop,
        colorScheme: html.colorScheme,
        caret: html.caretColor,
        accent: html.accentColor,
        inkSoft: html.getPropertyValue("--ink-600").trim(),
        linkCursor: getComputedStyle(link).cursor,
        overflowX: [html.overflowX, getComputedStyle(document.body).overflowX],
        synthesis: getComputedStyle(document.body).fontSynthesis,
      };
    });
    const nav = isMobile ? 72 : 84;
    expect(r.navH).toBe(`${nav}px`);
    expect(r.scrollPaddingTop).toBe(`${nav + 24}px`);
    expect(r.colorScheme).toBe("light");
    expect(r.caret).toBe("rgb(181, 28, 28)");
    expect(r.accent).toBe("rgb(74, 14, 14)");
    expect(r.inkSoft).toBe("#6b5048");
    expect(r.linkCursor, "el cursor nativo nunca se oculta").toBe("pointer");
    expect(r.overflowX).toEqual(["clip", "clip"]);
    expect(r.synthesis).toBe("none");
  });

  test("áreas seguras (viewport-fit=cover): gutter, medidas del nav y skip link fuera del notch", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/terminos", { waitUntil: "networkidle" });
    const read = () =>
      page.evaluate(() => {
        const html = getComputedStyle(document.documentElement);
        const box = getComputedStyle(document.querySelector("main .container-x")!);
        return {
          gutter: [box.paddingLeft, box.paddingRight],
          navH: html.getPropertyValue("--nav-h").trim(),
          scrollPaddingTop: html.scrollPaddingTop,
        };
      });
    const [nav, padTop, padX, gutter] = isMobile ? [72, 12, 12, 16] : [84, 16, 20, 48];

    // Sin áreas seguras (vertical y desktop) todo queda como estaba
    const plain = await read();
    expect(plain.gutter).toEqual([`${gutter}px`, `${gutter}px`]);
    expect(plain.navH).toBe(`${nav}px`);
    expect(plain.scrollPaddingTop).toBe(`${nav + 24}px`);

    // iPhone con notch: 47 px a los costados (horizontal) y arriba (modo app), 21 px de barra de inicio
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { top: 47, left: 47, right: 47, bottom: 21 },
    });
    const safe = await read();
    const side = Math.max(gutter, 47);
    expect(safe.gutter, "container-x nunca queda bajo el notch").toEqual([
      `${side}px`,
      `${side}px`,
    ]);
    const navSafe = 47 + (nav - padTop);
    expect(safe.navH, "--nav-h suma el área segura y sigue en px").toBe(`${navSafe}px`);
    expect(safe.scrollPaddingTop).toBe(`${navSafe + 24}px`);
    // Las paddings de la cabecera fija (W2-A) toman el área segura si es mayor que la suya
    const pads = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;padding:var(--nav-pad-top) var(--nav-pad-x) 0";
      document.body.append(probe);
      const cs = getComputedStyle(probe);
      const r = [cs.paddingTop, cs.paddingLeft];
      probe.remove();
      return r;
    });
    expect(pads).toEqual([`${Math.max(padTop, 47)}px`, `${Math.max(padX, 47)}px`]);

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(skip).toBeFocused();
    const b = (await skip.boundingBox())!;
    expect(b.x >= 47 && b.y >= 47, `skip link en ${b.x},${b.y}`).toBe(true);

    await cdp.send("Emulation.setSafeAreaInsetsOverride", {
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    });
    expect((await read()).navH).toBe(`${nav}px`);
  });

  test("foco: outline 2 px bordó con offset 3 px; amarillo dentro de [data-surface=inverse]", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // `transition-colors` de Tailwind v4 incluye outline-color: se lee después de la transición
    const read = () =>
      page.waitForTimeout(450).then(() =>
        page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const cs = getComputedStyle(el);
          return {
            tag: el.tagName,
            style: cs.outlineStyle,
            width: cs.outlineWidth,
            offset: cs.outlineOffset,
            color: cs.outlineColor,
          };
        }),
      );

    await page.keyboard.press("Tab"); // skip link
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Tab"); // logo, enlaces / bolsa / menú
      const f = await read();
      expect(f, `foco #${i + 1} (${f.tag})`).toMatchObject({
        style: "solid",
        width: "2px",
        offset: "3px",
        color: "rgb(74, 14, 14)",
      });
    }
    if (SHOTS_DIR)
      await page.screenshot({
        path: `${SHOTS_DIR}/focus.png`,
        clip: { x: 0, y: 0, width: page.viewportSize()!.width, height: 110 },
      });

    // Superficie bordó (el footer la declara en W2-F; si todavía no, se marca acá para probar la regla)
    const link = page.locator("footer a[href]").first();
    await link.evaluate((a) => {
      const surface = a.closest("[data-surface='inverse']") ?? a.closest("footer")!;
      surface.setAttribute("data-surface", "inverse");
    });
    await link.evaluate((a) => a.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(400);
    await link.focus(); // la modalidad teclado de los Tab anteriores mantiene :focus-visible
    const inv = await read();
    expect(inv).toMatchObject({
      style: "solid",
      width: "2px",
      offset: "3px",
      color: "rgb(245, 196, 0)",
    });
    if (SHOTS_DIR) {
      const b = (await link.boundingBox())!;
      await page.screenshot({
        path: `${SHOTS_DIR}/focus-inverse.png`,
        clip: {
          x: Math.max(0, b.x - 24),
          y: Math.max(0, b.y - 24),
          width: Math.min(360, b.width + 48),
          height: b.height + 48,
        },
      });
    }
  });
});

test.describe("capa de movimiento (F1.4–F1.5)", () => {
  test("keyframes compartidos disponibles", async ({ page }) => {
    await page.goto("/terminos");
    const names = await page.evaluate(() => {
      const found = new Set<string>();
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules)
            if (rule instanceof CSSKeyframesRule) found.add(rule.name);
        } catch {
          /* hoja de otro origen */
        }
      }
      return [...found];
    });
    for (const k of [
      "marquee",
      "drift",
      "print-led",
      "wink",
      "rise-in",
      "fade-in",
      "pop-in",
      "sheen",
      "twinkle",
      "breathe",
      "logo-float",
      "pendulum",
      "bounce-y",
      "peek-idle",
      "spin-slow",
      "brush-draw",
      "stamp-in",
      "shake-x",
      "shimmer",
      "leo-slide",
    ]) {
      expect(names, `@keyframes ${k}`).toContain(k);
    }
  });

  test("reduced-motion atenúa por variables (no congela)", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/terminos");
    const v = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return ["--amb-k", "--marquee-k", "--float-y", "--pend", "--tw-o"].map((k) =>
        parseFloat(cs.getPropertyValue(k)),
      );
    });
    expect(v).toEqual([2, 3, -4, 3, 0.6]);
    await ctx.close();
  });

  test("pausa manual y fuera de vista: solo [data-ambient] queda en paused", async ({ page }) => {
    const errors = collectErrors(page); // el atributo puesto antes de hidratar no puede dar un mismatch
    await page.goto("/terminos", { waitUntil: "networkidle" });
    const probe = () =>
      page.evaluate(() => {
        let el = document.getElementById("amb-probe");
        if (!el) {
          el = document.createElement("div");
          el.id = "amb-probe";
          el.innerHTML =
            '<span data-ambient="move" style="display:inline-block;animation:twinkle 3s linear infinite">a</span>' +
            '<span id="amb-plain" style="display:inline-block;animation:twinkle 3s linear infinite">b</span>';
          document.body.appendChild(el);
        }
        const amb = el.querySelector<HTMLElement>("[data-ambient]")!;
        const plain = el.querySelector<HTMLElement>("#amb-plain")!;
        return [
          getComputedStyle(amb).animationPlayState,
          getComputedStyle(plain).animationPlayState,
        ];
      });

    expect(await probe()).toEqual(["running", "running"]);
    await page.evaluate(() =>
      document.getElementById("amb-probe")!.setAttribute("data-offscreen", ""),
    );
    expect(await probe()).toEqual(["paused", "running"]);
    await page.evaluate(() =>
      document.getElementById("amb-probe")!.removeAttribute("data-offscreen"),
    );

    // Preferencia guardada: el script del <head> la aplica antes del primer paint (se lee cuando el parser crea el
    // <body>, antes de que React hidrate) y Providers la mantiene.
    await page.addInitScript(() => {
      const w = window as unknown as { __motionAtBody?: string | null };
      new MutationObserver((_, obs) => {
        if (!document.body) return;
        w.__motionAtBody = document.documentElement.getAttribute("data-motion");
        obs.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.evaluate(() => localStorage.setItem("bf-motion", "paused"));
    await page.reload({ waitUntil: "networkidle" });
    expect(
      await page.evaluate(() => (window as unknown as { __motionAtBody?: string }).__motionAtBody),
      "pausa aplicada antes de hidratar",
    ).toBe("paused");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
    expect(await probe()).toEqual(["paused", "running"]);

    // Sin preferencia guardada, nada queda pausado
    await page.evaluate(() => localStorage.removeItem("bf-motion"));
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/);
    expect(await probe()).toEqual(["running", "running"]);
    expect(errors).toEqual([]);
  });
});

// El chequeo "el precio de cada tarjeta queda dentro de su tarjeta" valida DesignCard (F2.17): vive en
// fundaciones-f2.spec.ts. Con la tarjeta vieja falla a 360 px (la píldora de precio se sale), que es justo lo que F2 corrige.
test.describe("overflow estricto (F1.8)", () => {
  for (const path of ["/catalogo", "/catalogo/kitty-leopard"]) {
    test(`${path} sin desborde a 360/375/390`, async ({ page, isMobile }) => {
      test.skip(!isMobile, "solo celulares");
      for (const width of [360, 375, 390]) {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(path, { waitUntil: "networkidle" });
        await expectNoOverflowStrict(page);
      }
    });
  }
});
