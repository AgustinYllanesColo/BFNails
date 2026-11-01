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
] as const;
export type MakeupCategory = (typeof MAKEUP_CATEGORIES)[number]["id"];

/** Forma del producto: define el dibujo que se muestra mientras no hay foto. */
export type MakeupForm =
  | "brochas"
  | "brocha"
  | "lapiz"
  | "delineador"
  | "mascara"
  | "pestanas"
  | "polvo"
  | "rubor"
  | "gloss"
  | "labial"
  | "barra"
  | "base"
  | "gel";

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
  p({ id: "polvo-compacto-pink21", name: "Polvo compacto", brand: "Pink21", description: "Sella la base y saca el brillo.", category: "rostro", form: "polvo", price: 5900, stock: 2, hex: "#e9c3a2", code: "CS4716" }),
  p({ id: "polvo-volati", name: "Polvo suelto", brand: "Volati", description: "Polvo para sellar y difuminar.", category: "rostro", form: "polvo", price: 6400, stock: 3, hex: "#f1d6bd", code: "TEI8009" }),
  p({ id: "rubor-crema-magic-color", name: "Rubor en crema", brand: "Magic Color", description: "Se aplica con los dedos y se funde con la piel.", category: "rostro", form: "rubor", price: 3400, stock: 5, hex: "#e5848f", code: "CS5167", featured: true }),
  p({ id: "rubor-magico-rimera-quince", name: "Rubor mágico", brand: "Rimera Quince", description: "Cambia de tono con la piel.", category: "rostro", form: "barra", price: 3900, stock: 3, hex: "#d9667c", code: "RQ33" }),
  p({ id: "iluminador-barra-rimera-quince", name: "Iluminador en barra", brand: "Rimera Quince", description: "Brillo en pómulos, nariz y arco de cupido.", category: "rostro", form: "barra", price: 4400, stock: 2, hex: "#f3d9a4", code: "RQ34", featured: true }),
  // Ojos
  p({ id: "delineador-ojos", name: "Delineador para ojos", description: "Trazo negro, intenso y preciso.", category: "ojos", form: "delineador", price: 2200, stock: 4, hex: "#1d1a1a", code: "CS7030" }),
  p({ id: "delineador-liquido-lapiz-2en1", name: "Delineador líquido + lápiz 2 en 1", brand: "Rimera Quince", description: "Un lado líquido para el rabito y un lado lápiz.", category: "ojos", form: "delineador", price: 3800, stock: 3, hex: "#1d1a1a", code: "RQ08" }),
  p({ id: "delineador-pink21-x12", name: "Delineadores ×12", brand: "Pink21", description: "Caja de 12 delineadores.", category: "ojos", form: "lapiz", price: 10800, stock: 1, hex: "#2b2424", code: "CS3420" }),
  p({ id: "perfilador-naez-x3", name: "Perfiladores ×3", brand: "Naez", description: "Set de 3 lápices perfiladores.", category: "ojos", form: "lapiz", price: 1300, stock: 5, hex: "#5a3a2e", code: "DD2996" }),
  // Pestañas
  p({ id: "mascara-sky-high", name: "Máscara Sky High", description: "Alarga y separa pestaña por pestaña.", category: "pestanas", form: "mascara", price: 3600, stock: 2, hex: "#e6a9b8", code: "TEI8002", featured: true }),
  p({ id: "mascara-4d-pink21", name: "Máscara 4D", brand: "Pink21", description: "Volumen y largo en una pasada.", category: "pestanas", form: "mascara", price: 4400, stock: 2, hex: "#2a2a2a", code: "CS3429" }),
  p({ id: "mascara-amarilla-pink21", name: "Máscara amarilla", brand: "Pink21", description: "La clásica de tubo amarillo.", category: "pestanas", form: "mascara", price: 4100, stock: 3, hex: "#f2c94c", code: "CS2552" }),
  p({ id: "mascara-pestanas", name: "Máscara para pestañas", description: "Negro intenso para todos los días.", category: "pestanas", form: "mascara", price: 4100, stock: 3, hex: "#3b3b3b", code: "CS6919" }),
  p({ id: "pestanas-50d-naez", name: "Pestañas 50D", brand: "Naez", description: "Pestañas postizas de mucho volumen.", category: "pestanas", form: "pestanas", price: 5600, stock: 2, hex: "#1d1a1a", code: "DD2870" }),
  p({ id: "pestanas-racimo-eyelash-bond", name: "Pestañas en racimo", brand: "Eyelash Bond", description: "Racimos para armar el volumen a tu gusto.", category: "pestanas", form: "pestanas", price: 14000, stock: 1, hex: "#1d1a1a", code: "DD3402" }),
  // Cejas
  p({ id: "polvo-cejas-pink21", name: "Polvo para cejas", brand: "Pink21", description: "Rellena y define con un acabado natural.", category: "cejas", form: "polvo", price: 3500, stock: 7, hex: "#7a5643", code: "CS6850" }),
  p({ id: "gel-cejas-pink21", name: "Gel para cejas", brand: "Pink21", description: "Peina y fija las cejas todo el día.", category: "cejas", form: "gel", price: 3500, stock: 3, hex: "#c9b8a8", code: "CS6418" }),
  // Labios
  p({ id: "lip-gloss-brillo", name: "Lip gloss con brillo", description: "Brillo jugoso con destellos.", category: "labios", form: "gloss", price: 3800, stock: 2, hex: "#f08fb0", code: "CS6696", featured: true }),
  p({ id: "lip-gloss-brillo-2", name: "Lip gloss con brillo · tono 2", description: "Brillo jugoso con destellos.", category: "labios", form: "gloss", price: 3300, stock: 1, hex: "#d9667c", code: "CS6695" }),
  p({ id: "lip-glaze-super-stay-matte", name: "Lip glaze Super Stay Matte", description: "Labial líquido mate de larga duración.", category: "labios", form: "gloss", price: 3400, stock: 3, hex: "#9c2f44", code: "TEI8469" }),
  p({ id: "labial-matte-barra", name: "Labial matte en barra", description: "Color pleno y acabado mate.", category: "labios", form: "labial", price: 3300, stock: 2, hex: "#b5384f", code: "TEI8560" }),
  p({ id: "lapiz-labial-lip-contour", name: "Lápiz labial Lip Contour", description: "Contorno y relleno en un mismo lápiz.", category: "labios", form: "lapiz", price: 2300, stock: 3, hex: "#a8505a", code: "TEI8235" }),
  p({ id: "lip-liner", name: "Lip liner", description: "Perfilador de labios.", category: "labios", form: "lapiz", price: 1900, stock: 2, hex: "#8e3b46", code: "CS7029" }),
  p({ id: "delineador-labio", name: "Delineador de labio", description: "Perfila y evita que el labial se corra.", category: "labios", form: "lapiz", price: 1200, stock: 6, hex: "#9a4a52", code: "DH-2207-C" }),
  // Brochas
  p({ id: "set-brochas", name: "Set de brochas", description: "Las brochas básicas para rostro y ojos.", category: "brochas", form: "brochas", price: 6000, stock: 1, hex: "#e7c2cf", code: "BC1080" }),
  p({ id: "brocha-city", name: "Brocha City", description: "Brocha suave para polvo y rubor.", category: "brochas", form: "brocha", price: 1200, stock: 4, hex: "#4a0e0e", code: "FB-20W-79" }),
];

export function makeupInStock(m: MakeupProduct): boolean {
  return m.stock == null || m.stock > 0;
}

/** Tope de unidades que se pueden pedir de un producto. */
export function makeupMaxQty(m: Pick<MakeupProduct, "stock">): number {
  return m.stock == null ? 20 : Math.max(0, Math.min(20, m.stock));
}
