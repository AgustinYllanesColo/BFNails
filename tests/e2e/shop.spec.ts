import { expect, test } from "@playwright/test";
import { collectErrors, resetCart } from "./helpers";

const price = (s: string) => Number(s.replace(/[^\d]/g, ""));

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await resetCart(page);
});

test("catálogo: filtrar por forma deja solo esa forma", async ({ page }) => {
  await page.goto("/catalogo", { waitUntil: "networkidle" });
  const before = await page.locator('a[href^="/catalogo/"]').count();
  await page.getByRole("button", { name: /^Stiletto/ }).click();
  await expect.poll(async () => page.locator('a[href^="/catalogo/"]').count()).toBeLessThan(before);
  await expect(page.getByText(/Stiletto/).first()).toBeVisible();
});

test("armador: el precio sube al sumar técnicas y el set va al carrito", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/disena", { waitUntil: "networkidle" });
  const total = page.locator("aside").getByText(/^\$\s?[\d.]+$/).last();
  const base = price(await total.innerText());
  await page.getByRole("button", { name: /^Strass \(hasta/ }).click();
  await expect.poll(async () => price(await total.innerText())).toBeGreaterThan(base);
  await page.getByRole("button", { name: /^Francesita de color/ }).click();
  await expect(page.getByText("Color de la punta")).toBeVisible();
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByRole("link", { name: /Carrito, 1 set/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("detalle → carrito: cantidad y ticket", async ({ page }) => {
  await page.goto("/catalogo/leo-cherry", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.goto("/carrito", { waitUntil: "networkidle" });
  await expect(page.getByText("Leo & cherry").first()).toBeVisible();
  await page.getByRole("button", { name: "Más" }).click();
  await expect(page.getByText(/Leo & cherry ×2/).first()).toBeVisible();
  await expect(page.getByText(/TOTAL|DESDE/).first()).toBeVisible();
});

test("checkout: transferencia crea el pedido o deriva a WhatsApp si no hay base", async ({ page }) => {
  await page.goto("/catalogo/leo-cherry", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.goto("/checkout", { waitUntil: "networkidle" });

  const fallback = page.getByText(/los pedidos van por WhatsApp/i);
  if (await fallback.isVisible()) {
    const wa = page.getByRole("link", { name: "Pedir por WhatsApp" });
    await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/\d+\?text=/);
    return;
  }

  await page.fill("#name", "Prueba E2E");
  await page.fill("#whatsapp", "11 5555 1234");
  await page.getByRole("button", { name: /^Transferencia/ }).click();
  await page.getByRole("button", { name: /Confirmar pedido|Enviar pedido/ }).click();
  await page.waitForURL(/\/pedido\/BF-\d+\?t=/, { timeout: 20_000 });
  const wa = page.getByRole("link", { name: "Abrir WhatsApp" });
  await expect(wa).toHaveAttribute("href", /wa\.me\/\d+\?text=.*BF-\d+/);
});

test("efectivo solo se habilita con retiro o moto", async ({ page }) => {
  await page.goto("/catalogo/leo-cherry", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.goto("/checkout", { waitUntil: "networkidle" });
  const cash = page.getByRole("button", { name: /^Efectivo/ });
  await expect(cash).toBeEnabled();
  await page.getByLabel("Código postal").fill("1824");
  await page.getByRole("button", { name: /Correo Argentino a sucursal/ }).click();
  await expect(cash).toBeDisabled();
});
