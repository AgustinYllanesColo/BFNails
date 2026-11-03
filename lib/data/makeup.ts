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
  /** Foto de portada (la primera foto de `media`). Mientras falte, se dibuja el producto con `form` y `hex`. */
  image?: string;
  /**
   * Fotos y videos del producto, en el orden en que se ven en la vista ampliada (se ordenan desde el admin).
   * Los videos se reconocen por la extensión (ver `isVideoUrl`).
   */
  media?: string[];
  /** Descripción para la vista ampliada: corta y sencilla (para qué sirve, cómo se usa). */
  details?: string;
  /** Color del producto para el dibujo provisorio. */
  hex?: string;
  /** Tonos disponibles (ej. "02", "Nude 4"). Si hay, la clienta elige uno antes de sumarlo. */
  shades?: string[];
  /** Código del proveedor, para Brenda. */
  code?: string;
  /** Destacado en la home. */
  featured?: boolean;
  /** Recién llegado: lleva la etiqueta "Nuevo". */
  isNew?: boolean;
  /**
   * Combos: qué productos sueltos lleva. Al venderse descuenta su stock, y el combo se ve agotado cuando falta alguno.
   * Lo que no está a la venta suelto (las brochas del set) no se cuenta.
   */
  includes?: { id: string; qty: number }[];
  active: boolean;
};

const p = (x: Omit<MakeupProduct, "active" | "isNew"> & { isNew?: boolean }): MakeupProduct => ({ isNew: false, active: true, ...x });

export const DEFAULT_MAKEUP: MakeupProduct[] = [
  // Rostro
  p({ id: "base-liquida-ruby", name: "Base líquida Soft Matt", brand: "Ruby Rose", description: "Cobertura pareja y liviana para todos los días.", category: "rostro", form: "base", price: 5200, stock: 2, hex: "#e2b48f", shades: ["Bege 4", "Nude 4"], code: "HB-8050", featured: true }),
  p({ id: "polvo-compacto-pink21", name: "Polvo compacto Perfect Finish", brand: "Pink21", description: "Sella la base y saca el brillo.", category: "rostro", form: "polvo", price: 5900, stock: 2, hex: "#e3b896", shades: ["05", "06"], code: "CS4716" }),
  p({ id: "polvo-volati", name: "Polvo suelto", brand: "Volati", description: "Polvo para sellar y difuminar.", category: "rostro", form: "suelto", price: 6400, stock: 3, hex: "#f4dcc6", code: "TEI8009" }),
  p({ id: "rubor-crema-magic-color", name: "Rubor en crema", brand: "Magic Color", description: "Se aplica con los dedos y se funde con la piel.", category: "rostro", form: "rubor", price: 3400, stock: 5, hex: "#e5848f", shades: ["Rosa", "Negro"], code: "CS5167", featured: true }),
  p({ id: "rubor-magico-rimera-quince", name: "Rubor mágico", brand: "Rimera Quince", description: "Rubor en crema, se funde con la piel.", category: "rostro", form: "rubor-barra", price: 3900, stock: 3, hex: "#ee6f8e", shades: ["01", "02", "03"], code: "RQ33" }),
  p({ id: "iluminador-barra-rimera-quince", name: "Iluminador en barra", brand: "Rimera Quince", description: "Brillo en pómulos, nariz y arco de cupido.", category: "rostro", form: "barra", price: 4400, stock: 2, hex: "#f3d9a4", code: "RQ34", featured: true }),
  // Ojos
  p({ id: "delineador-ojos", name: "Delineador Perfect Finish", brand: "Pink21", description: "Trazo intenso y preciso.", category: "ojos", form: "delineador", price: 2200, stock: 4, hex: "#1d1a1a", shades: ["02", "05"], code: "CS7030" }),
  p({ id: "delineador-liquido-lapiz-2en1", name: "Delineador líquido + lápiz 2 en 1", brand: "Rimera Quince", description: "Un lado líquido para el rabito y un lado lápiz.", category: "ojos", form: "doble", price: 3800, stock: 3, hex: "#6d2a4e", code: "RQ08" }),
  p({ id: "delineador-pink21-x12", name: "Lápiz delineador", brand: "Pink21", description: "Negro, con sacapuntas en la tapa. Precio por unidad.", category: "ojos", form: "lapiz", price: 1100, stock: 12, hex: "#1d1a1a", code: "CS3420" }),
  p({ id: "perfilador-naez-x3", name: "Perfiladores ×3", brand: "Naez", description: "Set de 3 lápices perfiladores.", category: "ojos", form: "set-lapices", price: 1300, stock: 5, hex: "#6b4430", code: "DD2996" }),
  // Pestañas
  p({ id: "mascara-sky-high", name: "Máscara Sky High", description: "Alarga y separa pestaña por pestaña.", category: "pestanas", form: "mascara", price: 3600, stock: 2, hex: "#ef8fb0", code: "TEI8002", featured: true }),
  p({ id: "mascara-4d-pink21", name: "Máscara 4D", brand: "Pink21", description: "Volumen y largo en una pasada.", category: "pestanas", form: "mascara", price: 4400, stock: 2, hex: "#5b3a74", code: "CS3429" }),
  p({ id: "mascara-amarilla-pink21", name: "Máscara amarilla", brand: "Pink21", description: "La clásica de tubo amarillo.", category: "pestanas", form: "mascara", price: 4100, stock: 3, hex: "#f2c94c", code: "CS2552" }),
  p({ id: "mascara-pestanas", name: "Silver Mascara", brand: "Pink21", description: "Negro intenso para todos los días.", category: "pestanas", form: "mascara", price: 4100, stock: 3, hex: "#1f1d20", code: "CS6919" }),
  p({ id: "pestanas-50d-naez", name: "Pestañas 50D", brand: "Naez", description: "Pestañas postizas de mucho volumen.", category: "pestanas", form: "pestanas", price: 5600, stock: 2, hex: "#1d1a1a", code: "DD2870" }),
  p({ id: "pestanas-racimo-eyelash-bond", name: "Pestañas en racimo", brand: "Eyelash Bond", description: "Racimos para armar el volumen a tu gusto.", category: "pestanas", form: "racimo", price: 14000, stock: 1, hex: "#1d1a1a", code: "DD3402" }),
  // Cejas
  p({ id: "polvo-cejas-pink21", name: "Polvo para cejas", brand: "Pink21", description: "Cuatro tonos para rellenar y definir.", category: "cejas", form: "duo-cejas", price: 3500, stock: 7, hex: "#7a5643", code: "CS6850" }),
  p({ id: "gel-cejas-pink21", name: "Gel para cejas", brand: "Pink21", description: "Peina y fija las cejas todo el día.", category: "cejas", form: "gel", price: 3500, stock: 3, hex: "#c9b8a8", code: "CS6418" }),
  // Labios
  p({ id: "lip-gloss-brillo", name: "Lip gloss con brillo", brand: "Pink21", description: "Brillo jugoso con destellos.", category: "labios", form: "gloss", price: 3800, stock: 2, hex: "#f08fb0", shades: ["03"], code: "CS6696", featured: true }),
  p({ id: "lip-gloss-brillo-2", name: "Lip gloss con brillo", brand: "Pink21", description: "Brillo con destellos, en tono coral.", category: "labios", form: "gloss", price: 3300, stock: 1, hex: "#f2705e", shades: ["02"], code: "CS6695" }),
  p({ id: "lip-glaze-super-stay-matte", name: "Lip glaze Super Stay Matte", brand: "TEI", description: "Labial líquido mate de larga duración.", category: "labios", form: "gloss", price: 3400, stock: 3, hex: "#7d1a2e", shades: ["02", "04", "06"], code: "TEI8469" }),
  p({ id: "labial-matte-barra", name: "Labial matte en barra", brand: "TEI", description: "Color pleno y acabado mate.", category: "labios", form: "labial", price: 3300, stock: 2, hex: "#c42b3c", shades: ["01", "02"], code: "TEI8560" }),
  p({ id: "lapiz-labial-lip-contour", name: "Lápiz labial Lip Contour", brand: "TEI", description: "Contorno y relleno en un mismo lápiz.", category: "labios", form: "lapiz", price: 2300, stock: 3, hex: "#c98a84", shades: ["#11", "#12"], code: "TEI8235" }),
  p({ id: "lip-liner", name: "Lip liner", description: "Perfilador de labios.", category: "labios", form: "lapiz", price: 1900, stock: 2, hex: "#6b1d33", code: "CS7029" }),
  p({ id: "delineador-labio", name: "Delineador de labio", brand: "Miss Demi", description: "Perfila y evita que el labial se corra.", category: "labios", form: "lapiz", price: 1200, stock: 6, hex: "#b14e36", shades: ["14", "17", "19", "23", "24"], code: "DH-2207-C" }),
  // Combos (se arman por pedido: sin stock propio)
  p({
    id: "combo-1",
    name: "Combo 1",
    description:
      "Rubor en crema Magic Color Pink21, máscara Pumped Pink21, base líquida Ruby Rose, labial matte en barra, delineador de labio Miss Demi, delineador Perfect Finish Pink21 y 2 brochas.",
    category: "combos",
    form: "combo",
    price: 17900,
    priceBefore: 20600,
    image: "/maquillaje/combo-1.webp",
    includes: [
      { id: "rubor-crema-magic-color", qty: 1 },
      { id: "mascara-amarilla-pink21", qty: 1 },
      { id: "base-liquida-ruby", qty: 1 },
      { id: "labial-matte-barra", qty: 1 },
      { id: "delineador-labio", qty: 1 },
      { id: "delineador-ojos", qty: 1 },
    ],
    hex: "#f6c3d6",
    featured: true,
    isNew: true,
  }),
  p({
    id: "combo-2",
    name: "Combo 2",
    description:
      "Lápiz delineador Pink21, Silver Mascara Pink21, rubor en crema Rimera Quince, lápiz labial Lip Contour, lip gloss Pink21 y 1 brocha.",
    category: "combos",
    form: "combo",
    price: 13700,
    priceBefore: 15800,
    image: "/maquillaje/combo-2.webp",
    includes: [
      { id: "delineador-pink21-x12", qty: 1 },
      { id: "mascara-pestanas", qty: 1 },
      { id: "rubor-magico-rimera-quince", qty: 1 },
      { id: "lapiz-labial-lip-contour", qty: 1 },
      { id: "lip-gloss-brillo", qty: 1 },
    ],
    hex: "#c9a0dc",
    featured: true,
    isNew: true,
  }),
  p({
    id: "combo-3",
    name: "Combo 3",
    description: "Lápiz delineador Pink21, brocha City Girl, máscara Sky High y polvo para cejas Pink21 (4 tonos).",
    category: "combos",
    form: "combo",
    price: 8200,
    priceBefore: 9400,
    image: "/maquillaje/combo-3.webp",
    includes: [
      { id: "delineador-pink21-x12", qty: 1 },
      { id: "brocha-city", qty: 1 },
      { id: "mascara-sky-high", qty: 1 },
      { id: "polvo-cejas-pink21", qty: 1 },
    ],
    hex: "#e6a9b8",
    featured: true,
    isNew: true,
  }),
  // Brochas
  // Fuera de venta: 2 de sus 10 brochas van en el Combo 1
  { ...p({ id: "set-brochas", name: "Set de brochas", description: "Las brochas básicas para rostro y ojos.", category: "brochas", form: "brochas", price: 6000, stock: 1, hex: "#e7c2cf", code: "BC1080" }), active: false },
  p({ id: "brocha-city", name: "Brocha", brand: "City Girl", description: "Brocha suave para polvo y rubor.", category: "brochas", form: "brocha", price: 1200, stock: 4, hex: "#4a0e0e", code: "FB-20W-79" }),
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

/** Un video subido desde el admin (mp4, webm o mov). El resto de los archivos de `media` son fotos. */
export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(url);
}

/** Pone la portada (la primera foto) adelante de todo: los videos quedan detrás de la foto, nunca de entrada. */
function coverFirst(list: string[]): string[] {
  const cover = list.find((u) => !isVideoUrl(u));
  return cover ? [cover, ...list.filter((u) => u !== cover)] : list;
}

/**
 * Ordena fotos y videos y saca la portada: la primera foto de la lista, que queda primera aunque haya videos antes.
 * Los productos viejos (solo `image`) pasan a tener esa foto como único elemento.
 */
export function normalizeMedia(value: unknown, image?: string): { media?: string[]; image?: string } {
  const list = Array.isArray(value)
    ? value.filter((u): u is string => typeof u === "string" && /^(https:\/\/|\/)/.test(u.trim())).map((u) => u.trim())
    : [];
  const media = coverFirst([...new Set(list.length ? list : image ? [image] : [])].slice(0, MAKEUP_MEDIA_MAX));
  return { media: media.length ? media : undefined, image: media.find((u) => !isVideoUrl(u)) };
}

/**
 * Fotos y videos en orden, con la portada primero (los guardados antes con un video adelante también se ven así);
 * los productos sin `media` (los de fábrica) muestran su foto, si tienen.
 */
export function makeupMedia(p: Pick<MakeupProduct, "media" | "image">): string[] {
  return p.media?.length ? coverFirst(p.media) : p.image ? [p.image] : [];
}

/** Máximo de fotos y videos por producto. */
export const MAKEUP_MEDIA_MAX = 12;

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
      ...normalizeMedia(r.media, optStr(r.image)),
      details: optStr(r.details),
      hex: optStr(r.hex),
      shades: normalizeShades(r.shades),
      includes: normalizeIncludes(r.includes),
      code: optStr(r.code),
      featured: r.featured === true,
      isNew: r.isNew === true,
      active: r.active !== false,
    });
  }
  return out;
}

/** Lista de tonos limpia: textos cortos, sin vacíos ni repetidos, hasta 30. Vacía = sin tonos. */
export function normalizeShades(value: unknown): string[] | undefined {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v !== "string") continue;
    const t = v.trim().slice(0, 30);
    if (t && !out.includes(t)) out.push(t);
  }
  return out.length ? out.slice(0, 30) : undefined;
}

/** Nombre de la línea del pedido con el tono elegido (así lo leen el carrito, el WhatsApp, los mails y MP). */
export function makeupLineName(name: string, shade?: string): string {
  return shade ? `${name} · tono ${shade}` : name;
}

const units = (n: number) => `${n === 1 ? "queda" : "quedan"} ${n} ${n === 1 ? "unidad" : "unidades"}`;

/**
 * Valida las líneas de maquillaje de un pedido contra el catálogo (todos los productos, también los pausados,
 * para poder nombrarlos). Suma las filas repetidas del mismo producto antes de comparar con el stock.
 * Devuelve el mensaje de error para la clienta, o null si está todo bien.
 */
export function checkMakeupLines(lines: { makeupId: string; qty: number; shade?: string }[], all: MakeupProduct[]): string | null {
  for (const l of lines) {
    const product = all.find((m) => m.id === l.makeupId);
    if (!product?.active) continue; // lo informa el control de abajo
    if (product.shades?.length) {
      if (!l.shade) return `Elegí el tono de ${product.name} (sacalo del carrito y volvé a sumarlo).`;
      if (!product.shades.includes(l.shade))
        return `El tono ${l.shade} de ${product.name} ya no está disponible. Sacalo del carrito y elegí otro.`;
    }
  }
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
  // los combos comparten productos con los sueltos (y entre sí): se mira lo que se lleva en total de cada uno
  const short = makeupShortage(makeupDemand(lines, all), all);
  if (short) {
    if (short.left === 0) return `${short.product.name} se agotó (va suelto o en un combo de tu carrito). Sacalo del carrito para seguir.`;
    return `De ${short.product.name} ${units(short.left)} (va suelto o en un combo de tu carrito). Bajá la cantidad en el carrito.`;
  }
  return null;
}

function normalizeIncludes(value: unknown): MakeupProduct["includes"] {
  if (!Array.isArray(value)) return undefined;
  const out = value.flatMap((v) => {
    const r = v as Record<string, unknown> | null;
    return r && typeof r.id === "string" && r.id && isNat(r.qty) && r.qty > 0 ? [{ id: r.id, qty: r.qty }] : [];
  });
  return out.length ? out : undefined;
}

/* ---------- Stock ---------- */

/** Unidades vendidas por producto que todavía no se descontaron del stock cargado (puede ser negativo: devoluciones). */
export type MakeupSold = Record<string, number>;

/**
 * Cuánto se lleva de cada producto suelto un conjunto de líneas: los combos se abren en lo que traen.
 * Un combo sin `includes` se cuenta como producto propio.
 */
export function makeupDemand(lines: { makeupId: string; qty: number }[], all: MakeupProduct[]): Map<string, number> {
  const out = new Map<string, number>();
  const add = (id: string, n: number) => out.set(id, (out.get(id) ?? 0) + n);
  for (const l of lines) {
    const product = all.find((m) => m.id === l.makeupId);
    if (product?.includes?.length) for (const c of product.includes) add(c.id, c.qty * l.qty);
    else add(l.makeupId, l.qty);
  }
  return out;
}

/**
 * Stock real: el cargado menos lo vendido. Un combo queda con el stock del producto que menos le alcanza
 * (sin control si ninguno de los que trae lo tiene).
 */
export function applyMakeupSold(all: MakeupProduct[], sold: MakeupSold): MakeupProduct[] {
  const loose = all.map((m) => (m.stock == null || !sold[m.id] ? m : { ...m, stock: Math.max(0, m.stock - sold[m.id]) }));
  return loose.map((m) => {
    if (!m.includes?.length) return m;
    let stock: number | undefined;
    for (const c of m.includes) {
      const part = loose.find((x) => x.id === c.id);
      if (!part || part.stock == null) continue;
      const fits = part.active ? Math.floor(part.stock / c.qty) : 0;
      stock = stock == null ? fits : Math.min(stock, fits);
    }
    return stock == null ? m : { ...m, stock };
  });
}

/** Lo vendido después de sumar (sign 1, un pedido) o devolver (sign -1, un pedido cancelado) una demanda. */
export function addMakeupSold(sold: MakeupSold, demand: Map<string, number>, sign: 1 | -1): MakeupSold {
  const out = { ...sold };
  for (const [id, n] of demand) {
    const v = (out[id] ?? 0) + sign * n;
    if (v === 0) delete out[id];
    else out[id] = v;
  }
  return out;
}

/** Primer producto (con stock controlado) del que no alcanzan las unidades para esta demanda, o null. */
export function makeupShortage(demand: Map<string, number>, all: MakeupProduct[]): { product: MakeupProduct; left: number } | null {
  for (const [id, n] of demand) {
    const product = all.find((m) => m.id === id);
    if (product && product.stock != null && n > product.stock) return { product, left: product.stock };
  }
  return null;
}
