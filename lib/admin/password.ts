import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Acceso al panel con clave (ADMIN_PASSWORD), además del link mágico por mail. La cookie lleva un HMAC derivado de
 * la clave: cambiar la clave cierra todas las sesiones. Sin ADMIN_PASSWORD, esta vía queda apagada.
 */
export const ADMIN_COOKIE = "bf_admin";
const DAYS = 30;

export function passwordLoginEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(exp: number): string {
  return createHmac("sha256", `bf-admin:${process.env.ADMIN_PASSWORD}`).update(String(exp)).digest("base64url");
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return expected.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

/** Valor de cookie "exp.firma", válido por 30 días. */
export function issueToken(): { value: string; maxAge: number } {
  const exp = Date.now() + DAYS * 24 * 60 * 60 * 1000;
  return { value: `${exp}.${sign(exp)}`, maxAge: DAYS * 24 * 60 * 60 };
}

export function verifyToken(value: string | undefined): boolean {
  if (!value || !passwordLoginEnabled()) return false;
  const [expStr, sig] = value.split(".");
  const exp = Number(expStr);
  if (!exp || exp < Date.now() || !sig) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  return a.length === b.length && timingSafeEqual(a, b);
}
