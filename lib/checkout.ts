import { z } from "zod";

export const sizeSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("standard"), size: z.enum(["XS", "S", "M", "L"]) }),
  z.object({ mode: z.literal("custom"), mm: z.array(z.number().min(5).max(25)).length(10) }),
  z.object({ mode: z.literal("kit") }),
]);

export const selectionSchema = z.object({
  shape: z.enum(["almendra", "coffin", "cuadrada", "ovalada", "stiletto"]),
  length: z.enum(["corto", "medio", "largo", "xl"]),
  finish: z.enum(["glossy", "mate", "cromado"]),
  base: z.string().min(1).max(40),
  extras: z.array(z.string().max(40)).max(20),
  tipColor: z.string().max(40).optional(),
  notes: z.string().max(600).optional(),
  referenceUrl: z.string().max(500).optional(),
});

export const cartItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("design"),
    designSlug: z.string().min(1).max(80),
    qty: z.number().int().min(1).max(10),
    sizes: sizeSchema,
  }),
  z.object({
    kind: z.literal("custom"),
    selection: selectionSchema,
    qty: z.number().int().min(1).max(10),
    sizes: sizeSchema,
  }),
]);

export const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Decinos tu nombre").max(80),
    whatsapp: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{8,20}$/, "Un número de WhatsApp válido, con característica"),
    email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  }),
  delivery: z.object({
    method: z.enum(["retiro", "moto", "correo_domicilio", "correo_sucursal"]),
    address: z
      .object({
        street: z.string().trim().max(160).optional(),
        city: z.string().trim().max(80).optional(),
        province: z.string().trim().max(80).optional(),
        postalCode: z.string().trim().max(8).optional(),
        notes: z.string().trim().max(300).optional(),
      })
      .optional(),
  }),
  payment: z.object({ method: z.enum(["mercadopago", "transferencia", "efectivo"]) }),
  items: z.array(cartItemSchema).min(1, "El carrito está vacío").max(20),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Normaliza un WhatsApp argentino a formato wa.me (549 + área + número). */
export function normalizeWhatsapp(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  // quita el 15 después de la característica (ej. 11 15 xxxx-xxxx)
  d = d.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");
  return `549${d}`;
}
