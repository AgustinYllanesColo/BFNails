/**
 * Contenido editable desde el admin que no necesita tabla propia: promos de la semana, dijes y el kit de aplicación.
 * Se guarda como JSON en `settings` (claves `promos`, `charms`, `kit`). Este archivo solo tiene tipos y valores por
 * defecto, así lo pueden importar el cliente y el servidor.
 */

export type PromoTheme = "rojo" | "bordo" | "rosa" | "leopardo";

export type Promo = {
  id: string;
  /** Lo grande de la tarjeta: "-20%", "4x3", "Mayorista". */
  badge: string;
  title: string;
  text?: string;
  image?: string;
  /** Precio con promo y precio de antes (opcionales). */
  price?: number;
  priceBefore?: number;
  /** A dónde lleva la tarjeta: un diseño del catálogo, el armador o WhatsApp si queda vacío. */
  href?: string;
  /** Fecha (AAAA-MM-DD) hasta la que se muestra. Vacío: hasta que la saque. */
  until?: string;
  theme: PromoTheme;
  active: boolean;
};

export type Charm = {
  id: string;
  name: string;
  /** Precio por unidad. */
  price: number;
  image?: string;
  /** Color del dibujo cuando todavía no hay foto. */
  hex?: string;
  active: boolean;
};

export type KitItem = { name: string; detail?: string };
export type Kit = { items: KitItem[]; images: string[] };

/** Ejemplos para ver cómo quedan: se reemplazan apenas se guardan las promos desde el admin. */
export const DEFAULT_PROMOS: Promo[] = [
  {
    id: "francesita-semana",
    badge: "-20%",
    title: "Francesita de la semana",
    text: "Clásica o de color, cualquier forma.",
    theme: "rojo",
    href: "/disena",
    active: true,
  },
  {
    id: "4x3",
    badge: "4x3",
    title: "Llevá 4 sets, pagá 3",
    text: "Del catálogo, mezclando diseños.",
    theme: "leopardo",
    href: "/catalogo",
    active: true,
  },
  {
    id: "mayorista",
    badge: "Mayorista",
    title: "Precios por cantidad",
    text: "Para manicuras y reventa. Escribime.",
    theme: "bordo",
    active: true,
  },
];

export const DEFAULT_CHARMS: Charm[] = [
  { id: "corazon-dorado", name: "Corazón dorado", price: 300, hex: "#d9b25b", active: true },
  { id: "mono-perla", name: "Moño perla", price: 400, hex: "#f6efe6", active: true },
  { id: "estrella-plata", name: "Estrella plateada", price: 300, hex: "#c9ccd3", active: true },
  { id: "kitty", name: "Kitty", price: 500, hex: "#f2a7c3", active: true },
  { id: "perla", name: "Perla", price: 200, hex: "#fffaf0", active: true },
  { id: "cereza", name: "Cereza", price: 400, hex: "#b51c1c", active: true },
];

/** A CONFIRMAR CON BRENDA: lo que trae el kit (lo edita desde Admin → Contenido). */
export const DEFAULT_KIT: Kit = {
  items: [
    { name: "10 uñas soft gel", detail: "Hechas a tu medida" },
    { name: "Pegamento" },
    { name: "Stickers adhesivos", detail: "Para usarlas pocos días" },
    { name: "Lima" },
    { name: "Pulidor" },
    { name: "Palito de naranjo" },
    { name: "Toallita con alcohol" },
  ],
  images: [],
};

/** Una promo se muestra si está activa y no venció (la fecha `until` cuenta entera). */
export function promoIsLive(p: Promo, now = new Date()): boolean {
  if (!p.active) return false;
  if (!p.until) return true;
  const end = new Date(`${p.until}T23:59:59-03:00`);
  return Number.isNaN(end.getTime()) || end >= now;
}

/** Precio de los dijes elegidos (los que ya no existen no suman). */
export function charmsTotal(picked: Array<{ id: string; qty: number }> | undefined, charms: Charm[]): number {
  return (picked ?? []).reduce((acc, p) => acc + (charms.find((c) => c.id === p.id)?.price ?? 0) * p.qty, 0);
}
