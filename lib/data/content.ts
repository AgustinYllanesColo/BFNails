/**
 * Contenido editable desde el admin que no necesita tabla propia: promos de la semana, dijes y el kit de colocación.
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
  /** Familia para filtrar en la página de dijes y en el armador. */
  category?: CharmCategory;
  /**
   * Una sola pieza recortada (fondo transparente) para apoyarla sobre la uña en la vista previa. Los surtidos que
   * no se ponen como pieza (florcitas, glitter, stickers) no tienen.
   */
  piece?: string;
  active: boolean;
};

export const CHARM_CATEGORIES = [
  { id: "metal", label: "Metálicos" },
  { id: "monos", label: "Moños" },
  { id: "personajes", label: "Personajes" },
  { id: "brillos", label: "Brillos y piedras" },
  { id: "surtidos", label: "Surtidos y deco" },
  { id: "insumos", label: "Insumos" },
] as const;
export type CharmCategory = (typeof CHARM_CATEGORIES)[number]["id"];

export type KitItem = { name: string; detail?: string };
export type Kit = { items: KitItem[]; images: string[] };

/** Ejemplos para ver cómo quedan: se reemplazan apenas se guardan las promos desde el admin. */
export const DEFAULT_PROMOS: Promo[] = [
  {
    id: "stock-20",
    badge: "-20%",
    title: "Sets en stock",
    text: "Descuento en los sets listos para entrega inmediata.",
    image: "/catalog/set-polka-flower-640.webp",
    theme: "rojo",
    href: "/catalogo?stock=1",
    active: true,
  },
  {
    id: "4x3",
    badge: "4x3",
    title: "Llevá 4 sets, pagá 3",
    text: "Del catálogo, mezclando diseños.",
    image: "/catalog/set-pink-wave-640.webp",
    theme: "rosa",
    href: "/catalogo",
    active: true,
  },
  {
    id: "mayorista",
    badge: "Mayorista",
    title: "Precios por cantidad",
    text: "Para manicuras y reventa. Escribime.",
    image: "/catalog/set-milky-gold-foil-640.webp",
    theme: "bordo",
    active: true,
  },
];

/**
 * Los 64 dijes de Brenda. Fotos en public/dijes: recortadas sobre fondo transparente (los surtidos en caja o plancha
 * quedan como foto). Precios provisorios: se ajustan acá o desde el admin.
 */
export const DEFAULT_CHARMS: Charm[] = [
  { id: "estrellita-plateada", name: "Estrellita plateada", price: 300, category: "metal", image: "/dijes/estrellita-plateada.webp", piece: "/dijes-piezas/estrellita-plateada.webp", active: true },
  { id: "estrella-plateada", name: "Estrella plateada", price: 300, category: "metal", image: "/dijes/estrella-plateada.webp", piece: "/dijes-piezas/estrella-plateada.webp", active: true },
  { id: "cruz-plateada", name: "Cruz plateada", price: 300, category: "metal", image: "/dijes/cruz-plateada.webp", piece: "/dijes-piezas/cruz-plateada.webp", active: true },
  { id: "cruz-negra", name: "Cruz negra y plata", price: 350, category: "metal", image: "/dijes/cruz-negra.webp", piece: "/dijes-piezas/cruz-negra.webp", active: true },
  { id: "cruz-gotica", name: "Cruz gótica", price: 300, category: "metal", image: "/dijes/cruz-gotica.webp", piece: "/dijes-piezas/cruz-gotica.webp", active: true },
  { id: "corazon-negro-grande", name: "Corazón negro con bolitas", price: 400, category: "metal", image: "/dijes/corazon-negro-grande.webp", piece: "/dijes-piezas/corazon-negro-grande.webp", active: true },
  { id: "cruz-barras", name: "Cruz de barras", price: 300, category: "metal", image: "/dijes/cruz-barras.webp", piece: "/dijes-piezas/cruz-barras.webp", active: true },
  { id: "corazon-plateado", name: "Corazón plateado", price: 300, category: "metal", image: "/dijes/corazon-plateado.webp", piece: "/dijes-piezas/corazon-plateado.webp", active: true },
  { id: "flor-de-lis", name: "Flor de lis", price: 350, category: "metal", image: "/dijes/flor-de-lis.webp", piece: "/dijes-piezas/flor-de-lis.webp", active: true },
  { id: "corazon-negro", name: "Corazón negro", price: 350, category: "metal", image: "/dijes/corazon-negro.webp", piece: "/dijes-piezas/corazon-negro.webp", active: true },
  { id: "destello-plateado", name: "Destello plateado", price: 300, category: "metal", image: "/dijes/destello-plateado.webp", piece: "/dijes-piezas/destello-plateado.webp", active: true },
  { id: "cruz-gotica-grande", name: "Cruz gótica grande", price: 400, category: "metal", image: "/dijes/cruz-gotica-grande.webp", piece: "/dijes-piezas/cruz-gotica-grande.webp", active: true },
  { id: "cruces-piedras", name: "Cruces con piedras", price: 500, category: "metal", image: "/dijes/cruces-piedras.webp", piece: "/dijes-piezas/cruces-piedras.webp", active: true },
  { id: "mono-metal-strass", name: "Moño metálico con strass", price: 500, category: "metal", image: "/dijes/mono-metal-strass.webp", piece: "/dijes-piezas/mono-metal-strass.webp", active: true },
  { id: "planeta", name: "Planeta", price: 450, category: "metal", image: "/dijes/planeta.webp", piece: "/dijes-piezas/planeta.webp", active: true },
  { id: "piercing", name: "Aro piercing", price: 350, category: "metal", image: "/dijes/piercing.webp", piece: "/dijes-piezas/piercing.webp", active: true },
  { id: "estrellas-strass", name: "Estrella con strass", price: 450, category: "metal", image: "/dijes/estrellas-strass.webp", piece: "/dijes-piezas/estrellas-strass.webp", active: true },
  { id: "cruces-destellos", name: "Cruces y destellos plateados", price: 400, category: "metal", image: "/dijes/cruces-destellos.webp", piece: "/dijes-piezas/cruces-destellos.webp", active: true },
  { id: "serpiente-dorada", name: "Serpiente dorada con strass", price: 600, category: "metal", image: "/dijes/serpiente-dorada.webp", piece: "/dijes-piezas/serpiente-dorada.webp", active: true },
  { id: "corazon-gota", name: "Corazón con gota plateada", price: 550, category: "metal", image: "/dijes/corazon-gota.webp", piece: "/dijes-piezas/corazon-gota.webp", active: true },
  { id: "estrella-calada", name: "Estrella calada", price: 300, category: "metal", image: "/dijes/estrella-calada.webp", piece: "/dijes-piezas/estrella-calada.webp", active: true },
  { id: "conejitos-plateados", name: "Conejitos y ositos plateados", price: 450, category: "metal", image: "/dijes/conejitos-plateados.webp", piece: "/dijes-piezas/conejitos-plateados.webp", active: true },
  { id: "mono-tornasol", name: "Moño tornasolado", price: 350, category: "monos", image: "/dijes/mono-tornasol.webp", piece: "/dijes-piezas/mono-tornasol.webp", active: true },
  { id: "mono-tornasol-ancho", name: "Moño tornasolado ancho", price: 350, category: "monos", image: "/dijes/mono-tornasol-ancho.webp", piece: "/dijes-piezas/mono-tornasol-ancho.webp", active: true },
  { id: "mariposa-tornasol", name: "Mariposa tornasolada", price: 350, category: "monos", image: "/dijes/mariposa-tornasol.webp", piece: "/dijes-piezas/mariposa-tornasol.webp", active: true },
  { id: "mono-tornasol-corto", name: "Moño tornasolado corto", price: 350, category: "monos", image: "/dijes/mono-tornasol-corto.webp", piece: "/dijes-piezas/mono-tornasol-corto.webp", active: true },
  { id: "mono-tornasol-puntos", name: "Moño tornasolado con puntos", price: 350, category: "monos", image: "/dijes/mono-tornasol-puntos.webp", piece: "/dijes-piezas/mono-tornasol-puntos.webp", active: true },
  { id: "mono-tornasol-azul", name: "Moño tornasolado azul", price: 350, category: "monos", image: "/dijes/mono-tornasol-azul.webp", piece: "/dijes-piezas/mono-tornasol-azul.webp", active: true },
  { id: "mono-cristal", name: "Moño cristal", price: 350, category: "monos", image: "/dijes/mono-cristal.webp", piece: "/dijes-piezas/mono-cristal.webp", active: true },
  { id: "mono-animal-print", name: "Moño animal print", price: 350, category: "monos", image: "/dijes/mono-animal-print.webp", piece: "/dijes-piezas/mono-animal-print.webp", active: true },
  { id: "mono-cristal-grande", name: "Moño cristal grande", price: 350, category: "monos", image: "/dijes/mono-cristal-grande.webp", piece: "/dijes-piezas/mono-cristal-grande.webp", active: true },
  { id: "mono-negro", name: "Moño negro", price: 350, category: "monos", image: "/dijes/mono-negro.webp", piece: "/dijes-piezas/mono-negro.webp", active: true },
  { id: "kitty-mono-rojo", name: "Kitty con moño rojo", price: 450, category: "personajes", image: "/dijes/kitty-mono-rojo.webp", piece: "/dijes-piezas/kitty-mono-rojo.webp", active: true },
  { id: "kitty-estrella", name: "Kitty estrella animal print", price: 450, category: "personajes", image: "/dijes/kitty-estrella.webp", piece: "/dijes-piezas/kitty-estrella.webp", active: true },
  { id: "kitty-anteojos", name: "Kitty con anteojos de corazón", price: 450, category: "personajes", image: "/dijes/kitty-anteojos.webp", piece: "/dijes-piezas/kitty-anteojos.webp", active: true },
  { id: "kitty-animal-print", name: "Kitty animal print", price: 450, category: "personajes", image: "/dijes/kitty-animal-print.webp", piece: "/dijes-piezas/kitty-animal-print.webp", active: true },
  { id: "kitty-carita", name: "Kitty carita con moño animal print", price: 450, category: "personajes", image: "/dijes/kitty-carita.webp", piece: "/dijes-piezas/kitty-carita.webp", active: true },
  { id: "conejita-lila", name: "Conejita lila", price: 450, category: "personajes", image: "/dijes/conejita-lila.webp", piece: "/dijes-piezas/conejita-lila.webp", active: true },
  { id: "bulldog-fucsia", name: "Bulldog fucsia", price: 400, category: "personajes", image: "/dijes/bulldog-fucsia.webp", piece: "/dijes-piezas/bulldog-fucsia.webp", active: true },
  { id: "kitty-vestido-lila", name: "Kitty con vestido lila", price: 450, category: "personajes", image: "/dijes/kitty-vestido-lila.webp", piece: "/dijes-piezas/kitty-vestido-lila.webp", active: true },
  { id: "melody-bordo", name: "Melody bordó", price: 450, category: "personajes", image: "/dijes/melody-bordo.webp", piece: "/dijes-piezas/melody-bordo.webp", active: true },
  { id: "conejito-blanco", name: "Conejito blanco", price: 400, category: "personajes", image: "/dijes/conejito-blanco.webp", piece: "/dijes-piezas/conejito-blanco.webp", active: true },
  { id: "conejito-arcoiris", name: "Conejito arcoíris", price: 450, category: "personajes", image: "/dijes/conejito-arcoiris.webp", piece: "/dijes-piezas/conejito-arcoiris.webp", active: true },
  { id: "kuromi-cristal", name: "Kuromi y Melody cristal", price: 450, category: "personajes", image: "/dijes/kuromi-cristal.webp", piece: "/dijes-piezas/kuromi-cristal.webp", active: true },
  { id: "ositos-glitter", name: "Ositos con glitter", price: 400, category: "personajes", image: "/dijes/ositos-glitter.webp", piece: "/dijes-piezas/ositos-glitter.webp", active: true },
  { id: "kuromi", name: "Kuromi", price: 450, category: "personajes", image: "/dijes/kuromi.webp", piece: "/dijes-piezas/kuromi.webp", active: true },
  { id: "surtido-ositos-pastel", name: "Ositos y conejitos pastel", price: 400, category: "personajes", image: "/dijes/surtido-ositos-pastel.webp", piece: "/dijes-piezas/surtido-ositos-pastel.webp", active: true },
  { id: "perla-tornasol", name: "Perla tornasolada", price: 200, category: "brillos", image: "/dijes/perla-tornasol.webp", piece: "/dijes-piezas/perla-tornasol.webp", active: true },
  { id: "cristales-colores", name: "Cristales de colores", price: 300, category: "brillos", image: "/dijes/cristales-colores.webp", piece: "/dijes-piezas/cristales-colores.webp", active: true },
  { id: "corazon-perlitas", name: "Corazón de perlitas", price: 300, category: "brillos", image: "/dijes/corazon-perlitas.webp", piece: "/dijes-piezas/corazon-perlitas.webp", active: true },
  { id: "corazon-gelatina", name: "Corazón gelatina", price: 350, category: "brillos", image: "/dijes/corazon-gelatina.webp", piece: "/dijes-piezas/corazon-gelatina.webp", active: true },
  { id: "cerezas", name: "Cerezas", price: 500, category: "brillos", image: "/dijes/cerezas.webp", piece: "/dijes-piezas/cerezas.webp", active: true },
  { id: "strass-colores", name: "Strass de colores", price: 200, category: "brillos", image: "/dijes/strass-colores.webp", active: true },
  { id: "surtido-mariposas-peces", name: "Mariposas y pececitos", price: 400, category: "surtidos", image: "/dijes/surtido-mariposas-peces.webp", piece: "/dijes-piezas/surtido-mariposas-peces.webp", active: true },
  { id: "surtido-animalitos", name: "Animalitos de resina", price: 400, category: "surtidos", image: "/dijes/surtido-animalitos.webp", piece: "/dijes-piezas/surtido-animalitos.webp", active: true },
  { id: "florcitas", name: "Florcitas de colores", price: 200, category: "surtidos", image: "/dijes/florcitas.webp", active: true },
  { id: "caja-flores-monitos", name: "Flores y moñitos pastel", price: 250, category: "surtidos", image: "/dijes/caja-flores-monitos.webp", active: true },
  { id: "caja-dorados", name: "Dorados y flores", price: 300, category: "surtidos", image: "/dijes/caja-dorados.webp", active: true },
  { id: "surtido-gotico", name: "Surtido gótico negro", price: 350, category: "surtidos", image: "/dijes/surtido-gotico.webp", piece: "/dijes-piezas/surtido-gotico.webp", active: true },
  { id: "glitter-foil", name: "Glitter y foil", price: 300, category: "surtidos", image: "/dijes/glitter-foil.webp", active: true },
  { id: "perlas-flores-rosas", name: "Perlas y flores rosas", price: 200, category: "surtidos", image: "/dijes/perlas-flores-rosas.webp", active: true },
  { id: "monitos-corazones-rosas", name: "Moñitos y corazones rosas", price: 250, category: "surtidos", image: "/dijes/monitos-corazones-rosas.webp", active: true },
  { id: "stickers-mascotas", name: "Stickers gatitos y perritos", price: 300, category: "surtidos", image: "/dijes/stickers-mascotas.webp", active: true },
  { id: "stickers-superpoderosas", name: "Stickers Chicas Superpoderosas", price: 300, category: "surtidos", image: "/dijes/stickers-superpoderosas.webp", active: true },
  // Insumos: se suman al pedido por unidad (el kit ya trae un pegamento; este es uno extra)
  { id: "pegamento-cherimoya", name: "Pegamento Cherimoya brush-on 10 ml", price: 3000, category: "insumos", image: "/dijes/pegamento-cherimoya.webp", active: true },
];

/** Lo que trae el kit de colocación (según la guía de Brenda). Se edita desde Admin → Promos, dijes y kit. */
export const DEFAULT_KIT: Kit = {
  items: [
    { name: "Pegamento" },
    { name: "Lima" },
    { name: "Lima buffer" },
    { name: "Wipes" },
    { name: "Palito de naranjo" },
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
