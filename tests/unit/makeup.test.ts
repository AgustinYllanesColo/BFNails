import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAKEUP,
  MAKEUP_FORMS,
  checkMakeupLines,
  makeupLineName,
  normalizeShades,
  normalizeMakeupList,
  normalizeMedia,
  isVideoUrl,
  makeupMedia,
  toPublicMakeup,
  type MakeupProduct,
} from "@/lib/data/makeup";
import { maxQtyFor } from "@/lib/types";
import type { Order } from "@/lib/types";
import { adminMessages, hasNailSet } from "@/lib/whatsapp";
import { customerPaidMail } from "@/lib/mail-templates";
import { parseMakeupForm, parseComboIncludes, validateImageFile } from "@/lib/admin/makeup-form";
import { applyMakeupSold, makeupForSave } from "@/lib/data/makeup";

const base: MakeupProduct = {
  id: "rubor",
  name: "Rubor en crema",
  category: "rostro",
  form: "rubor",
  price: 3400,
  stock: 2,
  active: true,
};

describe("stock de maquillaje en el checkout", () => {
  it("suma las filas repetidas del mismo producto antes de comparar con el stock", () => {
    const err = checkMakeupLines(
      [
        { makeupId: "rubor", qty: 1 },
        { makeupId: "rubor", qty: 2 },
      ],
      [base],
    );
    expect(err).toContain("Rubor en crema");
    expect(err).toContain("2");
  });

  it("deja pasar cantidades dentro del stock, y sin control de stock hasta el tope", () => {
    expect(checkMakeupLines([{ makeupId: "rubor", qty: 2 }], [base])).toBeNull();
    expect(checkMakeupLines([{ makeupId: "rubor", qty: 20 }], [{ ...base, stock: undefined }])).toBeNull();
  });

  it("un producto agotado se nombra y pide sacarlo del carrito", () => {
    const err = checkMakeupLines([{ makeupId: "rubor", qty: 1 }], [{ ...base, stock: 0 }]);
    expect(err).toMatch(/Rubor en crema se agotó/);
    expect(err).toMatch(/carrito/);
  });

  it("un producto borrado o pausado da un mensaje claro con su nombre si se conoce", () => {
    expect(checkMakeupLines([{ makeupId: "rubor", qty: 1 }], [{ ...base, active: false }])).toMatch(/Rubor en crema ya no está disponible/);
    expect(checkMakeupLines([{ makeupId: "otro", qty: 1 }], [base])).toMatch(/Un producto de maquillaje ya no está disponible/);
  });

  it("un producto sin precio (0) no se puede pedir", () => {
    expect(checkMakeupLines([{ makeupId: "rubor", qty: 1 }], [{ ...base, price: 0 }])).toBe(
      "El producto Rubor en crema todavía no tiene precio. Sacalo del carrito para seguir.",
    );
  });

  it("con stock menor que lo pedido avisa cuántas quedan y que baje la cantidad", () => {
    const err = checkMakeupLines([{ makeupId: "rubor", qty: 2 }], [{ ...base, stock: 1 }]);
    expect(err).toBe("De Rubor en crema queda 1 unidad. Bajá la cantidad en el carrito.");
  });
});

describe("datos de maquillaje guardados", () => {
  it("si el valor guardado no es una lista, se usa el valor por defecto", () => {
    expect(normalizeMakeupList(null)).toBeNull();
    expect(normalizeMakeupList({ foo: 1 })).toBeNull();
  });

  it("completa campos que faltan en datos viejos y descarta filas rotas", () => {
    const list = normalizeMakeupList([
      { id: "a", name: "Viejo", category: "labios", price: 1000 },
      { id: "b", name: "Sin precio", category: "labios" },
      { id: "c", name: "Categoría rara", category: "zapatos", price: 10, active: true },
      "basura",
    ]);
    expect(list).toHaveLength(1);
    expect(list![0]).toMatchObject({ id: "a", active: true, form: "labial" });
  });

  it("la versión pública no lleva el código del proveedor", () => {
    const pub = toPublicMakeup({ ...base, code: "CS5167" });
    expect("code" in pub).toBe(false);
    expect(DEFAULT_MAKEUP.map(toPublicMakeup).some((m) => "code" in m)).toBe(false);
  });

  it("todas las formas de los productos están en la lista de formas", () => {
    for (const m of DEFAULT_MAKEUP) expect(MAKEUP_FORMS).toContain(m.form);
  });
});

describe("tope de cantidad en el carrito", () => {
  it("el maquillaje respeta el stock que se conocía al sumarlo", () => {
    expect(maxQtyFor({ id: "x", kind: "makeup", makeupId: "rubor", name: "R", unitPrice: 1, qty: 1, maxQty: 2 })).toBe(2);
    expect(maxQtyFor({ id: "x", kind: "makeup", makeupId: "rubor", name: "R", unitPrice: 1, qty: 1 })).toBe(20);
    expect(maxQtyFor({ id: "x", kind: "charm", charmId: "c", name: "C", unitPrice: 1, qty: 1 })).toBe(50);
  });
});

function fd(entries: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
}

describe("formulario de maquillaje del admin", () => {
  const ok = { name: "Rubor", category: "rostro", price: "3400", hex: "#e5848f" };

  it("stock y precio anterior vacíos quedan sin definir (no en 0)", () => {
    const r = parseMakeupForm(fd({ ...ok, stock: "", priceBefore: "" }));
    expect(r.success).toBe(true);
    expect(r.success && r.data.stock).toBeUndefined();
    expect(r.success && r.data.priceBefore).toBeUndefined();
  });

  it("stock 0 es agotado, no vacío", () => {
    const r = parseMakeupForm(fd({ ...ok, stock: "0" }));
    expect(r.success && r.data.stock).toBe(0);
  });

  it("un precio anterior que no es mayor al precio se descarta", () => {
    const r = parseMakeupForm(fd({ ...ok, priceBefore: "3000" }));
    expect(r.success && r.data.priceBefore).toBeUndefined();
    const r2 = parseMakeupForm(fd({ ...ok, priceBefore: "4000" }));
    expect(r2.success && r2.data.priceBefore).toBe(4000);
  });

  it("rechaza colores que no son hex y valores fuera de rango", () => {
    expect(parseMakeupForm(fd({ ...ok, hex: "red;background:url(x)" })).success).toBe(false);
    expect(parseMakeupForm(fd({ ...ok, price: "-1" })).success).toBe(false);
    expect(parseMakeupForm(fd({ ...ok, stock: "1.5" })).success).toBe(false);
    expect(parseMakeupForm(fd({ ...ok, stock: "100000" })).success).toBe(false);
    expect(parseMakeupForm(fd({ ...ok, form: "zapato" })).success).toBe(false);
  });
});

describe("fotos subidas desde el admin", () => {
  it("acepta jpg, png, webp y avif hasta 8 MB", () => {
    expect(validateImageFile(new File([new Uint8Array(10)], "a.jpg", { type: "image/jpeg" }))).toBeNull();
    expect(validateImageFile(new File([new Uint8Array(10)], "a.webp", { type: "image/webp" }))).toBeNull();
  });

  it("rechaza svg, html y archivos grandes", () => {
    expect(validateImageFile(new File(["<svg/>"], "a.svg", { type: "image/svg+xml" }))).toMatch(/formato/i);
    expect(validateImageFile(new File(["<p>"], "a.html", { type: "text/html" }))).toMatch(/formato/i);
    const big = { name: "a.jpg", type: "image/jpeg", size: 9 * 1024 * 1024 } as File;
    expect(validateImageFile(big)).toMatch(/8 MB/);
  });
});

describe("mensajes de un pedido solo de maquillaje", () => {
  const base = {
    id: "o", number: "BF-0100", token: "t", status: "pagado", customer: { name: "Ana", whatsapp: "5491100000000" },
    subtotal: 3400, total: 3400, needsConfirmation: false, payment: { method: "transferencia" },
    delivery: { method: "retiro", cost: 0, label: "Retiro" }, createdAt: "", updatedAt: "",
  } as const;
  const makeupOnly = { ...base, items: [{ id: "a", kind: "makeup", makeupId: "lip-liner", name: "Lip liner", unitPrice: 1900, qty: 1 }] } as unknown as Order;
  const withSet = { ...base, items: [{ id: "b", kind: "design", designSlug: "x", name: "Set", unitPrice: 15000, qty: 1, sizes: { mode: "kit" } }] } as unknown as Order;

  it("no habla de uñas ni de sets", () => {
    expect(hasNailSet(makeupOnly)).toBe(false);
    expect(adminMessages.pagoRecibido(makeupOnly)).not.toMatch(/uñas/);
    expect(adminMessages.listo(makeupOnly)).not.toMatch(/set/i);
    expect(customerPaidMail(makeupOnly, "https://x").text).not.toMatch(/tu set/);
  });

  it("con un set sigue hablando de uñas", () => {
    expect(hasNailSet(withSet)).toBe(true);
    expect(adminMessages.pagoRecibido(withSet)).toMatch(/uñas/);
    expect(adminMessages.listo(withSet)).toMatch(/Tu set/);
  });
});

describe("tonos de maquillaje", () => {
  const withShades = { ...DEFAULT_MAKEUP.find((m) => m.id === "delineador-labio")!, stock: 10 };

  it("normaliza la lista: recorta, saca vacíos y repetidos, acepta texto con comas", () => {
    expect(normalizeShades(" 02, 04 ,,02, 06 ")).toEqual(["02", "04", "06"]);
    expect(normalizeShades(["Nude 4", "", "Nude 4"])).toEqual(["Nude 4"]);
    expect(normalizeShades("")).toBeUndefined();
    expect(normalizeShades(42)).toBeUndefined();
  });

  it("el nombre de la línea lleva el tono", () => {
    expect(makeupLineName("Delineador de labio", "17")).toBe("Delineador de labio · tono 17");
    expect(makeupLineName("Brocha")).toBe("Brocha");
  });

  it("exige un tono válido cuando el producto tiene tonos", () => {
    expect(checkMakeupLines([{ makeupId: withShades.id, qty: 1 }], [withShades])).toMatch(/Elegí el tono/);
    expect(checkMakeupLines([{ makeupId: withShades.id, qty: 1, shade: "99" }], [withShades])).toMatch(/tono 99/);
    expect(checkMakeupLines([{ makeupId: withShades.id, qty: 1, shade: "17" }], [withShades])).toBeNull();
  });

  it("el stock se comparte entre tonos", () => {
    const two = { ...withShades, stock: 2 };
    const lines = [
      { makeupId: two.id, qty: 2, shade: "14" },
      { makeupId: two.id, qty: 1, shade: "17" },
    ];
    expect(checkMakeupLines(lines, [two])).toMatch(/quedan 2/);
  });

  it("los tonos guardados sobreviven a la normalización", () => {
    expect(normalizeMakeupList([withShades])![0].shades).toEqual(["14", "17", "19", "23", "24"]);
  });
});

describe("video del producto", () => {
  it("conserva un video de la tienda o de https y descarta lo que no es un video", () => {
    const row = { id: "x", name: "X", category: "cejas", price: 100 };
    const list = normalizeMakeupList([
      { ...row, id: "a", video: "/maquillaje/polvo-cejas-pink21.mp4" },
      { ...row, id: "b", video: "https://cdn.example.com/v/demo.webm" },
      { ...row, id: "c", video: "javascript:alert(1)" },
      { ...row, id: "d", video: "/maquillaje/foto.webp" },
      { ...row, id: "e", video: "//otro.com/demo.mp4" },
    ])!;
    expect(list.map((m) => m.video)).toEqual([
      "/maquillaje/polvo-cejas-pink21.mp4",
      "https://cdn.example.com/v/demo.webm",
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("el formulario del admin acepta el link del video y vacío lo saca", () => {
    const fd = (video: string) => {
      const f = new FormData();
      for (const [k, v] of Object.entries({ name: "Polvo", category: "cejas", price: "3500", video })) f.set(k, v);
      return f;
    };
    expect(parseMakeupForm(fd(" /maquillaje/demo.mp4 ")).data?.video).toBe("/maquillaje/demo.mp4");
    expect(parseMakeupForm(fd("")).data?.video).toBeUndefined();
    expect(parseMakeupForm(fd("javascript:alert(1)")).success).toBe(false);
  });

  it("el polvo para cejas Pink21 trae su video y una foto fija", () => {
    const cejas = DEFAULT_MAKEUP.find((m) => m.id === "polvo-cejas-pink21")!;
    expect(cejas.video).toBe("/maquillaje/polvo-cejas-pink21.mp4");
    expect(cejas.image).toBe("/maquillaje/polvo-cejas-pink21.webp");
  });
});

describe("combos armados desde el admin", () => {
  const suelto = (id: string, stock: number): MakeupProduct => ({ ...base, id, name: id, stock });
  const all = [suelto("rubor", 5), suelto("mascara", 2), { ...base, id: "combo-x", name: "Combo X", category: "combos" as const, form: "combo" as const, includes: [{ id: "rubor", qty: 1 }] }];

  it("lee qué trae el combo: solo productos sueltos que existen, con cantidad mayor a cero", () => {
    const f = new FormData();
    f.set("inc_rubor", "1");
    f.set("inc_mascara", "2");
    f.set("inc_no-existe", "1");
    f.set("inc_combo-x", "1");
    f.set("inc_lapiz", "0");
    expect(parseComboIncludes(f, all)).toEqual([
      { id: "rubor", qty: 1 },
      { id: "mascara", qty: 2 },
    ]);
  });

  it("armar un combo no descuenta ni reserva el stock de lo que trae", () => {
    const [rubor] = applyMakeupSold(all, {});
    expect(rubor.stock).toBe(5);
  });

  it("los combos se guardan sin stock propio (solo se descuenta lo que trae cuando se vende)", () => {
    const shown = applyMakeupSold(all, {});
    expect(shown.find((m) => m.id === "combo-x")?.stock).toBe(5);
    const saved = makeupForSave(shown);
    expect(saved.find((m) => m.id === "combo-x")?.stock).toBeUndefined();
    expect(saved.find((m) => m.id === "rubor")?.stock).toBe(5);
  });
});

describe("fotos y videos que vienen con la tienda", () => {
  const guardado = { id: "polvo-cejas-pink21", name: "Polvo para cejas", category: "cejas", price: 3500 };

  it("un producto guardado antes de tener foto o video toma los de la tienda", () => {
    const [m] = normalizeMakeupList([guardado])!;
    expect(m.image).toBe("/maquillaje/polvo-cejas-pink21.webp");
    expect(m.video).toBe("/maquillaje/polvo-cejas-pink21.mp4");
  });

  it("si se quitaron desde el admin, no vuelven", () => {
    const [m] = normalizeMakeupList(makeupForSave([{ ...base, id: "polvo-cejas-pink21", category: "cejas" }]))!;
    expect(m.image).toBeUndefined();
    expect(m.video).toBeUndefined();
  });

  it("lo que se cargó desde el admin gana sobre lo de la tienda", () => {
    const [m] = normalizeMakeupList([{ ...guardado, image: "https://x.public.blob.vercel-storage.com/a.webp" }])!;
    expect(m.image).toBe("https://x.public.blob.vercel-storage.com/a.webp");
  });
});

describe("galería de fotos y videos del maquillaje", () => {
  const foto = "https://x.public.blob.vercel-storage.com/maquillaje/a.webp";
  const foto2 = "https://x.public.blob.vercel-storage.com/maquillaje/b.jpg";
  const video = "https://x.public.blob.vercel-storage.com/maquillaje/c.mp4";

  it("reconoce los videos por la extensión", () => {
    expect(isVideoUrl(video)).toBe(true);
    expect(isVideoUrl(video + "?v=1")).toBe(true);
    expect(isVideoUrl(foto)).toBe(false);
  });

  it("respeta el orden, saca repetidos y lo que no es una dirección válida", () => {
    expect(normalizeMedia([video, foto2, foto, foto, "javascript:alert(1)", 3, "//otro.com/x.jpg"])).toEqual([video, foto2, foto]);
    expect(normalizeMedia(`${foto}\n\n${video}\n`)).toEqual([foto, video]);
    expect(normalizeMedia([])).toBeUndefined();
  });

  it("sin galería, se usa la foto y el video que tenga el producto", () => {
    expect(makeupMedia({ image: foto, video })).toEqual([foto, video]);
    expect(makeupMedia({ image: foto, video, media: [video, foto2] })).toEqual([video, foto2]);
    expect(makeupMedia({})).toEqual([]);
  });

  it("normalizeMakeupList guarda la galería y la descripción ampliada", () => {
    const [m] = normalizeMakeupList([{ id: "a", name: "Labial", category: "labios", price: 100, media: [video, foto], details: "Dura todo el día." }])!;
    expect(m.media).toEqual([video, foto]);
    expect(m.details).toBe("Dura todo el día.");
  });
});
