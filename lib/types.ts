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

export type StandardSize = "XS" | "S" | "M" | "L";

export type SizeSelection =
  | { mode: "standard"; size: StandardSize }
  | { mode: "custom"; mm: number[] } // 10 medidas, pulgar der → meñique izq
  | { mode: "kit" }; // pide kit de medición / lo resuelve por WhatsApp

export type BuilderSelection = {
  shape: Shape;
  length: Length;
  finish: Finish;
  base: string; // id de color base
  extras: string[]; // ids de técnicas/extras
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
  payment: { method: PaymentMethod; mpPreferenceId?: string; mpPaymentId?: string; mpInitPoint?: string };
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
