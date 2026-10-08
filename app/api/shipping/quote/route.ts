import { NextResponse } from "next/server";
import { z } from "zod";
import { quoteShipping } from "@/lib/shipping";

const schema = z.object({
  postalCode: z.string().trim().min(4).max(8).optional(),
  weightGrams: z.number().int().positive().max(5000).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const options = await quoteShipping(parsed.data);
  return NextResponse.json({ options });
}
