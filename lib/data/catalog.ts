import type { Design } from "@/lib/types";

/**
 * Seed del catálogo. Las imágenes son placeholders generados en /api/placeholder
 * hasta que tengamos las fotos reales de Brenda. Cuando haya DB, esto es el seed
 * inicial y la fuente de verdad pasa a ser la tabla `designs`.
 *
 * Fotos reales sin base de datos: guardarlas en `public/designs/<slug>/` (4:5 vertical, p. ej. 1600 × 2000,
 * JPG o WebP) y listarlas en `images`, la principal primero:
 * `images: ["/designs/kitty-leopard/1.webp", "/designs/kitty-leopard/2.webp"]`.
 * Con base de datos se suben desde el admin (Catálogo → editar diseño → Imágenes).
 */
export const SEED_DESIGNS: Design[] = [
  {
    slug: "kitty-leopard",
    name: "Kitty Leopard",
    description: "Animal print en tonos leopardo con Kitty en el anular. El set de la casa.",
    images: [],
    shape: "almendra",
    length: "medio",
    finish: "glossy",
    complexity: 4,
    price: 22000,
    tags: ["animal print", "personajes", "signature"],
    featured: true,
    colors: ["#c9a063", "#4a0e0e", "#fffdf8"],
  },
  {
    slug: "francesita-clasica",
    name: "Francesita clásica",
    description: "Base nude con punta blanca fina. Minimal, para todos los días.",
    images: [],
    shape: "almendra",
    length: "corto",
    finish: "glossy",
    complexity: 1,
    price: 13500,
    tags: ["francesita", "minimal"],
    featured: true,
    colors: ["#e8c4b0", "#ffffff"],
  },
  {
    slug: "cherry-red",
    name: "Cherry Red",
    description: "Rojo cereza full glossy. Un clásico que no falla.",
    images: [],
    shape: "ovalada",
    length: "medio",
    finish: "glossy",
    complexity: 1,
    price: 12000,
    tags: ["liso", "rojo"],
    featured: true,
    colors: ["#b51c1c"],
  },
  {
    slug: "bordo-cromado",
    name: "Bordó cromado",
    description: "Bordó profundo con efecto espejo. Elegante y con mucha presencia.",
    images: [],
    shape: "coffin",
    length: "largo",
    finish: "cromado",
    complexity: 2,
    price: 17500,
    tags: ["cromado", "bordó"],
    featured: true,
    colors: ["#4a0e0e", "#8a2b2b"],
  },
  {
    slug: "milky-strass",
    name: "Milky & strass",
    description: "Base milky con strass en cada uña. Delicado y brillante.",
    images: [],
    shape: "almendra",
    length: "medio",
    finish: "glossy",
    complexity: 2,
    price: 16000,
    tags: ["strass", "milky", "novias"],
    colors: ["#f6efe6", "#e5e5e5"],
  },
  {
    slug: "aurora-lila",
    name: "Aurora lila",
    description: "Lila pastel con efecto aurora. Cambia con la luz.",
    images: [],
    shape: "ovalada",
    length: "corto",
    finish: "glossy",
    complexity: 2,
    price: 15500,
    tags: ["aurora", "pastel"],
    colors: ["#c6a4e6", "#e8d8f7"],
  },
  {
    slug: "cat-eye-negro",
    name: "Cat eye negro",
    description: "Negro con efecto cat eye magnético. Profundo y misterioso.",
    images: [],
    shape: "stiletto",
    length: "largo",
    finish: "glossy",
    complexity: 2,
    price: 16500,
    tags: ["cat eye", "negro"],
    colors: ["#1d1d1d", "#5a5a7a"],
  },
  {
    slug: "flores-de-primavera",
    name: "Flores de primavera",
    description: "Florcitas pintadas a mano sobre base nude. Cada uña es distinta.",
    images: [],
    shape: "almendra",
    length: "medio",
    finish: "mate",
    complexity: 3,
    price: 19000,
    tags: ["flores", "a mano"],
    colors: ["#e8c4b0", "#f2a7c3", "#6f9a6b"],
  },
  {
    slug: "moños-3d",
    name: "Moños 3D",
    description: "Rosa bebé con moños en relieve. Muy coquette.",
    images: [],
    shape: "cuadrada",
    length: "corto",
    finish: "glossy",
    complexity: 3,
    price: 18500,
    tags: ["3d", "coquette", "rosa"],
    colors: ["#f2a7c3", "#ffffff"],
  },
  {
    slug: "chocolate-mate",
    name: "Chocolate mate",
    description: "Marrón chocolate acabado mate. Sobrio y moderno.",
    images: [],
    shape: "coffin",
    length: "medio",
    finish: "mate",
    complexity: 1,
    price: 12500,
    tags: ["liso", "mate"],
    colors: ["#5a3a2a"],
  },
  {
    slug: "francesita-bordo",
    name: "Francesita bordó",
    description: "Francesita invertida con punta bordó y base transparente.",
    images: [],
    shape: "almendra",
    length: "largo",
    finish: "glossy",
    complexity: 2,
    price: 15000,
    tags: ["francesita", "bordó"],
    colors: ["#f8f5ef", "#4a0e0e"],
  },
  {
    slug: "glitter-party",
    name: "Glitter party",
    description: "Degradé de glitter dorado sobre nude. Para salir.",
    images: [],
    shape: "ovalada",
    length: "medio",
    finish: "glossy",
    complexity: 2,
    price: 15500,
    tags: ["glitter", "fiesta"],
    colors: ["#e8c4b0", "#d4af37"],
  },
];

export const SHAPE_LABEL: Record<Design["shape"], string> = {
  almendra: "Almendra",
  coffin: "Coffin",
  cuadrada: "Cuadrada",
  ovalada: "Ovalada",
  stiletto: "Stiletto",
};

export const LENGTH_LABEL: Record<Design["length"], string> = {
  corto: "Corto",
  medio: "Medio",
  largo: "Largo",
  xl: "XL",
};

export const FINISH_LABEL: Record<Design["finish"], string> = {
  glossy: "Glossy",
  mate: "Mate",
  cromado: "Cromado",
};

export const COMPLEXITY_LABEL: Record<Design["complexity"], string> = {
  1: "Simple",
  2: "Intermedio",
  3: "Elaborado",
  4: "Premium",
};

/** Efectos del dibujo provisorio a partir de los tags del diseño (lista blanca del placeholder). */
function placeholderFx(design: Design): string[] {
  const tags = design.tags.map((t) => t.toLowerCase());
  const has = (...words: string[]) => tags.some((t) => words.some((w) => t.includes(w)));
  const fx: string[] = [];
  if (has("animal", "leopard")) fx.push("leopard");
  if (has("personaje", "kitty")) fx.push("kitty");
  if (has("francesita", "french")) fx.push("french");
  if (has("glitter")) fx.push("glitter");
  if (has("strass")) fx.push("strass");
  if (has("cat eye")) fx.push("cateye");
  if (has("aurora")) fx.push("aurora");
  if (has("flor")) fx.push("flowers");
  if (has("3d", "moño")) fx.push("bows");
  return fx;
}

/** Versión del dibujo provisorio: subirla cuando cambie el SVG (la respuesta se cachea como inmutable). */
const PLACEHOLDER_VERSION = 2;

/**
 * Imagen `index` de un diseño (firma estable: la usan DesignCard, el detalle, el checkout y el carrito).
 * - Con fotos reales (`design.images`), siempre una foto: si no hay tantas, repite la primera. Nunca mezcla una foto
 *   con el dibujo provisorio.
 * - Sin fotos, el dibujo 4:5 de `/api/placeholder`: 0 abanico de cinco uñas, 1 macro de dos, 2 el kit de diez.
 */
export function designImage(design: Design, index = 0): string {
  if (design.images.length > 0) return design.images[index] ?? design.images[0];
  const colors = (design.colors?.length ? design.colors : ["#e8c4b0"])
    .map((c) => c.replace("#", ""))
    .join(",");
  const q = new URLSearchParams({
    seed: design.slug,
    shape: design.shape,
    len: design.length,
    colors,
    finish: design.finish,
    i: String(index),
  });
  const fx = placeholderFx(design);
  if (fx.length) q.set("fx", fx.join(","));
  q.set("v", String(PLACEHOLDER_VERSION));
  // las comas quedan legibles (URLSearchParams las codifica como %2C)
  return `/api/placeholder?${q.toString().replace(/%2C/g, ",")}`;
}

/** Todas las imágenes de la galería: las fotos reales si hay alguna; si no, las tres vistas del dibujo. */
export function designImages(design: Design): string[] {
  if (design.images.length > 0) return design.images;
  return [0, 1, 2].map((i) => designImage(design, i));
}

/** ¿Las imágenes del diseño son el dibujo provisorio? (sirve para los textos alternativos de la galería). */
export function hasRealPhotos(design: Design): boolean {
  return design.images.length > 0;
}

/* ---------- Filtros del catálogo (estado en la URL: forma, largo, estilo, orden) ---------- */

export type CatalogSort = "destacados" | "precio-asc" | "precio-desc" | "nombre";

export const SORT_LABEL: Record<CatalogSort, string> = {
  destacados: "Destacados",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
  nombre: "Nombre",
};

export type CatalogFilters = {
  forma: Design["shape"] | null;
  largo: Design["length"] | null;
  estilo: string | null;
  orden: CatalogSort;
};

export type FilterKey = "forma" | "largo" | "estilo";

export const EMPTY_FILTERS: CatalogFilters = {
  forma: null,
  largo: null,
  estilo: null,
  orden: "destacados",
};

/** Lee los filtros de la URL (lo que no se reconoce se ignora). */
export function parseCatalogFilters(params: { get(name: string): string | null }): CatalogFilters {
  const forma = params.get("forma");
  const largo = params.get("largo");
  const estilo = params.get("estilo")?.trim().toLowerCase() || null;
  const orden = params.get("orden");
  return {
    forma: forma && forma in SHAPE_LABEL ? (forma as Design["shape"]) : null,
    largo: largo && largo in LENGTH_LABEL ? (largo as Design["length"]) : null,
    estilo: estilo && estilo.length <= 40 ? estilo : null,
    orden: orden && orden in SORT_LABEL ? (orden as CatalogSort) : "destacados",
  };
}

/** Query string de los filtros (sin `?`; vacío si no hay ninguno). */
export function catalogQuery(f: CatalogFilters): string {
  const q = new URLSearchParams();
  if (f.forma) q.set("forma", f.forma);
  if (f.largo) q.set("largo", f.largo);
  if (f.estilo) q.set("estilo", f.estilo);
  if (f.orden !== "destacados") q.set("orden", f.orden);
  return q.toString();
}

/** Cuántos filtros de contenido hay puestos (el orden no cuenta). */
export function activeFilterCount(f: CatalogFilters): number {
  return Number(Boolean(f.forma)) + Number(Boolean(f.largo)) + Number(Boolean(f.estilo));
}

function matches(d: Design, f: CatalogFilters, skip?: FilterKey): boolean {
  return (
    (skip === "forma" || !f.forma || d.shape === f.forma) &&
    (skip === "largo" || !f.largo || d.length === f.largo) &&
    (skip === "estilo" || !f.estilo || d.tags.some((t) => t.toLowerCase() === f.estilo))
  );
}

/** Diseños que pasan los filtros, en el orden pedido. */
export function filterDesigns(designs: Design[], f: CatalogFilters): Design[] {
  const list = designs.filter((d) => matches(d, f));
  switch (f.orden) {
    case "precio-asc":
      return list.sort((a, b) => a.price - b.price);
    case "precio-desc":
      return list.sort((a, b) => b.price - a.price);
    case "nombre":
      return list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    default:
      // estable: los favoritos primero, el resto en el orden del catálogo
      return list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }
}

/** Cuántos diseños quedarían eligiendo `value` en `key`, con los otros filtros como están. */
export function countWith(
  designs: Design[],
  f: CatalogFilters,
  key: FilterKey,
  value: string,
): number {
  return designs.filter((d) => {
    if (!matches(d, f, key)) return false;
    if (key === "forma") return d.shape === value;
    if (key === "largo") return d.length === value;
    return d.tags.some((t) => t.toLowerCase() === value);
  }).length;
}

/**
 * Estilos para filtrar: los `limit` tags más usados (en minúscula, como se guardan) y, si el elegido no está entre
 * ellos (llegaste desde un tag del detalle), también ese.
 */
export function catalogTags(designs: Design[], limit = 10, keep?: string | null): string[] {
  const count = new Map<string, number>();
  designs.forEach((d) =>
    d.tags.forEach((t) => {
      const k = t.toLowerCase();
      count.set(k, (count.get(k) ?? 0) + 1);
    }),
  );
  const top = [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
    .map(([t]) => t)
    .slice(0, limit);
  if (keep && !top.includes(keep)) top.push(keep);
  return top;
}

/** "animal print" → "Animal print" (sentence case). */
export function tagLabel(tag: string): string {
  if (/^\d+d$/i.test(tag)) return tag.toUpperCase(); // "3d" → "3D"
  return tag ? tag[0].toUpperCase() + tag.slice(1) : tag;
}
