import { z } from "zod";
import { MAKEUP_CATEGORIES, MAKEUP_FORMS, normalizeMedia, normalizeShades, type MakeupCategory } from "@/lib/data/makeup";

/** Campo vacío del formulario = sin definir (no 0). */
const blank = (v: unknown) => (v === "" || v == null ? undefined : v);
const optInt = (max: number) => z.preprocess(blank, z.coerce.number().int().min(0).max(max).optional());
const optStr = (max: number) => z.preprocess(blank, z.string().trim().max(max).optional());

/** Límites del formulario de maquillaje (los inputs del admin usan los mismos). */
export const MAKEUP_LIMITS = { name: 80, brand: 60, description: 200, details: 600, price: 1_000_000, stock: 9999 } as const;

const makeupSchema = z
  .object({
    id: optStr(80),
    name: z.string().trim().min(2).max(MAKEUP_LIMITS.name),
    brand: optStr(MAKEUP_LIMITS.brand),
    description: optStr(MAKEUP_LIMITS.description),
    details: optStr(MAKEUP_LIMITS.details),
    // fotos y videos ya subidos, uno por línea y en orden (los manda el uploader del admin)
    media: z.preprocess((v) => normalizeMedia(typeof v === "string" ? v.split("\n") : []).media, z.array(z.string()).optional()),
    category: z.enum(MAKEUP_CATEGORIES.map((c) => c.id) as [MakeupCategory, ...MakeupCategory[]]),
    form: z.preprocess(blank, z.enum(MAKEUP_FORMS).optional()),
    price: z.coerce.number().int().min(0).max(MAKEUP_LIMITS.price),
    priceBefore: optInt(MAKEUP_LIMITS.price),
    stock: optInt(MAKEUP_LIMITS.stock),
    // va a un `style`: solo un color hex
    hex: z.preprocess(blank, z.string().regex(/^#[0-9a-fA-F]{6}$/).optional()),
    // separados por coma: "02, 04, 06"
    shades: z.preprocess((v) => normalizeShades(v), z.array(z.string()).optional()),
  })
  // un "precio antes" que no es mayor al precio no es una oferta: se descarta
  .transform((d) => ({ ...d, priceBefore: d.priceBefore != null && d.priceBefore > d.price ? d.priceBefore : undefined }));

export type MakeupFormData = z.infer<typeof makeupSchema>;

export function parseMakeupForm(formData: FormData) {
  return makeupSchema.safeParse(Object.fromEntries(formData.entries()));
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

/** Valida una foto subida desde el admin. Devuelve el error o null. (SVG/HTML no: el bucket es público.) */
export function validateImageFile(file: Pick<File, "type" | "size">): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "Formato de foto no admitido: usá JPG, PNG, WebP o AVIF.";
  if (file.size > IMAGE_MAX_BYTES) return "La foto pesa más de 8 MB.";
  return null;
}
