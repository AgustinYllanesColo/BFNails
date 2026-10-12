// @vitest-environment jsdom
/**
 * W1-F2 · UI base: piezas que todavía no tienen usos en las páginas (la ola 2 las monta) y contratos finos que un e2e
 * no ve (keys del odómetro, ids de aria, PRNG del ticket, store de toasts). Los usos actuales los cubre
 * tests/e2e/fundaciones-f2.spec.ts.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createElement as h, createRef, type ReactElement } from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { Price } from "@/components/ui/Price";
import { PriceTicker } from "@/components/ui/PriceTicker";
import { ErrorSummary, Field } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { Toaster } from "@/components/ui/Toast";
import { NailSwatch } from "@/components/ui/NailSwatch";
import { Paper, PrinterHead, TicketRow } from "@/components/ui/ticket";
import { Stamp } from "@/components/ui/Stamp";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { Badge } from "@/components/ui/Badge";
import { CopyButton } from "@/components/ui/CopyButton";
import { DesignCard } from "@/components/catalog/DesignCard";
import { SEED_DESIGNS as DESIGNS } from "@/lib/data/catalog";
import { toast, truncateName, useToasts } from "@/lib/store/toast";

/* ---------- entorno: jsdom no trae matchMedia, IntersectionObserver ni ResizeObserver ---------- */

type IOEntryLike = { isIntersecting: boolean; target: Element; boundingClientRect: DOMRect };
const observers: Array<{ cb: (e: IOEntryLike[]) => void; targets: Element[] }> = [];

/** `matchMedia` falso; con `reduced` responde que sí a `prefers-reduced-motion: reduce`. */
function mockMatchMedia(reduced = false) {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeAll(() => {
  mockMatchMedia();
  class IO {
    rec: { cb: (e: IOEntryLike[]) => void; targets: Element[] };
    constructor(cb: (e: IOEntryLike[]) => void) {
      this.rec = { cb, targets: [] };
      observers.push(this.rec);
    }
    observe(t: Element) {
      this.rec.targets.push(t);
    }
    unobserve() {}
    disconnect() {
      this.rec.targets = [];
    }
    takeRecords() {
      return [];
    }
  }
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.assign(window, { IntersectionObserver: IO, ResizeObserver: RO });
  Object.assign(globalThis, { IntersectionObserver: IO, ResizeObserver: RO });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  mockMatchMedia();
  useToasts.getState().clear();
  observers.length = 0;
});

/** Dispara el IntersectionObserver que mira `el`. */
function intersect(el: Element, isIntersecting: boolean) {
  for (const o of observers) {
    if (o.targets.includes(el)) {
      act(() =>
        o.cb([{ isIntersecting, target: el, boundingClientRect: el.getBoundingClientRect() }]),
      );
    }
  }
}

/* ---------- Price / PriceTicker ---------- */

describe("Price", () => {
  it("textContent exacto '$22.000' con el signo en su propio span", () => {
    const { container } = render(h(Price, { value: 22000, size: "xl" }));
    expect(container.textContent).toBe("$22.000");
    expect(container.querySelector("[data-price]")!.className).toContain("text-price");
  });
});

describe("PriceTicker", () => {
  const digitCells = (root: HTMLElement) => [
    ...root.querySelectorAll<HTMLElement>("[aria-hidden] > span.overflow-hidden"),
  ];

  it("cada cifra es una tira 0–9 trasladada -d·10 % y el valor se lee una vez", () => {
    const { container } = render(h(PriceTicker, { value: 18500, announce: true }));
    const cells = digitCells(container);
    expect(cells).toHaveLength(5);
    const strip = (c: HTMLElement) => c.querySelector<HTMLElement>("span.absolute")!;
    expect(strip(cells[0]).style.transform).toBe("translateY(-10%)");
    expect(strip(cells[1]).style.transform).toBe("translateY(-80%)");
    expect(strip(cells[2]).style.transform).toBe("translateY(-50%)");
    expect(strip(cells[0]).children).toHaveLength(10);
    const live = container.querySelector(".sr-only")!;
    expect(live.getAttribute("aria-live")).toBe("polite");
    expect(live.textContent?.replace(/\s/g, " ")).toBe("$ 18.500");
  });

  it("keys desde la derecha: de 9.800 a 10.200 se conservan las columnas de la derecha", () => {
    const { container, rerender } = render(h(PriceTicker, { value: 9800 }));
    const before = digitCells(container);
    expect(before).toHaveLength(4);
    rerender(h(PriceTicker, { value: 10200 }));
    const after = digitCells(container);
    expect(after).toHaveLength(5);
    // las 4 columnas de la derecha son los mismos nodos (ruedan, no se remontan)
    expect(after.slice(1)).toEqual(before);
    expect(after[1]).toBe(before[0]);
    expect(after[2].querySelector<HTMLElement>("span.absolute")!.style.transform).toBe(
      "translateY(-20%)",
    );
  });
});

/* ---------- Field ---------- */

describe("Field", () => {
  it("conecta label, error y ayuda con el control; el error no es role=alert", () => {
    const { container } = render(
      h(Field, {
        label: "WhatsApp",
        hint: "Por acá confirmamos todo.",
        error: "Faltan dígitos",
        children: h("input", { id: "wa" }),
      }),
    );
    const input = container.querySelector("input")!;
    expect(input.id).toBe("wa");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("wa-error wa-hint");
    expect(container.querySelector("label")!.htmlFor).toBe("wa");
    const err = container.querySelector("#wa-error")!;
    expect(err.getAttribute("role")).toBeNull();
    expect(err.textContent).toBe("Faltan dígitos");
  });

  it("sin id genera uno y sin error no marca aria-invalid", () => {
    const { container } = render(h(Field, { label: "Nombre", children: h("input") }));
    const input = container.querySelector("input")!;
    expect(input.id).not.toBe("");
    expect(container.querySelector("label")!.htmlFor).toBe(input.id);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });

  it("ErrorSummary: un solo anuncio, singular y plural", () => {
    expect(renderToStaticMarkup(h(ErrorSummary, { count: 0 }))).toBe("");
    const one = render(h(ErrorSummary, { count: 1 })).container;
    expect(one.querySelector('[role="alert"]')!.textContent).toBe("Revisá 1 campo");
    cleanup();
    const two = render(h(ErrorSummary, { count: 2 })).container;
    expect(two.querySelector('[role="alert"]')!.textContent).toBe("Revisá 2 campos");
  });
});

/* ---------- Chip / Segmented ---------- */

describe("Chip", () => {
  it("deshabilitado sin seleccionar: enfocable, aria-disabled, el click no hace nada y se describe afuera del nombre", () => {
    const onClick = vi.fn();
    const { container } = render(h(Chip, { disabled: true, onClick, children: "XL" }));
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    expect(btn.hasAttribute("disabled")).toBe(false);
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    const hint = document.getElementById(btn.getAttribute("aria-describedby")!)!;
    expect(hint.textContent).toBe("Sin diseños con esta combinación");
    expect(btn.contains(hint)).toBe(false);
    expect(btn.textContent).toBe("XL");
  });

  it("un chip seleccionado nunca se deshabilita", () => {
    const onClick = vi.fn();
    const { container } = render(
      h(Chip, { disabled: true, selected: true, onClick, children: "Almendra" }),
    );
    const btn = container.querySelector("button")!;
    expect(btn.hasAttribute("aria-disabled")).toBe(false);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("role=radio usa aria-checked; multi cruza plus → check", () => {
    const radio = render(
      h(Chip, { role: "radio", selected: true, children: "S" }),
    ).container.querySelector("button")!;
    expect(radio.getAttribute("role")).toBe("radio");
    expect(radio.getAttribute("aria-checked")).toBe("true");
    expect(radio.hasAttribute("aria-pressed")).toBe(false);
    cleanup();
    const multi = render(h(Chip, { multi: true, selected: true, children: "Strass" })).container;
    expect(multi.querySelector('[data-icon="plus"]')!.getAttribute("class")).toContain("opacity-0");
    expect(multi.querySelector('[data-icon="check"]')!.getAttribute("class")).toContain(
      "opacity-100",
    );
  });
});

describe("Segmented", () => {
  const options = [
    { value: "std", label: "Estándar" },
    { value: "mm", label: "En mm", disabled: true },
    { value: "wa", label: "Por WhatsApp" },
  ];

  it("radiogroup con tabindex itinerante; las flechas saltean las opciones deshabilitadas", () => {
    const onChange = vi.fn();
    const { container } = render(h(Segmented, { options, value: "std", onChange, label: "Talle" }));
    const group = container.querySelector('[role="radiogroup"]')!;
    expect(group.getAttribute("aria-label")).toBe("Talle");
    const radios = [...container.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    expect(radios[0].getAttribute("aria-checked")).toBe("true");
    expect(radios[1].getAttribute("aria-disabled")).toBe("true");
    fireEvent.keyDown(radios[0], { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("wa");
    fireEvent.keyDown(radios[0], { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("wa");
    fireEvent.keyDown(radios[2], { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith("std");
    fireEvent.click(radios[1]);
    expect(onChange).toHaveBeenCalledTimes(3);
  });
});

/* ---------- Button ---------- */

describe("Button loading", () => {
  it("ignora el click, anuncia aria-busy y el spinner entra a los 150 ms y dura ≥ 400 ms", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const el = (loading: boolean) =>
      h(Button, { loading, onClick, children: "Confirmar pedido" }) as ReactElement;
    const { container, rerender } = render(el(true));
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    expect(container.querySelector('[data-icon="spinner"]')).toBeNull();
    act(() => vi.advanceTimersByTime(160));
    expect(container.querySelector('[data-icon="spinner"]')).not.toBeNull();
    rerender(el(false));
    act(() => vi.advanceTimersByTime(200));
    expect(container.querySelector('[data-icon="spinner"]'), "se sostiene 400 ms").not.toBeNull();
    // mientras el spinner sigue a la vista el botón sigue ocupado: nada de "parece ocupado y acepta clicks"
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(260));
    expect(container.querySelector('[data-icon="spinner"]')).toBeNull();
    expect(btn.hasAttribute("aria-busy")).toBe(false);
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
    expect(btn.textContent).toContain("Confirmar pedido");
  });
});

/* ---------- Toast ---------- */

describe("toast store", () => {
  it("como mucho 3 a la vez (el más viejo se va) y dismiss por id", () => {
    const ids = [1, 2, 3, 4].map((n) => toast.show({ message: `m${n}` }));
    expect(useToasts.getState().toasts.map((t) => t.message)).toEqual(["m2", "m3", "m4"]);
    toast.dismiss(ids[2]);
    expect(useToasts.getState().toasts.map((t) => t.message)).toEqual(["m2", "m4"]);
    expect(useToasts.getState().toasts[0].duration).toBe(5000);
  });

  it("truncateName: 28 caracteres como mucho, cortando en palabra", () => {
    expect(truncateName("Kitty Leopard")).toBe("Kitty Leopard");
    const long = truncateName("Un nombre de diseño larguísimo para probar el recorte");
    expect(long.length).toBeLessThanOrEqual(28);
    expect(long.endsWith("…")).toBe(true);
    expect(long).toBe("Un nombre de diseño…");
  });

  it("Toaster: el reloj se congela con el puntero encima y la acción cierra el toast", () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const { container } = render(h(Toaster));
    act(() => {
      toast.show({
        message: "Quitaste Kitty Leopard",
        action: { label: "Deshacer", onClick },
        duration: 1000,
      });
    });
    const card = container.querySelector("[data-toast]")!.parentElement!;
    expect(container.textContent).toContain("Quitaste Kitty Leopard");
    expect(container.querySelector("[data-toast]")!.getAttribute("data-surface")).toBe("inverse");
    fireEvent.pointerEnter(card);
    act(() => vi.advanceTimersByTime(3000));
    expect(useToasts.getState().toasts).toHaveLength(1);
    fireEvent.pointerLeave(card);
    act(() => vi.advanceTimersByTime(1100));
    expect(useToasts.getState().toasts).toHaveLength(0);

    act(() => {
      toast.show({ message: "Otra", action: { label: "Deshacer", onClick } });
    });
    // el toast anterior puede seguir saliendo (animación de salida): la acción se busca en la tarjeta nueva
    const fresh = [...container.querySelectorAll("[data-toast]")].find((n) =>
      n.textContent?.includes("Otra"),
    )!;
    const action = [...fresh.querySelectorAll("button")].find((b) => b.textContent === "Deshacer")!;
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledOnce();
    expect(useToasts.getState().toasts).toHaveLength(0);
  });
});

/* ---------- NailSwatch / ticket / Stamp ---------- */

describe("NailSwatch", () => {
  it("abanico de 5 o una sola uña, ids únicos por instancia, francesita y reflejo según terminación", () => {
    const { container } = render(
      h("div", null, [
        h(NailSwatch, { key: "a", shape: "almendra", base: "#b51c1c", tip: "#fff" }),
        h(NailSwatch, {
          key: "b",
          shape: "stiletto",
          base: "#1d1d1d",
          count: 1,
          finish: "mate",
          size: 36,
        }),
      ]),
    );
    const [fan, one] = [...container.querySelectorAll("svg")];
    expect(fan.getAttribute("width")).toBe("96");
    expect(fan.querySelectorAll("g[transform]")).toHaveLength(5);
    expect(one.querySelectorAll("g[transform]")).toHaveLength(1);
    expect(one.getAttribute("width")).toBe("36");
    const ids = [...container.querySelectorAll("[id]")].map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(fan.innerHTML).toContain("#fff"); // punta
    expect(one.querySelectorAll('rect[fill="#fff"]')).toHaveLength(0); // mate: sin reflejo
    expect(fan.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("ticket", () => {
  it("Paper: el dentado es determinístico (igual en servidor y cliente) y cambia con la semilla", () => {
    const a = renderToStaticMarkup(h(Paper, { children: "hola" }));
    const b = renderToStaticMarkup(h(Paper, { children: "hola" }));
    const c = renderToStaticMarkup(h(Paper, { seed: 3, children: "hola" }));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toContain("mask-image");
    expect(renderToStaticMarkup(h(Paper, { torn: false, children: "x" }))).not.toContain(
      "mask-image",
    );
  });

  it("PrinterHead: superficie inversa y LED de ambiente solo mientras imprime; TicketRow con detalle", () => {
    const printing = render(
      h(PrinterHead, { status: "printing", label: "imprimiendo…" }),
    ).container;
    expect(printing.firstElementChild!.getAttribute("data-surface")).toBe("inverse");
    expect(printing.querySelectorAll('[data-ambient="move"]')).toHaveLength(1);
    cleanup();
    const idle = render(h(PrinterHead, { status: "idle", label: "listo" })).container;
    expect(idle.querySelectorAll("[data-ambient]")).toHaveLength(0);
    cleanup();
    // esperando: amarillo sólido que respira (nunca amarillo a media opacidad, que sobre carbón se ve oliva)
    const waiting = render(h(PrinterHead, { status: "waiting", label: "esperando" })).container;
    const led = waiting.querySelector<HTMLElement>('[data-ambient="move"]')!;
    expect(led.className).toContain("bg-yellow");
    expect(led.className).not.toMatch(/bg-yellow\/\d/);
    expect(led.className).toContain("animate-[led-pulse_2.4s");
    cleanup();
    const row = render(
      h(TicketRow, { label: "Kitty Leopard ×1", value: "$22.000", sub: "talle S" }),
    ).container;
    expect(row.textContent).toBe("Kitty Leopard ×1$22.000talle S");
  });
});

describe("Stamp", () => {
  it("rotación en el nodo del sello, wrapper quieto; play anima y avisa al aterrizar", () => {
    const onLanded = vi.fn();
    const { container } = render(h(Stamp, { label: "Enviado", icon: "bow", play: true, onLanded }));
    const wrapper = container.firstElementChild as HTMLElement;
    const stamp = wrapper.firstElementChild as HTMLElement;
    expect(wrapper.style.transform).toBe("");
    expect(stamp.style.transform).toBe("rotate(-8deg)");
    expect(stamp.className).toContain("animate-[stamp-in_450ms_var(--ease-bounce)_both]");
    // reduced: fundido propio que termina en .92 (fade-in terminaba en 1 y pisaba la opacidad de reposo)
    expect(stamp.className).toContain("motion-reduce:animate-[stamp-fade_200ms_ease-out_both]");
    // el wrapper reserva el alto del sello girado (7 % del ancho arriba y abajo)
    expect(wrapper.className).toContain("before:pt-[7%]");
    expect(wrapper.className).toContain("after:pt-[7%]");
    // jsdom no tiene AnimationEvent: React escucha el nombre con prefijo; se disparan los dos
    fireEvent.animationEnd(stamp);
    if (!onLanded.mock.calls.length)
      fireEvent(stamp, new Event("webkitAnimationEnd", { bubbles: true }));
    expect(onLanded).toHaveBeenCalledOnce();
    expect(stamp.textContent).toBe("Enviado");
  });
});

/* ---------- BottomSheet / StickyActionBar ---------- */

describe("BottomSheet", () => {
  it("modal: dialog con título, inert en el resto, foco adentro, Esc cierra y devuelve el foco", async () => {
    const main = document.createElement("main");
    main.id = "contenido";
    const trigger = document.createElement("button");
    trigger.textContent = "Filtros";
    main.appendChild(trigger);
    document.body.appendChild(main);
    trigger.focus();

    const onClose = vi.fn();
    const view = (open: boolean) =>
      h(BottomSheet, {
        open,
        onClose,
        title: "Filtros",
        footer: h("button", null, "Ver 12"),
        children: h("button", null, "Almendra"),
      });
    const { rerender } = render(view(true));
    const dialog = await waitFor(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) throw new Error("sin dialog");
      return d as HTMLElement;
    });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)!.textContent).toBe(
      "Filtros",
    );
    expect(main.hasAttribute("inert")).toBe(true);
    expect(document.activeElement?.textContent).toBe("Almendra");
    expect(document.documentElement.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    rerender(view(false));
    await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull(), {
      timeout: 3000,
    });
    expect(main.hasAttribute("inert")).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.documentElement.style.overflow).toBe("");
    main.remove();
  });
});

describe("StickyActionBar", () => {
  it("aparece cuando el disparador quedó atrás, publica --sticky-bar-h y se esconde con un campo enfocado", async () => {
    const watch = createRef<HTMLDivElement>();
    const Host = () =>
      h("div", null, [
        h("div", { key: "w", ref: watch }, "CTAs"),
        h("input", { key: "i", "aria-label": "Nombre" }),
        h(StickyActionBar, {
          key: "b",
          watchRef: watch,
          label: "Comprar este set",
          variant: "bordo",
          children: h("button", null, "Agregar"),
        }),
      ]);
    const { container } = render(h(Host));
    await waitFor(() =>
      expect(observers.some((o) => o.targets.includes(watch.current!))).toBe(true),
    );
    expect(document.querySelector('[role="region"]')).toBeNull();

    intersect(watch.current!, false);
    const bar = await waitFor(() => {
      const r = document.querySelector('[role="region"][aria-label="Comprar este set"]');
      if (!r) throw new Error("sin barra");
      return r as HTMLElement;
    });
    expect(bar.getAttribute("data-surface")).toBe("inverse");
    expect(document.documentElement.style.getPropertyValue("--sticky-bar-h")).toMatch(/^\d+px$/);

    act(() => (container.querySelector("input") as HTMLInputElement).focus());
    await waitFor(() => expect(document.querySelector('[role="region"]')).toBeNull(), {
      timeout: 3000,
    });
    expect(document.documentElement.style.getPropertyValue("--sticky-bar-h")).toBe("0px");
  });
});

/* ---------- Badge / CopyButton / DesignCard / reduced-motion de las capas (ronda 2) ---------- */

describe("Badge", () => {
  it("mayúsculas por defecto; casing='normal' (o el viejo className='normal-case') pasa a text-meta", () => {
    const { container } = render(
      h("div", null, [
        h(Badge, { key: "a", tone: "cream", children: "Signature" }),
        h(Badge, { key: "b", tone: "cream", casing: "normal", children: "animal print" }),
        h(Badge, { key: "c", tone: "cream", className: "normal-case", children: "personajes" }),
      ]),
    );
    const [upper, lower, legacy] = [...container.querySelectorAll("span.rounded-pill")];
    expect(upper.className).toContain("text-label");
    expect(upper.className).toContain("uppercase");
    for (const b of [lower, legacy]) {
      expect(b.className).toContain("text-meta");
      expect(b.className).not.toContain("text-label");
      expect(b.className).not.toContain("uppercase");
      expect(b.className).toContain("h-6");
    }
  });
});

describe("CopyButton", () => {
  it("si falla el portapapeles: marca el destino, el botón no cambia de caras (ni de ancho) y el aviso va en un toast", async () => {
    const target = document.createElement("span");
    target.id = "alias-test";
    target.textContent = "bf.nails.mp";
    document.body.appendChild(target);
    const clipboard = { writeText: vi.fn(() => Promise.reject(new Error("denegado"))) };
    Object.defineProperty(navigator, "clipboard", { value: clipboard, configurable: true });
    const exec = vi.fn(() => false);
    Object.defineProperty(document, "execCommand", { value: exec, configurable: true });

    const { container } = render(
      h(CopyButton, { value: "bf.nails.mp", selectTargetId: "alias-test", ariaLabel: "Copiar alias" }),
    );
    const btn = container.querySelector("button")!;
    const faces = () => [...btn.children].map((n) => n.textContent);
    const before = faces();
    expect(before).toEqual(["Copiar", "Copiado", "Marcado"]);
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(btn.getAttribute("data-status")).toBe("manual"));
    // las mismas tres caras apiladas: ninguna se monta de más
    expect(faces()).toEqual(before);
    const active = [...btn.children].filter((n) => !n.hasAttribute("aria-hidden"));
    expect(active.map((n) => n.textContent)).toEqual(["Marcado"]);
    expect(String(window.getSelection())).toBe("bf.nails.mp");
    const toasts = useToasts.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Mantené apretado el texto para copiarlo");
    // otro toque reemplaza el aviso, no lo apila
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(clipboard.writeText).toHaveBeenCalledTimes(2));
    expect(useToasts.getState().toasts).toHaveLength(1);
    // el sr-only del botón no repite el aviso (lo lee la región del Toaster)
    expect(container.querySelector(".sr-only")!.textContent).toBe("");
    target.remove();
    Reflect.deleteProperty(navigator, "clipboard");
    Reflect.deleteProperty(document, "execCommand");
  });
});

describe("DesignCard", () => {
  const kitty = DESIGNS.find((d) => d.slug === "kitty-leopard")!;

  it("sin fotos (placeholder cuadrado viejo): abanico NailSwatch con el nombre accesible, sin <img>", () => {
    const { container } = render(h(DesignCard, { design: kitty, priority: true }));
    const ph = container.querySelector("[data-card-placeholder]")!;
    expect(ph).not.toBeNull();
    const swatch = ph.querySelector('svg[data-nail-swatch="5"]')!;
    expect(swatch.getAttribute("role")).toBe("img");
    expect(swatch.getAttribute("aria-label")).toBe(kitty.name);
    // kitty-leopard es animal print: el abanico usa la trama de leopardo
    expect(swatch.innerHTML).toContain("leopard-tile.svg");
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("con fotos reales: next/image con prioridad y segunda foto solo si hay dos", () => {
    const withPhotos = { ...kitty, images: ["/fotos/a.jpg", "/fotos/b.jpg"] };
    const { container } = render(h(DesignCard, { design: withPhotos, priority: true }));
    expect(container.querySelector("[data-card-placeholder]")).toBeNull();
    const imgs = [...container.querySelectorAll("img")];
    expect(imgs).toHaveLength(2);
    expect(imgs[0].getAttribute("alt")).toBe(kitty.name);
    expect(imgs[0].getAttribute("loading")).toBe("eager");
    expect(imgs[0].getAttribute("fetchpriority")).toBe("high");
    expect(imgs[1].getAttribute("alt")).toBe("");
    expect(imgs[1].getAttribute("loading")).toBe("lazy");
    cleanup();
    const one = render(h(DesignCard, { design: { ...kitty, images: ["/fotos/a.jpg"] } })).container;
    expect(one.querySelectorAll("img")).toHaveLength(1);
    expect(one.querySelector("img")!.getAttribute("loading")).toBe("lazy");
  });
});

describe("reduced-motion en Toast, StickyActionBar y BottomSheet", () => {
  it("Toast: sin recorrido con reduced (solo fundido); 16 px sin reduced", () => {
    const rendered = (reduced: boolean) => {
      mockMatchMedia(reduced);
      const { container } = render(h(Toaster));
      act(() => {
        toast.show({ message: reduced ? "reducido" : "completo" });
      });
      const t = container.querySelector<HTMLElement>("[data-toast]")!.style.transform;
      cleanup();
      useToasts.getState().clear();
      return t;
    };
    expect(rendered(false)).toBe("translateY(16px)");
    expect(rendered(true)).toBe("translateY(0px)");
  });

  it("BottomSheet: el panel arranca a 24 px y transparente con reduced; desde 100 % sin reduced", async () => {
    const start = async (reduced: boolean) => {
      mockMatchMedia(reduced);
      render(
        h(BottomSheet, { open: true, onClose: () => {}, title: "Filtros", children: h("button", null, "x") }),
      );
      const dialog = await waitFor(() => {
        const d = document.querySelector('[role="dialog"]');
        if (!d) throw new Error("sin dialog");
        return d as HTMLElement;
      });
      const panel = dialog.parentElement!;
      const out = { transform: panel.style.transform, opacity: panel.style.opacity };
      cleanup();
      return out;
    };
    // `waitFor` puede llegar un cuadro tarde: se mira la unidad y el tope del recorrido, no el valor exacto
    const travel = (t: string) => /^translateY\(([\d.]+)(px|%)\)$/.exec(t);
    const full = travel((await start(false)).transform)!;
    expect(full[2]).toBe("%");
    expect(Number(full[1])).toBeGreaterThan(50);
    const reduced = await start(true);
    const r = travel(reduced.transform)!;
    expect(r[2]).toBe("px");
    expect(Number(r[1])).toBeLessThanOrEqual(24);
    expect(Number(reduced.opacity)).toBeLessThan(1);
  });

  it("StickyActionBar: 12 px con reduced en lugar de 120 %", async () => {
    mockMatchMedia(true);
    const watch = createRef<HTMLDivElement>();
    render(
      h("div", null, [
        h("div", { key: "w", ref: watch }, "CTAs"),
        h(StickyActionBar, { key: "b", watchRef: watch, label: "Comprar", children: "Agregar" }),
      ]),
    );
    await waitFor(() =>
      expect(observers.some((o) => o.targets.includes(watch.current!))).toBe(true),
    );
    intersect(watch.current!, false);
    const bar = await waitFor(() => {
      const r = document.querySelector<HTMLElement>("[data-sticky-bar]");
      if (!r) throw new Error("sin barra");
      return r;
    });
    const m = /^translateY\(([\d.]+)(px|%)\)$/.exec(bar.style.transform)!;
    expect(m[2]).toBe("px");
    expect(Number(m[1])).toBeLessThanOrEqual(12);
  });
});
