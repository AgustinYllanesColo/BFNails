import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/catalogo", "/catalogo/kitty-leopard", "/disena", "/talles", "/faq", "/carrito", "/checkout"];

for (const path of PAGES) {
  test(`accesibilidad sin violaciones graves: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500); // dejar terminar las intros
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .exclude("[aria-hidden='true']")
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} nodos — ${v.help}`)).toEqual([]);
  });
}
