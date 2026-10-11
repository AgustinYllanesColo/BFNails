import { expect, test } from "@playwright/test";
import { PUBLIC_ROUTES, collectErrors, expectNoHorizontalOverflow } from "./helpers";

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} carga sin errores ni scroll horizontal`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(route.path, { waitUntil: "networkidle" });
    expect(res?.status(), "status HTTP").toBeLessThan(400);
    await expect(page).toHaveTitle(/BF Nails/);
    await expect(page.locator("main")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("404 propio", async ({ page }) => {
  const res = await page.goto("/no-existe-esta-pagina");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("link", { name: /catálogo/i }).first()).toBeVisible();
});

test("la cinta de texto de la home está en movimiento", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const marquee = page.locator('[style*="--speed"]').first();
  await marquee.scrollIntoViewIfNeeded();
  const a = await marquee.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(700);
  const b = await marquee.evaluate((el) => getComputedStyle(el).transform);
  expect(a).not.toBe(b);
});

test("las animaciones siguen vivas con reducir movimiento activado", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/", { waitUntil: "networkidle" });
  const marquee = page.locator('[style*="--speed"]').first();
  const a = await marquee.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(700);
  const b = await marquee.evaluate((el) => getComputedStyle(el).transform);
  expect(a).not.toBe(b);
  await ctx.close();
});
