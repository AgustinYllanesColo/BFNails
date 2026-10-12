import { createRequire } from "node:module";
import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { collectErrors } from "./helpers";
import { expectNoOverflowStrict } from "./lib/overflow";

/**
 * W1-F3 · Primitivas de movimiento (PLAN §3 F3, §2.5 y criterios de aceptación W1): Reveal, WordReveal + Brush,
 * Marquee, Stars, SmoothScroll, AmbientZone, FlyToCart y la pausa manual. Corre contra el dev server:
 *   PW_BASE_URL=http://localhost:3000 pnpm exec playwright test tests/e2e/fundaciones-f3.spec.ts
 */

const IDENTITY = new Set(["none", "matrix(1, 0, 0, 1, 0, 0)"]);

/** Recorre la página entera en pasos (dispara cada ScrollTrigger) hasta el final. */
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

/**
 * Estado final de todo lo que anima una entrada. `[data-reveal]` y `[data-wi]`: opacidad y transform computados.
 * Los hijos de un Reveal con `stagger` pueden tener opacidad propia (de diseño): de ellos se mira que GSAP no haya
 * dejado estilos en línea (al terminar limpia con `clearProps`).
 */
function entranceState(page: Page) {
  return page.evaluate(() => {
    const label = (el: HTMLElement) =>
      `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 24)}"`;
    const own = [...document.querySelectorAll<HTMLElement>("[data-reveal], [data-wi]")].map(
      (el) => {
        const cs = getComputedStyle(el);
        return {
          what: `${el.hasAttribute("data-wi") ? "[data-wi]" : "[data-reveal]"} ${label(el)}`,
          opacity: cs.opacity,
          visibility: cs.visibility,
          transform: cs.transform,
        };
      },
    );
    const children = [...document.querySelectorAll<HTMLElement>("[data-reveal] > *")].map((el) => ({
      what: `hijo de [data-reveal] ${label(el)}`,
      inline: ["opacity", "visibility", "transform"]
        .filter((prop) => el.style.getPropertyValue(prop) !== "")
        .map((prop) => `${prop}: ${el.style.getPropertyValue(prop)}`)
        .join("; "),
    }));
    return { own, children };
  });
}

/**
 * Espera a que hidrate (Lenis pone `html.lenis` en el mismo pase de efectos en que FlyLayer empieza a escuchar) y
 * saca las bolsitas reales (W2-A) para controlar el destino.
 */
const isolate = async (page: Page) => {
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  await page.evaluate(() => {
    document
      .querySelectorAll("[data-cart-target]")
      .forEach((el) => el.removeAttribute("data-cart-target"));
    const w = window as unknown as { __bumps: number };
    w.__bumps = 0;
    window.addEventListener("bf:cart-bump", () => w.__bumps++);
  });
};
const bumps = (page: Page) =>
  page.evaluate(() => (window as unknown as { __bumps: number }).__bumps);
const fly = (page: Page) =>
  page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("bf:fly", {
        detail: { from: { x: 120, y: 520 }, base: "#b51c1c", shape: "almendra" },
      }),
    ),
  );

function marqueeTracks(page: Page) {
  return page.locator('[data-ambient="marquee"][style*="--speed"]');
}

/* ---------- laboratorio de F3 (tests/e2e/fixtures/motion-lab.tsx) ---------- */

const ROOT = path.resolve(__dirname, "..", "..");
const LAB_ENTRY = path.join(__dirname, "fixtures", "motion-lab.tsx");
type Esbuild = {
  build(options: Record<string, unknown>): Promise<{ outputFiles: { text: string }[] }>;
};
let labBundle: Promise<string> | undefined;

/** Empaqueta el laboratorio una vez por worker, con el esbuild que ya trae `tsx` (devDependency del repo). */
function bundleLab(): Promise<string> {
  labBundle ??= (async () => {
    const tsx = createRequire(path.join(ROOT, "package.json")).resolve("tsx/package.json");
    const esbuild = createRequire(tsx)("esbuild") as Esbuild;
    const out = await esbuild.build({
      entryPoints: [LAB_ENTRY],
      bundle: true,
      write: false,
      format: "esm",
      platform: "browser",
      jsx: "automatic",
      alias: { "@": ROOT },
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "silent",
    });
    return out.outputFiles[0].text;
  })();
  return labBundle;
}

/**
 * Abre el laboratorio en `/__f3-lab` del mismo servidor (interceptado: la app no tiene esa ruta) con el CSS, las
 * fuentes y las clases de `<html>`/`<body>` que sirve la app real.
 */
async function openLab(page: Page) {
  const js = await bundleLab();
  const app = await (await page.request.get("/terminos")).text();
  const links = (app.match(/<link\b[^>]*>/g) ?? []).filter((l) => /rel="stylesheet"/.test(l));
  const htmlClass = app.match(/<html[^>]*\sclass="([^"]*)"/)?.[1] ?? "";
  const bodyClass = app.match(/<body[^>]*\sclass="([^"]*)"/)?.[1] ?? "";
  const html = `<!doctype html><html lang="es-AR" class="${htmlClass}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${links.join("")}</head><body class="${bodyClass}"><div id="lab"></div><script type="module" src="/__f3-lab.js"></script></body></html>`;
  await page.route("**/__f3-lab", (r) =>
    r.fulfill({ contentType: "text/html; charset=utf-8", body: html }),
  );
  await page.route("**/__f3-lab.js", (r) =>
    r.fulfill({ contentType: "text/javascript; charset=utf-8", body: js }),
  );
  await page.goto("/__f3-lab", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll("[data-brush]").length === 6);
  // con la fuente final, el laboratorio refresca ScrollTrigger (como SmoothScroll en la app)
  await page.evaluate(() => (window as unknown as { __labReady: Promise<void> }).__labReady);
}

/** Lleva el borde de arriba del titular de `inside` a `at` × alto del viewport y espera al scrub (.6 s). */
async function scrollHeadingTo(page: Page, inside: Locator, at: number) {
  await inside.evaluate((el, at) => {
    const h = el.closest("h1, h2, h3") ?? el;
    window.scrollTo(0, window.scrollY + h.getBoundingClientRect().top - innerHeight * at);
  }, at);
  await page.waitForTimeout(1300);
}

/** `stroke-dashoffset` computado del trazo de una pincelada (1 = sin pintar, 0 = pintada). */
const strokeOffset = (brush: Locator) =>
  brush
    .locator("[data-stroke]")
    .evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset));

test.describe("Reveal (F3.1)", () => {
  test("/talles: lo que está en el primer viewport nunca se esconde al hidratar", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    // Muestreo desde el primer paint: opacidad mínima de cada [data-reveal] (y sus hijos) que está en pantalla.
    await page.addInitScript(() => {
      const w = window as unknown as {
        __revealMin: number;
        __revealAt: Record<number, number>;
        __revealSeen: number;
      };
      w.__revealMin = 1;
      w.__revealAt = {};
      w.__revealSeen = 0;
      const marks = [300, 900, 1500];
      const sample = () => {
        let min = 1;
        let seen = 0;
        // Lo que GSAP esconde lleva opacidad/visibilidad en línea: cualquier valor < 1 en pantalla es un parpadeo.
        // Del contenedor se mira además la opacidad computada (los hijos pueden tener la suya de diseño).
        for (const el of document.querySelectorAll<HTMLElement>(
          "[data-reveal], [data-reveal] > *",
        )) {
          const r = el.getBoundingClientRect();
          if (r.height === 0 || r.bottom <= 0 || r.top >= innerHeight) continue;
          seen++;
          const inline = el.style.opacity === "" ? 1 : parseFloat(el.style.opacity);
          min = Math.min(min, el.style.visibility === "hidden" ? 0 : inline);
          if (el.hasAttribute("data-reveal"))
            min = Math.min(min, parseFloat(getComputedStyle(el).opacity));
        }
        return { min, seen };
      };
      const loop = () => {
        const t = performance.now();
        const { min, seen } = sample();
        if (seen) {
          w.__revealSeen = Math.max(w.__revealSeen, seen);
          w.__revealMin = Math.min(w.__revealMin, min);
          for (const m of marks) if (t >= m && w.__revealAt[m] === undefined) w.__revealAt[m] = min;
        }
        if (t < 1700) requestAnimationFrame(loop);
      };
      document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(loop));
    });
    await page.goto("/talles");
    await page.waitForTimeout(1900);
    const r = await page.evaluate(() => {
      const w = window as unknown as {
        __revealMin: number;
        __revealAt: Record<number, number>;
        __revealSeen: number;
      };
      return { min: w.__revealMin, at: w.__revealAt, seen: w.__revealSeen };
    });
    expect(r.seen, "hay [data-reveal] en el primer viewport").toBeGreaterThan(0);
    expect(r.at, "opacidad a 300/900/1500 ms").toEqual({ 300: 1, 900: 1, 1500: 1 });
    expect(r.min, "opacidad mínima en cualquier frame").toBe(1);
    expect(errors).toEqual([]);
  });

  test("lo que estaba fuera de vista entra al scrollear y termina limpio", async ({ page }) => {
    await page.goto("/talles", { waitUntil: "networkidle" });
    const below = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(
          (el) => el.getBoundingClientRect().top > innerHeight,
        ).length,
    );
    test.skip(below === 0, "sin [data-reveal] debajo del pliegue");
    await scrollThrough(page);
    await page.waitForTimeout(1200);
    const { own, children } = await entranceState(page);
    for (const s of own) {
      expect(s.opacity, s.what).toBe("1");
      expect(s.visibility, s.what).toBe("visible");
      expect(IDENTITY.has(s.transform), `${s.what}: transform ${s.transform}`).toBe(true);
    }
    // clearProps: al terminar no quedan estilos en línea de GSAP
    for (const c of children) expect(c.inline, c.what).toBe("");
  });
});

test.describe("pausa manual (F3, WCAG 2.2.2)", () => {
  test("con bf-motion=paused la home queda entera visible y las cintas quietas", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/terminos");
    await page.evaluate(() => localStorage.setItem("bf-motion", "paused"));
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("data-motion", "paused");
    await scrollThrough(page);
    await page.waitForTimeout(1300);

    const { own, children } = await entranceState(page);
    expect(own.length).toBeGreaterThan(0);
    for (const s of own) {
      expect(s.opacity, s.what).toBe("1");
      expect(IDENTITY.has(s.transform), `${s.what}: transform ${s.transform}`).toBe(true);
    }
    for (const c of children) expect(c.inline, c.what).toBe("");
    const tracks = await marqueeTracks(page).evaluateAll((els) =>
      els.map((el) => ({
        state: getComputedStyle(el).animationPlayState,
        rate: el.getAnimations()[0]?.playbackRate,
      })),
    );
    expect(tracks.length).toBeGreaterThan(0);
    for (const t of tracks) expect(t).toEqual({ state: "paused", rate: 1 });
    await page.evaluate(() => localStorage.removeItem("bf-motion"));
    expect(errors).toEqual([]);
  });
});

test.describe("cinta (F3.4)", () => {
  test("pista con --speed y data-ambient; cada copia cubre la cinta", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const tracks = await marqueeTracks(page).evaluateAll((els) =>
      els.map((t) => {
        const root = t.closest("[aria-hidden]") as HTMLElement;
        const a = t.getAnimations()[0] as CSSAnimation | undefined;
        return {
          name: a?.animationName,
          iterations: a?.effect?.getComputedTiming().iterations,
          copy: t.scrollWidth / 2,
          lane: root.clientWidth,
        };
      }),
    );
    expect(tracks.length, "cinta de la home + cinta del footer").toBeGreaterThanOrEqual(2);
    for (const t of tracks) {
      expect(t.name).toBe("marquee");
      expect(t.iterations).toBe(Infinity);
      expect(t.copy, "una copia cubre el ancho de la cinta").toBeGreaterThanOrEqual(t.lane);
    }
  });

  test("fuera de vista se pausa y vuelve a correr al entrar", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const footerTrack = page.locator('footer [data-ambient="marquee"]').first();
    await expect(footerTrack).toHaveCSS("animation-play-state", "paused");
    await footerTrack.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(footerTrack).toHaveCSS("animation-play-state", "running");
    const a = await footerTrack.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(600);
    const b = await footerTrack.evaluate((el) => getComputedStyle(el).transform);
    expect(a).not.toBe(b);
  });

  test("después de subir rápido sigue en movimiento y vuelve a playbackRate > 0", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/", { waitUntil: "networkidle" });
    const vp = page.viewportSize()!;
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(2000);
    await page.mouse.move(vp.width / 2, vp.height / 2);
    // 3000 px de rueda para arriba en ~1 s (la emulación móvil divide el delta de la rueda por el devicePixelRatio)
    const dpr = await page.evaluate(() => devicePixelRatio);
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -300 * dpr);
      await page.waitForTimeout(100);
    }
    const track = marqueeTracks(page).first();
    const t0 = await track.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(500);
    const t1 = await track.evaluate((el) => getComputedStyle(el).transform);
    expect(t1, "la pista se mueve después de soltar").not.toBe(t0);
    await page.waitForTimeout(500);
    const after = await track.evaluate((el) => ({
      rate: el.getAnimations()[0]?.playbackRate ?? 0,
      state: getComputedStyle(el).animationPlayState,
    }));
    expect(after.rate, "un segundo después vuelve a avanzar").toBeGreaterThan(0);
    expect(after.state).toBe("running");
    expect(errors).toEqual([]);
  });

  test("sin reduced-motion la rueda sí se suaviza (control)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      const w = window as unknown as { __smooth: boolean };
      w.__smooth = false;
      new MutationObserver(() => {
        if (document.documentElement.classList.contains("lenis-smooth")) w.__smooth = true;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    });
    const vp = page.viewportSize()!;
    await page.mouse.move(vp.width / 2, vp.height / 2);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as unknown as { __smooth: boolean }).__smooth)).toBe(
      true,
    );
  });

  test("/ sin desborde horizontal con las cintas (estricto)", async ({ page, isMobile }) => {
    test.skip(!isMobile, "solo celulares");
    await page.goto("/", { waitUntil: "networkidle" });
    await scrollThrough(page, { step: 700, pause: 60 });
    await expectNoOverflowStrict(page);
  });
});

test.describe("Stars (F3.5)", () => {
  test("≤ 56 px en celular, respiración en su propio nodo y sin salto al hidratar", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/catalogo", { waitUntil: "networkidle" });
    const stars = await page.locator("[data-star]").evaluateAll((els) =>
      els.map((outer) => {
        const amb = outer.querySelector<HTMLElement>('[data-ambient="move"]')!;
        return {
          visible: amb.offsetWidth > 0,
          size: amb.offsetWidth, // tamaño de layout (sin la rotación ni la respiración)
          anim: getComputedStyle(amb).animationName,
          outer: getComputedStyle(outer).transform,
        };
      }),
    );
    expect(stars.length).toBeGreaterThan(0);
    for (const s of stars.filter((s) => s.visible)) {
      expect(s.anim).toBe("breathe");
      expect(IDENTITY.has(s.outer), `parallax en 0 al cargar (${s.outer})`).toBe(true);
      if (isMobile) expect(s.size).toBeLessThanOrEqual(56);
    }
  });

  test("el parallax sigue al scroll", async ({ page }) => {
    await page.goto("/catalogo", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 260));
    await page.waitForTimeout(900);
    const moved = await page
      .locator("[data-star]")
      .first()
      .evaluate((el) => getComputedStyle(el).transform);
    expect(IDENTITY.has(moved), `se movió (${moved})`).toBe(false);
  });
});

test.describe("FlyToCart (F3.8)", () => {
  test("sin bolsita visible: sin vuelo y el evento sale en el acto", async ({ page }) => {
    await page.goto("/terminos", { waitUntil: "networkidle" });
    await isolate(page);
    await fly(page);
    expect(await bumps(page)).toBe(1);
    await expect(page.locator("[data-fly-layer]")).toHaveCount(0);
  });

  test("con bolsita: la ficha vuela, la bolsita rebota al llegar y la capa se va", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/terminos", { waitUntil: "networkidle" });
    await isolate(page);
    await page.evaluate(() => {
      const t = document.createElement("span");
      t.id = "fake-bag";
      t.setAttribute("data-cart-target", "");
      t.style.cssText = "position:fixed;top:20px;right:20px;width:40px;height:40px;z-index:70";
      document.body.appendChild(t);
      // el squash dura 420 ms: se mira en el momento del evento, no cuando el poll de abajo se entera
      const w = window as unknown as { __squash: number };
      w.__squash = -1;
      window.addEventListener("bf:cart-bump", () => (w.__squash = t.getAnimations().length), {
        once: true,
      });
    });
    await fly(page);
    await expect(page.locator("[data-fly-layer]")).toHaveCount(1);
    await page.waitForTimeout(150);
    expect(await bumps(page), "todavía en el aire").toBe(0);
    await expect.poll(() => bumps(page), { timeout: 2000 }).toBe(1);
    expect(
      await page.evaluate(() => (window as unknown as { __squash: number }).__squash),
      "squash de la bolsita",
    ).toBeGreaterThan(0);
    await expect(page.locator("[data-fly-layer]")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("el arco: sube, pasa al lado de la bolsita y entra justo cuando la bolsita reacciona", async ({
    page,
    isMobile,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/terminos", { waitUntil: "networkidle" });
    await isolate(page);
    // La bolsita real del nav (W2-A le pone `data-cart-target` al wrapper del ícono; acá, al link).
    const bag = await page.evaluate(() => {
      const el = [...document.querySelectorAll<HTMLElement>('header a[href="/carrito"]')].find(
        (a) => a.getBoundingClientRect().width > 0,
      )!;
      el.setAttribute("data-cart-target", "");
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
    });
    const vp = page.viewportSize()!;
    const origins = [
      { name: "botón de abajo al centro", x: vp.width / 2, y: vp.height - 44 },
      { name: "justo debajo de la bolsita", x: bag.x, y: vp.height - 60 },
      ...(isMobile ? [] : [{ name: "tarjeta arriba a la izquierda", x: vp.width * 0.2, y: 300 }]),
    ];

    for (const from of origins) {
      const f = await page.evaluate(async ({ x, y }) => {
        const target = document.querySelector<HTMLElement>("[data-cart-target]")!;
        const w = window as unknown as { __bumpFrame: number };
        w.__bumpFrame = -1;
        window.addEventListener(
          "bf:cart-bump",
          () => (w.__bumpFrame = Number(document.timeline.currentTime)),
          { once: true },
        );
        window.dispatchEvent(
          new CustomEvent("bf:fly", {
            detail: { from: { x, y }, base: "#b51c1c", shape: "almendra" },
          }),
        );
        // La ficha y sus dos animaciones (recorrido y pose) arrancan en el efecto de montaje.
        let chip: HTMLElement | null = null;
        let anims: Animation[] = [];
        for (let i = 0; i < 120 && anims.length < 2; i++) {
          await new Promise(requestAnimationFrame);
          chip = document.querySelector<HTMLElement>("[data-fly-chip]");
          anims = chip ? [...chip.parentElement!.getAnimations(), ...chip.getAnimations()] : [];
        }
        if (!chip || anims.length !== 2) throw new Error("no salió la ficha");
        // Muestreo determinista: pausa las dos animaciones y las lleva a cada instante.
        anims.forEach((a) => a.pause());
        const duration = Number(anims[0].effect!.getComputedTiming().duration);
        const samples: {
          ms: number;
          x: number;
          y: number;
          top: number;
          size: number;
          opacity: number;
        }[] = [];
        for (let ms = 0; ms <= duration; ms += 5) {
          anims.forEach((a) => (a.currentTime = ms));
          const q = chip.getBoundingClientRect();
          samples.push({
            ms,
            x: q.left + q.width / 2,
            y: q.top + q.height / 2,
            top: q.top,
            size: q.width,
            opacity: Number(getComputedStyle(chip).opacity),
          });
        }
        // Y ahora el vuelo de verdad, desde el principio: ¿en qué frame reacciona la bolsita?
        anims.forEach((a) => {
          a.currentTime = 0;
          a.play();
        });
        await Promise.all(anims.map((a) => a.ready));
        const end = Number(anims[0].startTime) + duration;
        for (let i = 0; i < 200 && w.__bumpFrame < 0; i++) await new Promise(requestAnimationFrame);
        return {
          duration,
          samples,
          late: w.__bumpFrame - end,
          squash: target.getAnimations().length,
        };
      }, from);

      const at = (s: { x: number; y: number }) => Math.hypot(s.x - bag.x, s.y - bag.y);
      const cut = 0.85 * f.duration;
      const early = f.samples.filter((s) => s.ms <= cut);
      const last = f.samples[f.samples.length - 1];
      const where = `${from.name} (${Math.round(from.x)}, ${Math.round(from.y)})`;

      expect(f.duration, where).toBe(560);
      // no se queda encima de la bolsita: a más de 10 px del centro hasta el 85 % del vuelo, y afuera del círculo
      const near = f.samples.find((s) => at(s) <= 10);
      expect(near?.ms ?? f.duration, `${where}: llega a 10 px del centro`).toBeGreaterThanOrEqual(cut);
      for (const s of early)
        expect(at(s), `${where}: a ${s.ms} ms ya está sobre el ícono`).toBeGreaterThan(bag.r);
      // arco visible que entra por arriba, sin salirse de la pantalla
      expect(Math.min(...f.samples.map((s) => s.y)), `${where}: tope del arco`).toBeLessThan(
        bag.y - 12,
      );
      for (const s of f.samples) {
        expect(s.top, `${where}: se sale por arriba a ${s.ms} ms`).toBeGreaterThanOrEqual(0);
        expect(s.x, `${where}: se sale de costado a ${s.ms} ms`).toBeGreaterThan(0);
        expect(s.x, `${where}: se sale de costado a ${s.ms} ms`).toBeLessThan(vp.width);
      }
      // se ve entera hasta el 85 % (opaca, ≥ .6 × 36 px) y desaparece adentro de la bolsita al final
      for (const s of early) {
        expect(s.opacity, `${where}: opacidad a ${s.ms} ms`).toBeGreaterThan(0.99);
        expect(s.size, `${where}: tamaño a ${s.ms} ms`).toBeGreaterThanOrEqual(36 * 0.6);
      }
      expect(at(last), `${where}: termina en el centro`).toBeLessThanOrEqual(4);
      expect(last.opacity, `${where}: termina invisible`).toBeLessThan(0.05);
      // la bolsita reacciona en el mismo momento en que la ficha entra (< 50 ms)
      expect(f.late, `${where}: bf:cart-bump respecto del final del vuelo`).toBeGreaterThanOrEqual(-1);
      expect(f.late, `${where}: bf:cart-bump respecto del final del vuelo`).toBeLessThan(50);
      expect(f.squash, `${where}: squash de la bolsita`).toBeGreaterThan(0);
      await expect(page.locator("[data-fly-layer]")).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
});

test.describe("SmoothScroll (F3.6)", () => {
  test("una ruta nueva arranca arriba y volver atrás conserva la posición", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/", { waitUntil: "networkidle" });
    const link = page.locator('main a[href="/catalogo"]').first();
    test.skip((await link.count()) === 0, "la home no tiene un link interno a /catalogo");
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(500);
    const y0 = await page.evaluate(() => scrollY);
    await link.evaluate((a) => (a as HTMLAnchorElement).click());
    await page.waitForURL("**/catalogo");
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await page.goBack();
    await page.waitForURL((u) => u.pathname === "/");
    await page.waitForTimeout(900);
    expect(Math.abs((await page.evaluate(() => scrollY)) - y0)).toBeLessThan(80);
    expect(errors).toEqual([]);
  });

  test("un popstate dentro de la misma página (un ancla) no confunde a la navegación siguiente", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const link = page.locator('main a[href="/catalogo"]').first();
    test.skip((await link.count()) === 0, "la home no tiene un link interno a /catalogo");
    // atrás desde un ancla: popstate sin cambio de ruta
    await page.evaluate(() => {
      location.hash = "f3-ancla";
    });
    await page.evaluate(() => history.back());
    await page.waitForFunction(() => location.hash === "");
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(300);
    // enseguida: no es "atrás", así que arranca arriba (guarda de regresión; el router de Next también sube solo en
    // una navegación nueva, así que esto solo falla si SmoothScroll se pone a restaurar una posición vieja)
    await link.evaluate((a) => (a as HTMLAnchorElement).click());
    await page.waitForURL("**/catalogo");
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });
});

test.describe("WordReveal + Brush en las rutas (F3.2–F3.3)", () => {
  test("donde se usan, los titulares terminan en su lugar y la pincelada pintada", async ({
    page,
  }) => {
    const found: string[] = [];
    for (const path of ["/", "/catalogo", "/disena", "/talles", "/faq", "/carrito"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      const n = await page.locator("[data-wi], [data-brush]").count();
      if (n === 0) continue;
      found.push(path);
      // a mitad del recorrido (`top 80%` → `top 50%`) la primera pincelada scrub está a mitad de pintar
      const scrub = page.locator('[data-brush="scrub"]').first();
      if ((await scrub.count()) > 0) {
        await scrollHeadingTo(page, scrub, 0.65);
        const mid = await strokeOffset(scrub);
        expect(mid, `${path}: offset a mitad de camino (${mid})`).toBeGreaterThan(0);
        expect(mid, `${path}: offset a mitad de camino (${mid})`).toBeLessThan(1);
      }
      await scrollThrough(page);
      await page.waitForTimeout(1300);
      const words = await page
        .locator("[data-wi]")
        .evaluateAll((els) =>
          els.map((el) => [
            el.textContent,
            getComputedStyle(el).transform,
            getComputedStyle(el).opacity,
          ]),
        );
      for (const [text, transform, opacity] of words) {
        expect(IDENTITY.has(transform as string), `${path} "${text}" ${transform}`).toBe(true);
        expect(opacity, `${path} "${text}"`).toBe("1");
      }
      const strokes = await page
        .locator("[data-brush] [data-stroke]")
        .evaluateAll((els) =>
          els.map((el) => [
            el.closest("[data-brush]")!.textContent,
            getComputedStyle(el).strokeDashoffset,
          ]),
        );
      for (const [text, offset] of strokes)
        expect(offset, `${path} pincelada "${text}"`).toBe("0px");
    }
    test.skip(
      found.length === 0,
      "ninguna ruta usa WordReveal ni Brush todavía (los adopta la ola 2; el laboratorio de abajo los cubre)",
    );
  });
});

test.describe("WordReveal + Brush + ráfaga en el laboratorio (F3.2, F3.3, F2.16)", () => {
  test("lo que se ve al montar no se mueve; lo de abajo espera atrás de su máscara", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    // Cualquier estilo en línea sobre una palabra del titular del primer viewport es un salto visible.
    await page.addInitScript(() => {
      const w = window as unknown as { __touched: string[] };
      w.__touched = [];
      new MutationObserver((records) => {
        for (const r of records) {
          const el = r.target as HTMLElement;
          if (el.hasAttribute("data-wi") && el.closest("#lab-first"))
            w.__touched.push(`${el.textContent}: ${el.getAttribute("style")}`);
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ["style"] });
    });
    await openLab(page);
    await page.waitForTimeout(1500);
    expect(
      await page.evaluate(() => (window as unknown as { __touched: string[] }).__touched),
    ).toEqual([]);
    const below = await page
      .locator("#lab-teaser [data-wi]")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).transform));
    expect(below.length).toBe(5);
    for (const t of below) expect(IDENTITY.has(t), `escondida atrás de la máscara (${t})`).toBe(false);
    expect(errors).toEqual([]);
  });

  test("las palabras entran al scrollear y terminan en su lugar, sin estilos en línea", async ({
    page,
  }) => {
    await openLab(page);
    await scrollThrough(page);
    await page.waitForTimeout(1400);
    const words = await page.locator("[data-wi]").evaluateAll((els) =>
      els.map((el) => ({
        what: el.textContent,
        transform: getComputedStyle(el).transform,
        opacity: getComputedStyle(el).opacity,
        inline: el.getAttribute("style") ?? "",
      })),
    );
    expect(words.length).toBeGreaterThan(10);
    for (const w of words) {
      expect(IDENTITY.has(w.transform), `"${w.what}" ${w.transform}`).toBe(true);
      expect(w.opacity, `"${w.what}"`).toBe("1");
      expect(w.inline, `"${w.what}": clearProps`).toBe("");
    }
  });

  test("scrub: la pincelada se pinta junto con el scroll y el brillo pasa al completarse", async ({
    page,
  }) => {
    await openLab(page);
    const brush = page.locator('#lab-teaser [data-brush="scrub"]');
    const offsets: number[] = [];
    for (const at of [0.75, 0.65, 0.55]) {
      await scrollHeadingTo(page, brush, at);
      offsets.push(await strokeOffset(brush));
    }
    // progreso esperado (.8 − top) / .3 → offset ≈ .83, .5, .17: nunca 0 ni 1 a mitad de camino
    for (const o of offsets) {
      expect(o, `offsets ${offsets.join(", ")}`).toBeGreaterThan(0.05);
      expect(o, `offsets ${offsets.join(", ")}`).toBeLessThan(0.95);
    }
    expect(offsets[0]).toBeGreaterThan(offsets[1]);
    expect(offsets[1]).toBeGreaterThan(offsets[2]);
    expect(Math.abs(offsets[1] - 0.5), `a mitad de camino, a mitad (${offsets[1]})`).toBeLessThan(
      0.15,
    );
    expect(await brush.getAttribute("data-shine"), "sin brillo con el trazo a medio pintar").toBe(
      null,
    );

    await scrollHeadingTo(page, brush, 0.3);
    expect(await strokeOffset(brush)).toBe(0);
    await expect(brush).toHaveAttribute("data-shine", "1");
    const shine = brush.locator("[data-shine]");
    await expect
      .poll(() => shine.evaluate((el) => getComputedStyle(el).animationName))
      .toBe("brush-draw");
  });

  test("view se pinta al entrar en vista y load al cargar", async ({ page }) => {
    await openLab(page);
    const load = page.locator('#lab-top [data-brush="load"] [data-stroke]');
    await expect.poll(() => load.evaluate((el) => getComputedStyle(el).strokeDashoffset)).toBe(
      "0px",
    );
    const view = page.locator('#lab-faq [data-brush="view"]');
    expect(await view.getAttribute("data-drawn")).toBe(null);
    expect(await strokeOffset(view)).toBe(1);
    await view.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(view).toHaveAttribute("data-drawn", "1");
    await expect.poll(() => strokeOffset(view)).toBe(0);
  });

  test("la pincelada no tapa el espacio con la palabra anterior", async ({ page }) => {
    await openLab(page);
    const boxes = await page.locator("[data-brush]").evaluateAll((els) =>
      els.map((el) => {
        const word = el.getBoundingClientRect();
        const svg = el.querySelector("svg")!.getBoundingClientRect();
        return { what: el.textContent, word: [word.left, word.right], svg: [svg.left, svg.right] };
      }),
    );
    expect(boxes.length).toBe(6);
    for (const b of boxes) {
      // a la izquierda arranca adentro de la palabra (la punta redonda queda dentro del viewBox, ver Brush.tsx)
      expect(b.svg[0], `"${b.what}" izquierda`).toBeGreaterThanOrEqual(b.word[0] - 0.5);
      // a la derecha, el remate se pasa apenas (≤ 6 % del ancho)
      const w = b.word[1] - b.word[0];
      expect(b.svg[1] - b.word[1], `"${b.what}" derecha`).toBeLessThanOrEqual(w * 0.06);
    }
  });

  test("con la pausa manual todo queda visible y en su lugar", async ({ page }) => {
    await page.addInitScript(() => {
      document.documentElement.dataset.motion = "paused";
    });
    await openLab(page);
    await scrollThrough(page);
    await page.waitForTimeout(1400);
    const { own } = await entranceState(page);
    expect(own.length).toBeGreaterThan(10);
    for (const s of own) {
      expect(s.opacity, s.what).toBe("1");
      expect(IDENTITY.has(s.transform), `${s.what}: transform ${s.transform}`).toBe(true);
    }
    const strokes = await page
      .locator("[data-brush] [data-stroke]")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).strokeDashoffset));
    expect(strokes).toEqual(Array(6).fill("0px"));
  });

  test("la ráfaga se lee: estrellas opacas y de tamaño completo mientras vuelan, y se va sola", async ({
    page,
  }) => {
    await openLab(page);
    const sample = await page.evaluate(async () => {
      const btn = document.getElementById("lab-burst")!;
      const o = btn.getBoundingClientRect();
      const cx = o.left + o.width / 2;
      const cy = o.top + o.height / 2;
      btn.click();
      await new Promise((r) => setTimeout(r, 170));
      const stars = [...document.querySelectorAll<SVGSVGElement>("[data-star-burst] svg")];
      return stars.map((s) => {
        const r = s.getBoundingClientRect();
        return {
          opacity: parseFloat(getComputedStyle(s).opacity),
          side: Number(s.getAttribute("width")),
          drawn: Math.max(r.width, r.height),
          dist: Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy),
        };
      });
    });
    expect(sample.length).toBe(8);
    for (const s of sample) {
      expect(s.side, "lado de 10 a 18 px").toBeGreaterThanOrEqual(10);
      expect(s.opacity, "opaca a los 170 ms").toBeGreaterThan(0.95);
      // a escala ≥ .9 (la rotación agranda la caja, no la achica)
      expect(s.drawn, `dibujada a ${s.drawn} px de ${s.side}`).toBeGreaterThanOrEqual(s.side * 0.9);
      expect(s.dist, "ya salió del centro").toBeGreaterThan(25);
    }
    await expect(page.locator("[data-star-burst]")).toHaveCount(0, { timeout: 2000 });
  });
});

test.describe("con reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("la cinta sigue (más lenta) y la rueda no se suaviza", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const track = marqueeTracks(page).first();
    const timing = await track.evaluate(
      (el) => el.getAnimations()[0]?.effect?.getComputedTiming().duration,
    );
    const speed = await track.evaluate((el) => parseFloat(el.style.getPropertyValue("--speed")));
    expect(timing, "3× más lenta (--marquee-k: 3)").toBe(speed * 3 * 1000);
    const a = await track.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(700);
    const b = await track.evaluate((el) => getComputedStyle(el).transform);
    expect(a).not.toBe(b);

    // Lenis marca html.lenis-smooth solo mientras suaviza la rueda: con reduced-motion nunca pasa.
    await page.evaluate(() => {
      const w = window as unknown as { __smooth: boolean };
      w.__smooth = false;
      new MutationObserver(() => {
        if (document.documentElement.classList.contains("lenis-smooth")) w.__smooth = true;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    });
    const vp = page.viewportSize()!;
    await page.mouse.move(vp.width / 2, vp.height / 2);
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
    expect(await page.evaluate(() => (window as unknown as { __smooth: boolean }).__smooth)).toBe(
      false,
    );
  });

  test("las estrellas siguen respirando pero sin parallax", async ({ page }) => {
    await page.goto("/catalogo", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 260));
    await page.waitForTimeout(900);
    const star = await page
      .locator("[data-star]")
      .first()
      .evaluate((el) => ({
        outer: getComputedStyle(el).transform,
        breathe: getComputedStyle(el.querySelector('[data-ambient="move"]')!).animationPlayState,
      }));
    expect(IDENTITY.has(star.outer), `quieto (${star.outer})`).toBe(true);
    expect(star.breathe).toBe("running");
  });

  test("laboratorio: las palabras no se mueven, las pinceladas ya están pintadas y sin ráfaga", async ({
    page,
  }) => {
    await openLab(page);
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => ({
      words: [...document.querySelectorAll("[data-wi]")].map((el) => getComputedStyle(el).transform),
      strokes: [...document.querySelectorAll("[data-brush] [data-stroke]")].map(
        (el) => getComputedStyle(el).strokeDashoffset,
      ),
      shines: [...document.querySelectorAll("[data-brush] [data-shine]")].map(
        (el) => getComputedStyle(el).display,
      ),
      teaser: getComputedStyle(document.querySelector("#lab-teaser h2")!).opacity,
    }));
    for (const t of before.words) expect(IDENTITY.has(t), `palabra quieta (${t})`).toBe(true);
    expect(before.strokes).toEqual(Array(6).fill("0px"));
    expect(before.shines).toEqual(Array(6).fill("none"));
    expect(before.teaser, "el titular de abajo espera para entrar con opacidad").toBe("0");

    await page.locator("#lab-burst").click();
    await page.waitForTimeout(100);
    await expect(page.locator("[data-star-burst]")).toHaveCount(0);

    await scrollThrough(page);
    await page.waitForTimeout(800);
    const headings = await page
      .locator("main h2")
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
    expect(headings).toEqual(Array(headings.length).fill("1"));
  });

  test("sin vuelo: pulso en la bolsita y evento en el acto", async ({ page }) => {
    await page.goto("/terminos", { waitUntil: "networkidle" });
    await isolate(page);
    await page.evaluate(() => {
      const t = document.createElement("span");
      t.id = "fake-bag";
      t.setAttribute("data-cart-target", "");
      t.style.cssText = "position:fixed;top:20px;right:20px;width:40px;height:40px";
      document.body.appendChild(t);
    });
    await fly(page);
    expect(await bumps(page)).toBe(1);
    expect(await page.locator("#fake-bag").evaluate((el) => el.getAnimations().length)).toBe(1);
    await expect(page.locator("[data-fly-layer]")).toHaveCount(0);
  });
});
