import { describe, expect, it } from "vitest";
import {
  cartWhatsAppMessage,
  customLabels,
  describeSizes,
  orderConfirmationMessage,
  transferInsteadMessage,
  waLink,
} from "@/lib/whatsapp";
import { normalizeWhatsapp } from "@/lib/checkout";
import { formatARS } from "@/lib/format";
import type { Order } from "@/lib/types";

const order: Order = {
  id: "x",
  number: "BF-0007",
  token: "tok",
  status: "pendiente_pago",
  customer: { name: "Mica Pérez", whatsapp: "5491155551234" },
  items: [
    { id: "a", kind: "design", designSlug: "cherry-red", name: "Cherry Red", unitPrice: 12000, qty: 2, sizes: { mode: "standard", size: "M" } },
    {
      id: "b",
      kind: "custom",
      name: "Set a medida",
      selection: { shape: "coffin", length: "largo", finish: "glossy", base: "nude", extras: ["glitter"], notes: "una K" },
      quote: { lines: [], complexity: 1, complexityLabel: "Simple", subtotal: 13200, total: 13200, needsConfirmation: true },
      unitPrice: 13200,
      qty: 1,
      sizes: { mode: "custom", mm: [17, 13, 14, 13, 11, 17, 13, 14, 13, 11] },
    },
  ],
  subtotal: 37200,
  delivery: { method: "retiro", cost: 0, label: "Retiro en estación" },
  payment: { method: "transferencia" },
  total: 37200,
  needsConfirmation: true,
  createdAt: "2026-10-08T00:00:00Z",
  updatedAt: "2026-10-08T00:00:00Z",
};

describe("waLink", () => {
  it("arma el link con el número limpio y el texto codificado", () => {
    const link = waLink("Hola Bren! ¿todo bien?", "+54 9 11 5555-1234");
    expect(link.startsWith("https://wa.me/5491155551234?text=")).toBe(true);
    expect(decodeURIComponent(link.split("text=")[1])).toBe("Hola Bren! ¿todo bien?");
  });
});

describe("orderConfirmationMessage", () => {
  it("incluye número, items, talles, total, pago y link", () => {
    const msg = orderConfirmationMessage(order, "https://bf.test/pedido/BF-0007?t=tok");
    expect(msg).toContain("*BF-0007*");
    expect(msg).toContain("Cherry Red x2 (Talle M)");
    expect(msg).toContain("Medidas (mm): 17 · 13");
    expect(msg).toContain("Nota: una K");
    expect(msg).toContain("(a confirmar)");
    expect(msg).toContain(`Total: *${formatARS(37200)}*`);
    expect(msg).toContain("alias");
    expect(msg).toContain("https://bf.test/pedido/BF-0007?t=tok");
    expect(msg).toContain("me confirmás el precio final");
  });
});

describe("orderConfirmationMessage con la configuración", () => {
  it("usa el alias y el titular de settings, no los del sitio", () => {
    const msg = orderConfirmationMessage(order, "https://bf.test/p", { alias: "bren.unas.mp", holder: "Brenda F." });
    expect(msg).toContain("alias bren.unas.mp (Brenda F.)");
  });
});

describe("cartWhatsAppMessage", () => {
  const base = {
    name: "Mica Pérez",
    whatsapp: "11 5555 1234",
    payment: "transferencia" as const,
    total: 37200,
    needsConfirmation: false,
  };

  it("lleva cada set con talle y precio, la entrega, el pago, el total y quién lo pide", () => {
    const msg = cartWhatsAppMessage(order.items, { ...base, delivery: { label: "Retiro en estación", cost: 0 } });
    expect(msg).toContain("Cherry Red x2 (Talle M)");
    expect(msg).toContain("Tu diseño x1 (Medidas (mm): 17 · 13");
    expect(msg).toContain("Coffin · Largo · Glossy · Nude · Glitter");
    expect(msg).toContain("Nota: una K");
    expect(msg).toContain("Entrega: Retiro en estación (sin costo)");
    expect(msg).toContain("Pago: Transferencia");
    expect(msg).toContain(`Total: *${formatARS(37200)}*`);
    expect(msg).toContain("Soy Mica Pérez · WhatsApp 11 5555 1234.");
    expect(msg).not.toMatch(/[—–]/);
  });

  it("con moto 'desde' y dirección, el total pasa a 'desde' y se pide confirmación", () => {
    const msg = cartWhatsAppMessage(order.items, {
      ...base,
      payment: "efectivo",
      total: 39700,
      needsConfirmation: true,
      delivery: { label: "Moto en zona", cost: 2500, from: true },
      address: { street: "Av. Hipólito Yrigoyen 4200", city: "Lanús", notes: "timbre 2" },
    });
    expect(msg).toContain(`Entrega: Moto en zona (desde ${formatARS(2500)}, a confirmar)`);
    expect(msg).toContain("Dirección: Av. Hipólito Yrigoyen 4200, Lanús (timbre 2)");
    expect(msg).toContain("Pago: Efectivo al recibir");
    expect(msg).toContain(`Total desde: *${formatARS(39700)}*`);
    expect(msg).toContain("me confirmás el precio final");
  });

  it("sin cotización del correo, el envío queda a confirmar", () => {
    const msg = cartWhatsAppMessage(order.items, { ...base, delivery: { label: "Correo Argentino", cost: null } });
    expect(msg).toContain("Entrega: Correo Argentino (costo a confirmar)");
    expect(msg).toContain("Total desde:");
  });

  it("el link de wa.me lleva el mensaje entero", () => {
    const msg = cartWhatsAppMessage(order.items, { ...base, delivery: { label: "Retiro en estación", cost: 0 } });
    const link = waLink(msg, "5491100000000");
    expect(decodeURIComponent(link.split("text=")[1])).toBe(msg);
  });
});

describe("customLabels", () => {
  it("traduce los ids del armador a etiquetas y nombra la punta de la francesita de color", () => {
    expect(
      customLabels({ shape: "coffin", length: "largo", finish: "cromado", base: "bordo", extras: ["francesita-color", "strass"], tipColor: "rosa" }),
    ).toEqual(["Coffin", "Largo", "Cromado", "Bordó", "Francesita de color (punta rosa)", "Strass (hasta 10)"]);
  });
});

describe("transferInsteadMessage", () => {
  it("pide pagar por transferencia con el número del pedido", () => {
    expect(transferInsteadMessage(order, "https://bf.test/p")).toContain("Quiero pagar el pedido *BF-0007* por transferencia");
  });
});

describe("describeSizes", () => {
  it("describe los tres modos", () => {
    expect(describeSizes({ mode: "standard", size: "L" })).toBe("Talle L");
    expect(describeSizes({ mode: "kit" })).toMatch(/WhatsApp/);
  });
});

describe("normalizeWhatsapp", () => {
  it("normaliza formatos argentinos a 549...", () => {
    expect(normalizeWhatsapp("11 5555 1234")).toBe("5491155551234");
    expect(normalizeWhatsapp("011 15 5555 1234")).toBe("5491155551234");
    expect(normalizeWhatsapp("+54 9 11 5555-1234")).toBe("5491155551234");
    expect(normalizeWhatsapp("54 11 5555 1234")).toBe("5491155551234");
    expect(normalizeWhatsapp("0221 15 444 5555")).toBe("5492214445555");
  });
});
