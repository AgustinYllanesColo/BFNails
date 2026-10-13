import { expect, type Page } from "@playwright/test";

export const PUBLIC_ROUTES = [
  { path: "/", name: "home" },
  { path: "/catalogo", name: "catálogo" },
  { path: "/catalogo/kitty-leopard", name: "detalle" },
  { path: "/disena", name: "armador" },
  { path: "/talles", name: "talles" },
  { path: "/faq", name: "preguntas" },
  { path: "/carrito", name: "carrito" },
  { path: "/checkout", name: "checkout" },
  { path: "/terminos", name: "términos" },
  { path: "/privacidad", name: "privacidad" },
  { path: "/arrepentimiento", name: "arrepentimiento" },
] as const;

/** Junta errores de consola y de página para fallar si aparecen. */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    // Ruido conocido del entorno que no es de la app
    if (/favicon|Download the React DevTools|net::ERR_BLOCKED_BY_CLIENT/i.test(text)) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

/** Ningún elemento puede desbordar el ancho del viewport (scroll horizontal). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "scroll horizontal en px").toBeLessThanOrEqual(1);
}

/** Vacía el carrito persistido para que cada test arranque limpio. */
export async function resetCart(page: Page) {
  await page.evaluate(() => localStorage.removeItem("bf-cart-v1"));
}
