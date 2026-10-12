import { expect, test, type Page } from "@playwright/test";
import { collectErrors, resetCart } from "./helpers";
import { expectNoOverflowStrict } from "./lib/overflow";

/**
 * W2-A · Hero, nav, bolsita y cursor acompañante (PLAN §4 W2-A.9 y aceptación).
 *
 * Corre contra el dev server: PW_BASE_URL=http://localhost:3000 pnpm exec playwright test tests/e2e/hero-nav.spec.ts
 * Capturas opcionales: SHOTS_DIR=/ruta (tira del contador al aterrizar la ficha, píldora sobre bordó).
 */
const SHOTS_DIR = process.env.SHOTS_DIR;

type RGBA = [number, number, number, number];

/** Opacidad efectiva (producto con los ancestros); 0 si algo de la cadena está `visibility: hidden`. */
const EFFECTIVE_OPACITY = `(el) => {
  let o = 1;
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.visibility === "hidden" || cs.display === "none") return 0;
    o *= Number(cs.opacity);
  }
  return o;
}`;

/** Lee píxeles de un PNG dibujándolo en un canvas de la página. Coordenadas fraccionarias o absolutas (≥ 1). */
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
        const x = fx < 1 ? Math.round(fx * (c.width - 1)) : Math.round(fx);
        const y = fy < 1 ? Math.round(fy * (c.height - 1)) : Math.round(fy);
        const d = ctx.getImageData(x, y, 1, 1).data;
        return [d[0], d[1], d[2], d[3]] as RGBA;
      });
    },
    { b64: png.toString("base64"), points },
  );
}

/** Scroll de la página (con Lenis montado, `scrollTo` nativo + un frame para que sincronice). */
async function scrollToY(page: Page, y: number) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
}

const heroReady = (page: Page) =>
  page.waitForFunction(() => document.documentElement.classList.contains("lenis"));

test.describe("hero: intro visible desde el primer cuadro", () => {
  test("copy, CTAs y logo nunca pasan por opacidad 0 (muestreo por frame hasta 1,8 s)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    // Muestreador desde el arranque del documento: un registro por frame durante 1,8 s desde que el hero existe
    // (con la CPU compartida la respuesta puede tardar: la ventana arranca con el hero, no con la navegación).
    await page.addInitScript(`(() => {
      const eff = ${EFFECTIVE_OPACITY};
      const samples = [];
      let t0 = -1;
      window.__heroSamples = samples;
      window.__heroDone = false;
      const tick = () => {
        const now = performance.now();
        const q = (s) => document.querySelector(s);
        const h1 = q("[data-hero] h1"), lead = q("[data-hero-lead]"), ctas = q("[data-hero-ctas]");
        const logo = q("[data-hero] img[alt='BF Nails Studio']");
        if (h1 && lead && ctas && logo) {
          if (t0 < 0) t0 = now;
          samples.push({ t: now - t0, h1: eff(h1), lead: eff(lead), ctas: eff(ctas), logo: eff(logo) });
        }
        if (t0 < 0 || now - t0 < 1800) requestAnimationFrame(tick);
        else window.__heroDone = true;
      };
      requestAnimationFrame(tick);
    })()`);
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForFunction(
      () => (window as unknown as { __heroDone: boolean }).__heroDone,
      undefined,
      {
        timeout: 20_000,
      },
    );
    const samples = await page.evaluate(
      () => (window as unknown as { __heroSamples: Record<string, number>[] }).__heroSamples,
    );
    expect(samples.length, "frames muestreados").toBeGreaterThan(10);
    for (const s of samples) {
      expect(s.h1, `h1 a ${Math.round(s.t)} ms`).toBeGreaterThanOrEqual(0.35);
      expect(s.lead, `bajada a ${Math.round(s.t)} ms`).toBeGreaterThanOrEqual(0.35);
      expect(s.ctas, `CTAs a ${Math.round(s.t)} ms`).toBeGreaterThanOrEqual(0.35);
      expect(s.logo, `logo a ${Math.round(s.t)} ms`).toBeGreaterThanOrEqual(0.99);
    }
    // Los cuadros de la aceptación (100/400/800/1600 ms): el más cercano de cada uno.
    for (const at of [150, 400, 800, 1600]) {
      const s = samples.reduce((a, b) => (Math.abs(b.t - at) < Math.abs(a.t - at) ? b : a));
      expect(s.logo, `logo ~${at} ms`).toBeGreaterThanOrEqual(0.99);
      expect(s.h1, `h1 ~${at} ms`).toBeGreaterThanOrEqual(0.35);
    }
    expect(errors).toEqual([]);
  });

  test("logo: una sola request, fetchpriority=high; sin ✦ ni will-change en línea", async ({
    page,
  }) => {
    const logoRequests: string[] = [];
    page.on("request", (r) => {
      if (new URL(r.url()).pathname === "/brand/logo-nails.webp") logoRequests.push(r.url());
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200); // la máscara del brillo ya pidió (o reusó) la imagen
    expect(logoRequests, "requests a /brand/logo-nails.webp").toHaveLength(1);

    const info = await page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>("[data-hero]")!;
      const img = hero.querySelector<HTMLImageElement>("img[alt='BF Nails Studio']")!;
      return {
        priority: img.getAttribute("fetchpriority"),
        loading: img.getAttribute("loading"),
        sparkles: (hero.textContent ?? "").includes("✦"),
        willChange: [...hero.querySelectorAll<HTMLElement>("*")].filter((el) =>
          el.style.getPropertyValue("will-change"),
        ).length,
      };
    });
    expect(info.priority).toBe("high");
    expect(info.loading).toBe("eager");
    expect(info.sparkles, "glifo ✦ en el hero").toBe(false);
    expect(info.willChange, "will-change en línea").toBe(0);
  });

  test("primer viewport: ≤ 3 estrellas sueltas, 0 leopardos en el hero y sin desborde", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const counts = await page.evaluate(() => {
      const visible = (el: Element) => {
        for (let n: Element | null = el; n; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.visibility === "hidden" || Number(cs.opacity) < 0.05) return false;
        }
        return true;
      };
      const inView = (el: Element) => {
        const r = el.getBoundingClientRect();
        return (
          visible(el) &&
          r.width > 0 &&
          r.height > 0 &&
          r.bottom > 0 &&
          r.top < innerHeight &&
          r.right > 0 &&
          r.left < innerWidth
        );
      };
      const stars = [...document.querySelectorAll("svg path")].filter(
        (p) =>
          p.getAttribute("d")?.startsWith("M50 4 60.29") &&
          p.closest("svg")!.closest("[aria-hidden]") &&
          inView(p),
      );
      // la estrella de contorno de la fila (separador) no cuenta: es parte de la cinta
      const loose = stars.filter((p) => p.getAttribute("fill") !== "none").length;
      // del hero y del nav (la cinta leopardo que sigue al hero es de las secciones de la home)
      const leopards = [...document.querySelectorAll("[data-hero] *, header *")].filter(
        (el) => getComputedStyle(el).backgroundImage.includes("leopard-tile") && inView(el),
      ).length;
      return { loose, leopards };
    });
    expect(counts.loose, "LogoStar sueltas en el primer viewport").toBeLessThanOrEqual(3);
    expect(counts.leopards, "leopardos en el primer viewport").toBe(0);
    await expectNoOverflowStrict(page);
  });
});

test.describe("hero: scroll", () => {
  test("después de scrollear 60 → 0 el logo vuelve a opacidad 1 y escala 1; el indicador se apaga en 200", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await heroReady(page);
    await page.waitForTimeout(1000);
    await scrollToY(page, 60);
    await page.waitForTimeout(700);
    await scrollToY(page, 0);
    await page.waitForTimeout(1100); // scrub .4
    const back = await page.evaluate(`(() => {
      const eff = ${EFFECTIVE_OPACITY};
      const node = document.querySelector("[data-hero-logo-scroll]");
      const img = node.querySelector("img");
      const m = new DOMMatrixReadOnly(getComputedStyle(node).transform === "none" ? undefined : getComputedStyle(node).transform);
      return { opacity: eff(img), a: m.a, b: m.b, d: m.d };
    })()`);
    expect(back).toMatchObject({ opacity: 1 });
    const m = back as { a: number; b: number; d: number };
    expect(m.a).toBeCloseTo(1, 3);
    expect(m.b).toBeCloseTo(0, 3);
    expect(m.d).toBeCloseTo(1, 3);

    await scrollToY(page, 200);
    await page.waitForTimeout(600);
    const cue = await page.evaluate(`(() => {
      const eff = ${EFFECTIVE_OPACITY};
      return eff(document.querySelector("[data-hero-cue]"));
    })()`);
    expect(cue as number, "indicador a scrollY 200").toBeLessThan(0.05);
  });

  test("con reduced-motion el logo solo funde: a 300 px la matriz tiene a = 1", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    await heroReady(page);
    await scrollToY(page, 300);
    await page.waitForTimeout(900);
    const r = (await page.evaluate(`(() => {
      const eff = ${EFFECTIVE_OPACITY};
      const node = document.querySelector("[data-hero-logo-scroll]");
      const t = getComputedStyle(node).transform;
      const m = new DOMMatrixReadOnly(t === "none" ? undefined : t);
      return { a: m.a, b: m.b, opacity: eff(node.querySelector("img")) };
    })()`)) as { a: number; b: number; opacity: number };
    expect(r.a).toBeCloseTo(1, 3);
    expect(r.b).toBeCloseTo(0, 3);
    expect(r.opacity, "el logo funde al scrollear").toBeLessThan(0.95);
    await ctx.close();
  });
});

test.describe("hero: uñas lejos del texto", () => {
  test("ningún [data-nail] toca el h1, la bajada ni los CTAs (ni se mete abajo del nav)", async ({
    page,
    isMobile,
  }) => {
    const sizes = isMobile
      ? [
          { width: 360, height: 740 },
          { width: 375, height: 667 },
          { width: 390, height: 844 },
        ]
      : [{ width: 1440, height: 900 }];
    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto("/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1300); // entrada de las uñas
      // La deriva las mueve: cinco lecturas a lo largo de 2 s.
      for (let k = 0; k < 5; k++) {
        const hits = await page.evaluate(() => {
          const navH = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--nav-h"),
          );
          const boxes = {
            h1: document.querySelector("[data-hero] h1")!.getBoundingClientRect(),
            bajada: document.querySelector("[data-hero-lead]")!.getBoundingClientRect(),
            CTAs: document.querySelector("[data-hero-ctas]")!.getBoundingClientRect(),
          };
          const out: string[] = [];
          for (const nail of document.querySelectorAll("[data-hero] [data-nail]")) {
            const a = nail.getBoundingClientRect();
            if (a.width === 0 || a.height === 0) continue;
            for (const [name, b] of Object.entries(boxes))
              if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
                out.push(`uña en ${Math.round(a.left)},${Math.round(a.top)} toca ${name}`);
            if (a.top < navH)
              out.push(`uña en ${Math.round(a.left)},${Math.round(a.top)} abajo del nav`);
          }
          return out;
        });
        expect(hits, `${size.width}×${size.height}`).toEqual([]);
        await page.waitForTimeout(400);
      }
    }
  });
});

test.describe("nav", () => {
  test("la píldora aparece a los 24 px y su borde de abajo es --nav-h", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await heroReady(page);
    const pill = page.locator("[data-nav-pill]");
    await expect(pill).not.toHaveAttribute("data-solid", /.*/);
    await scrollToY(page, 200);
    await expect(pill).toHaveAttribute("data-solid", "true");
    // el único backdrop-filter del sitio, al final de su transición de 300 ms
    await expect
      .poll(() => pill.evaluate((el) => getComputedStyle(el).backdropFilter), { timeout: 3000 })
      .toBe("blur(16px) saturate(1.2)");
    const m = await page.evaluate(() => ({
      bottom: document.querySelector("[data-nav-pill]")!.getBoundingClientRect().bottom,
      navH: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")),
    }));
    expect(
      Math.abs(m.bottom - m.navH),
      `bottom ${m.bottom} vs --nav-h ${m.navH}`,
    ).toBeLessThanOrEqual(1);
  });

  test("sobre un campo bordó la píldora se ve crema (≈ rgb(243,233,218))", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await heroReady(page);
    const found = await page.evaluate(() => {
      const field = [
        ...document.querySelectorAll<HTMLElement>("main section, main > div, footer"),
      ].find(
        (el) =>
          getComputedStyle(el).backgroundColor === "rgb(74, 14, 14)" &&
          el.getBoundingClientRect().height >= 300,
      );
      if (!field) return false;
      window.scrollTo(0, field.getBoundingClientRect().top + window.scrollY + 60);
      return true;
    });
    test.skip(!found, "la home todavía no tiene un campo bordó alto");
    await page.waitForTimeout(1000);
    const box = (await page.locator("[data-nav-pill]").boundingBox())!;
    const vw = page.viewportSize()!.width;
    // un punto vacío de la píldora: entre el lockup y los botones (celular) o entre el lockup y los links (desktop)
    const x = vw < 768 ? box.x + box.width * 0.52 : box.x + 300;
    const y = box.y + box.height / 2;
    const png = await page.screenshot({
      clip: { x: x - 2, y: y - 2, width: 4, height: 4 },
      animations: "disabled",
    });
    const [[r, g, b]] = await samplePng(page, png, [[0.5, 0.5]]);
    if (SHOTS_DIR)
      await page.screenshot({
        path: `${SHOTS_DIR}/w2a-pill-bordo-${vw}.png`,
        clip: { x: 0, y: 0, width: vw, height: 110 },
      });
    expect(Math.abs(r - 243), `r=${r}`).toBeLessThanOrEqual(5);
    expect(Math.abs(g - 233), `g=${g}`).toBeLessThanOrEqual(5);
    expect(Math.abs(b - 218), `b=${b}`).toBeLessThanOrEqual(5);
  });

  test("la Kitty del nav tiene la cara blanca", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const kitty = page.locator('header img[src*="kitty"]').first();
    await expect(kitty).toBeVisible();
    const px = await samplePng(page, await kitty.screenshot({ animations: "disabled" }), [
      [0.4, 0.32],
      [0.45, 0.35],
    ]);
    for (const [r, g, b, a] of px)
      expect(a === 255 && Math.min(r, g, b) >= 242, `cara ${[r, g, b, a]}`).toBe(true);
  });

  test("menú del celular: foco adentro, página quieta, objetivos ≥ 44 px, Esc cierra y devuelve el foco", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "el menú es del celular");
    const errors = collectErrors(page);
    await page.goto("/catalogo", { waitUntil: "networkidle" });
    await heroReady(page);
    await scrollToY(page, 300);
    await page.waitForTimeout(300);
    const burger = page.getByRole("button", { name: "Abrir menú" });
    await burger.click();
    const panel = page.locator("#menu-movil");
    await expect(panel).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => !!document.activeElement?.closest("#menu-movil")))
      .toBe(true);
    // el link activo marcado
    await expect(panel.getByRole("link", { name: "Catálogo" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(await page.locator("#contenido").getAttribute("inert")).not.toBeNull();

    const y0 = await page.evaluate(() => window.scrollY);
    await page.mouse.move(195, 700);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY), "la página de atrás no scrollea").toBe(y0);

    await page.waitForTimeout(400); // entrada escalonada
    const small = await panel.evaluate((nav) =>
      [...nav.querySelectorAll<HTMLElement>("a, button")]
        .map((el) => ({
          name: el.getAttribute("aria-label") ?? el.textContent?.trim(),
          r: el.getBoundingClientRect(),
        }))
        .filter(({ r }) => r.width < 44 || r.height < 44)
        .map(({ name, r }) => `${name} ${Math.round(r.width)}×${Math.round(r.height)}`),
    );
    expect(small, "objetivos menores a 44 px").toEqual([]);

    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute("aria-controls")))
      .toBe("menu-movil");
    expect(await page.locator("#contenido").getAttribute("inert")).toBeNull();
    expect(errors).toEqual([]);
  });
});

test.describe("bolsita", () => {
  test("el número visible sube cuando aterriza la ficha; el aria-label cambia en el acto", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await resetCart(page);
    await page.goto("/catalogo/cherry-red", { waitUntil: "networkidle" });
    await heroReady(page);
    const add = page.getByRole("button", { name: "Agregar al carrito" }).first();
    await add.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const w = window as unknown as {
        __bump: number;
        __frames: { t: number; shown: string | null }[];
      };
      w.__bump = -1;
      w.__frames = [];
      window.addEventListener("bf:cart-bump", () => (w.__bump = performance.now()), { once: true });
      const t0 = performance.now();
      const tick = () => {
        const badge = [...document.querySelectorAll<HTMLElement>("header [data-cart-count]")].find(
          (el) => el.getBoundingClientRect().width > 0,
        );
        w.__frames.push({ t: performance.now() - t0, shown: badge?.dataset.cartCount ?? null });
        if (performance.now() - t0 < 1400) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // Una ficha en el aire desde el botón (lo mismo que hace flyToCart al agregar).
      const r = [...document.querySelectorAll("button")]
        .find(
          (b) =>
            b.textContent?.includes("Agregar al carrito") && b.getBoundingClientRect().width > 0,
        )!
        .getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent("bf:fly", {
          detail: { from: { x: r.left + r.width / 2, y: r.top + r.height / 2 } },
        }),
      );
    });
    await add.click();
    await expect(page.getByRole("link", { name: /Carrito, 1 set/ })).toBeVisible({ timeout: 1500 });
    await page.waitForTimeout(1500);
    const { bump, frames } = await page.evaluate(() => {
      const w = window as unknown as {
        __bump: number;
        __frames: { t: number; shown: string | null }[];
      };
      return { bump: w.__bump, frames: w.__frames };
    });
    expect(bump, "la ficha aterrizó").toBeGreaterThan(0);
    const firstShown = frames.find((f) => f.shown === "1");
    expect(firstShown, "el badge apareció").toBeTruthy();
    // mientras la ficha vuela (primeros 300 ms) el número no cambió
    expect(
      frames.filter((f) => f.t < 300).every((f) => f.shown === null),
      "badge antes del aterrizaje",
    ).toBe(true);
    expect(firstShown!.t, "el badge aparece con el aterrizaje, no al hacer click").toBeGreaterThan(
      400,
    );
    expect(errors).toEqual([]);
  });
});

test.describe("cursor acompañante", () => {
  test("cursor nativo siempre; la píldora solo sobre [data-cursor]", async ({ page, isMobile }) => {
    test.skip(isMobile, "puntero fino");
    await page.goto("/", { waitUntil: "networkidle" });
    await heroReady(page);
    await page.waitForSelector("[data-cursor-companion]", { state: "attached" });
    const pill = page.locator("[data-cursor-companion] > div");
    const nativeCursor = await page.evaluate(() => getComputedStyle(document.body).cursor);
    expect(nativeCursor).not.toBe("none");

    const cta = page.locator('[data-hero] a[data-cursor="ver"]');
    const b = (await cta.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
    await expect(pill).toHaveAttribute("data-state", "on");
    await expect(pill).toContainText("Ver");
    expect(
      await page.evaluate(
        () => getComputedStyle(document.querySelector("[data-hero] a[data-cursor]")!).cursor,
      ),
    ).toBe("pointer");

    await page.mouse.down();
    await expect(pill).toHaveAttribute("data-state", "press");
    await page.mouse.up();
    // fuera de cualquier [data-cursor]: se va
    const h1 = (await page.locator("[data-hero] h1").boundingBox())!;
    await page.mouse.move(h1.x + 10, h1.y + h1.height / 2, { steps: 4 });
    await expect(pill).toHaveAttribute("data-state", "off");
  });
});
