import { expect, test, type Locator, type Page } from "@playwright/test";
import { collectErrors, resetCart } from "./helpers";
import { expectNoOverflowStrict } from "./lib/overflow";

/**
 * W2-D · Armador "Diseñá tu set" (PLAN §4 W2-D).
 * - Celular: la vista previa queda pegada y a la vista en todos los pasos; el PriceDock lleva la miniatura, el paso y el
 *   total (el mismo del panel); un toque abre la hoja de pasos.
 * - Desktop: CTAs del panel siempre dentro de la pantalla, también con 9 técnicas, a 1280×720 y 1440×900.
 * - El odómetro del total gira de verdad (a +120 ms hay una cifra a mitad de camino).
 * - Técnicas excluyentes, colores con flechas, la selección sobrevive a recargar.
 *
 * Contra el dev server:
 *   PW_BASE_URL=http://localhost:3000 pnpm exec playwright test tests/e2e/armador.spec.ts
 */

const price = (s: string) => Number(s.replace(/[^\d]/g, ""));
const NINE = [
  /^Francesita de color/,
  /^Degradé/,
  /^Glitter/,
  /^Cat eye/,
  /^Strass full/,
  /^Charms/,
  /^Animal print/,
  /^Personajes/,
  /^Encapsulado/,
];

async function open(page: Page) {
  await page.goto("/");
  await resetCart(page);
  await page.evaluate(() => sessionStorage.removeItem("bf-builder-v1"));
  await page.goto("/disena", { waitUntil: "networkidle" });
}

const dock = (page: Page) => page.getByRole("region", { name: "Total de tu set" });
const asideTotal = (page: Page) => page.locator("#tu-set [data-total] > .sr-only");
const dockTotal = (page: Page) => dock(page).locator("[data-total] > .sr-only");
const technique = (page: Page, name: RegExp) => page.getByRole("button", { name }).first();

/** Scroll instantáneo (sin la inercia de Lenis, que pisaría un scroll nativo posterior). */
async function scrollToY(page: Page, y: number) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(350);
}

async function tap(loc: Locator) {
  await loc.scrollIntoViewIfNeeded();
  await loc.click();
}

test.describe("armador · celular", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "solo celular");
  });

  test("una sola vista previa, pegada y a la vista en todos los pasos, con miniatura, paso y total", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await open(page);
    expect(await page.locator('[role="img"][aria-label^="Vista previa"]').count()).toBe(1);
    const preview = page.locator('[data-preview="mobile"] [role="img"]');
    await expect(preview).toBeVisible();

    const vh = page.viewportSize()!.height;
    for (let n = 1; n <= 7; n++) {
      const header = page.locator(`#paso-${n} h2`);
      await header.evaluate((el) => {
        const r = el.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + r.top - window.innerHeight * 0.42);
      });
      await page.waitForTimeout(450);
      const box = (await preview.boundingBox())!;
      expect(box.y, `paso ${n}: vista previa arriba`).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height, `paso ${n}: vista previa entera`).toBeLessThanOrEqual(vh * 0.4);
      expect(box.height, `paso ${n}: vista previa legible`).toBeGreaterThan(140);
      await expect(dock(page), `paso ${n}: dock`).toBeVisible();
      await expect(dock(page).locator("[data-nail-swatch]")).toBeVisible();
      await expect(dock(page).getByText(`Paso ${n}/7`)).toBeVisible();
      // el paso no queda tapado por la vista previa pegada ni por el dock
      const h = (await header.boundingBox())!;
      expect(h.y, `paso ${n}: título debajo de la vista previa`).toBeGreaterThan(box.y + box.height);
    }
    expect(errors).toEqual([]);
  });

  test("tras tocar Glitter el dock muestra el mismo total que el panel", async ({ page }) => {
    await open(page);
    await tap(technique(page, /^Glitter/));
    await expect(dock(page)).toBeVisible();
    await expect.poll(async () => price(await asideTotal(page).innerText())).toBe(13200);
    expect(price(await dockTotal(page).innerText())).toBe(price(await asideTotal(page).innerText()));
  });

  test("el dock se esconde con el panel a la vista", async ({ page }) => {
    await open(page);
    await scrollToY(page, 600);
    await expect(dock(page)).toBeVisible();
    await page.locator("#tu-set").evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(dock(page)).toHaveCount(0);
    // y vuelve al subir
    await scrollToY(page, 600);
    await expect(dock(page)).toBeVisible();
  });

  test("el dock abre la hoja de pasos y una fila lleva al paso", async ({ page }) => {
    await open(page);
    await scrollToY(page, 500);
    await dock(page).getByRole("button", { name: /Ver pasos de tu set/ }).click();
    const sheet = page.getByRole("dialog", { name: "Tu set" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("button")).toHaveCount(7 + 2); // 7 pasos + cerrar + ver detalle
    await sheet.getByRole("button", { name: /Color base/ }).click();
    await expect(sheet).toHaveCount(0);
    await expect(dock(page).getByText("Paso 4/7")).toBeVisible();
    const preview = (await page.locator('[data-preview="mobile"] [role="img"]').boundingBox())!;
    const header = (await page.locator("#paso-4 h2").boundingBox())!;
    expect(header.y).toBeGreaterThan(preview.y + preview.height);
    expect(header.y).toBeLessThan(page.viewportSize()!.height * 0.6);
  });

  test("sin desborde horizontal a 390", async ({ page }) => {
    await open(page);
    await expectNoOverflowStrict(page);
    await tap(technique(page, /^Francesita de color/));
    await page.waitForTimeout(400);
    await expectNoOverflowStrict(page);
  });
});

test.describe("armador · desktop", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "solo desktop");
  });

  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ]) {
    test(`CTAs del panel dentro de la pantalla con 9 técnicas a ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await open(page);
      expect(await page.locator('[role="img"][aria-label^="Vista previa"]').count()).toBe(1);
      await expect(page.locator('aside [data-preview="desktop"] [role="img"]')).toBeVisible();
      for (const re of NINE) await tap(technique(page, re));
      await page.waitForTimeout(500);
      for (const name of ["Agregar al carrito", "Pedir ahora"]) {
        const box = (await page.locator("aside").getByRole("button", { name }).boundingBox())!;
        expect(box.y + box.height, name).toBeLessThan(viewport.height);
        expect(box.y, name).toBeGreaterThan(0);
      }
      // nueve técnicas se agrupan en una línea con su detalle plegable
      await expect(page.locator("#tu-set").getByRole("button", { name: /Técnicas \(9\)/ })).toBeVisible();
    });
  }

  test("el riel lleva a cada paso y marca el actual", async ({ page }) => {
    await open(page);
    const rail = page.getByRole("navigation", { name: "Pasos del armador" });
    await rail.getByRole("button", { name: /Paso 5: Técnicas/ }).click();
    await expect(rail.getByRole("button", { name: /Paso 5: Técnicas/ })).toHaveAttribute("aria-current", "step");
    const header = (await page.locator("#paso-5 h2").boundingBox())!;
    expect(header.y).toBeGreaterThan(0);
    expect(header.y).toBeLessThan(400);
  });
});

test.describe("armador · ambos", () => {
  test("el odómetro del total gira: a +120 ms hay una cifra a mitad de camino", async ({ page }) => {
    await open(page);
    const glitter = technique(page, /^Glitter/);
    await glitter.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    // muestreo cuadro a cuadro adentro de la página (el ida y vuelta de Playwright tarda más que la animación)
    const run = await glitter.evaluate(async (btn) => {
      const strips = [...document.querySelectorAll("#tu-set [data-price-ticker] span.absolute.flex-col")];
      const read = () => strips.map((s) => new DOMMatrix(getComputedStyle(s).transform).m42);
      const before = read();
      (btn as HTMLElement).click();
      const t0 = performance.now();
      const samples: { t: number; v: number[] }[] = [];
      await new Promise<void>((done) => {
        const tick = () => {
          samples.push({ t: performance.now() - t0, v: read() });
          if (performance.now() - t0 < 700) requestAnimationFrame(tick);
          else done();
        };
        requestAnimationFrame(tick);
      });
      return { before, samples, end: read() };
    });
    expect(run.before.length).toBeGreaterThan(3);
    // alguna cifra pasa por una matriz intermedia (ni donde estaba ni donde termina) en los primeros ~120–200 ms de
    // la animación. Se cuenta desde el primer cuadro que se movió: con la CPU cargada el primer cuadro llega tarde.
    const moved = (v: number[], ref: number[]) => v.some((y, i) => Math.abs(y - ref[i]) > 0.5);
    const start = run.samples.find((x) => moved(x.v, run.before))?.t ?? Infinity;
    const intermediate = run.samples.filter(
      ({ t, v }) => t <= start + 200 && v.some((y, i) => Math.abs(y - run.before[i]) > 0.5 && Math.abs(y - run.end[i]) > 0.5),
    );
    expect(intermediate.length, JSON.stringify(run.samples.map((x) => [Math.round(x.t), x.v]))).toBeGreaterThan(0);
    expect(run.end).not.toEqual(run.before);
    // y termina en el valor nuevo
    await expect.poll(async () => price(await asideTotal(page).innerText())).toBe(13200);
  });

  test("técnicas excluyentes: francesita / francesita de color y strass / strass full", async ({ page }) => {
    await open(page);
    const fr = technique(page, /^Francesita \+/);
    const frc = technique(page, /^Francesita de color/);
    await tap(fr);
    await expect(fr).toHaveAttribute("aria-pressed", "true");
    await tap(frc);
    await expect(frc).toHaveAttribute("aria-pressed", "true");
    await expect(fr).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText("Cambiamos Francesita por Francesita de color")).toBeVisible();
    await expect(page.getByText("Color de la punta")).toBeVisible();

    const st = technique(page, /^Strass \(hasta/);
    const sf = technique(page, /^Strass full/);
    await tap(st);
    await tap(sf);
    await expect(sf).toHaveAttribute("aria-pressed", "true");
    await expect(st).toHaveAttribute("aria-pressed", "false");
    // el aviso se va solo
    await expect(page.getByText(/^Cambiamos/)).toHaveCount(0, { timeout: 4000 });
  });

  test("los 12 colores se recorren con flechas", async ({ page }) => {
    await open(page);
    const group = page.getByRole("radiogroup", { name: /Color base/ });
    const radios = group.getByRole("radio");
    await expect(radios).toHaveCount(12);
    const nude = group.getByRole("radio", { name: "Nude" });
    await nude.scrollIntoViewIfNeeded();
    await nude.focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Bordó" })).toHaveAttribute("aria-checked", "true");
    await expect(group.getByRole("radio", { name: "Bordó" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(group.getByRole("radio", { name: "Verde" })).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("End");
    await expect(group.getByRole("radio", { name: "Transparente" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(nude).toHaveAttribute("aria-checked", "true");
    await expect(page.locator("#paso-4 header")).toContainText("Nude");
  });

  test("recargar conserva la selección y se puede empezar de cero", async ({ page }) => {
    await open(page);
    await tap(page.getByRole("radio", { name: /^Coffin/ }));
    await tap(page.getByRole("radiogroup", { name: /Color base/ }).getByRole("radio", { name: "Rosa" }));
    await tap(technique(page, /^Glitter/));
    const before = price(await asideTotal(page).innerText());
    await page.waitForTimeout(200);
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.getByText("Seguís con tu diseño")).toBeVisible();
    await expect(page.getByRole("radio", { name: /^Coffin/ })).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("radiogroup", { name: /Color base/ }).getByRole("radio", { name: "Rosa" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(technique(page, /^Glitter/)).toHaveAttribute("aria-pressed", "true");
    expect(price(await asideTotal(page).innerText())).toBe(before);

    await page.getByRole("button", { name: "Empezar de cero" }).click();
    await expect(page.getByText("Seguís con tu diseño")).toHaveCount(0);
    await expect(page.getByRole("radio", { name: /^Almendra/ })).toHaveAttribute("aria-checked", "true");
    await expect(technique(page, /^Glitter/)).toHaveAttribute("aria-pressed", "false");
  });

  test("agregar: vuela a la bolsita e imprime la receta", async ({ page }) => {
    const errors = collectErrors(page);
    await open(page);
    await tap(technique(page, /^Glitter/));
    await page.locator("aside").getByRole("button", { name: "Agregar al carrito" }).click();
    await expect(page.getByRole("link", { name: /Carrito, 1 set/ })).toBeVisible();
    const sheet = page.getByRole("dialog", { name: "Tu set ya está en el carrito" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("BF STUDIO · TU DISEÑO")).toBeVisible();
    await expect(sheet.getByText(/hecho a mano por bren/)).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Ver carrito" })).toHaveAttribute("href", "/carrito");
    await sheet.getByRole("button", { name: "Diseñar otro" }).click();
    await expect(sheet).toHaveCount(0);
    await expect(technique(page, /^Glitter/)).toHaveAttribute("aria-pressed", "false");
    expect(errors).toEqual([]);
  });
});
