import type { DeliveryMethod } from "@/lib/types";

export type ShippingOption = {
  method: DeliveryMethod;
  label: string;
  description: string;
  cost: number;
  etaDays?: [number, number];
  estimated?: boolean; // true si viene de la tabla y no de una cotización en vivo
  from?: boolean; // precio "desde": el final lo confirma Brenda (moto según barrio)
};

export type QuoteInput = {
  postalCode?: string;
  weightGrams?: number; // peso del paquete; un kit pesa ~60 g
};

export interface ShippingProvider {
  quote(input: QuoteInput): Promise<ShippingOption[]>;
}
