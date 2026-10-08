import "server-only";
import type { QuoteInput, ShippingOption } from "./types";
import { quoteFromTable } from "./table";
import { MiCorreoProvider } from "./micorreo";
import { getSettings } from "@/lib/data/settings";

let micorreo: MiCorreoProvider | null | undefined;

/**
 * Cotiza las opciones de entrega. Retiro y moto siempre salen de la tabla.
 * Correo: MiCorreo en vivo si está activado y responde; si no, la tabla por zona.
 */
export async function quoteShipping(input: QuoteInput): Promise<ShippingOption[]> {
  const s = await getSettings();
  const fromTable = quoteFromTable(s.shipping, input.postalCode);
  if (micorreo === undefined) micorreo = MiCorreoProvider.fromProcessEnv();
  if (!micorreo || !input.postalCode) return fromTable;
  try {
    const live = await micorreo.quote(input);
    if (live.length === 0) return fromTable;
    return [...fromTable.filter((o) => !o.method.startsWith("correo")), ...live];
  } catch (err) {
    console.warn("[shipping] MiCorreo falló, uso tabla:", (err as Error).message);
    return fromTable;
  }
}

export type { ShippingOption };
