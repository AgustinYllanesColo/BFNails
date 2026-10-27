import { describe, expect, it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { adminCreatedMail, adminPaidMail, customerCreatedMail, customerPaidMail } from "@/lib/mail-templates";
import type { Order } from "@/lib/types";
import { formatARS } from "@/lib/format";

const order: Order = {
  id: "11111111-2222-3333-4444-555555555555",
  number: "BF-0042",
  token: "tok",
  status: "pendiente_pago",
  customer: { name: "María López", whatsapp: "5491126361427", email: "maria@example.com" },
  items: [
    { id: "a", kind: "design", designSlug: "verde-oliva", name: "Verde oliva", image: "/catalog/set-verde-oliva.webp", unitPrice: 13000, qty: 1, sizes: { mode: "standard", size: "S" }, shape: "almendra", length: "medio" },
    { id: "b", kind: "charm", charmId: "estrellita-plateada", name: "Estrellita plateada", image: "/dijes/estrellita-plateada.webp", unitPrice: 1000, qty: 2 },
  ],
  subtotal: 15000,
  delivery: { method: "correo_domicilio", cost: 6500, label: "Correo Argentino a domicilio", address: { street: "Av. Siempre Viva 742", city: "Lanús", province: "Buenos Aires", postalCode: "1824" } },
  payment: { method: "transferencia" },
  total: 21500,
  needsConfirmation: false,
  createdAt: "2026-10-27T12:00:00Z",
  updatedAt: "2026-10-27T12:00:00Z",
};
const url = "https://bf-nails.vercel.app/pedido/BF-0042?t=tok";
const admin = "https://bf-nails.vercel.app/admin/pedidos/11111111-2222-3333-4444-555555555555";

describe("mails de pedido", () => {
  it("la clienta recibe su número de pedido, el resumen y qué hacer para pagar", () => {
    const m = customerCreatedMail(order, url);
    expect(m.subject).toBe("Tu pedido BF-0042 en BF Nails Studio");
    expect(m.text).toContain("brenda.fyoy");
    expect(m.html).toContain("Verde oliva");
    expect(m.html).toContain("Estrellita plateada");
    expect(m.html).toContain(formatARS(21500));
    expect(m.html).toContain("Av. Siempre Viva 742");
    expect(m.html).toContain(url);
    expect(m.html).toContain("/brand/logo-nails.png");
    expect(m.html).toContain("https://bf-nails.vercel.app/catalog/set-verde-oliva.webp");
    // nada sin escapar
    expect(m.html).not.toContain("<script");
  });

  it("el pago acreditado le avisa a la clienta y a Brenda", () => {
    const paid = { ...order, status: "pagado" as const, payment: { method: "mercadopago" as const, mpPaymentId: "123" } };
    expect(customerPaidMail(paid, url).subject).toContain("Pago confirmado");
    expect(customerPaidMail(paid, url).html).toContain("pago #123");
    expect(adminPaidMail(paid, admin).subject).toBe(`Venta confirmada BF-0042 · María López · ${formatARS(21500)}`);
    expect(adminPaidMail(paid, admin).html).toContain(admin);
  });

  it("el aviso a Brenda dice que todavía no está pago", () => {
    const m = adminCreatedMail(order, url, admin, "Va a pagar por transferencia");
    expect(m.subject).toContain("(pendiente de pago)");
    expect(m.html).toContain("todavía no está pago");
    expect(m.html).toContain("wa.me/5491126361427");
  });

  it("escapa el nombre de la clienta", () => {
    const m = customerCreatedMail({ ...order, customer: { ...order.customer, name: "<b>Mali</b>" } }, url);
    expect(m.html).not.toContain("<b>Mali</b>");
    expect(m.html).toContain("&lt;b&gt;Mali&lt;/b&gt;");
  });

  it("deja una vista previa en .preview/ (para mirarla en el navegador)", () => {
    mkdirSync(".preview", { recursive: true });
    writeFileSync(".preview/mail-clienta-pedido.html", customerCreatedMail(order, url).html);
    writeFileSync(".preview/mail-clienta-pago.html", customerPaidMail({ ...order, status: "pagado" }, url).html);
    writeFileSync(".preview/mail-brenda-pedido.html", adminCreatedMail(order, url, admin, "Va a pagar por transferencia. Cuando te mande el comprobante, marcalo como pagado en el panel").html);
    writeFileSync(".preview/mail-brenda-pago.html", adminPaidMail({ ...order, status: "pagado" }, admin).html);
  });
});
