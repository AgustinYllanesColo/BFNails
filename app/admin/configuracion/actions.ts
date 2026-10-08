"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { setSetting } from "@/lib/data/settings";
import type { ShippingTable } from "@/lib/shipping/table";

const num = z.coerce.number().int().min(0);

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const g = (k: string) => formData.get(k);
  await setSetting("basePrice", num.parse(g("basePrice")));
  await setSetting("hourlyRate", num.parse(g("hourlyRate")));
  await setSetting("targetMargin", z.coerce.number().min(0).max(95).parse(g("targetMargin")) / 100);
  await setSetting("whatsapp", z.string().trim().regex(/^\d{10,15}$/).parse(g("whatsapp")));
  await setSetting("transferAlias", z.string().trim().min(3).max(40).parse(g("transferAlias")));
  await setSetting("transferHolder", z.string().trim().min(2).max(80).parse(g("transferHolder")));

  const zones = ["caba", "gba", "bsas", "interior"] as const;
  const shipping: ShippingTable = {
    pickup: { label: "Retiro en estación", description: z.string().trim().max(200).parse(g("pickupDescription")) },
    moto: { enabled: g("motoEnabled") === "on", cost: num.parse(g("motoCost")), description: z.string().trim().max(200).parse(g("motoDescription")) },
    correo: Object.fromEntries(
      zones.map((z) => [z, { domicilio: num.parse(g(`${z}:domicilio`)), sucursal: num.parse(g(`${z}:sucursal`)), etaDays: [num.parse(g(`${z}:etaMin`)), num.parse(g(`${z}:etaMax`))] as [number, number] }]),
    ) as ShippingTable["correo"],
    updatedAt: new Date().toISOString(),
  };
  await setSetting("shipping", shipping);
  revalidatePath("/", "layout");
}
