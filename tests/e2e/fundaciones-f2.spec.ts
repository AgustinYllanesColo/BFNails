import { expect, test, type Locator, type Page } from "@playwright/test";
import { collectErrors } from "./helpers";
import { expectNoOverflowStrict } from "./lib/overflow";

/**
 * W1-F2 · UI base en sus usos actuales (PLAN §3 F2): DesignCard, Chip, Button, Field, Badge, Section/Heading y Price.
 * Las tarjetas sin fotos dibujan el abanico NailSwatch hasta el placeholder 4:5 de W2-C; el camino de fotos reales
 * (prioridad, segunda foto) lo cubre también tests/unit/ui-f2.test.ts.
 * Las piezas que todavía no tienen usos (PriceTicker, StickyActionBar, BottomSheet, Segmented, Toast, NailSwatch,
 * ticket, Stamp) se prueban en tests/unit/ui-f2.test.ts; los specs de la ola 2 las cubren en su lugar.
 *
 * Contra el dev server: PW_BASE_URL=http://localhost:3000 pnpm exec playwright test tests/e2e/fundaciones-f2.spec.ts
 */

const CART = {
  state: {
    items: [
      {
        id: "f2a",
        kind: "design",
        designSlug: "kitty-leopard",
        name: "Kitty Leopard",
        unitPrice: 22000,
        qty: 1,
        sizes: { mode: "standard", size: "S" },
      },
    ],
  },
  version: 0,
};

async function withCart(page: Page) {
  await page.addInitScript((cart) => {
    try {
      localStorage.setItem("bf-cart-v1", JSON.stringify(cart));
    } catch {
      // sin almacenamiento: el test lo va a notar al no ver el formulario
    }
  }, CART);
}

/** Resuelve una expresión CSS (`var(--section-y)`) a px en un nodo de prueba. */
async function cssPx(page: Page, prop: string, value: string): Promise<number> {
  return page.evaluate(
    ({ prop, value }) => {
      const probe = document.createElement("div");
      probe.style.setProperty(prop, value);
      probe.style.position = "absolute";
      document.body.appendChild(probe);
      const px = parseFloat(getComputedStyle(probe).getPropertyValue(prop));
      probe.remove();
      return px;
    },
    { prop, value },
  );
}

const transitionOf = (l: Locator) => l.evaluate((el) => getComputedStyle(el).transitionProperty);

test.describe("W1-F2 · DesignCard", () => {
  test("foto 4:5, precio tipográfico dentro de la tarjeta, sin badge de complejidad", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/catalogo", { waitUntil: "networkidle" });
    const cards = page.locator('a[href^="/catalogo/"]:has(h3)');
    await expect(cards.first()).toBeVisible();
    const n = await cards.count();
    expect(n).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < Math.min(n, 6); i++) {
      const card = cards.nth(i);
      const m = await card.evaluate((a) => {
        const frame = a.querySelector("div.relative") as HTMLElement;
        const price = a.querySelector("[data-price]") as HTMLElement;
        const fr = frame.getBoundingClientRect();
        const cr = a.getBoundingClientRect();
        const pr = price.getBoundingClientRect();
        return {
          ratio: fr.width / fr.height,
          price: price.textContent,
          inside:
            pr.left >= cr.left - 0.5 &&
            pr.right <= cr.right + 0.5 &&
            pr.top >= cr.top - 0.5 &&
            pr.bottom <= cr.bottom + 0.5,
          badges: a.querySelectorAll(".text-label").length,
          titleFont: getComputedStyle(a.querySelector("h3")!).fontFamily,
          // `all` es el valor inicial (con 0 s): solo cuenta si además dura algo
          transitionAll: [a, ...a.querySelectorAll("*")].some((el) => {
            const cs = getComputedStyle(el);
            const props = cs.transitionProperty.split(",").map((p) => p.trim());
            const durs = cs.transitionDuration.split(",").map((d) => parseFloat(d));
            return props.some((p, k) => p === "all" && (durs[k % durs.length] ?? 0) > 0);
          }),
        };
      });
      expect(m.ratio, `tarjeta ${i}: proporción 4:5`).toBeCloseTo(0.8, 2);
      expect(m.price, `tarjeta ${i}: textContent del precio`).toMatch(/^\$\s?[\d.]+$/);
      expect(m.inside, `tarjeta ${i}: el precio queda dentro de la tarjeta`).toBe(true);
      expect(m.badges, `tarjeta ${i}: sin badges de complejidad`).toBe(0);
      expect(m.titleFont, `tarjeta ${i}: nombre en Figtree`).toMatch(/Figtree/i);
      expect(m.transitionAll, `tarjeta ${i}: nunca transition-all`).toBe(false);
    }
    expect(errors).toEqual([]);
  });

  test("con fotos: las primeras cargan con prioridad (sin `priority` deprecado); sin fotos: abanico centrado", async ({
    page,
  }) => {
    await page.goto("/catalogo", { waitUntil: "networkidle" });
    const cards = page.locator('a[href^="/catalogo/"]:has(h3)');
    await expect(cards.first()).toBeVisible();
    for (let i = 0; i < 6; i++) {
      const card = cards.nth(i);
      const photo = card.locator('img[alt]:not([alt=""])');
      if (await photo.count()) {
        // camino de fotos reales (la prueba unitaria lo cubre también con datos propios)
        await expect(photo).toHaveAttribute("loading", i < 4 ? "eager" : "lazy");
        if (i < 4) await expect(photo).toHaveAttribute("fetchpriority", "high");
        continue;
      }
      // puente hasta el placeholder 4:5 de W2-C: abanico NailSwatch con nombre accesible, centrado en el marco
      const name = (await card.locator("h3").textContent())!.trim();
      const swatch = card.locator('[data-card-placeholder] svg[data-nail-swatch][role="img"]');
      await expect(swatch).toHaveAttribute("aria-label", name);
      await expect(card.locator("img")).toHaveCount(0);
      const m = await card.evaluate((a) => {
        const frame = a.querySelector("div.relative")!.getBoundingClientRect();
        const s = a.querySelector("[data-card-placeholder] svg[data-nail-swatch]")!.getBoundingClientRect();
        return {
          dx: (s.left + s.width / 2 - (frame.left + frame.width / 2)) / frame.width,
          dy: (s.top + s.height / 2 - (frame.top + frame.height / 2)) / frame.height,
          w: s.width / frame.width,
        };
      });
      expect(Math.abs(m.dx), `tarjeta ${i}: abanico centrado en x`).toBeLessThan(0.04);
      expect(Math.abs(m.dy), `tarjeta ${i}: abanico centrado en y (no queda arriba)`).toBeLessThan(0.06);
      expect(m.w, `tarjeta ${i}: el abanico ocupa ~2/3 del ancho`).toBeGreaterThan(0.55);
    }
  });

  test("favorito: sticker con nombre accesible; segunda foto (o el abanico) solo con puntero fino", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/catalogo", { waitUntil: "networkidle" });
    const featured = page.locator('a[href="/catalogo/kitty-leopard"]').first();
    await expect(featured.locator(".sr-only", { hasText: "Favorito" })).toHaveCount(1);
    const swatch = featured.locator("[data-card-placeholder] svg[data-nail-swatch]");
    if (await swatch.count()) {
      // sin fotos no hay segunda imagen que bajar: con puntero fino el abanico crece y gira apenas
      await expect(featured.locator("img")).toHaveCount(0);
      if (!isMobile) {
        await featured.evaluate((el) => el.scrollIntoView({ block: "center" }));
        await featured.hover();
        await expect
          .poll(() => swatch.evaluate((el) => getComputedStyle(el).scale), { timeout: 3000 })
          .toBe("1.04");
      }
      return;
    }
    const second = featured.locator('img[alt=""]');
    if (isMobile) {
      // táctil: la segunda imagen ni se descarga (display: none + lazy)
      await expect(second).toBeHidden();
    } else {
      await featured.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await featured.hover();
      await expect
        .poll(() => second.evaluate((el) => Number(getComputedStyle(el).opacity)), {
          timeout: 3000,
        })
        .toBeGreaterThan(0.95);
    }
  });
});

test.describe("W1-F2 · Chip, Button, Badge", () => {
  test("Chip: objetivo táctil, toggle con aria-pressed y transiciones acotadas", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/catalogo", { waitUntil: "networkidle" });
    const chip = page.getByRole("button", { name: "Almendra", exact: true });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    const box = (await chip.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(isMobile ? 44 : 40);
    expect(await transitionOf(chip)).not.toContain("all");
    expect(await transitionOf(chip)).toContain("scale");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    // seleccionado: bordó con texto crema
    await expect
      .poll(() => chip.evaluate((el) => getComputedStyle(el).backgroundColor))
      .toBe("rgb(74, 14, 14)");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  test("Button: alto por tamaño, transiciones de propiedades individuales y foco global", async ({
    page,
  }) => {
    await page.goto("/talles", { waitUntil: "networkidle" });
    // locators CSS: el Reveal los tiene con visibility: hidden hasta que entran (getByRole no los vería)
    const primary = page.locator('main a[href="/catalogo"]', { hasText: "Ir al catálogo" });
    const secondary = page.locator('main a[href="/disena"]', { hasText: "Diseñá tu set" }).last();
    await primary.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(primary).toBeVisible();
    expect((await primary.boundingBox())!.height).toBeCloseTo(56, 0);
    expect((await secondary.boundingBox())!.height).toBeCloseTo(56, 0);
    const t = await transitionOf(primary);
    expect(t).not.toContain("all");
    for (const p of ["translate", "scale", "background-color", "box-shadow"])
      expect(t).toContain(p);
    // sin anillo propio: el foco lo pone la regla global (outline 2 px bordó, offset 3 px)
    await primary.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    const focus = await primary.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        style: cs.outlineStyle,
        width: cs.outlineWidth,
        offset: cs.outlineOffset,
        shadow: cs.boxShadow,
      };
    });
    expect(focus).toMatchObject({ style: "solid", width: "2px", offset: "3px" });
  });

  test("Badge: 24 px de alto y una sola línea; mayúsculas de 12 px y tags en minúscula de 13 px sin tracking ancho", async ({
    page,
  }) => {
    await page.goto("/catalogo/kitty-leopard", { waitUntil: "networkidle" });
    const read = (l: Locator) =>
      l.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          h: el.getBoundingClientRect().height,
          size: cs.fontSize,
          ws: cs.whiteSpace,
          tt: cs.textTransform,
          ls: parseFloat(cs.letterSpacing) || 0,
        };
      });
    const upper = page.locator("span.text-label", { hasText: "Premium" }).first();
    await expect(upper).toBeVisible();
    const u = await read(upper);
    expect(u).toMatchObject({ size: "12px", ws: "nowrap", tt: "uppercase" });
    expect(u.h).toBeCloseTo(24, 0);
    // el uso viejo className="normal-case" (tags) pasa a la receta en minúscula (regla §0 h: 13 px mínimo)
    const tag = page.locator("span.text-meta", { hasText: "animal print" }).first();
    const t = await read(tag);
    expect(t).toMatchObject({ size: "13px", ws: "nowrap", tt: "none" });
    expect(t.h).toBeCloseTo(24, 0);
    expect(t.ls).toBeLessThan(0.2);
  });
});

test.describe("W1-F2 · Field", () => {
  test("label, ayuda y error conectados; 16 px en el celular; error sin role=alert", async ({
    page,
    isMobile,
  }) => {
    const errors = collectErrors(page);
    await withCart(page);
    await page.goto("/checkout", { waitUntil: "networkidle" });
    const wa = page.locator("input#whatsapp");
    await expect(wa).toBeVisible();
    await expect(page.locator('label[for="whatsapp"]')).toHaveText("WhatsApp");
    await expect(wa).toHaveAttribute("aria-describedby", /whatsapp-hint/);
    await expect(page.locator("#whatsapp-hint")).toHaveText("Por acá confirmamos todo.");
    expect(await wa.evaluate((el) => getComputedStyle(el).fontSize)).toBe(
      isMobile ? "16px" : "15px",
    );
    expect((await wa.boundingBox())!.height).toBeCloseTo(48, 0);

    await page
      .getByRole("button", { name: /Confirmar pedido|Enviar pedido|Pagar con Mercado Pago/ })
      .click();
    const name = page.locator("input#name");
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAttribute("aria-describedby", /name-error/);
    const err = page.locator("#name-error");
    await expect(err).toBeVisible();
    await expect(err).not.toHaveAttribute("role", /.+/);
    await expect(err.locator('svg[data-icon="alert"]')).toHaveCount(1);
    // WhatsApp con error y ayuda: los dos ids en aria-describedby, el error primero
    await expect(wa).toHaveAttribute("aria-describedby", "whatsapp-error whatsapp-hint");
    // borde rojo (transición de 150 ms)
    await expect
      .poll(() => name.evaluate((el) => getComputedStyle(el).borderTopColor))
      .toBe("rgb(181, 28, 28)");
    await expectNoOverflowStrict(page);
    expect(errors).toEqual([]);
  });
});

test.describe("W1-F2 · Section y Heading", () => {
  test("ritmo vertical y escala de titulares por tokens", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const section = page.locator("section#destacados");
    await section.evaluate((el) => el.scrollIntoView({ block: "start" }));
    const sectionY = await cssPx(page, "padding-top", "var(--section-y)");
    const pad = await section.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop));
    expect(pad).toBeCloseTo(sectionY, 0);
    const h2 = section.locator("h2").first();
    const h2Size = await h2.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(h2Size).toBeCloseTo(await cssPx(page, "font-size", "var(--fs-h2)"), 0);
    expect(await h2.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/Imbue/i);

    await page.goto("/talles", { waitUntil: "networkidle" });
    const h1 = page.locator("h1").first();
    const h1Size = await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(h1Size).toBeCloseTo(await cssPx(page, "font-size", "var(--fs-h1)"), 0);
  });
});

test.describe("W1-F2 · sin desborde ni errores donde se usa la UI base", () => {
  for (const path of ["/catalogo", "/catalogo/kitty-leopard", "/disena", "/carrito"]) {
    test(`${path}`, async ({ page }) => {
      const errors = collectErrors(page);
      if (path === "/carrito") await withCart(page);
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("main")).toBeVisible();
      await expectNoOverflowStrict(page);
      expect(errors).toEqual([]);
    });
  }
});
