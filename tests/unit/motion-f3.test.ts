// @vitest-environment jsdom
/**
 * W1-F3 · Primitivas de movimiento que todavía no tienen usos en las páginas (los titulares de la ola 2 las montan):
 * cómo parte el texto `WordReveal` (máscaras, espacios, puntuación pegada a la pincelada, elementos anidados) y cómo
 * pinta `Brush` en modo `scrub` (sin redondeo a px: a mitad de camino está a mitad de pintar), el aviso de largo de
 * `Brush` y la geometría del vuelo a la bolsita (`flightPath`). En el navegador los mide
 * tests/e2e/fundaciones-f3.spec.ts, sobre el laboratorio tests/e2e/fixtures/motion-lab.tsx y la bolsita real del nav.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createElement as h, type ReactNode } from "react";
import { cleanup, render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { WordReveal } from "@/components/motion/WordReveal";
import { Brush, BRUSH_MAX_CHARS } from "@/components/motion/Brush";
import { flightPath, type Point } from "@/components/motion/FlyToCart";

/*
 * `matchMedia` falso (jsdom no lo trae y ScrollTrigger lo usa al registrarse, antes que cualquier `beforeAll`):
 * sin reduced-motion por defecto (`no-preference` coincide); con `reduced`, al revés.
 */
const { mockMatchMedia } = vi.hoisted(() => {
  const mockMatchMedia = (reduced = false) => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce)") ? reduced : query.includes("no-preference") ? !reduced : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  };
  mockMatchMedia();
  return { mockMatchMedia };
});

beforeAll(() => {
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  cleanup();
  ScrollTrigger.getAll().forEach((st) => st.kill());
  mockMatchMedia();
});

/** Renderiza en el servidor (sin efectos) y devuelve el titular como DOM para inspeccionarlo. */
function ssr(children: ReactNode, as: "h1" | "h2" = "h2") {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(h(WordReveal, { as, children }));
  return host.firstElementChild as HTMLElement;
}

const masks = (el: Element) =>
  [...el.querySelectorAll<HTMLElement>("[data-w]")].map((w) => w.textContent);

describe("WordReveal · cómo parte el titular (F3.2)", () => {
  it("una máscara por palabra con su interior, y los espacios quedan como texto", () => {
    const el = ssr("Sets que vuelan");
    expect(el.tagName).toBe("H2");
    expect(el.textContent).toBe("Sets que vuelan");
    expect(masks(el)).toEqual(["Sets", "que", "vuelan"]);
    for (const w of el.querySelectorAll("[data-w]")) {
      // máscara → interior: un nodo por responsabilidad (la máscara recorta, el interior se mueve)
      expect(w.children).toHaveLength(1);
      expect(w.firstElementChild!.hasAttribute("data-wi")).toBe(true);
      expect(w.className).toContain("overflow-y-clip");
      expect(w.firstElementChild!.className).toContain("origin-[0_100%]");
    }
    // los espacios son nodos de texto hijos del titular (cortan línea y se balancean como siempre)
    const spaces = [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE);
    expect(spaces.map((n) => n.textContent)).toEqual([" ", " "]);
  });

  it("la pincelada va entera en un solo bloque y se lleva la puntuación pegada", () => {
    const el = ssr(["Tu idea, con precio ", h(Brush, { key: "b", children: "al instante" }), "."]);
    expect(el.textContent).toBe("Tu idea, con precio al instante.");
    expect(masks(el)).toEqual(["Tu", "idea,", "con", "precio", "al instante."]);
    const block = el.querySelector("[data-brush]")!.closest("[data-w]")!;
    expect(block.textContent).toBe("al instante.");
    // máscara más holgada abajo (puntas redondeadas de la pincelada)
    expect(block.className).toContain("pb-[.2em]");
    // dentro de la pincelada no se parte: "al instante" no corta línea
    expect(el.querySelectorAll("[data-brush] [data-w]")).toHaveLength(0);
    expect(el.querySelector("[data-brush]")!.className).toContain("whitespace-nowrap");
  });

  it("solo se pega la puntuación que sigue sin espacio; lo demás sigue como palabras", () => {
    const el = ssr(["De tu idea ", h(Brush, { key: "b", tone: "inverse", children: "a tus manos" }), " ya"]);
    expect(el.textContent).toBe("De tu idea a tus manos ya");
    expect(masks(el)).toEqual(["De", "tu", "idea", "a tus manos", "ya"]);
  });

  it("los elementos HTML se recorren por dentro y conservan su elemento; los números pasan a texto", () => {
    const el = ssr([
      "Medite en ",
      2,
      " minutos ",
      h("span", { key: "s", className: "text-bordo" }, "tu set"),
      h("br", { key: "br" }),
      "¡ya!",
    ]);
    expect(el.textContent).toBe("Medite en 2 minutos tu set¡ya!");
    const span = el.querySelector("span.text-bordo")!;
    expect(span).not.toBeNull();
    expect(masks(span)).toEqual(["tu", "set"]);
    expect(el.querySelector("br")).not.toBeNull();
    expect(masks(el)).toEqual(["Medite", "en", "2", "minutos", "tu", "set", "¡ya!"]);
  });

  it("sin JavaScript (SSR) todo se ve: ninguna palabra lleva estilos en línea", () => {
    const el = ssr(["Tus próximas uñas, hechas ", h(Brush, { key: "b", children: "por Bren" }), "."]);
    expect(el.querySelectorAll("[style]")).toHaveLength(0);
  });
});

describe("Brush · scrub (F3.3)", () => {
  function mountScrub() {
    const { container } = render(
      h("h2", null, "Sets que ", h(Brush, { mode: "scrub", children: "vuelan" })),
    );
    const root = container.querySelector<HTMLElement>("[data-brush]")!;
    const stroke = root.querySelector<SVGPathElement>("[data-stroke]")!;
    const st = ScrollTrigger.getAll().find((s) => s.trigger === container.querySelector("h2"));
    return { root, stroke, tween: st?.animation as gsap.core.Tween | undefined };
  }

  it("un ScrollTrigger con el titular de disparador, del 80 % al 50 % del viewport", () => {
    const { tween } = mountScrub();
    expect(tween).toBeDefined();
    const st = tween!.scrollTrigger!;
    expect(st.vars.start).toBe("top 80%");
    expect(st.vars.end).toBe("top 50%");
    expect(st.vars.scrub).toBe(0.6);
  });

  it("se pinta de a poco: a mitad de camino el offset está a mitad (sin redondear a 0px/1px)", () => {
    const { stroke, tween } = mountScrub();
    // En Chromium el valor inicial computado viene en px y GSAP redondea los px por defecto (todo quedaba en 1px o
    // 0px). jsdom no computa unidades, así que acá no se puede reproducir: se fija la opción y el e2e del laboratorio
    // (fundaciones-f3.spec.ts, "scrub: la pincelada se pinta junto con el scroll") lo mide en el navegador.
    expect(tween!.vars.autoRound).toBe(false);
    const offsets = [0.1, 0.3, 0.45, 0.55, 0.8].map((p) => {
      tween!.progress(p);
      return parseFloat(stroke.style.strokeDashoffset);
    });
    for (const [i, p] of [0.1, 0.3, 0.45, 0.55, 0.8].entries())
      expect(offsets[i], `progreso ${p}`).toBeCloseTo(1 - p, 3);
  });

  it("el brillo sale cuando el trazo (no el scroll) termina de pintarse, y una sola vez", () => {
    const { root, tween } = mountScrub();
    // jsdom no tiene layout (todo mide 0): al montar, ScrollTrigger ve el titular ya pasado y lo pinta entero.
    delete root.dataset.shine;
    tween!.progress(0.9);
    expect(root.dataset.shine).toBeUndefined();
    tween!.progress(1);
    expect(root.dataset.shine).toBe("1");
    tween!.progress(0.2);
    expect(root.dataset.shine, "no se apaga al volver a subir").toBe("1");
  });

  it("con reduced-motion no crea el scroll: la pincelada queda pintada por CSS", () => {
    mockMatchMedia(true);
    const { stroke, tween } = mountScrub();
    expect(tween).toBeUndefined();
    expect(stroke.style.strokeDashoffset).toBe("");
    expect(stroke.getAttribute("class")).toContain("motion-reduce:[stroke-dashoffset:0]!");
  });

  it("el trazo arranca dentro de la palabra (no tapa el espacio con la anterior)", () => {
    const { root } = mountScrub();
    const svg = root.querySelector("svg")!;
    const cls = svg.getAttribute("class")!;
    expect(cls).toContain("left-0");
    expect(cls).not.toMatch(/(^|\s)-left-/);
    // punta redonda de radio 6 (strokeWidth 12) en un viewBox de 200: el trazo empieza en x ≥ 6
    const d = root.querySelector("[data-stroke]")!.getAttribute("d")!;
    const x0 = parseFloat(d.replace(/^M\s*/, ""));
    expect(x0 - 6).toBeGreaterThanOrEqual(0);
  });
});

describe("Brush · largo de la palabra acento (PLAN §2.6)", () => {
  it(`en desarrollo avisa una vez si pasa de ${BRUSH_MAX_CHARS} caracteres, nombrando el texto`, () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      render(h("h2", null, "Elegí tu ", h(Brush, { mode: "static", children: "próximo set" })));
      expect(warn, "11 caracteres: sin aviso").not.toHaveBeenCalled();
      const long = "todo lo que querés";
      const { rerender } = render(h(Brush, { mode: "static", children: long }));
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain(`"${long}"`);
      expect(String(warn.mock.calls[0][0])).toContain("18 caracteres");
      rerender(h(Brush, { mode: "static", children: long }));
      expect(warn, "una sola vez por texto").toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  it("cuenta caracteres, no unidades UTF-16 (los acentos no suman de más)", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      render(h(Brush, { mode: "static", children: "ñandú güeñólá" })); // 13
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});

describe("FlyToCart · el arco del vuelo (F3.8)", () => {
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  /** Primer punto (interpolado entre muestras) en que la ficha sube hasta el borde de abajo de la bolsita. */
  function whenLevel(points: Point[], bag: Point, r: number) {
    for (let i = 1; i < points.length; i++) {
      const [a, b] = [points[i - 1], points[i]];
      if (b.y <= bag.y + r && a.y > bag.y + r) {
        const k = (a.y - (bag.y + r)) / (a.y - b.y);
        return { x: a.x + (b.x - a.x) * k, y: bag.y + r, u: (i - 1 + k) / (points.length - 1) };
      }
    }
    return null;
  }
  // La bolsita del nav en un celular de 390 px y en un desktop de 1440 px (centros medidos).
  const phoneBag = { x: 292, y: 42 };
  const deskBag = { x: 1378, y: 50 };
  const cases: [string, Point, Point, number][] = [
    ["celular, botón al centro abajo", { x: 195, y: 800 }, phoneBag, 390],
    ["celular, justo debajo de la bolsita", { x: 292, y: 790 }, phoneBag, 390],
    ["celular, a la derecha de la bolsita", { x: 360, y: 700 }, phoneBag, 390],
    ["desktop, tarjeta a la derecha", { x: 1100, y: 640 }, deskBag, 1440],
    ["desktop, tarjeta arriba a la izquierda", { x: 260, y: 300 }, deskBag, 1440],
  ];

  for (const [name, from, bag, vw] of cases) {
    it(`${name}: sale del origen, entra en la bolsita y nunca se sale de la pantalla`, () => {
      const { points } = flightPath(from, bag, vw, 22);
      expect(points).toHaveLength(25);
      expect(dist(points[0], from)).toBeLessThan(0.01);
      expect(dist(points[points.length - 1], bag)).toBeLessThan(0.01);
      for (const p of points) {
        expect(p.y, "el centro no sube a menos de 18 px del borde").toBeGreaterThanOrEqual(17.9);
        expect(p.x).toBeGreaterThan(18);
        expect(p.x).toBeLessThan(vw - 18);
      }
      // entra por arriba: el tope del arco queda por encima del centro de la bolsita
      expect(Math.min(...points.map((p) => p.y))).toBeLessThan(bag.y - 12);
    });

    it(`${name}: llega a la altura de la bolsita por el costado, con aire`, () => {
      const { points } = flightPath(from, bag, vw, 22);
      const level = whenLevel(points, bag, 22);
      expect(level).not.toBeNull();
      // 22 px de radio + 26 de aire (± el error de interpolar entre muestras)
      expect(Math.abs(level!.x - bag.x), "pasa por arriba del ícono").toBeGreaterThanOrEqual(46);
      // y hasta el 85 % del vuelo sigue a más de 10 px del centro
      const cut = Math.floor(0.85 * (points.length - 1));
      for (const p of points.slice(0, cut + 1)) expect(dist(p, bag)).toBeGreaterThan(10);
    });
  }

  it("entra por el lado de la bolsita que mira al centro de la pantalla, venga de donde venga", () => {
    expect(flightPath({ x: 100, y: 700 }, phoneBag, 390).side).toBe(-1);
    expect(flightPath({ x: 370, y: 700 }, phoneBag, 390).side, "origen más afuera que la bolsita").toBe(-1);
    expect(flightPath({ x: 60, y: 700 }, { x: 64, y: 42 }, 390).side, "bolsita a la izquierda").toBe(
      1,
    );
    // con el origen más afuera que la bolsita, la panza la lleva hacia adentro y no pasa por encima del menú
    const { points } = flightPath({ x: 370, y: 700 }, phoneBag, 390, 22);
    for (const p of points.slice(1, -1)) expect(p.x).toBeLessThanOrEqual(370);
  });
});
