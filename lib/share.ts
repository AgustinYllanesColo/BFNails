import type { BuilderSelection } from "./types";
import { selectionSchema } from "./checkout";
import { siteConfig } from "./site";

/**
 * Link que reproduce un set a medida en el armador (`/disena?s=…`): la selección completa, en base64url. Sirve para
 * que Brenda vea en 3D exactamente lo que armó la clienta (va en el mensaje de WhatsApp y en el pedido), y para
 * compartir un diseño. Las notas y la referencia no viajan: están en el pedido.
 */
function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSelection(sel: BuilderSelection): string {
  const rest = { ...sel };
  delete rest.notes;
  delete rest.referenceUrl;
  // sin claves vacías, para que el link sea corto
  const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)));
  return toBase64Url(JSON.stringify(clean));
}

/** Selección a partir del parámetro `s`; null si no es válida. */
export function decodeSelection(s: string | null | undefined): BuilderSelection | null {
  if (!s || s.length > 4000) return null;
  try {
    const parsed = selectionSchema.safeParse(JSON.parse(fromBase64Url(s)));
    return parsed.success ? (parsed.data as BuilderSelection) : null;
  } catch {
    return null;
  }
}

/** URL absoluta del armador con el set cargado. */
export function builderLink(sel: BuilderSelection, base: string = siteConfig.url): string {
  return `${base}/disena?s=${encodeSelection(sel)}`;
}
