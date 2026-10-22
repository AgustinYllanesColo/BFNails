export type Shape = "almendra" | "coffin" | "cuadrada" | "ovalada" | "stiletto";
export type Length = "corto" | "medio" | "largo" | "xl";
export type Finish = "glossy" | "mate" | "cromado";
export type Complexity = 1 | 2 | 3 | 4;

export type Design = {
  slug: string;
  name: string;
  description: string;
  images: string[];
  shape: Shape;
  length: Length;
  finish: Finish;
  complexity: Complexity;
  price: number;
  tags: string[];
  featured?: boolean;
  active?: boolean;
  colors?: string[]; // paleta para placeholder y filtros
};

export type StandardSize = "S" | "M" | "L";

export type SizeSelection =
  | { mode: "standard"; size: StandardSize }
  | { mode: "custom"; mm: number[] } // 10 medidas, pulgar der → meñique izq
  | { mode: "kit" }; // pide kit de medición / lo resuelve por WhatsApp

/** Qué uñas son acento. Las 10 uñas se piensan por dedo: pulgar, índice, mayor, anular, meñique (en las dos manos). */
/** Lo que lleva una uña distinta del resto: su color y su lista completa de técnicas. */
export type NailDesign = { color?: string; extras?: string[] };

export type AccentMode = "ninguno" | "anular" | "anular-mayor" | "pulgar-menique" | "alternadas";

export type BuilderSelection = {
  shape: Shape;
  length: Length;
  finish: Finish;
  base: string; // id de color base
  extras: string[]; // ids de técnicas/extras
  tipColor?: string; // id de color base para la francesita de color
  detailColor?: string; // id de color base de los diseños (puntitos, ondas, cebra, estrellitas, tribal)
  /** color al que va el degradé (por defecto blanco lechoso: babyboomer) */
  degradeColor?: string;
  /**
   * Uñas acento, como arma los sets una nail artist: cuáles son, de qué color van (si no, el de la base) y qué
   * técnicas llevan solo ellas (además de las del set). "todas"/"acento" son valores viejos (carritos guardados).
   */
  accent?: AccentMode | "todas" | "acento";
  accentColor?: string;
  accentExtras?: string[];
  /**
   * Uña por uña: 10 lugares (0–4 mano derecha, 5–9 izquierda, de pulgar a meñique). null = como el resto del set.
   * Reemplaza a los acentos (que quedan para los carritos y recetas viejos).
   */
  nailDesigns?: Array<NailDesign | null>;
  /**
   * Dijes elegidos. `nails`: en qué uñas va (0–9, como `nailDesigns`); qty = uno por uña.
   * Los surtidos (florcitas, glitter, stickers) no se ubican: van sin `nails` y con la cantidad que se pida.
   */
  charms?: Array<{ id: string; qty: number; nails?: number[] }>;
  notes?: string;
  referenceUrl?: string;
};

export type QuoteLine = { id: string; label: string; amount: number };

export type Quote = {
  lines: QuoteLine[];
  complexity: Complexity;
  complexityLabel: string;
  subtotal: number;
  total: number;
  /** true si hay pedidos libres que Brenda tiene que cotizar antes de cobrar */
  needsConfirmation: boolean;
};

export type CartItem =
  | {
      id: string;
      kind: "design";
      designSlug: string;
      name: string;
      image?: string;
      unitPrice: number;
      qty: number;
      sizes: SizeSelection;
      /** forma y largo elegidos por la clienta; si faltan, son los del diseño */
      shape?: Shape;
      length?: Length;
    }
  | {
      id: string;
      kind: "custom";
      name: string;
      selection: BuilderSelection;
      quote: Quote;
      unitPrice: number;
      qty: number;
      sizes: SizeSelection;
    };

export type DeliveryMethod = "retiro" | "moto" | "correo_domicilio" | "correo_sucursal";
export type PaymentMethod = "mercadopago" | "transferencia" | "efectivo";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  mercadopago: "Mercado Pago",
  transferencia: "Transferencia",
  efectivo: "Efectivo al recibir",
};

export type OrderStatus =
  | "a_confirmar"
  | "pendiente_pago"
  | "pagado"
  | "en_produccion"
  | "listo"
  | "enviado"
  | "entregado"
  | "cancelado";

export type Customer = {
  name: string;
  whatsapp: string;
  email?: string;
};

export type Address = {
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string;
};

export type Order = {
  id: string;
  number: string; // BF-0001
  token: string; // acceso público
  status: OrderStatus;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  delivery: { method: DeliveryMethod; cost: number; label: string; address?: Address };
  payment: {
    method: PaymentMethod;
    mpPreferenceId?: string;
    mpPaymentId?: string;
    mpInitPoint?: string;
  };
  total: number;
  needsConfirmation: boolean;
  tracking?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  a_confirmar: "A confirmar",
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  en_produccion: "En producción",
  listo: "Listo",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};
