import type { QuoteInput, ShippingOption, ShippingProvider } from "./types";

/**
 * Adaptador de la API MiCorreo (Correo Argentino). Flujo: POST /token con
 * Basic auth (usuario:clave) → JWT; POST /rates con customerId, CP origen/destino
 * y dimensiones → tarifas a domicilio (D) y sucursal (S).
 *
 * Se activa con MICORREO_ENABLED=true y credenciales. Si falla, el llamador cae
 * a la tabla por zona. Las credenciales se piden a Correo Argentino; hasta
 * tenerlas este módulo queda probado contra respuestas grabadas (tests/unit).
 */
export type MiCorreoEnv = {
  baseUrl: string;
  user: string;
  password: string;
  /** Id de cliente MiCorreo. Si falta, se obtiene una vez con `account` vía POST /users/validate. */
  customerId?: string;
  /** Email y clave de la cuenta MiCorreo (la del sitio), para obtener el customerId. */
  account?: { email: string; password: string };
  originPostalCode: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

type RateResponse = {
  rates?: Array<{
    deliveredType: "D" | "S";
    productType?: string;
    productName?: string;
    price: number;
    deliveryTimeMin?: string | number;
    deliveryTimeMax?: string | number;
  }>;
};

export class MiCorreoProvider implements ShippingProvider {
  private token: { value: string; exp: number } | null = null;
  constructor(private env: MiCorreoEnv) {}

  static fromProcessEnv(): MiCorreoProvider | null {
    if (process.env.MICORREO_ENABLED !== "true") return null;
    const { MICORREO_BASE_URL, MICORREO_USER, MICORREO_PASSWORD, MICORREO_CUSTOMER_ID, MICORREO_ACCOUNT_EMAIL, MICORREO_ACCOUNT_PASSWORD, MICORREO_ORIGIN_POSTAL_CODE } = process.env;
    if (!MICORREO_USER || !MICORREO_PASSWORD) return null;
    if (!MICORREO_CUSTOMER_ID && !(MICORREO_ACCOUNT_EMAIL && MICORREO_ACCOUNT_PASSWORD)) return null;
    return new MiCorreoProvider({
      baseUrl: MICORREO_BASE_URL ?? "https://api.correoargentino.com.ar/micorreo/v1",
      user: MICORREO_USER,
      password: MICORREO_PASSWORD,
      customerId: MICORREO_CUSTOMER_ID,
      account: MICORREO_ACCOUNT_EMAIL && MICORREO_ACCOUNT_PASSWORD ? { email: MICORREO_ACCOUNT_EMAIL, password: MICORREO_ACCOUNT_PASSWORD } : undefined,
      originPostalCode: MICORREO_ORIGIN_POSTAL_CODE ?? "1824",
    });
  }

  private get fetch() {
    return this.env.fetchImpl ?? fetch;
  }

  private async getToken(): Promise<string> {
    const now = (this.env.now ?? Date.now)();
    if (this.token && this.token.exp > now + 60_000) return this.token.value;
    const basic = Buffer.from(`${this.env.user}:${this.env.password}`).toString("base64");
    const res = await this.fetch(`${this.env.baseUrl}/token`, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`MiCorreo token ${res.status}`);
    const data = (await res.json()) as { token: string; expire?: string };
    const exp = data.expire ? Date.parse(data.expire) : now + 2 * 60 * 60 * 1000;
    this.token = { value: data.token, exp };
    return data.token;
  }

  /** customerId: el configurado o, la primera vez, el que devuelve /users/validate para la cuenta MiCorreo. */
  private async getCustomerId(token: string): Promise<string> {
    if (this.env.customerId) return this.env.customerId;
    if (!this.env.account) throw new Error("MiCorreo: falta customerId o la cuenta para obtenerlo");
    const res = await this.fetch(`${this.env.baseUrl}/users/validate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.env.account.email, password: this.env.account.password }),
    });
    if (!res.ok) throw new Error(`MiCorreo users/validate ${res.status}`);
    const data = (await res.json()) as { customerId?: string };
    if (!data.customerId) throw new Error("MiCorreo: users/validate no devolvió customerId");
    this.env.customerId = data.customerId;
    return data.customerId;
  }

  async quote(input: QuoteInput): Promise<ShippingOption[]> {
    if (!input.postalCode) return [];
    const token = await this.getToken();
    const body = {
      customerId: await this.getCustomerId(token),
      postalCodeOrigin: this.env.originPostalCode,
      postalCodeDestination: input.postalCode.replace(/\D/g, "").slice(0, 4),
      deliveredType: "D",
      dimensions: { weight: input.weightGrams ?? 100, height: 5, width: 15, length: 20 },
    };
    const res = await this.fetch(`${this.env.baseUrl}/rates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`MiCorreo rates ${res.status}`);
    const data = (await res.json()) as RateResponse;
    const options: ShippingOption[] = [];
    for (const r of data.rates ?? []) {
      const min = Number(r.deliveryTimeMin ?? 0);
      const max = Number(r.deliveryTimeMax ?? 0);
      const eta = min && max ? (`${min} a ${max} días hábiles` as const) : "";
      options.push({
        method: r.deliveredType === "S" ? "correo_sucursal" : "correo_domicilio",
        label: r.deliveredType === "S" ? "Correo Argentino a sucursal" : "Correo Argentino a domicilio",
        description: [r.productName, eta].filter(Boolean).join(" · "),
        cost: Math.round(r.price),
        etaDays: min && max ? [min, max] : undefined,
        estimated: false,
      });
    }
    return options;
  }
}
