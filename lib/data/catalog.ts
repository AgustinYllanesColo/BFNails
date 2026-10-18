import type { Design } from "@/lib/types";

/**
 * Seed del catálogo con las fotos reales de Bren (public/catalog, recortadas a 4:5). Cuando hay DB, esto es el
 * seed inicial y la fuente de verdad pasa a ser la tabla `designs`. Los precios van de $13.500 a $23.000 y
 * son orientativos hasta que Bren los confirme desde el admin.
 */
export const SEED_DESIGNS: Design[] = [
  {
    slug: "pink-babyboomer",
    name: "Pink babyboomer",
    description: "Degradé de rosa a blanco con un brillo suave. Almendra larga, delicada y para todos los días.",
    images: ["/catalog/set-pink-babyboomer.webp"],
    shape: "almendra",
    length: "largo",
    finish: "glossy",
    complexity: 2,
    price: 17000,
    tags: ["degradé", "glitter"],
    colors: ["#f2b8c0", "#ffffff"],
  },
  {
    slug: "pink-wave",
    name: "Pink wave",
    description: "Rosa con ondas fucsia con glitter y strass. Cuadrada XL, bien Barbie.",
    images: ["/catalog/set-pink-wave.webp", "/catalog/set-pink-wave-2.webp"],
    shape: "cuadrada",
    length: "xl",
    finish: "glossy",
    complexity: 3,
    price: 21000,
    tags: ["glitter", "strass", "dibujo a mano"],
    colors: ["#f4a6c6", "#e0408a"],
  },
  {
    slug: "milky-star",
    name: "Milky star",
    description: "Milky perlado con una estrella dorada y puntitos en un acento. Almendra larga.",
    images: ["/catalog/set-milky-star.webp"],
    shape: "almendra",
    length: "largo",
    finish: "glossy",
    complexity: 2,
    price: 16500,
    tags: ["milky", "charms"],
    colors: ["#eef1f2", "#d4af37"],
  },
  {
    slug: "leo-cherry",
    name: "Leo & cherry",
    description:
      "Leopardo pintado a mano en el anular y el mayor, y el resto en rojo cereza glossy. El set de la casa.",
    images: ["/catalog/set-leopard-red.webp"],
    shape: "almendra",
    length: "medio",
    finish: "glossy",
    complexity: 3,
    price: 19500,
    tags: ["animal print", "rojo", "signature"],
    featured: true,
    colors: ["#c9a063", "#b51c1c"],
  },
  {
    slug: "sunset-french",
    name: "Sunset french",
    description:
      "Francesita amarilla con degradé naranja y rosa en los acentos. Verano en las manos.",
    images: ["/catalog/set-sunset-french.webp"],
    shape: "almendra",
    length: "medio",
    finish: "glossy",
    complexity: 2,
    price: 17500,
    tags: ["francesita", "degradé"],
    featured: true,
    colors: ["#f5c400", "#f2a7c3"],
  },
  {
    slug: "bordo-cat-eye",
    name: "Bordó cat eye",
    description:
      "Bordó profundo con efecto cat eye que cambia con la luz. Elegante y con mucha presencia.",
    images: ["/catalog/set-bordo-cat-eye.webp"],
    shape: "almendra",
    length: "largo",
    finish: "glossy",
    complexity: 2,
    price: 18000,
    tags: ["cat eye", "bordó"],
    featured: true,
    colors: ["#4a0e0e", "#8c1610"],
  },
  {
    slug: "leo-star-gold",
    name: "Leo star gold",
    description:
      "Leopardo, estrellas rosas, francesita con strass dorado y una cruz como dije. Cuadrada XL para que luzca.",
    images: ["/catalog/set-leopard-gold.webp", "/catalog/detalle-cruz-dorada.webp"],
    shape: "cuadrada",
    length: "xl",
    finish: "glossy",
    complexity: 4,
    price: 23000,
    tags: ["animal print", "strass", "charms", "francesita"],
    featured: true,
    colors: ["#e2c29b", "#f2a7c3", "#d4af37"],
  },
  {
    slug: "tribal-french",
    name: "Tribal french",
    description:
      "Francesita blanca con tribal negro dibujado a mano y strass plateado. Cuadrada XL.",
    images: ["/catalog/set-tribal-french.webp"],
    shape: "cuadrada",
    length: "xl",
    finish: "glossy",
    complexity: 3,
    price: 22000,
    tags: ["francesita", "dibujo a mano", "strass"],
    colors: ["#fffdf8", "#1d1d1d"],
  },
  {
    slug: "black-french",
    name: "Black french",
    description: "Francesita negra con aros cortos y un strass en cada uña. Cuadrada XL, muy fina.",
    images: ["/catalog/set-black-french-strass.webp"],
    shape: "cuadrada",
    length: "xl",
    finish: "glossy",
    complexity: 3,
    price: 21000,
    tags: ["francesita", "negro", "strass"],
    colors: ["#1d1d1d", "#e8c4b0"],
  },
  {
    slug: "pink-zebra",
    name: "Pink zebra",
    description: "Rosa con shimmer y cebra roja pintada a mano. Almendra larga.",
    images: ["/catalog/set-pink-zebra.webp"],
    shape: "almendra",
    length: "largo",
    finish: "glossy",
    complexity: 3,
    price: 18500,
    tags: ["animal print", "rosa", "dibujo a mano"],
    colors: ["#f2a7c3", "#b51c1c"],
  },
  {
    slug: "candy-gems",
    name: "Candy gems",
    description: "Francesita blanca con gemas de colores en las puntas. Divertida y liviana.",
    images: ["/catalog/set-gems-french.webp"],
    shape: "almendra",
    length: "medio",
    finish: "glossy",
    complexity: 2,
    price: 17000,
    tags: ["francesita", "strass"],
    colors: ["#ffffff", "#a8d5f2"],
  },
  {
    slug: "sunset-aurora",
    name: "Sunset aurora",
    description: "Degradé naranja y rosa con efecto aurora. Almendra media, para todos los días.",
    images: ["/catalog/set-sunset-aurora-street.webp"],
    shape: "almendra",
    length: "corto",
    finish: "glossy",
    complexity: 2,
    price: 17000,
    tags: ["aurora", "degradé"],
    colors: ["#f2a7c3", "#f5c400"],
  },
  {
    slug: "milky-pearl",
    name: "Milky pearl",
    description: "Milky translúcido en stiletto con perlas en un acento. Minimal con un detalle.",
    images: ["/catalog/set-milky-stiletto.webp"],
    shape: "stiletto",
    length: "largo",
    finish: "glossy",
    complexity: 2,
    price: 16500,
    tags: ["milky", "3D"],
    colors: ["#f6efe6"],
  },
  {
    slug: "milky-gold",
    name: "Milky gold",
    description:
      "Milky con francesita, foil dorado encapsulado y strass. Almendra corta, cómoda para todos los días.",
    images: ["/catalog/set-milky-gold-foil.webp"],
    shape: "almendra",
    length: "corto",
    finish: "glossy",
    complexity: 2,
    price: 16000,
    tags: ["milky", "francesita", "encapsulado"],
    colors: ["#f6efe6", "#d4af37"],
  },
  {
    slug: "babyboomer",
    name: "Babyboomer",
    description: "Degradé rosa a blanco con strass en un acento. Cuadrada media, clásica.",
    images: ["/catalog/set-babyboomer-strass.webp"],
    shape: "cuadrada",
    length: "corto",
    finish: "glossy",
    complexity: 2,
    price: 14500,
    tags: ["degradé", "strass"],
    colors: ["#f2a7c3", "#ffffff"],
  },
  {
    slug: "gold-glitter",
    name: "Gold glitter",
    description: "Dorado glitter full. Simple, brillante y lista para salir.",
    images: ["/catalog/set-gold-glitter.webp"],
    shape: "cuadrada",
    length: "medio",
    finish: "glossy",
    complexity: 1,
    price: 13500,
    tags: ["glitter", "dorado"],
    colors: ["#d4af37"],
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

/** Sets hechos en medidas universales que ya están listos (tag "stock" desde el admin). */
export function inStock(design: Pick<Design, "tags">): boolean {
  return design.tags.some((t) => t.toLowerCase() === "stock");
}

export const COMPLEXITY_LABEL: Record<Design["complexity"], string> = {
  1: "Simple",
  2: "Intermedio",
  3: "Elaborado",
  4: "Premium",
};

export function designImage(design: Design, index = 0): string {
  if (design.images[index]) return design.images[index];
  if (design.images[0]) return design.images[0];
  const colors = (design.colors ?? ["#e8c4b0"]).map((c) => c.replace("#", "")).join(",");
  return `/api/placeholder?seed=${encodeURIComponent(design.slug)}&shape=${design.shape}&colors=${colors}&i=${index}`;
}
