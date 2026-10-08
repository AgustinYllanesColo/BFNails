import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SHIPPING_TABLE, quoteFromTable, zoneForPostalCode } from "@/lib/shipping/table";
import { MiCorreoProvider } from "@/lib/shipping/micorreo";

describe("zoneForPostalCode", () => {
  it("clasifica CABA, GBA, provincia e interior", () => {
    expect(zoneForPostalCode("1425")).toBe("caba");
    expect(zoneForPostalCode("C1425ABC")).toBe("caba");
    expect(zoneForPostalCode("1824")).toBe("gba"); // Lanús
    expect(zoneForPostalCode("7600")).toBe("bsas"); // Mar del Plata
    expect(zoneForPostalCode("5000")).toBe("interior"); // Córdoba
    expect(zoneForPostalCode("2000")).toBe("interior"); // Rosario
    expect(zoneForPostalCode("9410")).toBe("interior"); // Ushuaia
  });
  it("devuelve null si no es un CP válido", () => {
    expect(zoneForPostalCode("12")).toBeNull();
    expect(zoneForPostalCode("")).toBeNull();
  });
});

describe("quoteFromTable", () => {
  it("sin CP solo ofrece retiro y moto", () => {
    const opts = quoteFromTable(DEFAULT_SHIPPING_TABLE);
    expect(opts.map((o) => o.method)).toEqual(["retiro", "moto"]);
    expect(opts[0].cost).toBe(0);
  });
  it("con CP agrega correo a domicilio y sucursal marcados como estimados", () => {
    const opts = quoteFromTable(DEFAULT_SHIPPING_TABLE, "1824");
    const correo = opts.filter((o) => o.method.startsWith("correo"));
    expect(correo).toHaveLength(2);
    expect(correo.every((o) => o.estimated)).toBe(true);
    expect(correo[0].cost).toBe(DEFAULT_SHIPPING_TABLE.correo.gba.domicilio);
  });
  it("respeta moto deshabilitada", () => {
    const table = { ...DEFAULT_SHIPPING_TABLE, moto: { ...DEFAULT_SHIPPING_TABLE.moto, enabled: false } };
    expect(quoteFromTable(table).map((o) => o.method)).toEqual(["retiro"]);
  });
});

describe("MiCorreoProvider", () => {
  const env = { baseUrl: "https://api.test/micorreo/v1", user: "u", password: "p", customerId: "C1", originPostalCode: "1824" };

  function fakeFetch(calls: string[]) {
    return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      calls.push(u);
      if (u.endsWith("/token")) {
        expect(init?.headers).toMatchObject({ Authorization: `Basic ${Buffer.from("u:p").toString("base64")}` });
        return new Response(JSON.stringify({ token: "jwt123", expire: new Date(Date.now() + 3600_000).toISOString() }), { status: 200 });
      }
      if (u.endsWith("/rates")) {
        expect(init?.headers).toMatchObject({ Authorization: "Bearer jwt123" });
        const body = JSON.parse(String(init?.body));
        expect(body.postalCodeDestination).toBe("7600");
        return new Response(
          JSON.stringify({
            rates: [
              { deliveredType: "D", productName: "Paq.ar Clásico", price: 8123.4, deliveryTimeMin: "3", deliveryTimeMax: "6" },
              { deliveredType: "S", productName: "Paq.ar Clásico", price: 6900, deliveryTimeMin: "3", deliveryTimeMax: "6" },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;
  }

  it("pide token, cotiza y mapea domicilio/sucursal", async () => {
    const calls: string[] = [];
    const p = new MiCorreoProvider({ ...env, fetchImpl: fakeFetch(calls) });
    const opts = await p.quote({ postalCode: "B7600ABC" });
    expect(opts).toHaveLength(2);
    expect(opts[0]).toMatchObject({ method: "correo_domicilio", cost: 8123, estimated: false, etaDays: [3, 6] });
    expect(opts[1]).toMatchObject({ method: "correo_sucursal", cost: 6900 });
    expect(calls.filter((c) => c.endsWith("/token"))).toHaveLength(1);
  });

  it("reusa el token entre cotizaciones", async () => {
    const calls: string[] = [];
    const p = new MiCorreoProvider({ ...env, fetchImpl: fakeFetch(calls) });
    await p.quote({ postalCode: "7600" });
    await p.quote({ postalCode: "7600" });
    expect(calls.filter((c) => c.endsWith("/token"))).toHaveLength(1);
    expect(calls.filter((c) => c.endsWith("/rates"))).toHaveLength(2);
  });

  it("falla con error claro si la API responde mal", async () => {
    const bad = vi.fn(async () => new Response("nope", { status: 401 })) as unknown as typeof fetch;
    const p = new MiCorreoProvider({ ...env, fetchImpl: bad });
    await expect(p.quote({ postalCode: "7600" })).rejects.toThrow("MiCorreo token 401");
  });

  it("no se construye sin MICORREO_ENABLED", () => {
    expect(MiCorreoProvider.fromProcessEnv()).toBeNull();
  });
});
