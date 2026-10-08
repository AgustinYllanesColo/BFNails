import type { ShippingOption } from "./types";

/**
 * Tabla de tarifas por zona. Brenda la actualiza desde el admin con los precios
 * que ve en el cotizador web de MiCorreo. Es el proveedor por defecto.
 */
export type ShippingZone = "caba" | "gba" | "bsas" | "interior";

export type ShippingTable = {
  pickup: { label: string; description: string };
  moto: { enabled: boolean; cost: number; description: string };
  correo: Record<ShippingZone, { domicilio: number; sucursal: number; etaDays: [number, number] }>;
  updatedAt?: string;
};

export const DEFAULT_SHIPPING_TABLE: ShippingTable = {
  pickup: {
    label: "Retiro en estación",
    description: "Lanús, Banfield o Remedios de Escalada. Coordinamos por WhatsApp.",
  },
  moto: {
    enabled: true,
    cost: 2500,
    description: "Lanús y alrededores. Te lo lleva Tomás en moto, coordinamos por WhatsApp.",
  },
  // Valores de referencia (a cargar con los reales desde el admin)
  correo: {
    caba: { domicilio: 6500, sucursal: 5200, etaDays: [2, 4] },
    gba: { domicilio: 6500, sucursal: 5200, etaDays: [2, 4] },
    bsas: { domicilio: 8200, sucursal: 6800, etaDays: [3, 6] },
    interior: { domicilio: 9900, sucursal: 8200, etaDays: [4, 8] },
  },
};

export const ZONE_LABEL: Record<ShippingZone, string> = {
  caba: "CABA",
  gba: "GBA",
  bsas: "Provincia de Buenos Aires",
  interior: "Resto del país",
};

/** Clasifica un código postal argentino (4 dígitos o CPA tipo B1824XXX) en zona. */
export function zoneForPostalCode(raw: string): ShippingZone | null {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length !== 4) return null;
  const cp = Number(digits);
  if (cp >= 1000 && cp <= 1499) return "caba";
  if (cp >= 1500 && cp <= 1999) return "gba";
  if ((cp >= 2000 && cp <= 2999) || (cp >= 6000 && cp <= 8499)) {
    // Santa Fe (2000–2999, 3000-3099 parcialmente) y Córdoba (5000) no son BsAs; simplificación:
    if (cp >= 2000 && cp <= 2999) return cp >= 2700 ? "bsas" : "interior";
    return "bsas";
  }
  return "interior";
}

export function quoteFromTable(table: ShippingTable, postalCode?: string): ShippingOption[] {
  const options: ShippingOption[] = [
    {
      method: "retiro",
      label: table.pickup.label,
      description: table.pickup.description,
      cost: 0,
    },
  ];
  if (table.moto.enabled) {
    options.push({ method: "moto", label: "Moto en zona", description: table.moto.description, cost: table.moto.cost });
  }
  const zone = postalCode ? zoneForPostalCode(postalCode) : null;
  if (zone) {
    const z = table.correo[zone];
    options.push(
      {
        method: "correo_domicilio",
        label: "Correo Argentino a domicilio",
        description: `${ZONE_LABEL[zone]} · ${z.etaDays[0]} a ${z.etaDays[1]} días hábiles`,
        cost: z.domicilio,
        etaDays: z.etaDays,
        estimated: true,
      },
      {
        method: "correo_sucursal",
        label: "Correo Argentino a sucursal",
        description: `${ZONE_LABEL[zone]} · ${z.etaDays[0]} a ${z.etaDays[1]} días hábiles`,
        cost: z.sucursal,
        etaDays: z.etaDays,
        estimated: true,
      },
    );
  }
  return options;
}
