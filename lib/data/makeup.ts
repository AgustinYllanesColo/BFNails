/**
 * Maquillaje: productos de reventa (compra mayorista en Bella Central, 01/11). Se guardan como JSON en `settings`
 * (clave `makeup`) y se editan desde Admin → Promos, dijes y kit → Maquillaje. Este archivo solo tiene tipos y valores
 * por defecto, así lo pueden importar el cliente y el servidor.
 *
 * Precios provisorios: el doble del costo, redondeado a $100 hacia arriba. Se reemplazan por la lista final de Brenda.
 * El costo no vive acá a propósito: estos datos llegan al navegador.
 */

export const MAKEUP_CATEGORIES = [
  { id: "rostro", label: "Rostro" },
  { id: "ojos", label: "Ojos" },
  { id: "pestanas", label: "Pestañas" },
  { id: "cejas", label: "Cejas" },
  { id: "labios", label: "Labios" },
  { id: "brochas", label: "Brochas" },
  // Combos: varios productos juntos a un precio. Se cargan desde el admin con la categoría "Combos"; el filtro aparece
  // apenas hay uno disponible.
  { id: "combos", label: "Combos" },
] as const;
export type MakeupCategory = (typeof MAKEUP_CATEGORIES)[number]["id"];

/** Formas del producto: definen el dibujo que se muestra mientras no hay foto. Lista única (admin y validación). */
export const MAKEUP_FORMS = [
  "brochas",
  "brocha",
  "lapiz",
  "delineador",
  "mascara",
  "pestanas",
  "polvo",
  "rubor",
  "gloss",
  "labial",
  "barra",
  "base",
  "gel",
  "suelto",
  "doble",
  "racimo",
  "set-lapices",
  "rubor-barra",
  "duo-cejas",
  "combo",
] as const;
export type MakeupForm = (typeof MAKEUP_FORMS)[number];

export type MakeupProduct = {
  id: string;
  name: string;
  /** Marca o línea, si se conoce (Pink21, Naez, Rimera Quince…). */
  brand?: string;
  /** Una línea para la tarjeta. */
  description?: string;
  category: MakeupCategory;
  form: MakeupForm;
  /** Precio por unidad. */
  price: number;
  /** Precio anterior (tachado): oferta momentánea. */
  priceBefore?: number;
  /** Unidades disponibles. 0 = agotado (se ve, pero no se puede sumar). Vacío = sin control de stock. */
  stock?: number;
  /** Foto real (fondo liso). Mientras falte, se dibuja el producto con `form` y `hex`. */
  image?: string;
  /** Color del producto para el dibujo provisorio. */
  hex?: string;
  /** Código del proveedor, para Brenda. */
  code?: string;
  /** Destacado en la home. */
  featured?: boolean;
  /** Recién llegado: lleva la etiqueta "Nuevo". */
  isNew?: boolean;
  active: boolean;
};

const p = (x: Omit<MakeupProduct, "active" | "isNew"> & { isNew?: boolean }): MakeupProduct => ({ isNew: false, active: true, ...x });

export const DEFAULT_MAKEUP: MakeupProduct[] = [
  // Rostro
  p({ id: "base-liquida-ruby", name: "Base líquida", brand: "Ruby", description: "Cobertura pareja y liviana para todos los días.", category: "rostro", form: "base", price: 5200, stock: 2, hex: "#e2b48f", code: "HB-8050", featured: true }),
  p({ id: "polvo-compacto-pink21", name: "Polvo compacto", brand: "Pink21", description: "Sella la base y saca el brillo.", category: "rostro", form: "polvo", price: 5900, stock: 2, hex: "#e3b896", code: "CS4716" }),
  p({ id: "polvo-volati", name: "Polvo suelto", brand: "Volati", description: "Polvo para sellar y difuminar.", category: "rostro", form: "suelto", price: 6400, stock: 3, hex: "#f4dcc6", code: "TEI8009" }),
  p({ id: "rubor-crema-magic-color", name: "Rubor en crema", brand: "Magic Color", description: "Se aplica con los dedos y se funde con la piel.", category: "rostro", form: "rubor", price: 3400, stock: 5, hex: "#e5848f", code: "CS5167", featured: true }),
  p({ id: "rubor-magico-rimera-quince", name: "Rubor mágico", brand: "Rimera Quince", description: "Cambia de tono con la piel.", category: "rostro", form: "rubor-barra", price: 3900, stock: 3, hex: "#ee6f8e", code: "RQ33" }),
  p({ id: "iluminador-barra-rimera-quince", name: "Iluminador en barra", brand: "Rimera Quince", description: "Brillo en pómulos, nariz y arco de cupido.", category: "rostro", form: "barra", price: 4400, stock: 2, hex: "#f3d9a4", code: "RQ34", featured: true }),
  // Ojos
  p({ id: "delineador-ojos", name: "Delineador para ojos", description: "Trazo negro, intenso y preciso.", category: "ojos", form: "delineador", price: 2200, stock: 4, hex: "#1d1a1a", code: "CS7030" }),
  p({ id: "delineador-liquido-lapiz-2en1", name: "Delineador líquido + lápiz 2 en 1", brand: "Rimera Quince", description: "Un lado líquido para el rabito y un lado lápiz.", category: "ojos", form: "doble", price: 3800, stock: 3, hex: "#6d2a4e", code: "RQ08" }),
  p({ id: "delineador-pink21-x12", name: "Delineadores ×12", brand: "Pink21", description: "Caja de 12 delineadores.", category: "ojos", form: "set-lapices", price: 10800, stock: 1, hex: "#1d1a1a", code: "CS3420" }),
  p({ id: "perfilador-naez-x3", name: "Perfiladores ×3", brand: "Naez", description: "Set de 3 lápices perfiladores.", category: "ojos", form: "set-lapices", price: 1300, stock: 5, hex: "#6b4430", code: "DD2996" }),
  // Pestañas
  p({ id: "mascara-sky-high", name: "Máscara Sky High", description: "Alarga y separa pestaña por pestaña.", category: "pestanas", form: "mascara", price: 3600, stock: 2, hex: "#ef8fb0", code: "TEI8002", featured: true }),
  p({ id: "mascara-4d-pink21", name: "Máscara 4D", brand: "Pink21", description: "Volumen y largo en una pasada.", category: "pestanas", form: "mascara", price: 4400, stock: 2, hex: "#5b3a74", code: "CS3429" }),
  p({ id: "mascara-amarilla-pink21", name: "Máscara amarilla", brand: "Pink21", description: "La clásica de tubo amarillo.", category: "pestanas", form: "mascara", price: 4100, stock: 3, hex: "#f2c94c", code: "CS2552" }),
  p({ id: "mascara-pestanas", name: "Máscara para pestañas", description: "Negro intenso para todos los días.", category: "pestanas", form: "mascara", price: 4100, stock: 3, hex: "#1f1d20", code: "CS6919" }),
  p({ id: "pestanas-50d-naez", name: "Pestañas 50D", brand: "Naez", description: "Pestañas postizas de mucho volumen.", category: "pestanas", form: "pestanas", price: 5600, stock: 2, hex: "#1d1a1a", code: "DD2870" }),
  p({ id: "pestanas-racimo-eyelash-bond", name: "Pestañas en racimo", brand: "Eyelash Bond", description: "Racimos para armar el volumen a tu gusto.", category: "pestanas", form: "racimo", price: 14000, stock: 1, hex: "#1d1a1a", code: "DD3402" }),
  // Cejas
  p({ id: "polvo-cejas-pink21", name: "Polvo para cejas", brand: "Pink21", description: "Rellena y define con un acabado natural.", category: "cejas", form: "duo-cejas", price: 3500, stock: 7, hex: "#7a5643", code: "CS6850" }),
  p({ id: "gel-cejas-pink21", name: "Gel para cejas", brand: "Pink21", description: "Peina y fija las cejas todo el día.", category: "cejas", form: "gel", price: 3500, stock: 3, hex: "#c9b8a8", code: "CS6418" }),
  // Labios
  p({ id: "lip-gloss-brillo", name: "Lip gloss con brillo", description: "Brillo jugoso con destellos.", category: "labios", form: "gloss", price: 3800, stock: 2, hex: "#f08fb0", code: "CS6696", featured: true }),
  p({ id: "lip-gloss-brillo-2", name: "Lip gloss con brillo · tono 2", description: "Brillo con destellos, en tono coral.", category: "labios", form: "gloss", price: 3300, stock: 1, hex: "#f2705e", code: "CS6695" }),
  p({ id: "lip-glaze-super-stay-matte", name: "Lip glaze Super Stay Matte", description: "Labial líquido mate de larga duración.", category: "labios", form: "gloss", price: 3400, stock: 3, hex: "#7d1a2e", code: "TEI8469" }),
  p({ id: "labial-matte-barra", name: "Labial matte en barra", description: "Color pleno y acabado mate.", category: "labios", form: "labial", price: 3300, stock: 2, hex: "#c42b3c", code: "TEI8560" }),
  p({ id: "lapiz-labial-lip-contour", name: "Lápiz labial Lip Contour", description: "Contorno y relleno en un mismo lápiz.", category: "labios", form: "lapiz", price: 2300, stock: 3, hex: "#c98a84", code: "TEI8235" }),
  p({ id: "lip-liner", name: "Lip liner", description: "Perfilador de labios.", category: "labios", form: "lapiz", price: 1900, stock: 2, hex: "#6b1d33", code: "CS7029" }),
  p({ id: "delineador-labio", name: "Delineador de labio", description: "Perfila y evita que el labial se corra.", category: "labios", form: "lapiz", price: 1200, stock: 6, hex: "#b14e36", code: "DH-2207-C" }),
  // Combos (se arman por pedido: sin stock propio)
  p({
    id: "combo-1",
    name: "Combo 1",
    description:
      "Rubor en crema Magic Color, máscara amarilla Pink21, base líquida Ruby, labial matte en barra, delineador de labio, delineador para ojos y 2 brochas.",
    category: "combos",
    form: "combo",
    price: 17900,
    priceBefore: 20600,
    hex: "#f6c3d6",
    featured: true,
    isNew: true,
  }),
  // Brochas
  // Fuera de venta: 2 de sus 10 brochas van en el Combo 1
  { ...p({ id: "set-brochas", name: "Set de brochas", description: "Las brochas básicas para rostro y ojos.", category: "brochas", form: "brochas", price: 6000, stock: 1, hex: "#e7c2cf", code: "BC1080" }), active: false },
  p({ id: "brocha-city", name: "Brocha City", description: "Brocha suave para polvo y rubor.", category: "brochas", form: "brocha", price: 1200, stock: 4, hex: "#4a0e0e", code: "FB-20W-79" }),
];

export function makeupInStock(m: MakeupProduct): boolean {
  return m.stock == null || m.stock > 0;
}

/** Tope de unidades que se pueden pedir de un producto. */
export function makeupMaxQty(m: Pick<MakeupProduct, "stock">): number {
  return m.stock == null ? 20 : Math.max(0, Math.min(20, m.stock));
}

/** Lo que llega al navegador: sin el código del proveedor (es solo para Brenda, en el admin). */
export function toPublicMakeup(m: MakeupProduct): MakeupProduct {
  const { code: _code, ...rest } = m;
  void _code;
  return rest;
}

const CATEGORY_IDS = new Set<string>(MAKEUP_CATEGORIES.map((c) => c.id));
const FORM_IDS = new Set<string>(MAKEUP_FORMS);
const isNat = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;
const optStr = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

/**
 * Lo guardado en `settings.makeup` puede venir de una versión anterior (sin campos nuevos) o roto.
 * Devuelve null si no es una lista (se usa el valor por defecto); si es una lista, completa lo que falta
 * y descarta las filas que no se pueden vender (sin id, nombre, categoría válida o precio).
 */
export function normalizeMakeupList(value: unknown): MakeupProduct[] | null {
  if (!Array.isArray(value)) return null;
  const out: MakeupProduct[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.id !== "string" || !r.id || typeof r.name !== "string" || !r.name) continue;
    if (typeof r.category !== "string" || !CATEGORY_IDS.has(r.category) || !isNat(r.price)) continue;
    out.push({
      id: r.id,
      name: r.name,
      brand: optStr(r.brand),
      description: optStr(r.description),
      category: r.category as MakeupCategory,
      form: typeof r.form === "string" && FORM_IDS.has(r.form) ? (r.form as MakeupForm) : "labial",
      price: r.price,
      priceBefore: isNat(r.priceBefore) && r.priceBefore > r.price ? r.priceBefore : undefined,
      stock: isNat(r.stock) ? r.stock : undefined,
      image: optStr(r.image),
      hex: optStr(r.hex),
      code: optStr(r.code),
      featured: r.featured === true,
      isNew: r.isNew === true,
      active: r.active !== false,
    });
  }
  return out;
}

const units = (n: number) => `${n === 1 ? "queda" : "quedan"} ${n} ${n === 1 ? "unidad" : "unidades"}`;

/**
 * Valida las líneas de maquillaje de un pedido contra el catálogo (todos los productos, también los pausados,
 * para poder nombrarlos). Suma las filas repetidas del mismo producto antes de comparar con el stock.
 * Devuelve el mensaje de error para la clienta, o null si está todo bien.
 */
export function checkMakeupLines(lines: { makeupId: string; qty: number }[], all: MakeupProduct[]): string | null {
  const totals = new Map<string, number>();
  for (const l of lines) totals.set(l.makeupId, (totals.get(l.makeupId) ?? 0) + l.qty);
  for (const [id, qty] of totals) {
    const product = all.find((m) => m.id === id);
    if (!product || !product.active)
      return product
        ? `${product.name} ya no está disponible. Sacalo del carrito para seguir.`
        : "Un producto de maquillaje ya no está disponible. Sacalo del carrito para seguir.";
    // un precio 0 es un producto cargado sin precio todavía: no se vende gratis
    if (product.price <= 0) return `El producto ${product.name} todavía no tiene precio. Sacalo del carrito para seguir.`;
    const max = makeupMaxQty(product);
    if (product.stock === 0) return `${product.name} se agotó. Sacalo del carrito para seguir.`;
    if (qty > max)
      return product.stock != null && product.stock <= 20
        ? `De ${product.name} ${units(product.stock)}. Bajá la cantidad en el carrito.`
        : `De ${product.name} se pueden pedir hasta ${max} unidades. Bajá la cantidad en el carrito.`;
  }
  return null;
}
