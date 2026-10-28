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
    description: "Remedios de Escalada, Lanús o Banfield. Coordinamos por WhatsApp.",
  },
  moto: {
    enabled: true,
    cost: 3500,
    description: "Escalada, Lomas, Banfield y Lanús. De $3.500 a $4.500 según la zona; te lo confirmo por WhatsApp.",
  },
  // Tarifas de lista de MiCorreo, Paquete Clásico hasta 500 g (caja 20×15×8), consultadas el 28/10/2026 desde CP 1826.
  // CABA, GBA y provincia pagan lo mismo; "interior" toma lo más caro (Salta/Ushuaia: $7.357 / $10.396) para no cobrar
  // de menos (Rosario y Córdoba en realidad salen como Buenos Aires, Mendoza y Neuquén $7.118 / $10.335).
  correo: {
    caba: { domicilio: 9500, sucursal: 6500, etaDays: [2, 5] },
    gba: { domicilio: 9500, sucursal: 6500, etaDays: [2, 5] },
    bsas: { domicilio: 9500, sucursal: 6500, etaDays: [2, 5] },
    interior: { domicilio: 10400, sucursal: 7400, etaDays: [3, 7] },
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
  // Provincia de Buenos Aires. Quedan afuera los rangos vecinos de otras provincias: 2000–2699 (Santa Fe, Córdoba),
  // 6100–6399 (sur de Santa Fe y Córdoba, La Pampa) y 8200 en adelante (La Pampa, Neuquén, Río Negro).
  const bsas: [number, number][] = [
    [2700, 2999],
    [6000, 6099],
    [6400, 6799],
    [7000, 7699],
    [8000, 8199],
  ];
  if (bsas.some(([a, b]) => cp >= a && cp <= b)) return "bsas";
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
    options.push({ method: "moto", label: "Moto en zona", description: table.moto.description, cost: table.moto.cost, from: true });
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
